-- Development-only client dashboard seed data.
-- Run this against a development Supabase project after migrations have run.
-- It creates aggregate-friendly data through the existing organisation,
-- programme, activation, assignment and screening tables. It is idempotent.

DO $$
DECLARE
  org record;
  assignment record;
  programme_id uuid;
  activation_id uuid;
  screening_id uuid;
  i integer;
  captured timestamptz;
  department_name text;
BEGIN
  FOR org IN
    SELECT id, coalesce(workforce_size, 0) AS workforce_size
    FROM public.organisations
    ORDER BY created_at
  LOOP
    SELECT pa.id, pa.practitioner_user_id
      INTO assignment
    FROM public.practitioner_assignments pa
    WHERE pa.organisation_id = org.id
    ORDER BY pa.created_at
    LIMIT 1;

    IF assignment.id IS NULL THEN
      CONTINUE;
    END IF;

    UPDATE public.organisations
    SET workforce_size = CASE WHEN org.workforce_size = 0 THEN 120 ELSE workforce_size END
    WHERE id = org.id;

    INSERT INTO public.programmes (
      organisation_id, name, description, status, starts_on, ends_on,
      service_names, target_participants
    )
    SELECT org.id, 'Dashboard preview wellness programme',
      'Development data for previewing client dashboard participation charts.',
      'Active', current_date - 90, current_date + 90,
      ARRAY['Blood pressure', 'BMI', 'Glucose'], 60
    WHERE NOT EXISTS (
      SELECT 1 FROM public.programmes p
      WHERE p.organisation_id = org.id
        AND p.name = 'Dashboard preview wellness programme'
    );

    SELECT p.id INTO programme_id
    FROM public.programmes p
    WHERE p.organisation_id = org.id
      AND p.name = 'Dashboard preview wellness programme'
    LIMIT 1;

    INSERT INTO public.activations (
      programme_id, organisation_id, title, description, location,
      starts_at, ends_at, expected_participants, service_names, status
    )
    SELECT programme_id, org.id, 'Dashboard preview screening day',
      'Development activity for previewing the client dashboard.',
      'Head office', now() + interval '14 days', now() + interval '14 days 6 hours',
      60, ARRAY['Blood pressure', 'BMI', 'Glucose'], 'Scheduled'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.activations a
      WHERE a.organisation_id = org.id
        AND a.title = 'Dashboard preview screening day'
    );

    SELECT a.id INTO activation_id
    FROM public.activations a
    WHERE a.organisation_id = org.id
      AND a.title = 'Dashboard preview screening day'
    LIMIT 1;

    FOR i IN 1..60 LOOP
      captured := now() - ((60 - i) % 9 || ' days')::interval;
      department_name := CASE (i % 4)
        WHEN 0 THEN 'Operations'
        WHEN 1 THEN 'Finance'
        WHEN 2 THEN 'Customer Support'
        ELSE 'Executive'
      END;

      INSERT INTO public.screenings (
        organisation_id, activation_id, assignment_id, practitioner_user_id,
        participant_reference, department, consent_confirmed, status,
        captured_at, submitted_at, reviewed_by, reviewed_at, review_note
      )
      SELECT org.id, activation_id, assignment.id, assignment.practitioner_user_id,
        'dashboard-demo-' || i, department_name, true, 'Approved',
        captured, captured + interval '1 hour', assignment.practitioner_user_id,
        captured + interval '2 hours', 'Development dashboard seed record'
      WHERE NOT EXISTS (
        SELECT 1 FROM public.screenings s
        WHERE s.organisation_id = org.id
          AND s.participant_reference = 'dashboard-demo-' || i
      )
      RETURNING id INTO screening_id;
    END LOOP;
  END LOOP;
END $$;
