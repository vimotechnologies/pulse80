-- Persist canonical service IDs whenever an assignment is created or updated.
-- Legacy service_name/service_names inputs remain supported so existing admin,
-- GraphQL, CSV and historical data flows continue to work during transition.

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
  primary_service_id uuid;
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

  -- Every newly selected service must already exist in the canonical catalogue.
  -- This deliberately prevents silently creating new service definitions from typos.
  if exists (
    select 1
    from unnest(next_services) selected(service_name)
    where not exists (
      select 1
      from public.services s
      where s.active = true
        and (
          lower(trim(s.name)) = lower(trim(selected.service_name))
          or lower(trim(s.code)) = lower(trim(selected.service_name))
        )
    )
  ) then
    raise exception 'One or more selected services are not in the active Pulse80 service catalogue.';
  end if;

  select s.id
  into primary_service_id
  from public.services s
  where s.active = true
    and (
      lower(trim(s.name)) = lower(trim(p_service_name))
      or lower(trim(s.code)) = lower(trim(p_service_name))
    )
  limit 1;

  if primary_service_id is null then
    -- Keep the legacy primary label meaningful, but never invent a canonical ID.
    select s.id
    into primary_service_id
    from unnest(next_services) selected(service_name)
    join public.services s
      on s.active = true
     and (
       lower(trim(s.name)) = lower(trim(selected.service_name))
       or lower(trim(s.code)) = lower(trim(selected.service_name))
     )
    order by selected.service_name
    limit 1;
  end if;

  if p_assignment_id is null then
    insert into public.practitioner_assignments (
      practitioner_user_id, organisation_id, programme_name, activity_name,
      service_name, service_id, role_name, location, starts_at, ends_at, status
    ) values (
      p_practitioner_user_id, p_organisation_id, p_programme_name, p_activity_name,
      p_service_name, primary_service_id, p_role_name, p_location, p_starts_at, p_ends_at, p_status
    ) returning id into assignment_id;

    insert into public.practitioner_assignment_services (
      practitioner_assignment_id, service_id, service_code, service_name
    )
    select assignment_id, s.id, s.code, s.name
    from unnest(next_services) selected(service_name)
    join public.services s
      on s.active = true
     and (
       lower(trim(s.name)) = lower(trim(selected.service_name))
       or lower(trim(s.code)) = lower(trim(selected.service_name))
     );

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
      service_id = primary_service_id,
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

  insert into public.practitioner_assignment_services (
    practitioner_assignment_id, service_id, service_code, service_name
  )
  select p_assignment_id, s.id, s.code, s.name
  from unnest(next_services) selected(service_name)
  join public.services s
    on s.active = true
   and (
     lower(trim(s.name)) = lower(trim(selected.service_name))
     or lower(trim(s.code)) = lower(trim(selected.service_name))
   );

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

revoke all on function public.save_practitioner_assignment(uuid, uuid, uuid, text, text, text, text[], text, text, timestamptz, timestamptz, text)
from public, anon, authenticated;
grant execute on function public.save_practitioner_assignment(uuid, uuid, uuid, text, text, text, text[], text, text, timestamptz, timestamptz, text)
to service_role;
