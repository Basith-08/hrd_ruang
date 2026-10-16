-- ACTIVE / FINAL
-- Alternatif SQL Editor untuk environment yang membungkus query dalam transaction block.
--
-- Gunakan file ini bila:
-- - SQL Editor Anda menolak `create index concurrently`
-- - Anda ingin menjalankan semua index sekaligus dalam satu execution
--
-- Catatan:
-- - file ini sengaja memakai `create index if not exists` biasa
-- - pembuatan index dapat mengambil lock lebih agresif dibanding versi `concurrently`
-- - lebih aman dipakai di dev/staging atau production saat traffic rendah

begin;

create index if not exists idx_employee_request_form_created_by
  on public.employee_request_form (created_by);

create index if not exists idx_employee_request_form_created_by_created_at_desc
  on public.employee_request_form (created_by, created_at desc);

create index if not exists idx_employee_request_form_created_at_desc
  on public.employee_request_form (created_at desc);

create index if not exists idx_approval_chains_employee_request_form_latest
  on public.approval_chains (employee_request_form_id, updated_at desc, created_at desc, id desc);

create index if not exists idx_approval_chains_employee_request_form_created_at_desc
  on public.approval_chains (employee_request_form_id, created_at desc);

create index if not exists idx_approval_chains_status
  on public.approval_chains (status);

create index if not exists idx_approval_steps_chain_id
  on public.approval_steps (chain_id);

create index if not exists idx_approval_steps_chain_id_step_order
  on public.approval_steps (chain_id, step_order);

create index if not exists idx_approval_steps_chain_id_status
  on public.approval_steps (chain_id, status);

create index if not exists idx_approval_steps_chain_id_step_order_status
  on public.approval_steps (chain_id, step_order, status);

create index if not exists idx_approval_steps_chain_id_lower_approver_email
  on public.approval_steps (chain_id, lower(approver_email));

create index if not exists idx_approval_steps_lower_approver_email
  on public.approval_steps (lower(approver_email));

create index if not exists idx_approver_master_step_order
  on public.approver_master (step_order);

create index if not exists idx_approver_master_profile_id
  on public.approver_master (profile_id);

do $$
begin
  if to_regclass('public.candidate_form') is not null then
    execute 'create index if not exists idx_candidate_form_candidate_id on public.candidate_form (candidate_id)';
    execute 'create index if not exists idx_candidate_form_employee_request_form_id on public.candidate_form (employee_request_form_id)';
    execute 'create index if not exists idx_candidate_form_candidate_id_created_at_desc on public.candidate_form (candidate_id, created_at desc)';
    execute 'create index if not exists idx_candidate_form_employee_request_form_id_created_at_desc on public.candidate_form (employee_request_form_id, created_at desc)';
  end if;

  if to_regclass('public.candidate_languages') is not null then
    execute 'create index if not exists idx_candidate_languages_candidate_form_id on public.candidate_languages (candidate_form_id)';
  end if;

  if to_regclass('public.candidate_references') is not null then
    execute 'create index if not exists idx_candidate_references_candidate_form_id on public.candidate_references (candidate_form_id)';
  end if;

  if to_regclass('public.candidate_skills') is not null then
    execute 'create index if not exists idx_candidate_skills_candidate_form_id on public.candidate_skills (candidate_form_id)';
  end if;

  if to_regclass('public.education') is not null then
    execute 'create index if not exists idx_education_candidate_form_id on public.education (candidate_form_id)';
  end if;

  if to_regclass('public.family_and_emergency') is not null then
    execute 'create index if not exists idx_family_and_emergency_candidate_form_id on public.family_and_emergency (candidate_form_id)';
  end if;

  if to_regclass('public.work_history') is not null then
    execute 'create index if not exists idx_work_history_candidate_form_id on public.work_history (candidate_form_id)';
  end if;
end $$;

create index if not exists idx_user_roles_role_id_user_id
  on public.user_roles (role_id, user_id);

create index if not exists idx_role_permissions_permission_id_role_id
  on public.role_permissions (permission_id, role_id);

create index if not exists idx_profiles_is_active_false
  on public.profiles (created_at desc)
  where is_active = false;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'department_id'
  ) then
    execute 'create index if not exists idx_profiles_department_id on public.profiles (department_id)';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'job_level_id'
  ) then
    execute 'create index if not exists idx_profiles_job_level_id on public.profiles (job_level_id)';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'designation_id'
  ) then
    execute 'create index if not exists idx_profiles_designation_id on public.profiles (designation_id)';
  end if;
end $$;

do $$
begin
  if to_regclass('public.candidate_account_projection') is not null then
    execute 'create index if not exists idx_candidate_account_projection_identity_user_id on public.candidate_account_projection (identity_user_id)';
    execute 'create index if not exists idx_candidate_account_projection_created_by_internal_user_id on public.candidate_account_projection (created_by_internal_user_id)';
    execute 'create index if not exists idx_candidate_account_projection_primary_erf_id on public.candidate_account_projection (primary_erf_id)';
  end if;

  if to_regclass('public.candidate_application_projection') is not null then
    execute 'create index if not exists idx_candidate_application_projection_candidate_id on public.candidate_application_projection (candidate_id)';
    execute 'create index if not exists idx_candidate_application_projection_erf_id on public.candidate_application_projection (erf_id)';
    execute 'create index if not exists idx_candidate_application_projection_submitted_at_desc on public.candidate_application_projection (submitted_at desc)';
  end if;
end $$;

commit;
