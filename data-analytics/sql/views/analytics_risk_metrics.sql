-- Live risk inputs: legacy results and service-specific captured values.
-- Preserve approved thresholds; use the latest available value per indicator.
create or replace view public.analytics_risk_metrics
with (security_invoker = true) as
with captured_measurements as (
    select s.organisation_id, s.participant_reference, s.id, s.captured_at,
        coalesce(fv.systolic_mmhg, nullif(sr.systolic_mmhg, 0)) as systolic_mmhg,
        coalesce(fv.diastolic_mmhg, nullif(sr.diastolic_mmhg, 0)) as diastolic_mmhg,
        coalesce(fv.glucose_mmol_l, nullif(sr.glucose_mmol_l, 0)) as glucose_mmol_l,
        coalesce(fv.cholesterol_mmol_l, nullif(sr.cholesterol_mmol_l, 0)) as cholesterol_mmol_l,
        coalesce(fv.bmi, nullif(sr.bmi, 0)) as bmi,
        coalesce(fv.height_cm, nullif(sr.height_cm, 0)) as height_cm,
        coalesce(fv.weight_kg, nullif(sr.weight_kg, 0)) as weight_kg
    from public.screenings s
    left join public.screening_results sr on sr.screening_id = s.id
    left join lateral (
        select coalesce(max(v.value_number) filter (where f.code = 'SYSTOLIC'), max(v.value_number) filter (where f.code = 'LEGACY_SYSTOLIC')) as systolic_mmhg,
        coalesce(max(v.value_number) filter (where f.code = 'DIASTOLIC'), max(v.value_number) filter (where f.code = 'LEGACY_DIASTOLIC')) as diastolic_mmhg,
        coalesce(max(v.value_number) filter (where f.code = 'GLUCOSE'), max(v.value_number) filter (where f.code = 'LEGACY_GLUCOSE')) as glucose_mmol_l,
        coalesce(max(v.value_number) filter (where f.code = 'CHOLESTEROL'), max(v.value_number) filter (where f.code = 'LEGACY_CHOLESTEROL')) as cholesterol_mmol_l,
        coalesce(max(v.value_number) filter (where f.code = 'BMI'), max(v.value_number) filter (where f.code = 'LEGACY_BMI')) as bmi,
        coalesce(max(v.value_number) filter (where f.code = 'HEIGHT'), max(v.value_number) filter (where f.code = 'LEGACY_HEIGHT')) as height_cm,
        coalesce(max(v.value_number) filter (where f.code = 'WEIGHT'), max(v.value_number) filter (where f.code = 'LEGACY_WEIGHT')) as weight_kg
        from public.screening_result_values v
        join public.service_result_fields f on f.id = v.service_result_field_id
        where v.screening_id = s.id and f.service_id = s.service_id
          and f.data_type = 'number' and v.value_number > 0
          and v.value_number::text not in ('NaN', 'Infinity', '-Infinity')
          and (f.min_value is null or v.value_number >= f.min_value)
          and (f.max_value is null or v.value_number <= f.max_value)
          and (f.code, f.unit) in (
            ('SYSTOLIC', 'mmHg'), ('LEGACY_SYSTOLIC', 'mmHg'),
            ('DIASTOLIC', 'mmHg'), ('LEGACY_DIASTOLIC', 'mmHg'),
            ('GLUCOSE', 'mmol/L'), ('LEGACY_GLUCOSE', 'mmol/L'),
            ('CHOLESTEROL', 'mmol/L'), ('LEGACY_CHOLESTEROL', 'mmol/L'),
            ('BMI', 'kg/m²'), ('LEGACY_BMI', 'kg/m²'),
            ('HEIGHT', 'cm'), ('LEGACY_HEIGHT', 'cm'),
            ('WEIGHT', 'kg'), ('LEGACY_WEIGHT', 'kg')
          )
    ) fv on true
    where s.status = 'Completed' and s.participant_reference is not null
), measurements as (
    select organisation_id, participant_reference, id, captured_at,
        systolic_mmhg, diastolic_mmhg, glucose_mmol_l, cholesterol_mmol_l,
        coalesce(bmi, case when height_cm > 0 and weight_kg > 0
            then round(weight_kg / power(height_cm / 100.0, 2), 2) end) as bmi
    from captured_measurements
), latest_indicators as (
    select organisation_id, participant_reference,
        (array_agg(systolic_mmhg order by captured_at desc nulls last, id desc) filter (where systolic_mmhg is not null))[1] as systolic_mmhg,
        (array_agg(diastolic_mmhg order by captured_at desc nulls last, id desc) filter (where diastolic_mmhg is not null))[1] as diastolic_mmhg,
        (array_agg(glucose_mmol_l order by captured_at desc nulls last, id desc) filter (where glucose_mmol_l is not null))[1] as glucose_mmol_l,
        (array_agg(cholesterol_mmol_l order by captured_at desc nulls last, id desc) filter (where cholesterol_mmol_l is not null))[1] as cholesterol_mmol_l,
        (array_agg(bmi order by captured_at desc nulls last, id desc) filter (where bmi is not null))[1] as bmi
    from measurements
    group by organisation_id, participant_reference
), classified as (
    select organisation_id, participant_reference,
        case
          when systolic_mmhg is null and diastolic_mmhg is null
            and glucose_mmol_l is null and cholesterol_mmol_l is null and bmi is null
            then 'Not Calculated'
          when systolic_mmhg >= 160 or diastolic_mmhg >= 100 or glucose_mmol_l >= 11.1
            or cholesterol_mmol_l >= 6.2 or bmi >= 35 then 'High'
          when systolic_mmhg >= 140 or diastolic_mmhg >= 90 or glucose_mmol_l >= 7.0
            or cholesterol_mmol_l >= 5.2 or bmi >= 30 then 'Moderate'
          else 'Low'
        end as risk_category
    from latest_indicators
), categories as (
    select risk_category from (values ('Low'), ('Moderate'), ('High'), ('Not Calculated')) c(risk_category)
), totals as (
    select organisation_id, count(*)::bigint as total_participants from classified group by organisation_id
), counts as (
    select organisation_id, risk_category, count(*)::bigint as participant_count
    from classified group by organisation_id, risk_category
)
select t.organisation_id, c.risk_category, coalesce(n.participant_count, 0)::bigint as participant_count,
    t.total_participants, round(coalesce(n.participant_count, 0)::numeric / nullif(t.total_participants, 0) * 100, 2) as percentage
from totals t cross join categories c
left join counts n on n.organisation_id = t.organisation_id and n.risk_category = c.risk_category;

comment on view public.analytics_risk_metrics is
'Organisation risk distribution from latest Completed value per supported indicator, using legacy and flexible results. Unsupported or missing measurements remain Not Calculated. All-time scope; no clinical expiry is defined.';
revoke all on public.analytics_risk_metrics from public, anon, authenticated;
grant select on public.analytics_risk_metrics to service_role;
