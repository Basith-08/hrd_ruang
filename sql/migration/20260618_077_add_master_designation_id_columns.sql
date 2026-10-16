begin;

-- Fase 1: Tambah master_designation_id ke employee_request_form
alter table public.employee_request_form
  add column if not exists master_designation_id uuid;

alter table public.employee_request_form
  drop constraint if exists employee_request_form_master_designation_id_fkey;

alter table public.employee_request_form
  add constraint employee_request_form_master_designation_id_fkey
  foreign key (master_designation_id)
  references public.master_designation(id);

create index if not exists idx_employee_request_form_master_designation_id
  on public.employee_request_form(master_designation_id);

-- Fase 1: Tambah job_level_id ke master_designation (mapping ke legacy job level)
alter table public.master_designation
  add column if not exists job_level_id uuid;

alter table public.master_designation
  drop constraint if exists master_designation_job_level_id_fkey;

alter table public.master_designation
  add constraint master_designation_job_level_id_fkey
  foreign key (job_level_id)
  references public.master_job_level(id);

create index if not exists idx_master_designation_job_level_id
  on public.master_designation(job_level_id);

-- Fase 1: Tambah master_designation_id ke approver_master
alter table public.approver_master
  add column if not exists master_designation_id uuid;

alter table public.approver_master
  drop constraint if exists approver_master_master_designation_id_fkey;

alter table public.approver_master
  add constraint approver_master_master_designation_id_fkey
  foreign key (master_designation_id)
  references public.master_designation(id);

create index if not exists idx_approver_master_master_designation_id
  on public.approver_master(master_designation_id);

commit;
