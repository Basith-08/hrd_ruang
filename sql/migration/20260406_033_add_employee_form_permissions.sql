begin;

insert into public.permissions (name, description)
values
  ('employee_form:create', 'Create employee forms'),
  ('employee_form:read', 'View employee forms'),
  ('employee_form:update', 'Update employee forms'),
  ('employee_form:delete', 'Delete employee forms'),
  ('employee_form:export_pdf', 'Export employee forms to PDF')
on conflict (name) do update
set description = excluded.description;

do $$
begin
  if to_regclass('public.candidate_account_projection') is not null then
    execute 'drop policy if exists "candidate_account_projection_select_internal_recruitment" on public.candidate_account_projection';
    execute $sql$
      create policy "candidate_account_projection_select_internal_recruitment"
      on public.candidate_account_projection
      for select
      to authenticated
      using (
        public.has_permission('recruitment:read')
        or public.has_permission('recruitment:document_explorer')
        or public.has_permission('candidate_form:read')
        or public.has_permission('employee_form:read')
      )
    $sql$;
  end if;

  if to_regclass('public.candidate_application_projection') is not null then
    execute 'drop policy if exists "candidate_application_projection_select_internal_recruitment" on public.candidate_application_projection';
    execute $sql$
      create policy "candidate_application_projection_select_internal_recruitment"
      on public.candidate_application_projection
      for select
      to authenticated
      using (
        public.has_permission('recruitment:read')
        or public.has_permission('recruitment:document_explorer')
        or public.has_permission('candidate_form:read')
        or public.has_permission('employee_form:read')
      )
    $sql$;
  end if;
end $$;

commit;
