# 10. Feature Flow

## 1. Login

```mermaid
sequenceDiagram
  participant U as User
  participant P as LoginPage
  participant A as AuthRepository
  participant R as /auth/resolve-login
  participant S as Supabase Auth
  participant B as /auth/profile

  U->>P: submit identifier + password
  P->>A: login()
  alt identifier bukan email
    A->>R: resolve username
    R-->>A: email
  end
  A->>S: signInWithPassword
  S-->>A: session + user
  P->>B: load profile
  B-->>P: role + permission + profile
```

## 2. Manajemen User

```mermaid
flowchart TD
  A[Buka User Management] --> B[GET /admin/users]
  B --> C[render list user]
  C --> D{Aksi}
  D -->|Create| E[POST /admin/users]
  D -->|Update| F[PUT /admin/users/:id]
  D -->|Update role| G[PATCH /admin/users/:id/role]
  D -->|Activate/Deactivate| H[PATCH /admin/users/:id/active]
  D -->|Switch candidate ke employee| I[POST /admin/users/:id/switch-to-employee]
  D -->|Delete/Revoke| J[DELETE /admin/users/:id]
```

Business rule penting:

- Staff hanya boleh mengelola candidate yang dibuatnya sendiri.
- Candidate account baru wajib di-bind ke ERF eligible.
- Switch ke employee hanya tersedia untuk account `candidate_service` dengan role `candidate`.

## 3. Manajemen Candidate / Employee

```mermaid
flowchart TD
  A[Halaman candidate-forms] --> B[GET /api/candidate-forms]
  B --> C[List read-only dashboard]
  C --> D[Open detail]
  D --> E[GET /api/candidate-forms/:id]
  E --> F{Aksi}
  F -->|Export PDF| G[render template HTML client-side]
  F -->|Export Excel| H[enqueue export job]
  F -->|Open document| I[request signed URL]
  F -->|Submit contract docs| J[upload file + POST employee-documents]
```

Catatan:

- CRUD utama candidate form tidak aktif di dashboard ini.
- Repository frontend melempar error read-only untuk create/update/delete.

## 4. Import CSV

Status: **Belum ditemukan di implementasi saat ini**.

Temuan analisis:

- Tidak ditemukan page, endpoint, service, parser, atau dependency yang mengimplementasikan import CSV.
- Yang ditemukan justru export Excel (`xlsx`) dan generate DOCX.

## 5. Upload DOCX Template

```mermaid
sequenceDiagram
  participant U as User
  participant FE as ExportConfigurationTemplatesPage
  participant API as /api/export-templates/upload
  participant Scan as scanDocxPlaceholders
  participant Storage as Supabase Storage
  participant DB as Supabase DB

  U->>FE: pilih file .docx + isi nama template
  FE->>API: multipart upload
  API->>Scan: scan placeholder
  Scan-->>API: detected_fields[]
  API->>Storage: upload file ke bucket export-templates
  API->>DB: insert export_templates
  API->>DB: insert export_template_fields
  API-->>FE: template metadata
```

## 6. Deteksi Placeholder DOCX

Teknis implementasi:

1. File DOCX dibuka dengan `PizZip`.
2. XML `word/document.xml`, `header*.xml`, `footer*.xml` dipindai.
3. Placeholder yang terpecah antar XML run dinormalisasi dahulu.
4. Regex `{{\s*([a-zA-Z0-9_.-]+)\s*}}` dipakai untuk mengambil field key.
5. Hasil duplikat dibuang.

## 7. Export Configuration

```mermaid
flowchart TD
  A[List template aktif] --> B[GET /api/export-templates]
  B --> C[Open mapping]
  C --> D[GET /api/export-templates/:id/fields]
  D --> E[User ubah source path / label / default]
  E --> F[PATCH /api/export-templates/:id/fields/:fieldId]
```

## 8. Mapping Field

Source mapping yang ditemukan:

- direct field key, contoh `candidate_name`
- custom path, contoh `candidate.candidate_name`
- scope kandidat
- scope `employee_request_form`
- scope `employee_contract_form`

Status mapping UI:

- `ready`
- `custom`
- `manual`
- `needs_attention`

## 9. Auto-fill Data Candidate

```mermaid
sequenceDiagram
  participant FE as GeneratePage
  participant API as /api/export-documents/prepare
  participant Builder as export-payload-builder
  participant Data as Candidate/ERF/Contract data

  FE->>API: template_id + candidate_id
  API->>Builder: getPreparedExportCandidateById()
  Builder->>Data: load candidate + employee_request_form + employee_contract_form
  Builder-->>API: sourceScope
  API->>Builder: buildPreparedExportFields()
  Builder-->>FE: fields + status
```

## 10. Manual Override Field

- Setelah `prepare`, user dapat mengubah nilai field editable di halaman generate.
- Field required tetapi kosong akan berstatus `manual_required`.
- Payload final dibentuk dari seluruh field editor sebelum preview/generate.

## 11. Generate Document

```mermaid
flowchart TD
  A[Prepared fields] --> B[Validasi required field]
  B --> C[Download template dari storage]
  C --> D[generateDocxFromTemplate]
  D --> E[Buffer DOCX final]
  E --> F[insert generated_exports]
  F --> G[response attachment]
```

## 12. Download Document

- Endpoint: `POST /api/export-documents/generate`
- Response:
  - `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - `Content-Disposition: attachment; filename="<sanitized>.docx"`

## 13. Upload File ke Supabase Storage

### Foto kandidat

- Upload langsung via client Supabase.
- Bucket: `candidatePhotographBucket`
- Path: `candidate-forms/<ownerId>/<filename>`

### Dokumen kontrak employee

- Upload langsung via client Supabase.
- Bucket: `employeeDocumentBucket`
- Path: `employee-forms/<ownerId>/<documentType>/<filename>`
- Setelah upload, path dikirim ke backend agar diteruskan ke candidate service.

### Dokumen ERF (`document_erf`)

- Upload langsung via client Supabase saat create/edit ERF (field `document_erf`, satu file PDF/DOCX).
- Bucket: `getErfDocumentBucket()` (runtime config `erfDocumentBucket`, default `erf`) — bucket yang sama dengan `organizational_structure`/`job_description`.
- Path disimpan sebagai element `text[]` di `employee_request_form.document_erf`.
- File tetap disimpan meski parsing autofill gagal/tidak mengenali field apa pun — hanya proses autofill yang best-effort, bukan upload-nya.
- Muncul di halaman detail ERF (read-only) dan di `RecruitmentDocumentExplorerPage` per kandidat dengan key `erf_document`; akses signed URL divalidasi lewat `assertCandidateFormAssetAccess(..., 'erf_document')`.

### Template export

- Upload via server endpoint.
- Bucket default: `export-templates`
- Path: `templates/<timestamp>-<safe-name>.docx`

## 14. Audit Log

Status audit log eksplisit:

- `generated_exports` menyimpan histori generate dokumen.
- `user_history` tersedia sebagai modul riwayat user, tetapi schema tabel lokal detailnya tidak ditemukan eksplisit di file yang dibaca pada sesi ini.
- Audit log generik lain: **Perlu dikonfirmasi**.

## 15. Employee Request Form, Approval Chain, dan Recruitment Flow Stage

```mermaid
sequenceDiagram
  participant FE as ApprovalRepositoryImpl
  participant Start as /approval/start-chain
  participant Notify as /approval/notify-step
  participant Sync as /approval/sync-stage
  participant DB as Supabase (service role)

  FE->>Start: submitForApproval(employee_request_form_id, auto_approval)
  alt auto_approval = true
    Start->>DB: insert approval_chains (status=approved) + 1 approval_steps (approved, attributed ke requester)
    Start->>DB: syncRecruitmentFlowStage()
    Start-->>FE: chain_id
  else auto_approval = false (manual)
    Start->>DB: resolve flow key dari master_designation/designation_id
    Start->>DB: insert approval_chains + approval_steps (fallback approver_master bila Director BU tidak dipilih)
    Start-->>FE: chain_id
    FE->>Notify: kirim email approver step pertama (background task)
    loop setiap approve/reject step
      FE->>DB: update approval_steps.status (RLS scoped approver_email)
      FE->>Sync: sync-stage(chain_id)
      Sync->>DB: hitung ulang recruitment_flow_stage ERF dari status chain terbaru
    end
  end
```

Catatan:

- `/approval/start-chain` berjalan dengan Supabase admin client (service role) khusus untuk insert chain/step agar tidak terhalang RLS `approval_chains`, tetapi tetap memvalidasi pemanggil adalah owner ERF (manager) atau punya permission write ERF.
- Resolusi flow approval (`getApprovalFlowTemplate` + `resolveConfiguredApprovalFlowKeyFromDesignation`) memprioritaskan `master_designation_id` ERF, fallback ke `designation_id` legacy bila designation belum dipetakan.
- `recruitment_flow_stage` pada `employee_request_form` disinkronkan ulang setiap kali ada perubahan status approval lewat `/approval/sync-stage`, bukan dihitung di client.
- Pada form create/edit ERF ada toggle **Manual / Auto Approval** (`approvalMode`). Mode `auto` mengirim `auto_approval: true` ke `start-chain` dan langsung menutup chain dengan satu step approved (`approval_role_key = auto_approval`), tanpa melalui approver step biasa.
- `approval_director_bu_id` tidak lagi wajib diisi sebelum submit ERF (validasi frontend & backend yang mewajibkannya sudah dihapus). Bila kosong, step `director_approval` memakai approver dari `approver_master` yang dikonfigurasi untuk role tersebut, bukan Director BU yang dipilih manual.

## 15b. Upload ERF untuk Autofill Form

```mermaid
flowchart TD
  A[Klik Download Template] --> A1[Buka Word ERF resmi dari storage public template-erf]
  B[Klik Upload ERF] --> C[Pilih file PDF/DOCX]
  C --> D{Ukuran <= 10 MB?}
  D -->|Tidak| E[Toast error attachmentTooLarge]
  D -->|Ya| F[File langsung masuk selectedAttachmentFiles.document_erf]
  F --> G[extractErfDocumentFields]
  G --> H{DOCX?}
  H -->|Ya| H1[mammoth.extractRawText]
  H -->|Tidak, PDF| H2[pdfjs-dist getTextContent per halaman, group baris by posisi Y]
  H1 --> I[extractErfFieldsFromText: cocokkan label template, ambil value sampai label/boundary berikutnya]
  H2 --> I
  I --> J{Ada field ter-parse?}
  J -->|Tidak| K[Toast error noFieldsRecognized, file tetap tersimpan]
  J -->|Ya| L[applyParsedErfFields ke form]
  L --> M{Field select/name pakai fuzzy match master data?}
  M -->|Match exact/substring/Levenshtein >= 0.82| N[Isi value hasil match]
  M -->|Tidak match| O[Isi as-typed text + tampilkan warningText, bukan hard block]
  N --> P{Ada warning?}
  O --> P
  P -->|Ya| Q[Toast error documentParsedWithWarnings dengan jumlah field]
  P -->|Tidak| R[Toast success documentParsed]
```

Catatan:

- Parser: `src/presentation/utils/employeeRequestFormDocumentParser.ts` (`extractErfDocumentFields`, `extractErfFieldsFromText`, `parseErfDateValue`, `parseErfProbationMonths`). Fuzzy matcher: `src/presentation/utils/fuzzyMatch.ts` (`findOptionByLabel`, threshold similarity `0.82`).
- Field yang bisa di-autofill: `requested_date`, `required_date`, `pt_pembebanan`, `bu_category`, `department`, `designation`, `main_position`, `employment_status`, `position_status`, `periode_probation`, `direct_manager`, `site`, `working_location`.
- Scanner mengenali label di awal baris (dengan atau tanpa value inline setelah `:`) supaya PDF (label+value satu baris) dan DOCX (label sendiri per baris via mammoth) sama-sama terbaca.
- Watcher pada tiap field form akan menghapus warning mismatch begitu user mengubah value tersebut secara manual.
- Warning mismatch bersifat non-blocking — user tetap bisa submit form dengan value hasil parse yang tidak match, atau mengoreksinya manual.

## 16. PIC Recruitment - Assign Recruiter

```mermaid
flowchart TD
  A[Buka /recruitment/pic-recruitment] --> B[Query recruitment_queue_view via RecruitmentTrackingRepositoryImpl]
  B --> C[List ERF approved yang belum/sudah ada recruiter]
  C --> D[Pilih ERF, buka PicRecruitmentAssignModal]
  D --> E[Pilih recruiter dari daftar profil]
  E --> F[PATCH/assign recruiter ke employee_request_form.recruiter_user_id]
  F --> G[Refresh recruitment_queue_view]
```

Permission: melihat halaman butuh `pic_recruitment:read` (atau permission terkait ERF approved lainnya); melakukan assignment butuh `pic_recruitment:update`.

## 17. Employee Contract Form (NECF)

```mermaid
flowchart TD
  A[Buka EmployeeContractFormPage create/edit] --> B[Filter ERF: status != closed AND recruitment_flow_stage in interview_evaluation_completed/candidate_selected/employee_contract_form_in_progress]
  B --> C[Pilih ERF]
  C --> D[GET pipeline-candidates: id, hasCompletedInterview, hasExistingContract]
  D --> E[Filter kandidat: hasCompletedInterview = true AND hasExistingContract = false]
  E --> F[Pilih kandidat]
  F --> G[GET approval-users/:employeeRequestFormId untuk opsi approval user]
  G --> H[Isi data kontrak: contract_number, employee_code, tanggal mulai/selesai]
  H --> I[POST /recruitment/employee-contract-forms]
  I --> J[Tersimpan ke employee_contract_form]
  J --> K[Export/print PDF kontrak]
```

Catatan:

- Satu ERF hanya boleh memiliki satu `employee_contract_form` (`employee_contract_form_candidate_key` unique constraint berbasis kandidat, dan FK ERF bersifat `ON DELETE RESTRICT`).
- Approval user dipilih dari daftar profil yang relevan terhadap ERF terkait, bukan daftar bebas.
- Sejak commit `ad9013b`, daftar ERF yang bisa dipilih di NECF diperluas dari hanya `interview_evaluation_completed` menjadi juga `candidate_selected` dan `employee_contract_form_in_progress` (`necfEligibleRecruitmentFlowStages` di `EmployeeContractFormPage.vue`) — sebelumnya ERF dengan kandidat yang masih lag/belum lolos ke stage berikutnya tidak muncul sama sekali.
- Daftar kandidat per ERF difilter ke kandidat yang `hasCompletedInterview` dan belum `hasExistingContract`. Di mode edit, kandidat yang sedang tersimpan pada form tetap ditampilkan di opsi meski sudah tidak lolos filter eligibility saat ini (agar form edit tidak kehilangan value-nya).
