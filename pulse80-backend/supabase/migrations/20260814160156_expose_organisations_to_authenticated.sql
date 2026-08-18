-- Permit authenticated API requests to reach the organisations table.
-- Row visibility remains restricted by the existing organisation RLS policy.

grant select
on table public.organisations
to authenticated;
