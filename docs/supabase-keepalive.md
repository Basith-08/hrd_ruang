# Supabase keep-alive

Endpoint server: `GET /api/cron/keepalive`. Tidak ada perubahan pada Auth, Storage,
atau frontend dan tidak ada dependency baru.

## Deployment

1. Terapkan `supabase/migrations/20261119000000_add_app_heartbeat.sql` melalui
   workflow migration Supabase yang biasa digunakan, atau jalankan isi file di SQL
   Editor pada project tujuan. Jangan menjalankan ulang migration baseline pada
   database production yang sudah ada.
2. Di Vercel Project → Settings → Environment Variables, siapkan untuk Production:
   - `NUXT_PUBLIC_SUPABASE_URL`: gunakan URL project yang sudah tersedia; tidak
     perlu menambahkan `SUPABASE_URL`. Konfigurasi server yang ada memakai URL ini
     sebagai fallback bila `SUPABASE_URL` tidak disetel.
   - `SUPABASE_SERVICE_ROLE_KEY`: service role key project tersebut (server-only).
   - `CRON_SECRET`: string acak minimal 32 karakter, misalnya keluaran `openssl rand -hex 32`.
   Jangan memberi prefix `NUXT_PUBLIC_` pada secret. Service role key yang sudah
   dipakai server digunakan kembali; tidak perlu key tambahan.
3. Deploy ke production dengan build Nuxt/Nitro (`pnpm build`), bukan static generate.
   Perubahan environment membutuhkan redeploy. Migration dan deployment belum
   dijalankan otomatis oleh perubahan kode ini.
4. Buka Vercel Project → Schedules → Cron Jobs (atau Settings → Cron Jobs pada UI
   lama), pastikan `/api/cron/keepalive` terdaftar dan aktif.

`0 15 */3 * *` menggunakan UTC: tanggal 1, 4, 7, …, 31 bila tersedia,
pada jam 15 UTC / 22 WIB. Perhitungan dimulai kembali setiap bulan; bukan interval
tepat 72 jam. Pada Hobby, eksekusi dapat terjadi antara 22.00–22.59 WIB.
Vercel otomatis mengirim `Authorization: Bearer <CRON_SECRET>`.
Cron terjadwal berjalan pada deployment production.

## Pengujian manual

Untuk lokal, isi `.env` dengan variabel di atas dan jalankan `pnpm dev`.
Gunakan URL production sesudah deploy untuk memeriksa deployment sebenarnya.
Di shell lokal, set `CRON_SECRET` dengan nilai yang sama (jangan commit nilainya).

```sh
BASE_URL=http://localhost:3000
curl -i "$BASE_URL/api/cron/keepalive"
curl -i -H 'Authorization: Bearer wrong' "$BASE_URL/api/cron/keepalive"
curl -i -H "Authorization: Bearer $CRON_SECRET" "$BASE_URL/api/cron/keepalive"
```

Dua request pertama harus HTTP 401. Request terakhir harus HTTP 200 dengan
`{"ok":true,"timestamp":"..."}`. Ulangi request valid: timestamp harus berubah,
sedangkan row tetap `id = 1`. Secret kosong juga menghasilkan 401. Kegagalan
konfigurasi/database menghasilkan HTTP 503 dan pesan generik tanpa credentials.
Jangan merusak konfigurasi production untuk mencoba kasus error.

Unit tests (Supabase dimock, tidak menulis database):

```sh
pnpm test:unit --run server/api/cron/__tests__/keepalive.get.spec.ts
```

## Logs dan verifikasi database

Pada tab Cron Jobs pilih View Logs, atau buka Vercel Logs dan filter path
`/api/cron/keepalive`. Periksa HTTP status dan pesan `[cron/keepalive] success`
beserta timestamp. Pesan `[cron/keepalive] failed` disertai HTTP 503 berarti
perlu memeriksa environment, migration, dan ketersediaan Supabase. HTTP 401
berarti header/secret tidak cocok atau `CRON_SECRET` belum disiapkan.

Di Supabase SQL Editor jalankan sebelum dan sesudah dua request valid:

```sql
SELECT id, last_ping_at,
       last_ping_at AT TIME ZONE 'Asia/Jakarta' AS last_ping_wib
FROM public.app_heartbeat;

SELECT count(*) AS row_count FROM public.app_heartbeat;
```

Setelah sukses harus ada tepat satu row `id = 1`, dengan timestamp terbaru.
Constraint primary key dan `CHECK (id = 1)` membatasi tabel ke satu row.
RLS aktif tanpa policy pengguna; privileges dicabut dari PUBLIC, anon, dan
authenticated. Hanya service role server yang digunakan untuk UPSERT.

Fitur ini membantu aktivitas database, tetapi tidak menjamin Supabase Free Plan
terhindar dari pause.

Referensi:
- https://vercel.com/docs/cron-jobs/manage-cron-jobs
- https://vercel.com/docs/cron-jobs/usage-and-pricing
- https://supabase.com/docs/guides/platform/free-project-pausing
