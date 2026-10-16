-- ACTIVE / FINAL
-- Stores selected interviewers as structured recipient metadata for future email notifications.

alter table public.interview_evaluation_forms
  add column if not exists interviewer_recipients jsonb not null default '[]'::jsonb;

alter table public.interview_evaluation_forms
  drop constraint if exists interview_evaluation_forms_interviewer_recipients_is_array;

alter table public.interview_evaluation_forms
  add constraint interview_evaluation_forms_interviewer_recipients_is_array
  check (jsonb_typeof(interviewer_recipients) = 'array');
