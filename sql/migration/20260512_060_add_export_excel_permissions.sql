-- ACTIVE / FINAL
-- Menambahkan permission export Excel untuk candidate form dan employee form.

begin;

insert into public.permissions (name, description)
values
  ('candidate_form:export_excel', 'Export candidate forms to Excel'),
  ('employee_form:export_excel', 'Export employee forms to Excel')
on conflict (name) do update
set description = excluded.description;

commit;
