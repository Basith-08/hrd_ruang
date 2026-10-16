begin;

create table if not exists public.employee_contract_form (
  id uuid primary key default gen_random_uuid(),
  employee_request_form_id uuid not null references public.employee_request_form(id) on delete restrict,
  candidate_id uuid not null,
  candidate_name text,
  candidate_email text,
  contract_number text not null,
  employee_code text not null,
  contract_start_date date not null,
  contract_end_date date not null,
  approval_user_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint employee_contract_form_candidate_key unique (employee_request_form_id, candidate_id),
  constraint employee_contract_form_contract_date_check check (contract_end_date >= contract_start_date)
);

create index if not exists idx_employee_contract_form_employee_request_form_id
  on public.employee_contract_form(employee_request_form_id);

create index if not exists idx_employee_contract_form_candidate_id
  on public.employee_contract_form(candidate_id);

create index if not exists idx_employee_contract_form_approval_user_id
  on public.employee_contract_form(approval_user_id);

alter table public.employee_contract_form enable row level security;

drop policy if exists employee_contract_form_select on public.employee_contract_form;
create policy employee_contract_form_select
on public.employee_contract_form
for select
to authenticated
using (public.has_permission('employee_form:read'));

drop policy if exists employee_contract_form_insert on public.employee_contract_form;
create policy employee_contract_form_insert
on public.employee_contract_form
for insert
to authenticated
with check (public.has_permission('employee_form:create'));

drop policy if exists employee_contract_form_update on public.employee_contract_form;
create policy employee_contract_form_update
on public.employee_contract_form
for update
to authenticated
using (public.has_permission('employee_form:update'))
with check (public.has_permission('employee_form:update'));

drop policy if exists employee_contract_form_delete on public.employee_contract_form;
create policy employee_contract_form_delete
on public.employee_contract_form
for delete
to authenticated
using (public.has_permission('employee_form:delete'));

drop trigger if exists trg_set_updated_at__employee_contract_form on public.employee_contract_form;
create trigger trg_set_updated_at__employee_contract_form
before update on public.employee_contract_form
for each row execute function public.set_updated_at();

commit;
