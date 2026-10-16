-- Keep one canonical administrator role name: super_admin.
begin;

insert into public.user_roles (user_id, role_id)
select ur.user_id, canonical.id
from public.user_roles ur
join public.roles legacy on legacy.id = ur.role_id
cross join (
  select id
  from public.roles
  where name = 'super_admin'
  limit 1
) canonical
where legacy.name in ('admin', 'administrator', 'super admin')
on conflict (user_id, role_id) do nothing;

delete from public.roles
where name in ('admin', 'administrator', 'super admin');

commit;
