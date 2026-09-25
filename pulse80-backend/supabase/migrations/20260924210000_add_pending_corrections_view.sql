-- Add the pending corrections analytics view.
begin;

create or replace view public.analytics_pending_corrections
with (security_invoker = true)
as
select
    organisation_id,
    practitioner_user_id,
    count(*) as pending_corrections
from public.screenings
where status = 'Needs Correction'
group by
    organisation_id,
    practitioner_user_id;

comment on view public.analytics_pending_corrections is
    'Counts screening records currently marked Needs Correction, grouped by organisation and practitioner. Groups with no matching records are absent.';

commit;