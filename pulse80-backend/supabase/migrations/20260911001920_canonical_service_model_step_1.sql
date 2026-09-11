-- Step 1: canonical Pulse80 service model.
-- Keep legacy service_name/service_names columns during the transition so the
-- current frontend and GraphQL contract remain compatible. Application queries
-- move to service_id after generated Supabase types are refreshed.

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (length(trim(code)) >= 2),
  name text not null unique check (length(trim(name)) >= 2),
  category text,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.services enable row level security;
grant select on public.services to authenticated;
grant all on public.services to service_role;

drop policy if exists "Authenticated users can read active services" on public.services;
create policy "Authenticated users can read active services"
on public.services for select to authenticated
using (active = true);

insert into public.services (code, name, category) values
  ('BP', 'Blood Pressure Screening', 'General Health'),
  ('BMI', 'BMI / Body Composition', 'General Health'),
  ('GLUCOSE', 'Blood Glucose Screening', 'General Health'),
  ('CHOLESTEROL', 'Cholesterol Screening', 'General Health'),
  ('HIV', 'HIV Screening', 'General Health'),
  ('OPTICAL', 'Optical Screening', 'Vision'),
  ('DENTAL', 'Dental Screening', 'Oral Health'),
  ('AUDIOLOGY', 'Hearing Screening', 'Hearing'),
  ('PODIATRY', 'Podiatry Screening', 'Podiatry'),
  ('STRESS', 'Stress Assessment', 'Mental Wellness'),
  ('NUTRITION', 'Nutrition Assessment', 'Nutrition'),
  ('PHYSIO', 'Musculoskeletal Screening', 'Musculoskeletal'),
  ('HEALTH_SCREENING', 'Health screening', 'General Health'),
  ('OCCUPATIONAL_HEALTH', 'Occupational health', 'Occupational Health'),
  ('MUSCULOSKELETAL_RISK', 'Musculoskeletal risk assessment', 'Musculoskeletal'),
  ('INDUSTRIAL_ERGONOMICS', 'Industrial ergonomics assessment', 'Occupational Health'),
  ('WORK_CAPACITY', 'Work capacity assessment', 'Occupational Health')
on conflict (code) do nothing;

create table if not exists public.programme_services (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (programme_id, service_id)
);
create index if not exists programme_services_programme_idx on public.programme_services(programme_id);
create index if not exists programme_services_service_idx on public.programme_services(service_id);
alter table public.programme_services enable row level security;
grant select on public.programme_services to authenticated;
grant all on public.programme_services to service_role;

-- Programme-service writes and reads currently flow through the trusted backend.
-- A tenant-aware authenticated policy is added when programme service management
-- moves to direct user-scoped access.

-- Backfill the current programme text array without removing it yet.
insert into public.services (code, name, category)
select distinct
  'LEGACY_' || substr(md5(lower(trim(service_name))), 1, 12),
  trim(service_name),
  'Other'
from public.programmes p
cross join lateral unnest(p.service_names) service_name
where length(trim(service_name)) >= 2
  and not exists (
    select 1 from public.services s
    where lower(s.name) = lower(trim(service_name))
  );

insert into public.programme_services (programme_id, service_id)
select p.id, s.id
from public.programmes p
cross join lateral unnest(p.service_names) service_name
join public.services s on lower(s.name) = lower(trim(service_name))
on conflict (programme_id, service_id) do nothing;

alter table public.practitioner_capabilities
  add column if not exists service_id uuid references public.services(id) on delete restrict;
create index if not exists practitioner_capabilities_service_idx on public.practitioner_capabilities(service_id);

alter table public.practitioner_assignment_services
  add column if not exists service_id uuid references public.services(id) on delete restrict;
create index if not exists practitioner_assignment_services_service_idx on public.practitioner_assignment_services(service_id);

alter table public.practitioner_assignments
  add column if not exists service_id uuid references public.services(id) on delete restrict;
create index if not exists practitioner_assignments_service_idx on public.practitioner_assignments(service_id);

alter table public.screenings
  add column if not exists service_id uuid references public.services(id) on delete restrict;
create index if not exists screenings_service_idx on public.screenings(service_id);

-- Preserve every service already in production, including services not in the
-- initial catalogue. New services are rows, not schema changes.
insert into public.services (code, name, category)
select distinct
  'LEGACY_' || substr(md5(lower(trim(service_name))), 1, 12),
  trim(service_name),
  'Other'
from (
  select service_name from public.practitioner_capabilities
  union
  select service_name from public.practitioner_assignment_services
  union
  select service_name from public.practitioner_assignments
) existing_services
where service_name is not null
  and length(trim(service_name)) >= 2
  and not exists (
    select 1 from public.services s
    where lower(s.name) = lower(trim(existing_services.service_name))
  );

update public.practitioner_capabilities pc
set service_id = s.id
from public.services s
where pc.service_id is null
  and (lower(s.name) = lower(trim(pc.service_name)) or lower(s.code) = lower(trim(pc.service_code)));

update public.practitioner_assignment_services pas
set service_id = s.id,
    service_code = coalesce(pas.service_code, s.code)
from public.services s
where pas.service_id is null and lower(s.name) = lower(trim(pas.service_name));

update public.practitioner_assignments pa
set service_id = s.id
from public.services s
where pa.service_id is null and lower(s.name) = lower(trim(pa.service_name));

-- Existing screenings inherit the assignment's canonical service. This is safe
-- for current production data; future multi-service capture must send serviceId.
update public.screenings sc
set service_id = pa.service_id
from public.practitioner_assignments pa
where sc.assignment_id = pa.id and sc.service_id is null;
