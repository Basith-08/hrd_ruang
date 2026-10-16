-- ACTIVE / FINAL
-- Migration ini menambah projection kandidat yang dipakai aktif oleh `hrd_ruang`
-- untuk monitoring internal setelah source of truth kandidat dipindahkan ke `hrd_pintu`.

begin;

create table if not exists public.candidate_account_projection (
  candidate_id uuid primary key,
  identity_user_id uuid,
  email text,
  full_name text,
  phone text,
  status text not null default 'active',
  created_by_internal_user_id uuid,
  last_login_at timestamp with time zone,
  activated_at timestamp with time zone,
  application_count integer not null default 0,
  primary_application_id uuid,
  primary_erf_id uuid,
  primary_application_status text,
  primary_job_snapshot jsonb not null default '{}'::jsonb,
  primary_department_name text,
  primary_designation_name text,
  primary_main_position text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.candidate_application_projection (
  application_id uuid primary key,
  candidate_id uuid not null references public.candidate_account_projection(candidate_id) on delete cascade,
  erf_id uuid,
  status text not null default 'draft',
  job_snapshot jsonb not null default '{}'::jsonb,
  department_name text,
  designation_name text,
  main_position text,
  submitted_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at__candidate_account_projection on public.candidate_account_projection;
create trigger trg_set_updated_at__candidate_account_projection
before update on public.candidate_account_projection
for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at__candidate_application_projection on public.candidate_application_projection;
create trigger trg_set_updated_at__candidate_application_projection
before update on public.candidate_application_projection
for each row execute function public.set_updated_at();

commit;
