-- ACTIVE / FINAL
-- Migration ini memisahkan permission dashboard recruitment dan approved ERF
-- dan tetap relevan untuk state akses internal saat ini.

begin;

insert into public.permissions (name, description)
values
  ('recruitment:read', 'View recruitment dashboard'),
  ('recruitment:approved_erf_read', 'View approved employee request forms')
on conflict (name) do update
set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select distinct
  rp.role_id,
  p_approved.id as permission_id
from public.role_permissions rp
join public.permissions p_existing
  on p_existing.id = rp.permission_id
join public.permissions p_approved
  on p_approved.name = 'recruitment:approved_erf_read'
where p_existing.name = 'recruitment:read'
on conflict do nothing;

commit;
