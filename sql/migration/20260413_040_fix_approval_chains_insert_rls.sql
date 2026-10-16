-- ACTIVE / FINAL
-- Fix the `approval_chains_insert_scoped` RLS policy so that any user who has
-- write access to an ERF (manager-owner OR non-manager with write permission)
-- can insert an approval chain for it.
--
-- Root cause: the previous `can_write_employee_request_form` helper was
-- evaluated correctly in theory, but direct client-side inserts (not going
-- through the service-role server route) could fail in edge cases where the
-- function's internal ERF sub-query result was not visible to RLS at check-time.
--
-- The recommended flow is now:
--   - Approval chain creation goes through `POST /approval/start-chain`
--     (the Nuxt server route) which uses the admin/service-role client
--     and therefore bypasses RLS entirely.
--   - This migration adds a supplementary direct-write policy so that
--     staff users with `employee_request_form:create` (or similar) can
--     also insert directly if needed, matching the application logic in
--     `can_write_employee_request_form`.

begin;

drop policy if exists "approval_chains_insert_scoped" on public.approval_chains;
create policy "approval_chains_insert_scoped"
on public.approval_chains
for insert
to authenticated
with check (
  -- Manager: may only create a chain for their own ERF
  (
    public.is_manager()
    and public.employee_request_form_owner(employee_request_form_id) = auth.uid()
  )
  -- Non-manager: any ERF write permission is sufficient
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

commit;
