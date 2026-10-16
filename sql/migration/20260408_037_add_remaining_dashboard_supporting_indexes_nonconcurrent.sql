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

create index if not exists idx_profiles_designation_id
  on public.profiles (designation_id);

create index if not exists idx_master_department_name
  on public.master_department (name);

create index if not exists idx_master_designation_name
  on public.master_designation (name);

create index if not exists idx_candidate_account_projection_created_by_internal_user_id_created_at_desc
  on public.candidate_account_projection (created_by_internal_user_id, created_at desc);

create index if not exists idx_candidate_account_projection_active_created_at_desc
  on public.candidate_account_projection (created_at desc)
  where status = 'active';

create index if not exists idx_candidate_account_projection_inactive_created_at_desc
  on public.candidate_account_projection (created_at desc)
  where status <> 'active';

create index if not exists idx_candidate_application_projection_candidate_id_updated_at_desc
  on public.candidate_application_projection (candidate_id, updated_at desc);

create index if not exists idx_candidate_application_projection_erf_id_updated_at_desc
  on public.candidate_application_projection (erf_id, updated_at desc);

create index if not exists idx_interview_evaluation_forms_interview_date_created_at_desc
  on public.interview_evaluation_forms (interview_date desc, created_at desc);

commit;
