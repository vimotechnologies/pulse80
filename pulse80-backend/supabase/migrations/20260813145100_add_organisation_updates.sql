-- Application permission `organisation:update` is held by organisation owners,
-- client administrators, platform super administrators, and operations staff.

grant update (name, slug, updated_at)
on table public.organisations
to authenticated;

create policy "Authorised users can update organisations"
on public.organisations
for update
to authenticated
using (
  exists (
    select 1
    from public.organisation_memberships membership
    where membership.organisation_id = organisations.id
      and membership.profile_id = (select auth.uid())
      and membership.role in ('owner', 'client_admin')
  )
  or exists (
    select 1
    from public.platform_staff_memberships staff
    where staff.user_id = (select auth.uid())
      and staff.role in ('super_admin', 'operations')
  )
)
with check (
  exists (
    select 1
    from public.organisation_memberships membership
    where membership.organisation_id = organisations.id
      and membership.profile_id = (select auth.uid())
      and membership.role in ('owner', 'client_admin')
  )
  or exists (
    select 1
    from public.platform_staff_memberships staff
    where staff.user_id = (select auth.uid())
      and staff.role in ('super_admin', 'operations')
  )
);
