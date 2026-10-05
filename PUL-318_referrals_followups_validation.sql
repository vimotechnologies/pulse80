-- =============================================================================
-- PUL-318  Validate Referrals & Follow Ups metrics
-- Corrected analytics views, canonical KPI queries and verification checks
-- Target: PostgreSQL / Supabase (production schema)
-- =============================================================================
--
-- Source of truth for definitions: dashboard-kpi-catalogue.md
-- Replaces the referral/follow-up parts of 001_dashboard_analytics_views.sql
-- (that file used CSV-model names and joined referrals via risk_assessment_id;
--  production referrals link to screenings via referrals.screening_id).
--
-- ASSUMPTIONS TO CONFIRM BEFORE APPLYING (not visible in the files provided):
--   [A1] screenings has organisation_id and a screening timestamp. This file
--        calls it screened_at.
--   [A2] screening_outcomes is keyed by screening_id and holds
--        referral_required (boolean).
--   [A3] referrals(id, screening_id, status text, urgency text, referred_at,
--        due_at, completed_at) and
--        referral_follow_ups(id, referral_id, followed_up_at, outcome text,
--        next_follow_up_at) as shown in the Supabase screenshots.
--
-- DEFINITIONS THAT STILL NEED PRODUCT SIGN-OFF (flagged inline):
--   [D1] "applicable due referral" for SLA compliance
--   [D2] "applicable referral" for follow-up coverage
--   [D3] whether the Referral Records Created card shows
--        referral_records_created or required_with_referral
--
-- Scope rule used by every KPI query below:
--   organisation_id = :org_id
--   AND screened_at >= :from_ts AND screened_at < :to_ts   (half-open range)
--   :as_of is the "now" used for due / overdue logic.
--
-- Views use security_invoker so that Supabase RLS on the base tables applies to
-- the caller. Without it, Postgres views run with the owner's rights and bypass
-- RLS (requires PostgreSQL 15+).
--
-- This file is parsed by PUL-318_referrals_followups_validation.py, which runs
-- every @view, @query and @check section against a sample dataset.
-- Keep the "-- @view / -- @query / -- @check" marker lines intact.
-- =============================================================================


-- =============================================================================
-- 1. VIEWS
-- =============================================================================

-- @view analytics_referral_outcome_facts
-- Grain: one row per screening outcome. referral_rows counts referral records
-- per screening, so the grain stays correct even if one screening ever has
-- more than one referral (the technical spec says 1:many).
create or replace view analytics_referral_outcome_facts
with (security_invoker = true) as
select
    s.organisation_id,
    s.id as screening_id,
    s.screened_at,
    so.referral_required,
    (select count(*) from referrals r where r.screening_id = s.id) as referral_rows
from screenings s
join screening_outcomes so
  on so.screening_id = s.id;

-- @view analytics_referral_facts
-- Grain: one row per referral. status and urgency are normalised
-- (lower + trim) because production stores them as free text.
create or replace view analytics_referral_facts
with (security_invoker = true) as
select
    s.organisation_id,
    s.screened_at,
    r.id as referral_id,
    r.screening_id,
    lower(trim(r.status)) as referral_status,
    lower(trim(r.urgency)) as urgency,
    r.referred_at,
    r.due_at,
    r.completed_at
from referrals r
join screenings s
  on s.id = r.screening_id;

-- @view analytics_referral_data_quality_exceptions
-- Exceptions are surfaced, not silently excluded.
create or replace view analytics_referral_data_quality_exceptions
with (security_invoker = true) as
select
    'MISSING_REQUIRED_REFERRAL' as exception_code,
    'screening' as record_type,
    organisation_id,
    screening_id as record_id,
    'Referral required but no referral record exists' as reason
from analytics_referral_outcome_facts
where referral_required is true
  and referral_rows = 0
union all
select
    'REFERRAL_ON_NON_REQUIRED',
    'screening',
    organisation_id,
    screening_id,
    'Referral record exists but screening outcome does not require referral'
from analytics_referral_outcome_facts
where referral_required is not true
  and referral_rows > 0
union all
select
    'NULL_REFERRAL_REQUIRED_FLAG',
    'screening',
    organisation_id,
    screening_id,
    'referral_required is NULL, so the outcome is counted in no bucket'
from analytics_referral_outcome_facts
where referral_required is null
union all
select
    'COMPLETED_WITHOUT_COMPLETED_AT',
    'referral',
    organisation_id,
    referral_id,
    'Status is completed but completed_at is empty, so SLA cannot be evaluated'
from analytics_referral_facts
where referral_status = 'completed'
  and completed_at is null
union all
select
    'COMPLETED_AT_WITHOUT_COMPLETED_STATUS',
    'referral',
    organisation_id,
    referral_id,
    'completed_at is set but status is not completed'
from analytics_referral_facts
where referral_status <> 'completed'
  and completed_at is not null
union all
select
    'UNKNOWN_REFERRAL_STATUS',
    'referral',
    organisation_id,
    referral_id,
    'Status is outside issued / accepted / scheduled / completed / declined'
from analytics_referral_facts
where referral_status not in ('issued', 'accepted', 'scheduled', 'completed', 'declined')
union all
select
    'COMPLETED_REFERRAL_FOLLOWUP_OPEN',
    'referral',
    f.organisation_id,
    f.referral_id,
    'Referral is completed but its latest follow-up outcome is not completed'
from analytics_referral_facts f
where f.referral_status = 'completed'
  and exists (
        select 1
        from referral_follow_ups l
        where l.referral_id = f.referral_id
          and lower(trim(l.outcome)) <> 'completed'
          and not exists (
                select 1
                from referral_follow_ups later
                where later.referral_id = l.referral_id
                  and later.followed_up_at > l.followed_up_at
          )
  );


-- =============================================================================
-- 2. CANONICAL KPI QUERIES  (parameters: :org_id :from_ts :to_ts :as_of)
-- =============================================================================

-- @query kpi_referral_coverage
-- Referrals Required, Referrals Created, Missing Required Referrals,
-- Referral Creation Coverage. Counted at screening-outcome grain with the
-- required population as the denominator.
-- API mapping: referrals.required = referrals_required
--              referrals.created = required_with_referral        [D3]
--              referrals.missingRequired = missing_required
--              referrals.creationCoveragePercent = creation_coverage_pct
select
    count(*) filter (where referral_required is true)                          as referrals_required,
    count(*) filter (where referral_required is true and referral_rows > 0)    as required_with_referral,
    count(*) filter (where referral_required is true and referral_rows = 0)    as missing_required,
    sum(referral_rows) filter (where referral_required is true)                as referral_records_created,
    round(
        100.0 * count(*) filter (where referral_required is true and referral_rows > 0)
        / nullif(count(*) filter (where referral_required is true), 0),
        2
    )                                                                          as creation_coverage_pct,
    coalesce(sum(referral_rows) filter (where referral_required is not true), 0) as referrals_on_non_required,  -- expect 0
    count(*) filter (where referral_required is null)                          as null_required_flag            -- expect 0
from analytics_referral_outcome_facts
where organisation_id = :org_id
  and screened_at >= :from_ts
  and screened_at <  :to_ts;

-- @query kpi_referral_status_funnel
-- Referral Status Funnel: current-status snapshot, normalised, zero-count
-- statuses kept so the dashboard never drops a bucket.
with st(status) as (
    values ('issued'), ('accepted'), ('scheduled'), ('completed'), ('declined')
)
select
    st.status,
    count(x.referral_id) as referral_count
from st
left join (
    select referral_id, referral_status
    from analytics_referral_facts
    where organisation_id = :org_id
      and screened_at >= :from_ts
      and screened_at <  :to_ts
) x
  on x.referral_status = st.status
group by st.status
order by st.status;

-- @query kpi_referral_sla_compliance
-- Referral SLA Compliance = completed referrals with completed_at <= due_at
--                           / applicable due referrals * 100
-- [D1] applicable due referral = due_at is set, due_at <= :as_of, status is not
--      declined. Open referrals that are not yet due are excluded. Remove the
--      last predicate if declined referrals should stay in the denominator.
select
    count(*)                                                                  as applicable_due_referrals,
    count(*) filter (where completed_at is not null and completed_at <= due_at) as met_sla,
    count(*) filter (where completed_at is null)                              as open_past_due,
    count(*) filter (where completed_at > due_at)                             as completed_late,
    round(
        100.0 * count(*) filter (where completed_at <= due_at)
        / nullif(count(*), 0),
        2
    )                                                                         as sla_compliance_pct
from analytics_referral_facts
where organisation_id = :org_id
  and screened_at >= :from_ts
  and screened_at <  :to_ts
  and due_at is not null
  and due_at <= :as_of
  and referral_status <> 'declined';

-- @query kpi_followup_coverage
-- Follow-up Coverage = applicable referrals with at least one follow-up
--                      / applicable referrals * 100
-- [D2] applicable referral = status completed (interim, matches the EDA).
--      Widen the status filter if accepted / scheduled referrals also require
--      a follow-up. EXISTS keeps a referral with several follow-ups counted once.
select
    count(*) as applicable_referrals,
    count(*) filter (
        where exists (select 1 from referral_follow_ups f where f.referral_id = a.referral_id)
    ) as with_follow_up,
    count(*) filter (
        where exists (
            select 1
            from referral_follow_ups f
            where f.referral_id = a.referral_id
              and f.next_follow_up_at < :as_of
              and not exists (
                    select 1
                    from referral_follow_ups g
                    where g.referral_id = f.referral_id
                      and g.followed_up_at > f.followed_up_at
              )
        )
    ) as follow_up_chain_overdue,
    round(
        100.0 * count(*) filter (
            where exists (select 1 from referral_follow_ups f where f.referral_id = a.referral_id)
        ) / nullif(count(*), 0),
        2
    ) as follow_up_coverage_pct
from analytics_referral_facts a
where a.organisation_id = :org_id
  and a.screened_at >= :from_ts
  and a.screened_at <  :to_ts
  and a.referral_status = 'completed';


-- =============================================================================
-- 3. VERIFICATION CHECKS
--    Each check must return zero rows. Check H is informational.
-- =============================================================================

-- @check A_orphan_follow_ups
select f.id
from referral_follow_ups f
left join referrals r on r.id = f.referral_id
where r.id is null;

-- @check B_referrals_without_screening
select r.id
from referrals r
left join screenings s on s.id = r.screening_id
where s.id is null;

-- @check C_screenings_without_outcome
-- These screenings are silently excluded from every referral KPI above.
select s.id
from screenings s
left join screening_outcomes so on so.screening_id = s.id
where so.screening_id is null;

-- @check D_referral_time_logic
select id
from referrals
where due_at <= referred_at
   or completed_at < referred_at;

-- @check E_unknown_status_or_urgency
select id, status, urgency
from referrals
where lower(trim(status)) not in ('issued', 'accepted', 'scheduled', 'completed', 'declined')
   or lower(trim(urgency)) not in ('routine', 'priority', 'urgent');

-- @check F_completed_status_vs_completed_at
select id
from referrals
where (lower(trim(status)) = 'completed') <> (completed_at is not null);

-- @check G_follow_up_before_referral
select f.id
from referral_follow_ups f
join referrals r on r.id = f.referral_id
where f.followed_up_at < r.referred_at;

-- @check H_multiple_referrals_per_screening
-- Informational: shows whether the 1:many referral cardinality really occurs.
select screening_id, count(*) as referral_count
from referrals
group by screening_id
having count(*) > 1;
