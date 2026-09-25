-- PUL-311: Add referral follow-up analytics view.
begin;

create or replace view public.analytics_referral_followups
with (security_invoker = true)
as
select
    s.organisation_id,
    r.id as referral_id,
    r.screening_id,
    r.status as referral_status,
    r.referred_at,

    count(fu.id)::bigint as follow_up_count,

    count(fu.id) > 0 as follow_up_completed,

    max(fu.followed_up_at) as latest_follow_up_at,

    max(fu.next_follow_up_at) as next_follow_up_at

from public.referrals r

inner join public.screenings s
    on s.id = r.screening_id

left join public.referral_follow_ups fu
    on fu.referral_id = r.id

where s.status = 'Completed'

group by
    s.organisation_id,
    r.id,
    r.screening_id,
    r.status,
    r.referred_at;

comment on view public.analytics_referral_followups is
    'Reports referral follow-up activity at one row per referral. Multiple follow-up records do not duplicate referral records.';

commit;