-- ACTIVE / FINAL
-- Menambah permission switch ke employee dan sinkronisasi role portal
-- untuk akun candidate service yang diproyeksikan ke dashboard.

begin;

insert into public.permissions (name, description)
values ('user:switch_to_employee', 'Switch candidate portal accounts to employee mode')
on conflict (name) do update
set description = excluded.description;

alter table if exists public.candidate_account_projection
  add column if not exists role text not null default 'candidate';

alter table if exists public.candidate_account_projection
  drop constraint if exists candidate_account_projection_role_check;

alter table if exists public.candidate_account_projection
  add constraint candidate_account_projection_role_check
  check (role in ('candidate', 'employee'));

update public.candidate_account_projection
set role = coalesce(nullif(trim(role), ''), 'candidate')
where role is null
   or trim(role) = '';

commit;
