begin;

-- =========================================================
-- 1) Ensure canonical permissions exist
-- =========================================================

insert into public.permissions (name, description)
values
  ('employee_request_form:create', 'Create employee request forms'),
  ('employee_request_form:read', 'View employee request forms'),
  ('employee_request_form:update', 'Update employee request forms'),
  ('employee_request_form:delete', 'Delete employee request forms'),
  ('candidate_form:create', 'Create candidate forms'),
  ('candidate_form:read', 'View candidate forms'),
  ('candidate_form:update', 'Update candidate forms'),
  ('candidate_form:delete', 'Delete candidate forms'),
  ('recruitment:read', 'View recruitment dashboard and approved employee request forms')
on conflict (name) do update
set description = excluded.description;

-- =========================================================
-- 2) Remap legacy role permissions to canonical permissions
-- =========================================================

with permission_map as (
  select 'job_request:create'::text as old_name, 'employee_request_form:create'::text as new_name
  union all select 'job_request:read', 'employee_request_form:read'
  union all select 'job_request:update', 'employee_request_form:update'
  union all select 'job_request:delete', 'employee_request_form:delete'
  union all select 'candidate:create', 'candidate_form:create'
  union all select 'candidate:read', 'candidate_form:read'
  union all select 'candidate:update', 'candidate_form:update'
  union all select 'candidate:delete', 'candidate_form:delete'
  union all select 'candidate_data:create', 'candidate_form:create'
  union all select 'candidate_data:read', 'candidate_form:read'
  union all select 'candidate_data:update', 'candidate_form:update'
  union all select 'candidate_data:delete', 'candidate_form:delete'
),
legacy_links as (
  select
    rp.role_id,
    p_new.id as permission_id
  from public.role_permissions rp
  join public.permissions p_old on p_old.id = rp.permission_id
  join permission_map pm on pm.old_name = p_old.name
  join public.permissions p_new on p_new.name = pm.new_name
)
insert into public.role_permissions (role_id, permission_id)
select distinct role_id, permission_id
from legacy_links
on conflict do nothing;

-- =========================================================
-- 3) Remove obsolete role links
-- =========================================================

delete from public.role_permissions rp
using public.permissions p
where rp.permission_id = p.id
  and p.name in (
    'job_request:create',
    'job_request:read',
    'job_request:update',
    'job_request:delete',
    'candidate:create',
    'candidate:read',
    'candidate:update',
    'candidate:delete',
    'candidate_data:create',
    'candidate_data:read',
    'candidate_data:update',
    'candidate_data:delete',
    'recruitment:create',
    'recruitment:update',
    'recruitment:delete',
    'can:upload'
  );

-- =========================================================
-- 4) Remove obsolete permission master rows
-- =========================================================

delete from public.permissions
where name in (
  'job_request:create',
  'job_request:read',
  'job_request:update',
  'job_request:delete',
  'candidate:create',
  'candidate:read',
  'candidate:update',
  'candidate:delete',
  'candidate_data:create',
  'candidate_data:read',
  'candidate_data:update',
  'candidate_data:delete',
  'recruitment:create',
  'recruitment:update',
  'recruitment:delete',
  'can:upload'
);

commit;
