# Screening Participation Analytics

## Purpose

This view shows what share of an organisation's eligible, registered programme participants have completed at least one screening.

## Formula

`screened eligible participants / eligible registered participants × 100`

The view rounds the percentage to two decimal places.

## Rules

- A participant is included when `eligibility_status = 'Eligible'` and `registration_status = 'Registered'`.
- A participant counts as screened when a linked screening has `status = 'Completed'`.
- A programme-participant record counts once, even if it has multiple completed services or duplicate screening rows. An employee enrolled in multiple programmes has one participant record per programme.
- Each organisation is calculated separately.
- Organisations with no eligible, registered participants return zero counts and a zero rate.
- The view returns aggregate counts only. It does not expose employee names or participant references.

## Source and use

The view is `public.analytics_screening_participation`. Its SQL is in `data-analytics/sql/views/analytics_screening_participation.sql` and the backend migration is in `pulse80-backend/supabase/migrations`.

The backend filters by the authorised `organisation_id` and passes these fields through GraphQL:

- `eligible_participant_count`
- `screened_participant_count`
- `screening_participation_rate_pct`

The backend must not calculate this percentage from workforce size or raw screening rows.

## Security

The view uses `security_invoker = true`. The organisation id comes from the authenticated server-side permission check; it is not accepted from an unrestricted client argument.


## Anonymous codes and live rollout

The participant reference is an anonymous screening code. Operations must supply
an approved programme roster. Store each code in
`programme_participants.screening_reference`; it is unique within its programme.
Do not infer this mapping from employee numbers, names or past screening activity.

Before applying `20260928035527_link_screenings_by_programme_code.sql` in live:

1. Prepare the approved participants, anonymous codes, eligibility and registration
   status, and required programme services.
2. Plan a short capture pause: the migration adds the code column and immediately
   enables validation. Populate approved codes before capture resumes.
3. Populate `programme_participant_services` from approved requirements. Screenings
   must never create their own requirements, since that changes the denominator.
4. Confirm each assignment has an activation in the correct programme. Legacy
   assignments need a single canonical service; flexible capture supplies its service.
5. Confirm deployed capture RPCs exist for any legacy forms still in use.
6. Check a known case in the test project, comparing SQL, the API and the dashboard.

The database trigger links both flexible inserts and legacy RPC inserts.
Corrections that change the anonymous code resolve the participant again.
Unknown codes, inconsistent explicit links and cross-organisation assignments fail.
Existing screenings are not automatically backfilled. Use an approved mapping;
review ambiguous records with operations.

The dashboard shows “Not available” when the denominator is zero. A measured 0%
requires a nonzero denominator and no completed results.

## Automated integration check

Run `npm test` in `pulse80-backend`. The screening-flow test uses PGlite (an isolated
PostgreSQL engine) and the actual migration SQL. It checks linking, corrections,
duplicates, unknown codes, organisation boundaries, empty results and GraphQL values.
Only the HTTP transport between the backend and database is simulated. This does
not replace a signed-in check against the deployed API and dashboard.
