alter table public.practitioner_registrations
  add column email text,
  add column account_status text not null default 'Awaiting Onboarding'
    check (account_status in ('Awaiting Onboarding', 'Active', 'Disabled')),
  add column invited_user_id uuid references auth.users(id) on delete set null,
  add column invited_at timestamptz;
create unique index practitioner_registrations_email_unique
  on public.practitioner_registrations (lower(email)) where email is not null;
create unique index practitioner_registrations_user_unique
  on public.practitioner_registrations (invited_user_id) where invited_user_id is not null;
alter table public.practitioner_registrations
  add constraint practitioner_registration_email_format
  check (email is null or email ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$');

grant update on public.practitioner_registrations to service_role;
