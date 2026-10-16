-- ACTIVE / FINAL
-- Re-enable RLS untuk tabel aktif dashboard yang kembali menjadi
-- `UNRESTRICTED` setelah rollback 20260402_029.

begin;

insert into public.permissions (name, description)
values
  ('approval:action', 'Approve or reject assigned approval requests')
on conflict (name) do update
set description = excluded.description;

create or replace function public.current_user_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

comment on function public.current_user_email() is
  'Returns the lowercase email from the current auth JWT.';

create or replace function public.has_role(role_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r
      on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and lower(r.name) = lower(role_name)
  );
$$;

comment on function public.has_role(text) is
  'Returns true when auth.uid() is linked to the requested role name.';

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('manager');
$$;

create or replace function public.is_candidate()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('candidate');
$$;

create or replace function public.is_internal_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and not public.is_candidate();
$$;

comment on function public.is_internal_user() is
  'Returns true for authenticated non-candidate users in the dashboard database.';

create or replace function public.can_access_employee_request_form(employee_request_form_created_by uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and (
      (
        public.is_manager()
        and employee_request_form_created_by = auth.uid()
      )
      or (
        not public.is_manager()
        and (
          public.has_permission('employee_request_form:read')
          or public.has_permission('recruitment:approved_erf_read')
          or public.has_permission('approval:read')
          or public.has_permission('recruitment:read')
        )
      )
    );
$$;

comment on function public.can_access_employee_request_form(uuid) is
  'Applies dashboard ERF row access: manager is owner-scoped; non-manager follows read permissions.';

create or replace function public.can_write_employee_request_form(employee_request_form_created_by uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and (
      (
        public.is_manager()
        and employee_request_form_created_by = auth.uid()
      )
      or (
        not public.is_manager()
        and (
          public.has_permission('employee_request_form:create')
          or public.has_permission('employee_request_form:update')
          or public.has_permission('employee_request_form:delete')
          or public.has_permission('employee_request_form:close')
        )
      )
    );
$$;

comment on function public.can_write_employee_request_form(uuid) is
  'Applies dashboard ERF write access: manager is owner-scoped; non-manager follows write permissions.';

create or replace function public.employee_request_form_owner(employee_request_form_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select erf.created_by
  from public.employee_request_form erf
  where erf.id = employee_request_form_id
  limit 1;
$$;

create or replace function public.approval_chain_employee_request_form_id(approval_chain_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select ac.employee_request_form_id
  from public.approval_chains ac
  where ac.id = approval_chain_id
  limit 1;
$$;

create or replace function public.is_chain_assigned_to_current_user(approval_chain_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.approval_steps aps
    where aps.chain_id = approval_chain_id
      and lower(coalesce(aps.approver_email, '')) = public.current_user_email()
  );
$$;

create or replace function public.can_access_approval_chain(approval_chain_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and (
      public.can_access_employee_request_form(
        public.employee_request_form_owner(
          public.approval_chain_employee_request_form_id(approval_chain_id)
        )
      )
      or public.is_chain_assigned_to_current_user(approval_chain_id)
    );
$$;

comment on function public.can_access_approval_chain(uuid) is
  'Returns true when the current user can read an approval chain through ERF ownership/permissions or assigned approver email.';

alter view if exists public.recruitment_queue_view
  set (security_invoker = true);

alter table if exists public.roles enable row level security;
drop policy if exists "roles_select_authenticated" on public.roles;
create policy "roles_select_authenticated"
on public.roles
for select
to authenticated
using (true);

drop policy if exists "roles_write_role_manage" on public.roles;
create policy "roles_write_role_manage"
on public.roles
for all
to authenticated
using (public.has_permission('role:manage'))
with check (public.has_permission('role:manage'));

alter table if exists public.permissions enable row level security;
drop policy if exists "permissions_select_authenticated" on public.permissions;
create policy "permissions_select_authenticated"
on public.permissions
for select
to authenticated
using (true);

drop policy if exists "permissions_write_role_manage" on public.permissions;
create policy "permissions_write_role_manage"
on public.permissions
for all
to authenticated
using (public.has_permission('role:manage'))
with check (public.has_permission('role:manage'));

alter table if exists public.role_permissions enable row level security;
drop policy if exists "role_permissions_select_authenticated" on public.role_permissions;
create policy "role_permissions_select_authenticated"
on public.role_permissions
for select
to authenticated
using (true);

drop policy if exists "role_permissions_write_role_manage" on public.role_permissions;
create policy "role_permissions_write_role_manage"
on public.role_permissions
for all
to authenticated
using (public.has_permission('role:manage'))
with check (public.has_permission('role:manage'));

alter table if exists public.user_roles enable row level security;
drop policy if exists "user_roles_select_scoped" on public.user_roles;
create policy "user_roles_select_scoped"
on public.user_roles
for select
to authenticated
using (
  user_id = auth.uid()
  or public.has_permission('role:manage')
  or public.has_permission('user:read')
);

drop policy if exists "user_roles_write_managed" on public.user_roles;
create policy "user_roles_write_managed"
on public.user_roles
for all
to authenticated
using (
  public.has_permission('role:manage')
  or public.has_permission('user:update')
)
with check (
  public.has_permission('role:manage')
  or public.has_permission('user:update')
);

alter table if exists public.profiles enable row level security;
drop policy if exists "profiles_select_self_or_internal" on public.profiles;
create policy "profiles_select_self_or_internal"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_internal_user()
);

drop policy if exists "profiles_update_self_or_user_update" on public.profiles;
create policy "profiles_update_self_or_user_update"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or public.has_permission('user:update')
)
with check (
  id = auth.uid()
  or public.has_permission('user:update')
);

alter table if exists public.employee_request_form enable row level security;
drop policy if exists "employee_request_form_select_scoped" on public.employee_request_form;
create policy "employee_request_form_select_scoped"
on public.employee_request_form
for select
to authenticated
using (
  public.can_access_employee_request_form(created_by)
);

drop policy if exists "employee_request_form_insert_scoped" on public.employee_request_form;
create policy "employee_request_form_insert_scoped"
on public.employee_request_form
for insert
to authenticated
with check (
  public.can_write_employee_request_form(created_by)
);

drop policy if exists "employee_request_form_update_scoped" on public.employee_request_form;
create policy "employee_request_form_update_scoped"
on public.employee_request_form
for update
to authenticated
using (
  public.can_write_employee_request_form(created_by)
)
with check (
  public.can_write_employee_request_form(created_by)
);

drop policy if exists "employee_request_form_delete_scoped" on public.employee_request_form;
create policy "employee_request_form_delete_scoped"
on public.employee_request_form
for delete
to authenticated
using (
  public.can_write_employee_request_form(created_by)
);

alter table if exists public.approval_chains enable row level security;
drop policy if exists "approval_chains_select_scoped" on public.approval_chains;
create policy "approval_chains_select_scoped"
on public.approval_chains
for select
to authenticated
using (
  public.can_access_approval_chain(id)
);

drop policy if exists "approval_chains_insert_scoped" on public.approval_chains;
create policy "approval_chains_insert_scoped"
on public.approval_chains
for insert
to authenticated
with check (
  public.can_write_employee_request_form(
    public.employee_request_form_owner(employee_request_form_id)
  )
);

drop policy if exists "approval_chains_update_scoped" on public.approval_chains;
create policy "approval_chains_update_scoped"
on public.approval_chains
for update
to authenticated
using (
  (
    public.has_permission('approval:action')
    and public.is_chain_assigned_to_current_user(id)
  )
  or public.can_write_employee_request_form(
    public.employee_request_form_owner(employee_request_form_id)
  )
)
with check (
  (
    public.has_permission('approval:action')
    and public.is_chain_assigned_to_current_user(id)
  )
  or public.can_access_employee_request_form(
    public.employee_request_form_owner(employee_request_form_id)
  )
);

drop policy if exists "approval_chains_delete_scoped" on public.approval_chains;
create policy "approval_chains_delete_scoped"
on public.approval_chains
for delete
to authenticated
using (
  public.can_write_employee_request_form(
    public.employee_request_form_owner(employee_request_form_id)
  )
);

alter table if exists public.approval_steps enable row level security;
drop policy if exists "approval_steps_select_scoped" on public.approval_steps;
create policy "approval_steps_select_scoped"
on public.approval_steps
for select
to authenticated
using (
  public.can_access_approval_chain(chain_id)
);

drop policy if exists "approval_steps_insert_scoped" on public.approval_steps;
create policy "approval_steps_insert_scoped"
on public.approval_steps
for insert
to authenticated
with check (
  public.can_write_employee_request_form(
    public.employee_request_form_owner(
      public.approval_chain_employee_request_form_id(chain_id)
    )
  )
);

drop policy if exists "approval_steps_update_scoped" on public.approval_steps;
create policy "approval_steps_update_scoped"
on public.approval_steps
for update
to authenticated
using (
  public.has_permission('approval:action')
  and lower(coalesce(approver_email, '')) = public.current_user_email()
)
with check (
  public.has_permission('approval:action')
  and lower(coalesce(approver_email, '')) = public.current_user_email()
);

drop policy if exists "approval_steps_delete_scoped" on public.approval_steps;
create policy "approval_steps_delete_scoped"
on public.approval_steps
for delete
to authenticated
using (
  public.can_write_employee_request_form(
    public.employee_request_form_owner(
      public.approval_chain_employee_request_form_id(chain_id)
    )
  )
);

alter table if exists public.approver_master enable row level security;
drop policy if exists "approver_master_select_internal" on public.approver_master;
create policy "approver_master_select_internal"
on public.approver_master
for select
to authenticated
using (
  public.is_internal_user()
);

drop policy if exists "approver_master_write_approval_read" on public.approver_master;
create policy "approver_master_write_approval_read"
on public.approver_master
for all
to authenticated
using (
  public.has_permission('approval:read')
)
with check (
  public.has_permission('approval:read')
);

do $$
declare
  target_table text;
begin
  for target_table in
    select unnest(array[
      'master_bu',
      'master_department',
      'master_designation',
      'master_job_level',
      'master_pt',
      'master_custom_grup_1',
      'master_custom_grup_2',
      'master_custom_grup_3',
      'master_custom_grup_4',
      'master_custom_grup_5',
      'master_custom_grup_6'
    ])
  loop
    if to_regclass(format('public.%I', target_table)) is null then
      continue;
    end if;

    execute format(
      'alter table public.%I enable row level security',
      target_table
    );

    execute format(
      'drop policy if exists %I on public.%I',
      target_table || '_select_authenticated',
      target_table
    );

    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      target_table || '_select_authenticated',
      target_table
    );

    execute format(
      'drop policy if exists %I on public.%I',
      target_table || '_write_managed',
      target_table
    );

    execute format(
      'create policy %I on public.%I for all to authenticated using (public.has_permission(''user:read'') or public.has_permission(''role:manage'')) with check (public.has_permission(''user:read'') or public.has_permission(''role:manage''))',
      target_table || '_write_managed',
      target_table
    );
  end loop;
end $$;

do $$
begin
  if to_regclass('public.candidate_account_projection') is not null then
    execute 'alter table public.candidate_account_projection enable row level security';
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
    execute 'alter table public.candidate_application_projection enable row level security';
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
