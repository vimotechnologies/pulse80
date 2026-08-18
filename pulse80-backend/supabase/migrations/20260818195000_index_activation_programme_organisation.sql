-- Cover the composite programme/organisation foreign key used by activation joins.
create index activations_programme_organisation_idx
on public.activations (programme_id, organisation_id);
