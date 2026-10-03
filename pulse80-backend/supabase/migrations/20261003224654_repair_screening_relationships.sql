begin;

-- Repair both an older production schema and installations with the earlier migrations.
-- No roster entries, service aliases, or participant requirements are inferred.
alter table public.programme_participants add column if not exists screening_reference text;
create unique index if not exists programme_participants_screening_reference_key
  on public.programme_participants(programme_id, screening_reference) where screening_reference is not null;
create table if not exists public.programme_participant_services (
  id uuid primary key default gen_random_uuid(),
  programme_participant_id uuid not null references public.programme_participants(id) on delete cascade,
  programme_service_id uuid not null references public.programme_services(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(programme_participant_id, programme_service_id)
);
alter table public.programme_participant_services enable row level security;
revoke all on public.programme_participant_services from public, anon, authenticated;
grant select, insert, update, delete on public.programme_participant_services, public.programme_participants to service_role;
grant select on public.employees to service_role;
create index if not exists participant_services_service_idx on public.programme_participant_services(programme_service_id);
create index if not exists idx_screenings_completion_lookup on public.screenings(organisation_id, programme_participant_id, service_id, status);

-- Equality only, ignoring surrounding whitespace and letter case. Ambiguous matches return NULL.
create or replace function public.exact_service_id(label text) returns uuid
language sql stable security invoker set search_path = '' as $$
  select case when count(*) = 1 then (array_agg(s.id))[1] end
  from public.services s
  where lower(btrim(s.name)) = lower(btrim(label)) or lower(btrim(s.code)) = lower(btrim(label));
$$;
revoke all on function public.exact_service_id(text) from public, anon, authenticated;
grant execute on function public.exact_service_id(text) to service_role;

insert into public.programme_services(programme_id, service_id)
select distinct p.id, public.exact_service_id(label)
from public.programmes p cross join lateral unnest(p.service_names) label
where public.exact_service_id(label) is not null
on conflict(programme_id, service_id) do nothing;

update public.practitioner_assignments pa set service_id = public.exact_service_id(pa.service_name)
where pa.service_id is null and public.exact_service_id(pa.service_name) is not null;
update public.practitioner_assignment_services pas set service_id = public.exact_service_id(pas.service_name)
where pas.service_id is null and public.exact_service_id(pas.service_name) is not null
  and (pas.service_code is null or public.exact_service_id(pas.service_code) = public.exact_service_id(pas.service_name));

-- An organisation alone, a similar title, or an overlapping date is not an event match.
with matches as (
  select pa.id, (array_agg(a.id))[1] as activation_id
  from public.practitioner_assignments pa
  join public.activations a on a.organisation_id = pa.organisation_id
    and a.title = pa.activity_name and a.location = pa.location
    and a.starts_at = pa.starts_at and a.ends_at = pa.ends_at
  join public.programmes p on p.id = a.programme_id
    and p.organisation_id = pa.organisation_id and p.name = pa.programme_name
  where pa.activation_id is null
    and not exists(select 1 from public.screenings sc where sc.assignment_id=pa.id
      and (sc.organisation_id is distinct from pa.organisation_id
        or sc.practitioner_user_id is distinct from pa.practitioner_user_id
        or (sc.activation_id is not null and sc.activation_id<>a.id)))
  group by pa.id having count(*) = 1
)
update public.practitioner_assignments pa set activation_id = m.activation_id from matches m where pa.id = m.id;

create or replace function public.validate_programme_participant() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if not exists (select 1 from public.programmes p join public.employees e on e.organisation_id = p.organisation_id
    where p.id = new.programme_id and e.id = new.employee_id) then
    raise exception 'Participant and programme must belong to the same organisation.';
  end if;
  if new.screening_reference is not null and (new.screening_reference <> btrim(new.screening_reference)
    or length(new.screening_reference) not between 2 and 80) then raise exception 'Invalid participant code.'; end if;
  if tg_op='UPDATE' and new.programme_id is distinct from old.programme_id
    and exists(select 1 from public.programme_participant_services pps where pps.programme_participant_id=old.id) then
    raise exception 'Cannot move a participant with required services to another programme.';
  end if;
  if tg_op = 'UPDATE' and (new.programme_id, new.employee_id, new.screening_reference)
    is distinct from (old.programme_id, old.employee_id, old.screening_reference)
    and exists(select 1 from public.screenings s where s.programme_participant_id = old.id) then
    raise exception 'A participant with screenings cannot change programme, employee or code.';
  end if;
  return new;
end;
$$;
drop trigger if exists validate_programme_participant on public.programme_participants;
create trigger validate_programme_participant before insert or update on public.programme_participants
for each row execute function public.validate_programme_participant();

create or replace function public.validate_participant_service() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if not exists(select 1 from public.programme_participants pp
    join public.programme_services ps on ps.programme_id = pp.programme_id
    join public.programmes p on p.id = pp.programme_id
    join public.employees e on e.id = pp.employee_id and e.organisation_id = p.organisation_id
    where pp.id = new.programme_participant_id and ps.id = new.programme_service_id) then
    raise exception 'Required service must belong to the participant programme and organisation.';
  end if;
  return new;
end;
$$;
drop trigger if exists validate_participant_service on public.programme_participant_services;
create trigger validate_participant_service before insert or update on public.programme_participant_services
for each row execute function public.validate_participant_service();

-- Persist approved roster data and its explicit requirements atomically.
create or replace function public.save_programme_participant(
  p_programme_id uuid, p_employee_id uuid, p_screening_reference text,
  p_service_ids uuid[], p_eligibility_status text, p_registration_status text
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare participant_id uuid;
begin
  if p_screening_reference is null or length(btrim(p_screening_reference)) not between 2 and 80 then
    raise exception 'An approved participant code is required.';
  end if;
  if p_service_ids is null or exists(select 1 from unnest(p_service_ids) s where s is null or not exists(
    select 1 from public.programme_services ps where ps.programme_id = p_programme_id and ps.service_id = s)) then
    raise exception 'Required services must belong to this programme.';
  end if;
  insert into public.programme_participants(programme_id, employee_id, screening_reference, eligibility_status, registration_status)
    values(p_programme_id, p_employee_id, btrim(p_screening_reference), p_eligibility_status, p_registration_status)
    on conflict(programme_id, employee_id) do update set screening_reference = excluded.screening_reference,
      eligibility_status = excluded.eligibility_status, registration_status = excluded.registration_status
    returning id into participant_id;
  delete from public.programme_participant_services pps where pps.programme_participant_id = participant_id
    and not exists(select 1 from public.programme_services ps where ps.id = pps.programme_service_id and ps.service_id = any(p_service_ids));
  insert into public.programme_participant_services(programme_participant_id, programme_service_id)
    select participant_id, ps.id from public.programme_services ps where ps.programme_id = p_programme_id and ps.service_id = any(p_service_ids)
    on conflict(programme_participant_id, programme_service_id) do nothing;
  return participant_id;
end;
$$;
revoke all on function public.save_programme_participant(uuid,uuid,text,uuid[],text,text) from public,anon,authenticated;
grant execute on function public.save_programme_participant(uuid,uuid,text,uuid[],text,text) to service_role;

-- Keep the existing text-based programme API, but accept only exact catalogue names/codes.
-- The trigger makes the programme and relational services one transaction.
create or replace function public.sync_programme_services() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare service_ids uuid[];
begin
  if exists(select 1 from unnest(new.service_names) label where public.exact_service_id(label) is null) then
    raise exception 'Programme services must use exact catalogue names or codes.';
  end if;
  select coalesce(array_agg(distinct public.exact_service_id(label)), '{}'::uuid[]) into service_ids from unnest(new.service_names) label;
  if exists(select 1 from public.programme_services ps where ps.programme_id = new.id and not(ps.service_id = any(service_ids))
    and (exists(select 1 from public.programme_participant_services pps where pps.programme_service_id = ps.id)
      or exists(select 1 from public.screenings s join public.activations a on a.id = s.activation_id where a.programme_id = new.id and s.service_id = ps.service_id))) then
    raise exception 'Cannot remove a programme service with participant requirements or screenings.';
  end if;
  delete from public.programme_services ps where ps.programme_id = new.id and not(ps.service_id = any(service_ids));
  insert into public.programme_services(programme_id, service_id) select new.id, unnest(service_ids)
    on conflict(programme_id, service_id) do nothing;
  return new;
end;
$$;
drop trigger if exists sync_programme_services on public.programmes;
create trigger sync_programme_services after insert or update of service_names on public.programmes
for each row execute function public.sync_programme_services();

create or replace function public.link_screening_programme_participant()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare target_programme uuid; target_participant uuid; assignment_service uuid; assigned_services uuid[];
begin
  select a.programme_id, pa.service_id into target_programme, assignment_service
  from public.practitioner_assignments pa
  join public.activations a on a.id = pa.activation_id and a.organisation_id = pa.organisation_id
  join public.programmes p on p.id = a.programme_id and p.organisation_id = a.organisation_id
  where pa.id = new.assignment_id and pa.organisation_id = new.organisation_id
    and pa.activation_id = new.activation_id and pa.practitioner_user_id = new.practitioner_user_id;
  if target_programme is null then raise exception 'The screening assignment must belong to this organisation and programme activation.'; end if;
  new.participant_reference := btrim(new.participant_reference);
  select pp.id into target_participant from public.programme_participants pp
  join public.employees e on e.id = pp.employee_id and e.organisation_id = new.organisation_id
  where pp.programme_id = target_programme and pp.screening_reference = new.participant_reference;
  if target_participant is null then raise exception 'Participant code is not registered for this programme. Ask operations to check the participant list.'; end if;
  if new.programme_participant_id is not null and new.programme_participant_id <> target_participant
    and (tg_op = 'INSERT' or new.programme_participant_id is distinct from old.programme_participant_id) then
    raise exception 'Participant link does not match the programme and anonymous code.';
  end if;
  select array_agg(distinct service_id) into assigned_services from (
    select assignment_service as service_id union select pas.service_id from public.practitioner_assignment_services pas
    where pas.practitioner_assignment_id = new.assignment_id
  ) assigned where service_id is not null;
  if new.service_id is null then
    if cardinality(assigned_services) <> 1 or assigned_services is null then raise exception 'Choose a service for this assignment.'; end if;
    new.service_id := assigned_services[1];
  end if;
  if not coalesce(new.service_id = any(assigned_services), false) then raise exception 'This service is not part of the selected assignment.'; end if;
  if not exists(select 1 from public.programme_services ps where ps.programme_id = target_programme and ps.service_id = new.service_id
      and exists(select 1 from public.activations a cross join lateral unnest(a.service_names) label
        where a.id=new.activation_id and public.exact_service_id(label)=new.service_id)) then
    raise exception 'Choose a service configured for this programme.';
  end if;
  new.programme_participant_id := target_participant;
  return new;
end;
$$;
revoke all on function public.link_screening_programme_participant() from public,anon,authenticated;
grant execute on function public.link_screening_programme_participant() to service_role;
-- Replace the old trigger after conservative backfills; never force legacy rows through new capture validation.
drop trigger if exists link_screening_programme_participant on public.screenings;

-- Only fill missing fields when all existing context agrees. No records are deleted or reclassified.
with candidates as (
  select s.id, pa.activation_id, pp.id as participant_id,
    coalesce(s.service_id, (select case when count(distinct sid)=1 then (array_agg(distinct sid))[1] end from (
      select pa.service_id sid union select pas.service_id from public.practitioner_assignment_services pas where pas.practitioner_assignment_id=pa.id
    ) x where sid is not null)) as service_id
  from public.screenings s join public.practitioner_assignments pa on pa.id=s.assignment_id
    and pa.organisation_id=s.organisation_id and pa.practitioner_user_id=s.practitioner_user_id
  join public.activations a on a.id=pa.activation_id and a.organisation_id=s.organisation_id
  join public.programmes p on p.id=a.programme_id and p.organisation_id=s.organisation_id
  join public.programme_participants pp on pp.programme_id=p.id and pp.screening_reference=btrim(s.participant_reference)
  join public.employees e on e.id=pp.employee_id and e.organisation_id=s.organisation_id
  where (s.activation_id is null or s.activation_id=pa.activation_id)
    and (s.programme_participant_id is null or s.programme_participant_id=pp.id)
), reliable as (
  select c.* from candidates c join public.activations a on a.id=c.activation_id
  join public.programme_services ps on ps.programme_id=a.programme_id and ps.service_id=c.service_id
  join public.screenings s on s.id=c.id join public.practitioner_assignments pa on pa.id=s.assignment_id
  where (c.service_id=pa.service_id or exists(select 1 from public.practitioner_assignment_services pas where pas.practitioner_assignment_id=pa.id and pas.service_id=c.service_id))
    and exists(select 1 from unnest(a.service_names) label where public.exact_service_id(label)=c.service_id)
)
update public.screenings s set activation_id=coalesce(s.activation_id,r.activation_id),
  programme_participant_id=coalesce(s.programme_participant_id,r.participant_id), service_id=coalesce(s.service_id,r.service_id)
from reliable r where s.id=r.id and (s.activation_id is null or s.programme_participant_id is null or s.service_id is null);

create trigger link_screening_programme_participant before insert or update of participant_reference,
  programme_participant_id, assignment_id, activation_id, organisation_id, practitioner_user_id, service_id
on public.screenings for each row execute function public.link_screening_programme_participant();

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
  if event.id is null or event.organisation_id <> p_organisation_id or programme.organisation_id <> p_organisation_id then
    raise exception 'Choose an activation in the selected organisation.';
  end if;
  if p_starts_at < event.starts_at or p_ends_at is null or p_ends_at > event.ends_at or p_ends_at <= p_starts_at then
    raise exception 'Assignment dates must fall within the activation period.';
  end if;
  if coalesce(cardinality(p_service_ids),0)=0 or exists(select 1 from unnest(p_service_ids) sid where sid is null or not exists(
    select 1 from public.programme_services ps join public.services svc on svc.id=ps.service_id
    where ps.programme_id=event.programme_id and ps.service_id=sid and svc.active
      and exists(select 1 from unnest(event.service_names) label where public.exact_service_id(label)=sid)
  )) then raise exception 'Choose services configured for this activation and programme.'; end if;
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
-- The legacy writer omits canonical links and must no longer be used by the backend.
revoke execute on function public.save_practitioner_assignment(uuid,uuid,uuid,text,text,text,text[],text,text,timestamptz,timestamptz,text) from public,anon,authenticated,service_role;

create or replace function public.validate_assignment_links() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op='UPDATE' and (new.activation_id,new.organisation_id,new.practitioner_user_id,new.service_id)
    is distinct from (old.activation_id,old.organisation_id,old.practitioner_user_id,old.service_id)
    and exists(select 1 from public.screenings s where s.assignment_id=old.id) then
    raise exception 'Cannot change assignment links with existing screenings.';
  end if;
  if not exists(select 1 from public.activations a join public.programmes p on p.id=a.programme_id and p.organisation_id=a.organisation_id
    join public.programme_services ps on ps.programme_id=p.id and ps.service_id=new.service_id
    where a.id=new.activation_id and a.organisation_id=new.organisation_id
      and exists(select 1 from unnest(a.service_names) label where public.exact_service_id(label)=new.service_id)) then
    raise exception 'Assignments require an activation and service in the same organisation and programme.';
  end if;
  return new;
end;
$$;
drop trigger if exists validate_assignment_links on public.practitioner_assignments;
create trigger validate_assignment_links before insert or update of activation_id,service_id,organisation_id,practitioner_user_id
on public.practitioner_assignments for each row execute function public.validate_assignment_links();

-- Keep parent edits from moving already-linked records across organisations/programmes.
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
revoke all on function public.protect_employee_organisation() from public,anon,authenticated;
grant execute on function public.protect_employee_organisation() to service_role;
create or replace function public.protect_programme_service() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op='UPDATE' and (new.programme_id,new.service_id) is not distinct from (old.programme_id,old.service_id) then return new; end if;
  if exists(select 1 from public.programme_participant_services pps where pps.programme_service_id=old.id)
    or exists(select 1 from public.screenings s join public.activations a on a.id=s.activation_id
      where a.programme_id=old.programme_id and s.service_id=old.service_id)
    or exists(select 1 from public.practitioner_assignments pa join public.activations a on a.id=pa.activation_id
      where a.programme_id=old.programme_id and (pa.service_id=old.service_id or exists(
        select 1 from public.practitioner_assignment_services pas where pas.practitioner_assignment_id=pa.id and pas.service_id=old.service_id))) then
    raise exception 'Cannot change or remove a programme service used by requirements, assignments or screenings.';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
drop trigger if exists protect_programme_service on public.programme_services;
create trigger protect_programme_service before update or delete on public.programme_services
for each row execute function public.protect_programme_service();
revoke all on function public.protect_programme_organisation(),public.validate_activation_programme(),public.protect_programme_service() from public,anon,authenticated;
grant execute on function public.protect_programme_organisation(),public.validate_activation_programme(),public.protect_programme_service() to service_role;

-- Private trigger helpers: no callable API for browser roles.
revoke all on function public.validate_programme_participant(), public.validate_participant_service(), public.sync_programme_services(), public.validate_assignment_links() from public,anon,authenticated;
grant execute on function public.validate_programme_participant(), public.validate_participant_service(), public.sync_programme_services(), public.validate_assignment_links() to service_role;

-- PUL-316: connect the screening participation and completion analytics.
-- Both views return one aggregate row per organisation. The backend reads
-- these results; it does not recalculate the metrics.



create or replace view public.analytics_screening_participation
with (security_invoker = true)
as
with eligible_participants as (
    select distinct
        pp.id as programme_participant_id,
        p.organisation_id
    from public.programme_participants pp
    join public.programmes p
        on p.id = pp.programme_id
    join public.employees e on e.id = pp.employee_id and e.organisation_id = p.organisation_id
    where pp.eligibility_status = 'Eligible'
      and pp.registration_status = 'Registered'
),
screened_participants as (
    select distinct
        ep.organisation_id,
        ep.programme_participant_id
    from eligible_participants ep
    join public.screenings s
        on s.programme_participant_id = ep.programme_participant_id
       and s.organisation_id = ep.organisation_id
       and s.status = 'Completed'
)
select
    o.id as organisation_id,
    count(distinct ep.programme_participant_id) as eligible_participant_count,
    count(distinct sp.programme_participant_id) as screened_participant_count,
    case
        when count(distinct ep.programme_participant_id) = 0 then 0::numeric
        else round(
            count(distinct sp.programme_participant_id)::numeric
            / count(distinct ep.programme_participant_id)::numeric
            * 100,
            2
        )
    end as screening_participation_rate_pct
from public.organisations o
left join eligible_participants ep
    on ep.organisation_id = o.id
left join screened_participants sp
    on sp.organisation_id = ep.organisation_id
   and sp.programme_participant_id = ep.programme_participant_id
group by o.id;

comment on view public.analytics_screening_participation is
'Organisation-level screening participation among Eligible and Registered programme participants. A participant is screened once when at least one linked screening has Completed status.';

create or replace view public.analytics_screening_completion
with (security_invoker = true)
as
with required_screenings as (
    select distinct
        p.organisation_id,
        pp.id as programme_participant_id,
        ps.service_id
    from public.programme_participant_services pps
    join public.programme_participants pp
        on pp.id = pps.programme_participant_id
    join public.programme_services ps
        on ps.id = pps.programme_service_id
       and ps.programme_id = pp.programme_id
    join public.programmes p
        on p.id = pp.programme_id
    join public.employees e on e.id = pp.employee_id and e.organisation_id = p.organisation_id
    where pp.eligibility_status = 'Eligible'
      and pp.registration_status = 'Registered'
),
screening_status as (
    select
        rs.organisation_id,
        rs.programme_participant_id,
        rs.service_id,
        case when exists (
            select 1
            from public.screenings s
            where s.organisation_id = rs.organisation_id
              and s.programme_participant_id = rs.programme_participant_id
              and s.service_id = rs.service_id
              and s.status = 'Completed'
        ) then 1 else 0 end as is_completed
    from required_screenings rs
),
organisation_totals as (
    select
        organisation_id,
        count(*) as expected_required_screenings,
        sum(is_completed)::bigint as completed_required_screenings
    from screening_status
    group by organisation_id
)
select
    o.id as organisation_id,
    coalesce(t.expected_required_screenings, 0)::bigint as expected_required_screenings,
    coalesce(t.completed_required_screenings, 0)::bigint as completed_required_screenings,
    case
        when coalesce(t.expected_required_screenings, 0) = 0 then 0::numeric
        else round(
            t.completed_required_screenings::numeric
            / t.expected_required_screenings::numeric
            * 100,
            2
        )
    end as screening_completion_rate
from public.organisations o
left join organisation_totals t
    on t.organisation_id = o.id;

comment on view public.analytics_screening_completion is
'Organisation-level completion of required screenings. Requirements are participant-service pairs for Eligible and Registered programme participants. A pair is completed when at least one matching screening has Completed status.';

grant select on public.analytics_screening_participation to service_role;
grant select on public.analytics_screening_completion to service_role;



commit;
