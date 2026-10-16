# HRD Ruang

HRD Ruang adalah aplikasi operasional Human Capital Development berbasis Nuxt 4 + Supabase untuk mengelola proses permintaan karyawan, approval, rekrutmen, candidate/employee form, interview evaluation, user-role management, dan konfigurasi export dokumen DOCX.

## Ringkasan

- Status implementasi: aplikasi web production-oriented dengan frontend SPA (`ssr: false`, `srcDir: "src"`) dan backend Nitro.
- Integrasi utama: Supabase Auth, PostgreSQL, Supabase Storage, SMTP, dan candidate service eksternal (`hrd_pintu`) untuk data kandidat tertentu.
- Fokus modul: ERF, approval chain, recruitment dashboard, candidate/employee form, interview evaluation, employee contract form, dan export configuration.

## Tech Stack

- Nuxt 4
- Vue 3
- TypeScript
- Pinia
- Supabase JS v2
- PostgreSQL / Supabase
- Supabase Auth
- Supabase Storage
- Tailwind CSS v4
- Vee-Validate + Zod
- Docxtemplater + Mammoth
- Nodemailer
- Vitest

## Fitur Utama

- Login dengan email atau username yang di-resolve ke email.
- Route protection berbasis session Supabase, role, dan permission.
- Manajemen employee request form dan approval chain.
- Recruitment dashboard, vacancy pipeline, closed vacancy, PIC recruitment, dan candidate database.
- Candidate/employee form dashboard read-only, signed document access, dan export Excel asynchronous.
- Upload dokumen kontrak employee ke Supabase Storage.
- Interview evaluation dan interviewer form.
- User management, role management, permission management, user history.
- Export configuration: upload template DOCX, scan placeholder `{{field}}`, mapping field, preview HTML, generate DOCX.

## Struktur Folder Ringkas

```text
src/
  app.vue              root app
  application/         use case aplikasi
  composables/         composable global
  domain/              entity, request, repository contract, util domain
  features/            page-level feature dan komponen domain UI
  infrastructure/      Supabase client, repository impl, HTTP adapter, security helper
  layouts/             layout default dan candidate
  middleware/          route guard global
  pages/               route Nuxt dan alias legacy
  plugins/             bootstrap repository/store
  presentation/        komponen UI generik dan util presentasi
  stores/              auth store Pinia
  types/               type shared sisi frontend
  viewmodels/          orchestration UI/use case
server/
  api/                 endpoint /api/*
  config/              env server
  constants/           konstanta server
  lib/                 helper auth, error, queue, rate limit
  middleware/          security header middleware
  routes/              endpoint Nitro non-/api
  services/            service server, email, export DOCX, candidate service
  utils/               helper handler/request
sql/migration/         migration, schema context, policy RLS
docs/                  dokumentasi teknis project
lang/                  resource i18n statis
types/                 shared type lintas layer/non-frontend
```

## Prasyarat

- Node.js `^20.19.0` atau `>=22.12.0`
- pnpm `10.32.1`
- Project Supabase aktif
- Bucket storage Supabase yang dibutuhkan aplikasi
- Kredensial SMTP untuk fitur email
- Candidate service eksternal jika mode integrasi `hrd_pintu` dipakai

## Instalasi

```bash
pnpm install
cp .env.example .env.local
```

Isi environment variable sesuai kebutuhan lokal.

## Menjalankan Development

```bash
pnpm dev
```

## Build Production

```bash
pnpm build
pnpm preview
```

## Script Penting

```bash
pnpm dev
pnpm build
pnpm preview
pnpm type-check
pnpm test:unit
pnpm format
```

## Environment Variable

| Variable | Scope | Keterangan singkat |
| --- | --- | --- |
| `NUXT_PUBLIC_SUPABASE_URL` | Public | URL project Supabase |
| `NUXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Anon key untuk client |
| `NUXT_PUBLIC_CANDIDATE_PHOTOGRAPH_BUCKET` | Public | Bucket foto kandidat |
| `NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET` | Public | Bucket dokumen kandidat/employee |
| `NUXT_PUBLIC_ERF_DOCUMENT_BUCKET` | Public | Bucket attachment ERF |
| `NUXT_PUBLIC_HRD_PINTU_URL` | Public | URL portal kandidat eksternal |
| `SUPABASE_SERVICE_ROLE_KEY` | Private | Service role untuk endpoint server |
| `SUPABASE_EXPORT_BUCKET` | Private/server | Bucket template export DOCX |
| `SMTP_USER` / `SMTP_PASS` | Private | Kredensial SMTP |
| `APP_BASE_URL` | Private | Base URL aplikasi |
| `HRD_PINTU_SERVICE_BASE_URL` | Private | Base URL candidate service |
| `HRD_PINTU_SERVICE_INTERNAL_TOKEN` | Private | Shared secret request internal |
| `HRD_PINTU_SERVICE_SYNC_TOKEN` | Private | Shared secret event sync |
| `HRD_PINTU_SUPABASE_URL` | Private | URL Supabase candidate service |
| `HRD_PINTU_SUPABASE_SERVICE_ROLE_KEY` | Private | Service role candidate DB |
| `GOOGLE_CHROME_BIN` | Private, opsional | Chrome binary untuk render PDF server-side |

### `HRD_PINTU_SERVICE_INTERNAL_TOKEN` dan `HRD_PINTU_SERVICE_SYNC_TOKEN`

Kedua variable ini adalah shared secret untuk komunikasi server-to-server antara `hrd_ruang` dan `hrd_pintu`, masing-masing untuk arah yang berbeda:

| Variable | Arah | Header | Dipakai di |
| --- | --- | --- | --- |
| `HRD_PINTU_SERVICE_INTERNAL_TOKEN` | Outgoing — `hrd_ruang` → `hrd_pintu` | `x-internal-service-token` | [server/services/candidateServiceClient.js](server/services/candidateServiceClient.js) |
| `HRD_PINTU_SERVICE_SYNC_TOKEN` | Incoming — `hrd_pintu` → `hrd_ruang` | `x-hrd-pintu-sync-token` | [server/services/candidateProjectionEventService.js](server/services/candidateProjectionEventService.js) |

- **`HRD_PINTU_SERVICE_INTERNAL_TOKEN`** dikirim oleh `hrd_ruang` sebagai header `x-internal-service-token` setiap kali memanggil internal API `hrd_pintu` (mis. create/update/revoke akun kandidat, ambil snapshot form, sign URL storage). Nilainya harus sama dengan `INTERNAL_SERVICE_TOKEN` di `.env` milik `hrd_pintu`. Jika token tidak diisi, request akan gagal dengan error 500 "is not configured"; jika tidak cocok, `hrd_pintu` membalas 401.
- **`HRD_PINTU_SERVICE_SYNC_TOKEN`** dipakai untuk memverifikasi request masuk dari `hrd_pintu` ketika service tersebut push event (sinkronisasi status aplikasi/ERF) ke `hrd_ruang`. `hrd_pintu` mengirim token ini lewat header `x-hrd-pintu-sync-token`, dan nilainya harus sama dengan `HRD_PINTU_SYNC_TOKEN` di `.env` milik `hrd_pintu`. Token yang kosong atau tidak cocok akan ditolak dengan error 401 "Unauthorized candidate sync request."

Karena kedua arah memakai shared secret yang berbeda, **jangan gunakan nilai yang sama** untuk `HRD_PINTU_SERVICE_INTERNAL_TOKEN` dan `HRD_PINTU_SERVICE_SYNC_TOKEN` — perlakukan sebagai dua secret independen, dan pastikan rotasi salah satunya juga diikuti update pada variable pasangannya di sisi `hrd_pintu` (`INTERNAL_SERVICE_TOKEN` / `HRD_PINTU_SYNC_TOKEN`).

#### Cara Generate Token

Generate random string sebagai secret, lalu salin nilai yang sama ke kedua sisi (`hrd_ruang` dan `hrd_pintu`):

```bash
# generate HRD_PINTU_SERVICE_INTERNAL_TOKEN, lalu salin hasilnya ke INTERNAL_SERVICE_TOKEN di hrd_pintu
openssl rand -hex 32

# generate HRD_PINTU_SERVICE_SYNC_TOKEN, lalu salin hasilnya ke HRD_PINTU_SYNC_TOKEN di hrd_pintu
openssl rand -hex 32
```

Jalankan dua kali secara terpisah supaya nilai `HRD_PINTU_SERVICE_INTERNAL_TOKEN` dan `HRD_PINTU_SERVICE_SYNC_TOKEN` tidak sama. Tanpa `openssl`, alternatif Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Setelah digenerate, isi ke `.env` (atau environment variable di platform deploy) pada kedua aplikasi, lalu restart/redeploy keduanya agar token baru terbaca.

Contoh detail ada di [docs/13-environment.md](docs/13-environment.md).

## Deploy

Konfigurasi deploy yang ditemukan di repository adalah Vercel:

- [vercel.json](vercel.json)
- `installCommand`: `pnpm install --frozen-lockfile`
- `buildCommand`: `pnpm build`

Panduan lengkap ada di [docs/14-deployment.md](docs/14-deployment.md).

## Dokumentasi

- [01 Project Overview](docs/01-project-overview.md)
- [02 System Requirement](docs/02-system-requirement.md)
- [03 System Architecture](docs/03-system-architecture.md)
- [04 Folder Structure](docs/04-folder-structure.md)
- [05 Database Documentation](docs/05-database-documentation.md)
- [06 ERD](docs/06-erd.md)
- [07 Auth Authorization](docs/07-auth-authorization.md)
- [08 Supabase RLS Policy](docs/08-supabase-rls-policy.md)
- [09 API Service Documentation](docs/09-api-service-documentation.md)
- [10 Feature Flow](docs/10-feature-flow.md)
- [11 UI Pages Documentation](docs/11-ui-pages-documentation.md)
- [12 Component Documentation](docs/12-component-documentation.md)
- [13 Environment](docs/13-environment.md)
- [14 Deployment](docs/14-deployment.md)
- [15 Testing](docs/15-testing.md)
- [16 Error Handling](docs/16-error-handling.md)
- [17 Maintenance Guide](docs/17-maintenance-guide.md)
- [18 User Manual](docs/18-user-manual.md)
- [19 Changelog](docs/19-changelog.md)

Dokumen lama yang masih dipertahankan:

- [active-table-rls-rollout.md](docs/active-table-rls-rollout.md)
- [nuxt-native-audit.md](docs/nuxt-native-audit.md)
- [recruitment-flow-stage.md](docs/recruitment-flow-stage.md)

## Catatan Keamanan

- Client hanya boleh memakai `NUXT_PUBLIC_SUPABASE_ANON_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY` dipakai pada `server/services/supabaseAdmin.js` dan tidak boleh terekspos ke client.
- Route server membaca user context dari bearer token Supabase lalu memuat role dan permission dari tabel `user_roles`, `roles`, `role_permissions`, `permissions`.
- Middleware server menambahkan `Content-Security-Policy-Report-Only`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, dan `X-Content-Type-Options`.
- Endpoint sensitif tertentu memiliki rate limit in-memory: resolve login, CSP report, dan send email.
- Bucket storage diperlakukan sebagai private; akses file memakai signed URL.

## Catatan Implementasi

- Dashboard candidate form di project ini bersifat read-only untuk CRUD utama. Pesan error repository secara eksplisit mengarahkan perubahan data form ke project `hrd_pintu`.
- Route `/candidate-forms` bersifat role-aware: kandidat bisa di-redirect ke portal eksternal lewat `NUXT_PUBLIC_HRD_PINTU_URL`, sedangkan staff yang punya akses `candidate_employee:read` / `user:read` akan diarahkan ke `/candidate-employees`.
- Route `/candidate-forms/create` dan `/candidate-forms/:id/edit` saat ini hanya route transisi/redirect, bukan halaman form writable lokal.
- Flow import CSV tidak ditemukan di repository saat ini. Yang ditemukan hanya export Excel (`xlsx`) dan pengolahan template DOCX.
