alter table public.interview_evaluation_scores
  drop constraint if exists interview_evaluation_scores_score_check;

alter table public.interview_evaluation_scores
  add constraint interview_evaluation_scores_score_check
  check (score between 1 and 10 or score is null);
