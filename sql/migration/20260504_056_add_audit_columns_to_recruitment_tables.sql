begin;

alter table if exists public.employee_request_form
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

update public.employee_request_form
set updated_by = coalesce(updated_by, created_by)
where updated_by is null;

alter table if exists public.interview_evaluation_interviewers
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

update public.interview_evaluation_interviewers interviewer
set
  created_by = coalesce(interviewer.created_by, form.created_by),
  updated_by = coalesce(interviewer.updated_by, form.updated_by, form.created_by)
from public.interview_evaluation_forms form
where form.id = interviewer.interview_evaluation_form_id
  and (
    interviewer.created_by is null
    or interviewer.updated_by is null
  );

alter table if exists public.interview_evaluation_interviewer_scores
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

update public.interview_evaluation_interviewer_scores score
set
  created_by = coalesce(score.created_by, interviewer.created_by, form.created_by),
  updated_by = coalesce(score.updated_by, interviewer.updated_by, form.updated_by, interviewer.created_by, form.created_by)
from public.interview_evaluation_interviewers interviewer
join public.interview_evaluation_forms form
  on form.id = interviewer.interview_evaluation_form_id
where interviewer.id = score.interview_evaluation_interviewer_id
  and (
    score.created_by is null
    or score.updated_by is null
  );

commit;
