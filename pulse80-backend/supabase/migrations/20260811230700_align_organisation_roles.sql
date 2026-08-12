-- Keep persisted organisation roles aligned with the application RBAC model.
-- Existing unsupported values intentionally make this migration fail rather
-- than silently granting a user a different level of access.

alter table public.organisation_memberships
alter column role drop default;

alter table public.organisation_memberships
drop constraint if exists organisation_memberships_role_not_blank;

alter table public.organisation_memberships
add constraint organisation_memberships_role_check
check (
  role in (
    'owner',
    'client_admin',
    'hr',
    'occupational_health',
    'executive',
    'practitioner'
  )
);

-- This function is invoked only by its auth.users trigger. It must not be
-- exposed as a callable RPC to application roles.
revoke all
on function public.create_profile_for_new_user()
from public;

-- Apply Supabase's init-plan recommendation so auth.uid() is evaluated once
-- per statement instead of once per platform membership row.
drop policy if exists
"Platform staff can read own membership"
on public.platform_staff_memberships;

create policy "Platform staff can read own membership"
on public.platform_staff_memberships
for select
to authenticated
using (
  user_id = (select auth.uid())
);
