-- PUL-316: connect the screening participation and completion analytics.
-- Both views return one aggregate row per organisation. The backend reads
-- these results; it does not recalculate the metrics.

begin;

create or replace view public.analytics_screening_participation
with (security_invoker = true)
as
with eligible_participants as (
    select distinct
        pp.id as programme_participant_id,
        p.organisation_id
    from public.programme_participants pp
    join public.programmes p
        on p.id = pp.programme_id
    where pp.eligibility_status = 'Eligible'
      and pp.registration_status = 'Registered'
),
screened_participants as (
    select distinct
        ep.organisation_id,
        ep.programme_participant_id
    from eligible_participants ep
    join public.screenings s
        on s.programme_participant_id = ep.programme_participant_id
       and s.organisation_id = ep.organisation_id
       and s.status = 'Completed'
)
select
    o.id as organisation_id,
    count(distinct ep.programme_participant_id) as eligible_participant_count,
    count(distinct sp.programme_participant_id) as screened_participant_count,
    case
        when count(distinct ep.programme_participant_id) = 0 then 0::numeric
        else round(
            count(distinct sp.programme_participant_id)::numeric
            / count(distinct ep.programme_participant_id)::numeric
            * 100,
            2
        )
    end as screening_participation_rate_pct
from public.organisations o
left join eligible_participants ep
    on ep.organisation_id = o.id
left join screened_participants sp
    on sp.organisation_id = ep.organisation_id
   and sp.programme_participant_id = ep.programme_participant_id
group by o.id;

comment on view public.analytics_screening_participation is
'Organisation-level screening participation among Eligible and Registered programme participants. A participant is screened once when at least one linked screening has Completed status.';

create or replace view public.analytics_screening_completion
with (security_invoker = true)
as
with required_screenings as (
    select distinct
        p.organisation_id,
        pp.id as programme_participant_id,
        ps.service_id
    from public.programme_participant_services pps
    join public.programme_participants pp
        on pp.id = pps.programme_participant_id
    join public.programme_services ps
        on ps.id = pps.programme_service_id
       and ps.programme_id = pp.programme_id
    join public.programmes p
        on p.id = pp.programme_id
    where pp.eligibility_status = 'Eligible'
      and pp.registration_status = 'Registered'
),
screening_status as (
    select
        rs.organisation_id,
        rs.programme_participant_id,
        rs.service_id,
        case when exists (
            select 1
            from public.screenings s
            where s.organisation_id = rs.organisation_id
              and s.programme_participant_id = rs.programme_participant_id
              and s.service_id = rs.service_id
              and s.status = 'Completed'
        ) then 1 else 0 end as is_completed
    from required_screenings rs
),
organisation_totals as (
    select
        organisation_id,
        count(*) as expected_required_screenings,
        sum(is_completed)::bigint as completed_required_screenings
    from screening_status
    group by organisation_id
)
select
    o.id as organisation_id,
    coalesce(t.expected_required_screenings, 0)::bigint as expected_required_screenings,
    coalesce(t.completed_required_screenings, 0)::bigint as completed_required_screenings,
    case
        when coalesce(t.expected_required_screenings, 0) = 0 then 0::numeric
        else round(
            t.completed_required_screenings::numeric
            / t.expected_required_screenings::numeric
            * 100,
            2
        )
    end as screening_completion_rate
from public.organisations o
left join organisation_totals t
    on t.organisation_id = o.id;

comment on view public.analytics_screening_completion is
'Organisation-level completion of required screenings. Requirements are participant-service pairs for Eligible and Registered programme participants. A pair is completed when at least one matching screening has Completed status.';

grant select on public.analytics_screening_participation to service_role;
grant select on public.analytics_screening_completion to service_role;

commit;
