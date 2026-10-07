# Pulse80 EDA Consolidation Summary

## Purpose

This document closes the dataset-by-dataset EDA stage and consolidates the findings into one analytics view. It is based on the EDA notebooks and relationship map on the `analytics` branch.

## Stage conclusion

The EDA stage has established the main analytical chain:

`Organisation -> Branch / Department / Employee -> Programme -> Participation -> Programme Service -> Screening -> Measurement -> Risk Assessment -> Referral -> Follow Up`

The delivery side connects as:

`Provider -> Practitioner -> Screening`

The next stage is not more standalone EDA. It is metric validation and analytics implementation using the validated joins.

## Verified dataset grains and useful keys

| Dataset | Analytical grain / key | Main downstream use |
|---|---|---|
| Organisations | one organisation / `organisation_id` | tenant/client reporting |
| Branches | one branch / `branch_id` | branch segmentation |
| Departments | one department / `department_id` | department segmentation |
| Employees | one employee / `employee_id` | workforce denominator and segmentation |
| Programmes | one programme / `programme_id` | programme reporting |
| Programme Services | one programme-service mapping / `programme_service_id` | service scope per programme |
| Participations | one employee-programme participation / `participation_id` | attendance and programme reach |
| Providers | one provider / `provider_id` | delivery network reporting |
| Practitioners | one practitioner / `practitioner_id` | practitioner delivery reporting |
| Screenings | one screening event/service station / `screening_id` | screening volume and completion |
| Measurements | one `(screening_id, metric_code)` observation | health measurement analytics |
| Risk Assessments | one assessment per `screening_id` in the current data | risk distribution and referral need |
| Referrals | one referral / `referral_id`, linked by `risk_assessment_id` | referral funnel and SLA |
| Follow Ups | follow-up records linked by `referral_id` | referral follow-up coverage |

## Confirmed analytical facts from the current EDA outputs

- Employees contains 28 rows in the current dataset and carries `organisation_id`, `branch_id`, and `department_id`, giving the fields needed for organisation, branch, and department segmentation.
- Participations contains 28 rows and connects `employee_id` to `programme_id`; it also contains consent and attendance status fields.
- Screenings contains 144 rows. The screening EDA defines one row as one service/station screening event for one participation. It directly carries `participation_id`, `programme_service_id`, `practitioner_id`, `screened_at`, and `status`.
- Measurements contains 264 rows in long format. The natural analytical grain is `(screening_id, metric_code)`. Current examples include systolic BP, diastolic BP, pulse rate, height, weight, BMI, glucose, total cholesterol, stress score, and fitness score.
- Risk Assessments contains 144 rows and 144 unique `screening_id` values in the EDA output, supporting the current one-risk-assessment-per-screening relationship. Risk fields include `risk_level`, `risk_code`, `requires_referral`, `assessment_source`, and `rules_version`.
- The current Risk Assessment sample contains 37 records where `requires_referral = true` and 107 where it is false.
- Referrals contains 12 records. Its EDA reports no missing values, a clean unique `referral_id`, and a clean 1:1 link from each referral to a `risk_assessment_id`.
- All 12 referrals link to valid risk assessments and all 12 linked assessments have `requires_referral = true`.
- A material referral coverage gap exists: 37 risk assessments require referral, but only 12 referral records exist. Therefore 25 required referrals have no referral record in the current dataset.
- Referral status supports a basic funnel: 8 completed, 2 scheduled, and 2 issued in the current sample.
- Referral SLA fields are internally consistent in the EDA: priority referrals use a 14-day window and urgent referrals a 1-day window.
- Follow Ups contains 8 records in the referral EDA. All 8 link to valid referrals. All 8 completed referrals have a follow-up; the four issued/scheduled referrals do not yet have one.

## What the data can support now

The model can support operational metrics around registered employees, programme participation, screening volume, service delivery, practitioner activity, measurement distributions, risk distribution, referral need, referral creation, referral status, referral SLA, and follow-up coverage.

Organisation/branch/department reporting is structurally possible because employee records carry those identifiers and Participation connects employees to programmes. Final dashboard queries must still use the validated relationship map and join-key checks before production use.

## Important limitations

1. The current datasets are small and several EDA outputs describe them as seed/sample-like rather than a long-running production history. Current counts are suitable for validation, not business forecasting.
2. A screening row is a service/station event, not necessarily one unique person. Dashboard wording must distinguish `screenings completed` from `participants screened`.
3. Referral analytics has a known data-quality gap: 25 risk assessments marked `requires_referral = true` have no referral record.
4. Referrals do not directly carry employee IDs. Employee-level linkage requires the chain `Referral -> Risk Assessment -> Screening -> Participation -> Employee`.
5. Health indicator prevalence should use the stored/versioned risk model where possible. Do not invent new clinical thresholds in dashboard code.
6. Client-facing analytics should be aggregated. Employee-level health data is used for joining/calculation but should not be exposed when an aggregate answers the business question.

## Data engineering decision

EDA is considered complete enough to move to the analytics-definition stage. The immediate handoff is:

1. Use the KPI catalogue in `dashboard-kpi-catalogue.md`.
2. Validate the required joins against the relationship map.
3. Implement the first READY metrics as reusable analytics queries/views.
4. Expose approved aggregate metrics through the backend/API.
5. Connect those metrics to the dashboard and reconcile dashboard values back to the source data.
