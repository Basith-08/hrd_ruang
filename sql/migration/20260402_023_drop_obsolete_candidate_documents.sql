-- ACTIVE CLEANUP
-- Migration cleanup ini aman dijalankan untuk membereskan object dokumen kandidat lama
-- setelah flow kandidat dipindahkan ke `hrd_pintu`.

begin;

create table if not exists public.candidate_documents_archive (
  id uuid primary key,
  candidate_form_id uuid,
  cv text [] not null default '{}' :: text [],
  diploma_certificate text [] not null default '{}' :: text [],
  academic_transcript text [] not null default '{}' :: text [],
  id_card text [] not null default '{}' :: text [],
  driving_license text [] not null default '{}' :: text [],
  passport text [] not null default '{}' :: text [],
  family_card text [] not null default '{}' :: text [],
  npwp text [] not null default '{}' :: text [],
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  archived_at timestamp with time zone not null default now()
);

insert into
  public.candidate_documents_archive (
    id,
    candidate_form_id,
    cv,
    diploma_certificate,
    academic_transcript,
    id_card,
    driving_license,
    passport,
    family_card,
    npwp,
    created_at,
    updated_at,
    archived_at
  )
select
  cd.id,
  cd.candidate_form_id,
  cd.cv,
  cd.diploma_certificate,
  cd.academic_transcript,
  cd.id_card,
  cd.driving_license,
  cd.passport,
  cd.family_card,
  cd.npwp,
  cd.created_at,
  cd.updated_at,
  now()
from
  public.candidate_documents cd on conflict (id) do
update
set
  candidate_form_id = excluded.candidate_form_id,
  cv = excluded.cv,
  diploma_certificate = excluded.diploma_certificate,
  academic_transcript = excluded.academic_transcript,
  id_card = excluded.id_card,
  driving_license = excluded.driving_license,
  passport = excluded.passport,
  family_card = excluded.family_card,
  npwp = excluded.npwp,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at,
  archived_at = excluded.archived_at;

drop policy if exists "candidate_documents_select" on public.candidate_documents;

drop policy if exists "candidate_documents_insert" on public.candidate_documents;

drop policy if exists "candidate_documents_update" on public.candidate_documents;

drop policy if exists "candidate_documents_delete" on public.candidate_documents;

drop policy if exists "candidate_documents_storage_select" on storage.objects;

drop policy if exists "candidate_documents_storage_insert" on storage.objects;

drop policy if exists "candidate_documents_storage_update" on storage.objects;

drop policy if exists "candidate_documents_storage_delete" on storage.objects;

drop table if exists public.candidate_documents;

commit;
