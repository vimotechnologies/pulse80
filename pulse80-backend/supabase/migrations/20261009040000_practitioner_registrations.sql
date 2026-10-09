-- Store practitioner registrations before account invitation and verification.
create table if not exists public.practitioner_registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) between 2 and 160),
  profession text not null check (char_length(trim(profession)) between 2 and 120),
  country text not null check (char_length(trim(country)) between 2 and 100),
  city text not null check (char_length(trim(city)) between 2 and 120),
  capabilities text[] not null check (cardinality(capabilities) between 1 and 30),
  verification_status text not null default 'Pending Verification'
    check (verification_status = 'Pending Verification'),
  created_at timestamptz not null default now()
);
alter table public.practitioner_registrations enable row level security;
revoke all on public.practitioner_registrations from anon, authenticated;
grant select, insert on public.practitioner_registrations to service_role;
