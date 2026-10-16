-- Source: sql/migration/20260618_077_add_master_designation_id_columns.sql
begin;

-- Fase 1: Tambah master_designation_id ke employee_request_form
alter table public.employee_request_form
  add column if not exists master_designation_id uuid;

alter table public.employee_request_form
  drop constraint if exists employee_request_form_master_designation_id_fkey;

alter table public.employee_request_form
  add constraint employee_request_form_master_designation_id_fkey
  foreign key (master_designation_id)
  references public.master_designation(id);

create index if not exists idx_employee_request_form_master_designation_id
  on public.employee_request_form(master_designation_id);

-- Fase 1: Tambah job_level_id ke master_designation (mapping ke legacy job level)
alter table public.master_designation
  add column if not exists job_level_id uuid;

alter table public.master_designation
  drop constraint if exists master_designation_job_level_id_fkey;

alter table public.master_designation
  add constraint master_designation_job_level_id_fkey
  foreign key (job_level_id)
  references public.master_job_level(id);

create index if not exists idx_master_designation_job_level_id
  on public.master_designation(job_level_id);

-- Fase 1: Tambah master_designation_id ke approver_master
alter table public.approver_master
  add column if not exists master_designation_id uuid;

alter table public.approver_master
  drop constraint if exists approver_master_master_designation_id_fkey;

alter table public.approver_master
  add constraint approver_master_master_designation_id_fkey
  foreign key (master_designation_id)
  references public.master_designation(id);

create index if not exists idx_approver_master_master_designation_id
  on public.approver_master(master_designation_id);

commit;


-- Source: sql/migration/20260702_082_add_master_designation_id_to_profiles.sql
begin;

-- Tambah master_designation_id ke profiles, mengikuti pola migration 077
-- (employee_request_form & approver_master) agar designation user/employee
-- juga bisa merujuk ke master_designation, bukan cuma master_job_level.
alter table public.profiles
  add column if not exists master_designation_id uuid;

alter table public.profiles
  drop constraint if exists profiles_master_designation_id_fkey;

alter table public.profiles
  add constraint profiles_master_designation_id_fkey
  foreign key (master_designation_id)
  references public.master_designation(id);

create index if not exists idx_profiles_master_designation_id
  on public.profiles(master_designation_id);

commit;


-- Kolom ini dibutuhkan oleh recruitment_queue_view versi terbaru.
-- Ditambahkan di sini karena baseline remote berasal dari snapshot schema
-- yang lebih lama daripada migration aplikasi.
begin;

alter table public.employee_request_form
  add column if not exists requested_date date;

update public.employee_request_form
set requested_date = coalesce(created_at::date, (now() at time zone 'Asia/Jakarta')::date)
where requested_date is null;

alter table public.employee_request_form
  alter column requested_date set default ((now() at time zone 'Asia/Jakarta')::date);

commit;


-- Source: sql/migration/20260618_078_update_recruitment_queue_view_for_master_designation.sql
begin;

drop view if exists public.recruitment_queue_view;

create or replace view public.recruitment_queue_view as
with latest_chains as (
  select distinct on (ac.employee_request_form_id)
    ac.id as chain_id,
    ac.employee_request_form_id,
    ac.status,
    ac.created_at,
    ac.updated_at
  from public.approval_chains as ac
  order by
    ac.employee_request_form_id,
    ac.updated_at desc,
    ac.created_at desc,
    ac.id desc
),
approval_step_summary as (
  select
    aps.chain_id,
    max(case when aps.step_order = 1 then aps.approver_name end) as employee_request_form_approval_director_bu,
    max(case when aps.step_order = 1 and aps.status = 'approved' then aps.approved_at end) as employee_request_form_approval_director_bu_date,
    max(case when aps.step_order = 2 then aps.approver_name end) as employee_request_form_approval_gm_hrd,
    max(case when aps.step_order = 2 and aps.status = 'approved' then aps.approved_at end) as employee_request_form_approval_gm_hrd_date,
    max(case when aps.step_order = 3 then aps.approver_name end) as employee_request_form_approval_director_hrd,
    max(case when aps.step_order = 3 and aps.status = 'approved' then aps.approved_at end) as employee_request_form_approval_director_hrd_date
  from public.approval_steps as aps
  group by aps.chain_id
)
select
  coalesce(lc.chain_id, erf.id) as id,
  lc.chain_id,
  erf.id as employee_request_form_id,
  coalesce(lc.created_at, erf.created_at) as created_at,
  coalesce(erf.updated_at, lc.updated_at, erf.created_at, lc.created_at) as updated_at,
  pt.name as employee_request_form_pt_pembebanan,
  erf.bu_id as employee_request_form_bu_id,
  bu.name as employee_request_form_business_unit,
  dept.name as employee_request_form_department,
  coalesce(des.name, lvl.name) as employee_request_form_designation,
  coalesce(des.name, lvl.name) as employee_request_form_job_level,
  erf.main_position as employee_request_form_main_position,
  erf.site as employee_request_form_site,
  erf.working_location as employee_request_form_working_location,
  erf.requested_date as employee_request_form_requested_date,
  erf.employment_status::text as employee_request_form_employment_status,
  erf.position_status::text as employee_request_form_position_status,
  erf.required_date as employee_request_form_required_date,
  erf.recruiter_user_id as employee_request_form_recruiter_user_id,
  coalesce(recruiter.full_name, recruiter.username, recruiter.email) as employee_request_form_recruiter_name,
  null::text as employee_request_form_candidate_name,
  erf.recruitment_flow_stage as employee_request_form_recruitment_flow_stage,
  erf.status as employee_request_form_status,
  erf.closed_date as employee_request_form_closed_date,
  cg1.name as employee_request_form_custom_grup_1,
  cg2.name as employee_request_form_custom_grup_2,
  cg3.name as employee_request_form_custom_grup_3,
  cg4.name as employee_request_form_custom_grup_4,
  cg5.name as employee_request_form_custom_grup_5,
  cg6.name as employee_request_form_custom_grup_6,
  ass.employee_request_form_approval_director_bu,
  ass.employee_request_form_approval_director_bu_date,
  ass.employee_request_form_approval_gm_hrd,
  ass.employee_request_form_approval_gm_hrd_date,
  ass.employee_request_form_approval_director_hrd,
  ass.employee_request_form_approval_director_hrd_date
from public.employee_request_form as erf
left join latest_chains as lc
  on lc.employee_request_form_id = erf.id
left join approval_step_summary as ass
  on ass.chain_id = lc.chain_id
left join public.master_pt as pt
  on pt.id = erf.pt_id
left join public.master_bu as bu
  on bu.id = erf.bu_id
left join public.master_department as dept
  on dept.id = erf.department_id
left join public.master_designation as des
  on des.id = erf.master_designation_id
left join public.master_job_level as lvl
  on lvl.id = erf.designation_id
left join public.profiles as recruiter
  on recruiter.id = erf.recruiter_user_id
left join public.master_custom_grup_1 as cg1
  on cg1.id = erf.custom_grup_1_id
left join public.master_custom_grup_2 as cg2
  on cg2.id = erf.custom_grup_2_id
left join public.master_custom_grup_3 as cg3
  on cg3.id = erf.custom_grup_3_id
left join public.master_custom_grup_4 as cg4
  on cg4.id = erf.custom_grup_4_id
left join public.master_custom_grup_5 as cg5
  on cg5.id = erf.custom_grup_5_id
left join public.master_custom_grup_6 as cg6
  on cg6.id = erf.custom_grup_6_id;

alter view public.recruitment_queue_view
  set (security_invoker = true);

commit;
