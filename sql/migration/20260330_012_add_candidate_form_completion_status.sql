-- HISTORICAL / TRANSITIONAL
-- Migration ini menambahkan completion status pada local mirror `public.candidate_form`.
-- Setelah candidate flow dipindahkan ke `hrd_pintu`, tabel ini bukan lagi source of truth.
-- Di environment yang sudah sepenuhnya memakai projection + direct read ke `hrd_pintu`,
-- tabel local mirror bisa saja sudah tidak ada lagi.

begin;

alter table if exists public.candidate_form
  drop constraint if exists candidate_form_hr_screening_status_check;

alter table if exists public.candidate_form
  drop column if exists hr_screening_status;

alter table if exists public.candidate_form
  add column if not exists completion_status text;

update public.candidate_form
set completion_status = 'in_progress'
where completion_status is null;

alter table if exists public.candidate_form
  alter column completion_status set default 'in_progress';

alter table if exists public.candidate_form
  alter column completion_status set not null;

alter table if exists public.candidate_form
  drop constraint if exists candidate_form_completion_status_check;

alter table if exists public.candidate_form
  add constraint candidate_form_completion_status_check
  check (completion_status = any (array['in_progress'::text, 'completed'::text]));

delete from public.permissions
where name = 'candidate_form:complete';

commit;
