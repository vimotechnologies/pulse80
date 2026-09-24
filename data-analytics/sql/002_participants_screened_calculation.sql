-- ---------------------------------------------------------------------------
-- A. Parameterised query (primary deliverable)
--    Intended to be called directly by the API layer with bind parameters.
--    Positional placeholders shown for a plain pg client; swap for named
--    parameters if your query layer prefers them.
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
    and lower(f.screening_status) in ('completed')
    and ($3::timestamptz is null or f.screened_at >= $3)
    and ($4::timestamptz is null or f.screened_at < $4);

-- ---------------------------------------------------------------------------
-- B. Callable wrapper (optional convenience for the API/resolver layer)
--    Same logic as (A), packaged as a stable SQL function so a GraphQL
--    resolver can call `select analytics_participants_screened($1,$2,$3,$4)`
--    instead of inlining the query text.
-- ---------------------------------------------------------------------------

create or replace function analytics_participants_screened(
    p_organisation_id uuid,
    p_programme_id    uuid default null,
    p_period_start    timestamptz default null,
    p_period_end      timestamptz default null
)
returns integer
language sql
stable
as $$
    select count(distinct f.employee_id)::integer
    from analytics_screening_facts f
    where f.organisation_id = p_organisation_id
      and (p_period_id is null or f.programme_id = p_programme_id)
      and lower(f.screening_status) in ('completed')
      and (p_period_start is null or f.screened_at >= p_period_start)
      and (p_period_end   is null or f.screened_at < p_period_end)
$$;

-- ---------------------------------------------------------------------------
-- C. Correction to the existing summary view
--    analytics_screening_summary.participants_screened currently counts
--    DISTINCT participation_id with no status filter, so it (a) does not
--    match the person-grain definition above and (b) includes people whose
--    only screening record is not in the accepted-status list. Align it
--    with the same definition used above so every dashboard reads the same
--    number. completed_screening_events is left as-is; it already used the
--    correct, EDA-confirmed 'completed' value.
-- ---------------------------------------------------------------------------
create or replace view analytics_screening_summary as 
select
    organisation_id,
    programme_id,
    count(distinct screening_id) as screening_events,
    count(distinct employee_id) filter (
        where lower(screening_status) in ('completed')
    ) as participants_screened,
    count(distinct screening_id) filter (
        where lower(screening_status) = 'completed'
    ) as completed_screening_events
from analytics_screening_facts
group by organisation_id, programme_id;