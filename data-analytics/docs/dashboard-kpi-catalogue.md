# Pulse80 Dashboard KPI Catalogue

## Purpose

This catalogue converts the completed EDA and approved Product decisions into explicit analytics definitions. KPI formulas must be implemented once in the analytics/backend layer; the frontend displays the approved result and must not invent a different formula.

## Approved KPI catalogue

| KPI | Approved definition | Production calculation / source | Status |
|---|---|---|---|
| Registered Employees | Distinct employees registered under the organisation | `COUNT(DISTINCT employees.id)` | APPROVED |
| Active Employees | Distinct organisation employees whose current status is active | distinct `employees.id` where `status = 'active'` | APPROVED |
| Programme Participants | Distinct employees registered for a programme | distinct `employee_id` in `programme_participants` with an applicable registration state | APPROVED; schema support added |
| Attended Participants | Distinct eligible programme participants who actually attended | distinct `employee_id` where `eligibility_status = 'Eligible'` and `attendance_status = 'Attended'` | APPROVED; schema support added |
| Participation Rate | Percentage of employees eligible for a specific programme who actually attended | attended eligible participants / eligible programme participants * 100 | APPROVED; schema support added |
| Screening Events | Individual screening/service records | `COUNT(DISTINCT screenings.id)` | APPROVED |
| Completed Screening Events | Screening/service records that successfully passed the Pulse80 review workflow | distinct `screenings.id` where `status = 'Approved'` | APPROVED |
| Participants Screened | Unique participants with at least one successfully completed screening service | `COUNT(DISTINCT participant_reference)` where screening `status = 'Approved'`, scoped to organisation/activation | APPROVED |
| Screening Completion Rate | Completed required participant-service screenings as a percentage of expected required participant-service screenings | approved required screening events / expected required participant-service events * 100 | APPROVED; implementation must establish required participant-service combinations |
| Service Delivery Volume | Screening activity grouped by canonical service | approved/all screening count grouped by `service_id`, depending on reporting context | APPROVED |
| Practitioner Screening Activity | Screening events delivered by practitioner | screening count grouped by `practitioner_user_id` | APPROVED |
| Measurement Coverage | Share of expected service result fields captured for screening services | expected active/required `service_result_fields` compared with captured `screening_result_values` | APPROVED |
| Measurement Distribution | Aggregate distribution of captured health measurements | aggregate validated result values by service/result field | APPROVED for aggregate analytics |
| Risk Level Distribution | Count/share of screening outcomes by approved reporting risk category | group `screening_outcomes.reporting_risk_category`; legacy `screening_results.risk_level` must not create a competing definition | APPROVED |
| Referral Required Count | Screening outcomes where Pulse80 says referral is required | count `screening_outcomes` where `referral_required = true` | APPROVED |
| Referral Records Created | Required screening outcomes that have a referral record | count matching `referrals.id` | APPROVED; schema support added |
| Missing Required Referrals | Required screening outcomes without a referral record | `screening_outcomes LEFT JOIN referrals` and count required outcomes with no referral | APPROVED |
| Referral Creation Coverage | Share of required screening outcomes for which a referral was created | created required referrals / referral-required outcomes * 100 | APPROVED |
| Referral Status Funnel | Referral volume by workflow status | count referrals grouped by `status` | APPROVED |
| Referral SLA Compliance | Applicable referrals completed by their due time | completed applicable referrals with `completed_at <= due_at` / applicable due referrals * 100 | APPROVED; urgency/due-time policy must populate `due_at` consistently |
| Follow-up Coverage | Referrals that have reached the stage where follow-up is required and have at least one qualifying follow-up | distinct applicable referrals with follow-up / applicable referrals * 100 | APPROVED; follow-up applicability must follow the referral workflow |

## Product decisions approved on 14 September 2026

### Participation

- `Eligible Employees` means employees who qualify for the specific programme, not the organisation's entire workforce and not simply the programme target number.
- `Target Participants` is a planning target and is not the denominator for Participation Rate.
- `Attended Participants` means eligible programme participants whose attendance is recorded as attended.
- Participation Rate = Attended Eligible Participants / Eligible Programme Participants * 100.

### Screening

The production screening workflow uses `Draft`, `Submitted`, `Under Review`, `Approved`, and `Needs Correction`.

Only `Approved` means successfully completed for KPI purposes.

- Draft: not completed.
- Submitted: not completed.
- Under Review: not completed.
- Needs Correction: not completed.
- Approved: completed.

A participant is counted once in `Participants Screened` when they have at least one Approved screening service. Multiple services for the same participant increase Screening Events, not Participants Screened.

### Screening completion

Screening Completion Rate measures completion of required participant-service combinations. It must not blindly multiply every participant by every available service where a service is not required for that participant.

### Referral and follow-up

- Referral Required comes from `screening_outcomes.referral_required`.
- Referral Created requires an actual referral record; referral-required does not by itself mean a referral was created.
- Missing Required Referrals must remain visible as an operational/data-quality exception.
- A referral can have multiple follow-ups over time.

## Production schema findings

The live Supabase model differs from the CSV/EDA relationship model. Production uses UUID keys and includes direct organisation, activation, assignment, practitioner and service links on `screenings`. The production screening status workflow is also different from the EDA CSV terminology.

The approved analytics layer must therefore map to production entities rather than copy CSV table names literally.

A migration on the `analytics` branch adds:

- `programme_participants` for programme eligibility, registration and attendance;
- `referrals` for actual referral records;
- `referral_follow_ups` for one-to-many follow-up history.

## Implementation rules

- Every metric has one canonical definition.
- Frontend code must not recalculate canonical KPIs.
- Person counts use distinct participant/person identifiers, never raw screening-row counts.
- Tenant/organisation scope is applied before aggregation.
- Client-facing health analytics are aggregate unless an authorised workflow specifically requires an individual record.
- Risk analytics use the canonical stored reporting outcome; clinical rules are not duplicated in dashboard code.
- Source data, analytics query, API response and dashboard value must reconcile in tests.
- Data-quality exceptions are surfaced rather than silently removed.

## Next handoff

1. Review the KPI-support migration before applying it to Supabase.
2. Map/update the analytics SQL views to the live production schema.
3. Implement the first end-to-end KPI: `participants_screened`.
4. Expose the canonical analytics through GraphQL.
5. Reconcile database -> analytics -> API -> dashboard.
