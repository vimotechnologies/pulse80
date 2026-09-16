-- ---------------------------------------------------------------------------
-- Correction to the existing summary view
-- analytics_screening_summary.participants_screened currently counts
-- DISTINCT participation_id with no status filter, so it (a) does not
-- match the person-grain definition above and (b) includes people whose
-- only screening record is not in the accepted-status list. Align it
-- with the same definition used above so every dashboard reads the same
-- number. completed_screening_events is left as-is; it already used the
-- correct, EDA-confirmed 'completed' value.
-- ---------------------------------------------------------------------------

create or replace view analytics_screeneing_summary as
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
