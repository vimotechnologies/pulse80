-- Retire the legacy screening status. Practitioner approvals are unrelated.
begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

alter table public.screenings
  drop constraint screenings_status_check,
  drop constraint screenings_review_state_check;

-- Preserve reviewed records if a legacy writer added any before this migration.
update public.screenings
set status = 'Completed'
where status = 'Approved';

alter table public.screenings
  add constraint screenings_status_check
  check (status in ('Draft', 'Under Review', 'Completed', 'Needs Correction')),
  add constraint screenings_review_state_check
  check (
    (status in ('Completed', 'Needs Correction') and reviewed_at is not null)
    or status in ('Draft', 'Under Review')
  );

commit;
