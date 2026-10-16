begin;

insert into public.permissions (name, description)
values (
  'employee_request_form:assign_recruiter',
  'Assign recruiters to approved employee request forms'
)
on conflict (name) do update
set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select distinct
  rp.role_id,
  p_assign.id
from public.role_permissions rp
join public.permissions p_update on p_update.id = rp.permission_id
join public.permissions p_assign on p_assign.name = 'employee_request_form:assign_recruiter'
where p_update.name = 'employee_request_form:update'
on conflict do nothing;

create or replace function public.can_write_employee_request_form(employee_request_form_created_by uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and (
      (
        public.is_manager()
        and employee_request_form_created_by = auth.uid()
      )
      or (
        not public.is_manager()
        and (
          public.has_permission('employee_request_form:create')
          or public.has_permission('employee_request_form:update')
          or public.has_permission('employee_request_form:assign_recruiter')
          or public.has_permission('employee_request_form:delete')
          or public.has_permission('employee_request_form:close')
        )
      )
    );
$$;

comment on function public.can_write_employee_request_form(uuid) is
  'Applies dashboard ERF write access: manager is owner-scoped; non-manager follows write permissions.';

commit;
