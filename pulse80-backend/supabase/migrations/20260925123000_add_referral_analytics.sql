-- PUL-311: Add referral analytics view.
begin;

create or replace view public.analytics_referrals
with (security_invoker = true)
as
select
    s.organisation_id,
    s.id as screening_id,
    s.captured_at as screening_date,

    true as referral_required,

    case
        when r.id is not null then true
        else false
    end as referral_created,

    case
        when r.id is null then true
        else false
    end as referral_missing,

    r.id as referral_id,
    r.status as referral_status,
    r.urgency,
    r.referred_at,
    r.due_at,
    r.completed_at

from public.screenings s

inner join public.screening_outcomes so
    on so.screening_id = s.id

left join public.referrals r
    on r.screening_id = s.id

where
    s.status = 'Completed'
    and so.referral_required = true;

comment on view public.analytics_referrals is
    'Reports Completed screenings requiring referral and identifies whether a referral was created or is missing. Includes referral status and referral dates for organisation and date filtering.';

commit;