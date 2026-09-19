-- ============================================================
-- PUL-313: Screening Completion Analytics relationships
-- ============================================================

-- Link a screening to the programme participant it belongs to.
--
-- Nullable initially so existing screening records are not
-- broken during deployment.
alter table public.screenings
add column programme_participant_id uuid;

alter table public.screenings
add constraint screenings_programme_participant_id_fkey
foreign key (programme_participant_id)
references public.programme_participants(id)
on delete restrict;


-- Define the services required for each programme participant.
--
-- The existence of a row means:
--
--     this participant is required to complete this
--     programme service.
--
-- There is deliberately no is_required boolean.
create table public.programme_participant_services (
    id uuid primary key default gen_random_uuid(),

    programme_participant_id uuid not null
        references public.programme_participants(id)
        on delete cascade,

    programme_service_id uuid not null
        references public.programme_services(id)
        on delete cascade,

    created_at timestamptz not null default now(),

    unique (
        programme_participant_id,
        programme_service_id
    )
);


-- Participant-level screening requirements contain sensitive
-- workforce relationships, so RLS is enabled immediately.
alter table public.programme_participant_services
enable row level security;


-- Speed up joins from a participant to their required services.
create index
if not exists idx_programme_participant_services_participant
on public.programme_participant_services (
    programme_participant_id
);


-- Speed up the completion lookup used by the analytics view.
create index
if not exists idx_screenings_completion_lookup
on public.screenings (
    organisation_id,
    programme_participant_id,
    service_id,
    status
);


comment on table public.programme_participant_services is
'Defines the programme services required for each programme participant. Used as the denominator source for Screening Completion Rate analytics.';

comment on column public.screenings.programme_participant_id is
'Links a screening record to the programme participant whose screening was performed.';