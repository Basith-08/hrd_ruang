# 02. System Requirement

## Functional Requirement

| ID | Requirement |
| --- | --- |
| FR-001 | Sistem harus mengautentikasi user menggunakan Supabase Auth dan mendukung login dengan email atau username. |
| FR-002 | Sistem harus memuat profil user, role, dan permission setelah login untuk kontrol akses route dan fitur. |
| FR-003 | Sistem harus melindungi seluruh route non-public dengan middleware global. |
| FR-004 | Sistem harus menyediakan modul Employee Request Form untuk list, detail, create, update, close, dan assignment recruiter sesuai permission. |
| FR-005 | Sistem harus menyediakan approval tracking, approver master, dan notifikasi approval email. |
| FR-006 | Sistem harus menyediakan recruitment dashboard, vacancy pipeline, closed vacancy, PIC recruitment, dan candidate database. |
| FR-007 | Sistem harus menampilkan candidate/employee form dan membuka file pendukung melalui signed URL. |
| FR-008 | Sistem harus mendukung export candidate/employee form ke PDF dan Excel. |
| FR-009 | Sistem harus menyediakan modul interview evaluation, interviewer assignment, dan interviewer result. |
| FR-010 | Sistem harus menyediakan modul employee contract form beserta approval user dan attachment terkait. |
| FR-011 | Sistem harus menyediakan user management, termasuk create, update, deactivate/activate, delete/revoke, update role, dan switch candidate ke employee. |
| FR-012 | Sistem harus menyediakan role management dan sinkronisasi permission katalog aplikasi. |
| FR-013 | Sistem harus menerima upload template DOCX, mendeteksi placeholder `{{...}}`, dan menyimpan metadata template. |
| FR-014 | Sistem harus memungkinkan pemetaan placeholder template ke field data kandidat, ERF, dan employee contract. |
| FR-015 | Sistem harus menyiapkan payload export, menampilkan preview HTML hasil render, lalu menghasilkan file DOCX final untuk diunduh. |
| FR-016 | Sistem harus menyimpan riwayat generated export ke tabel `generated_exports`. |
| FR-017 | Sistem harus mengirim email internal melalui endpoint server admin-only. |
| FR-018 | Sistem harus membatasi akses file storage menggunakan signed URL dan validasi akses server-side. |
| FR-019 | Sistem harus menyediakan PIC Recruitment untuk assign/reassign recruiter ke ERF approved. |
| FR-020 | Sistem harus menyinkronkan `recruitment_flow_stage` ERF setelah setiap perubahan status approval chain. |
| FR-021 | Sistem harus mendukung master designation (dengan minimal lead time required date) sebagai acuan routing approval flow, dengan fallback ke job level legacy bila designation belum dipetakan. |
| FR-022 | Sistem harus mengizinkan user yang sudah login mengubah password sendiri melalui endpoint khusus dengan validasi password lama dan rate limit. |

## Non-Functional Requirement

| ID | Requirement |
| --- | --- |
| NFR-001 | Frontend harus berjalan sebagai SPA; `ssr` dimatikan di `nuxt.config.ts`. |
| NFR-002 | Lapisan data harus dipisahkan menjadi `domain`, `application`, `infrastructure`, dan `features`. |
| NFR-003 | Operasi sensitif server harus berjalan dengan `SUPABASE_SERVICE_ROLE_KEY` di server, bukan di client. |
| NFR-004 | Sistem harus memiliki baseline security header melalui middleware Nitro. |
| NFR-005 | Endpoint tertentu harus memiliki rate limiting in-memory untuk mengurangi abuse. |
| NFR-006 | Test otomatis berbasis Vitest harus tersedia untuk use case, middleware, store, page, service, dan route utama. |
| NFR-007 | Akses file storage harus memakai signed URL berdurasi terbatas, bukan bucket publik. |
| NFR-008 | Dokumentasi field export harus mengikuti placeholder riil yang ditemukan dari file DOCX, bukan definisi statis. |

## Business Rules

- Candidate login boleh memakai username; backend akan me-resolve username ke email sebelum `signInWithPassword`.
- Candidate dengan role `candidate` dibatasi ke route candidate form/candidate portal.
- Akun candidate auto-deactivate setelah 12 bulan dari aktivasi; waktu ini dihitung dari `activated_at` atau `created_at`.
- Dashboard candidate form bersifat read-only untuk CRUD utama; perubahan form diarahkan ke `hrd_pintu`.
- Upload dokumen kontrak hanya berlaku untuk role form `employee`.
- Upload dokumen kontrak hanya valid jika `completion_status = completed`.
- Upload dokumen kontrak hanya valid jika sumber data kandidat berasal dari `candidate_service`.
- Tipe dokumen kontrak yang wajib ada saat submit adalah `format_office` (Draft Employment Contract); `skb` dan `other` bersifat opsional.
- Template export harus berupa `.docx`.
- Template export harus memiliki minimal satu placeholder `{{field}}`.
- Pemetaan field required harus terisi sebelum generate final.
- Staff hanya boleh mengelola akun candidate yang dibuatnya sendiri.
- Akun candidate baru wajib terikat ke ERF yang masih eligible menurut `recruitment_flow_stage`.

## Acceptance Criteria

- User tanpa session diarahkan ke `/login`.
- User tanpa permission tidak dapat mengakses route berizin dan diarahkan ke route default.
- Template DOCX tanpa placeholder ditolak dengan error `400`.
- File export DOCX berhasil diunduh dengan nama file hasil sanitasi dari nama kandidat.
- File kandidat/employee yang tidak memiliki akses valid tidak boleh menghasilkan signed URL.
- Perubahan status aktif user tercermin di daftar user dan history.
- Generate export mencatat histori ke `generated_exports`.

## Batasan Sistem

- CSV import: belum ditemukan di implementasi saat ini.
- Deployment alternatif selain Vercel: belum ditemukan konfigurasi eksplisit di repository.
- Beberapa data kandidat berasal dari service/database eksternal sehingga schema lokal penuh tidak tersedia.
- Queue export Excel candidate form memakai in-memory queue; tidak ada persistence queue lintas restart server.

## Asumsi Sistem

- Supabase Auth menjadi source session utama untuk user internal maupun candidate.
- Tabel `roles`, `permissions`, `role_permissions`, dan `user_roles` adalah sumber RBAC utama.
- Bucket storage dikonfigurasi private di Supabase.
- SMTP tersedia bila fitur email dipakai.

## Dependensi Eksternal

- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- SMTP provider
- Candidate service `hrd_pintu`
- Vercel (berdasarkan konfigurasi repository)
- Google Chrome/Chromium untuk render PDF attachment server-side bila flow tersebut dipakai
