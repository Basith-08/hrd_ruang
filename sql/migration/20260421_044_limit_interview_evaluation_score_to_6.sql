update public.interview_evaluation_scores
set score = 6
where score > 6;

alter table public.interview_evaluation_scores
  drop constraint if exists interview_evaluation_scores_score_check;

alter table public.interview_evaluation_scores
  add constraint interview_evaluation_scores_score_check
  check (score between 1 and 6 or score is null);
