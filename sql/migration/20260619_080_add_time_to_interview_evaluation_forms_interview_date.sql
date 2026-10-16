begin;

alter table if exists public.interview_evaluation_forms
  alter column interview_date type timestamp without time zone
  using interview_date::timestamp without time zone;

commit;
