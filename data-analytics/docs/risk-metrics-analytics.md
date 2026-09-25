# Risk Metrics Analytics

## Purpose

The Risk Metrics analytics view provides an organisation-level summary of participant risk categories from completed health screenings.

The database view is:

`public.analytics_risk_metrics`

The view is intended for aggregated analytics and reporting. It does not expose individual participant references or individual health measurements in its final output.

## Supported risk indicators

The current risk calculation uses the following quantitative screening measurements:

- Blood pressure
- Glucose
- Cholesterol
- BMI

Other screening services, such as dental, eye, hearing and similar assessments, are not currently included in this risk calculation.

They require their own approved risk rules before they can contribute to this metric.

## Risk categories

The analytics view uses four categories:

- Low
- Moderate
- High
- Not Calculated

The highest triggered risk category wins.

For example, if a participant has Moderate blood pressure risk and High BMI risk, the participant is classified as High.

## Risk thresholds

| Indicator | Low | Moderate | High |
| --- | --- | --- | --- |
| Systolic blood pressure | Below 140 mmHg | 140–159 mmHg | 160 mmHg or higher |
| Diastolic blood pressure | Below 90 mmHg | 90–99 mmHg | 100 mmHg or higher |
| Glucose | Below 7.0 mmol/L | 7.0–11.09 mmol/L | 11.1 mmol/L or higher |
| Cholesterol | Below 5.2 mmol/L | 5.2–6.19 mmol/L | 6.2 mmol/L or higher |
| BMI | Below 30 | 30–34.99 | 35 or higher |

For blood pressure, systolic and diastolic values are assessed independently.

The higher category triggered by either measurement applies.

Example:

- 145/80 = Moderate
- 125/105 = High
- 165/85 = High

## Not Calculated

`Not Calculated` does not mean that a participant has Low risk.

It means that the participant has at least one Completed screening, but no Completed screening containing a measurement currently supported by the PUL-312 risk calculation.

For example, a participant who has only completed a dental screening should be classified as:

`Not Calculated`

The participant must not automatically be classified as Low.

This distinction is important because Pulse80 supports health screening services outside blood pressure, glucose, cholesterol and BMI.

## Missing measurements

Missing values are not silently converted to zero.

If at least one supported measurement is available, risk is calculated using the available supported measurements.

Example:

- Blood pressure = 165/105
- Glucose = missing
- Cholesterol = missing
- BMI = missing

Result:

`High`

If no supported measurements are available from any applicable Completed screening, the participant is classified as:

`Not Calculated`

Missing measurements that were expected to be captured should be treated separately as a data-quality issue.

Data completeness and participant risk are not the same metric.

## Eligible screenings

Only screenings with:

`status = 'Completed'`

are included in the risk calculation.

The following statuses do not contribute to the metric:

- Draft
- Under Review
- Needs Correction

This prevents unfinished or unapproved screening results from affecting organisation analytics.

## Participant identification

For this analytics calculation, a participant is identified using:

`organisation_id + participant_reference`

The same participant reference may exist in different organisations.

For example:

- Organisation A + EMP-001
- Organisation B + EMP-001

These are treated as separate participants.

## Repeated screenings

A participant may have more than one screening over time.

Repeated screenings must not inflate participant counts.

For risk calculation, the view uses the participant's latest applicable Completed screening.

An applicable screening contains at least one of:

- systolic blood pressure
- diastolic blood pressure
- glucose
- cholesterol
- BMI

Example:

| Date | Screening | Risk |
| --- | --- | --- |
| January | BP and glucose | High |
| March | BP and glucose | Moderate |

The participant's current analytics category is:

`Moderate`

The participant is counted once.

## Non-applicable screenings after a risk screening

A newer screening that does not contain a supported PUL-312 measurement does not replace the latest applicable risk screening.

Example:

| Date | Screening |
| --- | --- |
| January | BP and glucose - Moderate |
| March | Dental |
| April | Eye |

The participant remains:

`Moderate`

for the PUL-312 risk metric.

Dental and eye screenings do not overwrite the latest applicable quantitative risk screening.

## Participants with no applicable screening

A participant may have Completed screening activity without ever having a PUL-312-supported measurement.

Example:

| Date | Screening |
| --- | --- |
| January | Dental |
| March | Eye |
| April | Hearing |

The participant is classified as:

`Not Calculated`

The participant is still included in the total screened participant population.

## Analytics population

The denominator for this metric is:

> Unique participants with at least one Completed screening.

Employees who have never participated in a Completed screening are not included.

For example:

- Organisation workforce = 1,000 employees
- Unique participants with Completed screenings = 100
- Participants with supported risk measurements = 80
- Participants with only unsupported screening types = 20

The analytics population is:

`100`

The 20 participants without supported risk measurements are classified as `Not Calculated`.

The remaining 900 employees are not included in this metric.

## Organisation filtering

Risk analytics are calculated separately for each organisation.

Data from one organisation must not affect another organisation's:

- participant count
- risk category count
- total participant count
- percentage

## View output

`public.analytics_risk_metrics` returns:

| Column | Meaning |
| --- | --- |
| organisation_id | Organisation the analytics belong to |
| risk_category | Low, Moderate, High or Not Calculated |
| participant_count | Number of unique participants in the category |
| total_participants | Total unique participants with Completed screenings |
| percentage | Percentage of the organisation's screened participants in the category |

The view returns all four risk categories for an organisation even when a category contains zero participants.

Example:

| risk_category | participant_count |
| --- | ---: |
| Low | 18 |
| Moderate | 7 |
| High | 0 |
| Not Calculated | 3 |

## Privacy

The final analytics view is aggregated.

It does not expose:

- participant_reference
- blood pressure values
- glucose values
- cholesterol values
- BMI values

Individual measurements are used internally to calculate the analytics result but are not returned by the final view.

## Security

The view uses:

`security_invoker = true`

The analytics view must respect the permissions and row-level security rules of the underlying database tables.

## Validation requirements

PUL-312 implementation must be validated using controlled test data.

Validation should cover:

- Low risk
- Moderate risk
- High risk
- Not Calculated
- Exact threshold boundaries
- Highest-risk-wins behaviour
- Missing measurements
- Repeated screenings
- Latest applicable screening
- Non-applicable screenings after an applicable screening
- Duplicate prevention
- Completed status filtering
- Needs Correction exclusion
- Draft exclusion
- Under Review exclusion
- Organisation separation
- Participant totals
- Category counts
- Percentages
- Zero-count categories

Validation should confirm expected calculations independently rather than changing the analytics rules simply to make tests pass.

Any mismatch between expected results and the analytics view should be investigated before the implementation or test expectation is changed.

## Current limitations

The current risk metric does not provide a complete assessment of every health screening domain supported by Pulse80.

Dental, vision, hearing and other screening domains require separately approved risk definitions before they can be incorporated into risk classification.

The current metric also does not define how long a previous risk measurement remains clinically current.

Until an approved validity period is defined, the latest applicable Completed screening is used.

## Related work

- `public.analytics_risk_metrics`
- `pulse80-backend/supabase/migrations/20260925120000_add_risk_metrics_view.sql`