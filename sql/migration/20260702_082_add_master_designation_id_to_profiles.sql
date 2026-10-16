begin;

-- Tambah master_designation_id ke profiles, mengikuti pola migration 077
-- (employee_request_form & approver_master) agar designation user/employee
-- juga bisa merujuk ke master_designation, bukan cuma master_job_level.
alter table public.profiles
  add column if not exists master_designation_id uuid;

alter table public.profiles
  drop constraint if exists profiles_master_designation_id_fkey;

alter table public.profiles
  add constraint profiles_master_designation_id_fkey
  foreign key (master_designation_id)
  references public.master_designation(id);

create index if not exists idx_profiles_master_designation_id
  on public.profiles(master_designation_id);

commit;
