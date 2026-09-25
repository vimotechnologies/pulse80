-- Practitioner dashboard workflow: multi-service assignments, responses,
-- assignment change alerts, and structured screening corrections.

alter table public.practitioner_assignments
  add column if not exists role_name text,
  add column if not exists responded_at timestamptz,
  add column if not exists response_reason text,
  add column if not exists withdrawal_urgent boolean not null default false;

alter table public.practitioner_assignments
  drop constraint if exists practitioner_assignments_status_check;

alter table public.practitioner_assignments
  add constraint practitioner_assignments_status_check
  check (status in (
    'Scheduled', 'Confirmed', 'Declined', 'Withdrawn',
    'In Progress', 'Completed', 'Cancelled', 'Action Required'
  ));

create table public.practitioner_assignment_services (
  id uuid primary key default gen_random_uuid(),
  practitioner_assignment_id uuid not null
    references public.practitioner_assignments(id) on delete cascade,
  service_code text,
  service_name text not null check (length(trim(service_name)) >= 2),
  created_at timestamptz not null default now(),
  unique (practitioner_assignment_id, service_name)
);

insert into public.practitioner_assignment_services (
  practitioner_assignment_id,
  service_name
)
select id, service_name
from public.practitioner_assignments
on conflict (practitioner_assignment_id, service_name) do nothing;

create table public.practitioner_assignment_responses (
  id uuid primary key default gen_random_uuid(),
  practitioner_assignment_id uuid not null
    references public.practitioner_assignments(id) on delete cascade,
  practitioner_user_id uuid not null
    references public.practitioner_profiles(user_id) on delete cascade,
  previous_status text not null,
  response_status text not null
    check (response_status in ('Confirmed', 'Declined', 'Withdrawn')),
  reason text,
  urgent boolean not null default false,
  responded_at timestamptz not null default now(),
  check (response_status = 'Confirmed' or length(trim(reason)) >= 2)
);

create table public.practitioner_assignment_alerts (
  id uuid primary key default gen_random_uuid(),
  practitioner_assignment_id uuid not null
    references public.practitioner_assignments(id) on delete cascade,
  practitioner_user_id uuid not null
    references public.practitioner_profiles(user_id) on delete cascade,
  change_type text not null
    check (change_type in ('Assignment', 'Removal', 'Date', 'Time', 'Location', 'Services', 'Cancellation')),
  message text not null check (length(trim(message)) >= 2),
  urgent boolean not null default false,
  changed_at timestamptz not null default now(),
  acknowledged_at timestamptz
);

create table public.screening_correction_errors (
  id uuid primary key default gen_random_uuid(),
  screening_id uuid not null references public.screenings(id) on delete cascade,
  field_name text not null check (length(trim(field_name)) >= 1),
  message text not null check (length(trim(message)) >= 2),
  returned_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.screenings
  drop constraint if exists screenings_status_check;

update public.screenings
set status = 'Under Review'
where status = 'Submitted';

alter table public.screenings
  add constraint screenings_status_check
  check (status in ('Draft', 'Under Review', 'Approved', 'Needs Correction'));

alter table public.screenings
  drop constraint if exists screenings_check1;

alter table public.screenings
  add constraint screenings_review_state_check
  check (
    (status in ('Approved', 'Needs Correction') and reviewed_at is not null)
    or status in ('Draft', 'Under Review')
  );

create or replace function public.respond_to_practitioner_assignment(
  p_assignment_id uuid,
  p_practitioner_user_id uuid,
  p_response text,
  p_reason text,
  p_urgent boolean,
  p_responded_at timestamptz
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  current_status text;
  expected_status text;
begin
  if p_response not in ('Confirmed', 'Declined', 'Withdrawn') then
    raise exception 'Invalid assignment response.';
  end if;
  if p_response <> 'Confirmed' and length(trim(coalesce(p_reason, ''))) < 2 then
    raise exception 'A reason is required.';
  end if;

  expected_status := case when p_response = 'Withdrawn' then 'Confirmed' else 'Scheduled' end;
  select status into current_status
  from public.practitioner_assignments
  where id = p_assignment_id and practitioner_user_id = p_practitioner_user_id
  for update;

  if current_status is null then raise exception 'Assignment is unavailable.'; end if;
  if current_status <> expected_status then
    raise exception 'Assignment status changed. Refresh and try again.';
  end if;

  update public.practitioner_assignments
  set status = p_response,
      response_reason = p_reason,
      responded_at = p_responded_at,
      withdrawal_urgent = p_urgent
  where id = p_assignment_id;

  insert into public.practitioner_assignment_responses (
    practitioner_assignment_id, practitioner_user_id, previous_status,
    response_status, reason, urgent, responded_at
  ) values (
    p_assignment_id, p_practitioner_user_id, current_status,
    p_response, p_reason, p_urgent, p_responded_at
  );

  return p_assignment_id;
end;
$$;

create or replace function public.save_practitioner_assignment(
  p_assignment_id uuid,
  p_practitioner_user_id uuid,
  p_organisation_id uuid,
  p_programme_name text,
  p_activity_name text,
  p_service_name text,
  p_service_names text[],
  p_role_name text,
  p_location text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_status text
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  assignment_id uuid;
  previous public.practitioner_assignments%rowtype;
  previous_services text[];
  next_services text[];
begin
  select array_agg(service order by service)
  into next_services
  from (
    select distinct trim(value) as service
    from unnest(p_service_names) value
    where length(trim(value)) >= 2
  ) normalized_services;
  if coalesce(cardinality(next_services), 0) = 0 then
    raise exception 'At least one service is required.';
  end if;

  if p_assignment_id is null then
    insert into public.practitioner_assignments (
      practitioner_user_id, organisation_id, programme_name, activity_name,
      service_name, role_name, location, starts_at, ends_at, status
    ) values (
      p_practitioner_user_id, p_organisation_id, p_programme_name, p_activity_name,
      p_service_name, p_role_name, p_location, p_starts_at, p_ends_at, p_status
    ) returning id into assignment_id;

    insert into public.practitioner_assignment_services (practitioner_assignment_id, service_name)
    select assignment_id, service from unnest(next_services) service;
    return assignment_id;
  end if;

  select * into previous
  from public.practitioner_assignments
  where id = p_assignment_id
  for update;
  if previous.id is null then raise exception 'Assignment not found.'; end if;

  select array_agg(service_name order by service_name)
  into previous_services
  from public.practitioner_assignment_services
  where practitioner_assignment_id = p_assignment_id;
  previous_services := coalesce(previous_services, array[previous.service_name]);

  update public.practitioner_assignments
  set practitioner_user_id = p_practitioner_user_id,
      organisation_id = p_organisation_id,
      programme_name = p_programme_name,
      activity_name = p_activity_name,
      service_name = p_service_name,
      role_name = p_role_name,
      location = p_location,
      starts_at = p_starts_at,
      ends_at = p_ends_at,
      status = case
        when previous.practitioner_user_id <> p_practitioner_user_id and p_status <> 'Cancelled'
          then 'Scheduled'
        else p_status
      end
  where id = p_assignment_id;

  delete from public.practitioner_assignment_services
  where practitioner_assignment_id = p_assignment_id;
  insert into public.practitioner_assignment_services (practitioner_assignment_id, service_name)
  select p_assignment_id, service from unnest(next_services) service;

  if previous.practitioner_user_id <> p_practitioner_user_id then
    insert into public.practitioner_assignment_alerts (
      practitioner_assignment_id, practitioner_user_id, change_type, message, urgent
    ) values
      (p_assignment_id, previous.practitioner_user_id, 'Removal', 'You have been removed from an assignment.', true),
      (p_assignment_id, p_practitioner_user_id, 'Assignment', 'A new assignment requires your confirmation.', false);
  else
    if (previous.starts_at at time zone 'Africa/Gaborone')::date <>
       (p_starts_at at time zone 'Africa/Gaborone')::date then
      insert into public.practitioner_assignment_alerts values
        (default, p_assignment_id, p_practitioner_user_id, 'Date', 'The assignment date has changed.', false, default, null);
    end if;
    if (previous.starts_at at time zone 'Africa/Gaborone')::time <>
       (p_starts_at at time zone 'Africa/Gaborone')::time then
      insert into public.practitioner_assignment_alerts values
        (default, p_assignment_id, p_practitioner_user_id, 'Time', 'The assignment time has changed.', false, default, null);
    end if;
    if previous.location is distinct from p_location then
      insert into public.practitioner_assignment_alerts values
        (default, p_assignment_id, p_practitioner_user_id, 'Location', 'The assignment location has changed.', false, default, null);
    end if;
    if previous_services is distinct from next_services then
      insert into public.practitioner_assignment_alerts values
        (default, p_assignment_id, p_practitioner_user_id, 'Services', 'Your assigned services have changed.', false, default, null);
    end if;
    if previous.status <> 'Cancelled' and p_status = 'Cancelled' then
      insert into public.practitioner_assignment_alerts values
        (default, p_assignment_id, p_practitioner_user_id, 'Cancellation', 'The assignment has been cancelled.', true, default, null);
    end if;
  end if;

  return p_assignment_id;
end;
$$;

create or replace function public.review_screening_with_errors(
  p_screening_id uuid,
  p_reviewer_id uuid,
  p_status text,
  p_review_note text,
  p_errors jsonb,
  p_reviewed_at timestamptz
)
returns uuid
language plpgsql
set search_path = ''
as $$
begin
  if p_status not in ('Approved', 'Needs Correction') then raise exception 'Invalid review status.'; end if;
  if p_status = 'Needs Correction' and jsonb_array_length(p_errors) = 0 then
    raise exception 'At least one correction error is required.';
  end if;

  update public.screenings
  set status = p_status, review_note = p_review_note,
      reviewed_by = p_reviewer_id, reviewed_at = p_reviewed_at
  where id = p_screening_id and status = 'Under Review';
  if not found then raise exception 'Screening is not awaiting review.'; end if;

  update public.screening_correction_errors
  set resolved_at = p_reviewed_at
  where screening_id = p_screening_id and resolved_at is null;

  if p_status = 'Needs Correction' then
    insert into public.screening_correction_errors (screening_id, field_name, message, returned_at)
    select p_screening_id, item->>'field', item->>'message', p_reviewed_at
    from jsonb_array_elements(p_errors) item;
  end if;
  return p_screening_id;
end;
$$;

create or replace function public.resubmit_screening_with_result(
  p_screening_id uuid,
  p_practitioner_user_id uuid,
  p_participant_reference text,
  p_department text,
  p_practitioner_note text,
  p_systolic_mmhg numeric,
  p_diastolic_mmhg numeric,
  p_glucose_mmol_l numeric,
  p_cholesterol_mmol_l numeric,
  p_height_cm numeric,
  p_weight_kg numeric,
  p_bmi numeric,
  p_risk_level text,
  p_escalation_required boolean,
  p_submitted_at timestamptz
)
returns uuid
language plpgsql
set search_path = ''
as $$
begin
  update public.screenings
  set participant_reference = p_participant_reference, department = p_department,
      consent_confirmed = true, practitioner_note = p_practitioner_note,
      status = 'Under Review', submitted_at = p_submitted_at,
      reviewed_by = null, reviewed_at = null, review_note = null
  where id = p_screening_id
    and practitioner_user_id = p_practitioner_user_id
    and status = 'Needs Correction';
  if not found then raise exception 'Screening status changed before it could be resubmitted.'; end if;

  update public.screening_results
  set systolic_mmhg = p_systolic_mmhg, diastolic_mmhg = p_diastolic_mmhg,
      glucose_mmol_l = p_glucose_mmol_l, cholesterol_mmol_l = p_cholesterol_mmol_l,
      height_cm = p_height_cm, weight_kg = p_weight_kg, bmi = p_bmi,
      risk_level = p_risk_level, escalation_required = p_escalation_required
  where screening_id = p_screening_id;
  if not found then raise exception 'Screening result is unavailable.'; end if;

  update public.screening_correction_errors
  set resolved_at = p_submitted_at
  where screening_id = p_screening_id and resolved_at is null;
  return p_screening_id;
end;
$$;

create or replace function public.capture_screening_with_result(
  p_assignment_id uuid,
  p_practitioner_user_id uuid,
  p_participant_reference text,
  p_department text,
  p_practitioner_note text,
  p_systolic_mmhg numeric,
  p_diastolic_mmhg numeric,
  p_glucose_mmol_l numeric,
  p_cholesterol_mmol_l numeric,
  p_height_cm numeric,
  p_weight_kg numeric,
  p_bmi numeric,
  p_risk_level text,
  p_escalation_required boolean,
  p_submitted_at timestamptz
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  assignment public.practitioner_assignments%rowtype;
  screening_id uuid;
begin
  select * into assignment
  from public.practitioner_assignments
  where id = p_assignment_id
    and practitioner_user_id = p_practitioner_user_id
    and status in ('Confirmed', 'In Progress')
  for update;
  if assignment.id is null then
    raise exception 'Screenings can only be captured for your confirmed or active assignments.';
  end if;
  if assignment.organisation_id is null then
    raise exception 'The assignment is not linked to an organisation.';
  end if;

  insert into public.screenings (
    organisation_id, activation_id, assignment_id, practitioner_user_id,
    participant_reference, department, consent_confirmed, status,
    practitioner_note, submitted_at
  ) values (
    assignment.organisation_id, assignment.activation_id, assignment.id, p_practitioner_user_id,
    p_participant_reference, p_department, true, 'Under Review',
    p_practitioner_note, p_submitted_at
  ) returning id into screening_id;

  insert into public.screening_results (
    screening_id, systolic_mmhg, diastolic_mmhg, glucose_mmol_l,
    cholesterol_mmol_l, height_cm, weight_kg, bmi, risk_level, escalation_required
  ) values (
    screening_id, p_systolic_mmhg, p_diastolic_mmhg, p_glucose_mmol_l,
    p_cholesterol_mmol_l, p_height_cm, p_weight_kg, p_bmi, p_risk_level, p_escalation_required
  );
  return screening_id;
end;
$$;

revoke all on function public.respond_to_practitioner_assignment(uuid, uuid, text, text, boolean, timestamptz) from public, anon, authenticated;
revoke all on function public.save_practitioner_assignment(uuid, uuid, uuid, text, text, text, text[], text, text, timestamptz, timestamptz, text) from public, anon, authenticated;
revoke all on function public.review_screening_with_errors(uuid, uuid, text, text, jsonb, timestamptz) from public, anon, authenticated;
revoke all on function public.resubmit_screening_with_result(uuid, uuid, text, text, text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text, boolean, timestamptz) from public, anon, authenticated;
revoke all on function public.capture_screening_with_result(uuid, uuid, text, text, text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text, boolean, timestamptz) from public, anon, authenticated;

grant execute on function public.respond_to_practitioner_assignment(uuid, uuid, text, text, boolean, timestamptz) to service_role;
grant execute on function public.save_practitioner_assignment(uuid, uuid, uuid, text, text, text, text[], text, text, timestamptz, timestamptz, text) to service_role;
grant execute on function public.review_screening_with_errors(uuid, uuid, text, text, jsonb, timestamptz) to service_role;
grant execute on function public.resubmit_screening_with_result(uuid, uuid, text, text, text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text, boolean, timestamptz) to service_role;
grant execute on function public.capture_screening_with_result(uuid, uuid, text, text, text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text, boolean, timestamptz) to service_role;

create index practitioner_assignment_services_assignment_idx
  on public.practitioner_assignment_services(practitioner_assignment_id);
create index practitioner_assignment_responses_assignment_idx
  on public.practitioner_assignment_responses(practitioner_assignment_id, responded_at desc);
create index practitioner_assignment_alerts_user_unread_idx
  on public.practitioner_assignment_alerts(practitioner_user_id, urgent desc, changed_at desc)
  where acknowledged_at is null;
create index screening_correction_errors_screening_open_idx
  on public.screening_correction_errors(screening_id, returned_at desc)
  where resolved_at is null;

alter table public.practitioner_assignment_services enable row level security;
alter table public.practitioner_assignment_responses enable row level security;
alter table public.practitioner_assignment_alerts enable row level security;
alter table public.screening_correction_errors enable row level security;

create policy "Practitioners can read own assigned services"
on public.practitioner_assignment_services for select to authenticated
using (
  exists (
    select 1 from public.practitioner_assignments assignment
    where assignment.id = practitioner_assignment_services.practitioner_assignment_id
      and assignment.practitioner_user_id = (select auth.uid())
  )
);
create policy "Platform staff can read assigned services"
on public.practitioner_assignment_services for select to authenticated
using (public.is_platform_staff());

create policy "Practitioners can read own assignment responses"
on public.practitioner_assignment_responses for select to authenticated
using ((select auth.uid()) = practitioner_user_id);
create policy "Platform staff can read assignment responses"
on public.practitioner_assignment_responses for select to authenticated
using (public.is_platform_staff());

create policy "Practitioners can read own assignment alerts"
on public.practitioner_assignment_alerts for select to authenticated
using ((select auth.uid()) = practitioner_user_id);
create policy "Platform staff can read assignment alerts"
on public.practitioner_assignment_alerts for select to authenticated
using (public.is_platform_staff());

create policy "Practitioners can read own correction errors"
on public.screening_correction_errors for select to authenticated
using (
  exists (
    select 1 from public.screenings screening
    where screening.id = screening_correction_errors.screening_id
      and screening.practitioner_user_id = (select auth.uid())
  )
);
create policy "Platform staff can read correction errors"
on public.screening_correction_errors for select to authenticated
using (public.is_platform_staff());

revoke all on public.practitioner_assignment_services from anon, authenticated;
revoke all on public.practitioner_assignment_responses from anon, authenticated;
revoke all on public.practitioner_assignment_alerts from anon, authenticated;
revoke all on public.screening_correction_errors from anon, authenticated;

grant select on public.practitioner_assignment_services to authenticated;
grant select on public.practitioner_assignment_responses to authenticated;
grant select on public.practitioner_assignment_alerts to authenticated;
grant select on public.screening_correction_errors to authenticated;

grant all on public.practitioner_assignment_services to service_role;
grant all on public.practitioner_assignment_responses to service_role;
grant all on public.practitioner_assignment_alerts to service_role;
grant all on public.screening_correction_errors to service_role;
