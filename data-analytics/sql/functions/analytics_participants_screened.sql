-- ---------------------------------------------------------------------------
-- Callable wrapper (optional convenience for the API/resolver layer)
-- Same logic as the parameterised query, packaged as a stable SQL function
-- so a GraphQL resolver can call
-- `select analytics_participants_screened($1,$2,$3,$4)` instead of inlining
-- the query text.
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
