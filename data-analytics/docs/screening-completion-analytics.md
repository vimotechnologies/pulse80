# Screening Completion Analytics

## Purpose

Screening Completion Rate shows how many required screenings have
actually been completed for an organisation.

## Formula

Screening Completion Rate =

Completed required screenings
÷
Expected required screenings
× 100

The result is rounded to two decimal places.

## Expected required screenings

A required screening represents:

- one programme participant; and
- one service specifically required for that participant.

Required services are stored in:

`programme_participant_services`

A participant contributes to the denominator only when:

- `eligibility_status = 'Eligible'`
- `registration_status = 'Registered'`

A participant can have more than one required service.

The calculation does not assume that every participant requires
every service offered by the programme.

## Completed required screenings

A requirement is completed only when at least one matching
screening has:

`status = 'Approved'`

The screening must match:

- organisation;
- programme participant; and
- required service.

Draft, Submitted, Needs Correction and other non-Approved
records do not count as completed.

## Duplicate screenings

Several Approved screening records may exist for the same
participant and required service.

The requirement still counts as one completed screening.

The analytics view uses `EXISTS` rather than counting screening
records to enforce this rule.

## Non-required services

A participant may receive a screening that was not part of their
required services.

That screening does not affect either the numerator or denominator,
even when its status is Approved.

## Organisation scope

Results are grouped by `organisation_id`.

Each organisation therefore receives its own:

- expected required screening count;
- completed required screening count; and
- completion percentage.

An organisation with no qualifying required screenings currently
does not produce a row in the view.

## Database relationships

The calculation follows:

Organisation
→ Programme
→ Programme Participant
→ Participant Required Service
→ Programme Service
→ Service

Completed screening records are matched using:

- `screenings.organisation_id`
- `screenings.programme_participant_id`
- `screenings.service_id`

## Privacy

The analytics view returns organisation-level aggregate counts.

It does not return employee names, employee numbers or participant
references.

The underlying participant relationships remain protected database
data and must follow the application's tenant access and RLS rules.

## Controlled test scenario

The automated test uses two Eligible and Registered participants.

Participant A requires:

- Blood Pressure
- BMI
- Glucose

Participant B requires:

- Blood Pressure
- BMI

Expected required screenings:

`5`

Completed:

- Participant A Blood Pressure — Approved
- Participant A BMI — Approved
- Participant B BMI — Approved

Not completed:

- Participant A Glucose — Draft
- Participant B Blood Pressure — Needs Correction

Therefore:

`3 / 5 × 100 = 60.00%`

The tests also verify:

- duplicate Approved screenings count once;
- non-required Approved services are ignored;
- Not Eligible participants are excluded;
- non-Registered participants are excluded;
- multiple required services are supported;
- organisation filtering works.

## Test result

Controlled PostgreSQL integration test:

`12 passed`

Test files:

- `data-analytics/tests/conftest.py`
- `data-analytics/tests/test_screening_completion.py`

Test schema:

- `data-analytics/tests/sql/pul_313_test_schema.sql`

## Deployment note

The new `screenings.programme_participant_id` column is nullable
for backwards compatibility with existing screening records.

Existing records without this relationship will not contribute to
the new completion calculation until they are correctly linked.

Do not infer this relationship from participant names or free-text
participant references.

## Security

`programme_participant_services` has Row Level Security enabled.

The analytics view uses PostgreSQL `security_invoker` so access to
underlying participant data remains subject to database permissions
and RLS.

Client-facing access should only be enabled after the appropriate
organisation/tenant read policies have been defined and tested.