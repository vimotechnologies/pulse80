begin;

-- Standalone forward-only foundation for the verified production schema.
-- No UPDATE/INSERT of existing screenings, assignments, services or analytics views.
alter table public.programme_participants alter column employee_id drop not null;
alter table public.programme_participants add column if not exists screening_reference text;
alter table public.programme_participants drop constraint if exists programme_participants_employee_id_fkey;
alter table public.programme_participants add constraint programme_participants_employee_id_fkey
  foreign key(employee_id) references public.employees(id) on delete set null;
alter table public.programme_participants drop constraint if exists programme_roster_code_check;
alter table public.programme_participants add constraint programme_roster_code_check
  check (screening_reference is null or (screening_reference = btrim(screening_reference) and length(screening_reference) between 2 and 80));
alter table public.programme_participants drop constraint if exists programme_roster_identity_check;
alter table public.programme_participants add constraint programme_roster_identity_check
  check (employee_id is not null or screening_reference is not null);
create unique index if not exists programme_participants_screening_reference_key
  on public.programme_participants(programme_id, screening_reference) where screening_reference is not null;
comment on column public.programme_participants.screening_reference is
  'Anonymous roster code. Case-sensitive, trimmed and unique within a programme. Never inferred from names or employee numbers.';
alter table public.programme_participants enable row level security;
revoke all privileges on public.programme_participants from public, anon, authenticated;
grant select, insert, update, delete on public.programme_participants to service_role;
grant select on public.employees, public.programmes, public.activations, public.practitioner_assignments to service_role;

create or replace function public.validate_programme_participant() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.employee_id is not null and not exists (
    select 1 from public.programmes p join public.employees e on e.organisation_id=p.organisation_id
    where p.id=new.programme_id and e.id=new.employee_id
  ) then raise exception 'Participant and programme must belong to the same organisation.'; end if;
  if tg_op='INSERT' and new.screening_reference is null then
    raise exception 'An anonymous screening code is required.';
  end if;
  if tg_op='UPDATE' and (new.programme_id is distinct from old.programme_id
    or (old.screening_reference is not null and new.screening_reference is distinct from old.screening_reference)) then
    raise exception 'Programme and screening code cannot be changed. Update participant statuses instead.';
  end if;
  return new;
end;
$$;
drop trigger if exists validate_programme_participant on public.programme_participants;
create trigger validate_programme_participant before insert or update on public.programme_participants
for each row execute function public.validate_programme_participant();

-- Preserve tenant/programme boundaries after roster links have been created.
create or replace function public.protect_programme_organisation() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.organisation_id is distinct from old.organisation_id and (
    exists(select 1 from public.programme_participants pp where pp.programme_id=old.id)
    or exists(select 1 from public.activations a where a.programme_id=old.id)) then
    raise exception 'Cannot move a programme with participants or activations to another organisation.';
  end if;
  return new;
end;
$$;
drop trigger if exists protect_programme_organisation on public.programmes;
create trigger protect_programme_organisation before update of organisation_id on public.programmes
for each row execute function public.protect_programme_organisation();
create or replace function public.validate_activation_programme() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if not exists(select 1 from public.programmes p where p.id=new.programme_id and p.organisation_id=new.organisation_id) then
    raise exception 'Activation and programme must belong to the same organisation.';
  end if;
  if tg_op='UPDATE' and (new.programme_id,new.organisation_id) is distinct from (old.programme_id,old.organisation_id)
    and (exists(select 1 from public.practitioner_assignments pa where pa.activation_id=old.id)
      or exists(select 1 from public.screenings s where s.activation_id=old.id)) then
    raise exception 'Cannot move an activation with assignments or screenings.';
  end if;
  return new;
end;
$$;
drop trigger if exists validate_activation_programme on public.activations;
create trigger validate_activation_programme before insert or update of organisation_id,programme_id on public.activations
for each row execute function public.validate_activation_programme();
create or replace function public.protect_employee_organisation() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.organisation_id is distinct from old.organisation_id
    and exists(select 1 from public.programme_participants pp where pp.employee_id=old.id) then
    raise exception 'Cannot move an employee with programme participation to another organisation.';
  end if;
  return new;
end;
$$;
drop trigger if exists protect_employee_organisation on public.employees;
create trigger protect_employee_organisation before update of organisation_id on public.employees
for each row execute function public.protect_employee_organisation();

revoke all on function public.protect_programme_organisation(),public.validate_activation_programme(),public.protect_employee_organisation() from public,anon,authenticated;
grant execute on function public.protect_programme_organisation(),public.validate_activation_programme(),public.protect_employee_organisation() to service_role;

-- Compatible with installations that already have optional required-service links.
-- An employee is no longer required to validate those links.
create or replace function public.validate_participant_service() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if not exists(select 1 from public.programme_participants pp
    join public.programme_services ps on ps.programme_id=pp.programme_id
    where pp.id=new.programme_participant_id and ps.id=new.programme_service_id) then
    raise exception 'Required service must belong to the participant programme and organisation.';
  end if;
  return new;
end;
$$;

create or replace function public.import_programme_roster(p_programme_id uuid, p_organisation_id uuid, p_rows jsonb)
returns uuid[] language plpgsql security invoker set search_path = '' as $$
declare entry jsonb; participant_id uuid; ids uuid[] := '{}'; row_number integer := 0;
begin
  perform 1 from public.programmes where id=p_programme_id and organisation_id=p_organisation_id for update;
  if not found then raise exception 'Programme is unavailable for this organisation.'; end if;
  if p_rows is null or jsonb_typeof(p_rows)<>'array' then raise exception 'Roster rows must be an array.'; end if;
  if jsonb_array_length(p_rows) not between 1 and 500 then raise exception 'Import between 1 and 500 roster rows.'; end if;
  for entry in select value from jsonb_array_elements(p_rows) loop
    row_number := row_number+1;
    if jsonb_typeof(entry)<>'object' then raise exception 'Invalid roster row %.',row_number; end if;
    if exists(select 1 from jsonb_object_keys(entry) key where key not in ('screening_reference','employee_id','eligibility_status','registration_status')) then
      raise exception 'Roster row % contains unsupported columns. Names are not part of this roster.',row_number;
    end if;
    if jsonb_typeof(entry->'screening_reference') is distinct from 'string'
      or length(btrim(entry->>'screening_reference')) not between 2 and 80 then
      raise exception 'Row % requires a screening code of 2 to 80 characters.',row_number;
    end if;
    if entry->>'eligibility_status' is null or entry->>'eligibility_status' not in ('Eligible','Not Eligible')
      or entry->>'registration_status' is null or entry->>'registration_status' not in ('Invited','Registered','Declined','Withdrawn') then
      raise exception 'Invalid participant status in row %.',row_number;
    end if;
    insert into public.programme_participants(programme_id,employee_id,screening_reference,eligibility_status,registration_status)
    values(p_programme_id,nullif(entry->>'employee_id','')::uuid,btrim(entry->>'screening_reference'),entry->>'eligibility_status',entry->>'registration_status')
    returning id into participant_id;
    ids := array_append(ids,participant_id);
  end loop;
  return ids;
end;
$$;

create or replace function public.set_programme_roster_status(
  p_programme_id uuid, p_organisation_id uuid, p_participant_id uuid,
  p_eligibility_status text, p_registration_status text
) returns public.programme_participants language plpgsql security invoker set search_path = '' as $$
declare participant public.programme_participants%rowtype;
begin
  perform 1 from public.programmes where id=p_programme_id and organisation_id=p_organisation_id for share;
  if not found then raise exception 'Programme is unavailable for this organisation.'; end if;
  update public.programme_participants set eligibility_status=p_eligibility_status, registration_status=p_registration_status, updated_at=now()
    where id=p_participant_id and programme_id=p_programme_id returning * into participant;
  if not found then raise exception 'Participant is unavailable for this programme.'; end if;
  return participant;
end;
$$;

-- One production-compatible rule: exact, unambiguous catalogue names/codes in
-- BOTH configured text lists. No inferred programme_services rows or backfills.
create or replace function public.roster_service_allowed(p_activation_id uuid,p_service_id uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
  select exists(
    select 1 from public.activations a
    join public.programmes p on p.id=a.programme_id and p.organisation_id=a.organisation_id
    join public.services s on s.id=p_service_id and s.active
    where a.id=p_activation_id
      and exists(select 1 from unnest(a.service_names) label
        where (lower(btrim(label))=lower(btrim(s.name)) or lower(btrim(label))=lower(btrim(s.code)))
          and (select count(*) from public.services candidate where lower(btrim(label))=lower(btrim(candidate.name)) or lower(btrim(label))=lower(btrim(candidate.code)))=1)
      and exists(select 1 from unnest(p.service_names) label
        where (lower(btrim(label))=lower(btrim(s.name)) or lower(btrim(label))=lower(btrim(s.code)))
          and (select count(*) from public.services candidate where lower(btrim(label))=lower(btrim(candidate.name)) or lower(btrim(label))=lower(btrim(candidate.code)))=1)
  );
$$;
revoke all on function public.roster_service_allowed(uuid,uuid) from public,anon,authenticated;
grant execute on function public.roster_service_allowed(uuid,uuid) to service_role;

create or replace function public.validate_roster_assignment() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op='UPDATE' then
    if (new.activation_id,new.organisation_id,new.practitioner_user_id,new.service_id)
      is not distinct from (old.activation_id,old.organisation_id,old.practitioner_user_id,old.service_id) then return new; end if;
    if old.activation_id is null then raise exception 'Historical unlinked assignments require a separate reviewed correction.'; end if;
    if exists(select 1 from public.screenings where assignment_id=old.id) then
      raise exception 'Cannot change assignment links with existing screenings.';
    end if;
  end if;
  perform 1 from public.activations a join public.programmes p on p.id=a.programme_id and p.organisation_id=a.organisation_id
    where a.id=new.activation_id and a.organisation_id=new.organisation_id for share of a,p;
  if not found then raise exception 'Choose an activation in the selected organisation.'; end if;
  if not public.roster_service_allowed(new.activation_id,new.service_id) then
    raise exception 'Choose services configured for this activation and programme.';
  end if;
  return new;
end;
$$;
drop trigger if exists validate_roster_assignment on public.practitioner_assignments;
create trigger validate_roster_assignment before insert or update of activation_id,organisation_id,practitioner_user_id,service_id
on public.practitioner_assignments for each row execute function public.validate_roster_assignment();
revoke all on function public.validate_roster_assignment() from public,anon,authenticated;
grant execute on function public.validate_roster_assignment() to service_role;

create or replace function public.save_linked_practitioner_assignment(
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
  p_status text,
  p_activation_id uuid,
  p_service_ids uuid[]
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
  event public.activations%rowtype;
  programme public.programmes%rowtype;
begin
  select * into event from public.activations where id = p_activation_id for share;
  select * into programme from public.programmes where id = event.programme_id;
  if event.id is null or event.organisation_id is distinct from p_organisation_id or programme.organisation_id is distinct from p_organisation_id then
    raise exception 'Choose an activation in the selected organisation.';
  end if;
  if p_starts_at is null or p_starts_at < event.starts_at or p_ends_at is null or p_ends_at > event.ends_at or p_ends_at <= p_starts_at then
    raise exception 'Assignment dates must fall within the activation period.';
  end if;
  if coalesce(cardinality(p_service_ids),0)=0 or exists(select 1 from unnest(p_service_ids) sid
    where sid is null or not public.roster_service_allowed(p_activation_id,sid)) then
    raise exception 'Choose services configured for this activation and programme.';
  end if;
  p_programme_name := programme.name;
  p_activity_name := event.title;
  p_location := event.location;
  select name into p_service_name from public.services where id=p_service_ids[1];
  select array_agg(name order by name) into p_service_names from public.services where id=any(p_service_ids);
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
      service_name, role_name, location, starts_at, ends_at, status, activation_id, service_id
    ) values (
      p_practitioner_user_id, p_organisation_id, p_programme_name, p_activity_name,
      p_service_name, p_role_name, p_location, p_starts_at, p_ends_at, p_status, p_activation_id, p_service_ids[1]
    ) returning id into assignment_id;

    insert into public.practitioner_assignment_services (practitioner_assignment_id, service_name, service_code, service_id)
    select assignment_id, name, code, id from public.services where id=any(p_service_ids);
    return assignment_id;
  end if;

  select * into previous
  from public.practitioner_assignments
  where id = p_assignment_id
  for update;
  if previous.id is null then raise exception 'Assignment not found.'; end if;
  if previous.activation_id is null then raise exception 'Historical unlinked assignments require a separate reviewed correction.'; end if;

  select array_agg(service_name order by service_name)
  into previous_services
  from public.practitioner_assignment_services
  where practitioner_assignment_id = p_assignment_id;
  previous_services := coalesce(previous_services, array[previous.service_name]);

  if exists(select 1 from public.screenings sc where sc.assignment_id=p_assignment_id)
    and ((previous.activation_id, previous.organisation_id, previous.practitioner_user_id, previous.service_id)
      is distinct from (p_activation_id,p_organisation_id,p_practitioner_user_id,p_service_ids[1])
      or exists(select 1 from public.practitioner_assignment_services pas where pas.practitioner_assignment_id=p_assignment_id
        and not(pas.service_id=any(p_service_ids)))) then
    raise exception 'Cannot change event, practitioner or existing services for an assignment with screenings.';
  end if;
  update public.practitioner_assignments
  set practitioner_user_id = p_practitioner_user_id,
      organisation_id = p_organisation_id,
      activation_id = p_activation_id,
      service_id = p_service_ids[1],
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
  insert into public.practitioner_assignment_services (practitioner_assignment_id, service_name, service_code, service_id)
  select p_assignment_id, name, code, id from public.services where id=any(p_service_ids);

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


revoke all on function public.save_linked_practitioner_assignment(uuid,uuid,uuid,text,text,text,text[],text,text,timestamptz,timestamptz,text,uuid,uuid[]) from public,anon,authenticated;
grant execute on function public.save_linked_practitioner_assignment(uuid,uuid,uuid,text,text,text,text[],text,text,timestamptz,timestamptz,text,uuid,uuid[]) to service_role;

create or replace function public.resolve_programme_screening_participant(
  p_assignment_id uuid, p_practitioner_user_id uuid, p_participant_reference text
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare target_programme uuid; matches uuid[]; participant public.programme_participants%rowtype;
begin
  select a.programme_id into target_programme
  from public.practitioner_assignments pa
  join public.activations a on a.id=pa.activation_id and a.organisation_id=pa.organisation_id
  join public.programmes p on p.id=a.programme_id and p.organisation_id=a.organisation_id
  where pa.id=p_assignment_id and pa.practitioner_user_id=p_practitioner_user_id
    and pa.status in ('Confirmed','In Progress')
  for share of pa,a,p;
  if target_programme is null then
    raise exception 'The screening assignment must belong to your confirmed or active programme activation.';
  end if;
  if p_participant_reference is null or length(btrim(p_participant_reference)) not between 2 and 80 then
    raise exception 'Enter the anonymous screening code issued for this programme.';
  end if;
  select array_agg(id) into matches from (
    select pp.id from public.programme_participants pp
    where pp.programme_id=target_programme and pp.screening_reference=btrim(p_participant_reference)
    for share
  ) matched;
  if coalesce(cardinality(matches),0)<>1 then
    raise exception 'Participant code is invalid or ambiguous for this programme. Ask operations to check the roster.';
  end if;
  select * into participant from public.programme_participants where id=matches[1];
  if participant.eligibility_status<>'Eligible' or participant.registration_status<>'Registered' then
    raise exception 'Participant must be Eligible and Registered before screening.';
  end if;
  return participant.id;
end;
$$;

-- Both the legacy RPC and flexible inserts pass through this same trigger.
create or replace function public.link_screening_programme_participant() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare participant_id uuid; assignment public.practitioner_assignments%rowtype; assigned_services uuid[]; target_programme uuid;
begin
  if tg_op='UPDATE' then
    if (new.participant_reference,new.programme_participant_id,new.assignment_id,new.activation_id,new.organisation_id,new.practitioner_user_id,new.service_id)
      is not distinct from (old.participant_reference,old.programme_participant_id,old.assignment_id,old.activation_id,old.organisation_id,old.practitioner_user_id,old.service_id) then
      return new;
    end if;
    if old.programme_participant_id is null then
      raise exception 'Historical unlinked screenings require a separate reviewed correction; automatic linking is disabled.';
    end if;
  end if;
  participant_id := public.resolve_programme_screening_participant(new.assignment_id,new.practitioner_user_id,new.participant_reference);
  select * into assignment from public.practitioner_assignments where id=new.assignment_id;
  if new.organisation_id is distinct from assignment.organisation_id or new.activation_id is distinct from assignment.activation_id then
    raise exception 'Screening and assignment must belong to the same organisation and activation.';
  end if;
  if new.programme_participant_id is not null and new.programme_participant_id<>participant_id then
    raise exception 'Participant link does not match the programme and anonymous code.';
  end if;
  new.participant_reference := btrim(new.participant_reference);
  new.programme_participant_id := participant_id;
  select array_agg(distinct service_id) into assigned_services from (
    select assignment.service_id as service_id union select pas.service_id from public.practitioner_assignment_services pas
    where pas.practitioner_assignment_id=new.assignment_id
  ) assigned where service_id is not null;
  if new.service_id is not null and not coalesce(new.service_id=any(assigned_services),false) then
    raise exception 'This service is not part of the selected assignment.';
  end if;
  if new.service_id is null and cardinality(assigned_services)=1 then new.service_id:=assigned_services[1]; end if;
  if new.service_id is null or not public.roster_service_allowed(new.activation_id,new.service_id) then
    raise exception 'Choose a service configured for this assignment, activation and programme.';
  end if;
  return new;
end;
$$;
drop trigger if exists link_screening_programme_participant on public.screenings;
create trigger link_screening_programme_participant before insert or update of participant_reference,programme_participant_id,
  assignment_id,activation_id,organisation_id,practitioner_user_id,service_id on public.screenings
for each row execute function public.link_screening_programme_participant();

revoke all on function public.validate_programme_participant(), public.validate_participant_service(),
  public.import_programme_roster(uuid,uuid,jsonb), public.set_programme_roster_status(uuid,uuid,uuid,text,text), public.resolve_programme_screening_participant(uuid,uuid,text),
  public.link_screening_programme_participant() from public, anon, authenticated;
grant execute on function public.validate_programme_participant(), public.validate_participant_service(),
  public.import_programme_roster(uuid,uuid,jsonb), public.set_programme_roster_status(uuid,uuid,uuid,text,text), public.resolve_programme_screening_participant(uuid,uuid,text),
  public.link_screening_programme_participant() to service_role;

-- Supply the legacy capture/correction RPCs absent from the verified production schema.
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

revoke all on function public.capture_screening_with_result(uuid, uuid, text, text, text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text, boolean, timestamptz) from public, anon, authenticated;
grant execute on function public.capture_screening_with_result(uuid, uuid, text, text, text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text, boolean, timestamptz) to service_role;
revoke all on function public.resubmit_screening_with_result(uuid, uuid, text, text, text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text, boolean, timestamptz) from public, anon, authenticated;
grant execute on function public.resubmit_screening_with_result(uuid, uuid, text, text, text, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text, boolean, timestamptz) to service_role;

commit;
