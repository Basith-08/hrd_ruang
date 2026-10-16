-- ACTIVE / FINAL
-- Menambah index lanjutan untuk query dashboard yang belum tercakup
-- oleh migration index sebelumnya.
--
-- Fokus migration ini:
-- - projection query yang memfilter lalu mengurutkan berdasarkan `updated_at`
-- - daftar candidate account projection aktif / non-aktif
-- - lookup master data berdasarkan `name`
-- - daftar interview evaluation berdasarkan tanggal interview terbaru
--
-- Penting:
-- - file ini sengaja tidak memakai BEGIN/COMMIT
-- - `create index concurrently` tidak boleh dijalankan di dalam transaction block
-- - jalankan saat traffic relatif sepi bila ukuran tabel sudah besar

create index concurrently if not exists idx_profiles_designation_id
  on public.profiles (designation_id);

create index concurrently if not exists idx_master_department_name
  on public.master_department (name);

create index concurrently if not exists idx_master_designation_name
  on public.master_designation (name);

create index concurrently if not exists idx_candidate_account_projection_created_by_internal_user_id_created_at_desc
  on public.candidate_account_projection (created_by_internal_user_id, created_at desc);

create index concurrently if not exists idx_candidate_account_projection_active_created_at_desc
  on public.candidate_account_projection (created_at desc)
  where status = 'active';

create index concurrently if not exists idx_candidate_account_projection_inactive_created_at_desc
  on public.candidate_account_projection (created_at desc)
  where status <> 'active';

create index concurrently if not exists idx_candidate_application_projection_candidate_id_updated_at_desc
  on public.candidate_application_projection (candidate_id, updated_at desc);

create index concurrently if not exists idx_candidate_application_projection_erf_id_updated_at_desc
  on public.candidate_application_projection (erf_id, updated_at desc);

create index concurrently if not exists idx_interview_evaluation_forms_interview_date_created_at_desc
  on public.interview_evaluation_forms (interview_date desc, created_at desc);
