begin;

insert into public.permissions (name, description)
values
  ('pic_recruitment:create', 'Create PIC recruitment records'),
  ('pic_recruitment:read', 'View PIC recruitment page and approved ERF assignment queue'),
  ('pic_recruitment:update', 'Assign or update recruiters from the PIC recruitment page'),
  ('pic_recruitment:delete', 'Delete PIC recruitment records')
on conflict (name) do update
set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select distinct
  rp.role_id,
  p_target.id
from public.role_permissions rp
join public.permissions p_source on p_source.id = rp.permission_id
join public.permissions p_target on p_target.name = 'pic_recruitment:create'
where p_source.name in ('recruitment:pic_recruitment_create', 'employee_request_form:create')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select distinct
  rp.role_id,
  p_target.id
from public.role_permissions rp
join public.permissions p_source on p_source.id = rp.permission_id
join public.permissions p_target on p_target.name = 'pic_recruitment:read'
where p_source.name in (
  'recruitment:pic_recruitment_read',
  'employee_request_form:read',
  'recruitment:approved_erf_read'
)
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select distinct
  rp.role_id,
  p_target.id
from public.role_permissions rp
join public.permissions p_source on p_source.id = rp.permission_id
join public.permissions p_target on p_target.name = 'pic_recruitment:update'
where p_source.name in (
  'recruitment:pic_recruitment_update',
  'employee_request_form:update',
  'employee_request_form:assign_recruiter'
)
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select distinct
  rp.role_id,
  p_target.id
from public.role_permissions rp
join public.permissions p_source on p_source.id = rp.permission_id
join public.permissions p_target on p_target.name = 'pic_recruitment:delete'
where p_source.name in ('recruitment:pic_recruitment_delete', 'employee_request_form:delete')
on conflict do nothing;

delete from public.role_permissions rp
using public.permissions p
where rp.permission_id = p.id
  and p.name in (
    'recruitment:pic_recruitment_create',
    'recruitment:pic_recruitment_read',
    'recruitment:pic_recruitment_update',
    'recruitment:pic_recruitment_delete'
  );

delete from public.permissions
where name in (
  'recruitment:pic_recruitment_create',
  'recruitment:pic_recruitment_read',
  'recruitment:pic_recruitment_update',
  'recruitment:pic_recruitment_delete'
);

create or replace function public.can_access_employee_request_form(employee_request_form_created_by uuid)
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
          public.has_permission('employee_request_form:read')
          or public.has_permission('recruitment:approved_erf_read')
          or public.has_permission('pic_recruitment:read')
          or public.has_permission('approval:read')
          or public.has_permission('recruitment:read')
        )
      )
    );
$$;

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
          or public.has_permission('pic_recruitment:update')
        )
      )
    );
$$;

commit;
