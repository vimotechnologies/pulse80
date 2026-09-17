CREATE OR REPLACE VIEW analytics_screening_completion AS
WITH required_screenings AS (
    SELECT DISTINCT
        pp.organisation_id,
        pp.participant_id,
        ps.service_id
    FROM programme_participants pp
    JOIN programme_services ps
        ON ps.programme_id = pp.programme_id
    WHERE ps.is_required = TRUE
),

screening_status AS (
    SELECT
        rs.organisation_id,
        rs.participant_id,
        rs.service_id,
        CASE
            WHEN EXISTS (
                SELECT 1
                FROM screenings s
                WHERE s.organisation_id = rs.organisation_id
                  AND s.participant_id = rs.participant_id
                  AND s.service_id = rs.service_id
                  AND s.status = 'Approved'
            )
            THEN 1
            ELSE 0
        END AS is_completed
    FROM required_screenings rs
)

SELECT
    organisation_id,
    COUNT(*) AS expected_required_screenings,
    SUM(is_completed) AS completed_required_screenings,
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
GROUP BY organisation_id;