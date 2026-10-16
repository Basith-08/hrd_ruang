begin;

drop trigger if exists trg_set_updated_at__interview_evaluation_scores on public.interview_evaluation_scores;

drop policy if exists interview_evaluation_scores_select on public.interview_evaluation_scores;
drop policy if exists interview_evaluation_scores_insert on public.interview_evaluation_scores;
drop policy if exists interview_evaluation_scores_update on public.interview_evaluation_scores;
drop policy if exists interview_evaluation_scores_delete on public.interview_evaluation_scores;

drop table if exists public.interview_evaluation_scores;

alter table public.interview_evaluation_forms
  drop column if exists comments,
  drop column if exists recommendation;

commit;
