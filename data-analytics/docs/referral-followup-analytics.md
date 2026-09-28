# Referral and Follow-up Analytics

## Purpose

PUL-311 provides analytics for referrals generated from Completed screenings and the follow-up activity associated with those referrals.

The implementation provides two views:

- `public.analytics_referrals`
- `public.analytics_referral_followups`

## Referral Required

A screening requires a referral when:

`screening_outcomes.referral_required = true`

Only screenings with:

`screenings.status = 'Completed'`

are included.

## Referral Created

A referral is considered created when a row exists in:

`public.referrals`

with the same `screening_id` as the referral-required screening.

## Missing Referral

A missing referral occurs when:

- the screening is Completed;
- `referral_required = true`;
- no matching row exists in `public.referrals`.

This allows Pulse80 to identify screenings where a referral should have been created but was not.

## Referral Statuses

The supported referral statuses are:

- Issued
- Scheduled
- Completed
- Cancelled

The referral analytics view exposes the current status so reporting queries can count referrals by status.

## Organisation Filtering

Organisation ownership comes from:

`screenings.organisation_id`

This allows analytics queries to filter referral and follow-up results by organisation.

## Date Filtering

Referral analytics exposes:

- `screening_date`
- `referred_at`
- `due_at`
- `completed_at`

These fields can be used for reporting-period filters.

Follow-up analytics exposes:

- `referred_at`
- `latest_follow_up_at`
- `next_follow_up_at`

## Follow-ups

A referral can have multiple records in:

`public.referral_follow_ups`

The follow-up analytics view returns one row per referral.

This prevents multiple follow-up records from inflating referral totals.

`follow_up_count` shows how many follow-up records exist for the referral.

`follow_up_completed` is true when at least one follow-up record exists.

`latest_follow_up_at` reports the most recent completed follow-up activity.

## Duplicate Prevention

`public.referrals.screening_id` is unique.

This means one screening can have at most one referral record.

The follow-up view groups records by referral so multiple follow-ups do not duplicate the referral itself.

## Referral Analytics Output

`public.analytics_referrals` exposes:

| Column | Meaning |
| --- | --- |
| organisation_id | Organisation that owns the screening |
| screening_id | Screening requiring referral |
| screening_date | Date of screening |
| referral_required | Whether referral is required |
| referral_created | Whether a referral record exists |
| referral_missing | Whether the required referral is missing |
| referral_id | Referral identifier |
| referral_status | Issued, Scheduled, Completed or Cancelled |
| urgency | Referral urgency |
| referred_at | Referral creation date |
| due_at | Referral due date |
| completed_at | Referral completion date |

## Follow-up Analytics Output

`public.analytics_referral_followups` exposes:

| Column | Meaning |
| --- | --- |
| organisation_id | Organisation that owns the referral |
| referral_id | Referral identifier |
| screening_id | Source screening |
| referral_status | Current referral status |
| referred_at | Referral date |
| follow_up_count | Number of follow-up records |
| follow_up_completed | Whether at least one follow-up exists |
| latest_follow_up_at | Most recent follow-up |
| next_follow_up_at | Latest recorded next follow-up date |

## Validation

Controlled validation should confirm:

- referral-required screenings are identified;
- created referrals are matched correctly;
- missing referrals are identified;
- Issued referrals are counted correctly;
- Scheduled referrals are counted correctly;
- Completed referrals are counted correctly;
- Cancelled referrals are counted correctly;
- follow-ups are identified correctly;
- multiple follow-ups do not duplicate referral totals;
- organisation filtering works;
- date filtering works;
- non-Completed screenings are excluded;
- results reconcile with source records.