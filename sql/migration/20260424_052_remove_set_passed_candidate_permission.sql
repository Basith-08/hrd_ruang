delete from public.role_permissions
where permission_id in (
  select id
  from public.permissions
  where name = 'employee_request_form:set_passed_candidate'
);

delete from public.permissions
where name = 'employee_request_form:set_passed_candidate';
