begin;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'employee_request_form'
      and column_name = 'organizational_structure'
      and udt_name <> '_text'
  ) then
    alter table public.employee_request_form
      alter column organizational_structure type text[]
      using (
        case
          when organizational_structure is null or btrim(organizational_structure) = '' then '{}'::text[]
          else array[organizational_structure]
        end
      );
  else
    alter table public.employee_request_form
      add column if not exists organizational_structure text[] default '{}'::text[];
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'employee_request_form'
      and column_name = 'job_description'
      and udt_name <> '_text'
  ) then
    alter table public.employee_request_form
      alter column job_description type text[]
      using (
        case
          when job_description is null or btrim(job_description) = '' then '{}'::text[]
          else array[job_description]
        end
      );
  else
    alter table public.employee_request_form
      add column if not exists job_description text[] default '{}'::text[];
  end if;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'erf',
  'erf',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "erf_storage_select" on storage.objects;
create policy "erf_storage_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'erf'
  and (
    exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
        and lower(r.name) not in ('candidate', 'manager')
    )
    or split_part(name, '/', 2) = auth.uid()::text
  )
);

drop policy if exists "erf_storage_insert" on storage.objects;
create policy "erf_storage_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'erf'
  and (
    exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
        and lower(r.name) not in ('candidate', 'manager')
    )
    or split_part(name, '/', 2) = auth.uid()::text
  )
);

drop policy if exists "erf_storage_update" on storage.objects;
create policy "erf_storage_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'erf'
  and (
    exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
        and lower(r.name) not in ('candidate', 'manager')
    )
    or split_part(name, '/', 2) = auth.uid()::text
  )
)
with check (
  bucket_id = 'erf'
  and (
    exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
        and lower(r.name) not in ('candidate', 'manager')
    )
    or split_part(name, '/', 2) = auth.uid()::text
  )
);

drop policy if exists "erf_storage_delete" on storage.objects;
create policy "erf_storage_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'erf'
  and (
    exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
        and lower(r.name) not in ('candidate', 'manager')
    )
    or split_part(name, '/', 2) = auth.uid()::text
  )
);

commit;
