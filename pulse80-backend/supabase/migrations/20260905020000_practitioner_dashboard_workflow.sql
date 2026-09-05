-- Practitioner dashboard workflow: multi-service assignments, responses,
-- assignment change alerts, and structured screening corrections.

alter table public.practitioner_assignments
  add column if not exists role_name text,
  add column if not exists responded_at timestamptz,
  add column if not exists response_reason text,
  add column if not exists withdrawal_urgent boolean not null default false;

alter table public.practitioner_assignments
  drop constraint if exists practitioner_assignments_status_check;

alter table public.practitioner_assignments
  add constraint practitioner_assignments_status_check
  check (status in (
    'Scheduled', 'Confirmed', 'Declined', 'Withdrawn',
    'In Progress', 'Completed', 'Cancelled', 'Action Required'
  ));

create table public.practitioner_assignment_services (
  id uuid primary key default gen_random_uuid(),
  practitioner_assignment_id uuid not null
    references public.practitioner_assignments(id) on delete cascade,
  service_code text,
  service_name text not null check (length(trim(service_name)) >= 2),
  created_at timestamptz not null default now(),
  unique (practitioner_assignment_id, service_name)
);

insert into public.practitioner_assignment_services (
  practitioner_assignment_id,
  service_name
)
select id, service_name
from public.practitioner_assignments
on conflict (practitioner_assignment_id, service_name) do nothing;

create table public.practitioner_assignment_responses (
  id uuid primary key default gen_random_uuid(),
  practitioner_assignment_id uuid not null
    references public.practitioner_assignments(id) on delete cascade,
  practitioner_user_id uuid not null
    references public.practitioner_profiles(user_id) on delete cascade,
  previous_status text not null,
  response_status text not null
    check (response_status in ('Confirmed', 'Declined', 'Withdrawn')),
  reason text,
  urgent boolean not null default false,
  responded_at timestamptz not null default now(),
  check (response_status = 'Confirmed' or length(trim(reason)) >= 2)
);

create table public.practitioner_assignment_alerts (
  id uuid primary key default gen_random_uuid(),
  practitioner_assignment_id uuid not null
    references public.practitioner_assignments(id) on delete cascade,
  practitioner_user_id uuid not null
    references public.practitioner_profiles(user_id) on delete cascade,
  change_type text not null
    check (change_type in ('Date', 'Time', 'Location', 'Services', 'Cancellation')),
  message text not null check (length(trim(message)) >= 2),
  urgent boolean not null default false,
  changed_at timestamptz not null default now(),
  acknowledged_at timestamptz
);

create table public.screening_correction_errors (
  id uuid primary key default gen_random_uuid(),
  screening_id uuid not null references public.screenings(id) on delete cascade,
  field_name text not null check (length(trim(field_name)) >= 1),
  message text not null check (length(trim(message)) >= 2),
  returned_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.screenings
  drop constraint if exists screenings_status_check;

alter table public.screenings
  add constraint screenings_status_check
  check (status in ('Draft', 'Submitted', 'Under Review', 'Approved', 'Needs Correction'));

alter table public.screenings
  drop constraint if exists screenings_check1;

alter table public.screenings
  add constraint screenings_review_state_check
  check (
    (status in ('Approved', 'Needs Correction') and reviewed_at is not null)
    or status in ('Draft', 'Submitted', 'Under Review')
  );

create index practitioner_assignment_services_assignment_idx
  on public.practitioner_assignment_services(practitioner_assignment_id);
create index practitioner_assignment_responses_assignment_idx
  on public.practitioner_assignment_responses(practitioner_assignment_id, responded_at desc);
create index practitioner_assignment_alerts_user_unread_idx
  on public.practitioner_assignment_alerts(practitioner_user_id, urgent desc, changed_at desc)
  where acknowledged_at is null;
create index screening_correction_errors_screening_open_idx
  on public.screening_correction_errors(screening_id, returned_at desc)
  where resolved_at is null;

alter table public.practitioner_assignment_services enable row level security;
alter table public.practitioner_assignment_responses enable row level security;
alter table public.practitioner_assignment_alerts enable row level security;
alter table public.screening_correction_errors enable row level security;

create policy "Practitioners can read own assigned services"
on public.practitioner_assignment_services for select to authenticated
using (
  exists (
    select 1 from public.practitioner_assignments assignment
    where assignment.id = practitioner_assignment_services.practitioner_assignment_id
      and assignment.practitioner_user_id = (select auth.uid())
  )
);
create policy "Platform staff can read assigned services"
on public.practitioner_assignment_services for select to authenticated
using (public.is_platform_staff());

create policy "Practitioners can read own assignment responses"
on public.practitioner_assignment_responses for select to authenticated
using ((select auth.uid()) = practitioner_user_id);
create policy "Platform staff can read assignment responses"
on public.practitioner_assignment_responses for select to authenticated
using (public.is_platform_staff());

create policy "Practitioners can read own assignment alerts"
on public.practitioner_assignment_alerts for select to authenticated
using ((select auth.uid()) = practitioner_user_id);
create policy "Platform staff can read assignment alerts"
on public.practitioner_assignment_alerts for select to authenticated
using (public.is_platform_staff());

create policy "Practitioners can read own correction errors"
on public.screening_correction_errors for select to authenticated
using (
  exists (
    select 1 from public.screenings screening
    where screening.id = screening_correction_errors.screening_id
      and screening.practitioner_user_id = (select auth.uid())
  )
);
create policy "Platform staff can read correction errors"
on public.screening_correction_errors for select to authenticated
using (public.is_platform_staff());

revoke all on public.practitioner_assignment_services from anon, authenticated;
revoke all on public.practitioner_assignment_responses from anon, authenticated;
revoke all on public.practitioner_assignment_alerts from anon, authenticated;
revoke all on public.screening_correction_errors from anon, authenticated;

grant select on public.practitioner_assignment_services to authenticated;
grant select on public.practitioner_assignment_responses to authenticated;
grant select on public.practitioner_assignment_alerts to authenticated;
grant select on public.screening_correction_errors to authenticated;

grant all on public.practitioner_assignment_services to service_role;
grant all on public.practitioner_assignment_responses to service_role;
grant all on public.practitioner_assignment_alerts to service_role;
grant all on public.screening_correction_errors to service_role;
