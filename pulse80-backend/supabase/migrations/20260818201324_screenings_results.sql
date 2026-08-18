-- Pulse80 screening capture and clinical result workflow.
-- Individual records are deliberately not readable by organisation members.

create table public.screenings (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete restrict,
  activation_id uuid references public.activations(id) on delete set null,
  assignment_id uuid not null references public.practitioner_assignments(id) on delete restrict,
  practitioner_user_id uuid not null references public.practitioner_profiles(user_id) on delete restrict,
  participant_reference text not null check (length(trim(participant_reference)) between 2 and 80),
  department text,
  consent_confirmed boolean not null default false,
  status text not null default 'Draft'
    check (status in ('Draft', 'Submitted', 'Approved', 'Needs Correction')),
  practitioner_note text,
  captured_at timestamptz not null default now(),
  submitted_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status = 'Draft' or consent_confirmed),
  check ((status in ('Approved', 'Needs Correction') and reviewed_at is not null) or status in ('Draft', 'Submitted'))
);

create table public.screening_results (
  id uuid primary key default gen_random_uuid(),
  screening_id uuid not null unique references public.screenings(id) on delete cascade,
  systolic_mmhg integer check (systolic_mmhg between 40 and 300),
  diastolic_mmhg integer check (diastolic_mmhg between 20 and 200),
  glucose_mmol_l numeric(5,2) check (glucose_mmol_l between 0.5 and 50),
  cholesterol_mmol_l numeric(5,2) check (cholesterol_mmol_l between 0.5 and 30),
  height_cm numeric(5,2) check (height_cm between 50 and 260),
  weight_kg numeric(6,2) check (weight_kg between 2 and 500),
  bmi numeric(5,2) check (bmi between 5 and 100),
  risk_level text not null check (risk_level in ('Low', 'Medium', 'High', 'Incomplete')),
  escalation_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (systolic_mmhg is null or diastolic_mmhg is not null),
  check (diastolic_mmhg is null or systolic_mmhg is not null)
);

create index screenings_practitioner_captured_idx
  on public.screenings(practitioner_user_id, captured_at desc);
create index screenings_organisation_status_idx
  on public.screenings(organisation_id, status);
create index screenings_activation_idx
  on public.screenings(activation_id)
  where activation_id is not null;
create index screenings_assignment_idx
  on public.screenings(assignment_id);
create index screening_results_risk_idx
  on public.screening_results(risk_level);

create trigger screenings_set_updated_at
before update on public.screenings
for each row execute function public.set_updated_at();
create trigger screening_results_set_updated_at
before update on public.screening_results
for each row execute function public.set_updated_at();

alter table public.screenings enable row level security;
alter table public.screening_results enable row level security;

create policy "Practitioners can read own screenings"
on public.screenings for select to authenticated
using ((select auth.uid()) = practitioner_user_id);

create policy "Platform staff can read screenings"
on public.screenings for select to authenticated
using (public.is_platform_staff());

create policy "Practitioners can read own screening results"
on public.screening_results for select to authenticated
using (
  exists (
    select 1 from public.screenings screening
    where screening.id = screening_results.screening_id
      and screening.practitioner_user_id = (select auth.uid())
  )
);

create policy "Platform staff can read screening results"
on public.screening_results for select to authenticated
using (public.is_platform_staff());

revoke all on public.screenings from anon, authenticated;
revoke all on public.screening_results from anon, authenticated;
grant select on public.screenings to authenticated;
grant select on public.screening_results to authenticated;
grant all on public.screenings to service_role;
grant all on public.screening_results to service_role;
