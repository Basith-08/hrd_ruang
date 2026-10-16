# 04. Folder Structure

## Struktur Folder Aktual Project

```text
hrd_ruang/
├── docs/
├── lang/
├── public/
├── scripts/
├── server/
│   ├── api/
│   ├── config/
│   ├── constants/
│   ├── lib/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── utils/
├── sql/
│   └── migration/
├── supabase/
│   └── public-schema.sql
├── src/
│   ├── application/
│   ├── composables/
│   ├── config/
│   ├── domain/
│   ├── features/
│   ├── infrastructure/
│   ├── layouts/
│   ├── middleware/
│   ├── pages/
│   ├── plugins/
│   ├── presentation/
│   ├── stores/
│   ├── types/
│   └── viewmodels/
├── test-utils/
├── types/
├── .env.example
├── nuxt.config.ts
├── package.json
├── vercel.json
└── vitest.config.ts
```

## Penjelasan Setiap Folder

| Folder | Fungsi |
| --- | --- |
| `src/application` | Use case application layer, mis. `loginUser`, `createRole`, `getEmployeeRequestForms`. |
| `src/composables` | Composable global seperti locale, repositories, dan navigasi layout. |
| `src/config` | Konfigurasi statis frontend, mis. `cache.config.ts`. |
| `src/domain` | Entity, contract repository, request DTO, util domain. |
| `src/features` | Implementasi fitur dan page container per modul bisnis. |
| `src/infrastructure` | Adapter teknis: Supabase client, repository implementation, runtime config, security helper. |
| `src/layouts` | Layout default dan layout candidate. |
| `src/middleware` | Route middleware global untuk proteksi akses. |
| `src/pages` | Route Nuxt aktual, termasuk alias route legacy. |
| `src/plugins` | Inisialisasi repository dan auth store. |
| `src/presentation` | Komponen UI reusable, feedback, form, layout, util presentasi. |
| `src/stores` | Store Pinia, saat ini dominan `authStore`. |
| `src/viewmodels` | ViewModel untuk menjembatani feature dengan use case/repository. |
| `server/api` | Endpoint `/api/*` yang dipanggil dari frontend. |
| `server/routes` | Endpoint Nitro non-`/api`, mis. `/auth/profile`, `/admin/users`. |
| `server/services` | Service bisnis server: auth, user management, export DOCX, email, candidate integration. |
| `server/lib` | Helper internal server: context auth, background task, error, rate limit, export job queue. |
| `server/middleware` | Middleware header keamanan untuk Nitro. |
| `sql/migration` | Migration SQL, schema context, RLS policy, dan perubahan struktur database. |
| `supabase` | Menyimpan `public-schema.sql`, dump schema `public` Supabase yang dipakai sebagai acuan dokumentasi database (lihat `docs/05`). |
| `lang` | Kamus teks aplikasi per modul. |
| `test-utils` | Stub untuk Vitest (`h3`, `#imports`). |
| `types` | Shared type lintas folder, mis. `export-template.ts`. |

## Penjelasan File Penting

| File | Fungsi |
| --- | --- |
| `package.json` | Script, dependency, engine Node, package manager. |
| `nuxt.config.ts` | Konfigurasi Nuxt: SPA mode, runtime config, komponen global, alias. |
| `src/app.vue` | Root app, provider toast dan confirm. |
| `src/middleware/access.global.ts` | Gate utama auth, role, permission, redirect candidate. |
| `src/stores/authStore.ts` | Session init, login/logout, profile load, expiry candidate. |
| `src/infrastructure/http/backendApi.ts` | Wrapper fetch internal dengan bearer token Supabase. |
| `server/lib/context.js` | Verifikasi token + load role/permission request. |
| `server/services/supabaseAdmin.js` | Supabase admin client dengan service role. |
| `server/services/export/*` | Core modul export DOCX. |
| `server/config/env.js` | Daftar env server yang dipakai runtime. |
| `vercel.json` | Konfigurasi deploy Vercel. |
| `vitest.config.ts` | Konfigurasi test runner. |

## Mapping Folder dengan Fitur

| Fitur | Folder utama |
| --- | --- |
| Auth | `src/features/auth`, `src/stores`, `src/middleware`, `server/routes/auth` |
| User & role management | `src/features/admin`, `src/features/role`, `server/routes/admin`, `server/services/userManagementService.js`, `server/services/roleService.js` |
| Employee Request Form | `src/features/employeeRequestForms`, `src/viewmodels/useEmployeeRequestFormViewModel.ts`, `server/api/employee-request-forms`, `server/routes/approval` |
| Recruitment | `src/features/recruitment`, `server/api/recruitment`, `server/services/recruitmentFlowStageService.js` |
| Candidate/employee form | `src/features/candidateForms`, `server/api/candidate-forms`, `server/services/candidateFormReadService.js` |
| Interview evaluation | `src/features/interviewEvaluations`, `server/api/interview-evaluations`, `server/services/interviewEvaluationService.js` |
| Employee contract form | `src/features/recruitment/*EmployeeContract*`, `server/routes/recruitment/employee-contract-forms*`, `server/services/employeeContractFormService.js` |
| Export configuration | `src/features/admin/ExportConfiguration*`, `server/api/export-templates`, `server/api/export-documents`, `server/services/export/*` |