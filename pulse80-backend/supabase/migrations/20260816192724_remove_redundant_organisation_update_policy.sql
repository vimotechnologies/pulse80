-- The existing Authorised users policy already covers platform super admins
-- and operations staff, so the second permissive UPDATE policy is redundant.
drop policy if exists "Platform administrators can update organisations"
on public.organisations;
