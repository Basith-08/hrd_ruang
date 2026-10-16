# 11. UI Pages Documentation

## Catatan Umum

- Hampir semua halaman memakai layout `default`.
- Halaman candidate form memakai layout `candidate`.
- Beberapa route lama hanya melakukan redirect ke route baru dan memakai `layout: false`.

## Halaman Utama

| Route | Page component | Permission / role | Fungsi | Data utama | Aksi utama | State |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | layout false | authenticated | redirect ke default route berdasarkan role + `pintuPortalUrl` | auth store + runtime config | redirect internal/eksternal | tanpa UI |
| `/login` | `LoginPage` | public | Form login | form identifier/password | login | error auth |
| `/dashboard` | `DashboardPage` | `dashboard:read` | summary dashboard | `/api/dashboard/summary` | refresh | loading/error |
| `/profile` | `ProfilePage` | login | profil user saat ini | profile dari auth store | logout via header | loading ringan |
| `/employee-request-forms` | `EmployeeRequestFormList` | `employee_request_form:read` / `recruitment:approved_erf_read` | list ERF | ERF list | filter, buka detail, create | empty/loading/error |
| `/employee-request-forms/create` | `EmployeeRequestFormPage` | `employee_request_form:create` | buat ERF | master data + form state | submit | validation/loading/error |
| `/employee-request-forms/:id` | `EmployeeRequestFormPage` | `employee_request_form:read` / `recruitment:approved_erf_read` | detail ERF | detail ERF + approval | preview, open attachment | loading/error |
| `/employee-request-forms/:id/edit` | `EmployeeRequestFormPage` | `employee_request_form:update` | edit ERF | detail ERF | update | validation/loading/error |
| `/approval-tracking` | `ApprovalTrackingPage` | `approval:read` | tracking approval chain | approval chain + step | approve/reject, filter | empty/loading/error |
| `/approver-master` | `ApproverMasterPage` | `approval:read` + admin only | list approver master | approver master | create/edit/delete | empty/loading/error |
| `/approver-master/configure` | `ApproverMasterFormPage` | `approval:read` + admin only | create approver master | profile/master config | submit | validation/loading/error |
| `/approver-master/:id/edit` | `ApproverMasterFormPage` | `approval:read` + admin only | edit approver master | existing approver | update | validation/loading/error |
| `/recruitment` | `RecruitmentDashboardPage` | `recruitment:read` | dashboard recruitment | recruitment summary + detail export | filter, export excel detail | empty/loading/error |
| `/recruitment/vacancy-pipeline` | `VacancyPipelinePage` | `recruitment:vacancy_pipeline` | pipeline vacancy aktif | ERF + passed candidate + interview | detail modal, export | empty/loading/error |
| `/recruitment/closed-vacancy` | `VacancyPipelinePage` | `recruitment:closed_vacancy` | vacancy closed | ERF tertutup + export candidate | detail modal, export | empty/loading/error |
| `/recruitment/pic-recruitment` | `PicRecruitmentPage` | `pic_recruitment:read`, `recruitment:pic_recruitment_read`, `employee_request_form:read`, `recruitment:approved_erf_read` | assignment recruiter | ERF approved + recruiter list | assign recruiter (butuh `pic_recruitment:update`) | empty/loading/error |
| `/recruitment/candidate-database` | `RecruitmentCandidateDatabasePage` | `recruitment:candidate_database` | kandidat/employee database | candidate list | filter, open detail | empty/loading/error |
| `/recruitment/document-explorer` | `RecruitmentDocumentExplorerPage` | `recruitment:document_explorer` | eksplorasi dokumen kandidat | candidate document tree | open file signed URL, refresh | empty/loading/error |
| `/recruitment/interview-evaluasi` | `InterviewEvaluasiPage` | `recruitment:interview_evaluasi` | halaman rekap interview evaluasi | data interview | filter, open/manage | empty/loading/error |
| `/recruitment/new-employee-contract-forms` | `EmployeeContractFormListPage` | `employee_contract_form:read` | list NECF | contract form list | create/edit/delete | empty/loading/error |
| `/recruitment/new-employee-contract-forms/create` | `EmployeeContractFormPage` | `employee_contract_form:create` | buat NECF | form + candidate options | submit | validation/loading/error |
| `/recruitment/new-employee-contract-forms/:id/edit` | `EmployeeContractFormPage` | `employee_contract_form:update` | edit NECF | detail contract form | update | validation/loading/error |
| `/candidate-forms` | `CandidateFormList` | `candidate_form:read`, `employee_form:read`, `candidate_employee:read`, `user:read` (+ `allowAdminAccessWithoutPermissions`) | list candidate/employee form untuk candidate workspace | candidate form list | filter, export excel, detail | empty/loading/error |
| `/candidate-forms/create` | layout candidate | `candidate_form:read`, `employee_form:read` (+ `allowAdminAccessWithoutPermissions`) | route transisi; redirect ke portal kandidat atau kembali ke list | auth store + runtime config | redirect | tanpa UI |
| `/candidate-forms/:id` | `CandidateFormPage` | `candidate_form:read`, `employee_form:read` (+ `allowAdminAccessWithoutPermissions`) | detail candidate/employee form bila tidak redirect ke portal eksternal | detail form + dokumen | open file, export excel, submit contract docs | loading/error |
| `/candidate-forms/:id/edit` | layout candidate | `candidate_form:read`, `employee_form:read` (+ `allowAdminAccessWithoutPermissions`) | route transisi; redirect ke portal kandidat atau ke detail lokal | route param + runtime config | redirect | tanpa UI |
| `/interview-evaluations/list` | `InterviewEvaluationListPage` | `interview_evaluation:read`, `interview_evaluation:interviewer_form` (+ `allowAdminAccessWithoutPermissions`) | list evaluasi interview | evaluation list | filter, open manage | empty/loading/error |
| `/interview-evaluations/manage` | `InterviewEvaluationPage` | `interview_evaluation:read`, `create`, `update` | create/edit evaluasi | detail candidate + score | save/delete | validation/loading/error |
| `/interview-evaluations` | `InterviewerFormPage` | `interview_evaluation:interviewer_form`, `interview_evaluation:read` (+ `allowAdminAccessWithoutPermissions`) | list assignment interviewer | assigned evaluations | open assignment | empty/loading/error |
| `/interview-evaluations/evaluate/:id` | `InterviewerEvaluationPage` | `interview_evaluation:interviewer_form`, `interview_evaluation:read` | form isi penilaian interviewer | assigned evaluation detail | save penilaian, open document | validation/loading/error |
| `/user-management` | `UserManagementPage` | `user:read` | list user internal | `/admin/users` | create, edit, role change, deactivate, delete | empty/loading/error |
| `/candidate-employees` | `UserManagementPage` | `candidate_employee:read` / `user:read` | list candidate & employee | `/admin/users?scope=candidateemployee` | edit, switch to employee | empty/loading/error |
| `/user-management/create` | `UserManagementFormPage` | `user:create` | create user / candidate | role list, ERF binding, master data | submit | validation/loading/error |
| `/user-management/:id/edit` | `UserManagementFormPage` | `user:update` | edit user | detail user, role list | update | validation/loading/error |
| `/user-history` | `UserHistoryPage` | `user_history:read` | histori user inactive/revoked | `/admin/user-history` | switch to employee jika valid | empty/loading/error |
| `/role-management` | `RoleManagementPage` | `role:manage` | list role | role list + permission summary | create/edit/delete | empty/loading/error |
| `/role-management/create` | `RoleManagementFormPage` | `role:manage` | create role | permission catalog | save | validation/loading/error |
| `/role-management/:id/edit` | `RoleManagementFormPage` | `role:manage` | edit role | role detail + permission | update | validation/loading/error |
| `/master-data-management` | `MasterDataManagementPage` | `user:read` + admin only | manage master data ERF | master PT/BU/department/job level | create/edit/delete | empty/loading/error |
| `/custom-group-management` | `CustomGroupManagementPage` | `user:read` + admin only | manage custom group | custom group list | create/edit/delete | empty/loading/error |
| `/configuration-export` | `ExportConfigurationPage` | `export_configuration:*` | entry page export configuration | permission state | navigate templates/generate | empty state bila tanpa akses |
| `/configuration-export/templates` | `ExportConfigurationTemplatesPage` | `export_configuration:manage` | upload template, mapping field | template list, field mapping, candidate preview | upload, save mapping, preview mapping, delete | empty/loading/error |
| `/configuration-export/generate` | `ExportConfigurationGeneratePage` | `export_configuration:generate` | prepare, preview, dan generate DOCX | template list, candidate list, prepared fields | prepare, preview, download | empty/loading/error |

## Route Alias / Redirect Legacy

| Route lama | Perilaku |
| --- | --- |
| `/applications` | redirect ke `/candidate-forms` |
| `/applications/create` | redirect ke `/candidate-forms/create` |
| `/applications/:id` | redirect ke detail candidate form yang ekuivalen |
| `/job-requests` | redirect ke `/employee-request-forms` |
| `/job-requests/create` | redirect ke `/employee-request-forms/create` |
| `/candidate-management` | redirect ke `/candidate-forms` |
| `/candidates/*` | route legacy terkait candidate form |
| `/export-configuration` | alias ke halaman export configuration yang sama |

## Empty, Loading, Error State

Pola yang konsisten ditemukan:

- Empty state:
  - tabel/list menampilkan teks `emptyMessage` atau card kosong.
- Loading state:
  - tombol loading, skeleton, `AppLoadingOverlay`, atau `AppLoadingState`.
- Error state:
  - `AppAlert` atau toast error dari `useAppToast()`.

## Catatan

- Route `/candidate-forms` akan redirect ke `/candidate-employees` untuk staff yang punya permission `candidate_employee:read` atau `user:read`.
- Route candidate form dan route legacy kandidat memiliki redirect dinamis ke candidate portal jika `NUXT_PUBLIC_HRD_PINTU_URL` terisi dan role user memenuhi syarat redirect kandidat.
- `EmployeeRequestFormPage` (create/edit) punya tombol **Download Template** (buka Word ERF resmi dari storage) dan **Upload ERF** (upload PDF/DOCX, auto-fill field via parser + fuzzy match master data, field yang tidak match tetap terisi as-typed dengan warning, bukan hard block) serta toggle **Manual/Auto Approval** pada section Approval. Dokumen yang diupload dipreview di bawah tombol upload dan tetap tampil di halaman detail (read-only, tanpa tombol Remove).
- Route alias dipertahankan untuk backward compatibility URL.
