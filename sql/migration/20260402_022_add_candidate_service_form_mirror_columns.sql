-- TRANSITIONAL / LEGACY COMPATIBILITY
-- Migration ini menambah kolom penanda pada local mirror `public.candidate_form`
-- untuk membantu fase transisi dari dashboard ke `hrd_pintu`.
-- Jika environment target tidak lagi menyimpan local mirror kandidat, file ini cukup
-- diperlakukan sebagai histori transisi dan bukan acuan schema aktif final.

begin;

alter table if exists public.candidate_form
  add column if not exists candidate_source text not null default 'local';

alter table if exists public.candidate_form
  add column if not exists candidate_service_form_id uuid;

alter table if exists public.candidate_form
  add column if not exists candidate_service_application_id uuid;

alter table if exists public.candidate_form
  add column if not exists candidate_service_candidate_id uuid;

alter table if exists public.candidate_form
  add column if not exists candidate_service_identity_user_id uuid;

alter table if exists public.candidate_form
  drop constraint if exists candidate_form_candidate_source_check;

alter table if exists public.candidate_form
  add constraint candidate_form_candidate_source_check
  check (candidate_source in ('local', 'candidate_service'));

create unique index if not exists candidate_form_candidate_service_form_id_key
  on public.candidate_form(candidate_service_form_id)
  where candidate_service_form_id is not null;

commit;
