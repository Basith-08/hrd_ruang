# Database Documentation

Folder `sql/migration` adalah sumber utama dokumentasi database Supabase untuk proyek ini. Isi folder ini menggabungkan:

- migration yang sudah terversioning di repo
- snapshot schema di `sql/migration/database.sql`
- object SQL yang sebelumnya hanya tampak di Supabase Dashboard dan sekarang sudah dimasukkan ke migration
- validasi state live dari dump `supabase/public-schema.sql`

`database.sql` tetap dianggap snapshot konteks, bukan file yang siap dieksekusi. Untuk penjelasan bisnis dan hubungan database dengan fitur aplikasi, lihat juga `penjelasan.md`.

Catatan validasi terbaru:

- `supabase/public-schema.sql` saat ini adalah sumber paling akurat untuk state schema `public` yang benar-benar hidup di Supabase.
- Dump live tersebut mengonfirmasi object aktif seperti:
  - enum `employment_status_enum`, `position_status_enum`, dan enum pendukung lain
  - helper function RLS seperti `has_permission`, `has_role`, `can_access_employee_request_form`
  - `recruitment_queue_view`
  - tabel export configuration: `export_templates`, `export_template_fields`, `generated_exports`
  - index final dan policy RLS untuk tabel aktif
- Dump live tersebut juga menunjukkan bahwa tabel mirror kandidat seperti `candidate_form` dan child tables `tidak muncul` di schema `public` saat ini.
- Karena itu, untuk isu yang menyangkut schema aktif final, prioritaskan:
  1. `supabase/public-schema.sql`
  2. file migration terkait
  3. `sql/migration/database.sql` hanya sebagai snapshot konteks tambahan

Jika tujuan Anda adalah cepat tahu migration mana yang masih efektif dan mana yang cuma histori transisi, buka juga `sql/migration/CURRENT_STATE.md`.

Untuk acuan schema aktif final, gunakan juga:

- [schema-active-hrd-ruang.md](schema-active-hrd-ruang.md)
- [schema-active-hrd-pintu.md](schema-active-hrd-pintu.md)

Catatan penting untuk modul kandidat:

- beberapa file migration kandidat lama di folder ini sekarang hanya bersifat histori atau transisi
- object kandidat yang aktif final berada di `hrd_pintu`
- jika environment dashboard Anda sudah tidak memiliki tabel mirror lokal seperti `candidate_form`, itu masih sesuai dengan arah arsitektur terbaru

Status ringkas migration kandidat yang paling sering membingungkan:

- `20260329_005_bind_candidate_profiles_to_erf.sql`
  - partially superseded
- `20260330_009_refresh_recruitment_queue_view_from_approval_steps.sql`
  - superseded
- `20260330_012_add_candidate_form_completion_status.sql`
  - historical / transitional
- `20260330_013_create_candidate_documents_table.sql`
  - obsolete
- `20260330_014_add_candidate_documents_rls_and_storage_policies.sql`
  - obsolete
- `20260401_019_add_candidate_service_projection.sql`
  - obsolete / historical
- `20260402_024_add_active_dashboard_rls.sql`
  - active / final
- `20260402_025_sync_required_permissions_catalog.sql`
  - active / final
- `20260402_026_add_rls_supporting_indexes.sql`
  - active / final
- `20260402_027_add_rls_supporting_indexes_nonconcurrent.sql`
  - active / final
- `20260402_022_add_candidate_service_form_mirror_columns.sql`
  - transitional / legacy compatibility
- `20260402_023_drop_obsolete_candidate_documents.sql`
  - active cleanup
- `20260421_043_drop_candidate_service_projection_tables.sql`
  - active cleanup

## Cara Membaca di Supabase Dashboard

Struktur dokumentasi di bawah sengaja mengikuti menu `Database Management` di Supabase:

- `Tables`: lihat struktur tabel, FK, dan kolom utama.
- `Functions`: lihat function SQL atau PL/pgSQL yang reusable.
- `Triggers`: lihat trigger yang memanggil function untuk side effect otomatis.
- `Enumerated Types`: lihat enum Postgres yang membatasi nilai kolom tertentu.
- `Indexes`: lihat index eksplisit di luar PK atau UNIQUE bawaan.
- `Extensions`: lihat extension Postgres yang dipakai database.
- `Publications`: lihat object replication atau logical publication.
- `Policies / RLS`: lihat akses row-level di tabel dan storage.

## Tables

### Approval dan recruitment

- `public.employee_request_form`
  - Tabel inti permintaan kebutuhan karyawan.
  - Menjadi parent untuk `approval_chains`, modul interview evaluation, employee contract form, dan data di `recruitment_queue_view`.
  - Snapshot struktur ada di `sql/migration/database.sql`.
- `public.approval_chains`
  - Header approval per ERF.
  - Memiliki `updated_at`, sehingga akan menerima trigger auto timestamp dari migration `20260401_017`.
- `public.approval_steps`
  - Detail langkah approval per chain.
  - Dipakai juga oleh `recruitment_queue_view` versi terbaru.
- `public.approver_master`
  - Master approver default untuk pembentukan approval chain.
- `public.recruitment_queue_view`
  - View queue recruitment yang saat ini mengandalkan ringkasan `approval_steps`.
  - Definisi acuan yang masih dipakai ada di `20260402_020_refresh_recruitment_queue_view_for_designation.sql`.

### Candidate dan dokumen

- Catatan penting:
  - bagian ini mengandung object mirror atau histori transisi kandidat
  - schema aktif final kandidat ada di `hrd_pintu`
  - dashboard sekarang membaca langsung secara read-only ke database kandidat
  - dump live `supabase/public-schema.sql` saat ini tidak menampilkan object mirror kandidat pada schema `public`

- `public.candidate_form`
  - Tabel mirror read-only kandidat dari `hrd_pintu` untuk kebutuhan monitoring internal pada fase transisi.
  - Mempunyai `completion_status` dari `20260330_012_add_candidate_form_completion_status.sql`.
  - Status live saat ini: `Belum ditemukan di schema public dump`.
  - Bila environment tertentu sudah tidak lagi menyimpan mirror lokal ini, dashboard harus membaca direct read ke `hrd_pintu`.
- `public.education`
  - Child table mirror riwayat pendidikan kandidat.
  - Menggunakan enum `public.education_level_enum`.
- `public.family_and_emergency`
  - Child table mirror keluarga dan emergency contact.
- `public.work_history`
  - Child table mirror riwayat kerja.
- `public.personal_statement`
  - Child table mirror one-to-one untuk pernyataan pribadi kandidat.
- `public.candidate_languages`
  - Child table mirror kemampuan bahasa.
- `public.candidate_skills`
  - Child table mirror skill kandidat.
- `public.candidate_references`
  - Child table mirror referensi kandidat.
- `public.candidate_documents`
  - Sudah obsolete.
  - Dihapus oleh `20260402_023_drop_obsolete_candidate_documents.sql`.

### Status Singkat Migration Kandidat Lama

- `20260330_012_add_candidate_form_completion_status.sql`
  - historical / transitional
- `20260330_013_create_candidate_documents_table.sql`
  - obsolete
- `20260330_014_add_candidate_documents_rls_and_storage_policies.sql`
  - obsolete
- `20260402_022_add_candidate_service_form_mirror_columns.sql`
  - transitional / legacy compatibility

### Access control dan identitas

- `public.profiles`
  - Profil publik yang dipasangkan dengan `auth.users`.
  - Migration `20260401_017_add_database_functions_and_triggers.sql` menambahkan trigger otomatis untuk membuat row profile saat user auth baru dibuat.
- `public.roles`
  - Master role aplikasi.
  - Memiliki `updated_at`.
- `public.permissions`
  - Master permission aplikasi.
- `public.role_permissions`
  - Pivot role ke permission.
- `public.user_roles`
  - Pivot user ke role.
  - Memiliki `updated_at`.

### Master data

- `public.master_pt`
- `public.master_department`
- `public.master_job_level`
- `public.master_custom_grup_1`
- `public.master_custom_grup_2`
- `public.master_custom_grup_3`
- `public.master_custom_grup_4`
- `public.master_custom_grup_5`
- `public.master_custom_grup_6`

Semua master data di atas yang mempunyai kolom `updated_at` akan menerima trigger auto timestamp dari migration `20260401_017_add_database_functions_and_triggers.sql`.

## Functions

Struktur dokumentasi function mengikuti format: nama, jenis, lokasi, tujuan, input atau output, pemakai, dan catatan.

### `public.has_permission(permission_name text)`

- Jenis: SQL function
- Lokasi definisi: `sql/migration/20260401_017_add_database_functions_and_triggers.sql`
- Tujuan: helper reusable untuk mengecek apakah `auth.uid()` memiliki permission tertentu melalui relasi `user_roles`, `role_permissions`, dan `permissions`
- Input/Output: menerima `permission_name text`, mengembalikan `boolean`
- Dipakai oleh: siap dipakai oleh query manual, policy RLS baru, atau logic server yang ingin menghindari pengulangan join permission
- Catatan: policy RLS yang sudah ada di repo saat ini masih banyak memakai join inline ke `user_roles` dan `roles`, jadi function ini adalah normalisasi object database, bukan refactor policy yang sudah ada

### `public.has_role(role_name text)`

- Jenis: SQL function
- Lokasi definisi: `sql/migration/20260402_024_add_active_dashboard_rls.sql`
- Tujuan: helper reusable untuk mengecek role canonical current user tanpa menyalin join `user_roles -> roles` di setiap policy
- Input/Output: menerima `role_name text`, mengembalikan `boolean`
- Dipakai oleh: helper RLS seperti `is_manager()`, `is_candidate()`, dan policy ERF/approval

### `public.can_access_employee_request_form(employee_request_form_created_by uuid)`

- Jenis: SQL function
- Lokasi definisi: `sql/migration/20260402_024_add_active_dashboard_rls.sql`
- Tujuan: menyatukan aturan akses ERF antara manager owner-scoped dan non-manager berbasis permission
- Input/Output: menerima `created_by uuid`, mengembalikan `boolean`
- Dipakai oleh: policy `employee_request_form`, `approval_chains`, `approval_steps`, dan `recruitment_queue_view` melalui tabel sumber

### `public.set_updated_at()`

- Jenis: PL/pgSQL trigger function
- Lokasi definisi: `sql/migration/20260401_017_add_database_functions_and_triggers.sql`
- Tujuan: mengisi `NEW.updated_at = now()` secara otomatis sebelum row di-update
- Input/Output: menerima context trigger row-level, mengembalikan `trigger`
- Dipakai oleh: seluruh trigger bernama `trg_set_updated_at__<table_name>` yang dibuat migration yang sama
- Catatan: function ini hanya efektif untuk tabel yang memang memiliki kolom `updated_at`

### `public.handle_new_user()`

- Jenis: PL/pgSQL trigger function
- Lokasi definisi: `sql/migration/20260401_017_add_database_functions_and_triggers.sql`
- Tujuan: membuat row pasangan di `public.profiles` ketika ada user baru di `auth.users`
- Input/Output: menerima `NEW` dari `auth.users`, mengembalikan `trigger`
- Dipakai oleh: trigger `on_auth_user_created`
- Catatan: insert memakai `on conflict (id) do nothing`, jadi aman jika seed atau proses lain lebih dulu membuat profile

## Triggers

### `on_auth_user_created`

- Jenis: AFTER INSERT trigger
- Lokasi definisi: `sql/migration/20260401_017_add_database_functions_and_triggers.sql`
- Tabel target: `auth.users`
- Trigger function: `public.handle_new_user()`
- Tujuan: menjaga sinkronisasi minimum antara auth user dan `public.profiles`
- Efek samping: membuat row `public.profiles(id = new.id)` jika belum ada
- Catatan:
  - trigger ini memindahkan object dashboard penting ke repo agar tidak hanya hidup di Supabase Dashboard
  - trigger ini tidak dapat diverifikasi dari `supabase/public-schema.sql` karena dump tersebut hanya mencakup schema `public`, sedangkan target trigger ada di schema `auth`

### `trg_set_updated_at__<table_name>`

- Jenis: BEFORE UPDATE trigger pattern
- Lokasi definisi: `sql/migration/20260401_017_add_database_functions_and_triggers.sql`
- Tabel target historis: tabel `public` berkolom `updated_at` pada saat migration dijalankan
- Trigger function: `public.set_updated_at()`
- Tujuan: memastikan `updated_at` bergerak otomatis saat row diubah
- Efek samping: overwrite nilai `NEW.updated_at` dengan `now()`
- Catatan:
  - migration membuat trigger dengan pola nama `trg_set_updated_at__<table_name>`
  - dump live `supabase/public-schema.sql` saat ini hanya memperlihatkan trigger aktif pada:
    - `employee_contract_form`
    - `export_templates`
    - `interview_evaluation_forms`
    - `interview_evaluation_interviewer_scores`
    - `interview_evaluation_interviewers`

Daftar panjang di bawah adalah cakupan historis dari migration, bukan daftar trigger aktif yang berhasil tervalidasi pada dump live saat ini:

- `approval_chains`
- `candidate_form`
- `candidate_languages`
- `candidate_references`
- `candidate_skills`
- `education`
- `employee_request_form`
- `family_and_emergency`
- `master_custom_grup_1`
- `master_custom_grup_2`
- `master_custom_grup_3`
- `master_custom_grup_4`
- `master_custom_grup_5`
- `master_custom_grup_6`
- `master_department`
- `master_job_level`
- `master_pt`
- `personal_statement`
- `roles`
- `user_roles`
- `work_history`
- `candidate_documents`
  - Obsolete. Hanya relevan secara histori migration.

Jika database target memiliki tabel tambahan berkolom `updated_at` yang belum tercermin di snapshot repo, migration tersebut secara desain dapat ikut memasang trigger di tabel yang memenuhi kriteria. Tetap verifikasi hasil akhirnya di dump live.

## Enumerated Types

Enum yang terverifikasi dari repo dan Supabase Dashboard saat ini:

- `public.employment_status_enum`
- `public.position_status_enum`
- `public.gender_enum`
- `public.marital_status_enum`
- `public.blood_type_enum`
- `public.education_level_enum`
- `public.language_proficiency_level`

### `public.education_level_enum`

- Jenis: Postgres enum
- Lokasi definisi aktif: terlihat di snapshot `sql/migration/database.sql`
- Evolusi:
  - `20260329_003_expand_education_level_enum_values.sql` memperluas enum ke label penuh yang dipakai aplikasi saat ini
  - `sql/migration/database.sql` menunjukkan nilai final yang sedang diharapkan runtime
- Nilai aktif:
  - `SD / Sederajat`
  - `SMP / MTs / Sederajat`
  - `SMA / SMK / MA / Sederajat`
  - `Diploma I (D1)`
  - `Diploma II (D2)`
  - `Diploma III (D3)`
  - `Diploma IV (D4)`
  - `Sarjana (S1)`
  - `Magister (S2)`
  - `Doktor (S3)`
- Dipakai oleh:
  - `public.education.level`
- Catatan: opsi UI yang sama juga dipakai oleh domain entity `educationLevelOptions` di `src/domain/entities/CandidateForm.ts`

### `public.employment_status_enum`

- Jenis: Postgres enum
- Lokasi definisi: `sql/migration/20260401_018_add_missing_enumerated_types.sql`
- Nilai aktif:
  - `Daily`
  - `Probation`
  - `Contract`
- Dipakai oleh:
  - `public.employee_request_form.employment_status`
- Catatan: nilainya selaras dengan `employmentStatusOptions` di `src/domain/entities/EmployeeRequestForm.ts`

### `public.position_status_enum`

- Jenis: Postgres enum
- Lokasi definisi: `sql/migration/20260401_018_add_missing_enumerated_types.sql`
- Nilai aktif:
  - `Replacement`
  - `New Position MPP`
  - `New Position Non-MPP`
  - `Internship`
- Dipakai oleh:
  - `public.employee_request_form.position_status`
- Catatan: nilainya selaras dengan `positionStatusOptions` di `src/domain/entities/EmployeeRequestForm.ts`

### `public.gender_enum`

- Jenis: Postgres enum
- Lokasi definisi: `sql/migration/20260401_018_add_missing_enumerated_types.sql`
- Nilai aktif:
  - `Male`
  - `Female`
- Dipakai oleh:
  - `public.candidate_form.gender`
  - `public.family_and_emergency.gender`
- Catatan: nilainya selaras dengan `genderOptions` di `src/domain/entities/CandidateForm.ts`

### `public.marital_status_enum`

- Jenis: Postgres enum
- Lokasi definisi: `sql/migration/20260401_018_add_missing_enumerated_types.sql`
- Nilai aktif:
  - `Single`
  - `Married`
  - `Divorced`
- Dipakai oleh:
  - `public.candidate_form.marital_status`
- Catatan: nilainya selaras dengan `maritalStatusOptions` di `src/domain/entities/CandidateForm.ts`

### `public.blood_type_enum`

- Jenis: Postgres enum
- Lokasi definisi: `sql/migration/20260401_018_add_missing_enumerated_types.sql`
- Nilai aktif:
  - `A`
  - `B`
  - `AB`
  - `O`
- Dipakai oleh:
  - `public.candidate_form.blood_type`
- Catatan: nilainya selaras dengan `bloodTypeOptions` di `src/domain/entities/CandidateForm.ts`

### `public.language_proficiency_level`

- Jenis: Postgres enum
- Lokasi definisi: `sql/migration/20260401_018_add_missing_enumerated_types.sql`
- Nilai aktif:
  - `good`
  - `fair`
  - `poor`
- Dipakai oleh:
  - `public.candidate_languages.speaking`
  - `public.candidate_languages.reading`
  - `public.candidate_languages.listening`
  - `public.candidate_languages.writing`
- Catatan: UI aplikasi masih memakai label `Good`, `Fair`, `Poor`, sehingga repository melakukan normalisasi baca dan tulis agar tetap cocok dengan enum database yang lowercase

## Indexes

- Tidak ada `create index` atau `create unique index` eksplisit yang terversioning di folder `sql/migration` saat ini.
- Index yang pasti ada berasal dari:
  - primary key
  - unique constraint
  - foreign key support yang bergantung pada definisi tabel masing-masing
- Jika nanti performa query mulai bergantung pada RLS, lookup approval, atau join permission, index eksplisit sebaiknya ditambahkan lewat migration baru agar terdokumentasi di sini.

## Extensions

Extensions yang terlihat terpasang pada Supabase Dashboard saat dokumentasi ini dirapikan:

### `pg_stat_statements`

- Versi: `1.11`
- Schema: `extensions`
- Tujuan: track planning and execution statistics of all SQL statements executed
- Used by: `Query Performance`
- Catatan: belum direferensikan eksplisit di migration repo, tetapi relevan untuk observability query di environment Supabase

### `"uuid-ossp"`

- Versi: `1.1`
- Schema: `extensions`
- Tujuan: generate universally unique identifiers (UUIDs)
- Used by: tidak ditandai di dashboard
- Catatan: repo saat ini lebih banyak memakai `gen_random_uuid()`, jadi dependency UUID yang paling terlihat dari SQL aktif tetap `pgcrypto`

### `plpgsql`

- Versi: `1.0`
- Schema: `pg_catalog`
- Tujuan: procedural language untuk function dan trigger PL/pgSQL
- Used by: tidak ditandai di dashboard
- Catatan: dipakai langsung oleh `public.set_updated_at()` dan `public.handle_new_user()` di `20260401_017_add_database_functions_and_triggers.sql`

### `pgcrypto`

- Versi: `1.3`
- Schema: `extensions`
- Tujuan: cryptographic functions
- Used by: tidak ditandai di dashboard
- Catatan: paling relevan ke repo karena banyak default memakai `gen_random_uuid()`

### `pg_graphql`

- Versi: `1.5.11`
- Schema: `graphql`
- Tujuan: GraphQL support
- Used by: `GraphiQL`
- Catatan: belum ada pemakaian eksplisit di aplikasi Nuxt saat ini, tetapi extension ini aktif di database Supabase

### `insert_username`

- Versi: `1.0`
- Schema: `-`
- Tujuan: functions for tracking who changed a table
- Used by: tidak ditandai di dashboard
- Catatan: repo saat ini belum memperlihatkan function atau trigger yang memanfaatkan extension ini

### Status repo

- Folder `sql/migration` masih belum memuat `create extension` atau `alter extension`.
- Daftar di atas diperlakukan sebagai snapshot environment Supabase berdasarkan dashboard, bukan versi yang sudah dikunci penuh oleh migration repo.
- Jika ingin benar-benar menjadikan extension sebagai bagian dari source of truth repo, langkah berikutnya adalah menambahkan migration khusus extension yang aman untuk environment target.

## Publications

- Folder `sql/migration` belum memuat `create publication` atau `alter publication`.
- Artinya belum ada publication Postgres yang terversioning sebagai bagian dari repo ini.

## Policies / RLS

### `public.candidate_documents`

- Status: obsolete
- Migration histori:
  - `20260330_013_create_candidate_documents_table.sql`
  - `20260330_014_add_candidate_documents_rls_and_storage_policies.sql`
- Cleanup aktif:
  - `20260402_023_drop_obsolete_candidate_documents.sql`
- Catatan:
  - object ini tidak lagi menjadi bagian schema aktif final
  - dokumentasi detail policy lamanya dipertahankan hanya sebagai konteks histori migration

### `storage.objects` untuk bucket `candidate-documents`

- Status: obsolete bersama tabel `public.candidate_documents`
- Catatan:
  - policy storage ini hanya relevan untuk membaca histori migration lama

### `storage.objects` untuk bucket `erf`

- Lokasi definisi: `sql/migration/20260331_016_add_erf_attachments_and_storage_policies.sql`
- Bucket:
  - `id = 'erf'`
  - private
  - batas ukuran file `10485760`
  - MIME type yang diizinkan: PDF, JPEG, PNG, WEBP
- Policies:
  - `erf_storage_select`
  - `erf_storage_insert`
  - `erf_storage_update`
  - `erf_storage_delete`
- Model akses:
  - user internal yang role-nya bukan `candidate` atau `manager`
  - atau user yang folder path-nya cocok dengan `split_part(name, '/', 2) = auth.uid()::text`
- Catatan: policy ini lebih ketat daripada bucket `candidate-documents` karena selain cek bucket juga mempertimbangkan role dan pola path objek

## Migration Map

Migration penting yang paling relevan untuk membaca schema saat ini:

- `20260329_003_expand_education_level_enum_values.sql`
  - perluasan enum pendidikan ke label final
- `20260329_007_add_employee_request_form_close_permission.sql`
  - menambah permission `employee_request_form:close`
- `20260329_008_add_user_history_module.sql`
  - menambah permission `user_history:read`
- `20260330_009_refresh_recruitment_queue_view_from_approval_steps.sql`
  - histori refresh view recruitment berbasis approval step sebelum penyesuaian designation
- `20260330_012_add_candidate_form_completion_status.sql`
  - menambah status penyelesaian candidate form
- `20260330_013_create_candidate_documents_table.sql`
  - histori tabel dokumen kandidat yang sekarang sudah obsolete
- `20260330_014_add_candidate_documents_rls_and_storage_policies.sql`
  - histori RLS tabel dokumen kandidat dan policy storage yang sekarang sudah obsolete
- `20260330_015_add_recruitment_document_explorer_permission.sql`
  - menambah permission untuk document explorer recruitment
- `20260331_016_add_erf_attachments_and_storage_policies.sql`
  - menambah bucket dan policy storage untuk attachment ERF
- `20260401_017_add_database_functions_and_triggers.sql`
  - mem-versioning helper permission, trigger auto `updated_at`, dan trigger auto-create `profiles`
- `20260401_018_add_missing_enumerated_types.sql`
  - mem-versioning enum yang terlihat di Supabase Dashboard dan mengikat kolom terkait ke type yang eksplisit
- `20260402_020_refresh_recruitment_queue_view_for_designation.sql`
  - memperkaya view recruitment dengan summary approval step dan sinkronisasi ke `designation_id`
- `20260402_021_split_recruitment_dashboard_and_approved_erf_permissions.sql`
  - memisahkan permission recruitment dashboard dan approved ERF, sekaligus memberi migration bridge untuk role yang sebelumnya sudah punya akses recruitment
- `20260402_024_add_active_dashboard_rls.sql`
  - mengaktifkan RLS untuk tabel aktif utama dashboard dan membuat `recruitment_queue_view` mengikuti `security_invoker`
- `20260402_025_sync_required_permissions_catalog.sql`
  - menyelaraskan katalog permission canonical aplikasi dan memetakan legacy `approval:update` ke `approval:action`
- `20260402_026_add_rls_supporting_indexes.sql`
  - menambah index pendukung untuk policy RLS dan pola query utama pada ERF, approval, candidate form, dan projection
- `20260402_027_add_rls_supporting_indexes_nonconcurrent.sql`
  - menyediakan alternatif SQL Editor tanpa `concurrently` untuk pembuatan index yang sama
- `database.sql`
  - snapshot schema untuk konteks pembacaan, bukan migration executable

## Catatan Praktis

- Jika object terlihat di Supabase Dashboard tetapi belum ada di folder `sql/migration`, anggap dokumentasinya belum lengkap sampai object itu dibuatkan migration.
- Jika menambah tabel baru dengan kolom `updated_at` setelah migration `20260401_017`, buat migration lanjutan untuk memasang trigger `public.set_updated_at()` pada tabel baru tersebut.
- Jika ingin memakai pengecekan permission di policy baru, prioritaskan `public.has_permission(text)` agar SQL policy tidak mengulang join permission yang sama di banyak tempat.
