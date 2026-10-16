begin;

alter table if exists public.interview_evaluation_interviewer_scores
  drop constraint if exists interview_evaluation_interviewer_scores_score_check;

alter table if exists public.interview_evaluation_interviewer_scores
  add constraint interview_evaluation_interviewer_scores_score_check
  check (score between 1 and 5 or score is null);

commit;
