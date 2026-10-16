begin;

alter table if exists public.employee_request_form
  add column if not exists notes text;

commit;
