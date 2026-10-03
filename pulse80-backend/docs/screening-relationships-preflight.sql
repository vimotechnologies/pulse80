-- Read-only review for Pulse80. Run before approval; this script changes nothing.
with labels as (
  select p.id programme_id, label
  from public.programmes p cross join lateral unnest(p.service_names) label
), matches as (
  select l.programme_id, l.label, count(s.id) matches, (array_agg(s.id))[1] service_id
  from labels l left join public.services s
    on lower(btrim(s.name))=lower(btrim(l.label)) or lower(btrim(s.code))=lower(btrim(l.label))
  group by l.programme_id,l.label
), assignment_matches as (
  select pa.id, count(a.id) matches
  from public.practitioner_assignments pa left join (
    public.activations a join public.programmes p on p.id=a.programme_id and p.organisation_id=a.organisation_id
  ) on a.organisation_id=pa.organisation_id and p.name=pa.programme_name
    and a.title=pa.activity_name and a.location=pa.location
    and a.starts_at=pa.starts_at and a.ends_at=pa.ends_at
  where pa.activation_id is null group by pa.id
)
select jsonb_build_object(
  'screenings',(select count(*) from public.screenings),
  'completed_screenings',(select count(*) from public.screenings where status='Completed'),
  'linked_participants',(select count(programme_participant_id) from public.screenings),
  'approved_roster_rows',(select count(*) from public.programme_participants),
  'programme_service_candidates',(select jsonb_agg(to_jsonb(m)) from matches m where matches=1),
  'unresolved_programme_labels',(select jsonb_agg(to_jsonb(m)) from matches m where matches<>1),
  'assignment_event_candidates',(select jsonb_agg(to_jsonb(m)) from assignment_matches m),
  'assignments_without_services',(select jsonb_agg(id) from public.practitioner_assignments where service_id is null),
  'required_services_table',to_regclass('public.programme_participant_services'),
  'participant_code_column',exists(select 1 from information_schema.columns where table_schema='public' and table_name='programme_participants' and column_name='screening_reference')
) as review;
