# 08. Supabase RLS Policy

## Sumber Analisis

Policy RLS ditemukan terutama pada:

- `sql/migration/20260406_034_reenable_active_dashboard_rls.sql`
- `sql/migration/20260406_030_add_interview_evaluation_module.sql`
- `sql/migration/20260423_047_add_interview_evaluation_interviewers.sql`
- `sql/migration/20260423_048_add_interview_evaluation_interviewer_results.sql`
- `sql/migration/20260504_054_add_employee_contract_forms.sql`
- `sql/migration/20260504_055_update_employee_contract_form_permissions.sql`
- policy storage di migration candidate documents dan ERF attachment

## Status RLS per Tabel

| Tabel | Status RLS | Catatan |
| --- | --- | --- |
| `roles` | Aktif | select authenticated, write butuh `role:manage` |
| `permissions` | Aktif | select authenticated, write butuh `role:manage` |
| `role_permissions` | Aktif | select authenticated, write butuh `role:manage` |
| `user_roles` | Aktif | select scoped, write butuh `role:manage` atau `user:update` |
| `profiles` | Aktif | select self/internal, update self atau `user:update` |
| `employee_request_form` | Aktif | scoped via function akses ERF |
| `approval_chains` | Aktif | scoped via function akses approval chain |
| `approval_steps` | Aktif | scoped via chain dan approver email |
| `approver_master` | Aktif | internal only + write dengan `approval:read` |
| `master_bu`, `master_department`, `master_designation`, `master_job_level`, `master_pt`, `master_custom_grup_*` | Aktif | select authenticated, write butuh `user:read` atau `role:manage` |
| `candidate_account_projection` | Aktif jika tabel ada | select untuk recruitment/document explorer/candidate form read |
| `candidate_application_projection` | Aktif jika tabel ada | select untuk recruitment/document explorer/candidate form read |
| `interview_evaluation_forms` | Aktif | read/create/update/delete via permission interview evaluation |
| `interview_evaluation_interviewers` | Aktif | select/read interviewer form, write sesuai permission |
| `interview_evaluation_interviewer_scores` | Aktif | select/write sesuai permission evaluator/interviewer |
| `employee_contract_form` | Aktif | read/create/update/delete via permission `employee_contract_form:*` |
| `export_templates` | Belum ditemukan | tabel dibuat di migration `20260520_068`, tetapi sampai migration terbaru (`20260619_080`) belum ada migration lanjutan yang menambahkan policy RLS untuk tabel ini |
| `export_template_fields` | Belum ditemukan | sama seperti di atas, belum ada migration RLS lanjutan |
| `generated_exports` | Belum ditemukan | sama seperti di atas, belum ada migration RLS lanjutan |

## Policy SELECT yang Ditemukan

| Tabel | Policy | Inti aturan |
| --- | --- | --- |
| `roles` | `roles_select_authenticated` | semua user authenticated boleh select |
| `permissions` | `permissions_select_authenticated` | semua user authenticated boleh select |
| `role_permissions` | `role_permissions_select_authenticated` | semua user authenticated boleh select |
| `user_roles` | `user_roles_select_scoped` | self, `role:manage`, atau `user:read` |
| `profiles` | `profiles_select_self_or_internal` | diri sendiri atau internal user |
| `employee_request_form` | `employee_request_form_select_scoped` | lewat `public.can_access_employee_request_form(created_by)` |
| `approval_chains` | `approval_chains_select_scoped` | lewat `public.can_access_approval_chain(id)` |
| `approval_steps` | `approval_steps_select_scoped` | akses mengikuti chain |
| `approver_master` | `approver_master_select_internal` | hanya internal user |
| `interview_evaluation_forms` | `interview_evaluation_forms_select` | butuh `interview_evaluation:read` |
| `interview_evaluation_interviewers` | `interview_evaluation_interviewers_select` | `read`, `update`, atau `interviewer_form` |
| `interview_evaluation_interviewer_scores` | `interview_evaluation_interviewer_scores_select` | `read`, `update`, atau `interviewer_form` |
| `employee_contract_form` | `employee_contract_form_select` | butuh `employee_contract_form:read` |

## Policy INSERT yang Ditemukan

| Tabel | Policy | Inti aturan |
| --- | --- | --- |
| `employee_request_form` | `employee_request_form_insert_scoped` | lewat `public.can_write_employee_request_form(created_by)` |
| `approval_chains` | `approval_chains_insert_scoped` | write mengikuti ERF owner |
| `approval_steps` | `approval_steps_insert_scoped` | write mengikuti ERF owner di chain |
| `interview_evaluation_forms` | `interview_evaluation_forms_insert` | butuh `interview_evaluation:create` |
| `interview_evaluation_interviewers` | `interview_evaluation_interviewers_insert` | butuh `interview_evaluation:create` |
| `interview_evaluation_interviewer_scores` | `interview_evaluation_interviewer_scores_insert` | `create`, `update`, atau `interviewer_form` |
| `employee_contract_form` | `employee_contract_form_insert` | butuh `employee_contract_form:create` |

## Policy UPDATE yang Ditemukan

| Tabel | Policy | Inti aturan |
| --- | --- | --- |
| `profiles` | `profiles_update_self_or_user_update` | diri sendiri atau `user:update` |
| `employee_request_form` | `employee_request_form_update_scoped` | write scoped via function |
| `approval_chains` | `approval_chains_update_scoped` | approver assigned dengan `approval:action` atau owner ERF |
| `approval_steps` | `approval_steps_update_scoped` | approver email current user + `approval:action` |
| `interview_evaluation_forms` | `interview_evaluation_forms_update` | `interview_evaluation:update` |
| `interview_evaluation_interviewers` | `interview_evaluation_interviewers_update` | `interview_evaluation:update` |
| `interview_evaluation_interviewer_scores` | `interview_evaluation_interviewer_scores_update` | `update` atau `interviewer_form` |
| `employee_contract_form` | `employee_contract_form_update` | `employee_contract_form:update` |

## Policy DELETE yang Ditemukan

| Tabel | Policy | Inti aturan |
| --- | --- | --- |
| `employee_request_form` | `employee_request_form_delete_scoped` | write scoped via function |
| `approval_chains` | `approval_chains_delete_scoped` | owner ERF |
| `approval_steps` | `approval_steps_delete_scoped` | owner ERF |
| `interview_evaluation_forms` | `interview_evaluation_forms_delete` | `interview_evaluation:delete` |
| `interview_evaluation_interviewers` | `interview_evaluation_interviewers_delete` | `interview_evaluation:delete` |
| `interview_evaluation_interviewer_scores` | `interview_evaluation_interviewer_scores_delete` | `delete`, `update`, atau `interviewer_form` |
| `employee_contract_form` | `employee_contract_form_delete` | `employee_contract_form:delete` |

## Storage Policy yang Ditemukan

| Objek | Status | Catatan |
| --- | --- | --- |
| Bucket candidate documents lama | Ditemukan | policy storage di migration `20260330_014_add_candidate_documents_rls_and_storage_policies.sql` |
| Bucket ERF | Ditemukan | `erf_storage_select/insert/update/delete` di migration `20260331_016_add_erf_attachments_and_storage_policies.sql` |
| Bucket export templates | Belum ditemukan | bucket dibuat pada `20260520_068_add_export_configuration_tables.sql`, tetapi policy storage tidak ditemukan |
| Bucket `candidate-photographs` | Belum ditemukan | policy repository tidak ditemukan |

## Risiko Keamanan Jika Policy Belum Ditemukan

- `export_templates`, `export_template_fields`, dan `generated_exports` tidak menunjukkan policy RLS di repository. Jika tabel ini diakses langsung dari client di masa depan, ada risiko oversharing data.
- Bucket `export-templates` dibuat private, tetapi tanpa policy storage yang terdokumentasi di repo, perilaku akses final perlu dikonfirmasi di Supabase live.
- Upload foto kandidat dilakukan langsung dari client; tanpa policy storage yang tepat di Supabase, operasi bisa gagal atau justru terlalu longgar.

## Catatan Penggunaan Anon Key dan Service Role Key

- `NUXT_PUBLIC_SUPABASE_ANON_KEY`
  - dipakai di frontend untuk auth session, query scoped tertentu, dan upload storage client-side.
- `SUPABASE_SERVICE_ROLE_KEY`
  - dipakai di server melalui `server/services/supabaseAdmin.js`
  - dipakai untuk:
    - resolve login identifier
    - load profile backend
    - user management
    - role management
    - signed URL storage
    - export template metadata
    - candidate service bridge tertentu
