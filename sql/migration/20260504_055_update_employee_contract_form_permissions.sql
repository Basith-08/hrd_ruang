begin;

drop policy if exists employee_contract_form_select on public.employee_contract_form;
create policy employee_contract_form_select
on public.employee_contract_form
for select
to authenticated
using (public.has_permission('employee_contract_form:read'));

drop policy if exists employee_contract_form_insert on public.employee_contract_form;
create policy employee_contract_form_insert
on public.employee_contract_form
for insert
to authenticated
with check (public.has_permission('employee_contract_form:create'));

drop policy if exists employee_contract_form_update on public.employee_contract_form;
create policy employee_contract_form_update
on public.employee_contract_form
for update
to authenticated
using (public.has_permission('employee_contract_form:update'))
with check (public.has_permission('employee_contract_form:update'));

drop policy if exists employee_contract_form_delete on public.employee_contract_form;
create policy employee_contract_form_delete
on public.employee_contract_form
for delete
to authenticated
using (public.has_permission('employee_contract_form:delete'));

commit;
