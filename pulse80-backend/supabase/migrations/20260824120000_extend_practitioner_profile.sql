-- Extend practitioner onboarding details without changing existing practitioner rows.

alter table public.practitioner_profiles
  add column clinic_hospital text,
  add column district_province text;

create table public.practitioner_specialisations (
  id uuid primary key default gen_random_uuid(),
  practitioner_user_id uuid not null references public.practitioner_profiles(user_id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (practitioner_user_id, name)
);

create index practitioner_specialisations_user_idx
  on public.practitioner_specialisations(practitioner_user_id);

create trigger practitioner_specialisations_set_updated_at
before update on public.practitioner_specialisations
for each row execute function public.set_updated_at();

alter table public.practitioner_specialisations enable row level security;

create policy "Practitioners can read own specialisations"
on public.practitioner_specialisations for select to authenticated
using ((select auth.uid()) = practitioner_user_id);
create policy "Platform staff can read practitioner specialisations"
on public.practitioner_specialisations for select to authenticated
using (public.is_platform_staff());

revoke all on public.practitioner_specialisations from anon, authenticated;
grant select on public.practitioner_specialisations to authenticated;
grant all on public.practitioner_specialisations to service_role;

grant update (clinic_hospital, district_province)
  on public.practitioner_profiles to authenticated;

insert into public.practitioner_specialisations (practitioner_user_id, name)
select user_id, specialisation
from public.practitioner_profiles
where nullif(trim(specialisation), '') is not null
on conflict (practitioner_user_id, name) do nothing;
