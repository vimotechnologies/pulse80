-- PUL-312: Add the risk metrics analytics view.
begin;

create or replace view public.analytics_risk_metrics
with (security_invoker = true)
as

with completed_participants as (
    -- One participant is identified by organisation + participant reference.
    -- Only participants with at least one Completed screening are included.
    select distinct
        s.organisation_id,
        s.participant_reference
    from public.screenings s
    where s.status = 'Completed'
),

applicable_screenings as (
    -- Find Completed screenings that contain at least one measurement
    -- supported by the current risk calculation.
    select
        s.organisation_id,
        s.participant_reference,
        s.id as screening_id,
        s.captured_at,

        sr.systolic_mmhg,
        sr.diastolic_mmhg,
        sr.glucose_mmol_l,
        sr.cholesterol_mmol_l,
        sr.bmi,

        row_number() over (
            partition by
                s.organisation_id,
                s.participant_reference
            order by
                s.captured_at desc,
                s.id desc
        ) as screening_rank

    from public.screenings s

    inner join public.screening_results sr
        on sr.screening_id = s.id

    where
        s.status = 'Completed'
        and (
            sr.systolic_mmhg is not null
            or sr.diastolic_mmhg is not null
            or sr.glucose_mmol_l is not null
            or sr.cholesterol_mmol_l is not null
            or sr.bmi is not null
        )
),

latest_applicable as (
    -- Keep only the latest applicable Completed screening
    -- for each participant.
    select
        organisation_id,
        participant_reference,
        screening_id,
        captured_at,
        systolic_mmhg,
        diastolic_mmhg,
        glucose_mmol_l,
        cholesterol_mmol_l,
        bmi

    from applicable_screenings
    where screening_rank = 1
),

classified_participants as (
    -- Give every screened participant one risk category.
    select
        cp.organisation_id,
        cp.participant_reference,

        case
            -- The participant has Completed screening activity,
            -- but no Completed screening containing a supported
            -- PUL-312 risk measurement.
            when la.screening_id is null
                then 'Not Calculated'

            -- High risk: any available measurement reaches
            -- a High threshold.
            when
                la.systolic_mmhg >= 160
                or la.diastolic_mmhg >= 100
                or la.glucose_mmol_l >= 11.1
                or la.cholesterol_mmol_l >= 6.2
                or la.bmi >= 35
                then 'High'

            -- Moderate risk: no High threshold was reached,
            -- but at least one Moderate threshold was reached.
            when
                la.systolic_mmhg >= 140
                or la.diastolic_mmhg >= 90
                or la.glucose_mmol_l >= 7.0
                or la.cholesterol_mmol_l >= 5.2
                or la.bmi >= 30
                then 'Moderate'

            -- At least one supported measurement exists,
            -- but none reaches Moderate or High.
            else 'Low'
        end as risk_category

    from completed_participants cp

    left join latest_applicable la
        on la.organisation_id = cp.organisation_id
        and la.participant_reference = cp.participant_reference
),

risk_categories as (
    -- Always expose all four categories.
    select risk_category
    from (
        values
            ('Low'),
            ('Moderate'),
            ('High'),
            ('Not Calculated')
    ) as categories(risk_category)
),

organisations_with_screenings as (
    -- Organisations represented in the PUL-312 analytics population.
    select distinct
        organisation_id
    from completed_participants
),

organisation_categories as (
    -- Produce all four categories for every organisation,
    -- even when a category currently has zero participants.
    select
        organisations.organisation_id,
        categories.risk_category

    from organisations_with_screenings organisations
    cross join risk_categories categories
),

risk_counts as (
    -- Count each participant once in their calculated category.
    select
        organisation_id,
        risk_category,
        count(*)::bigint as participant_count

    from classified_participants

    group by
        organisation_id,
        risk_category
),

organisation_totals as (
    -- Total unique participants with at least one Completed screening.
    select
        organisation_id,
        count(*)::bigint as total_participants

    from classified_participants

    group by organisation_id
)

select
    oc.organisation_id,
    oc.risk_category,

    coalesce(
        rc.participant_count,
        0
    )::bigint as participant_count,

    ot.total_participants,

    round(
        (
            coalesce(rc.participant_count, 0)::numeric
            / nullif(ot.total_participants, 0)
        ) * 100,
        2
    ) as percentage

from organisation_categories oc

left join risk_counts rc
    on rc.organisation_id = oc.organisation_id
    and rc.risk_category = oc.risk_category

inner join organisation_totals ot
    on ot.organisation_id = oc.organisation_id;

comment on view public.analytics_risk_metrics is
    'Reports organisation-level participant risk distribution using the latest applicable Completed screening. Supported indicators are blood pressure, glucose, cholesterol and BMI. Categories are Low, Moderate, High and Not Calculated. Not Calculated means the participant has Completed screening activity but no Completed screening containing a supported risk measurement.';

commit;