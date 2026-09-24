-- Count screening records that currently need correction.
-- Keep a separate count for each organisation and practitioner.

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