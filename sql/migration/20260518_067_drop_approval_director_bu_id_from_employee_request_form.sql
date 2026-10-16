alter table if exists public.employee_request_form
  drop constraint if exists new_employee_application_form_approval_director_bu_id_fkey;

alter table if exists public.employee_request_form
  drop column if exists approval_director_bu_id;
