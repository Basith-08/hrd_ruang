begin;

insert into public.permissions (name, description)
values (
  'recruitment:document_explorer',
  'View candidate document explorer in the recruitment module'
)
on conflict (name) do update
set description = excluded.description;

commit;
