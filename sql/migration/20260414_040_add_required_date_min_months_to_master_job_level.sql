alter table public.master_job_level
  add column if not exists required_date_min_months integer;

alter table public.master_job_level
  drop constraint if exists master_job_level_required_date_min_months_check;

alter table public.master_job_level
  add constraint master_job_level_required_date_min_months_check
  check (required_date_min_months is null or required_date_min_months >= 0);
