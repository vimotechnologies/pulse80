-- The backend organisation resolver uses the service-role client and embeds
-- contacts in its organisation query. RLS policies do not grant table-level
-- privileges, so explicitly allow the trusted backend role to manage contacts.
grant all on table public.organisation_contacts to service_role;
