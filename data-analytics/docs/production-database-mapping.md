# Production database mapping and test handoff

## Scope and evidence

This mapping implements the approved 14 September KPI catalogue against the application schema. It supersedes the CSV join path for application implementation. The EDA notebooks remain evidence about the CSV sample, not production SQL specifications.

Sources checked: the `develop` migrations through `20260914010000_add_analytics_participation_referrals.sql` and a read-only inspection of the Pulse80 public schema. The live project had `services`, `screening_result_values` and `screening_outcomes`, but did not yet have `programme_participants`, `referrals` or `referral_follow_ups`. No live records were read or changed for these tests. The full migration chain must be applied in a test environment before the analytics SQL.

The mapping is an engineering implementation for review; it is not evidence that Jabu has signed off or tested it. Product definitions remain owned by the KPI catalogue.

## Schema drift found during replay

The repository creates `employees.full_name` and a free-text `department`; the live table instead has `first_name` and `last_name` and no department column. These analytics queries use only `id`, `organisation_id` and `status`, which exist in both. Synthetic inserts follow the repository migrations. Reconcile that wider schema drift before a live deployment or CSV import; do not assume this suite certifies every live table matches git.

## Exact entity mapping

| EDA concept | Application source and join | Grain / treatment |
|---|---|---|
| Organisation | `organisations.id`; child `organisation_id` | One organisation; required query scope |
| Employee | `employees.id`, `employees.organisation_id` | One registered employee; active means `status = 'active'` |
| Participation | `programme_participants.id`, `.employee_id -> employees.id`, `.programme_id -> programmes.id` | One employee per programme; reject and flag cross-organisation pairs |
| Programme | `programmes.id`, `.organisation_id` | One programme |
| Programme service | `programme_services.programme_id`, `.service_id -> services.id` | Catalogue of programme offerings, NOT required services for every participant |
| Activation | `screenings.activation_id -> activations.id -> activations.programme_id -> programmes.id` | Explicit programme linkage; no join on names; nullable activation remains unassigned |
| Screening | `screenings.id`, `.organisation_id`, `.captured_at`, `.status` | One screening/service event |
| Participant identity | `screenings.participant_reference` | Exact reference within organisation/activation; NOT `employees.id` or employee number |
| Practitioner | `screenings.practitioner_user_id -> practitioner_profiles.user_id` | Auth-backed practitioner identity |
| Assignment | `screenings.assignment_id -> practitioner_assignments.id` | Must agree on organisation, practitioner and activation |
| Service delivered | `screenings.service_id -> services.id` | Nullable during transition; never infer from text/assignment for multi-service capture |
| Measurement | `screening_result_values.screening_id -> screenings.id`; `.service_result_field_id -> service_result_fields.id` | One value per screening/field; definition service must match screening service |
| Risk assessment | `screening_outcomes.screening_id -> screenings.id`; `.reporting_risk_category` | At most one canonical outcome per screening; no production `risk_assessment_id` |
| Referral required | `screening_outcomes.referral_required` | Boolean outcome flag; not evidence a referral exists |
| Referral created | `referrals.screening_id -> screenings.id`; `referrals.id` | At most one referral per screening; left join from outcomes |
| Follow-up | `referral_follow_ups.referral_id -> referrals.id` | Many follow-ups; use EXISTS to count referrals with follow-up |
| Branch / department IDs | No equivalent employee columns in inspected schema | Unsupported; do not fabricate joins. `screenings.department` is free text, not a department FK |
| Provider attribution | No verified direct provider-to-screening FK | Unsupported for this slice; do not infer from clinic text |

## KPI implementation map

All views are in the internal `analytics` schema, defined in `../sql/001_dashboard_analytics_views.sql`.

| KPI | Source / implementation | Readiness |
|---|---|---|
| Registered / Active Employees | `employee_summary`; employee count / active count | Implemented |
| Programme Participants | `participation_summary`; registration state `Registered` | Implemented; explicitly excludes Invited, Declined and Withdrawn |
| Attended Participants / Participation Rate | `participation_summary`; attended eligible / all eligible | Implemented; target and workforce size are never denominators |
| Screening Events | `screening_summary.screening_events` | Implemented; all statuses |
| Completed Screening Events | `screening_summary.completed_screening_events` | Implemented; only Approved |
| Participants Screened | `screening_summary.participants_screened` | Implemented; distinct exact nonblank references on Approved screenings |
| Screening Completion Rate | Required participant-service pairs do not exist yet | Unsupported; do not substitute approved/all events |
| Service Delivery Volume | Group valid `screening_facts` by `service_id`, filter Approved when reporting completed delivery | Mapped; null service remains unknown |
| Practitioner Screening Activity | Group valid `screening_facts` by `practitioner_user_id` | Mapped; filter status explicitly |
| Measurement Coverage | Expected active required `service_result_fields` for each screening service versus matching `screening_result_values` | Mapped; historical field-version/applicability rules remain a follow-on |
| Measurement Distribution | Numeric/text/boolean/code value columns, joined to field definition and screening scope | Mapped; aggregate by service, field and unit; no mixing units |
| Risk Level Distribution | `risk_summary`, canonical outcome category | Implemented; includes all outcome workflow states, retains unknown category |
| Referral Required / Created / Missing / Coverage | `referral_coverage` | Implemented; created count includes only required outcomes |
| Referral Status Funnel | `referral_status_funnel` | Implemented; all real referrals; unexpected referrals are separately flagged |
| Referral SLA Compliance | `referrals.completed_at`, `.due_at`, `.status` | Mapped; applicability/cancellation policy still required before implementing percentage |
| Follow-up Coverage | `referral_follow_ups`; EXISTS per referral | Raw `referrals_with_follow_up` implemented; applicability denominator is not yet defined |

## Counting and filtering contract

- Summary grain is organisation + programme + activation. The same reference in different activations is not proven to be the same employee. Do not sum these counts and label the result unique employees across a programme or all time.
- Missing activation stays in an unassigned bucket. No programme is inferred from assignment programme text. Participant totals in that bucket are reference counts with uncertain cross-event identity and must not be represented as verified unique employees.
- Use the exact participant reference; case folding or trimming identifiers could merge different people. Reject blank references through validation and surface any legacy invalid values.
- Existing migration history normalises Submitted to Under Review and does not accept new Submitted rows. Both are non-completed under Product rules; only Approved counts. This is schema drift to resolve in the application contract, not a reason to invent a status in tests.
- A null percentage means no eligible denominator (not 0% performance). An empty screening scope has no summary row; an authorised API can return zero counts. An unauthorised request must fail before querying.
- All-time summaries apply no date filter. For period reports, filter `screening_facts.captured_at >= start AND captured_at < end` before grouping. That answers events captured in the period with current status; completion-date reporting must explicitly use `reviewed_at` instead. Summary views are not period endpoints.
- Inconsistent assignment/organisation/activation/practitioner relationships are excluded from KPI aggregation and listed in `data_quality_exceptions`; they must be reported as data-quality issues. No untrusted joined organisation determines the authorised organisation scope.
- No employee join is used for screenings. Current screening references do not supply a verified employee FK. Branch filtering, employee-level health joins and all-time unique employee counts are therefore not supported.

## Security and deployment

These are internal views, not a new public GraphQL or REST API. They use `security_invoker`, live in a schema denied to `PUBLIC`, `anon` and `authenticated`, and grant read access to `service_role` only. Keep `analytics` out of exposed Data API schemas. Service-role queries still require backend permission checks and an explicit organisation predicate; service-role bypasses RLS. SQL scope tests do not prove future API authorisation.

Do not use the earlier unqualified `analytics_*` view names. This file creates `analytics.screening_facts`, `analytics.screening_summary`, `analytics.employee_summary`, `analytics.participation_summary`, `analytics.risk_summary`, `analytics.referral_coverage`, `analytics.referral_status_funnel` and `analytics.data_quality_exceptions`. If old views were applied manually, inspect their consumers and privileges before a separate controlled retirement; this script does not drop them.

Apply all backend migrations, then the analytics SQL, in a separate test database. The SQL is a reviewed script rather than an auto-applied Supabase migration. No deployment to the live project is part of this change.

## Jabu's next step

Follow `analytics-testing.md`, run pytest, inspect the synthetic expected values, and record his own test result and any discrepancies. This establishes database calculation readiness. API and dashboard reconciliation are separate gates after integration.
