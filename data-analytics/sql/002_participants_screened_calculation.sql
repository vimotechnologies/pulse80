-- ============================================================
-- PUL-307: Participants Screened
-- ============================================================
--
-- Definition:
-- Count each unique participant once when they have at least
-- one Completed screening.
--
-- Production mapping:
--   screenings.organisation_id
--   screenings.activation_id -> activations.id
--   activations.programme_id
--   screenings.participant_reference
--   screenings.status
--   screenings.captured_at
--
-- Rules:
--   1. Only Completed screenings count.
--   2. A participant is counted once even if they have several
--      Completed screening records.
--   3. Results are isolated by organisation.
--   4. Programme filtering is optional.
--   5. Period filtering uses captured_at.
--   6. period_start is inclusive.
--   7. period_end is exclusive.
--
-- Parameters:
--   $1 = organisation_id UUID
--   $2 = programme_id UUID or NULL
--   $3 = period_start timestamptz or NULL
--   $4 = period_end timestamptz or NULL
-- ============================================================

SELECT
  COUNT(DISTINCT s.participant_reference) AS participants_screened
FROM public.screenings AS s
JOIN public.activations AS a
  ON a.id = s.activation_id
 AND a.organisation_id = s.organisation_id
WHERE s.organisation_id = $1
  AND s.status = 'Completed'
  AND ($2::uuid IS NULL OR a.programme_id = $2::uuid)
  AND ($3::timestamptz IS NULL OR s.captured_at >= $3::timestamptz)
  AND ($4::timestamptz IS NULL OR s.captured_at < $4::timestamptz);