begin;

alter table public.interview_evaluation_forms
  add column if not exists average_score numeric(10,2);

with average_scores as (
  select
    interviewer.interview_evaluation_form_id,
    avg(score.score)::numeric(10,2) as average_score
  from public.interview_evaluation_interviewers interviewer
  join public.interview_evaluation_interviewer_scores score
    on score.interview_evaluation_interviewer_id = interviewer.id
  where score.score is not null
  group by interviewer.interview_evaluation_form_id
)
update public.interview_evaluation_forms form
set average_score = average_scores.average_score
from average_scores
where form.id = average_scores.interview_evaluation_form_id;

commit;
