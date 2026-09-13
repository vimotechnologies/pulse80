# Pulse80 Dashboard KPI Catalogue

## Purpose

This catalogue converts the completed EDA into explicit analytics definitions. A KPI marked READY is supported by the current dataset structure and can move to query/API implementation, subject to tenant/security controls and final join validation. CONDITIONAL means the metric is useful but its denominator, business rule, or data-quality issue must be resolved first.

## KPI catalogue

| KPI | Definition | Source / join path | Calculation | Status |
|---|---|---|---|---|
| Registered Employees | Employees represented in scope | Employees | `COUNT(DISTINCT employee_id)` | READY |
| Active Employees | Employees whose current status is active | Employees | distinct employees where `status = 'active'` | READY |
| Programme Participants | Unique employees with a participation record in a programme | Participations | `COUNT(DISTINCT employee_id)` grouped/filterable by `programme_id` | READY |
| Attended Participants | Unique employees whose participation says attended | Participations | distinct `employee_id` where `attendance_status = 'attended'` | READY |
| Participation Rate | Share of the eligible/target population that participated | Employees + Participations | participants / approved eligible employee denominator * 100 | CONDITIONAL: eligibility denominator must be agreed |
| Screening Events | Number of screening service/station events | Screenings | `COUNT(DISTINCT screening_id)` | READY |
| Completed Screening Events | Screening events with completed status | Screenings | distinct `screening_id` where `status = 'completed'` | READY |
| Participants Screened | Unique participants with at least one qualifying screening | Screenings | `COUNT(DISTINCT participation_id)` after approved screening-status filter | READY after final status rule confirmation |
| Screening Completion Rate | Completion of expected programme-service screenings | Participations + Programme Services + Screenings | completed qualifying screening events / expected participation-service events * 100 | CONDITIONAL: expected denominator and status rule must be agreed |
| Service Delivery Volume | Screening volume by service | Screenings -> Programme Services -> Services | screening count grouped by service | READY after join-key validation |
| Practitioner Screening Activity | Screening events delivered by practitioner | Screenings -> Practitioners | screening count grouped by `practitioner_id` | READY after join-key validation |
| Measurement Coverage | Number/share of screenings with expected measurements captured | Screenings -> Measurements | distinct screenings with valid measurement(s), by metric/service | CONDITIONAL: expected metrics per service must be defined |
| Measurement Distribution | Distribution of captured numeric health measurements | Measurements | aggregate valid `numeric_value` by `metric_code` and unit | READY for descriptive aggregate analytics |
| Risk Assessments | Number of risk assessments produced | Risk Assessments | `COUNT(DISTINCT risk_assessment_id)` | READY |
| Risk Level Distribution | Share/count of assessments by risk level | Risk Assessments | count and percentage grouped by `risk_level` | READY |
| Referral Required Count | Assessments where the rules engine says referral is required | Risk Assessments | count where `requires_referral = true` | READY |
| Referral Records Created | Number of referral records actually created | Referrals | `COUNT(DISTINCT referral_id)` | READY |
| Referral Creation Coverage | Required referrals that have a referral record | Risk Assessments -> Referrals | referrals linked to `requires_referral=true` assessments / all assessments requiring referral * 100 | READY, but current result exposes a data-quality gap |
| Missing Required Referrals | Required-referral assessments with no referral record | Risk Assessments LEFT JOIN Referrals | count required assessments with no matching referral | READY as a data-quality KPI |
| Referral Status Funnel | Referral volume by issued/scheduled/completed status | Referrals | count grouped by `status` | READY |
| Referral SLA Window | Time allowed between referral issue and due date | Referrals | `due_date - referred_at`, grouped by urgency | READY |
| Referral SLA Compliance | Referrals completed by due date | Referrals + Follow Ups | completed/closed timestamp compared with due date | CONDITIONAL: authoritative completion timestamp/rule must be confirmed |
| Follow-up Coverage | Referrals with at least one follow-up | Referrals -> Follow Ups | referrals with follow-up / applicable referrals * 100 | READY after applicable-status rule is agreed |
| Branch Breakdown | Any approved aggregate KPI segmented by branch | KPI path -> Participation -> Employee -> Branch | group approved KPI by `branch_id` | READY after join-key validation |
| Department Breakdown | Any approved aggregate KPI segmented by department | KPI path -> Participation -> Employee -> Department | group approved KPI by `department_id` | READY after join-key validation |
| Organisation Breakdown | Any approved aggregate KPI segmented by organisation | KPI path -> Participation -> Employee/Programme -> Organisation | group approved KPI by `organisation_id` | READY after tenant-safe join validation |

## Current baseline values that are directly supported by EDA outputs

These are validation baselines for the current sample, not long-term business KPIs:

- Registered employee rows: **28**.
- Participation rows: **28**.
- Screening events: **144**.
- Measurement observations: **264**.
- Risk assessments: **144**.
- Risk assessments requiring referral: **37**.
- Risk assessments not requiring referral: **107**.
- Referral records: **12**.
- Missing required referrals: **25** (`37 - 12`).
- Referral creation coverage: **32.43%** (`12 / 37 * 100`) in the current sample.
- Referral status: **8 completed, 2 scheduled, 2 issued**.
- Follow-up records: **8**; all eight completed referrals have a follow-up in the current EDA, while the four issued/scheduled referrals do not yet have one.

## Recommended first implementation set

Implement these first because their definitions are simple, useful, and supported by the current structure:

1. `registered_employees`
2. `programme_participants`
3. `screening_events`
4. `completed_screening_events`
5. `participants_screened`
6. `risk_level_distribution`
7. `referral_required_count`
8. `referral_creation_coverage`
9. `missing_required_referrals`
10. `referral_status_funnel`

The first end-to-end dashboard proof should be `participants_screened`, with `screening_events` shown separately so the platform never confuses people with service-level screening events.

## Rules for implementation

- Every metric must have one canonical definition; frontend code must not invent calculations independently.
- Counts of people should use distinct person/participation identifiers as defined above, not raw screening row counts.
- Use the validated relationship map for joins and fail tests when expected foreign-key coverage breaks.
- Health/risk metrics should use stored `risk_level`, `risk_code`, `requires_referral`, and `rules_version` rather than duplicating clinical rules in dashboard code.
- Filter by organisation/tenant before aggregation and expose only authorised aggregate results.
- Dashboard totals must be reconciled to analytics-query outputs in automated tests.
- Known data-quality failures such as missing required referrals should be surfaced as data-quality/operational exceptions, not silently excluded.

## Next handoff

Data engineering should now turn the first implementation set into reusable SQL/views or an analytics query layer. Backend engineering should expose those approved aggregates through GraphQL/API. Product/dashboard work should consume the API values without recalculating them in the frontend.
