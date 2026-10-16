insert into public.permissions (name, description)
values (
  'interview_evaluation:interviewer_form',
  'Access interviewer assignments and submit assigned interview evaluations'
)
on conflict (name) do update
set description = excluded.description;
