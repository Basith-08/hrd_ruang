alter table public.profiles
  add column if not exists is_active boolean;

update public.profiles
set is_active = true
where is_active is null;

alter table public.profiles
  alter column is_active set default true;

alter table public.profiles
  alter column is_active set not null;
