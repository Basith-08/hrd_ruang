-- ACTIVE / FINAL
-- Mirrors candidate account activation timestamps from `hrd_pintu`
-- so dashboard access windows can follow the latest activation date.

begin;

alter table if exists public.candidate_account_projection
  add column if not exists activated_at timestamp with time zone;

update public.candidate_account_projection
set activated_at = created_at
where activated_at is null;

commit;
