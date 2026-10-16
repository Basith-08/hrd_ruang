begin;

alter table if exists public.profiles
  drop constraint if exists profiles_employee_request_form_id_fkey;

alter table if exists public.profiles
  drop column if exists employee_request_form_id;

alter table if exists public.candidate_form
  add constraint candidate_form_employee_request_form_id_candidate_id_key
  unique (employee_request_form_id, candidate_id);

commit;
