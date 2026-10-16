-- ROLLBACK
-- Mengembalikan perubahan database dari:
-- - 20260402_024_add_active_dashboard_rls.sql
-- - 20260402_025_sync_required_permissions_catalog.sql
-- - 20260402_026_add_rls_supporting_indexes.sql
-- - 20260402_027_add_rls_supporting_indexes_nonconcurrent.sql
-- - 20260402_028_optimize_active_dashboard_rls.sql
--
-- Catatan:
-- - rollback ini fokus mengembalikan perilaku akses database ke kondisi sebelum RLS aktif
-- - rollback permission dibuat konservatif: hanya mengembalikan `approval:update`
--   dan melepas `approval:action`, tanpa menghapus permission lain yang mungkin memang sudah dipakai

begin;

alter view if exists public.recruitment_queue_view
  set (security_invoker = false);

drop policy if exists "roles_select_authenticated" on public.roles;
drop policy if exists "roles_write_role_manage" on public.roles;
alter table if exists public.roles disable row level security;

drop policy if exists "permissions_select_authenticated" on public.permissions;
drop policy if exists "permissions_write_role_manage" on public.permissions;
alter table if exists public.permissions disable row level security;

drop policy if exists "role_permissions_select_authenticated" on public.role_permissions;
drop policy if exists "role_permissions_write_role_manage" on public.role_permissions;
alter table if exists public.role_permissions disable row level security;

drop policy if exists "user_roles_select_scoped" on public.user_roles;
drop policy if exists "user_roles_write_managed" on public.user_roles;
alter table if exists public.user_roles disable row level security;

drop policy if exists "profiles_select_self_or_internal" on public.profiles;
drop policy if exists "profiles_update_self_or_user_update" on public.profiles;
alter table if exists public.profiles disable row level security;

drop policy if exists "employee_request_form_select_scoped" on public.employee_request_form;
drop policy if exists "employee_request_form_insert_scoped" on public.employee_request_form;
drop policy if exists "employee_request_form_update_scoped" on public.employee_request_form;
drop policy if exists "employee_request_form_delete_scoped" on public.employee_request_form;
alter table if exists public.employee_request_form disable row level security;

drop policy if exists "approval_chains_select_scoped" on public.approval_chains;
drop policy if exists "approval_chains_insert_scoped" on public.approval_chains;
drop policy if exists "approval_chains_update_scoped" on public.approval_chains;
drop policy if exists "approval_chains_delete_scoped" on public.approval_chains;
alter table if exists public.approval_chains disable row level security;

drop policy if exists "approval_steps_select_scoped" on public.approval_steps;
drop policy if exists "approval_steps_insert_scoped" on public.approval_steps;
drop policy if exists "approval_steps_update_scoped" on public.approval_steps;
drop policy if exists "approval_steps_delete_scoped" on public.approval_steps;
alter table if exists public.approval_steps disable row level security;

drop policy if exists "approver_master_select_internal" on public.approver_master;
drop policy if exists "approver_master_write_approval_read" on public.approver_master;
alter table if exists public.approver_master disable row level security;

do $$
declare
  target_table text;
begin
  for target_table in
    select unnest(array[
      'master_bu',
      'master_department',
      'master_designation',
      'master_job_level',
      'master_pt',
      'master_custom_grup_1',
      'master_custom_grup_2',
      'master_custom_grup_3',
      'master_custom_grup_4',
      'master_custom_grup_5',
      'master_custom_grup_6'
    ])
  loop
    if to_regclass(format('public.%I', target_table)) is null then
      continue;
    end if;

    execute format(
      'drop policy if exists %I on public.%I',
      target_table || '_select_authenticated',
      target_table
    );

    execute format(
      'drop policy if exists %I on public.%I',
      target_table || '_write_managed',
      target_table
    );

    execute format(
      'alter table public.%I disable row level security',
      target_table
    );
  end loop;
end $$;

do $$
begin
  if to_regclass('public.candidate_account_projection') is not null then
    execute 'drop policy if exists "candidate_account_projection_select_internal_recruitment" on public.candidate_account_projection';
    execute 'alter table public.candidate_account_projection disable row level security';
  end if;

  if to_regclass('public.candidate_application_projection') is not null then
    execute 'drop policy if exists "candidate_application_projection_select_internal_recruitment" on public.candidate_application_projection';
    execute 'alter table public.candidate_application_projection disable row level security';
  end if;
end $$;

insert into public.permissions (name, description)
values ('approval:update', 'Update approval tracking and approver configuration')
on conflict (name) do update
set description = excluded.description;

with action_permission as (
  select id
  from public.permissions
  where name = 'approval:action'
),
update_permission as (
  select id
  from public.permissions
  where name = 'approval:update'
)
insert into public.role_permissions (role_id, permission_id)
select distinct rp.role_id, up.id
from public.role_permissions rp
join action_permission ap on ap.id = rp.permission_id
cross join update_permission up
on conflict do nothing;

delete from public.role_permissions rp
using public.permissions p
where rp.permission_id = p.id
  and p.name = 'approval:action';

delete from public.permissions
where name = 'approval:action';

drop function if exists public.has_any_permission(text[]);
drop function if exists public.can_access_approval_chain(uuid);
drop function if exists public.is_chain_assigned_to_current_user(uuid);
drop function if exists public.approval_chain_employee_request_form_id(uuid);
drop function if exists public.employee_request_form_owner(uuid);
drop function if exists public.can_write_employee_request_form(uuid);
drop function if exists public.can_access_employee_request_form(uuid);
drop function if exists public.is_internal_user();
drop function if exists public.is_candidate();
drop function if exists public.is_manager();
drop function if exists public.has_role(text);
drop function if exists public.current_user_email();

drop index if exists public.idx_employee_request_form_created_by;
drop index if exists public.idx_employee_request_form_created_by_created_at_desc;
drop index if exists public.idx_employee_request_form_created_at_desc;
drop index if exists public.idx_approval_chains_employee_request_form_latest;
drop index if exists public.idx_approval_chains_employee_request_form_created_at_desc;
drop index if exists public.idx_approval_chains_status;
drop index if exists public.idx_approval_steps_chain_id;
drop index if exists public.idx_approval_steps_chain_id_step_order;
drop index if exists public.idx_approval_steps_chain_id_status;
drop index if exists public.idx_approval_steps_chain_id_step_order_status;
drop index if exists public.idx_approval_steps_chain_id_lower_approver_email;
drop index if exists public.idx_approval_steps_lower_approver_email;
drop index if exists public.idx_approver_master_step_order;
drop index if exists public.idx_approver_master_profile_id;
drop index if exists public.idx_candidate_form_candidate_id;
drop index if exists public.idx_candidate_form_employee_request_form_id;
drop index if exists public.idx_candidate_form_candidate_id_created_at_desc;
drop index if exists public.idx_candidate_form_employee_request_form_id_created_at_desc;
drop index if exists public.idx_candidate_languages_candidate_form_id;
drop index if exists public.idx_candidate_references_candidate_form_id;
drop index if exists public.idx_candidate_skills_candidate_form_id;
drop index if exists public.idx_education_candidate_form_id;
drop index if exists public.idx_family_and_emergency_candidate_form_id;
drop index if exists public.idx_work_history_candidate_form_id;
drop index if exists public.idx_user_roles_role_id_user_id;
drop index if exists public.idx_role_permissions_permission_id_role_id;
drop index if exists public.idx_profiles_is_active_false;
drop index if exists public.idx_profiles_department_id;
drop index if exists public.idx_profiles_job_level_id;
drop index if exists public.idx_profiles_designation_id;
drop index if exists public.idx_candidate_account_projection_identity_user_id;
drop index if exists public.idx_candidate_account_projection_created_by_internal_user_id;
drop index if exists public.idx_candidate_account_projection_primary_erf_id;
drop index if exists public.idx_candidate_application_projection_candidate_id;
drop index if exists public.idx_candidate_application_projection_erf_id;
drop index if exists public.idx_candidate_application_projection_submitted_at_desc;

commit;
