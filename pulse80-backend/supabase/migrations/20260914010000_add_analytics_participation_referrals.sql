-- Pulse80 approved KPI support schema
-- Adds the missing production structures needed for programme participation,
-- referral tracking and follow-up analytics.

create table if not exists public.programme_participants (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  eligibility_status text not null default 'Eligible'
    check (eligibility_status in ('Eligible', 'Not Eligible')),
  registration_status text not null default 'Registered'
    check (registration_status in ('Invited', 'Registered', 'Declined', 'Withdrawn')),
  attendance_status text not null default 'Not Attended'
    check (attendance_status in ('Not Attended', 'Attended')),
  attended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (programme_id, employee_id)
);

comment on table public.programme_participants is
  'Programme-level employee eligibility, registration and attendance. Canonical source for participation KPIs.';

create index if not exists programme_participants_programme_idx
  on public.programme_participants(programme_id);
create index if not exists programme_participants_employee_idx
  on public.programme_participants(employee_id);

alter table public.programme_participants enable row level security;

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  screening_id uuid not null unique references public.screenings(id) on delete cascade,
  status text not null default 'Issued'
    check (status in ('Issued', 'Scheduled', 'Completed', 'Cancelled')),
  urgency text,
  referred_at timestamptz not null default now(),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.referrals is
  'Referral created from a screening outcome where referral_required is true.';

create index if not exists referrals_status_idx on public.referrals(status);

alter table public.referrals enable row level security;

create table if not exists public.referral_follow_ups (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.referrals(id) on delete cascade,
  followed_up_at timestamptz not null default now(),
  outcome text,
  notes text,
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.referral_follow_ups is
  'Follow-up history for referrals. A referral may have more than one follow-up.';

create index if not exists referral_follow_ups_referral_idx
  on public.referral_follow_ups(referral_id);

alter table public.referral_follow_ups enable row level security;

-- Approved KPI semantics:
-- Successfully completed screening = screenings.status = 'Approved'.
-- Participants Screened = distinct participant_reference with >= 1 Approved screening.
-- Completed Screening Events = distinct Approved screening records.
-- Participation Rate = attended eligible programme participants / eligible programme participants.
-- Referral Required = screening_outcomes.referral_required = true.
-- Referral Created = required screening outcome with a matching referrals row.
