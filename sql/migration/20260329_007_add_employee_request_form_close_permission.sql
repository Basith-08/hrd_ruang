insert into public.permissions (name, description)
values ('employee_request_form:close', 'Close employee request forms')
on conflict (name) do update
set description = excluded.description;
