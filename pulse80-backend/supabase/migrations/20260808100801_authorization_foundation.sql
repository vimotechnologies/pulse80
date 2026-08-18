-- =========================================================
-- Pulse80 Platform Staff
-- =========================================================

create table public.platform_staff_memberships (
    user_id uuid primary key
        references auth.users(id)
        on delete cascade,

    role text not null
        check (
            role in (
                'super_admin',
                'operations',
                'business_development',
                'finance',
                'wellness_coordinator'
            )
        ),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.platform_staff_memberships
enable row level security;


-- Pulse80 staff members may read their own platform role.
-- They cannot create or modify their own role.

create policy "Platform staff can read own membership"
on public.platform_staff_memberships
for select
to authenticated
using (
    user_id = auth.uid()
);


-- =========================================================
-- Tenant authorization helpers
-- =========================================================

create or replace function public.is_organisation_member(
    target_organisation_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.organisation_memberships membership
        where membership.organisation_id =
              target_organisation_id
          and membership.profile_id = auth.uid()
    );
$$;


create or replace function public.is_platform_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.platform_staff_memberships staff
        where staff.user_id = auth.uid()
    );
$$;

revoke all
on function public.is_organisation_member(uuid)
from public;

grant execute
on function public.is_organisation_member(uuid)
to authenticated;


revoke all
on function public.is_platform_staff()
from public;

grant execute
on function public.is_platform_staff()
to authenticated;


-- =========================================================
-- Organisation visibility
-- =========================================================

drop policy if exists
"Members can read their organisations"
on public.organisations;

create policy "Authorised users can read organisations"
on public.organisations
for select
to authenticated
using (
    public.is_organisation_member(id)
    or
    public.is_platform_staff()
);
