alter table public.employee_request_form
drop constraint if exists employee_request_form_recruitment_flow_stage_check;

update public.employee_request_form
set recruitment_flow_stage = 'approval_in_progress'
where recruitment_flow_stage in (
  'approval_in_progress',
  'waiting_bu_director_approval',
  'waiting_gm_hrd_approval',
  'waiting_hr_director_approval'
);

alter table public.employee_request_form
add constraint employee_request_form_recruitment_flow_stage_check
check (
  recruitment_flow_stage is null
  or recruitment_flow_stage in (
    'erf_requested',
    'approval_in_progress',
    'erf_approved',
    'candidate_sourcing',
    'assessment_list_created',
    'interview_scheduled',
    'interview_evaluation_in_progress',
    'interview_evaluation_completed',
    'candidate_selected',
    'employee_contract_form_in_progress',
    'hiring_completed',
    'closed',
    'rejected'
  )
);
