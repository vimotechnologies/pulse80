-- Supabase projects created with restricted Data API defaults do not expose
-- new tables automatically. Table grants permit access to reach RLS; the RLS
-- policies still determine which rows each authenticated user may read.

grant select
on table public.profiles
to authenticated;

grant select
on table public.organisation_memberships
to authenticated;

grant select
on table public.platform_staff_memberships
to authenticated;
