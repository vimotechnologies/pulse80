begin;

update public.organisations
set region = case lower(btrim(region))
  when 'francistown' then 'North-East'
  when 'gaborone' then 'South-East'
  when 'jwaneng' then 'Southern'
  when 'lobatse' then 'South-East'
  when 'selebi-phikwe' then 'Central'
  when 'sowa town' then 'Central'
  else region
end
where lower(btrim(country)) = 'botswana'
  and lower(btrim(region)) in ('francistown', 'gaborone', 'jwaneng', 'lobatse', 'selebi-phikwe', 'sowa town');

create or replace function public.save_admin_organisation(
  p_organisation_id uuid,
  p_fields jsonb,
  p_contacts jsonb default null
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  contact_ids uuid[];
begin
  update public.organisations set
    name = case when p_fields ? 'name' then p_fields->>'name' else name end,
    slug = case when p_fields ? 'slug' then p_fields->>'slug' else slug end,
    industry = case when p_fields ? 'industry' then p_fields->>'industry' else industry end,
    country = case when p_fields ? 'country' then p_fields->>'country' else country end,
    primary_location = case when p_fields ? 'primary_location' then p_fields->>'primary_location' else primary_location end,
    region = case when p_fields ? 'region' then p_fields->>'region' else region end,
    workforce_size = case when p_fields ? 'workforce_size' then (p_fields->>'workforce_size')::integer else workforce_size end,
    package_name = case when p_fields ? 'package_name' then p_fields->>'package_name' else package_name end,
    contract_start = case when p_fields ? 'contract_start' then (p_fields->>'contract_start')::date else contract_start end,
    contract_end = case when p_fields ? 'contract_end' then (p_fields->>'contract_end')::date else contract_end end,
    status = case when p_fields ? 'status' then p_fields->>'status' else status end,
    custom_package_notes = case when p_fields ? 'custom_package_notes' then p_fields->>'custom_package_notes' else custom_package_notes end
  where id = p_organisation_id;
  if not found then raise exception 'Organisation not found.'; end if;

  if p_contacts is null then return; end if;
  if jsonb_typeof(p_contacts) <> 'array' or jsonb_array_length(p_contacts) not between 1 and 10 then
    raise exception 'One to ten organisation contacts are required.';
  end if;
  if (select count(*) from jsonb_array_elements(p_contacts) contact where contact->>'primary' = 'true') <> 1 then
    raise exception 'Exactly one primary contact is required.';
  end if;

  select array_agg(coalesce(nullif(contact->>'id', '')::uuid, gen_random_uuid()) order by ordinality)
  into contact_ids
  from jsonb_array_elements(p_contacts) with ordinality as input(contact, ordinality);

  if exists (
    select 1
    from jsonb_array_elements(p_contacts) contact
    join public.organisation_contacts existing on existing.id = (contact->>'id')::uuid
    where nullif(contact->>'id', '') is not null
      and existing.organisation_id <> p_organisation_id
  ) then
    raise exception 'A contact cannot be moved from another organisation.';
  end if;

  update public.organisation_contacts
  set is_primary = false
  where organisation_id = p_organisation_id;

  delete from public.organisation_contacts
  where organisation_id = p_organisation_id and not (id = any(contact_ids));

  insert into public.organisation_contacts (
    id, organisation_id, full_name, role_label, email, phone, preferred_method, is_primary, notes
  )
  select contact_ids[input.ordinality::integer], p_organisation_id,
    input.contact->>'name', input.contact->>'role_label', input.contact->>'email',
    nullif(input.contact->>'phone', ''), input.contact->>'method',
    input.contact->>'primary' = 'true', nullif(input.contact->>'notes', '')
  from jsonb_array_elements(p_contacts) with ordinality as input(contact, ordinality)
  on conflict (id) do update set
    full_name = excluded.full_name,
    role_label = excluded.role_label,
    email = excluded.email,
    phone = excluded.phone,
    preferred_method = excluded.preferred_method,
    is_primary = excluded.is_primary,
    notes = excluded.notes;
end;
$$;

revoke all on function public.save_admin_organisation(uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.save_admin_organisation(uuid, jsonb, jsonb) to service_role;

commit;