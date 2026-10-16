# 01. Project Overview

## Gambaran Umum Aplikasi

HRD Ruang adalah dashboard internal Human Capital Development untuk mengelola proses permintaan kebutuhan karyawan, approval berjenjang, rekrutmen, evaluasi interview, form kandidat/karyawan, pengelolaan user-role, dan pembangkitan dokumen berbasis template DOCX.

Frontend dibangun dengan Nuxt 4 dalam mode SPA (`ssr: false`). Backend menggunakan endpoint Nitro di folder `server/` yang berfungsi sebagai lapisan aman untuk operasi berbasis service role Supabase, signed URL storage, email, dan proses export dokumen.

## Tujuan Aplikasi

- Menyatukan proses HR/recruitment internal dalam satu dashboard.
- Memberikan kontrol akses berbasis role dan permission.
- Mengurangi pekerjaan manual pada approval chain, pemetaan kandidat, dan pembangkitan dokumen.
- Menjembatani dashboard internal dengan candidate service eksternal (`hrd_pintu`) saat data kandidat berasal dari sistem tersebut.

## Masalah yang Diselesaikan

- Pengelolaan ERF, approval, dan recruitment sebelumnya terpisah atau manual.
- Akses file kandidat dan employee document perlu diamankan melalui signed URL, bukan URL publik.
- Pengelolaan user internal, candidate account, dan employee switch perlu aturan role yang jelas.
- Pembuatan dokumen kerja dari data kandidat memerlukan template yang bisa dipetakan ulang tanpa perubahan kode.

## Pengguna Aplikasi

| Jenis pengguna | Keterangan implementasi |
| --- | --- |
| Administrator | Memiliki akses luas ke user, role, master data, approver master, dan email internal. |
| Manager | Akses data dibatasi pada record yang dimiliki atau ditugaskan, terutama pada ERF dan approval. |
| Staff | Diimplementasikan sebagai subset role internal; pada beberapa service dibatasi hanya boleh mengelola akun kandidat yang dibuatnya sendiri. |
| Recruiter / PIC Recruitment | Mengakses modul PIC Recruitment, vacancy pipeline, candidate database, dan recruitment dashboard sesuai permission. |
| Interviewer | Mengakses interviewer form dan penilaian interview yang ditugaskan. |
| Candidate | Login melalui Supabase Auth, diarahkan ke candidate portal atau route candidate form, dan memiliki masa aktif akses terbatas. |
| Employee | Akun hasil switch dari candidate service atau user internal dengan role employee. |

## Role Pengguna

Role bersifat dinamis karena diambil dari tabel `roles`. Nama role yang muncul eksplisit di source code:

- `admin`
- `administrator`
- `super admin`
- `super_admin`
- `manager`
- `staff*` (dikenali dengan prefix `staff`)
- `candidate`
- `employee`

## Ringkasan Fitur Utama

- Login dengan email atau username.
- Dashboard summary.
- Employee Request Form.
- Approval tracking dan approver master.
- Recruitment dashboard, vacancy pipeline, closed vacancy, PIC recruitment (assign recruiter ke ERF approved).
- Recruitment flow stage tracking otomatis pada ERF, disinkronkan dari status approval chain.
- Master designation sebagai pengganti bertahap job level legacy, dipakai untuk routing approval flow dan minimal lead time required date.
- Candidate database dan candidate document explorer.
- Candidate/employee form read-only dashboard, signed document access, dan export Excel.
- Interview evaluation dan interviewer assignment.
- Employee contract form.
- User management, candidate/employee management, user history.
- Role management dan permission assignment.
- Export configuration untuk template DOCX.

## Ringkasan Flow Bisnis

1. User login melalui Supabase Auth.
2. `authStore` memuat profil, role, dan permission dari backend `/auth/profile`.
3. Middleware global memeriksa status autentikasi, role, dan permission route.
4. User menjalankan modul sesuai akses: ERF, approval, recruitment, interview, user management, atau export configuration.
5. Untuk dokumen:
   - template DOCX di-upload ke bucket `export-templates`,
   - placeholder di-scan,
   - field dipetakan ke data kandidat/ERF/contract,
   - user melakukan preview,
   - sistem menghasilkan file DOCX final dan mencatat riwayat generated export.
6. Untuk candidate/employee:
   - dashboard membaca data kandidat dari candidate DB/service bila tersedia,
   - route candidate workspace dapat redirect ke candidate portal eksternal atau ke `/candidate-employees` tergantung role dan permission,
   - file kandidat diakses melalui signed URL,
   - dokumen kontrak employee dikirim kembali ke candidate service bila form terkait berasal dari sana.
