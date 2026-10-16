-- ACTIVE / FINAL
-- Migration ini menyelaraskan katalog permission canonical aplikasi
-- dengan daftar yang dipakai oleh role management, route guards, dan RLS.

begin;

insert into public.permissions (name, description)
values
  ('employee_request_form:create', 'Create employee request forms'),
  ('employee_request_form:read', 'View employee request forms'),
  ('employee_request_form:update', 'Update employee request forms'),
  ('employee_request_form:assign_recruiter', 'Assign recruiters to approved employee request forms'),
  ('employee_request_form:delete', 'Delete employee request forms'),
  ('employee_request_form:close', 'Close employee request forms'),
  ('approval:action', 'Approve or reject assigned approval requests'),
  ('approval:read', 'View approval tracking and approver configuration'),
  ('recruitment:read', 'View recruitment dashboard'),
  ('recruitment:approved_erf_read', 'View approved employee request forms'),
  ('pic_recruitment:read', 'View PIC recruitment page and approved ERF assignment queue'),
  ('pic_recruitment:update', 'Assign or update recruiters from the PIC recruitment page'),
  ('recruitment:document_explorer', 'View candidate document explorer in the recruitment module'),
  ('candidate_form:create', 'Create candidate forms'),
  ('candidate_form:read', 'View candidate forms'),
  ('candidate_form:update', 'Update candidate forms'),
  ('candidate_form:delete', 'Delete candidate forms'),
  ('candidate_form:export_pdf', 'Export candidate forms to PDF'),
  ('employee_form:create', 'Create employee forms'),
  ('employee_form:read', 'View employee forms'),
  ('employee_form:update', 'Update employee forms'),
  ('employee_form:delete', 'Delete employee forms'),
  ('employee_form:export_pdf', 'Export employee forms to PDF'),
  ('document:download', 'Download employee request form and candidate attachments'),
  ('role:manage', 'Manage roles and permission assignments'),
  ('user:create', 'Create and assign application users'),
  ('user:read', 'View users and assigned roles'),
  ('user:update', 'Update user profile and role assignments'),
  ('user:switch_to_employee', 'Switch candidate portal accounts to employee mode'),
  ('user:delete', 'Delete users'),
  ('user_history:read', 'View user management history')
on conflict (name) do update
set description = excluded.description;

with permission_map as (
  select 'approval:update'::text as old_name, 'approval:action'::text as new_name
  union all select 'recruitment:pic_recruitment_read'::text, 'pic_recruitment:read'::text
  union all select 'recruitment:pic_recruitment_update'::text, 'pic_recruitment:update'::text
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

delete from public.role_permissions rp
using public.permissions p
where rp.permission_id = p.id
  and p.name in (
    'approval:update',
    'recruitment:pic_recruitment_read',
    'recruitment:pic_recruitment_update'
  );

delete from public.permissions
where name in (
  'approval:update',
  'recruitment:pic_recruitment_read',
  'recruitment:pic_recruitment_update'
);

commit;
