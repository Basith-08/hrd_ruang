-- OBSOLETE
-- Migration ini membuat `public.candidate_documents` untuk flow kandidat lama di `hrd_ruang`.
-- Tabel tersebut sudah diarsipkan dan dibersihkan oleh:
-- `20260402_023_drop_obsolete_candidate_documents.sql`

begin;

create table if not exists public.candidate_documents (
  id uuid primary key default gen_random_uuid(),
  candidate_form_id uuid not null unique references public.candidate_form(id) on delete cascade,
  cv text[] not null default '{}'::text[],
  diploma_certificate text[] not null default '{}'::text[],
  academic_transcript text[] not null default '{}'::text[],
  id_card text[] not null default '{}'::text[],
  driving_license text[] not null default '{}'::text[],
  passport text[] not null default '{}'::text[],
  family_card text[] not null default '{}'::text[],
  npwp text[] not null default '{}'::text[],
  created_at timestamp without time zone default now(),
  updated_at timestamp without time zone default now()
);

commit;
