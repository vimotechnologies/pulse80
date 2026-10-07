begin;

-- Codes are supplied by the approved programme roster. Never infer them from
-- employee numbers or create eligibility/requirements from screening activity.
alter table public.programme_participants add column screening_reference text
  check (screening_reference is null or
    (screening_reference = btrim(screening_reference) and length(screening_reference) between 2 and 80));
create unique index programme_participants_screening_reference_key
  on public.programme_participants (programme_id, screening_reference)
  where screening_reference is not null;

create function public.link_screening_programme_participant()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  target_programme uuid;
  target_participant uuid;
  assignment_service uuid;
begin
  select a.programme_id, pa.service_id into target_programme, assignment_service
  from public.practitioner_assignments pa
  join public.activations a on a.id = pa.activation_id
    and a.organisation_id = pa.organisation_id
  where pa.id = new.assignment_id
    and pa.organisation_id = new.organisation_id
    and pa.activation_id = new.activation_id
    and pa.practitioner_user_id = new.practitioner_user_id;
  if target_programme is null then
    raise exception 'The screening assignment must belong to this organisation and programme activation.';
  end if;

  new.participant_reference := btrim(new.participant_reference);
  select pp.id into target_participant
  from public.programme_participants pp
  join public.employees e on e.id = pp.employee_id
    and e.organisation_id = new.organisation_id
  where pp.programme_id = target_programme
    and pp.screening_reference = new.participant_reference;
  if target_participant is null then
    raise exception 'Participant code is not registered for this programme. Ask operations to check the participant list.';
  end if;
  if new.programme_participant_id is not null
    and new.programme_participant_id <> target_participant
    and (tg_op = 'INSERT' or new.programme_participant_id is distinct from old.programme_participant_id) then
    raise exception 'Participant link does not match the programme and anonymous code.';
  end if;
  new.programme_participant_id := target_participant;
  new.service_id := coalesce(new.service_id, assignment_service);
  if new.service_id is null or not exists (
    select 1 from public.programme_services ps
    where ps.programme_id = target_programme and ps.service_id = new.service_id
  ) then
    raise exception 'Choose a service configured for this programme.';
  end if;
  return new;
end;
$$;

revoke all on function public.link_screening_programme_participant() from public, anon, authenticated;
grant execute on function public.link_screening_programme_participant() to service_role;
grant select on public.employees to service_role;

create trigger link_screening_programme_participant
before insert or update of participant_reference, programme_participant_id,
  assignment_id, activation_id, organisation_id, practitioner_user_id, service_id
on public.screenings for each row
execute function public.link_screening_programme_participant();

comment on column public.programme_participants.screening_reference is
  'Anonymous screening code from the approved programme roster. Unique within a programme; never inferred from employee numbers.';

commit;
