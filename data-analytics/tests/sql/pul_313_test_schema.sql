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
                'Approved',
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
                'Approved',
                'Needs Correction'
            )
            AND reviewed_at IS NOT NULL
        )
        OR status IN (
            'Draft',
            'Submitted'
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