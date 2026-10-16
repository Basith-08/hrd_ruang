# 05. Database Documentation

## Sumber Dokumentasi

Dokumen ini diprioritaskan dari sumber berikut:

- `supabase/public-schema.sql`
- migration repository di `sql/migration/`
- query dan pemakaian object database di source code

Catatan penting:

- `supabase/public-schema.sql` adalah acuan paling akurat untuk state schema `public` yang sudah berhasil didump, namun dump tersebut dibuat sebelum migration `20260529_069` sampai `20260619_080`. Bagian di bawah ini sudah disinkronkan manual dengan migration terbaru di `sql/migration/`.
- Dump ini tidak memuat definisi penuh object di schema non-`public` seperti `auth.users`, tetapi tetap memuat FK yang mereferensikannya.
- Jika object masih dipakai di code tetapi tidak muncul di dump live ini, object tersebut ditandai `Belum ditemukan di schema public saat ini`.

## Ringkasan Object Database

| Jenis object | Jumlah | Catatan |
| --- | --- | --- |
| Enum | 7 | seluruhnya berada di schema `public` |
| Function | 14 | termasuk helper RLS dan trigger function |
| Table | 27 | seluruh tabel aktif yang muncul di dump `public` |
| View | 1 | `recruitment_queue_view` |
| Trigger | 5 | seluruhnya memakai `set_updated_at()` |

## Enumerated Types

| Enum | Nilai |
| --- | --- |
| `blood_type_enum` | `A`, `B`, `AB`, `O` |
| `education_level_enum` | `SD / Sederajat`, `SMP / MTs / Sederajat`, `SMA / SMK / MA / Sederajat`, `Diploma I (D1)`, `Diploma II (D2)`, `Diploma III (D3)`, `Diploma IV (D4)`, `Sarjana (S1)`, `Magister (S2)`, `Doktor (S3)` |
| `employment_status_enum` | `Daily`, `Probation`, `Contract` |
| `gender_enum` | `Male`, `Female` |
| `language_proficiency_level` | `good`, `fair`, `poor` |
| `marital_status_enum` | `Single`, `Married`, `Divorced` |
| `position_status_enum` | `Replacement`, `New Position MPP`, `New Position Non-MPP`, `Internship` |

Catatan:

- Pada dump live ini, enum yang terlihat dipakai langsung oleh tabel aktif adalah `employment_status_enum` dan `position_status_enum`.
- Enum lain tetap ada di database, tetapi kolom pemakainya tidak muncul pada dump `public` aktif ini.

## Functions

| Function | Return | Tipe | Security | Keterangan |
| --- | --- | --- | --- | --- |
| `approval_chain_employee_request_form_id(uuid)` | `uuid` | SQL | `SECURITY DEFINER` | mengambil `employee_request_form_id` dari approval chain |
| `can_access_approval_chain(uuid)` | `boolean` | SQL | `SECURITY DEFINER` | helper akses baca approval chain |
| `can_access_employee_request_form(uuid)` | `boolean` | SQL | `SECURITY DEFINER` | helper akses baca ERF |
| `can_write_employee_request_form(uuid)` | `boolean` | SQL | `SECURITY DEFINER` | helper akses tulis ERF |
| `current_user_email()` | `text` | SQL | standar | email lowercase dari JWT |
| `employee_request_form_owner(uuid)` | `uuid` | SQL | `SECURITY DEFINER` | pemilik ERF |
| `handle_new_user()` | `trigger` | PL/pgSQL | `SECURITY DEFINER` | helper pembuatan profile baru |
| `has_permission(text)` | `boolean` | SQL | `SECURITY DEFINER` | cek permission current user |
| `has_role(text)` | `boolean` | SQL | `SECURITY DEFINER` | cek role current user |
| `is_candidate()` | `boolean` | SQL | `SECURITY DEFINER` | cek role candidate |
| `is_chain_assigned_to_current_user(uuid)` | `boolean` | SQL | `SECURITY DEFINER` | cek apakah email user ada pada step approval |
| `is_internal_user()` | `boolean` | SQL | `SECURITY DEFINER` | authenticated non-candidate user |
| `is_manager()` | `boolean` | SQL | `SECURITY DEFINER` | cek role manager |
| `set_updated_at()` | `trigger` | PL/pgSQL | standar | mengisi `updated_at = now()` |

Catatan:

- Dump live ini juga memuat `COMMENT ON FUNCTION` untuk beberapa helper RLS.
- Grant function diberikan ke `anon`, `authenticated`, dan `service_role`, tetapi akses riil tetap dipengaruhi RLS dan privilege object lain.

## Triggers

Trigger yang benar-benar terlihat pada dump live:

| Trigger | Tabel | Timing | Function |
| --- | --- | --- | --- |
| `trg_set_updated_at__employee_contract_form` | `employee_contract_form` | `BEFORE UPDATE` | `set_updated_at()` |
| `trg_set_updated_at__export_templates` | `export_templates` | `BEFORE UPDATE` | `set_updated_at()` |
| `trg_set_updated_at__interview_evaluation_forms` | `interview_evaluation_forms` | `BEFORE UPDATE` | `set_updated_at()` |
| `trg_set_updated_at__interview_evaluation_interviewer_scores` | `interview_evaluation_interviewer_scores` | `BEFORE UPDATE` | `set_updated_at()` |
| `trg_set_updated_at__interview_evaluation_interviewers` | `interview_evaluation_interviewers` | `BEFORE UPDATE` | `set_updated_at()` |

Catatan:

- Trigger `on_auth_user_created` untuk `auth.users` tidak terlihat di dump `public`, sehingga tidak bisa diverifikasi dari file ini.
- Function `handle_new_user()` ada, tetapi binding trigger ke schema `auth` perlu dikonfirmasi dari dump schema penuh atau dashboard.

## Views

### `recruitment_queue_view`

Fungsi: view turunan untuk dashboard recruitment queue.

Sumber data:

- `employee_request_form`
- `approval_chains`
- `approval_steps`
- `master_pt`
- `master_department`
- `master_designation`
- `master_job_level`
- `profiles` sebagai recruiter
- `master_custom_grup_1` s.d. `master_custom_grup_6`

Karakteristik:

- memakai `WITH (security_invoker='true')`
- mengambil latest approval chain per `employee_request_form`
- membuat ringkasan approver berdasarkan `step_order`
- menurunkan nama recruiter dari `profiles`

View ini telah di-refresh (`drop view` + `create or replace view`) beberapa kali lewat migration lanjutan: `20260520_066`, `20260529_069`, `20260604_074`, `20260609_075`, dan `20260618_078` (state terbaru). Kolom penting pada definisi terbaru:

- `id`
- `chain_id`
- `employee_request_form_id`
- `created_at`
- `updated_at`
- `employee_request_form_pt_pembebanan`
- `employee_request_form_bu_id` (baru, migration `20260609_075`)
- `employee_request_form_business_unit` (baru, migration `20260609_075`, dari `master_bu.name`)
- `employee_request_form_department`
- `employee_request_form_designation` (sejak `20260618_078` memakai `coalesce(master_designation.name, master_job_level.name)`)
- `employee_request_form_job_level` (sama coalesce dengan `employee_request_form_designation`)
- `employee_request_form_main_position`
- `employee_request_form_site`
- `employee_request_form_working_location`
- `employee_request_form_requested_date` (baru, migration `20260604_074`, dari `employee_request_form.requested_date`)
- `employee_request_form_employment_status`
- `employee_request_form_position_status`
- `employee_request_form_required_date`
- `employee_request_form_recruiter_user_id`
- `employee_request_form_recruiter_name`
- `employee_request_form_candidate_name` (selalu `null`, kolom placeholder)
- `employee_request_form_recruitment_flow_stage`
- `employee_request_form_status`
- `employee_request_form_closed_date`
- `employee_request_form_custom_grup_1` s.d. `employee_request_form_custom_grup_6`
- kolom ringkasan approval director BU/GM HRD/director HRD beserta tanggalnya

Sumber data view juga sudah mengikutsertakan `master_designation` (left join via `erf.master_designation_id`) selain `master_job_level` legacy.

## Daftar Tabel

### Tabel aplikasi utama

| Tabel | Fungsi |
| --- | --- |
| `profiles` | profil user internal |
| `roles` | master role |
| `permissions` | master permission |
| `role_permissions` | pivot role-permission |
| `user_roles` | pivot user-role |
| `employee_request_form` | entitas inti kebutuhan karyawan |
| `approval_chains` | header approval ERF |
| `approval_steps` | langkah approval per chain |
| `approver_master` | master approver default |
| `interview_evaluation_forms` | header evaluasi interview |
| `interview_evaluation_interviewers` | interviewer per form |
| `interview_evaluation_interviewer_scores` | detail skor interviewer |
| `employee_contract_form` | form kontrak karyawan |
| `export_templates` | metadata template export DOCX |
| `export_template_fields` | mapping field placeholder |
| `generated_exports` | histori dokumen hasil generate |

### Tabel master / referensi

| Tabel | Fungsi |
| --- | --- |
| `master_pt` | referensi PT |
| `master_bu` | referensi business unit |
| `master_department` | referensi departemen |
| `master_designation` | referensi designation |
| `master_job_level` | referensi job level |
| `master_custom_grup_1` s.d. `master_custom_grup_6` | referensi grup kustom |

### Object eksternal / tidak muncul di dump public

| Object | Status |
| --- | --- |
| `auth.users` | direferensikan oleh FK, tetapi definisi tabel ada di schema `auth` |
| `candidate_form` | tidak muncul di dump `public` live ini |
| `candidate_accounts` | tidak muncul di dump `public` live ini |
| `candidate_applications` | tidak muncul di dump `public` live ini |

## Dokumentasi Per Tabel

### 1. `profiles`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | tidak | PK, FK ke `auth.users.id`, `ON DELETE CASCADE` |
| `username` | `text` | ya | unique |
| `phone` | `text` | ya | nomor telepon |
| `avatar_url` | `text` | ya | URL avatar |
| `created_at` | `timestamptz` | ya | default `now()` |
| `email` | `text` | ya | email |
| `full_name` | `text` | ya | nama lengkap |
| `main_position` | `text` | ya | jabatan utama |
| `personal_data` | `jsonb` | tidak | default `{}` |
| `is_active` | `boolean` | tidak | default `true` |
| `department_id` | `uuid` | ya | FK ke `master_department.id` |
| `designation_id` | `uuid` | ya | FK ke `master_job_level.id` |
| `cost_center_pt` | `text` | ya | cost center; ditambahkan migration `20260610_076`, di-backfill dari `personal_data->>'cost_center_pt'` |

Constraint:

- PK: `profiles_pkey`
- Unique: `profiles_username_key`
- FK: `profiles_id_fkey`, `profiles_department_id_fkey`, `profiles_designation_id_fkey`

### 2. `roles`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | tidak | PK |
| `name` | `text` | tidak | unique |
| `description` | `text` | ya | deskripsi |
| `created_at` | `timestamp` | ya | default `now()` |
| `updated_at` | `timestamptz` | ya | default `now()` |

Constraint:

- PK: `roles_pkey`
- Unique: `roles_name_key`

### 3. `permissions`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | tidak | PK |
| `name` | `text` | tidak | unique |
| `description` | `text` | ya | deskripsi |
| `created_at` | `timestamp` | ya | default `now()` |

Constraint:

- PK: `permissions_pkey`
- Unique: `permissions_name_key`

### 4. `role_permissions`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `role_id` | `uuid` | tidak | PK, FK ke `roles.id`, `ON DELETE CASCADE` |
| `permission_id` | `uuid` | tidak | PK, FK ke `permissions.id`, `ON DELETE CASCADE` |

Constraint:

- PK: `role_permissions_pkey`
- FK: `role_permissions_role_id_fkey`, `role_permissions_permission_id_fkey`

### 5. `user_roles`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `user_id` | `uuid` | tidak | PK, FK ke `auth.users.id`, `ON DELETE CASCADE` |
| `role_id` | `uuid` | tidak | PK, FK ke `roles.id`, `ON DELETE CASCADE` |
| `assigned_at` | `timestamp` | ya | default `now()` |
| `created_at` | `timestamptz` | ya | default `now()` |
| `updated_at` | `timestamptz` | ya | default `now()` |

Constraint:

- PK: `user_roles_pkey`
- FK: `user_roles_user_id_fkey`, `user_roles_role_id_fkey`

### 6. `master_pt`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | tidak | PK |
| `name` | `text` | tidak | unique |
| `description` | `text` | ya | deskripsi |
| `created_at` | `timestamptz` | tidak | default `now()` |
| `updated_at` | `timestamptz` | ya | waktu update |
| `address` | `text` | ya | alamat |

Constraint:

- PK: `master_pt_pkey`
- Unique: `master_pt_name_key`

### 7. `master_bu`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | tidak | PK |
| `name` | `text` | tidak | unique |
| `description` | `text` | ya | deskripsi |
| `created_at` | `timestamptz` | tidak | default `now()` |
| `updated_at` | `timestamptz` | ya | waktu update |

Constraint:

- PK: `master_bu_pkey`
- Unique: `master_bu_name_key`

### 8. `master_department`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | tidak | PK |
| `bu_id` | `uuid` | ya | kolom ada tanpa FK; sengaja dilepas dari `master_bu` oleh migration `20260514_063`/`20260514_065` agar departemen independen dari business unit |
| `name` | `text` | tidak | nama departemen |
| `description` | `text` | ya | deskripsi |
| `created_at` | `timestamptz` | tidak | default `now()` |
| `updated_at` | `timestamptz` | ya | waktu update |

Constraint:

- PK: `master_department_pkey`

### 9. `master_designation`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | tidak | PK |
| `name` | `text` | tidak | nama designation |
| `description` | `text` | ya | deskripsi |
| `created_at` | `timestamptz` | tidak | default `now()` |
| `updated_at` | `timestamptz` | ya | waktu update |
| `required_date_min_months` | `integer` | ya | check `>= 0` bila terisi, ditambahkan migration `20260618_076` |
| `job_level_id` | `uuid` | ya | FK ke `master_job_level.id`, mapping ke legacy job level, ditambahkan migration `20260618_077` |

Constraint:

- PK: `master_designation_pkey`
- Check: `master_designation_required_date_min_months_check`
- FK: `master_designation_job_level_id_fkey`

Index tambahan: `idx_master_designation_job_level_id`.

### 10. `master_job_level`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | tidak | PK |
| `name` | `text` | tidak | unique |
| `description` | `text` | ya | deskripsi |
| `created_at` | `timestamptz` | tidak | default `now()` |
| `updated_at` | `timestamptz` | ya | waktu update |
| `required_date_min_months` | `integer` | ya | check `>= 0` bila terisi |

Constraint:

- PK: `master_job_level_pkey`
- Unique: `master_job_level_name_key`
- Check: `master_job_level_required_date_min_months_check`

### 11. `master_custom_grup_1` s.d. `master_custom_grup_6`

Enam tabel ini memiliki struktur yang sama.

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | tidak | PK |
| `name` | `text` | tidak | nama grup |
| `description` | `text` | ya | deskripsi |
| `created_at` | `timestamptz` | ya | default `now()` |
| `updated_at` | `timestamptz` | ya | default `now()` |

Constraint:

- PK masing-masing: `master_custom_grup_1_pkey` sampai `master_custom_grup_6_pkey`

### 12. `employee_request_form`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | tidak | PK |
| `employment_status` | `employment_status_enum` | ya | status kerja |
| `direct_manager` | `text` | ya | manager langsung |
| `site` | `text` | ya | site |
| `working_location` | `text` | ya | lokasi kerja |
| `required_date` | `date` | ya | tanggal kebutuhan |
| `position_status` | `position_status_enum` | ya | status posisi |
| `periode_probation` | `integer` | ya | lama probation |
| `main_position` | `text` | ya | posisi utama |
| `created_by` | `uuid` | ya | FK ke `profiles.id` |
| `created_at` | `timestamp` | ya | default `now()` |
| `updated_at` | `timestamp` | ya | default `now()` |
| `custom_grup_1_id` | `uuid` | ya | FK ke `master_custom_grup_1.id`, `ON DELETE SET NULL` |
| `custom_grup_2_id` | `uuid` | ya | FK ke `master_custom_grup_2.id`, `ON DELETE SET NULL` |
| `custom_grup_3_id` | `uuid` | ya | FK ke `master_custom_grup_3.id`, `ON DELETE SET NULL` |
| `custom_grup_4_id` | `uuid` | ya | FK ke `master_custom_grup_4.id`, `ON DELETE SET NULL` |
| `custom_grup_5_id` | `uuid` | ya | FK ke `master_custom_grup_5.id`, `ON DELETE SET NULL` |
| `custom_grup_6_id` | `uuid` | ya | FK ke `master_custom_grup_6.id`, `ON DELETE SET NULL` |
| `status` | `text` | ya | default `open` |
| `closed_date` | `timestamptz` | ya | tanggal tutup |
| `closed_category` | `text` | ya | kategori penutupan |
| `reason` | `text` | ya | alasan |
| `pt_id` | `uuid` | ya | FK ke `master_pt.id`, `ON UPDATE CASCADE ON DELETE SET NULL` |
| `organizational_structure` | `text[]` | ya | default array kosong |
| `job_description` | `text[]` | ya | default array kosong |
| `designation_id` | `uuid` | ya | FK ke `master_job_level.id` |
| `department_id` | `uuid` | ya | FK ke `master_department.id` |
| `recruitment_flow_stage` | `text` | ya | stage recruitment |
| `updated_by` | `uuid` | ya | FK ke `profiles.id`, `ON DELETE SET NULL` |
| `bu_id` | `uuid` | ya | FK ke `master_bu.id` |
| `recruiter_user_id` | `uuid` | ya | FK ke `profiles.id`, `ON DELETE SET NULL` |
| `requested_date` | `date` | ya | tanggal request dibuat (Asia/Jakarta); ditambahkan migration `20260604_073`, default `(now() AT TIME ZONE 'Asia/Jakarta')::date` |
| `approval_director_bu_id` | `uuid` | ya | FK ke `profiles.id`, `ON DELETE SET NULL`; director BU yang ditugaskan approval, ditambahkan migration `20260611_076` |
| `master_designation_id` | `uuid` | ya | FK ke `master_designation.id`; pengganti bertahap untuk `designation_id` legacy, ditambahkan migration `20260618_077` |
| `notes` | `text` | ya | catatan tambahan ERF; ditambahkan migration `20260619_080` |
| `document_erf` | `text[]` | ya | default array kosong; path dokumen ERF (Word/PDF) yang diupload untuk autofill form, ditambahkan migration `20260714_084` |

Constraint:

- PK: `new_employee_application_form_pkey`
- FK:
  - `employee_request_form_bu_id_fkey`
  - `employee_request_form_department_id_fkey`
  - `employee_request_form_designation_id_fkey`
  - `employee_request_form_pt_id_fkey`
  - `employee_request_form_recruiter_user_id_fkey`
  - `employee_request_form_updated_by_fkey`
  - `employee_request_form_approval_director_bu_id_fkey`
  - `employee_request_form_master_designation_id_fkey`
  - `new_employee_application_form_created_by_fkey`
  - `new_employee_application_form_custom_grup_1_id_fkey`
  - `new_employee_application_form_custom_grup_2_id_fkey`
  - `new_employee_application_form_custom_grup_3_id_fkey`
  - `new_employee_application_form_custom_grup_4_id_fkey`
  - `new_employee_application_form_custom_grup_5_id_fkey`
  - `new_employee_application_form_custom_grup_6_id_fkey`
- Check:
  - `check_job_request_status`
  - `check_job_request_closed_category`
  - `employee_request_form_recruitment_flow_stage_check`

Index tambahan: `idx_employee_request_form_approval_director_bu_id`, `idx_employee_request_form_master_designation_id`.

### 13. `approval_chains`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | tidak | PK |
| `employee_request_form_id` | `uuid` | tidak | FK ke `employee_request_form.id` |
| `created_by` | `uuid` | ya | FK ke `profiles.id` |
| `status` | `text` | tidak | default `draft` |
| `created_at` | `timestamp` | ya | default `now()` |
| `updated_at` | `timestamp` | ya | default `now()` |

Constraint:

- PK: `approval_chains_pkey`
- FK: `approval_chains_employee_request_form_id_fkey`, `approval_chains_created_by_fkey`

### 14. `approval_steps`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | tidak | PK |
| `chain_id` | `uuid` | tidak | FK ke `approval_chains.id`, `ON DELETE CASCADE` |
| `step_order` | `integer` | tidak | urutan step |
| `approver_email` | `text` | tidak | email approver |
| `approver_name` | `text` | ya | nama approver |
| `token` | `uuid` | ya | default `gen_random_uuid()` |
| `status` | `text` | tidak | default `pending` |
| `approved_at` | `timestamp` | ya | waktu approval |
| `notes` | `text` | ya | catatan |
| `created_at` | `timestamp` | ya | default `now()` |
| `approval_role_key` | `text` | ya | role key |
| `approval_role_label` | `text` | ya | role label |

Constraint:

- PK: `approval_steps_pkey`
- FK: `approval_steps_chain_id_fkey`
- Unique index terverifikasi: `approval_steps_chain_id_step_order_uidx`

### 15. `approver_master`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | tidak | PK |
| `step_order` | `integer` | tidak | default `1` |
| `created_by` | `uuid` | ya | FK ke `profiles.id` |
| `created_at` | `timestamp` | ya | default `now()` |
| `profile_id` | `uuid` | ya | FK ke `profiles.id` |
| `approval_flow_key` | `text` | tidak | key flow |
| `approval_role_key` | `text` | tidak | key role approval |
| `approval_role_label` | `text` | tidak | label role approval |
| `master_designation_id` | `uuid` | ya | FK ke `master_designation.id`; scoping approver per designation, ditambahkan migration `20260618_077` |

Constraint:

- PK: `approver_master_pkey`
- FK: `approver_master_created_by_fkey`, `approver_master_profile_id_fkey`, `approver_master_master_designation_id_fkey`
- Unique index terverifikasi:
  - `idx_approver_master_flow_role_unique`
  - `idx_approver_master_flow_step_unique`

Index tambahan: `idx_approver_master_master_designation_id`.

### 16. `interview_evaluation_forms`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | tidak | PK |
| `employee_request_form_id` | `uuid` | ya | FK ke `employee_request_form.id`, `ON DELETE SET NULL` |
| `candidate_service_candidate_id` | `uuid` | ya | identifier kandidat eksternal |
| `candidate_service_application_id` | `uuid` | ya | identifier aplikasi eksternal |
| `candidate_name` | `text` | tidak | nama kandidat |
| `applied_position` | `text` | ya | posisi dilamar |
| `interviewer_name` | `text` | tidak | field summary/legacy |
| `interview_date` | `timestamp` | tidak | tanggal + jam interview; tipe diubah dari `date` ke `timestamp without time zone` oleh migration `20260619_080` |
| `created_by` | `uuid` | ya | FK ke `profiles.id`, `ON DELETE SET NULL` |
| `updated_by` | `uuid` | ya | FK ke `profiles.id`, `ON DELETE SET NULL` |
| `created_at` | `timestamptz` | tidak | default `now()` |
| `updated_at` | `timestamptz` | tidak | default `now()` |
| `interviewer_recipients` | `jsonb` | tidak | default `[]`, wajib array |
| `average_score` | `numeric(10,2)` | ya | nilai rata-rata |
| `notes` | `text` | ya | catatan tambahan evaluasi; ditambahkan migration `20260619_079` |

Constraint:

- PK: `interview_evaluation_forms_pkey`
- FK:
  - `interview_evaluation_forms_employee_request_form_id_fkey`
  - `interview_evaluation_forms_created_by_fkey`
  - `interview_evaluation_forms_updated_by_fkey`
- Check: `interview_evaluation_forms_interviewer_recipients_is_array`

### 17. `interview_evaluation_interviewers`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | tidak | PK |
| `interview_evaluation_form_id` | `uuid` | tidak | FK ke `interview_evaluation_forms.id`, `ON DELETE CASCADE` |
| `interviewer_user_id` | `uuid` | ya | FK ke `profiles.id`, `ON DELETE SET NULL` |
| `interviewer_name` | `text` | tidak | wajib non-blank |
| `interviewer_email` | `text` | ya | email interviewer |
| `interviewer_job_level` | `text` | ya | job level interviewer |
| `interviewer_label` | `text` | tidak | wajib non-blank |
| `created_at` | `timestamptz` | tidak | default `now()` |
| `updated_at` | `timestamptz` | tidak | default `now()` |
| `comments` | `text` | ya | komentar |
| `recommendation` | `text` | ya | rekomendasi |
| `created_by` | `uuid` | ya | FK ke `profiles.id`, `ON DELETE SET NULL` |
| `updated_by` | `uuid` | ya | FK ke `profiles.id`, `ON DELETE SET NULL` |

Constraint:

- PK: `interview_evaluation_interviewers_pkey`
- FK:
  - `interview_evaluation_intervie_interview_evaluation_form_id_fkey`
  - `interview_evaluation_interviewers_interviewer_user_id_fkey`
  - `interview_evaluation_interviewers_created_by_fkey`
  - `interview_evaluation_interviewers_updated_by_fkey`
- Check:
  - `interview_evaluation_interviewers_label_not_blank`
  - `interview_evaluation_interviewers_name_not_blank`
  - `interview_evaluation_interviewers_recommendation_check`
- Unique:
  - `idx_interview_evaluation_interviewers_form_label_unique`

### 18. `interview_evaluation_interviewer_scores`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | tidak | PK |
| `interview_evaluation_interviewer_id` | `uuid` | tidak | FK ke `interview_evaluation_interviewers.id`, `ON DELETE CASCADE` |
| `item_number` | `integer` | tidak | dibatasi `1..10` |
| `category_title` | `text` | tidak | judul kategori |
| `category_description` | `text` | tidak | deskripsi kategori |
| `score` | `integer` | ya | dibatasi `1..5` atau `null` |
| `info` | `text` | ya | info tambahan |
| `created_at` | `timestamptz` | tidak | default `now()` |
| `updated_at` | `timestamptz` | tidak | default `now()` |
| `created_by` | `uuid` | ya | FK ke `profiles.id`, `ON DELETE SET NULL` |
| `updated_by` | `uuid` | ya | FK ke `profiles.id`, `ON DELETE SET NULL` |

Constraint:

- PK: `interview_evaluation_interviewer_scores_pkey`
- FK:
  - `interview_evaluation_intervie_interview_evaluation_intervi_fkey`
  - `interview_evaluation_interviewer_scores_created_by_fkey`
  - `interview_evaluation_interviewer_scores_updated_by_fkey`
- Unique: `interview_evaluation_interviewer_scores_unique_item`
- Check:
  - `interview_evaluation_interviewer_scores_item_number_check`
  - `interview_evaluation_interviewer_scores_score_check`

### 19. `employee_contract_form`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | tidak | PK |
| `employee_request_form_id` | `uuid` | tidak | FK ke `employee_request_form.id`, `ON DELETE RESTRICT` |
| `candidate_id` | `uuid` | tidak | kandidat eksternal, tanpa FK lokal |
| `candidate_name` | `text` | ya | nama kandidat |
| `candidate_email` | `text` | ya | email kandidat |
| `contract_number` | `text` | tidak | nomor kontrak |
| `employee_code` | `text` | tidak | kode employee |
| `contract_start_date` | `date` | tidak | tanggal mulai |
| `contract_end_date` | `date` | tidak | tanggal selesai |
| `approval_user_id` | `uuid` | ya | FK ke `profiles.id`, `ON DELETE SET NULL` |
| `created_by` | `uuid` | ya | FK ke `profiles.id`, `ON DELETE SET NULL` |
| `updated_by` | `uuid` | ya | FK ke `profiles.id`, `ON DELETE SET NULL` |
| `created_at` | `timestamptz` | tidak | default `now()` |
| `updated_at` | `timestamptz` | tidak | default `now()` |

Constraint:

- PK: `employee_contract_form_pkey`
- Unique: `employee_contract_form_candidate_key`
- FK:
  - `employee_contract_form_employee_request_form_id_fkey`
  - `employee_contract_form_approval_user_id_fkey`
  - `employee_contract_form_created_by_fkey`
  - `employee_contract_form_updated_by_fkey`
- Check: `employee_contract_form_contract_date_check`

### 20. `export_templates`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | tidak | PK |
| `name` | `text` | tidak | nama template |
| `code` | `text` | ya | kode template |
| `description` | `text` | ya | deskripsi |
| `file_name` | `text` | tidak | nama file asli |
| `file_path` | `text` | tidak | path object storage |
| `storage_bucket` | `text` | tidak | default `export-templates` |
| `detected_fields` | `jsonb` | tidak | default `[]` |
| `is_active` | `boolean` | tidak | default `true` |
| `created_by` | `uuid` | ya | kolom ada, FK ke `profiles` tidak ditemukan |
| `created_at` | `timestamptz` | tidak | default `now()` |
| `updated_at` | `timestamptz` | tidak | default `now()` |

Constraint:

- PK: `export_templates_pkey`

### 21. `export_template_fields`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | tidak | PK |
| `template_id` | `uuid` | tidak | FK ke `export_templates.id`, `ON DELETE CASCADE` |
| `field_key` | `text` | tidak | key placeholder |
| `field_label` | `text` | ya | label field |
| `source_type` | `text` | tidak | default `auto` |
| `source_path` | `text` | ya | path sumber data |
| `field_type` | `text` | tidak | default `text` |
| `is_required` | `boolean` | tidak | default `false` |
| `is_editable` | `boolean` | tidak | default `true` |
| `default_value` | `text` | ya | default value |
| `created_at` | `timestamptz` | tidak | default `now()` |

Constraint:

- PK: `export_template_fields_pkey`
- FK: `export_template_fields_template_id_fkey`
- Unique index: `uq_export_template_fields_template_id_field_key`

### 22. `generated_exports`

| Kolom | Tipe | Null | Keterangan |
| --- | --- | --- | --- |
| `id` | `uuid` | tidak | PK |
| `template_id` | `uuid` | ya | FK ke `export_templates.id`, `ON DELETE SET NULL` |
| `candidate_id` | `uuid` | ya | kandidat eksternal |
| `file_name` | `text` | tidak | nama file hasil |
| `file_path` | `text` | ya | path file hasil |
| `payload` | `jsonb` | tidak | payload generate |
| `generated_by` | `uuid` | ya | kolom ada, FK tidak ditemukan |
| `created_at` | `timestamptz` | tidak | default `now()` |

Constraint:

- PK: `generated_exports_pkey`
- FK: `generated_exports_template_id_fkey`

## Relasi Tabel

| Dari | Ke | Kardinalitas | Catatan |
| --- | --- | --- | --- |
| `auth.users` | `profiles` | 1 ke 1 | FK eksplisit dengan `ON DELETE CASCADE` |
| `auth.users` | `user_roles` | 1 ke banyak | FK eksplisit dengan `ON DELETE CASCADE` |
| `roles` | `role_permissions` | 1 ke banyak | FK eksplisit |
| `permissions` | `role_permissions` | 1 ke banyak | FK eksplisit |
| `roles` | `user_roles` | 1 ke banyak | FK eksplisit |
| `master_department` | `profiles` | 1 ke banyak | FK eksplisit |
| `master_job_level` | `profiles` | 1 ke banyak | FK eksplisit |
| `employee_request_form` | `approval_chains` | 1 ke banyak | FK eksplisit |
| `approval_chains` | `approval_steps` | 1 ke banyak | `ON DELETE CASCADE` |
| `employee_request_form` | `interview_evaluation_forms` | 1 ke banyak | `ON DELETE SET NULL` |
| `interview_evaluation_forms` | `interview_evaluation_interviewers` | 1 ke banyak | `ON DELETE CASCADE` |
| `interview_evaluation_interviewers` | `interview_evaluation_interviewer_scores` | 1 ke banyak | `ON DELETE CASCADE` |
| `employee_request_form` | `employee_contract_form` | 1 ke banyak | `ON DELETE RESTRICT` |
| `export_templates` | `export_template_fields` | 1 ke banyak | `ON DELETE CASCADE` |
| `export_templates` | `generated_exports` | 1 ke banyak | `ON DELETE SET NULL` |
| `master_designation` | `employee_request_form` | 1 ke banyak | FK eksplisit, ditambahkan `20260618_077` |
| `master_designation` | `approver_master` | 1 ke banyak | FK eksplisit, ditambahkan `20260618_077` |
| `master_job_level` | `master_designation` | 1 ke banyak | FK eksplisit (`job_level_id`), ditambahkan `20260618_077` |
| `profiles` | `employee_request_form` (`approval_director_bu_id`) | 1 ke banyak | `ON DELETE SET NULL`, ditambahkan `20260611_076` |
| `master_bu` | `employee_request_form` | 1 ke banyak | FK eksplisit `bu_id` |

## Index yang Terdeteksi

Index di bawah benar-benar muncul pada dump live:

| Tabel/Object | Index |
| --- | --- |
| `approval_chains` | `approval_chains_job_request_id_idx`, `approval_chains_one_active_per_job_request_uidx`, `idx_approval_chain_erf_status`, `idx_approval_chains_created_at`, `idx_approval_chains_created_by`, `idx_approval_chains_erf_id`, `idx_approval_chains_job_request_id` |
| `approval_steps` | `approval_steps_chain_id_idx`, `approval_steps_chain_id_step_order_uidx`, `approval_steps_token_idx`, `idx_approval_steps_approver_email`, `idx_approval_steps_chain_order`, `idx_approval_steps_email`, `idx_approval_steps_status`, `idx_approval_steps_token` |
| `approver_master` | `idx_approver_master_created_by`, `idx_approver_master_employee_id`, `idx_approver_master_flow_role_unique`, `idx_approver_master_flow_step_unique` |
| `employee_contract_form` | `idx_employee_contract_form_approval_user_id`, `idx_employee_contract_form_candidate_id`, `idx_employee_contract_form_employee_request_form_id` |
| `employee_request_form` | `employee_request_form_pt_id_idx`, `idx_employee_request_form_bu_id`, `idx_employee_request_form_designation_id`, `idx_employee_request_form_recruiter_user_id`, `idx_erf_created_at`, `idx_erf_created_by`, `idx_erf_pt_id`, `idx_erf_required_date`, `idx_erf_status`, `idx_erf_status_created_at`, `idx_new_employee_application_form_closed_date`, `idx_new_employee_application_form_created_at`, `idx_new_employee_application_form_created_by`, `idx_new_employee_application_form_custom_grup_1_id`, `idx_new_employee_application_form_custom_grup_2_id`, `idx_new_employee_application_form_custom_grup_3_id`, `idx_new_employee_application_form_custom_grup_4_id`, `idx_new_employee_application_form_custom_grup_5_id`, `idx_new_employee_application_form_custom_grup_6_id`, `idx_new_employee_application_form_main_position`, `idx_new_employee_application_form_required_date`, `idx_new_employee_application_form_status`, `idx_new_employee_application_form_updated_at` |
| `export_template_fields` | `idx_export_template_fields_template_id`, `uq_export_template_fields_template_id_field_key` |
| `generated_exports` | `idx_generated_exports_candidate_id`, `idx_generated_exports_template_id` |
| `interview_evaluation_forms` | `idx_interview_evaluation_forms_candidate_service_candidate_id`, `idx_interview_evaluation_forms_employee_request_form_id`, `idx_interview_evaluation_forms_interview_date_created_at_desc` |
| `interview_evaluation_interviewer_scores` | `idx_interview_evaluation_interviewer_scores_interviewer_id` |
| `interview_evaluation_interviewers` | `idx_interview_evaluation_interviewers_form_id`, `idx_interview_evaluation_interviewers_form_label_unique`, `idx_interview_evaluation_interviewers_user_id` |
| `master_department` | `idx_master_department_name` |
| `master_designation` | `idx_master_designation_name` |
| `profiles` | `idx_employees_email`, `idx_profiles_designation_id`, `idx_profiles_email` |
| `role_permissions` | `idx_role_permissions_permission_id`, `idx_role_permissions_role_id` |
| `roles` | `idx_roles_updated_at` |
| `user_roles` | `idx_user_roles_assigned_at`, `idx_user_roles_role_id`, `idx_user_roles_user_id` |

## Timestamp yang Digunakan

| Tabel | Kolom timestamp |
| --- | --- |
| `profiles` | `created_at` |
| `roles` | `created_at`, `updated_at` |
| `permissions` | `created_at` |
| `user_roles` | `assigned_at`, `created_at`, `updated_at` |
| `master_pt` | `created_at`, `updated_at` |
| `master_bu` | `created_at`, `updated_at` |
| `master_department` | `created_at`, `updated_at` |
| `master_designation` | `created_at`, `updated_at` |
| `master_job_level` | `created_at`, `updated_at` |
| `master_custom_grup_1..6` | `created_at`, `updated_at` |
| `employee_request_form` | `created_at`, `updated_at`, `closed_date` |
| `approval_chains` | `created_at`, `updated_at` |
| `approval_steps` | `approved_at`, `created_at` |
| `approver_master` | `created_at` |
| `interview_evaluation_forms` | `created_at`, `updated_at` |
| `interview_evaluation_interviewers` | `created_at`, `updated_at` |
| `interview_evaluation_interviewer_scores` | `created_at`, `updated_at` |
| `employee_contract_form` | `created_at`, `updated_at` |
| `export_templates` | `created_at`, `updated_at` |
| `export_template_fields` | `created_at` |
| `generated_exports` | `created_at` |

## Contoh Query Penting

### Load role dan permission user

```sql
select
  ur.user_id,
  r.name as role_name,
  p.name as permission_name
from user_roles ur
join roles r on r.id = ur.role_id
join role_permissions rp on rp.role_id = r.id
join permissions p on p.id = rp.permission_id
where ur.user_id = :user_id;
```

### Load ERF dan referensi master

```sql
select
  erf.id,
  erf.main_position,
  erf.status,
  erf.recruitment_flow_stage,
  pt.name as pt_name,
  bu.name as bu_name,
  dept.name as department_name,
  lvl.name as job_level_name
from employee_request_form erf
left join master_pt pt on pt.id = erf.pt_id
left join master_bu bu on bu.id = erf.bu_id
left join master_department dept on dept.id = erf.department_id
left join master_job_level lvl on lvl.id = erf.designation_id
where erf.id = :employee_request_form_id;
```

### Load approval chain dan step

```sql
select
  ac.id as chain_id,
  ac.status as chain_status,
  aps.id as step_id,
  aps.step_order,
  aps.approver_email,
  aps.status as step_status
from approval_chains ac
join approval_steps aps on aps.chain_id = ac.id
where ac.employee_request_form_id = :employee_request_form_id
order by aps.step_order asc;
```

### Load template export aktif

```sql
select
  id,
  name,
  code,
  file_name,
  file_path,
  storage_bucket,
  detected_fields
from export_templates
where is_active = true
order by created_at desc;
```

### Load field mapping template

```sql
select
  id,
  template_id,
  field_key,
  field_label,
  source_type,
  source_path,
  field_type,
  is_required,
  is_editable,
  default_value
from export_template_fields
where template_id = :template_id
order by created_at asc;
```

### Load recruitment queue view

```sql
select
  id,
  employee_request_form_id,
  employee_request_form_main_position,
  employee_request_form_required_date,
  employee_request_form_recruiter_name,
  employee_request_form_status
from recruitment_queue_view
order by updated_at desc;
```

## Catatan Migrasi dan Keterbatasan

- `candidate_form` dan child tables mirror kandidat tidak muncul pada dump `supabase/public-schema.sql`. Bila code masih membaca domain kandidat, besar kemungkinan sumber datanya sudah eksternal atau berada di database lain.
- Dump ini memperlihatkan `recruitment_queue_view` aktif di live schema `public`.
- Migration `20260529_069` s.d. `20260619_080` (12 file) belum tercermin di dump `public-schema.sql`, tetapi sudah disinkronkan manual ke dokumen ini: `master_designation.required_date_min_months`/`job_level_id`, `employee_request_form.requested_date`/`approval_director_bu_id`/`master_designation_id`/`notes`, `approver_master.master_designation_id`, `profiles.cost_center_pt`, `interview_evaluation_forms.notes` dan perubahan tipe `interview_date`, serta refresh `recruitment_queue_view`.
- Migration `20260714_084_add_dokument_erf_to_employee_request_form.sql` menambahkan `employee_request_form.document_erf` (`text[]`, default `{}`). Kolom ini belum tercermin di dump `public-schema.sql`.
- RLS aktif di banyak tabel, termasuk `export_templates`, `export_template_fields`, dan `generated_exports`. Namun dump ini tidak menampilkan policy eksplisit untuk tiga tabel export tersebut.
- Grant `ALL` ke `anon` dan `authenticated` terlihat pada banyak object, tetapi akses efektif tetap dibatasi oleh RLS.
- Untuk audit yang juga mencakup trigger di schema `auth`, storage policy, extension, dan object non-`public`, perlu dump schema yang lebih lengkap atau verifikasi langsung di Supabase Dashboard.
