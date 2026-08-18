-- Pulse80 programme and activation operations.

create table public.programmes (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name text not null check (length(trim(name)) >= 2),
  description text,
  status text not null default 'Planned'
    check (status in ('Planned', 'Active', 'Paused', 'Completed', 'Cancelled')),
  starts_on date not null,
  ends_on date not null,
  service_names text[] not null default '{}',
  target_participants integer not null default 0 check (target_participants >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on),
  unique (id, organisation_id)
);

create table public.activations (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null,
  organisation_id uuid not null,
  title text not null check (length(trim(title)) >= 2),
  description text,
  location text not null check (length(trim(location)) >= 2),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  expected_participants integer not null default 0 check (expected_participants >= 0),
  service_names text[] not null default '{}',
  status text not null default 'Draft'
    check (status in ('Draft', 'Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Action Required')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  constraint activations_programme_organisation_fkey
    foreign key (programme_id, organisation_id)
    references public.programmes(id, organisation_id)
    on delete cascade
);

create table public.activation_readiness_items (
  id uuid primary key default gen_random_uuid(),
  activation_id uuid not null references public.activations(id) on delete cascade,
  label text not null check (length(trim(label)) >= 2),
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((completed and completed_at is not null) or (not completed and completed_at is null)),
  unique (activation_id, label)
);

alter table public.practitioner_assignments
  add column activation_id uuid references public.activations(id) on delete set null;

create index programmes_organisation_status_idx
  on public.programmes(organisation_id, status);
create index programmes_dates_idx
  on public.programmes(starts_on, ends_on);
create index activations_organisation_start_idx
  on public.activations(organisation_id, starts_at);
create index activations_programme_start_idx
  on public.activations(programme_id, starts_at);
create index activations_status_start_idx
  on public.activations(status, starts_at);
create index activation_readiness_activation_idx
  on public.activation_readiness_items(activation_id);
create index practitioner_assignments_activation_idx
  on public.practitioner_assignments(activation_id)
  where activation_id is not null;

create trigger programmes_set_updated_at
before update on public.programmes
for each row execute function public.set_updated_at();
create trigger activations_set_updated_at
before update on public.activations
for each row execute function public.set_updated_at();
create trigger activation_readiness_items_set_updated_at
before update on public.activation_readiness_items
for each row execute function public.set_updated_at();

alter table public.programmes enable row level security;
alter table public.activations enable row level security;
alter table public.activation_readiness_items enable row level security;

create policy "Authorised users can read programmes"
on public.programmes for select to authenticated
using (
  public.is_organisation_member(organisation_id)
  or public.is_platform_staff()
);

create policy "Authorised users can read activations"
on public.activations for select to authenticated
using (
  public.is_organisation_member(organisation_id)
  or public.is_platform_staff()
);

create policy "Authorised users can read activation readiness"
on public.activation_readiness_items for select to authenticated
using (
  exists (
    select 1
    from public.activations activation
    where activation.id = activation_readiness_items.activation_id
      and (
        public.is_organisation_member(activation.organisation_id)
        or public.is_platform_staff()
      )
  )
);

revoke all on public.programmes from anon, authenticated;
revoke all on public.activations from anon, authenticated;
revoke all on public.activation_readiness_items from anon, authenticated;

grant select on public.programmes to authenticated;
grant select on public.activations to authenticated;
grant select on public.activation_readiness_items to authenticated;

grant all on public.programmes to service_role;
grant all on public.activations to service_role;
grant all on public.activation_readiness_items to service_role;
