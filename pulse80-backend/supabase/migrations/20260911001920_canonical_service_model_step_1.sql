create table public.services (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  category text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_code_not_blank check (btrim(code) <> ''),
  constraint services_name_not_blank check (btrim(name) <> ''),
  constraint services_category_not_blank check (btrim(category) <> '')
);

alter table public.services enable row level security;
revoke all on table public.services from anon;
revoke all on table public.services from authenticated;
grant select on table public.services to authenticated;
grant all on table public.services to service_role;

create policy "Authenticated users can read active services"
on public.services for select
to authenticated
using (active = true or public.is_platform_staff());

insert into public.services (code, name, category, description) values
('HEALTH_SCREENING','Health screening','General Health','General workforce health screening service.'),
('OCCUPATIONAL_HEALTH','Occupational health','Occupational Health','Occupational health assessment and support.'),
('INDUSTRIAL_ERGONOMICS','Industrial ergonomics assessment','Occupational Health','Assessment of workplace ergonomics and related risks.'),
('MUSCULOSKELETAL_RISK','Musculoskeletal risk assessment','Musculoskeletal','Assessment of musculoskeletal health and work-related risk.'),
('WORK_CAPACITY','Work capacity assessment','Occupational Health','Assessment of work capacity and functional ability.'),
('BP','Blood Pressure Screening','General Health','Blood pressure screening.'),
('BMI','BMI / Body Composition','General Health','Body mass index and body composition screening.'),
('GLUCOSE','Blood Glucose Screening','General Health','Blood glucose screening.'),
('CHOLESTEROL','Cholesterol Screening','General Health','Cholesterol screening.'),
('HIV','HIV Screening','General Health','HIV screening performed by an appropriately qualified practitioner.'),
('OPTICAL','Optical / Vision Screening','Vision','Vision and eye health screening.'),
('DENTAL','Dental Screening','Oral Health','Oral and dental health screening.'),
('AUDIOLOGY','Hearing Screening','Hearing','Hearing and audiology screening.'),
('PODIATRY','Podiatry Screening','Podiatry','Foot and podiatry screening.'),
('STRESS','Stress Assessment','Mental Wellness','Stress and mental wellness assessment.'),
('NUTRITION','Nutrition Assessment','Nutrition','Nutrition and dietary assessment.'),
('PHYSIO','Musculoskeletal Screening','Musculoskeletal','Physiotherapy-led musculoskeletal screening.')
on conflict (code) do nothing;

create table public.programme_services (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(programme_id, service_id)
);

create index programme_services_programme_idx on public.programme_services(programme_id);
create index programme_services_service_idx on public.programme_services(service_id);

alter table public.programme_services enable row level security;
revoke all on table public.programme_services from anon;
revoke all on table public.programme_services from authenticated;
grant select on table public.programme_services to authenticated;
grant all on table public.programme_services to service_role;

create policy "Authorised users can read programme services"
on public.programme_services for select
to authenticated
using (
  exists (
    select 1 from public.programmes p
    where p.id = programme_services.programme_id
      and (public.is_organisation_member(p.organisation_id) or public.is_platform_staff())
  )
);

insert into public.programme_services (programme_id, service_id)
select p.id, s.id
from public.programmes p
cross join lateral unnest(p.service_names) as existing_service_name
join public.services s on lower(btrim(s.name)) = lower(btrim(existing_service_name))
on conflict (programme_id, service_id) do nothing;

alter table public.practitioner_capabilities
  add column service_id uuid references public.services(id) on delete restrict;

update public.practitioner_capabilities pc
set service_id = s.id
from public.services s
where lower(btrim(s.name)) = lower(btrim(pc.service_name))
   or lower(btrim(s.code)) = lower(btrim(pc.service_code));

create index practitioner_capabilities_service_idx on public.practitioner_capabilities(service_id);

alter table public.practitioner_assignment_services
  add column service_id uuid references public.services(id) on delete restrict;

update public.practitioner_assignment_services pas
set service_id = s.id
from public.services s
where lower(btrim(s.name)) = lower(btrim(pas.service_name))
   or (pas.service_code is not null and lower(btrim(s.code)) = lower(btrim(pas.service_code)));

create index practitioner_assignment_services_service_idx on public.practitioner_assignment_services(service_id);

alter table public.practitioner_assignments
  add column service_id uuid references public.services(id) on delete restrict;

update public.practitioner_assignments pa
set service_id = s.id
from public.services s
where lower(btrim(s.name)) = lower(btrim(pa.service_name));

create index practitioner_assignments_service_idx on public.practitioner_assignments(service_id);

alter table public.screenings
  add column service_id uuid references public.services(id) on delete restrict;

update public.screenings sc
set service_id = pa.service_id
from public.practitioner_assignments pa
where pa.id = sc.assignment_id
  and pa.service_id is not null;

create index screenings_service_idx on public.screenings(service_id);

comment on table public.services is 'Canonical catalogue of services Pulse80 can offer and practitioners can perform.';
comment on table public.programme_services is 'Services included in a Pulse80 programme.';
comment on column public.screenings.service_id is 'The specific service performed for this screening. Nullable during the compatibility transition.';
comment on column public.practitioner_capabilities.service_id is 'Canonical service the practitioner is capable or approved to perform.';
comment on column public.practitioner_assignment_services.service_id is 'Canonical service assigned to the practitioner.';
comment on column public.practitioner_assignments.service_id is 'Compatibility link for assignments that currently represent one primary service.';;
