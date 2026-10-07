# Participants Screened — production integration

## Definition

Participants Screened is the number of distinct participants with at least one screening whose status is `Completed` inside the authorised organisation and selected filters. Multiple screening records for the same participant count once.

## Production source of truth

Validated against the live Pulse80 production schema:

- `screenings.organisation_id` — tenant
- `screenings.activation_id -> activations.id`
- `activations.programme_id` — programme filter
- `screenings.participant_reference` — participant identity used by current production screenings
- `screenings.status` — only `Completed` counts
- `screenings.captured_at` — reporting period

The implementation intentionally uses the current production schema rather than the older EDA `analytics_screening_facts.employee_id` model.

## Backend contract and tenant isolation

This metric must be called through the Pulse80 backend/GraphQL service. The frontend must not query the screenings tables or an unrestricted RPC directly.

The backend must:

1. Authenticate the caller.
2. Resolve the caller's authorised organisation(s).
3. Derive `organisation_id` from that authenticated context.
4. Reject a requested programme unless it belongs to that organisation.
5. Pass the authorised organisation id as SQL parameter `$1`.
6. Return only the aggregate metric.

Do not trust a frontend-supplied `organisation_id` as authorization.

Production RLS currently protects screenings primarily for platform staff and practitioners reading their own screenings. Client analytics therefore belongs behind the backend authorization boundary rather than direct frontend Supabase access.

## Query parameters

| Parameter | Required | Meaning |
|---|---|---|
| `organisation_id` | yes | Backend-authorised tenant scope |
| `programme_id` | no | Programme within the authorised organisation |
| `period_start` | no | Inclusive `captured_at` lower bound |
| `period_end` | no | Exclusive `captured_at` upper bound |

An empty result returns `0`.

## Live validation — 4 October 2026

Read-only production validation confirmed the metric against real Pulse80 data.

Completed participants observed:

- Quivertree Logistics: 60
- MSK Haulage: 60
- Ohman Construction Group: 60
- Kopano Mine: 24

Production contained 204 Completed screening rows and 10 Under Review rows at validation time. Under Review records are excluded.

Date filtering was also verified on the three dashboard-preview organisations: 25 completed participants from 8–11 September and 35 from 12–16 September, totaling 60.

Programme filtering follows `screenings.activation_id -> activations.programme_id`. The current tested organisations did not provide a useful same-organisation multi-programme production case, so that scenario should remain covered by automated integration tests.

## Required backend tests

Test authenticated organisation isolation, cross-organisation rejection, programme ownership, Completed-only filtering, duplicate participant records, empty results, and inclusive-start/exclusive-end date boundaries.
