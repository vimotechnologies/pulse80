-- Practitioner-submitted Completed records do not require an administrative review timestamp.
-- Needs Correction still requires a review; the saved-results trigger remains in place.
ALTER TABLE public.screenings DROP CONSTRAINT screenings_review_state_check;
ALTER TABLE public.screenings ADD CONSTRAINT screenings_review_state_check CHECK (
  status = 'Completed'
  OR (status = 'Needs Correction' AND reviewed_at IS NOT NULL)
  OR status IN ('Draft', 'Under Review')
);
