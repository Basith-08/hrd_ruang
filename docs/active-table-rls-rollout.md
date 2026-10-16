# Active Table RLS Rollout

Dokumen ini mendampingi migration [20260402_024_add_active_dashboard_rls.sql](../sql/migration/20260402_024_add_active_dashboard_rls.sql) untuk tabel aktif utama di `hrd_ruang`.

Tujuannya sederhana:

- menutup tabel yang sebelumnya `UNRESTRICTED`
- menyelaraskan akses database dengan RBAC yang sudah dipakai aplikasi
- menjaga flow frontend yang masih query Supabase langsung tetap jalan

## Yang Ditutup Oleh Migration

Prioritas utama:

- `profiles`
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`
- `employee_request_form`
- `approval_chains`
- `approval_steps`
- `approver_master`
- `candidate_account_projection`
- `candidate_application_projection`

Master/reference aktif:

- `master_bu`
- `master_department`
- `master_designation`
- `master_job_level`
- `master_pt`
- `master_custom_grup_1` sampai `master_custom_grup_6`

Tambahan penting:

- `recruitment_queue_view` diubah menjadi `security_invoker = true` supaya pembacaan view mengikuti RLS tabel sumbernya

## Model Akses Yang Dipakai

Migration ini mengikuti perilaku aplikasi saat ini, bukan model ideal jangka panjang.

Aturan utamanya:

- `manager` tetap owner-scoped untuk `employee_request_form` dan `approval_*`
- non-manager mengikuti permission canonical seperti `employee_request_form:*`, `approval:read`, `approval:action`, `recruitment:*`, dan `role:manage`
- `user_roles` dibatasi ke role milik user sendiri, kecuali user admin/access-control
- `candidate_*_projection` hanya bisa dibaca user dengan permission recruitment atau monitoring kandidat
- master data dibuka read-only untuk semua user `authenticated`, tetapi mutasi dibatasi ke user internal yang memang sudah punya akses manajemen

## Catatan Penting

### `profiles`

Ini titik kompromi paling besar.

Saat ini frontend masih membaca `profiles` langsung untuk:

- nama pembuat ERF
- profil BU director
- profil approver
- sinkron data profil kandidat

Karena itu policy `profiles` sekarang:

- mengizinkan user membaca row miliknya sendiri
- mengizinkan user internal non-candidate membaca `profiles`
- mengizinkan update untuk diri sendiri atau user dengan `user:update`

Ini lebih aman daripada `UNRESTRICTED`, tetapi belum ideal karena internal user masih bisa membaca kolom sensitif `profiles` yang tidak semuanya dibutuhkan UI.

Langkah lanjutan yang disarankan:

1. buat view publik sempit seperti `profile_directory` yang hanya expose kolom aman
2. pindahkan join frontend dari `profiles` ke view itu
3. setelah itu sempitkan policy `profiles` menjadi self-only plus admin/server path

### `recruitment_queue_view`

View tidak punya policy RLS sendiri seperti tabel biasa.
Karena itu migration ini mengubah view menjadi `security_invoker`, agar policy tabel seperti `employee_request_form`, `approval_chains`, dan `approval_steps` tetap dihormati saat view dibaca.

## Urutan Aktivasi Yang Aman

Kalau dijalankan manual di production, urutan paling aman:

1. aktifkan migration ini di staging lebih dulu
2. tes login dan load `/auth/profile`
3. tes halaman:
   - employee request form list/detail/create/edit
   - approval tracking
   - approver master
   - recruitment dashboard
   - role management
   - user management
   - master/custom group management
4. tes khusus user role `manager` untuk memastikan owner-scope masih benar
5. tes user approver yang approve/reject step
6. baru rollout ke production

Kalau setelah aktivasi RLS performa turun, jalankan juga migration index pendukung:

- [20260402_026_add_rls_supporting_indexes.sql](../sql/migration/20260402_026_add_rls_supporting_indexes.sql)
- [20260402_027_add_rls_supporting_indexes_nonconcurrent.sql](../sql/migration/20260402_027_add_rls_supporting_indexes_nonconcurrent.sql)

Catatan:

- file index itu memakai `create index concurrently`
- jangan bungkus file itu di transaction manual
- pada database besar, efek perbaikannya biasanya paling terasa di list ERF, approval tracking, recruitment dashboard, dan candidate form lookup
- bila SQL Editor Anda otomatis membuat transaction block, pakai file `20260402_027...` sebagai alternatif yang lebih kompatibel

## Risiko Yang Masih Perlu Dipantau

- query lama yang diam-diam mengandalkan akses global ke `profiles`
- environment yang schema master datanya tidak sepenuhnya sinkron
- view atau RPC lain di luar repo yang mungkin masih membaca tabel aktif tanpa mempertimbangkan RLS

Kalau setelah aktivasi ada error `row violates row-level security policy` atau data tiba-tiba kosong, biasanya masalahnya ada di salah satu dari tiga hal ini:

- permission canonical role belum sinkron
- user memang tidak punya row `user_roles`
- ada query frontend lama yang masih mengasumsikan akses unrestricted
