-- ============================================================
-- Screening Completion Analytics
-- ============================================================
--
-- Purpose:
-- Calculate the percentage of required screenings that have
-- been completed for each organisation.
--
-- Completion formula:
--
--     completed required screenings
--     -----------------------------  x 100
--     expected required screenings
--
-- Business rules:
-- 1. Only Eligible participants are included.
-- 2. Only Registered participants are included.
-- 3. Only services specifically required for a participant
--    are included in the expected screening count.
-- 4. A required screening is completed only when there is
--    at least one matching screening with status = 'Approved'.
-- 5. Draft, Submitted, Under Review, Needs Correction, and
--    other non-Approved records do not count as completed.
-- 6. Multiple screening records for the same participant and
--    required service can contribute at most one completion.
-- 7. Screenings for services that were not required for the
--    participant do not affect this completion rate.
-- 8. Results are calculated separately for each organisation.
-- ============================================================


CREATE OR REPLACE VIEW public.analytics_screening_completion AS


WITH required_screenings AS (

    -- --------------------------------------------------------
    -- Find all expected required screenings.
    --
    -- Each row represents:
    --
    --     one participant + one required service
    --
    -- Only participants who are Eligible and Registered are
    -- expected to complete their required services.
    -- --------------------------------------------------------

    SELECT DISTINCT
        p.organisation_id,
        pp.id AS programme_participant_id,
        ps.service_id

    FROM public.programme_participant_services pps

    -- Find the programme participant who owns the requirement.
    JOIN public.programme_participants pp
        ON pp.id = pps.programme_participant_id

    -- Find the actual service configured for the programme.
    JOIN public.programme_services ps
        ON ps.id = pps.programme_service_id

        -- Protect against accidentally matching a participant
        -- to a service belonging to another programme.
        AND ps.programme_id = pp.programme_id

    -- The programme tells us which organisation owns the
    -- participant and therefore which organisation the
    -- requirement belongs to.
    JOIN public.programmes p
        ON p.id = pp.programme_id

    -- Only these participants contribute to expected screenings.
    WHERE pp.eligibility_status = 'Eligible'
      AND pp.registration_status = 'Registered'
),


screening_status AS (

    -- --------------------------------------------------------
    -- Check whether each required screening has been
    -- completed.
    --
    -- is_completed:
    --     1 = completed
    --     0 = not completed
    -- --------------------------------------------------------

    SELECT
        rs.organisation_id,
        rs.programme_participant_id,
        rs.service_id,

        -- EXISTS is used instead of counting screening records.
        --
        -- This means that even if several Approved records exist
        -- for the same participant and service, the requirement
        -- can contribute only one completion.
        CASE
            WHEN EXISTS (

                SELECT 1

                FROM public.screenings s

                WHERE s.organisation_id = rs.organisation_id

                  -- The screening must belong to the same
                  -- programme participant.
                  AND s.programme_participant_id =
                      rs.programme_participant_id

                  -- The screening must be for the required service.
                  AND s.service_id = rs.service_id

                  -- Only Approved means successfully completed.
                  AND s.status = 'Approved'
            )
            THEN 1
            ELSE 0
        END AS is_completed

    FROM required_screenings rs
)


-- ------------------------------------------------------------
-- Calculate the organisation-level completion rate.
-- ------------------------------------------------------------

SELECT
    organisation_id,

    -- Total number of required participant-service combinations.
    COUNT(*) AS expected_required_screenings,

    -- Number of those requirements that have an Approved screening.
    SUM(is_completed) AS completed_required_screenings,

    -- Completion percentage rounded to two decimal places.
    CASE
        WHEN COUNT(*) = 0 THEN 0

        ELSE ROUND(
            SUM(is_completed)::numeric
            / COUNT(*)::numeric
            * 100,
            2
        )
    END AS screening_completion_rate

FROM screening_status

-- Keep each organisation's calculation separate.
GROUP BY organisation_id;


-- Store the important business rules with the database view so
-- future developers can understand what this KPI represents.
COMMENT ON VIEW public.analytics_screening_completion IS
'Calculates screening completion by organisation. Expected screenings are required services assigned to Eligible and Registered programme participants. A requirement is completed when at least one matching screening has Approved status. Multiple screening records for the same participant-service requirement count as one completion.';