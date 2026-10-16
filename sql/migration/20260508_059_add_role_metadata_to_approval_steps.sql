begin;

alter table public.approval_steps
  add column if not exists approval_role_key text,
  add column if not exists approval_role_label text;

commit;
