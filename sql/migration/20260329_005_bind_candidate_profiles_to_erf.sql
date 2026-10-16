-- PARTIALLY SUPERSEDED
-- File ini adalah migration transisi awal untuk flow kandidat lama di `hrd_ruang`.
-- Sebagian perubahan profil masih relevan secara histori, tetapi binding kandidat ke ERF
-- sudah direvisi lebih lanjut dan bukan lagi acuan final arsitektur kandidat.

alter table public.profiles
  add column if not exists employee_request_form_id uuid,
  add column if not exists department_id uuid,
  add column if not exists job_level_id uuid,
  add column if not exists main_position text,
  add column if not exists is_active boolean not null default true,
  add column if not exists personal_data jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_employee_request_form_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_employee_request_form_id_fkey
        foreign key (employee_request_form_id) references public.employee_request_form(id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_department_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_department_id_fkey
        foreign key (department_id) references public.master_department(id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_job_level_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_job_level_id_fkey
        foreign key (job_level_id) references public.master_job_level(id);
  end if;
end
$$;

alter table public.candidate_form
  add column if not exists photograph text;
