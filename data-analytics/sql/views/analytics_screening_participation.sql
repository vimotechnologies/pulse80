-- PUL-314 / PUL-316: Screening Participation Analytics
--
-- Rate = distinct Eligible and Registered programme participants with at
-- least one Completed screening / distinct Eligible and Registered programme
-- participants * 100.
--
-- Counts are kept at programme-participant grain. Multiple completed
-- screening services for one programme-participant record do not inflate
-- the numerator.
-- Every organisation is returned, including organisations with no eligible
-- participants; their counts and rate are zero.

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
