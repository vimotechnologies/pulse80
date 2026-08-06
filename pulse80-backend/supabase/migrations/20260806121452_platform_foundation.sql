-- Pulse80 platform foundation
--
-- auth.users -> profiles -> organisation_memberships -> organisations

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Application-level information for users authenticated by Supabase Auth.';

create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organisations_name_not_blank check (length(trim(name)) > 0),
  constraint organisations_slug_format check (
    slug = lower(slug)
    and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  )
);

comment on table public.organisations is
  'Pulse80 customer organisations, such as ABC Mining, FSG, or Debswana.';

create table public.organisation_memberships (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organisation_memberships_role_not_blank check (
    length(trim(role)) > 0
  ),
  constraint organisation_memberships_unique_member unique (
    organisation_id,
    profile_id
  )
);

comment on table public.organisation_memberships is
  'Links profiles to organisations and stores each user role within an organisation.';

create index organisation_memberships_profile_id_idx
  on public.organisation_memberships (profile_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger organisations_set_updated_at
before update on public.organisations
for each row execute function public.set_updated_at();

create trigger organisation_memberships_set_updated_at
before update on public.organisation_memberships
for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'phone',
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger create_profile_after_auth_user
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.organisations enable row level security;
alter table public.organisation_memberships enable row level security;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can read their own memberships"
on public.organisation_memberships
for select
to authenticated
using ((select auth.uid()) = profile_id);

create policy "Members can read their organisations"
on public.organisations
for select
to authenticated
using (
  exists (
    select 1
    from public.organisation_memberships membership
    where membership.organisation_id = organisations.id
      and membership.profile_id = (select auth.uid())
  )
);
