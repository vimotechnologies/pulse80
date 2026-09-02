-- Align Naledi's professional identity and assignments with physiotherapy work.

update public.practitioner_profiles
set
  profession = 'Physiotherapist',
  specialisation = 'Industrial Ergonomics, Musculoskeletal Risk & Work Capacity'
where user_id = (
  select id from auth.users where lower(email) = 'naledi@goodhopeclinic.co.bw'
);

update public.practitioner_specialisations
set name = 'Industrial Ergonomics', sort_order = 0
where practitioner_user_id = (
  select id from auth.users where lower(email) = 'naledi@goodhopeclinic.co.bw'
)
and name = 'Occupational health';

insert into public.practitioner_specialisations (practitioner_user_id, name, sort_order)
select user_id, specialisation.name, specialisation.sort_order
from public.practitioner_profiles
cross join (values
  ('Industrial Ergonomics', 0),
  ('Musculoskeletal Risk', 1),
  ('Work Capacity', 2)
) as specialisation(name, sort_order)
where professional_email = 'naledi@goodhopeclinic.co.bw'
on conflict (practitioner_user_id, name) do update
set sort_order = excluded.sort_order;

insert into public.organisations (name, slug, status, country)
values
  ('Ohman Construction Group', 'ohman-construction-group', 'Active', 'Botswana'),
  ('Quivertree Logistics', 'quivertree-logistics', 'Active', 'Botswana'),
  ('MSK Haulage', 'msk-haulage', 'Active', 'Botswana')
on conflict (slug) do update set name = excluded.name;

with ranked_assignments as (
  select
    assignment.id,
    row_number() over (order by assignment.starts_at, assignment.id) as assignment_order
  from public.practitioner_assignments assignment
  join auth.users practitioner on practitioner.id = assignment.practitioner_user_id
  where lower(practitioner.email) = 'naledi@goodhopeclinic.co.bw'
), desired_assignments as (
  select *
  from (values
    (1::bigint, 'ohman-construction-group', 'Musculoskeletal Wellness Screening', 'Onsite musculoskeletal screening', 'Musculoskeletal risk assessment', 'Gaborone', timestamptz '2026-09-03 08:00:00+02', timestamptz '2026-09-03 13:00:00+02', 'Confirmed'),
    (2::bigint, 'quivertree-logistics', 'Employee Fitness Challenge', 'Employee functional fitness assessment', 'Work capacity assessment', 'Lobatse', timestamptz '2026-09-10 09:30:00+02', timestamptz '2026-09-10 14:30:00+02', 'Scheduled'),
    (3::bigint, 'msk-haulage', 'Employee Fatigue Assessment', 'Fatigue and work-capacity review', 'Industrial ergonomics assessment', 'Francistown', timestamptz '2026-09-17 14:00:00+02', timestamptz '2026-09-17 17:00:00+02', 'Scheduled')
  ) as desired(assignment_order, organisation_slug, programme_name, activity_name, service_name, location, starts_at, ends_at, status)
)
update public.practitioner_assignments assignment
set
  organisation_id = organisation.id,
  programme_name = desired.programme_name,
  activity_name = desired.activity_name,
  service_name = desired.service_name,
  location = desired.location,
  starts_at = desired.starts_at,
  ends_at = desired.ends_at,
  status = desired.status
from ranked_assignments ranked
join desired_assignments desired on desired.assignment_order = ranked.assignment_order
join public.organisations organisation on organisation.slug = desired.organisation_slug
where assignment.id = ranked.id;
