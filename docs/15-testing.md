# 15. Testing

## Strategi Testing Berdasarkan Project

Framework test yang ditemukan:

- Vitest
- Vue Test Utils
- jsdom

Konfigurasi:

- file: `vitest.config.ts`
- environment: `jsdom`
- alias test:
  - `@`
  - `~~`
  - `h3` stub
  - `#imports` stub

## Cakupan Test Otomatis yang Ditemukan

### Unit / component / viewmodel

- auth store
- middleware access
- page feature utama:
  - admin
  - approvals
  - auth
  - candidate forms
  - employee request forms
  - interview evaluations (termasuk `InterviewEvaluasiPage`)
  - profile
  - recruitment (termasuk `PicRecruitmentPage`, `VacancyPipelinePage`, `RecruitmentDashboardPage`, `EmployeeContractFormListPage`, `RecruitmentCandidateDatabasePage`, `RecruitmentDocumentExplorerPage`)
  - role management
- application use case:
  - `ApprovalUseCases`
  - `ApproverMasterUseCases`
  - `CandidateFormUseCases`
- repository implementation:
  - `EmployeeRequestFormRepositoryImpl`
- viewmodel:
  - admin
  - core viewmodels
- presentational util:
  - `SearchableSelect`
  - PDF template util

### Server / integration-like

- dashboard summary API
- employee request form API
- auth route
- send email route
- CSP report route
- candidate event route
- employee contract form approval users route
- context / API util / origin util
- auth service
- candidate DB service
- candidate service client
- employee contract form service
- interview evaluation service
- recruitment flow stage service
- user management service
- employee request form service
- approval start-chain route

### E2E

E2E khusus browser: **Belum ditemukan di repository saat ini**.

## Command Testing

```bash
pnpm test:unit
```

Opsional:

```bash
pnpm type-check
```

## Manual Test Case

| ID | Skenario | Langkah singkat | Hasil yang diharapkan |
| --- | --- | --- | --- |
| MT-001 | Login email | login dengan email valid | redirect ke route default role |
| MT-002 | Login username | login dengan username valid | username di-resolve ke email dan login sukses |
| MT-003 | Route guard | akses halaman private tanpa login | redirect ke `/login` |
| MT-004 | Permission guard | login tanpa permission lalu buka route terbatas | redirect ke default route / profile |
| MT-005 | User create internal | create user internal dari user management | user muncul di list |
| MT-006 | Candidate create | create candidate account dengan ERF eligible | account candidate berhasil dibuat |
| MT-007 | Switch to employee | switch candidate service account | role berubah ke employee |
| MT-008 | ERF create | buat ERF baru | data tersimpan dan muncul di list |
| MT-009 | Approval action | approve/reject step assigned | status chain/step berubah |
| MT-010 | Candidate form open file | buka dokumen kandidat | signed URL terbuka |
| MT-011 | Upload contract docs | upload `format_office` (wajib) untuk employee form completed; `skb`/`other` opsional; submit ulang tanpa file baru bila dokumen wajib sudah tersimpan | backend menerima path dan sinkron ke candidate service |
| MT-012 | Export candidate Excel | klik export Excel | job queued, selesai, file terunduh |
| MT-013 | Upload DOCX template | upload file DOCX dengan placeholder | template dan field mapping terbentuk |
| MT-014 | Mapping field | ubah source path field | patch mapping sukses |
| MT-015 | Prepare export | pilih template + kandidat | field auto-filled tampil |
| MT-016 | Preview export | klik preview document | modal preview HTML tampil |
| MT-017 | Generate export | klik download DOCX | file DOCX terunduh dan histori tersimpan |
| MT-018 | Upload ERF autofill | upload dokumen ERF (PDF dan DOCX) berisi data lengkap saat create ERF | field form ter-autofill; field yang tidak match master data tetap terisi as-typed dengan warning, bukan hard block |
| MT-019 | Upload ERF tanpa Director BU + Auto Approval | buat ERF tanpa memilih Director BU, toggle Auto Approval, submit | ERF tersimpan, approval chain langsung `approved` dengan satu step atas nama requester |
| MT-020 | NECF kandidat lag | pada satu ERF dengan >1 kandidat interview, selesaikan evaluasi untuk sebagian kandidat saja | ERF & kandidat yang sudah selesai tetap muncul di opsi NECF; kandidat yang belum selesai tidak muncul |

## Test Case Login

| Case | Expected |
| --- | --- |
| password salah | error toast / message login gagal |
| username tidak ditemukan | resolve login fallback email invalid, login gagal di Supabase |
| akun inactive | login ditolak / user di-logout paksa |
| candidate expired | candidate di-logout paksa dan diarahkan ke login setelah 12 bulan |

## Test Case CRUD

| Modul | Fokus |
| --- | --- |
| User management | create, update, change role, deactivate, delete |
| Role management | create role, assign permission, delete |
| Employee request form | create, update, close, assign recruiter |
| Interview evaluation | create, update, delete |
| Employee contract form | create, update, delete |

## Test Case Import CSV

Status: **Belum ditemukan di implementasi saat ini**.

Rekomendasi dokumentasi test:

- jika fitur CSV import akan ditambahkan, buat test untuk validasi header, row invalid, rollback parsial, dan audit hasil import.

## Test Case Upload DOCX

| Case | Expected |
| --- | --- |
| file non-DOCX | ditolak `400` |
| DOCX tanpa placeholder | ditolak `400` |
| DOCX valid | template tersimpan |
| placeholder terfragmentasi antar run | tetap terdeteksi setelah normalisasi XML |

## Test Case Mapping Placeholder

| Case | Expected |
| --- | --- |
| source path valid | status `ready/auto_filled` |
| source path ada tapi value kosong | status `manual_required` |
| source path tidak valid | status `manual` |
| field required kosong saat generate | generate ditolak |

## Test Case Generate Dokumen

| Case | Expected |
| --- | --- |
| preview | HTML preview tampil |
| download | file DOCX terunduh |
| payload invalid | endpoint mengembalikan `400` |
| template hilang di storage | endpoint mengembalikan error |

## Test Case RLS / Auth

| Case | Expected |
| --- | --- |
| user tanpa `role:manage` query tabel role via client langsung | ditolak oleh RLS |
| user tanpa `recruitment:document_explorer` buka explorer | route/endpoint ditolak |
| signed URL file kandidat untuk user tidak berhak | endpoint menolak akses |

## Template Bug Report

```md
### Ringkasan
Jelaskan bug secara singkat.

### Langkah Reproduksi
1.
2.
3.

### Hasil Aktual

### Hasil yang Diharapkan

### Environment
- Branch:
- Commit:
- Browser:
- Role user:

### Bukti
- Screenshot / log / response payload
```
