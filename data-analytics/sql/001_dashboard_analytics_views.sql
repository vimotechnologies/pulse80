-- Production mapping v1. Apply AFTER all repository migrations, in a test DB first.
-- Internal backend query layer: never expose this schema through the Data API.
-- Authorise organisation access in the backend BEFORE selecting these views.
-- service_role bypasses RLS; an organisation filter is mandatory, not authorisation.
-- PostgreSQL >= 15. No application tables or production records are modified.
BEGIN;
CREATE SCHEMA IF NOT EXISTS analytics;
REVOKE ALL ON SCHEMA analytics FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA analytics TO service_role;

-- One row per screening. No guessed employee join or programme-name matching.
CREATE OR REPLACE VIEW analytics.screening_facts WITH (security_invoker = true) AS
SELECT s.id AS screening_id, s.organisation_id, s.activation_id, a.programme_id,
       s.assignment_id, s.practitioner_user_id, s.service_id,
       s.participant_reference, s.department, s.status AS screening_status,
       s.captured_at, s.reviewed_at,
       (pa.id IS NOT NULL AND pa.organisation_id = s.organisation_id
        AND pa.practitioner_user_id = s.practitioner_user_id
        AND pa.activation_id IS NOT DISTINCT FROM s.activation_id
        AND (s.activation_id IS NULL OR
             (a.id IS NOT NULL AND a.organisation_id = s.organisation_id
              AND p.organisation_id = s.organisation_id))) AS context_valid
FROM public.screenings s
LEFT JOIN public.practitioner_assignments pa ON pa.id = s.assignment_id
LEFT JOIN public.activations a ON a.id = s.activation_id
LEFT JOIN public.programmes p ON p.id = a.programme_id;

-- Activation grain preserves the approved participant-reference scope.
-- Do not sum distinct-person counts across activations as unique employees.
CREATE OR REPLACE VIEW analytics.screening_summary WITH (security_invoker = true) AS
SELECT organisation_id, programme_id, activation_id,
       count(*) AS screening_events,
       count(*) FILTER (WHERE screening_status = 'Approved') AS completed_screening_events,
       count(DISTINCT participant_reference) FILTER (
           WHERE screening_status = 'Approved'
             AND nullif(btrim(participant_reference), '') IS NOT NULL
       ) AS participants_screened
FROM analytics.screening_facts WHERE context_valid
GROUP BY organisation_id, programme_id, activation_id;

CREATE OR REPLACE VIEW analytics.employee_summary WITH (security_invoker = true) AS
SELECT o.id AS organisation_id, count(e.id) AS registered_employees,
       count(e.id) FILTER (WHERE e.status = 'active') AS active_employees
FROM public.organisations o LEFT JOIN public.employees e ON e.organisation_id = o.id
GROUP BY o.id;

-- Eligibility is independent of registration state. No target/workforce denominator.
CREATE OR REPLACE VIEW analytics.participation_summary WITH (security_invoker = true) AS
SELECT p.organisation_id, p.id AS programme_id,
       count(pp.id) FILTER (WHERE pp.registration_status = 'Registered') AS programme_participants,
       count(pp.id) FILTER (WHERE pp.eligibility_status = 'Eligible') AS eligible_participants,
       count(pp.id) FILTER (WHERE pp.eligibility_status = 'Eligible'
                                AND pp.attendance_status = 'Attended') AS attended_participants,
       round(100.0 * count(pp.id) FILTER (
                 WHERE pp.eligibility_status = 'Eligible' AND pp.attendance_status = 'Attended')
             / nullif(count(pp.id) FILTER (WHERE pp.eligibility_status = 'Eligible'), 0), 2)
           AS participation_rate_pct
FROM public.programmes p
LEFT JOIN (public.programme_participants pp
           JOIN public.employees e ON e.id = pp.employee_id)
    ON pp.programme_id = p.id AND e.organisation_id = p.organisation_id
GROUP BY p.organisation_id, p.id;

-- Outcome counts retain all workflow states; caller may filter via screening_facts.
CREATE OR REPLACE VIEW analytics.risk_summary WITH (security_invoker = true) AS
SELECT f.organisation_id, f.programme_id, f.activation_id,
       o.reporting_risk_category AS risk_level, count(*) AS assessment_count,
       count(*) FILTER (WHERE o.referral_required) AS referral_required_count
FROM public.screening_outcomes o
JOIN analytics.screening_facts f ON f.screening_id = o.screening_id
WHERE f.context_valid
GROUP BY f.organisation_id, f.programme_id, f.activation_id, o.reporting_risk_category;

-- Unique referrals.screening_id keeps this join at one row per outcome.
CREATE OR REPLACE VIEW analytics.referral_coverage WITH (security_invoker = true) AS
SELECT f.organisation_id, f.programme_id, f.activation_id,
       count(*) FILTER (WHERE o.referral_required) AS referral_required_count,
       count(r.id) FILTER (WHERE o.referral_required) AS referral_records_created,
       count(*) FILTER (WHERE o.referral_required AND r.id IS NULL) AS missing_required_referrals,
       round(100.0 * count(r.id) FILTER (WHERE o.referral_required)
           / nullif(count(*) FILTER (WHERE o.referral_required), 0), 2) AS referral_creation_coverage_pct
FROM public.screening_outcomes o
JOIN analytics.screening_facts f ON f.screening_id = o.screening_id
LEFT JOIN public.referrals r ON r.screening_id = o.screening_id
WHERE f.context_valid
GROUP BY f.organisation_id, f.programme_id, f.activation_id;

-- Funnel includes all real referrals, even when referral_required is false/missing.
CREATE OR REPLACE VIEW analytics.referral_status_funnel WITH (security_invoker = true) AS
SELECT f.organisation_id, f.programme_id, f.activation_id, r.status AS referral_status,
       count(*) AS referral_count,
       count(*) FILTER (WHERE EXISTS (
           SELECT 1 FROM public.referral_follow_ups u WHERE u.referral_id = r.id
       )) AS referrals_with_follow_up
FROM public.referrals r
JOIN analytics.screening_facts f ON f.screening_id = r.screening_id
WHERE f.context_valid
GROUP BY f.organisation_id, f.programme_id, f.activation_id, r.status;

-- Internal record-level exceptions; never send this view to a client dashboard.
CREATE OR REPLACE VIEW analytics.data_quality_exceptions WITH (security_invoker = true) AS
SELECT 'MISSING_REQUIRED_REFERRAL'::text AS exception_code,
       f.organisation_id, f.programme_id, f.activation_id,
       o.screening_id AS record_id, f.screening_id,
       'Required screening outcome has no referral record'::text AS reason
FROM public.screening_outcomes o
JOIN analytics.screening_facts f ON f.screening_id = o.screening_id
LEFT JOIN public.referrals r ON r.screening_id = o.screening_id
WHERE f.context_valid AND o.referral_required AND r.id IS NULL
UNION ALL
SELECT 'SCREENING_CONTEXT_MISMATCH', organisation_id, programme_id, activation_id,
       screening_id, screening_id, 'Assignment, practitioner, activation or programme context disagrees'
FROM analytics.screening_facts WHERE context_valid IS NOT TRUE
UNION ALL
SELECT 'MISSING_PARTICIPANT_REFERENCE', organisation_id, programme_id, activation_id,
       screening_id, screening_id, 'Screening has no usable participant reference'
FROM analytics.screening_facts WHERE nullif(btrim(participant_reference), '') IS NULL
UNION ALL
SELECT 'PARTICIPATION_ORGANISATION_MISMATCH', p.organisation_id, p.id, NULL::uuid,
       pp.id, NULL::uuid, 'Programme and employee belong to different organisations'
FROM public.programme_participants pp
JOIN public.programmes p ON p.id = pp.programme_id
JOIN public.employees e ON e.id = pp.employee_id
WHERE p.organisation_id <> e.organisation_id
UNION ALL
SELECT 'REFERRAL_WITHOUT_REQUIRED_OUTCOME', f.organisation_id, f.programme_id, f.activation_id,
       r.id, f.screening_id, 'Referral exists but outcome is missing or not marked referral-required'
FROM public.referrals r
JOIN analytics.screening_facts f ON f.screening_id = r.screening_id
LEFT JOIN public.screening_outcomes o ON o.screening_id = r.screening_id
WHERE f.context_valid AND o.referral_required IS DISTINCT FROM true;

REVOKE ALL ON ALL TABLES IN SCHEMA analytics FROM PUBLIC, anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO service_role;
-- Explicitly grant internal reads for the new support tables; RLS remains enabled.
GRANT SELECT ON public.programme_participants, public.referrals,
    public.referral_follow_ups TO service_role;
COMMIT;
