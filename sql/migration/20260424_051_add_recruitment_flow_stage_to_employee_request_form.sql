alter table public.employee_request_form
add column if not exists recruitment_flow_stage text;

alter table public.employee_request_form
drop constraint if exists employee_request_form_recruitment_flow_stage_check;

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

update public.employee_request_form as erf
set recruitment_flow_stage = case
  when exists (
    select 1
    from public.approval_chains as chain
    left join public.approval_steps as step
      on step.chain_id = chain.id
    where chain.employee_request_form_id = erf.id
      and (
        chain.status = 'rejected'
        or step.status = 'rejected'
      )
  ) then 'rejected'
  when erf.status = 'closed' and erf.closed_category = 'employee hired' then 'hiring_completed'
  when erf.status = 'closed' then 'closed'
  when (
    select step.step_order
    from public.approval_chains as chain
    join public.approval_steps as step
      on step.chain_id = chain.id
    where chain.employee_request_form_id = erf.id
      and chain.status = 'pending'
      and step.status = 'pending'
    order by chain.updated_at desc nulls last, chain.created_at desc nulls last, step.step_order asc
    limit 1
  ) = 1 then 'approval_in_progress'
  when (
    select step.step_order
    from public.approval_chains as chain
    join public.approval_steps as step
      on step.chain_id = chain.id
    where chain.employee_request_form_id = erf.id
      and chain.status = 'pending'
      and step.status = 'pending'
    order by chain.updated_at desc nulls last, chain.created_at desc nulls last, step.step_order asc
    limit 1
  ) = 2 then 'approval_in_progress'
  when (
    select step.step_order
    from public.approval_chains as chain
    join public.approval_steps as step
      on step.chain_id = chain.id
    where chain.employee_request_form_id = erf.id
      and chain.status = 'pending'
      and step.status = 'pending'
    order by chain.updated_at desc nulls last, chain.created_at desc nulls last, step.step_order asc
    limit 1
  ) = 3 then 'approval_in_progress'
  when (
    select count(*)
    from public.interview_evaluation_forms as form
    where form.employee_request_form_id = erf.id
      and exists (
        select 1
        from public.interview_evaluation_interviewers as interviewer
        where interviewer.interview_evaluation_form_id = form.id
      )
      and not exists (
        select 1
        from public.interview_evaluation_interviewers as interviewer
        where interviewer.interview_evaluation_form_id = form.id
          and (
            coalesce(nullif(trim(interviewer.recommendation), ''), '') = ''
            or (
              select count(*)
              from public.interview_evaluation_interviewer_scores as score
              where score.interview_evaluation_interviewer_id = interviewer.id
                and score.score between 1 and 6
            ) < 10
          )
      )
  ) > 0
    and (
      select count(*)
      from public.interview_evaluation_forms as form
      where form.employee_request_form_id = erf.id
    ) > 0
    and (
      select count(*)
      from public.interview_evaluation_forms as form
      where form.employee_request_form_id = erf.id
        and exists (
          select 1
          from public.interview_evaluation_interviewers as interviewer
          where interviewer.interview_evaluation_form_id = form.id
        )
        and not exists (
          select 1
          from public.interview_evaluation_interviewers as interviewer
          where interviewer.interview_evaluation_form_id = form.id
            and (
              coalesce(nullif(trim(interviewer.recommendation), ''), '') = ''
              or (
                select count(*)
                from public.interview_evaluation_interviewer_scores as score
                where score.interview_evaluation_interviewer_id = interviewer.id
                  and score.score between 1 and 6
              ) < 10
            )
        )
    ) = (
      select count(*)
      from public.interview_evaluation_forms as form
      where form.employee_request_form_id = erf.id
    )
    then 'interview_evaluation_completed'
  when exists (
    select 1
    from public.interview_evaluation_forms as form
    join public.interview_evaluation_interviewers as interviewer
      on interviewer.interview_evaluation_form_id = form.id
    where form.employee_request_form_id = erf.id
      and coalesce(nullif(trim(interviewer.recommendation), ''), '') <> ''
  ) then 'interview_evaluation_in_progress'
  when exists (
    select 1
    from public.interview_evaluation_forms as form
    where form.employee_request_form_id = erf.id
  ) then 'interview_scheduled'
  when exists (
    select 1
    from public.approval_chains as chain
    where chain.employee_request_form_id = erf.id
      and chain.status = 'approved'
  ) then 'erf_approved'
  else 'erf_requested'
end;
