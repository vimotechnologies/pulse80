-- Restore the server-side service role privileges required by the admin user-management flow.
-- RLS remains enabled for client roles; these grants are only for the server-only service_role.

grant select, insert, update, delete
  on table public.organisation_memberships
  to service_role;

grant select, insert, update
  on table public.profiles
  to service_role;

grant select, insert, update, delete
  on table public.platform_staff_memberships
  to service_role;
