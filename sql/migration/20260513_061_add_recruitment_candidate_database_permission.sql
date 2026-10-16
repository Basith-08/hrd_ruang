begin;

insert into public.permissions (name, description)
values (
  'recruitment:candidate_database',
  'View candidate database page in the recruitment module'
)
on conflict (name) do update
set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select distinct
  rp.role_id,
  p_candidate_database.id as permission_id
from public.role_permissions rp
join public.permissions p_existing
  on p_existing.id = rp.permission_id
join public.permissions p_candidate_database
  on p_candidate_database.name = 'recruitment:candidate_database'
where p_existing.name in ('candidate_form:read', 'employee_form:read')
on conflict do nothing;

commit;
