begin;

insert into public.permissions (name, description)
values (
  'employee_request_form:requester_update',
  'Update the requester field on employee request forms'
)
on conflict (name) do update
set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select distinct
  rp.role_id,
  p_requester_update.id
from public.role_permissions rp
join public.permissions p_source on p_source.id = rp.permission_id
join public.permissions p_requester_update on p_requester_update.name = 'employee_request_form:requester_update'
where p_source.name = 'employee_request_form:update'
on conflict do nothing;

commit;
