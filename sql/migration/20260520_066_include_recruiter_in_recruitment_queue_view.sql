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
  dept.name as employee_request_form_department,
  lvl.name as employee_request_form_designation,
  lvl.name as employee_request_form_job_level,
  erf.main_position as employee_request_form_main_position,
  erf.site as employee_request_form_site,
  erf.working_location as employee_request_form_working_location,
  erf.employment_status::text as employee_request_form_employment_status,
  erf.position_status::text as employee_request_form_position_status,
  erf.required_date as employee_request_form_required_date,
  erf.recruiter_user_id as employee_request_form_recruiter_user_id,
  coalesce(recruiter.full_name, recruiter.username, recruiter.email) as employee_request_form_recruiter_name,
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
left join public.master_department as dept
  on dept.id = erf.department_id
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
