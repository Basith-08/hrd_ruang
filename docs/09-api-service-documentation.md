# 09. API & Service Documentation

## Daftar Composable

| Function | Location | Description | Used by |
| --- | --- | --- | --- |
| `useAppRepositories()` | `src/composables/useAppRepositories.ts` | Mengambil container repository dari plugin Nuxt atau fallback singleton infrastructure. | Hampir semua viewmodel |
| `useLayoutNavigation()` | `src/composables/useLayoutNavigation.ts` | Menyusun sidebar navigation berdasarkan permission dan route aktif. | `AppSidebar`, layout |
| `translateText()` | `src/composables/useLocale.ts` | Translasi util non-component. | store, util, use case |
| `useLocale()` | `src/composables/useLocale.ts` | Akses text i18n sederhana berbasis file `lang/*.json`. | hampir semua feature/component |

## Repository Client Utama

| Class | Location | Method utama | Fungsi |
| --- | --- | --- | --- |
| `AuthRepositoryImpl` | `src/infrastructure/supabase/repositories/AuthRepositoryImpl.ts` | `login`, `logout` | Login Supabase dan resolve username |
| `ApprovalRepositoryImpl` | `src/infrastructure/supabase/repositories/ApprovalRepositoryImpl.ts` | `getChainsByUser`, `submitForApproval`, `approveAssignedStep` | Approval tracking dan approver master |
| `CandidateFormRepositoryImpl` | `src/infrastructure/supabase/repositories/CandidateFormRepositoryImpl.ts` | `getAll`, `getById` | Akses candidate form dashboard read-only |
| `EmployeeRequestFormRepositoryImpl` | `src/infrastructure/supabase/repositories/EmployeeRequestFormRepositoryImpl.ts` | `getAll`, `create`, `update`, `assignRecruiter`, `close` | ERF dan vacancy pipeline |
| `InterviewEvaluationRepositoryImpl` | `src/infrastructure/supabase/repositories/InterviewEvaluationRepositoryImpl.ts` | `getAll`, `getAssigned`, `create`, `update` | Interview evaluation dan interviewer form |
| `RoleRepositoryImpl` | `src/infrastructure/supabase/repositories/RoleRepositoryImpl.ts` | `getAllRoles`, `getAllPermissions`, `createRole`, `updateRolePermissions` | Role management |
| `UserManagementRepositoryImpl` | `src/infrastructure/supabase/repositories/UserManagementRepositoryImpl.ts` | `getAllUsers`, `createUser`, `updateUser`, `switchToEmployee` | User management |
| `CandidateDocumentExplorerRepositoryImpl` | `src/infrastructure/supabase/repositories/CandidateDocumentExplorerRepositoryImpl.ts` | `getAll` | Candidate document explorer |
| `MasterDataRepositoryImpl` | `src/infrastructure/supabase/repositories/MasterDataRepositoryImpl.ts` | CRUD master PT/BU/department/job level/designation | Master data management |
| `CustomGroupRepositoryImpl` | `src/infrastructure/supabase/repositories/CustomGroupRepositoryImpl.ts` | CRUD `master_custom_grup_1..6` | Custom group management |
| `RecruitmentTrackingRepositoryImpl` | `src/infrastructure/supabase/repositories/RecruitmentTrackingRepositoryImpl.ts` | Query `recruitment_queue_view` | Recruitment dashboard, vacancy pipeline, PIC recruitment |

## Server Service Utama

| Function | Location | Description |
| --- | --- | --- |
| `resolveLoginIdentifier()` | `server/services/authService.js` | Resolve username ke email dari tabel `profiles`. |
| `buildAuthenticatedProfile()` | `server/services/authService.js` | Menyusun payload profil login termasuk permission. |
| `loadManagedUsers()` | `server/services/userManagementService.js` | List user internal + candidate service sesuai scope. |
| `createManagedUser()` | `server/services/userManagementService.js` | Membuat user internal atau candidate account eksternal. |
| `switchManagedUserToEmployee()` | `server/services/userManagementService.js` | Mengubah candidate service account menjadi employee. |
| `listCandidateFormsForDashboard()` | `server/services/candidateFormReadService.js` | List candidate form untuk dashboard. |
| `createCandidateFormsExcelExport()` | `server/services/candidateFormExportService.ts` | Membuat file Excel candidate form. |
| `listEmployeeContractForms()` | `server/services/employeeContractFormService.js` | List NECF. |
| `createInterviewEvaluation()` | `server/services/interviewEvaluationService.js` | Create evaluasi interview. |
| `sendApprovalStepEmail()` | `server/services/approvalService.js` | Kirim email notifikasi step approval berikutnya. |
| `syncRecruitmentFlowStage()` | `server/services/recruitmentFlowStageService.js` | Sinkronkan `recruitment_flow_stage` ERF berdasarkan status approval chain/candidate. |
| `changeAuthenticatedPassword()` | `server/services/authService.js` | Ubah password user yang sedang login (validasi password lama + rate limit). |
| `syncCandidateProjectionEvent()` | `server/services/candidateProjectionEventService.js` | Terima event sinkronisasi candidate dari candidate service (validasi `HRD_PINTU_SERVICE_SYNC_TOKEN`). |
| `sendEmail()` | `server/services/emailService.js` | Kirim email internal admin-only via `server/services/mailer.js`. |
| `scanDocxPlaceholders()` | `server/services/export/docx-placeholder-scanner.ts` | Scan placeholder `{{...}}` dari DOCX. |
| `generateDocxFromTemplate()` | `server/services/export/docx-generator.ts` | Render template DOCX dengan payload final. |
| `renderDocxPreviewHtml()` | `server/services/export/docx-preview.ts` | Convert DOCX hasil render ke HTML preview. |
| `listExportCandidates()` | `server/services/export/export-payload-builder.ts` | Menyusun kandidat yang bisa dipakai untuk export document. |
| `buildPreparedExportFields()` | `server/services/export/export-payload-builder.ts` | Auto-fill field berdasarkan source mapping. |
| `uploadExportTemplateFile()` | `server/services/export/export-template-service.ts` | Upload template DOCX ke storage. |
| `createGeneratedExportHistory()` | `server/services/export/export-template-service.ts` | Simpan histori generate. |

## Server/API Endpoint Utama

Catatan:

- Route di bawah ini adalah kontrak aktif yang benar-benar ditemukan di `server/api/*` dan `server/routes/*`.
- Frontend memanggil kombinasi endpoint `/api/*` dan Nitro route non-`/api`.

### Auth & profile

| Method | Route | Permission | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/resolve-login` | public | Resolve username ke email |
| `GET` | `/auth/profile` | authenticated | Ambil profil + role + permission |
| `POST` | `/auth/change-password` | authenticated, rate limited | Ubah password user yang sedang login |

### User & role

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/admin/users` | List user sesuai scope (`scope` query opsional) |
| `POST` | `/admin/users` | Buat user / candidate account |
| `PUT` | `/admin/users/:userId` | Update user |
| `PATCH` | `/admin/users/:userId/role` | Update role |
| `PATCH` | `/admin/users/:userId/active` | Activate/deactivate user |
| `POST` | `/admin/users/:userId/switch-to-employee` | Switch candidate service account ke employee |
| `DELETE` | `/admin/users/:userId` | Delete internal user / revoke candidate account |
| `GET` | `/admin/user-history` | User history |
| `GET` | `/admin/user-management/roles` | Role options untuk user management |
| `GET` | `/admin/roles` | List role |
| `POST` | `/admin/roles` | Create role |
| `PUT` | `/admin/roles/:roleId/permissions` | Update role permissions |
| `DELETE` | `/admin/roles/:roleId` | Delete role |
| `GET` | `/admin/permissions` | Load permission catalog |

### Dashboard

| Method | Route | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/api/dashboard/summary` | `dashboard:read` | Ringkasan dashboard utama |
| `GET` | `/api/dashboard/interview-monitor` | `dashboard:read` | Monitoring interview |
| `GET` | `/api/dashboard/document-contract-readiness` | `dashboard:read` | Kesiapan dokumen/contract |

### Employee Request Form & Recruitment

| Method | Route | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/api/employee-request-forms/:id` | akses ERF | Detail ERF |
| `DELETE` | `/api/employee-request-forms/:id` | akses ERF | Hapus ERF |
| `PATCH` | `/api/employee-request-forms/:id/notes` | admin, atau `employee_request_form:update` / `recruitment:vacancy_pipeline_detail` / `recruitment:closed_vacancy_detail` | Update catatan (`notes`) ERF |
| `GET` | `/api/employee-request-forms/:id/candidate-usage` | akses ERF | Cek binding kandidat terhadap ERF |
| `GET` | `/api/employee-request-forms/:id/candidates` | akses ERF | Kandidat terkait ERF |
| `GET` | `/api/employee-request-forms/:id/pipeline-candidates` | akses ERF | Kandidat pipeline per ERF; setiap kandidat menyertakan `hasCompletedInterview` (semua interviewer pada form-nya sudah complete) dan `hasExistingContract` (sudah ada `employee_contract_form`) untuk filter eligibility NECF |
| `POST` | `/api/employee-request-forms/:id/close` | akses ERF | Close ERF |
| `POST` | `/api/employee-request-forms/vacancy-pipeline` | recruitment pipeline | Rekap pipeline vacancy |
| `POST` | `/api/employee-request-forms/passed-candidates` | recruitment pipeline | Kandidat lolos per ERF |
| `POST` | `/api/employee-request-forms/list-statuses` | recruitment pipeline | Status list ERF |
| `POST` | `/api/employee-request-forms/export-candidates` | recruitment pipeline | Export kandidat untuk vacancy |
| `GET` | `/api/recruitment/candidate-document-explorer` | `recruitment:document_explorer` | Tree dokumen kandidat |
| `POST` | `/api/recruitment/candidate-document-explorer/sign-url` | `recruitment:document_explorer` | Signed URL dokumen explorer; asset type di-resolve dari `bucket` (`candidate-photographs` -> `photograph`, bucket ERF (`getErfDocumentBucket()`) -> `erf_document`, selain itu -> `employee_document`) |
| `POST` | `/approval/start-chain` | owner ERF (manager) atau permission write ERF | Buat approval chain + step untuk ERF, termasuk resolve flow key dari master designation. Body `auto_approval: boolean` (opsional) — bila `true`, skip resolusi approver dan langsung insert chain `status = approved` + 1 step `approval_role_key = auto_approval` yang diatribusikan ke requester (`erf.created_by`), lalu `syncRecruitmentFlowStage()`. `approval_director_bu_id` pada ERF kini opsional; bila kosong, step `director_approval` fallback ke approver master yang dikonfigurasi untuk role tersebut |
| `POST` | `/approval/notify-step` | authenticated | Kirim ulang email notifikasi step approval (background task) |
| `POST` | `/approval/sync-stage` | authenticated | Sinkronkan `recruitment_flow_stage` ERF dari status chain terbaru |

### Candidate Form

| Method | Route | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/api/candidate-forms` | `candidate_form:read` / `employee_form:read` | List candidate form |
| `GET` | `/api/candidate-forms/:id` | sama | Detail candidate form |
| `POST` | `/api/candidate-forms/documents/sign-url` | read form | Signed URL dokumen employee |
| `POST` | `/api/candidate-forms/photograph/sign-url` | read form | Signed URL foto kandidat |
| `POST` | `/api/candidate-forms/:id/employee-documents` | `employee_form:update_contract_documents` | Submit dokumen kontrak employee |
| `POST` | `/api/candidate-forms/export-jobs` | export excel | Queue export Excel |
| `GET` | `/api/candidate-forms/export-jobs/:id` | export excel | Poll status job export |
| `GET` | `/api/candidate-forms/export-jobs/:id/download` | export excel | Download hasil job |

### Interview Evaluation

| Method | Route | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/api/interview-evaluations` | `interview_evaluation:read` | List evaluasi interview |
| `POST` | `/api/interview-evaluations` | `interview_evaluation:create` | Buat evaluasi interview |
| `PATCH` | `/api/interview-evaluations/:id` | `interview_evaluation:update` | Update evaluasi interview |
| `DELETE` | `/api/interview-evaluations/:id` | `interview_evaluation:update` | Hapus evaluasi interview |
| `GET` | `/api/interview-evaluations/assigned` | `interview_evaluation:interviewer_form` / `read` | List assignment interviewer |
| `GET` | `/api/interview-evaluations/assigned/:id` | sama | Detail assignment interviewer |
| `POST` | `/api/interview-evaluations/assigned/:id/documents/sign-url` | akses assignment interviewer | Signed URL dokumen kandidat untuk interviewer yang ditugaskan |
| `GET` | `/api/interview-evaluations/candidates` | `interview_evaluation:read` / create/update | Opsi kandidat untuk evaluasi |

### Employee Contract Form

| Method | Route | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/recruitment/employee-contract-forms` | `employee_contract_form:read` | List NECF |
| `POST` | `/recruitment/employee-contract-forms` | `employee_contract_form:create` | Buat NECF |
| `GET` | `/recruitment/employee-contract-forms/:id` | `employee_contract_form:read` | Detail NECF |
| `PUT` | `/recruitment/employee-contract-forms/:id` | `employee_contract_form:update` | Update NECF |
| `DELETE` | `/recruitment/employee-contract-forms/:id` | `employee_contract_form:delete` | Hapus NECF |
| `GET` | `/recruitment/employee-contract-forms/approval-users/:employeeRequestFormId` | `employee_contract_form:create` / `update` | Opsi approval user untuk ERF terkait |

### Export configuration

| Method | Route | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/api/export-templates` | `manage` / `generate` | List template aktif |
| `POST` | `/api/export-templates/upload` | `export_configuration:manage` | Upload template DOCX |
| `GET` | `/api/export-templates/:id/fields` | `export_configuration:manage` | List field template |
| `PATCH` | `/api/export-templates/:id/fields/:fieldId` | `export_configuration:manage` | Update mapping field |
| `DELETE` | `/api/export-templates/:id` | `export_configuration:manage` | Hapus template |
| `GET` | `/api/candidates` | `manage` / `generate` | List kandidat untuk export |
| `POST` | `/api/export-documents/prepare` | `manage` / `generate` | Siapkan field auto-fill |
| `POST` | `/api/export-documents/preview` | `export_configuration:generate` | Render preview HTML |
| `POST` | `/api/export-documents/generate` | `export_configuration:generate` | Generate dan download DOCX |

### Internal / system utility

| Method | Route | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | public | Health check, mengembalikan `{ ok: true }` |
| `POST` | `/csp-report` | public, rate limited | Terima CSP violation report dari browser |
| `POST` | `/send-email` | authenticated admin, rate limited | Kirim email internal (admin-only) |
| `POST` | `/internal/candidate-events` | shared token `HRD_PINTU_SERVICE_SYNC_TOKEN`, rate limited | Terima event sinkronisasi candidate dari `hrd_pintu`; `server/api/internal/candidate-events.post.ts` adalah re-export dari handler yang sama di `server/routes/internal/candidate-events.post.ts` |

## Contoh Fungsi Penting

### Function: `login()`

- Location: `src/infrastructure/supabase/repositories/AuthRepositoryImpl.ts`
- Description: login user dengan email atau username.
- Parameters:
  - `payload.identifier`
  - `payload.password`
- Response:
  - `Promise<User>`
- Used by:
  - `authStore.login()`
  - `useAuthViewModel()`
  - `LoginPage.vue`
- Error handling:
  - melempar error Supabase Auth
  - melempar error jika resolve email gagal

### Function: `createManagedUser()`

- Location: `server/services/userManagementService.js`
- Description: membuat user internal atau candidate account candidate service.
- Parameters:
  - context request
  - payload create user
- Response:
  - user terbuat / candidate summary hasil mapping
- Used by:
  - `POST /admin/users`
- Error handling:
  - validasi permission
  - validasi binding ERF untuk candidate
  - validasi role staff hanya boleh membuat candidate

### Function: `scanDocxPlaceholders()`

- Location: `server/services/export/docx-placeholder-scanner.ts`
- Description: membaca file DOCX, menormalisasi placeholder yang terpecah oleh XML run, lalu mengembalikan daftar placeholder unik.
- Parameters:
  - `templateBuffer: Buffer`
- Response:
  - `string[]`
- Used by:
  - `POST /api/export-templates/upload`
- Error handling:
  - `400` jika file DOCX invalid

### Function: `buildPreparedExportFields()`

- Location: `server/services/export/export-payload-builder.ts`
- Description: membangun daftar field export lengkap dengan status `auto_filled`, `manual_required`, atau `manual`.
- Parameters:
  - field mapping template
  - candidate record
  - source scope opsional
- Response:
  - `PreparedExportField[]`
- Used by:
  - `POST /api/export-documents/prepare`
  - preview mapping di halaman template

### Function: `generateDocxFromTemplate()`

- Location: `server/services/export/docx-generator.ts`
- Description: merender template DOCX menggunakan Docxtemplater dengan delimiter `{{` dan `}}`.
- Parameters:
  - `templateBuffer`
  - `payload`
- Response:
  - `Buffer`
- Used by:
  - `POST /api/export-documents/preview`
  - `POST /api/export-documents/generate`
- Error handling:
  - mengembalikan `400` dengan pesan detail Docxtemplater bila render gagal

## Mapping Service ke Fitur

| Fitur | Service/endpoint utama |
| --- | --- |
| Login | `AuthRepositoryImpl`, `/auth/resolve-login`, `/auth/profile` |
| Route protection | `authStore`, `access.global.ts`, `server/lib/context.js` |
| User management | `UserManagementRepositoryImpl`, `userManagementService.js`, `/admin/users*` |
| Role management | `RoleRepositoryImpl`, `roleService.js`, `/admin/roles*` |
| Candidate form | `CandidateFormRepositoryImpl`, `candidateFormReadService.js`, `/api/candidate-forms*` |
| Recruitment document explorer | `CandidateDocumentExplorerRepositoryImpl`, `candidateDocumentExplorerReadService.js`, `/api/recruitment/candidate-document-explorer*` |
| Interview evaluation | `InterviewEvaluationRepositoryImpl`, `interviewEvaluationService.js`, `/api/interview-evaluations*` |
| Employee contract form | `employeeContractFormApi.ts`, `employeeContractFormService.js`, `/recruitment/employee-contract-forms*`, `/recruitment/employee-contract-forms/approval-users/*` |
| Export DOCX | `export-template-service.ts`, `export-payload-builder.ts`, `docx-*`, `/api/export-*` |
| Approval chain & recruitment flow stage | `approvalService.js`, `recruitmentFlowStageService.js`, `/approval/start-chain`, `/approval/notify-step`, `/approval/sync-stage` |
| Candidate service sync (eksternal) | `candidateProjectionEventService.js`, `candidateProjectionService.js`, `/internal/candidate-events` |
