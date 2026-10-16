# 18. Changelog

## Format Changelog

Dokumen ini mengikuti format sederhana:

- `Added`
- `Changed`
- `Fixed`
- `Security`

## Versi Awal Dokumentasi

## [1.0.0] - 2026-05-22

### Added

- README teknis project berdasarkan source code.
- Dokumentasi overview, requirement, arsitektur, folder structure, database, ERD.
- Dokumentasi auth, authorization, RLS, API/service, dan feature flow.
- Dokumentasi halaman UI, komponen penting, environment, deployment, testing, error handling, maintenance, dan user manual.

### Changed

- README diperbarui agar selaras dengan struktur Nuxt + Nitro + Supabase yang ada saat ini.

### Fixed

- Konsolidasi informasi project agar developer baru tidak perlu menebak struktur implementasi dari source code.

### Security

- Penegasan bahwa `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di server.
- Pencatatan area yang perlu konfirmasi keamanan tambahan:
  - policy RLS tabel export
  - policy storage bucket `export-templates`
  - policy storage bucket `candidate-photographs`

## [1.1.6] - 2026-07-14

### Fixed

- Scanner autofill dokumen ERF sekarang mengenali label yang berada di awal baris yang sama dengan value-nya (mis. `"Requested Date : 01/07/2026"`), bukan hanya label yang berdiri sendiri di barisnya — pola ekstraksi text PDF berbeda dari DOCX (`mammoth`) yang selalu memisah label/value per baris. Sebelumnya, upload PDF selalu ter-parse ke nol field tanpa error yang jelas (commit `50c1f69`).
- Toast "auto-filled successfully" tidak lagi muncul palsu ketika parser benar-benar tidak mengenali field apa pun dari dokumen yang diupload; kini menampilkan error `noFieldsRecognized` yang jelas, file tetap disimpan untuk diupload (commit `50c1f69`).
- Dokumen ERF yang diupload saat create/edit kini tetap tampil di halaman detail ERF (read-only) — sebelumnya card preview disembunyikan total ketika `isDetail = true`, sehingga dokumen "hilang" begitu ERF dibuka ulang. Tombol Remove tetap disembunyikan di mode detail (commit `3c5fc08`).
- Mock `useAppToast` di test diperbaiki karena sebelumnya tidak menyediakan method `success`, sehingga assertion pada code path sukses tidak pernah benar-benar tervalidasi.

## [1.1.5] - 2026-07-14

### Added

- Tombol **Download Template** dan **Upload ERF** pada halaman create/edit Employee Request Form. Upload ERF menerima file PDF/DOCX, mengekstrak text (`mammoth` untuk DOCX, `pdfjs-dist` untuk PDF), lalu auto-fill field form berdasarkan label template ERF resmi (`src/presentation/utils/employeeRequestFormDocumentParser.ts`).
- Fuzzy matching (Levenshtein, threshold `0.82`) untuk mencocokkan value hasil parse dokumen terhadap opsi master data (`src/presentation/utils/fuzzyMatch.ts`), sehingga typo hasil ketik manual di dokumen sumber tetap bisa ter-resolve; value yang tidak match tetap diisi as-typed dengan warning non-blocking, bukan hard block.
- Toggle **Manual / Auto Approval** pada section Approval form ERF. Auto Approval mengirim `auto_approval: true` ke `POST /approval/start-chain`, yang langsung menutup approval chain dengan satu step `approved` diatribusikan ke requester ERF, melewati flow approver berjenjang.
- Kolom `employee_request_form.document_erf` (`text[]`, migration `20260714_084_add_dokument_erf_to_employee_request_form.sql`) untuk menyimpan path dokumen ERF yang diupload. Dokumen ini dipreview di form, tetap tampil di halaman detail, dan disurfacekan per kandidat di `RecruitmentDocumentExplorerPage` dengan key `erf_document` (bucket `getErfDocumentBucket()`, default `erf`).

### Changed

- `approval_director_bu_id` pada ERF tidak lagi wajib diisi sebelum submit (validasi frontend `buDirectorRequired` dan validasi backend `Director BU is required.` dihapus). Bila kosong, step `director_approval` fallback ke approver master yang dikonfigurasi untuk role tersebut, bukan Director BU pilihan manual.
- `GET /api/recruitment/candidate-document-explorer/sign-url` dan `assertCandidateFormAssetAccess()` menambah asset type `erf_document` yang divalidasi terhadap path pada `candidateForm.employee_request_form.document_erf`.

## [1.1.4] - 2026-07-15

Catatan: commit `ad9013b` ini topologically berada sebelum `1.1.3` (parent langsung dari commit dokumentasi `a1f9d1d`), tetapi luput terdokumentasi saat itu — dicatat di sini agar urutan versi tetap berurutan.

### Fixed

- ERF dan kandidat pada NECF kini tetap tampil dengan benar ketika satu kandidat pada ERF yang sama masih lag/belum selesai interview evaluation-nya (commit `ad9013b`).
- `resolvePersistedRecruitmentFlowStage()` di `recruitmentFlowStageService.js`: stage `interview_evaluation_completed` sebelumnya baru tercapai bila **semua** kandidat/form pada ERF sudah selesai dievaluasi (`allInterviewersCompleted`, `forms.every(...)`); sekarang cukup **satu** kandidat yang seluruh interviewer-nya complete (`hasFullyCompletedCandidateInterview`, `forms.some(...)`). Sebelumnya satu kandidat yang lag membuat seluruh ERF tertahan di stage sebelumnya walau kandidat lain sudah lengkap.
- `GET /api/employee-request-forms/:id/pipeline-candidates` kini mengembalikan `hasCompletedInterview` dan `hasExistingContract` per kandidat, dipakai NECF (`EmployeeContractFormPage.vue`) untuk memfilter kandidat yang siap dibuatkan kontrak per-kandidat, bukan per-ERF.
- Daftar ERF yang bisa dipilih di NECF diperluas dari hanya stage `interview_evaluation_completed` menjadi juga `candidate_selected` dan `employee_contract_form_in_progress`; pada mode edit, kandidat yang sedang tersimpan di form tetap tampil di opsi meski sudah tidak lolos filter eligibility saat ini.

## [1.1.3] - 2026-07-13

### Changed

- `SKB` tidak lagi wajib untuk submit/lengkapi dokumen kontrak employee; hanya `format_office` (Draft Employment Contract) yang wajib. `skb` dan `other` kini opsional.
- Constant `REQUIRED_CONTRACT_DOCUMENT_TYPES` di `employee-documents.post.ts` diubah dari `[format_office, skb]` menjadi `[format_office]` (commit `3ff1b4c`, `d1873c8`, `28aa802`).
- `hasUploadedDraftContractDocuments()` di `candidateDatabaseReadService.js` kini hanya mengecek `format_office`, sehingga resolve stage `employee_contract_form_in_progress` -> `hiring_completed` dan auto-close ERF tidak lagi menunggu `SKB`.
- Tombol submit dokumen kontrak di `CandidateFormPage` kini aktif begitu `format_office` tersedia (baik file baru dipilih maupun sudah tersimpan sebelumnya), tidak lagi menunggu kedua dokumen.

### Fixed

- Validasi "minimal satu file dokumen kontrak harus dipilih" saat submit dihapus, sehingga user tidak lagi terblokir saat ingin submit ulang dokumen yang sudah pernah diupload.
- Pesan error submit diupdate dari "Draft Employment Contract and SKB must both be available before submitting contract documents." menjadi "Draft Employment Contract must be available before submitting contract documents."

## [1.1.2] - 2026-07-06

### Added

- restore automatic deactivation logic untuk candidate accounts dengan periode 12 bulan
- timer dan countdown kembali ditampilkan di frontend untuk inform candidate tentang sisa waktu akses
- modal "Info Deactivated" kembali ditampilkan untuk show access expiry information

### Changed

- periode auto-deactivate candidate account diperpanjang dari 3 hari menjadi 12 bulan (365 hari)
- `CANDIDATE_ACTIVE_DAYS` konstanta di-update dari 3 menjadi 365
- utility functions `candidateAccess.ts` di-restore: `getCandidateAccessExpiryTime()`, `getCandidateAccessRemainingDays()`, `getCandidateAccessStartTime()`, `getCandidateAccessRemainingMs()`, `CANDIDATE_ACTIVE_DAYS`
- logic timer dan countdown di `authStore.ts` di-restore: `scheduleCandidateExpiry()`, `expireCandidateIfNeeded()`, `forceCandidateLogout()`, `enforceUserAccess()`

### Notes

- periode 12 bulan memberikan fleksibilitas lebih bagi candidate untuk menyelesaikan proses recruitment
- timer di-client-side akan menampilkan countdown hari-hari sisa sebelum akun auto-deactivate
- manual deactivation dari admin panel tetap dapat dilakukan kapan saja

## [1.1.1] - 2026-07-06

### Changed

- mekanisme deactivasi akun candidate berubah dari otomatis (3 hari) menjadi manual saja
- action "Info Deactivated" dihapus dari user management menu (tidak lagi relevan)
- modal yang menampilkan candidate access expiry information dihapus
- utility functions `candidateAccess.ts` dihapus: `getCandidateAccessExpiryTime()`, `getCandidateAccessRemainingDays()`, `getCandidateAccessStartTime()`, `getCandidateAccessRemainingMs()`, `CANDIDATE_ACTIVE_DAYS`
- logic timer dan countdown di `authStore.ts` dihapus: `scheduleCandidateExpiry()`, `expireCandidateIfNeeded()`, `forceCandidateLogout()`, `enforceUserAccess()`

### Removed

- timer/countdown yang menampilkan sisa waktu akses candidate
- automatic logout setelah 3 hari untuk candidate users
- modal info candidate access dengan countdown

### Notes

- deactivasi akun candidate kini hanya dapat dilakukan manual dari admin panel menggunakan `setUserActiveStatus()`
- manual deactivation tetap berfungsi penuh, tidak ada perubahan pada fitur deactivate yang sudah ada

## [1.1.0] - 2026-06-23

### Added

- Dokumentasi kolom dan relasi baru hasil migration `20260529_069` s.d. `20260619_080`: `master_designation.job_level_id`, `employee_request_form.master_designation_id`/`approval_director_bu_id`/`requested_date`/`notes`, `approver_master.master_designation_id`, `profiles.cost_center_pt`, `interview_evaluation_forms.notes`.
- Dokumentasi endpoint baru: `/auth/change-password`, `/approval/start-chain`, `/approval/notify-step`, `/approval/sync-stage`, `/health`, `/csp-report`, `/send-email`, `/internal/candidate-events`, `PATCH /api/employee-request-forms/:id/notes`, `POST /api/interview-evaluations/assigned/:id/documents/sign-url`.
- Dokumentasi permission baru: `pic_recruitment:read`/`update`, `recruitment:approved_erf_read`/`vacancy_pipeline_detail`/`closed_vacancy_detail`/`interview_evaluasi`, `employee_request_form:requester_read`/`requester_update`, `document:download`, `candidate_form:export_pdf`, `employee_form:export_pdf`.
- Dokumentasi flow baru di `docs/10`: approval chain & recruitment flow stage sync, PIC recruitment assign recruiter, employee contract form (NECF).
- Dokumentasi repository (`MasterDataRepositoryImpl`, `CustomGroupRepositoryImpl`, `RecruitmentTrackingRepositoryImpl`) dan service (`approvalService.js`, `recruitmentFlowStageService.js`, `candidateProjectionEventService.js`, dll) yang sebelumnya belum tercatat.
- Dokumentasi komponen recruitment/candidate form/ERF yang sebelumnya belum tercatat (PIC recruitment table/modal, vacancy pipeline table/modal, dashboard hero/summary, candidate form sections, ERF table/close modal).
- Penambahan folder `supabase/` dan `src/config/` ke `docs/04`.

### Changed

- Perbaikan permission yang terdokumentasi untuk route `/recruitment/pic-recruitment`, `/interview-evaluations*`, dan `/candidate-forms*` agar sesuai `definePageMeta()` aktual (termasuk flag `allowAdminAccessWithoutPermissions`).
- Catatan bahwa `master_department.bu_id` sengaja dilepas dari FK `master_bu` (bukan sekadar "tidak ditemukan di dump"), serta `recruitment_queue_view` dan ERD diperbarui mengikuti definisi view terbaru.

## Template Release Berikutnya

```md
## [x.y.z] - YYYY-MM-DD

### Added
- 

### Changed
- 

### Fixed
- 

### Security
- 
```
