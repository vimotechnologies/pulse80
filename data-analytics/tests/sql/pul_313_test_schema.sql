-- ============================================================
-- PUL-313 Screening Completion Analytics
-- Local PostgreSQL Test Schema
-- ============================================================
--
-- Purpose:
-- Provide the minimum production-shaped schema required to
-- test the Screening Completion Analytics view in a plain
-- PostgreSQL test database.
--
-- This is TEST INFRASTRUCTURE ONLY.
-- It is not a production migration.
--
-- Supabase-specific auth, storage and RLS objects are
-- intentionally excluded because they are not part of the
-- PUL-313 KPI calculation.
-- ============================================================


CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- Organisations
-- ============================================================

CREATE TABLE public.organisations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CHECK (length(trim(name)) >= 1),
    CHECK (slug = lower(slug))
);


-- ============================================================
-- Employees
-- ============================================================

CREATE TABLE public.employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    organisation_id uuid NOT NULL
        REFERENCES public.organisations(id)
        ON DELETE CASCADE,

    employee_number text NOT NULL,
    full_name text NOT NULL,
    email text,
    department text,

    status text NOT NULL DEFAULT 'active'
        CHECK (
            status IN (
                'active',
                'inactive'
            )
        ),

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    UNIQUE (
        organisation_id,
        employee_number
    )
);


-- ============================================================
-- Programmes
-- ============================================================

CREATE TABLE public.programmes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    organisation_id uuid NOT NULL
        REFERENCES public.organisations(id)
        ON DELETE CASCADE,

    name text NOT NULL
        CHECK (length(trim(name)) >= 2),

    description text,

    status text NOT NULL DEFAULT 'Planned'
        CHECK (
            status IN (
                'Planned',
                'Active',
                'Paused',
                'Completed',
                'Cancelled'
            )
        ),

    starts_on date NOT NULL,
    ends_on date NOT NULL,

    service_names text[] NOT NULL DEFAULT '{}',

    target_participants integer NOT NULL DEFAULT 0
        CHECK (target_participants >= 0),

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CHECK (ends_on >= starts_on),

    UNIQUE (
        id,
        organisation_id
    )
);


-- ============================================================
-- Programme Participants
-- ============================================================

CREATE TABLE public.programme_participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    programme_id uuid NOT NULL
        REFERENCES public.programmes(id)
        ON DELETE CASCADE,

    employee_id uuid NOT NULL
        REFERENCES public.employees(id)
        ON DELETE CASCADE,

    eligibility_status text NOT NULL DEFAULT 'Eligible'
        CHECK (
            eligibility_status IN (
                'Eligible',
                'Not Eligible'
            )
        ),

    registration_status text NOT NULL DEFAULT 'Registered'
        CHECK (
            registration_status IN (
                'Invited',
                'Registered',
                'Declined',
                'Withdrawn'
            )
        ),

    attendance_status text NOT NULL DEFAULT 'Not Attended'
        CHECK (
            attendance_status IN (
                'Not Attended',
                'Attended'
            )
        ),

    attended_at timestamptz,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    UNIQUE (
        programme_id,
        employee_id
    )
);


-- ============================================================
-- Services
-- ============================================================

CREATE TABLE public.services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    code text NOT NULL UNIQUE,
    name text NOT NULL,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- Programme Services
-- ============================================================

CREATE TABLE public.programme_services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    programme_id uuid NOT NULL
        REFERENCES public.programmes(id)
        ON DELETE CASCADE,

    service_id uuid NOT NULL
        REFERENCES public.services(id)
        ON DELETE RESTRICT,

    created_at timestamptz NOT NULL DEFAULT now(),

    UNIQUE (
        programme_id,
        service_id
    )
);


-- ============================================================
-- Programme Participant Required Services
-- ============================================================
--
-- This represents the PUL-313 schema addition.
--
-- The existence of a row means that the service is required
-- for that programme participant.
-- ============================================================

CREATE TABLE public.programme_participant_services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    programme_participant_id uuid NOT NULL
        REFERENCES public.programme_participants(id)
        ON DELETE CASCADE,

    programme_service_id uuid NOT NULL
        REFERENCES public.programme_services(id)
        ON DELETE CASCADE,

    created_at timestamptz NOT NULL DEFAULT now(),

    UNIQUE (
        programme_participant_id,
        programme_service_id
    )
);


-- ============================================================
-- Screenings
-- ============================================================
--
-- Only columns relevant to PUL-313 are included here.
--
-- The production table contains additional practitioner,
-- activation, consent and review information. Those fields do
-- not participate in the Screening Completion Rate formula.
-- ============================================================

CREATE TABLE public.screenings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    organisation_id uuid NOT NULL
        REFERENCES public.organisations(id)
        ON DELETE RESTRICT,

    programme_participant_id uuid
        REFERENCES public.programme_participants(id)
        ON DELETE RESTRICT,

    service_id uuid
        REFERENCES public.services(id)
        ON DELETE RESTRICT,

    participant_reference text NOT NULL,

    status text NOT NULL DEFAULT 'Draft'
        CHECK (
            status IN (
                'Draft',
                'Submitted',
                'Under Review',
                'Completed',
                'Needs Correction'
            )
        ),

    consent_confirmed boolean NOT NULL DEFAULT false,

    captured_at timestamptz NOT NULL DEFAULT now(),
    submitted_at timestamptz,
    reviewed_at timestamptz,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CHECK (
        status = 'Draft'
        OR consent_confirmed
    ),

    CHECK (
        (
            status IN (
                'Completed',
                'Needs Correction'
            )
            AND reviewed_at IS NOT NULL
        )
        OR status IN (
            'Draft',
            'Submitted',
            'Under Review'
        )
    )
);


-- ============================================================
-- Useful indexes
-- ============================================================

CREATE INDEX idx_programme_participants_programme
    ON public.programme_participants(programme_id);

CREATE INDEX idx_programme_services_programme
    ON public.programme_services(programme_id);

CREATE INDEX idx_participant_services_participant
    ON public.programme_participant_services(
        programme_participant_id
    );

CREATE INDEX idx_screenings_completion_lookup
    ON public.screenings(
        organisation_id,
        programme_participant_id,
        service_id,
        status
    );


-- Analytics views used by PUL-313, PUL-314 and PUL-316 tests.

create or replace view public.analytics_screening_participation
with (security_invoker = true)
as
with eligible_participants as (
    select distinct
        pp.id as programme_participant_id,
        p.organisation_id
    from public.programme_participants pp
    join public.programmes p
        on p.id = pp.programme_id
    where pp.eligibility_status = 'Eligible'
      and pp.registration_status = 'Registered'
),
screened_participants as (
    select distinct
        ep.organisation_id,
        ep.programme_participant_id
    from eligible_participants ep
    join public.screenings s
        on s.programme_participant_id = ep.programme_participant_id
       and s.organisation_id = ep.organisation_id
       and s.status = 'Completed'
)
select
    o.id as organisation_id,
    count(distinct ep.programme_participant_id) as eligible_participant_count,
    count(distinct sp.programme_participant_id) as screened_participant_count,
    case
        when count(distinct ep.programme_participant_id) = 0 then 0::numeric
        else round(
            count(distinct sp.programme_participant_id)::numeric
            / count(distinct ep.programme_participant_id)::numeric
            * 100,
            2
        )
    end as screening_participation_rate_pct
from public.organisations o
left join eligible_participants ep
    on ep.organisation_id = o.id
left join screened_participants sp
    on sp.organisation_id = ep.organisation_id
   and sp.programme_participant_id = ep.programme_participant_id
group by o.id;

comment on view public.analytics_screening_participation is
'Organisation-level screening participation among Eligible and Registered programme participants. A participant is screened once when at least one linked screening has Completed status.';

create or replace view public.analytics_screening_completion
with (security_invoker = true)
as
with required_screenings as (
    select distinct
        p.organisation_id,
        pp.id as programme_participant_id,
        ps.service_id
    from public.programme_participant_services pps
    join public.programme_participants pp
        on pp.id = pps.programme_participant_id
    join public.programme_services ps
        on ps.id = pps.programme_service_id
       and ps.programme_id = pp.programme_id
    join public.programmes p
        on p.id = pp.programme_id
    where pp.eligibility_status = 'Eligible'
      and pp.registration_status = 'Registered'
),
screening_status as (
    select
        rs.organisation_id,
        rs.programme_participant_id,
        rs.service_id,
        case when exists (
            select 1
            from public.screenings s
            where s.organisation_id = rs.organisation_id
              and s.programme_participant_id = rs.programme_participant_id
              and s.service_id = rs.service_id
              and s.status = 'Completed'
        ) then 1 else 0 end as is_completed
    from required_screenings rs
),
organisation_totals as (
    select
        organisation_id,
        count(*) as expected_required_screenings,
        sum(is_completed)::bigint as completed_required_screenings
    from screening_status
    group by organisation_id
)
select
    o.id as organisation_id,
    coalesce(t.expected_required_screenings, 0)::bigint as expected_required_screenings,
    coalesce(t.completed_required_screenings, 0)::bigint as completed_required_screenings,
    case
        when coalesce(t.expected_required_screenings, 0) = 0 then 0::numeric
        else round(
            t.completed_required_screenings::numeric
            / t.expected_required_screenings::numeric
            * 100,
            2
        )
    end as screening_completion_rate
from public.organisations o
left join organisation_totals t
    on t.organisation_id = o.id;

comment on view public.analytics_screening_completion is
'Organisation-level completion of required screenings. Requirements are participant-service pairs for Eligible and Registered programme participants. A pair is completed when at least one matching screening has Completed status.';
