alter table public.organisations
add column if not exists workforce_size integer
check (workforce_size is null or workforce_size >= 0);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  employee_number text not null,
  full_name text not null,
  email text,
  department text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, employee_number)
);

alter table public.employees enable row level security;

create index if not exists employees_organisation_id_idx
on public.employees (organisation_id);

drop trigger if exists employees_set_updated_at on public.employees;
create trigger employees_set_updated_at
before update on public.employees
for each row execute function public.set_updated_at();

create policy "Authorised users can read employees"
on public.employees
for select
to authenticated
using (
  public.is_organisation_member(organisation_id)
  or public.is_platform_staff()
);

