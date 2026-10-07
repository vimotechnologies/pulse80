-- Enforce evidence at the database boundary, including imports and GraphQL review.
-- Existing Completed rows are preserved for a separate source-data reconciliation.
create or replace function public.require_completed_screening_results()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.status <> 'Completed' then return new; end if;
  if tg_op = 'UPDATE' and old.status = 'Completed' then return new; end if;

  if not exists (
    select 1 from public.screening_results r where r.screening_id = new.id
      and (r.systolic_mmhg is not null or r.diastolic_mmhg is not null
        or r.glucose_mmol_l is not null or r.cholesterol_mmol_l is not null
        or r.bmi is not null or r.height_cm is not null or r.weight_kg is not null)
  ) and not exists (
    select 1 from public.screening_result_values v
    join public.service_result_fields f on f.id = v.service_result_field_id
    where v.screening_id = new.id and f.service_id = new.service_id
      and (v.value_number is not null or v.value_boolean is not null
        or nullif(btrim(v.value_text), '') is not null
        or nullif(btrim(v.value_code), '') is not null)
  ) then
    raise exception 'Cannot mark screening Completed without saved results. Capture or import the original screening results first.';
  end if;
  return new;
end;
$$;
revoke all on function public.require_completed_screening_results() from public, anon, authenticated;
grant execute on function public.require_completed_screening_results() to service_role;
drop trigger if exists require_completed_screening_results on public.screenings;
create trigger require_completed_screening_results before insert or update of status on public.screenings
for each row execute function public.require_completed_screening_results();
