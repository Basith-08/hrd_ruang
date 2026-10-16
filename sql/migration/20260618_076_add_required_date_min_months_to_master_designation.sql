alter table public.master_designation
  add column if not exists required_date_min_months integer;

alter table public.master_designation
  drop constraint if exists master_designation_required_date_min_months_check;

alter table public.master_designation
  add constraint master_designation_required_date_min_months_check
  check (required_date_min_months is null or required_date_min_months >= 0);
