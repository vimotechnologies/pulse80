-- ---------------------------------------------------------------------------
-- Parameterised query (primary deliverable)
-- Intended to be called directly by the API layer with bind parameters.
-- Positional placeholders shown for a plain pg client; swap for named
-- parameters if your query layer prefers them.
-- ---------------------------------------------------------------------------
-- Parameters:
--   $1 organisation_id   uuid          (required)
--   $2 programme_id      uuid | null   (optional — null = all programmes)
--   $3 period_start      timestamptz | null (optional — null = no lower bound)
--   $4 period_end        timestamptz | null (optional — null = no upper bound)
--

select
    count(distinct f.employee_id) as particpants_screened
from analytics_screening_facts f
where f.organisation_id = $1
    and ($2::uuid is null or f.programme_id = $2)
    and lower(f.sceening_status) in ('completed')
    and ($3::timestamptz is null or f.screened_at >= $3)
    and ($4::timestamptz is null or f.screened_at < $4);
