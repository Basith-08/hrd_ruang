begin;

insert into public.permissions (name, description)
values (
  'approval:tracking_all',
  'View all approval tracking data across users'
)
on conflict (name) do update
set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select distinct
  r.id as role_id,
  p.id as permission_id
from public.roles r
join public.permissions p
  on p.name = 'approval:tracking_all'
where lower(coalesce(r.name, '')) in ('admin', 'administrator', 'super admin', 'super_admin')
on conflict do nothing;

create or replace function public.can_access_approval_chain(approval_chain_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
    and (
      public.has_permission('approval:tracking_all')
      or (
        public.is_manager()
        and public.employee_request_form_owner(
          public.approval_chain_employee_request_form_id(approval_chain_id)
        ) = auth.uid()
      )
      or public.is_chain_assigned_to_current_user(approval_chain_id)
    );
$$;

comment on function public.can_access_approval_chain(uuid) is
  'Returns true when the current user can read an approval chain through approval:tracking_all, ERF ownership, or assigned approver email.';

commit;
