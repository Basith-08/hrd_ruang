# 12. Component Documentation

## Prinsip Dokumentasi Komponen

Dokumen ini fokus pada komponen penting yang menjadi kontrak UI lintas fitur. Komponen presentasional kecil yang sangat generik tidak dibahas satu per satu secara mendalam.

## Komponen Shared / Presentation

### `SearchableSelect`

- Location: `src/presentation/components/forms/SearchableSelect.vue`
- Fungsi: dropdown searchable untuk list option panjang.
- Props:
  - `modelValue`
  - `options`
  - `placeholder`
  - `disabled`
  - `showEmptyOption`
  - `emptyLabel`
  - `loading`
  - `loadingLabel`
  - `size`
- Emits:
  - `update:modelValue`
- State internal:
  - pencarian, highlight option, loading label
- Dependency:
  - dipakai di user management, candidate form list, ERF filter, export configuration, recruitment filters
- Contoh penggunaan:

```vue
<SearchableSelect
  v-model="selectedTemplateId"
  :options="templateOptions"
  :placeholder="text('exportConfiguration.generate.templatePlaceholder')"
/>
```

### `AppActionButton`

- Location: `src/presentation/components/buttons/AppActionButton.vue`
- Fungsi: tombol reusable dengan variant dan state loading.
- Props:
  - `label`
  - `loadingLabel`
  - `loading`
  - `disabled`
  - `variant`
  - `type`
- Emits:
  - `click`
- Mapping:
  - dipakai hampir di semua halaman form, table action, dan modal.

### `AppTable`

- Location: `src/presentation/components/tables/AppTable.vue`
- Fungsi: wrapper tabel dengan slot cell dan pagination slot.
- Props:
  - `columns`
  - `items`
  - `loading`
  - `loadingMessage`
  - `emptyMessage`
- Slots:
  - slot dinamis `cell-*`
  - `pagination`
- Mapping:
  - dipakai di user management, role management, master data, custom group.

### `RowActionsMenu`

- Location: `src/presentation/components/menus/RowActionsMenu.vue`
- Fungsi: dropdown action per row.
- Props:
  - `actions: RowAction[]`
- Emits:
  - tidak ada emit publik; action dijalankan dari callback props
- Mapping:
  - list candidate form, user management, role management.

### `AppSidebar`

- Location: `src/presentation/components/layout/AppSidebar.vue`
- Fungsi: render navigasi berdasarkan `useLayoutNavigation()`.
- Props:
  - `variant: "mobile" | "desktop"`
- Emits:
  - `nav-click`
- Dependency:
  - `useLayoutNavigation`
  - `useAuthViewModel`

## Komponen Auth

### `LoginPage`

- Location: `src/features/auth/LoginPage.vue`
- Fungsi: halaman login utama.
- Dependency:
  - `vee-validate`
  - `zod`
  - `useAuthViewModel`
  - `useLocale`
- Action utama:
  - submit login
  - toggle show password

## Komponen Candidate Form

### `CandidateFormPage`

- Location: `src/features/candidateForms/CandidateFormPage.vue`
- Fungsi: container halaman detail/edit candidate/employee form.
- Dependency utama:
  - `useCandidateFormPage()`
  - section candidate dan employee
- Mapping halaman:
  - `/candidate-forms/:id`
  - `/candidate-forms/:id/edit`

### `CandidateFormDocumentSection`

- Location: `src/features/candidateForms/components/CandidateFormDocumentSection.vue`
- Fungsi: menampilkan daftar dokumen kandidat/employee dan action buka file.
- Props/emit eksplisit:
  - detail lengkap perlu dibaca langsung dari file bila ingin level per-field
- Mapping:
  - dipakai pada candidate section, employee section, interviewer evaluation

### `CandidateFormSimpleSection`

- Location: `src/features/candidateForms/components/CandidateFormSimpleSection.vue`
- Fungsi: render field sederhana read/write.
- Props:
  - `title`
  - `description`
  - `form`
  - `fields`
  - `isReadOnly`

### `CandidateFormListTable`

- Location: `src/features/candidateForms/components/CandidateFormListTable.vue`
- Fungsi: tabel list candidate/employee form (nama, role, status, action).
- Mapping:
  - `/candidate-forms`

### `CandidateFormCandidateSections` / `CandidateFormEmployeeSections`

- Location: `src/features/candidateForms/components/CandidateFormCandidateSections.vue`, `src/features/candidateForms/components/CandidateFormEmployeeSections.vue`
- Fungsi: container yang merender kumpulan section read-only untuk data kandidat (personal/aplikasi) dan data employee (payroll/statutory/benefit).
- Mapping:
  - dipakai di `CandidateFormPage`

### `CandidateFormObjectFields` / `CandidateFormRepeatableFieldsCard`

- Location: `src/features/candidateForms/components/CandidateFormObjectFields.vue`, `src/features/candidateForms/components/CandidateFormRepeatableFieldsCard.vue`
- Fungsi: render field bertipe object (mis. payroll/benefit) dan card untuk grup field yang repeatable.
- Mapping:
  - dipakai di section candidate/employee pada `CandidateFormPage`

## Komponen Employee Request Form

### `EmployeeRequestFormFields`

- Location: `src/features/employeeRequestForms/components/EmployeeRequestFormFields.vue`
- Fungsi: field form ERF. Field bertipe `select` bisa menampilkan `helperText`, `warningText` (mismatch hasil autofill dokumen ERF), dan `errorText` di bawah input.
- Mapping:
  - create/edit ERF

### `EmployeeRequestFormAttachmentField`

- Location: `src/features/employeeRequestForms/components/EmployeeRequestFormAttachmentField.vue`
- Fungsi: upload dan manage attachment ERF (`organizational_structure`, `job_description`, `document_erf`).
- Emits:
  - `change`
  - `removePending`
  - `removeStored`

### Util `employeeRequestFormDocumentParser`

- Location: `src/presentation/utils/employeeRequestFormDocumentParser.ts`
- Fungsi: parsing dokumen ERF (Word/PDF) hasil upload menjadi field form.
- Export utama:
  - `extractErfDocumentFields(file)` — deteksi tipe file (DOCX via `mammoth`, PDF via `pdfjs-dist`), ekstrak raw text, lalu panggil `extractErfFieldsFromText()`.
  - `extractErfFieldsFromText(rawText)` — cocokkan label template ERF (`requested date`, `required date`, `cost center pt`, `bu category`, `bu department`, `designation`, `main position`, `employment status`, `position status`, `probation/contract period`, `direct head`, `site`, `working location`) di awal baris (mendukung label+value satu baris ala PDF maupun label sendiri per baris ala DOCX), ambil value sampai label/boundary (`catatan`, `diajukan oleh`, `disetujui oleh`) berikutnya.
  - `parseErfDateValue(value)` — normalisasi `DD/MM/YYYY` atau `YYYY-MM-DD` ke ISO date key.
  - `parseErfProbationMonths(value)` — ekstrak angka bulan probation dari teks bebas.
  - `ErfDocumentParseError` — dilempar untuk tipe file yang tidak didukung (selain PDF/DOCX).
- Mapping: `EmployeeRequestFormPage.vue` (create/edit).

### Util `fuzzyMatch`

- Location: `src/presentation/utils/fuzzyMatch.ts`
- Fungsi: resolve free text hasil parsing dokumen terhadap opsi master data.
- Export utama:
  - `levenshteinDistance(left, right)` / `stringSimilarity(left, right)` — jarak edit dan skor similarity `0..1`.
  - `findOptionByLabel(options, rawValue)` — coba exact match, lalu substring containment, lalu fallback ke similarity Levenshtein dengan threshold `fuzzyMatchSimilarityThreshold = 0.82`; return `null` bila tidak ada yang cukup mirip.
- Mapping: `EmployeeRequestFormPage.vue` (autofill `pt_pembebanan`, `bu_id`, `department`, `master_designation_id`, `employment_status`, `position_status`, `direct_manager` dari dokumen ERF yang diupload).

### `EmployeeRequestFormAssignRecruiterModal`

- Location: `src/features/employeeRequestForms/components/EmployeeRequestFormAssignRecruiterModal.vue`
- Fungsi: modal assign recruiter ke ERF approved.
- Emits:
  - `update:modelValue`
  - `cancel`
  - `submit`

### `EmployeeRequestFormTable`

- Location: `src/features/employeeRequestForms/components/EmployeeRequestFormTable.vue`
- Fungsi: tabel list ERF dengan kolom posisi, department, business unit, status, dan sort.
- Mapping:
  - `/employee-request-forms`

### `EmployeeRequestFormCloseModal`

- Location: `src/features/employeeRequestForms/components/EmployeeRequestFormCloseModal.vue`
- Fungsi: modal untuk menutup/membatalkan ERF dengan pilihan kategori penutupan (`canceled`/`fulfilled`).
- Mapping:
  - `/employee-request-forms`

## Komponen User Management

### `UserManagementPage`

- Location: `src/features/admin/UserManagementPage.vue`
- Fungsi: container list user/candidate/employee.
- Props:
  - `scope?: 'users' | 'candidate' | 'employee' | 'candidateEmployee' | 'all'`
- Aksi utama:
  - create
  - edit
  - change role
  - activate/deactivate
  - delete/revoke
  - switch to employee

### `UserManagementFormFields`

- Location: `src/features/admin/components/UserManagementFormFields.vue`
- Fungsi: field form create/edit user.
- Props penting:
  - `form`
  - `isEditMode`
  - `isCandidateAccount`
  - `roleSelectOptions`
  - `jobBindingSelectOptions`
  - `departmentSelectOptions`
  - `designationSelectOptions`
- Emits:
  - `update:accountType`
  - `submit`
  - `cancel`

### `UserHistoryTable`

- Location: `src/features/admin/components/UserHistoryTable.vue`
- Fungsi: tabel histori user inactive/revoked.
- Props penting:
  - `items`
  - `loading`
  - `page`
  - `pageSize`
  - `totalItems`
  - `buildActions`
- Emits:
  - `update:page`

## Komponen Role Management

### `RoleManagementTable`

- Location: `src/features/role/components/RoleManagementTable.vue`
- Fungsi: list role dan action edit/delete.
- Props:
  - `roles`
  - `loading`
  - `saving`
  - `page`
  - `pageSize`
  - `totalItems`
- Emits:
  - `update:page`
  - `edit`
  - `delete`

### `RolePermissionGroupCard`

- Location: `src/features/role/components/RolePermissionGroupCard.vue`
- Fungsi: checklist permission per group.
- Props:
  - `title`
  - `description`
  - `permissions`
  - `modelValue`
- Emits:
  - `update:modelValue`

## Komponen Recruitment

### `RecruitmentDashboardDetailSection`

- Location: `src/features/recruitment/components/RecruitmentDashboardDetailSection.vue`
- Fungsi: section tabel detail dashboard recruitment dan export Excel.
- Props:
  - `rows`
  - `columns`
  - `statusMode`
  - `searchQuery`
  - `periodStart`
  - `periodEnd`
  - `page`
  - `pageSize`
  - `totalItems`
- Emits:
  - `exportExcel`
  - `update:searchQuery`
  - `update:periodStart`
  - `update:periodEnd`
  - `sort`
  - `update:page`

### `RecruitmentDocumentExplorerFinderSection`

- Location: `src/features/recruitment/components/RecruitmentDocumentExplorerFinderSection.vue`
- Fungsi: viewer tree dokumen kandidat berbasis Finder UI.
- Props:
  - `tree`
  - `finderResetKey`
  - `loading`
  - `openingFileIds`
  - `statsLabel`
  - `isFileNode`
  - `openFile`
- Mapping:
  - dipakai di `RecruitmentDocumentExplorerPage`

### `RecruitmentDashboardHero` / `RecruitmentDashboardStatusSummary` / `RecruitmentDashboardSummaryTable`

- Location: `src/features/recruitment/components/RecruitmentDashboardHero.vue`, `RecruitmentDashboardStatusSummary.vue`, `RecruitmentDashboardSummaryTable.vue`
- Fungsi: hero header (judul + last updated + filter button), card ringkasan jumlah, dan tabel ringkasan dashboard recruitment.
- Mapping:
  - `/recruitment` (`RecruitmentDashboardPage`)

### `PicRecruitmentTable` / `PicRecruitmentAssignModal`

- Location: `src/features/recruitment/components/PicRecruitmentTable.vue`, `src/features/recruitment/components/PicRecruitmentAssignModal.vue`
- Fungsi: tabel daftar ERF approved yang siap di-assign recruiter, dan modal untuk memilih/assign recruiter.
- Mapping:
  - `/recruitment/pic-recruitment` (`PicRecruitmentPage`)

### `VacancyPipelineTable` / `VacancyPipelineDetailModal`

- Location: `src/features/recruitment/components/VacancyPipelineTable.vue`, `src/features/recruitment/components/VacancyPipelineDetailModal.vue`
- Fungsi: tabel vacancy pipeline (posisi, business unit, department, kandidat) dan modal detail ERF lengkap dengan approval/attachment/interview evaluation.
- Mapping:
  - `/recruitment/vacancy-pipeline`, `/recruitment/closed-vacancy` (`VacancyPipelinePage`)

### `InterviewEvaluasiTable`

- Location: `src/features/recruitment/components/InterviewEvaluasiTable.vue`
- Fungsi: tabel rekap interview evaluasi (nama kandidat, posisi dilamar, interviewer) untuk halaman recruitment.
- Mapping:
  - `/recruitment/interview-evaluasi` (`InterviewEvaluasiPage`)

## Komponen Export Configuration

### `ExportConfigurationTemplatesPage`

- Location: `src/features/admin/ExportConfigurationTemplatesPage.vue`
- Fungsi: upload template, list template, manage field mapping, preview field mapping.
- Dependency:
  - `callBackendApi`
  - `AppActionButton`
  - `AppSectionHeader`
  - `AppLoadingOverlay`

### `ExportConfigurationGeneratePage`

- Location: `src/features/admin/ExportConfigurationGeneratePage.vue`
- Fungsi: pilih template + kandidat, prepare field, preview dokumen, download DOCX.
- State internal:
  - template list
  - candidate list
  - prepared fields
  - preview modal
- Mapping:
  - `/configuration-export/generate`

## Komponen Interview Evaluation

### `InterviewEvaluationScoreGrid`

- Location: `src/features/interviewEvaluations/components/InterviewEvaluationScoreGrid.vue`
- Fungsi: grid score 10 item penilaian interview.
- Emits:
  - `updateScore`
  - `updateScoreInfo`

### `InterviewEvaluationTable`

- Location: `src/features/interviewEvaluations/components/InterviewEvaluationTable.vue`
- Fungsi: tabel list evaluasi interview.
- Emits:
  - `update:page`

## Catatan

- Banyak feature page memakai pattern container + viewmodel/composable, sehingga logika utama berada di file `*.state.ts`, `use*.ts`, atau viewmodel, bukan di child component.
- Slot khusus tidak banyak dipakai selain pada komponen layout/table shared.
