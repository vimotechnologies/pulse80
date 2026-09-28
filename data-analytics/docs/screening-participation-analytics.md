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
