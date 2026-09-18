-- Link screenings to their programme participant
alter table public.screenings
add column programme_participant_id uuid;

alter table public.screenings
add constraint screenings_programme_participant_id_fkey
foreign key (programme_participant_id)
references public.programme_participants(id)
on delete restrict;


-- Define the services required for each programme participant
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


-- Protect participant-level data
alter table public.programme_participant_services
enable row level security;