-- Practitioner professional workspace foundation.

create table public.practitioner_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  professional_email text not null,
  phone text,
  country text not null default 'Botswana',
  city text,
  preferred_contact_method text not null default 'Email'
    check (preferred_contact_method in ('Email', 'Phone', 'WhatsApp')),
  profession text not null,
  specialisation text,
  years_experience integer not null default 0 check (years_experience >= 0),
  qualifications text[] not null default '{}',
  registration_number text,
  registration_authority text,
  registration_country text,
  registration_expiry_date date,
  verification_status text not null default 'Pending Verification'
    check (verification_status in ('Verified', 'Under Review', 'Pending Verification', 'Expired', 'Action Required')),
  practitioner_status text not null default 'Pending Verification'
    check (practitioner_status in ('Active', 'Pending Verification', 'Suspended')),
  profile_photo_path text,
  assignment_notifications boolean not null default true,
  document_notifications boolean not null default true,
  payment_notifications boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.practitioner_capabilities (
  id uuid primary key default gen_random_uuid(),
  practitioner_user_id uuid not null references public.practitioner_profiles(user_id) on delete cascade,
  service_code text not null,
  service_name text not null,
  approval_status text not null default 'Pending'
    check (approval_status in ('Approved', 'Pending', 'Suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (practitioner_user_id, service_code)
);

create table public.practitioner_assignments (
  id uuid primary key default gen_random_uuid(),
  practitioner_user_id uuid not null references public.practitioner_profiles(user_id) on delete cascade,
  organisation_id uuid references public.organisations(id) on delete set null,
  programme_name text not null,
  activity_name text not null,
  service_name text not null,
  location text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  status text not null default 'Scheduled'
    check (status in ('Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'Action Required')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);

create table public.practitioner_documents (
  id uuid primary key default gen_random_uuid(),
  practitioner_user_id uuid not null references public.practitioner_profiles(user_id) on delete cascade,
  document_type text not null,
  file_name text not null,
  storage_path text not null unique,
  expiry_date date,
  verification_status text not null default 'Under Review'
    check (verification_status in ('Verified', 'Under Review', 'Expired', 'Action Required')),
  uploaded_at timestamptz not null default now(),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index practitioner_capabilities_user_idx
  on public.practitioner_capabilities(practitioner_user_id);
create index practitioner_assignments_user_start_idx
  on public.practitioner_assignments(practitioner_user_id, starts_at);
create index practitioner_documents_user_idx
  on public.practitioner_documents(practitioner_user_id);

create trigger practitioner_profiles_set_updated_at
before update on public.practitioner_profiles
for each row execute function public.set_updated_at();
create trigger practitioner_capabilities_set_updated_at
before update on public.practitioner_capabilities
for each row execute function public.set_updated_at();
create trigger practitioner_assignments_set_updated_at
before update on public.practitioner_assignments
for each row execute function public.set_updated_at();
create trigger practitioner_documents_set_updated_at
before update on public.practitioner_documents
for each row execute function public.set_updated_at();

alter table public.practitioner_profiles enable row level security;
alter table public.practitioner_capabilities enable row level security;
alter table public.practitioner_assignments enable row level security;
alter table public.practitioner_documents enable row level security;

create policy "Practitioners can read own professional profile"
on public.practitioner_profiles for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Practitioners can update own personal profile fields"
on public.practitioner_profiles for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Platform staff can read practitioner profiles"
on public.practitioner_profiles for select to authenticated
using (public.is_platform_staff());

create policy "Practitioners can read own capabilities"
on public.practitioner_capabilities for select to authenticated
using ((select auth.uid()) = practitioner_user_id);
create policy "Platform staff can read practitioner capabilities"
on public.practitioner_capabilities for select to authenticated
using (public.is_platform_staff());

create policy "Practitioners can read own assignments"
on public.practitioner_assignments for select to authenticated
using ((select auth.uid()) = practitioner_user_id);
create policy "Platform staff can read practitioner assignments"
on public.practitioner_assignments for select to authenticated
using (public.is_platform_staff());

create policy "Practitioners can read own documents"
on public.practitioner_documents for select to authenticated
using ((select auth.uid()) = practitioner_user_id);
create policy "Platform staff can read practitioner documents"
on public.practitioner_documents for select to authenticated
using (public.is_platform_staff());

revoke all on public.practitioner_profiles from anon, authenticated;
revoke all on public.practitioner_capabilities from anon, authenticated;
revoke all on public.practitioner_assignments from anon, authenticated;
revoke all on public.practitioner_documents from anon, authenticated;

grant select on public.practitioner_profiles to authenticated;
grant update (
  professional_email, phone, country, city, preferred_contact_method,
  specialisation, years_experience, qualifications, profile_photo_path,
  assignment_notifications, document_notifications, payment_notifications
) on public.practitioner_profiles to authenticated;
grant select on public.practitioner_capabilities to authenticated;
grant select on public.practitioner_assignments to authenticated;
grant select on public.practitioner_documents to authenticated;

grant all on public.practitioner_profiles to service_role;
grant all on public.practitioner_capabilities to service_role;
grant all on public.practitioner_assignments to service_role;
grant all on public.practitioner_documents to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('practitioner-profile-photos', 'practitioner-profile-photos', true, 2097152,
   array['image/png', 'image/jpeg', 'image/webp']),
  ('practitioner-verification-documents', 'practitioner-verification-documents', false, 5242880,
   array['application/pdf', 'image/png', 'image/jpeg'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Practitioners can read own private documents"
on storage.objects for select to authenticated
using (
  bucket_id = 'practitioner-verification-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "Practitioners can upload own workspace files"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('practitioner-profile-photos', 'practitioner-verification-documents')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "Practitioners can replace own workspace files"
on storage.objects for update to authenticated
using (
  bucket_id in ('practitioner-profile-photos', 'practitioner-verification-documents')
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id in ('practitioner-profile-photos', 'practitioner-verification-documents')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "Practitioners can remove own workspace files"
on storage.objects for delete to authenticated
using (
  bucket_id in ('practitioner-profile-photos', 'practitioner-verification-documents')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Seed the existing Naledi practitioner account with professional workspace data.
insert into public.practitioner_profiles (
  user_id, professional_email, phone, country, city, preferred_contact_method,
  profession, specialisation, years_experience, qualifications,
  registration_number, registration_authority, registration_country,
  registration_expiry_date, verification_status, practitioner_status
)
select
  u.id, u.email, '+267 71 234 567', 'Botswana', 'Gaborone', 'Email',
  'Registered Nurse', 'Occupational Health and Preventive Screening', 8,
  array['Bachelor of Nursing Science', 'Occupational Health Screening Certificate'],
  'BHPC-RN-10482', 'BHPC', 'Botswana', date '2027-11-30', 'Verified', 'Active'
from auth.users u
where lower(u.email) = 'naledi@goodhopeclinic.co.bw'
on conflict (user_id) do update set
  professional_email = excluded.professional_email,
  profession = excluded.profession,
  specialisation = excluded.specialisation,
  verification_status = excluded.verification_status,
  practitioner_status = excluded.practitioner_status;

update public.profiles
set full_name = 'Naledi Motsumi', phone = '+267 71 234 567'
where id = (select id from auth.users where lower(email) = 'naledi@goodhopeclinic.co.bw');

insert into public.practitioner_capabilities
  (practitioner_user_id, service_code, service_name, approval_status)
select u.id, capability.service_code, capability.service_name, 'Approved'
from auth.users u
cross join (values
  ('blood_pressure', 'Blood pressure screening'),
  ('glucose_testing', 'Glucose testing'),
  ('bmi_assessment', 'BMI assessment'),
  ('referral_consultation', 'Referral consultation')
) as capability(service_code, service_name)
where lower(u.email) = 'naledi@goodhopeclinic.co.bw'
on conflict (practitioner_user_id, service_code) do nothing;

insert into public.practitioner_assignments (
  practitioner_user_id, organisation_id, programme_name, activity_name,
  service_name, location, starts_at, ends_at, status
)
select
  u.id,
  (select id from public.organisations where name = 'Goodhope Clinic' limit 1),
  assignment.programme_name,
  assignment.activity_name,
  assignment.service_name,
  assignment.location,
  assignment.starts_at,
  assignment.ends_at,
  assignment.status
from auth.users u
cross join (values
  ('Workplace Wellness 2026', 'Preventive screening day', 'Blood pressure screening', 'Gaborone', timestamptz '2026-08-20 08:00:00+02', timestamptz '2026-08-20 13:00:00+02', 'Confirmed'),
  ('Workplace Wellness 2026', 'Metabolic health screening', 'Glucose testing', 'Lobatse', timestamptz '2026-08-27 09:00:00+02', timestamptz '2026-08-27 14:00:00+02', 'Scheduled'),
  ('Employee Health Follow-up', 'Clinical referral clinic', 'Referral consultation', 'Gaborone', timestamptz '2026-09-03 10:00:00+02', timestamptz '2026-09-03 15:00:00+02', 'Scheduled')
) as assignment(programme_name, activity_name, service_name, location, starts_at, ends_at, status)
where lower(u.email) = 'naledi@goodhopeclinic.co.bw';
