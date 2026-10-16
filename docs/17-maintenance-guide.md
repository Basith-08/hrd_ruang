# 17. Maintenance Guide

## Cara Menambah Fitur Baru

Ikuti pola layer yang sudah ada:

1. Tambah entity/request/repository contract bila perlu di `src/domain`.
2. Tambah use case di `src/application/usecases`.
3. Tambah repository implementation atau endpoint bridge di `src/infrastructure`.
4. Tambah viewmodel/composable bila feature memerlukan state UI.
5. Tambah page/feature component di `src/features` dan `src/pages`.
6. Jika perlu operasi aman/service role, tambahkan endpoint di `server/api` atau `server/routes`.

## Cara Menambah Halaman Baru

1. Buat feature page di `src/features/<module>/`.
2. Buat route file di `src/pages/...`.
3. Tambahkan `definePageMeta()`:
   - `requiredPermissions`
   - `allowedRoles` bila perlu
4. Jika harus muncul di sidebar, update `src/composables/useLayoutNavigation.ts`.

## Cara Menambah Component Baru

1. Komponen domain-specific masuk ke `src/features/<module>/components`.
2. Komponen generik masuk ke `src/presentation/components`.
3. Gunakan props/emits jelas, mengikuti pattern komponen yang ada.

## Cara Menambah Service / Composable Baru

### Frontend

- Composable global: `src/composables`
- ViewModel: `src/viewmodels`
- Repository impl: `src/infrastructure/supabase/repositories`

### Backend

- Endpoint handler: `server/api` atau `server/routes`
- Business logic: `server/services`
- Utility auth/context: `server/lib`

## Cara Menambah Tabel Supabase

1. Tambah migration baru di `sql/migration/`.
2. Definisikan:
   - tabel
   - PK/FK
   - index
   - trigger `updated_at` bila perlu
3. Tambahkan RLS policy.
4. Sinkronkan dokumentasi `docs/05`, `docs/06`, `docs/08`.

## Cara Menambah RLS Policy

Pola existing:

- enable row level security
- drop policy if exists
- create policy per operasi

Contoh minimal:

```sql
alter table public.my_table enable row level security;

drop policy if exists my_table_select on public.my_table;
create policy my_table_select
on public.my_table
for select
to authenticated
using (public.has_permission('my_permission:read'));
```

## Cara Update Environment Variable

1. Tambah referensi di `.env.example`.
2. Tambah mapping di `nuxt.config.ts` jika public runtime config.
3. Tambah di `server/config/env.js` bila server-only.
4. Update `docs/13-environment.md`.

## Cara Debug Masalah Umum

| Masalah | Titik cek pertama |
| --- | --- |
| Login gagal | `AuthRepositoryImpl`, `/auth/resolve-login`, `/auth/profile` |
| Redirect aneh | `access.global.ts`, `defaultRoute.ts`, `candidatePortal.ts` |
| User tidak punya akses | `server/lib/context.js`, `permissions.js`, `user_roles` |
| Data candidate kosong | `candidateDatabaseReadService.js`, env `CANDIDATE_*` |
| Signed URL gagal | `assertCandidateFormAssetAccess`, bucket env, storage policy |
| Export DOCX gagal | `docx-placeholder-scanner`, `export-payload-builder`, `docx-generator` |
| Export Excel stuck | `exportJobQueue.ts` |

## Cara Menjaga Konsistensi Kode

- Jangan bypass use case / repository pattern tanpa alasan kuat.
- Simpan permission baru di `server/constants/permissions.js`.
- Cocokkan route meta dengan permission backend.
- Pertahankan alias route lama bila perubahan URL berisiko memutus backward compatibility.
- Perhatikan modul yang read-only di dashboard agar tidak tanpa sengaja diubah menjadi writable.

## Catatan Khusus Integrasi Candidate Service

- Sebelum mengubah flow candidate/employee, cek apakah data berasal dari:
  - Supabase lokal dashboard
  - candidate database eksternal
  - candidate service HTTP
- Beberapa operasi, seperti switch candidate ke employee dan append dokumen kontrak, hanya valid untuk account `candidate_service`.
