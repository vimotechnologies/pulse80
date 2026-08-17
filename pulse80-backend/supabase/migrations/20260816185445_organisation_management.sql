-- Organisation administration foundation.

alter table public.organisations
  add column if not exists code text,
  add column if not exists industry text,
  add column if not exists country text,
  add column if not exists primary_location text,
  add column if not exists region text,
  add column if not exists package_name text,
  add column if not exists contract_start date,
  add column if not exists contract_end date,
  add column if not exists status text not null default 'Prospect',
  add column if not exists wellness_risk_score integer not null default 0,
  add column if not exists logo_path text,
  add column if not exists custom_package_notes text;

alter table public.organisations
  drop constraint if exists organisations_code_not_blank,
  add constraint organisations_code_not_blank
    check (code is null or length(trim(code)) > 0),
  drop constraint if exists organisations_workforce_size_nonnegative,
  add constraint organisations_workforce_size_nonnegative
    check (workforce_size is null or workforce_size >= 0),
  drop constraint if exists organisations_contract_dates_valid,
  add constraint organisations_contract_dates_valid
    check (contract_start is null or contract_end is null or contract_end >= contract_start),
  drop constraint if exists organisations_status_check,
  add constraint organisations_status_check
    check (status in ('Prospect', 'Onboarding', 'Active', 'Paused', 'Contract Expired', 'Archived')),
  drop constraint if exists organisations_wellness_risk_score_check,
  add constraint organisations_wellness_risk_score_check
    check (wellness_risk_score between 0 and 100);

create unique index if not exists organisations_code_unique_idx
  on public.organisations (lower(code))
  where code is not null;

create table public.organisation_contacts (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null
    references public.organisations(id) on delete cascade,
  full_name text not null,
  role_label text not null,
  email text not null,
  phone text,
  preferred_method text not null default 'Email',
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organisation_contacts_name_not_blank check (length(trim(full_name)) > 0),
  constraint organisation_contacts_role_not_blank check (length(trim(role_label)) > 0),
  constraint organisation_contacts_email_not_blank check (length(trim(email)) > 0),
  constraint organisation_contacts_method_check
    check (preferred_method in ('Email', 'Phone', 'WhatsApp', 'Portal'))
);

create index organisation_contacts_organisation_id_idx
  on public.organisation_contacts (organisation_id);

create unique index organisation_contacts_one_primary_idx
  on public.organisation_contacts (organisation_id)
  where is_primary;

create trigger organisation_contacts_set_updated_at
before update on public.organisation_contacts
for each row execute function public.set_updated_at();

alter table public.organisation_contacts enable row level security;

create policy "Authorised users can read organisation contacts"
on public.organisation_contacts
for select
to authenticated
using (
  public.is_organisation_member(organisation_id)
  or public.is_platform_staff()
);

create policy "Platform administrators can create organisation contacts"
on public.organisation_contacts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.platform_staff_memberships staff
    where staff.user_id = (select auth.uid())
      and staff.role in ('super_admin', 'operations')
  )
);

create policy "Platform administrators can update organisation contacts"
on public.organisation_contacts
for update
to authenticated
using (
  exists (
    select 1
    from public.platform_staff_memberships staff
    where staff.user_id = (select auth.uid())
      and staff.role in ('super_admin', 'operations')
  )
)
with check (
  exists (
    select 1
    from public.platform_staff_memberships staff
    where staff.user_id = (select auth.uid())
      and staff.role in ('super_admin', 'operations')
  )
);

drop policy if exists "Platform administrators can create organisations"
on public.organisations;
create policy "Platform administrators can create organisations"
on public.organisations
for insert
to authenticated
with check (
  exists (
    select 1
    from public.platform_staff_memberships staff
    where staff.user_id = (select auth.uid())
      and staff.role in ('super_admin', 'operations')
  )
);

drop policy if exists "Platform administrators can update organisations"
on public.organisations;
create policy "Platform administrators can update organisations"
on public.organisations
for update
to authenticated
using (
  exists (
    select 1
    from public.platform_staff_memberships staff
    where staff.user_id = (select auth.uid())
      and staff.role in ('super_admin', 'operations')
  )
)
with check (
  exists (
    select 1
    from public.platform_staff_memberships staff
    where staff.user_id = (select auth.uid())
      and staff.role in ('super_admin', 'operations')
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'organisation-logos',
  'organisation-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Platform administrators can upload organisation logos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'organisation-logos'
  and exists (
    select 1
    from public.platform_staff_memberships staff
    where staff.user_id = (select auth.uid())
      and staff.role in ('super_admin', 'operations')
  )
);

create policy "Platform administrators can replace organisation logos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'organisation-logos'
  and exists (
    select 1
    from public.platform_staff_memberships staff
    where staff.user_id = (select auth.uid())
      and staff.role in ('super_admin', 'operations')
  )
)
with check (
  bucket_id = 'organisation-logos'
  and exists (
    select 1
    from public.platform_staff_memberships staff
    where staff.user_id = (select auth.uid())
      and staff.role in ('super_admin', 'operations')
  )
);

create policy "Platform administrators can remove organisation logos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'organisation-logos'
  and exists (
    select 1
    from public.platform_staff_memberships staff
    where staff.user_id = (select auth.uid())
      and staff.role in ('super_admin', 'operations')
  )
);
