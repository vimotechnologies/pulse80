-- Pulse80 analytics query layer
--
-- Purpose:
--   Canonical calculations for dashboard analytics after EDA.
--
-- Important:
--   These views target the analytics dataset/table contract documented in
--   data-analytics/docs. Before applying to Supabase, map analytics table and
--   column names to the production schema and keep tenant/RLS rules in place.
--
-- Do not calculate these metrics independently in frontend code.

-- 1. Screening grain
-- Keeps screening events separate from people/participants screened.
create or replace view analytics_screening_facts as
select
    s.screening_id,
    s.participation_id,
    s.programme_service_id,
    s.practitioner_id,
    s.status as screening_status,
    s.screened_at,
    p.employee_id,
    p.programme_id,
    e.organisation_id,
    e.branch_id,
    e.department_id
from screenings s
join participations p
  on p.participation_id = s.participation_id
join employees e
  on e.employee_id = p.employee_id;

-- 2. Organisation/programme screening summary
create or replace view analytics_screening_summary as
select
    organisation_id,
    programme_id,
    count(distinct screening_id) as screening_events,
    count(distinct participation_id) as participants_screened,
    count(distinct screening_id) filter (
        where lower(screening_status) = 'completed'
    ) as completed_screening_events
from analytics_screening_facts
group by organisation_id, programme_id;

-- 3. Risk summary
create or replace view analytics_risk_summary as
select
    f.organisation_id,
    f.programme_id,
    r.risk_level,
    count(distinct r.risk_assessment_id) as assessment_count,
    count(distinct r.risk_assessment_id) filter (
        where r.requires_referral = true
    ) as referral_required_count
from risk_assessments r
join analytics_screening_facts f
  on f.screening_id = r.screening_id
group by f.organisation_id, f.programme_id, r.risk_level;

-- 4. Referral coverage
-- LEFT JOIN is intentional: missing required referrals are an important
-- operational/data-quality result and must not disappear from the metric.
create or replace view analytics_referral_coverage as
select
    f.organisation_id,
    f.programme_id,
    count(distinct r.risk_assessment_id) filter (
        where r.requires_referral = true
    ) as referral_required_count,
    count(distinct ref.referral_id) filter (
        where r.requires_referral = true
    ) as referral_records_created,
    count(distinct r.risk_assessment_id) filter (
        where r.requires_referral = true and ref.referral_id is null
    ) as missing_required_referrals,
    round(
        100.0 * count(distinct ref.referral_id) filter (
            where r.requires_referral = true
        )
        / nullif(count(distinct r.risk_assessment_id) filter (
            where r.requires_referral = true
        ), 0),
        2
    ) as referral_creation_coverage_pct
from risk_assessments r
join analytics_screening_facts f
  on f.screening_id = r.screening_id
left join referrals ref
  on ref.risk_assessment_id = r.risk_assessment_id
group by f.organisation_id, f.programme_id;

-- 5. Referral status funnel
create or replace view analytics_referral_status_funnel as
select
    f.organisation_id,
    f.programme_id,
    ref.status as referral_status,
    count(distinct ref.referral_id) as referral_count
from referrals ref
join risk_assessments r
  on r.risk_assessment_id = ref.risk_assessment_id
join analytics_screening_facts f
  on f.screening_id = r.screening_id
group by f.organisation_id, f.programme_id, ref.status;

-- 6. Data-quality exceptions
create or replace view analytics_data_quality_exceptions as
select
    'MISSING_REQUIRED_REFERRAL'::text as exception_code,
    f.organisation_id,
    f.programme_id,
    r.risk_assessment_id as record_id,
    r.screening_id,
    'Risk assessment requires referral but no referral record exists'::text as reason
from risk_assessments r
join analytics_screening_facts f
  on f.screening_id = r.screening_id
left join referrals ref
  on ref.risk_assessment_id = r.risk_assessment_id
where r.requires_referral = true
  and ref.referral_id is null;
