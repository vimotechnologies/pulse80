# Pending Corrections Analytics

## Purpose

Show how many screening records currently need correction.

## Calculation

Count screening records where status is exactly 'Needs Correction'.

Each screening record counts once, regardless of how many errors it has.
The query reads screenings directly and does not join the errors table.

## Grouping and filtering

The view returns one count per organisation and practitioner combination.

- organisation_id allows organisation filtering.
- practitioner_user_id allows practitioner filtering.

## Excluded statuses

Draft, Under Review and Completed are excluded.
Any other status is also excluded.

## Zero results

An organisation and practitioner combination with no pending corrections
has no row in the view.

Code reading the view must treat a missing result as zero.
When adding counts with SUM, use COALESCE(SUM(pending_corrections), 0).

## Checks completed

- Confirmed the required columns exist in production.
- Production status counts showed 204 Completed and 10 Under Review.
- The direct pending corrections count returned zero.
- A query using made-up records returned the expected counts:
  - Organisation A / Practitioner 1: 2
  - Organisation A / Practitioner 2: 1
  - Organisation B / Practitioner 1: 1

These were manual query checks, not tests of the deployed view.

## Still to verify

- Create and test the actual view in a test environment.
- Confirm organisation and practitioner filters return correct totals.
- Confirm multiple errors do not increase a screening's count.
- Confirm a record stops counting when it leaves Needs Correction.
- Check access using the application database roles.
- Prepare the database migration before production deployment.