-- Operational documents are entered by staff. This does not generate analytics or process payments.
create table public.portal_records (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('invoice', 'payment', 'request', 'recommendation', 'report')),
  organisation_id uuid not null references public.organisations(id),
  practitioner_user_id uuid references public.practitioner_profiles(user_id),
  title text not null check (char_length(trim(title)) between 2 and 180),
  description text not null default '' check (char_length(description) <= 20000),
  status text not null,
  amount numeric(11,2) check (amount >= 0),
  currency text not null default 'BWP' check (currency ~ '^[A-Z]{3}$'),
  due_on date,
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_record_amount check ((kind in ('invoice','payment')) = (amount is not null)),
  constraint portal_record_recipient check ((kind = 'payment') = (practitioner_user_id is not null)),
  constraint portal_record_status check (
    (kind = 'invoice' and status in ('Draft','Due','Paid','Cancelled','Archived')) or
    (kind = 'payment' and status in ('Pending','Approved','Paid','Cancelled','Archived')) or
    (kind = 'request' and status in ('New','In Review','Approved','Declined','Archived')) or
    (kind = 'recommendation' and status in ('Draft','Published','In Progress','Completed','Archived')) or
    (kind = 'report' and status in ('Draft','In Review','Published','Archived'))
  )
);
create index portal_records_kind_created_idx on public.portal_records(kind, created_at desc, id);
create index portal_records_organisation_idx on public.portal_records(organisation_id, kind, status);
create index portal_records_practitioner_idx on public.portal_records(practitioner_user_id, kind);
create index portal_records_created_by_idx on public.portal_records(created_by);
create index portal_records_updated_by_idx on public.portal_records(updated_by);
-- All access goes through GraphQL permission and tenant checks. No direct client grants.
alter table public.portal_records enable row level security;
revoke all on public.portal_records from anon, authenticated;
grant select, insert, update on public.portal_records to service_role;
create policy portal_records_backend on public.portal_records for all to service_role using (true) with check (true);

create table public.organisation_units (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id),
  parent_id uuid,
  kind text not null check (kind in ('branch','department')),
  name text not null check (char_length(trim(name)) between 2 and 160),
  location text not null default '',
  employees integer not null default 0 check (employees >= 0),
  status text not null default 'Active' check (status in ('Active','Paused','Archived')),
  updated_at timestamptz not null default now(),
  unique (id, organisation_id),
  foreign key (parent_id, organisation_id) references public.organisation_units(id, organisation_id),
  check ((kind = 'branch' and parent_id is null) or (kind = 'department' and parent_id is not null)),
  check (parent_id is distinct from id)
);
create index organisation_units_organisation_idx on public.organisation_units(organisation_id);
create index organisation_units_parent_idx on public.organisation_units(parent_id, organisation_id);
alter table public.organisation_units enable row level security;
revoke all on public.organisation_units from anon, authenticated;
grant select, insert, update on public.organisation_units to service_role;
create policy organisation_units_backend on public.organisation_units for all to service_role using (true) with check (true);
