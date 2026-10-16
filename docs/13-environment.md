# 13. Environment

## Environment Variable yang Ditemukan

Sumber utama:

- `.env.example`
- `nuxt.config.ts`
- `server/config/env.js`

## Public Environment

| Variable | Wajib | Digunakan di | Fungsi |
| --- | --- | --- | --- |
| `NUXT_PUBLIC_SUPABASE_URL` | Ya | `nuxt.config.ts`, `src/infrastructure/supabase/client.ts` | URL project Supabase |
| `NUXT_PUBLIC_SUPABASE_ANON_KEY` | Ya | client Supabase | anon key frontend |
| `NUXT_PUBLIC_CANDIDATE_PHOTOGRAPH_BUCKET` | Ya | candidate form | bucket foto kandidat |
| `NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET` | Ya | candidate form, document explorer | bucket dokumen kandidat/employee |
| `NUXT_PUBLIC_ERF_DOCUMENT_BUCKET` | Ya | ERF | bucket attachment ERF |
| `NUXT_PUBLIC_HRD_PINTU_URL` | Opsional | redirect candidate | URL portal kandidat eksternal |
| `NUXT_PUBLIC_EMPLOYEE_DOCUMENT_BUCKET` | Opsional | runtime config | override bucket dokumen employee |

Tidak ada fallback `VITE_*`. Semua konfigurasi aplikasi dibaca dari `.env` melalui
Nuxt runtime config atau variable server-only.

## Private / Server Environment

| Variable | Wajib | Digunakan di | Fungsi |
| --- | --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Ya | `server/services/supabaseAdmin.js` | service role Supabase |
| `SUPABASE_URL` | Disarankan | server admin client | override URL Supabase server |
| `SUPABASE_EXPORT_BUCKET` | Ya | export template service | bucket template export |
| `SMTP_USER` | Ya bila email aktif | mailer/email service | user SMTP |
| `SMTP_PASS` | Ya bila email aktif | mailer/email service | password/app password SMTP |
| `APP_BASE_URL` | Ya | candidate credential email | base URL aplikasi |
| `HRD_PINTU_SERVICE_BASE_URL` | Opsional tetapi penting bila integrasi aktif | candidate service client | base URL service kandidat |
| `HRD_PINTU_SERVICE_INTERNAL_TOKEN` | Opsional penting | candidate service client | shared token internal |
| `HRD_PINTU_SERVICE_SYNC_TOKEN` | Opsional penting | internal event sync | token sinkronisasi event |
| `HRD_PINTU_SUPABASE_URL` | Opsional | candidate db read service | URL Supabase candidate DB |
| `HRD_PINTU_SUPABASE_SERVICE_ROLE_KEY` | Opsional | candidate db read service | service role candidate DB |
| `GOOGLE_CHROME_BIN` / `CHROME_BIN` | Opsional | `pdfRenderer.js` | lokasi binary Chrome/Chromium |

## Contoh `.env.example`

```bash
NUXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=
NUXT_PUBLIC_CANDIDATE_PHOTOGRAPH_BUCKET=candidate-photographs
NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET=candidate-documents
NUXT_PUBLIC_ERF_DOCUMENT_BUCKET=erf
SUPABASE_EXPORT_BUCKET=export-templates
NUXT_PUBLIC_HRD_PINTU_URL=http://localhost:3001

SUPABASE_SERVICE_ROLE_KEY=
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
APP_BASE_URL=https://your-app.example.com
HRD_PINTU_SERVICE_BASE_URL=http://localhost:3001/api
HRD_PINTU_SERVICE_INTERNAL_TOKEN=replace-with-shared-secret
HRD_PINTU_SERVICE_SYNC_TOKEN=replace-with-shared-secret
HRD_PINTU_SUPABASE_URL=
HRD_PINTU_SUPABASE_SERVICE_ROLE_KEY=
```

## Cara Setting Local

1. Salin `.env.example` menjadi `.env`.
2. Isi `NUXT_PUBLIC_SUPABASE_URL` dan `NUXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Isi `SUPABASE_SERVICE_ROLE_KEY` untuk fitur server-side.
4. Isi bucket name sesuai storage Supabase.
5. Jika kandidat berasal dari service eksternal, isi variable `CANDIDATE_*`.
6. Jalankan `pnpm dev`.

## Cara Setting Production

1. Masukkan semua env di platform deploy.
2. Pastikan `SUPABASE_SERVICE_ROLE_KEY` hanya tersedia di environment server.
3. Pastikan URL candidate portal dan candidate service menunjuk environment production.
4. Pastikan bucket storage production sudah dibuat dan private.
5. Jika flow email aktif, gunakan SMTP production.


## Validasi Implementasi

- Client Supabase dibuat di `src/infrastructure/supabase/client.ts` dan hanya memakai runtime config public.
- Server admin Supabase dibuat di `server/services/supabaseAdmin.js` dan memakai `SUPABASE_SERVICE_ROLE_KEY`.
- Tidak ditemukan penggunaan `SUPABASE_SERVICE_ROLE_KEY` pada code client.
