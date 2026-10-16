# 14. Deployment

## Target Deploy yang Ditemukan

Konfigurasi deploy eksplisit yang ditemukan di repository:

- `vercel.json`
- Nuxt build standar

Deployment ke Netlify/VPS/Kubernetes: **Belum ditemukan konfigurasi khusus di repository**.

## Install Dependency

```bash
pnpm install --frozen-lockfile
```

## Menjalankan Lokal

```bash
cp .env.example .env.local
pnpm dev
```

## Build

```bash
pnpm build
```

## Preview

```bash
pnpm preview
```

## Deployment ke Vercel

`vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm build"
}
```

Langkah umum:

1. Hubungkan repository ke Vercel.
2. Set framework ke Nuxt.
3. Isi seluruh environment variable production.
4. Deploy branch target.

## Environment Variable Production

Minimum:

```bash
NUXT_PUBLIC_SUPABASE_URL=...
NUXT_PUBLIC_SUPABASE_ANON_KEY=...
NUXT_PUBLIC_CANDIDATE_PHOTOGRAPH_BUCKET=candidate-photographs
NUXT_PUBLIC_CANDIDATE_DOCUMENT_BUCKET=candidate-documents
NUXT_PUBLIC_ERF_DOCUMENT_BUCKET=erf
SUPABASE_EXPORT_BUCKET=export-templates
NUXT_PUBLIC_HRD_PINTU_URL=https://candidate.example.com

SUPABASE_SERVICE_ROLE_KEY=...
SMTP_USER=...
SMTP_PASS=...
APP_BASE_URL=https://dashboard.example.com
```

Tambahkan bila integrasi candidate service aktif:

```bash
HRD_PINTU_SERVICE_BASE_URL=...
HRD_PINTU_SERVICE_INTERNAL_TOKEN=...
HRD_PINTU_SERVICE_SYNC_TOKEN=...
HRD_PINTU_SUPABASE_URL=...
HRD_PINTU_SUPABASE_SERVICE_ROLE_KEY=...
```

## Checklist Sebelum Deploy

| Check | Status yang diharapkan |
| --- | --- |
| `pnpm build` | sukses |
| env public | terisi |
| env private | terisi di platform server |
| bucket storage | sudah dibuat dan private |
| RLS | aktif untuk tabel inti |
| SMTP | valid bila email aktif |
| candidate service | URL/token valid bila integrasi aktif |
| route login | berfungsi |
| `/health` | mengembalikan `{ ok: true }` |

## Troubleshooting Deployment

| Masalah | Kemungkinan penyebab | Tindakan |
| --- | --- | --- |
| Login gagal | `NUXT_PUBLIC_SUPABASE_*` salah | cek env public |
| Semua endpoint server error 500 | `SUPABASE_SERVICE_ROLE_KEY` atau `SUPABASE_URL` salah | cek env server |
| Upload file gagal | bucket/policy storage belum benar | cek bucket dan policy Supabase |
| Candidate data kosong | `CANDIDATE_*` belum terisi atau service tidak reachable | cek integrasi candidate service |
| Email gagal | `SMTP_USER/PASS` salah | cek log server dan SMTP |
| PDF attachment gagal | Chrome binary tidak ada | set `GOOGLE_CHROME_BIN` atau install Chromium |

## Rollback Plan

1. Rollback deployment ke release Vercel sebelumnya.
2. Jika masalah berasal dari env, revert nilai env lalu redeploy.
3. Jika masalah berasal dari migration DB, rollback harus mengikuti prosedur SQL terpisah; tidak ditemukan script rollback universal selain migration tertentu.
4. Untuk export configuration, backup bucket `export-templates` sebelum perubahan besar pada template aktif.
