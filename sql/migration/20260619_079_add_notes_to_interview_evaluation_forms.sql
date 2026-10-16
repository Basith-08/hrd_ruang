begin;

alter table if exists public.interview_evaluation_forms
  add column if not exists notes text;

commit;
