-- Fix: Participants Screened must follow dashboard-kpi-catalogue.md
--   "Unique participants with at least one successfully completed screening service"
--   (status = Completed, counted as distinct PEOPLE, not participations).
--
-- Previous logic: count(distinct participation_id) over ALL statuses, which
--   (a) counted people whose screenings were only Draft / Under Review / Needs Correction
--   (b) counted the same person twice if they had two participation rows.
--
-- Column names/order are unchanged, so CREATE OR REPLACE is safe.
-- Map table/column names to the production schema before applying (UUID keys etc.).
--
-- NOTE: a view runs with its owner's rights and bypasses RLS on the underlying
-- tables unless it is created WITH (security_invoker = true) (Postgres 15+).
-- Decide this deliberately as part of the tenant-isolation test.
--
-- NOTE: this view groups by organisation + programme. Do NOT sum
-- participants_screened across programmes for an organisation-level figure:
-- a person in two programmes would be counted twice. Use a separate
-- organisation-level distinct count instead.

create or replace view analytics_screening_summary as
select
    organisation_id,
    programme_id,
    count(distinct screening_id) as screening_events,
    count(distinct employee_id) filter (
        where lower(screening_status) = 'completed'
    ) as participants_screened,
    count(distinct screening_id) filter (
        where lower(screening_status) = 'completed'
    ) as completed_screening_events
from analytics_screening_facts
group by organisation_id, programme_id;
