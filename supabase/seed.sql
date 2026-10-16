
begin;

insert into public.permissions (name, description)
values
  ('dashboard:read', 'View the main dashboard'),
  ('employee_request_form:create', 'Create employee request forms'),
  ('employee_request_form:read', 'View employee request forms'),
  ('employee_request_form:requester_read', 'View the requester field on employee request forms'),
  ('employee_request_form:requester_update', 'Update the requester field on employee request forms'),
  ('employee_request_form:update', 'Update employee request forms'),
  ('employee_request_form:assign_recruiter', 'Assign recruiters to approved employee request forms'),
  ('employee_request_form:delete', 'Delete employee request forms'),
  ('employee_request_form:close', 'Close ERF records from the Employee Request Form list'),
  ('employee_request_form:export_pdf', 'Export ERF records to PDF from the Employee Request Form list'),
  ('approval:action', 'Approve or reject assigned approval requests'),
  ('approval:read', 'View approval tracking and approver configuration'),
  ('approval:tracking_all', 'View all approval tracking data across users'),
  ('recruitment:read', 'View recruitment dashboard'),
  ('recruitment:approved_erf_read', 'View approved employee request forms'),
  ('pic_recruitment:read', 'View PIC recruitment page and approved ERF assignment queue'),
  ('pic_recruitment:update', 'Assign or update recruiters from the PIC recruitment page'),
  ('recruitment:vacancy_pipeline', 'View vacancy pipeline page in the recruitment module'),
  ('recruitment:vacancy_pipeline_detail', 'Open vacancy pipeline detail from the recruitment module'),
  ('recruitment:closed_vacancy', 'View closed vacancy page in the recruitment module'),
  ('recruitment:closed_vacancy_detail', 'Open closed vacancy detail from the recruitment module'),
  ('recruitment:candidate_database', 'View candidate database page in the recruitment module'),
  ('recruitment:interview_evaluasi', 'View interview evaluasi page in the recruitment module'),
  ('recruitment:document_explorer', 'View candidate document explorer in the recruitment module'),
  ('candidate_form:create', 'Create candidate forms'),
  ('candidate_form:read', 'View candidate forms'),
  ('candidate_form:update', 'Update candidate forms'),
  ('candidate_form:delete', 'Delete candidate forms'),
  ('candidate_form:export_pdf', 'Export candidate forms to PDF'),
  ('employee_form:create', 'Create employee forms'),
  ('employee_form:read', 'View employee forms'),
  ('employee_form:update', 'Update employee forms'),
  ('employee_form:update_contract_documents', 'Upload Draft Employment Contract and SKB from Employee Form details'),
  ('employee_form:delete', 'Delete employee forms'),
  ('employee_form:export_pdf', 'Export employee forms to PDF'),
  ('employee_contract_form:create', 'Create new employee contract forms (NECF)'),
  ('employee_contract_form:read', 'View new employee contract forms (NECF)'),
  ('employee_contract_form:read_all', 'View all new employee contract form (NECF) records regardless of who created them'),
  ('employee_contract_form:update', 'Update new employee contract forms (NECF)'),
  ('employee_contract_form:delete', 'Delete new employee contract forms (NECF)'),
  ('employee_contract_form:export_pdf', 'Print or export new employee contract forms (NECF) to PDF'),
  ('export_configuration:read', 'View export configuration menu and overview page'),
  ('export_configuration:manage', 'Manage DOCX export templates and field mapping'),
  ('export_configuration:generate', 'Prepare, preview, and generate export documents'),
  ('interview_evaluation:create', 'Create interview evaluation forms'),
  ('interview_evaluation:read', 'View interview evaluation forms'),
  ('interview_evaluation:read_all', 'View all interview evaluation forms regardless of who created them'),
  ('interview_evaluation:update', 'Update interview evaluation forms'),
  ('interview_evaluation:interviewer_form', 'Access interviewer assignments and submit assigned interview evaluations'),
  ('interview_evaluation:delete', 'Delete interview evaluation forms'),
  ('document:download', 'Download employee request form and candidate attachments'),
  ('role:manage', 'Manage roles and permission assignments'),
  ('user:create', 'Create and assign application users'),
  ('user:read', 'View users and assigned roles'),
  ('candidate_employee:read', 'View candidate and employee user list'),
  ('candidate_employee:read_all', 'View all candidate and employee records regardless of who created them'),
  ('user:update', 'Update user profile and role assignments'),
  ('user:switch_to_employee', 'Switch candidate portal accounts to employee mode'),
  ('user:delete', 'Delete users'),
  ('user_history:read', 'View user management history')
on conflict (name) do update set description = excluded.description;

insert into public.roles (name, description)
values
  ('super_admin', 'Full application administrator'),
  ('manager', 'Manager'),
  ('staff recruitment', 'Recruitment staff'),
  ('candidate', 'Candidate portal user'),
  ('employee', 'Employee portal user')
on conflict (name) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'super_admin'
on conflict (role_id, permission_id) do nothing;

commit;

-- Reference master data. These are generic seed values, not official company data.
begin;

insert into public.master_pt (name, address, description)
values (
  'PT Contoh Nusantara',
  'Jakarta, Indonesia',
  'SEED referensi generik - bukan data resmi perusahaan.'
)
on conflict (name) do nothing;

insert into public.master_bu (name, description)
values
  ('Corporate', 'SEED referensi generik - fungsi korporat.'),
  ('Operations', 'SEED referensi generik - fungsi operasional.'),
  ('Commercial', 'SEED referensi generik - fungsi komersial.'),
  ('Technology', 'SEED referensi generik - fungsi teknologi.')
on conflict (name) do nothing;

insert into public.master_department (bu_id, name, description)
select bu.id, source.name, source.description
from (
  values
    ('Corporate', 'Human Resources', 'SEED referensi generik - departemen HR.'),
    ('Corporate', 'Finance', 'SEED referensi generik - departemen keuangan.'),
    ('Operations', 'Operations', 'SEED referensi generik - departemen operasional.'),
    ('Technology', 'Information Technology', 'SEED referensi generik - departemen teknologi informasi.'),
    ('Commercial', 'Sales & Marketing', 'SEED referensi generik - departemen penjualan dan pemasaran.')
) as source(bu_name, name, description)
join public.master_bu bu on bu.name = source.bu_name
where not exists (
  select 1
  from public.master_department existing
  where existing.name = source.name
);

insert into public.master_job_level (name, description, required_date_min_months)
values
  ('Staff', 'SEED referensi generik - level staf.', null),
  ('Senior Staff', 'SEED referensi generik - level senior staf.', null),
  ('Supervisor', 'SEED referensi generik - level supervisor.', null),
  ('Assistant Manager', 'SEED referensi generik - level assistant manager.', null),
  ('Manager', 'SEED referensi generik - level manager.', null),
  ('Senior Manager', 'SEED referensi generik - level senior manager.', null),
  ('General Manager', 'SEED referensi generik - level general manager.', null),
  ('Director', 'SEED referensi generik - level direktur.', null)
on conflict (name) do nothing;

insert into public.master_designation (name, description, required_date_min_months)
select source.name, source.description, null
from (
  values
    ('HR Staff', 'Staff', 'SEED referensi generik - jabatan HR.'),
    ('Recruitment Staff', 'Staff', 'SEED referensi generik - jabatan rekrutmen.'),
    ('HR Supervisor', 'Supervisor', 'SEED referensi generik - jabatan HR.'),
    ('HR Manager', 'Manager', 'SEED referensi generik - jabatan HR.'),
    ('Finance Staff', 'Staff', 'SEED referensi generik - jabatan keuangan.'),
    ('IT Staff', 'Staff', 'SEED referensi generik - jabatan teknologi informasi.'),
    ('Operations Staff', 'Staff', 'SEED referensi generik - jabatan operasional.'),
    ('Sales Staff', 'Staff', 'SEED referensi generik - jabatan penjualan.'),
    ('Marketing Staff', 'Staff', 'SEED referensi generik - jabatan pemasaran.')
) as source(name, level_name, description)
where not exists (
  select 1
  from public.master_designation existing
  where existing.name = source.name
);

commit;
