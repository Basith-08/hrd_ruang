-- OBSOLETE
-- Policy dan bucket access di file ini hanya berlaku untuk `public.candidate_documents`
-- pada flow kandidat lama di `hrd_ruang`.
-- Object yang diatur file ini sudah dibersihkan oleh:
-- `20260402_023_drop_obsolete_candidate_documents.sql`

begin;

alter table public.candidate_documents enable row level security;

drop policy if exists "candidate_documents_select" on public.candidate_documents;
create policy "candidate_documents_select"
on public.candidate_documents
for select
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and lower(r.name) not in ('candidate', 'manager')
  )
  or exists (
    select 1
    from public.candidate_form cf
    where cf.id = candidate_documents.candidate_form_id
      and cf.candidate_id = auth.uid()
  )
  or exists (
    select 1
    from public.candidate_form cf
    join public.employee_request_form erf on erf.id = cf.employee_request_form_id
    where cf.id = candidate_documents.candidate_form_id
      and erf.created_by = auth.uid()
  )
);

drop policy if exists "candidate_documents_insert" on public.candidate_documents;
create policy "candidate_documents_insert"
on public.candidate_documents
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and lower(r.name) not in ('candidate', 'manager')
  )
  or exists (
    select 1
    from public.candidate_form cf
    where cf.id = candidate_documents.candidate_form_id
      and cf.candidate_id = auth.uid()
  )
  or exists (
    select 1
    from public.candidate_form cf
    join public.employee_request_form erf on erf.id = cf.employee_request_form_id
    where cf.id = candidate_documents.candidate_form_id
      and erf.created_by = auth.uid()
  )
);

drop policy if exists "candidate_documents_update" on public.candidate_documents;
create policy "candidate_documents_update"
on public.candidate_documents
for update
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and lower(r.name) not in ('candidate', 'manager')
  )
  or exists (
    select 1
    from public.candidate_form cf
    where cf.id = candidate_documents.candidate_form_id
      and cf.candidate_id = auth.uid()
  )
  or exists (
    select 1
    from public.candidate_form cf
    join public.employee_request_form erf on erf.id = cf.employee_request_form_id
    where cf.id = candidate_documents.candidate_form_id
      and erf.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and lower(r.name) not in ('candidate', 'manager')
  )
  or exists (
    select 1
    from public.candidate_form cf
    where cf.id = candidate_documents.candidate_form_id
      and cf.candidate_id = auth.uid()
  )
  or exists (
    select 1
    from public.candidate_form cf
    join public.employee_request_form erf on erf.id = cf.employee_request_form_id
    where cf.id = candidate_documents.candidate_form_id
      and erf.created_by = auth.uid()
  )
);

drop policy if exists "candidate_documents_delete" on public.candidate_documents;
create policy "candidate_documents_delete"
on public.candidate_documents
for delete
to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and lower(r.name) not in ('candidate', 'manager')
  )
  or exists (
    select 1
    from public.candidate_form cf
    where cf.id = candidate_documents.candidate_form_id
      and cf.candidate_id = auth.uid()
  )
  or exists (
    select 1
    from public.candidate_form cf
    join public.employee_request_form erf on erf.id = cf.employee_request_form_id
    where cf.id = candidate_documents.candidate_form_id
      and erf.created_by = auth.uid()
  )
);

drop policy if exists "candidate_documents_storage_select" on storage.objects;
create policy "candidate_documents_storage_select"
on storage.objects
for select
to authenticated
using (bucket_id = 'candidate-documents');

drop policy if exists "candidate_documents_storage_insert" on storage.objects;
create policy "candidate_documents_storage_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'candidate-documents');

drop policy if exists "candidate_documents_storage_update" on storage.objects;
create policy "candidate_documents_storage_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'candidate-documents')
with check (bucket_id = 'candidate-documents');

drop policy if exists "candidate_documents_storage_delete" on storage.objects;
create policy "candidate_documents_storage_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'candidate-documents');

commit;
