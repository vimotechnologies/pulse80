-- Minimal production-shaped schema for an isolated participants-screened test DB.
-- No live data, Supabase services, or row-level security policies are involved.
CREATE TABLE public.activations (
    id uuid PRIMARY KEY,
    organisation_id uuid NOT NULL,
    programme_id uuid NOT NULL
);
CREATE TABLE public.screenings (
    id uuid PRIMARY KEY,
    organisation_id uuid NOT NULL,
    activation_id uuid REFERENCES public.activations(id) ON DELETE SET NULL,
    participant_reference text NOT NULL
        CHECK (length(trim(participant_reference)) BETWEEN 2 AND 80),
    status text NOT NULL CHECK (
        status IN ('Draft', 'Under Review', 'Completed', 'Needs Correction')
    ),
    captured_at timestamptz NOT NULL
);
