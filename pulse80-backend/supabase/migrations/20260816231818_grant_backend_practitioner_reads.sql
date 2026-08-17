-- The practitioner GraphQL service uses the server-only Supabase secret client.
-- Restricted Data API defaults require explicit table privileges in addition
-- to the service role's RLS bypass.

grant select, update
on table public.profiles
to service_role;

grant select
on table public.organisations
to service_role;
