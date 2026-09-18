WITH required_screenings AS (
    SELECT DISTINCT
        p.organisation_id,
        pp.id AS programme_participant_id,
        ps.service_id
    FROM public.programme_participant_services pps

    JOIN public.programme_participants pp
        ON pp.id = pps.programme_participant_id

    JOIN public.programme_services ps
        ON ps.id = pps.programme_service_id
        AND ps.programme_id = pp.programme_id

    JOIN public.programmes p
        ON p.id = pp.programme_id
)

SELECT *
FROM required_screenings;