# Risk Metrics Analytics

`public.analytics_risk_metrics` reports aggregate participant risk by organisation, using Completed screenings only. Draft, Under Review and Needs Correction records are excluded.

## Measurement sources

The view reads legacy `screening_results` and flexible `screening_result_values` joined to `service_result_fields`. Flexible fields must match the screening's service and use the configured numeric units and bounds. Supported codes are SYSTOLIC, DIASTOLIC, GLUCOSE, CHOLESTEROL and BMI, plus their LEGACY aliases. HEIGHT and WEIGHT can derive BMI when recorded together on the same screening. Canonical flexible values take precedence over aliases and legacy columns.

## Repeated and multi-service screenings

Participants are identified by organisation plus participant reference. Each indicator uses its latest non-missing Completed value, ordered by captured time and screening ID. Values recorded at separate services are retained independently: a newer glucose result does not remove an earlier blood-pressure measurement. A newer blood-pressure value replaces that indicator's older value. The highest triggered category wins. There is no defined clinical validity window; the scope is all time.

## Existing thresholds

| Indicator | Moderate begins | High begins |
| --- | ---: | ---: |
| Systolic blood pressure | 140 mmHg | 160 mmHg |
| Diastolic blood pressure | 90 mmHg | 100 mmHg |
| Glucose | 7.0 mmol/L | 11.1 mmol/L |
| Cholesterol | 5.2 mmol/L | 6.2 mmol/L |
| BMI | 30 | 35 |

These are the existing platform rules; the input repair does not change their thresholds. Supported values below all thresholds are Low. A participant with no supported quantitative measurement is Not Calculated. Missing measurements are not replaced with zero. Dental, vision, hearing and other unsupported domains do not acquire risk categories from these quantitative rules.

## Output and denominator

The output contains organisation_id, risk_category, participant_count, total_participants and percentage. The denominator is unique participants with at least one Completed screening, including Not Calculated. Each represented organisation receives Low, Moderate, High and Not Calculated rows, including zero categories. Repeated services do not inflate participant counts. Organisations with no Completed screenings have no view rows; the backend returns four zero entries.

## Security and completion integrity

The view uses security_invoker=true and is readable through the authorised backend only. GraphQL client queries derive organisation scope from validated request identity. Admin aggregation requires platform analytics permission.

New Completed screenings and transitions to Completed must have saved legacy measurements or a service-matching flexible result. Existing historical Completed records are preserved and require source-data reconciliation if their results are missing.

## Verification

The migration and `pulse80-backend/test/risk-inputs.test.mjs` cover PostgreSQL calculation, both capture formats, unit checks, service matching, BMI derivation, multi-service retention, latest indicator replacement, pending exclusion, category totals, completion guards and organisation-scoped GraphQL. See risk-input-reconciliation.md for the production data audit and historical restoration requirements.
