insert into public.permissions (name, description)
values ('user_history:read', 'View user management history')
on conflict (name) do update
set description = excluded.description;
