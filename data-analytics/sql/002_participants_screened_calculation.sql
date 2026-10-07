-- ============================================================
-- PUL-307: Participants Screened
-- ============================================================
--
-- Definition:
-- Count each unique participant once when they have at least
-- one Completed screening.
--
-- Production mapping (validated against live Pulse80):
--   screenings.organisation_id
--   screenings.activation_id -> activations.id
--   activations.programme_id
--   screenings.participant_reference
--   screenings.status
--   screenings.captured_at
--
-- SECURITY / TENANT RULE:
-- $1 MUST come from the authenticated backend organisation context.
-- Never populate $1 directly from a frontend/client-supplied organisation id.
-- This query is intended for the backend service/resolver, not direct browser use.
--
-- Parameters:
--   $1 organisation_id   uuid              required, backend-authorised tenant
--   $2 programme_id      uuid | null       optional
--   $3 period_start      timestamptz | null optional, inclusive
--   $4 period_end        timestamptz | null optional, exclusive
--
select
  count(distinct s.participant_reference)::integer as participants_screened
from public.screenings s
join public.activations a
  on a.id = s.activation_id
 and a.organisation_id = s.organisation_id
where s.organisation_id = $1::uuid
  and lower(s.status) = 'completed'
  and ($2::uuid is null or a.programme_id = $2::uuid)
  and ($3::timestamptz is null or s.captured_at >= $3::timestamptz)
  and ($4::timestamptz is null or s.captured_at < $4::timestamptz);

-- Deliberately no public SQL/RPC wrapper here.
-- Tenant authorisation belongs in the backend resolver/service, which must
-- resolve the caller's authorised organisation before executing this query.
