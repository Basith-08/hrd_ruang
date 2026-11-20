# Penghapusan Custom Group Management

Custom Group Management sudah dihapus dari aplikasi. Route
`/custom-group-management` tidak lagi terdaftar dan menu tidak lagi ditampilkan.
Tidak ada permission khusus fitur ini: sebelumnya memakai `user:read` dan admin
only, sehingga permission tersebut tetap dipakai oleh fitur user/master data lain.

## Hasil analisis dependensi

Fitur sebelumnya melakukan CRUD langsung melalui Supabase repository, tanpa
endpoint server khusus. Enam tabel `master_custom_grup_1` sampai
`master_custom_grup_6` direferensikan oleh enam FK `custom_grup_1_id` sampai
`custom_grup_6_id` pada `employee_request_form`. Recruitment queue view juga
melakukan join ke tabel-tabel tersebut.

Referensi ini sudah dibersihkan dari query frontend dan API ERF, approval,
recruitment, entity/request, state form, ekspor Excel, serta pemetaan response
user/candidate. Slot dokumen ERF sekarang bernama `documents`. Fitur Auth,
Storage, approval, serta master data lain tetap menggunakan arsitektur yang ada.

## Migration dan deployment

Jalankan migration berurutan di `supabase/migrations/`; migration penghapusan:
`20261120000000_remove_custom_group_management.sql`.

Migration dalam satu transaksi:

1. Menghapus `recruitment_queue_view` agar dependensi join terlepas.
2. Menghapus enam kolom FK pada ERF beserta constraint/index terkait.
3. Menghapus enam tabel master grup beserta isi dan policy RLS-nya.
4. Membuat ulang view dengan logika recruitment yang sama tanpa grup kustom,
   termasuk `security_invoker = true` dan grants sebelumnya.

Migration tidak memakai `CASCADE`: dependensi tak terduga akan membuat transaksi
batal agar object lain tidak ikut terhapus. Migration dan schema dump historis
disimpan untuk reproduksi urutan schema; jangan memakai dump lama sebagai state
akhir tanpa menjalankan migration lanjutan.

Penghapusan ini menghilangkan data master grup dan relasi ERF secara permanen.
Sebelum menerapkannya, simpan backup data tersebut jika perlu dipulihkan.
Deploy kode baru lebih dahulu, lalu terapkan migration dalam jendela maintenance
agar client lama tidak lagi mengirim query relasi yang dihapus. Segarkan browser
client setelah deployment. Rollback kode lama membutuhkan pemulihan schema/data,
bukan hanya rollback deployment.

Perubahan repository tidak menjalankan migration ke database production secara
otomatis.

## Verifikasi

Setelah migration, jalankan pada SQL Editor:

```sql
-- Harus kosong.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name ~ '^master_custom_grup_[1-6]$';

-- Harus kosong.
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('employee_request_form', 'recruitment_queue_view')
  AND column_name LIKE '%custom_grup%';

-- View tetap tersedia; akses pengguna mengikuti RLS tabel sumber.
SELECT id, employee_request_form_id FROM public.recruitment_queue_view LIMIT 5;
```

Periksa bahwa menu tidak ada dan route lama menghasilkan halaman tidak ditemukan.
Uji daftar/detail/create/edit ERF, approval tracking, recruitment dashboard, dan
export Excel. Export tidak lagi berisi kolom Custom Group.
