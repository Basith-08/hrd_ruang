-- ACTIVE / FINAL
-- Adds candidate interview evaluation tables together with module permissions.

begin;

create table if not exists public.interview_evaluation_forms (
  id uuid primary key default gen_random_uuid(),
  employee_request_form_id uuid references public.employee_request_form(id) on delete set null,
  candidate_service_candidate_id uuid,
  candidate_service_application_id uuid,
  candidate_name text not null,
  applied_position text,
  interviewer_name text not null,
  interview_date date not null,
  comments text,
  recommendation text check (
    recommendation in (
      'continue_recruitment',
      'find_comparison_candidate',
      'stop_recruitment',
      'save_as_candidate_database'
    ) or recommendation is null
  ),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.interview_evaluation_scores (
  id uuid primary key default gen_random_uuid(),
  interview_evaluation_form_id uuid not null references public.interview_evaluation_forms(id) on delete cascade,
  item_number integer not null check (item_number between 1 and 10),
  category_title text not null,
  category_description text not null,
  score integer check (score between 1 and 10 or score is null),
  info text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint interview_evaluation_scores_form_item_key unique (interview_evaluation_form_id, item_number)
);

create index if not exists idx_interview_evaluation_forms_employee_request_form_id
  on public.interview_evaluation_forms(employee_request_form_id);

create index if not exists idx_interview_evaluation_forms_candidate_service_candidate_id
  on public.interview_evaluation_forms(candidate_service_candidate_id);

create index if not exists idx_interview_evaluation_scores_form_id
  on public.interview_evaluation_scores(interview_evaluation_form_id);

insert into public.permissions (name, description)
values
  ('interview_evaluation:create', 'Create interview evaluation forms'),
  ('interview_evaluation:read', 'View interview evaluation forms'),
  ('interview_evaluation:update', 'Update interview evaluation forms'),
  ('interview_evaluation:delete', 'Delete interview evaluation forms')
on conflict (name) do update
set description = excluded.description;

alter table public.interview_evaluation_forms enable row level security;
alter table public.interview_evaluation_scores enable row level security;

drop policy if exists interview_evaluation_forms_select on public.interview_evaluation_forms;
create policy interview_evaluation_forms_select
on public.interview_evaluation_forms
for select
to authenticated
using (public.has_permission('interview_evaluation:read'));

drop policy if exists interview_evaluation_forms_insert on public.interview_evaluation_forms;
create policy interview_evaluation_forms_insert
on public.interview_evaluation_forms
for insert
to authenticated
with check (public.has_permission('interview_evaluation:create'));

drop policy if exists interview_evaluation_forms_update on public.interview_evaluation_forms;
create policy interview_evaluation_forms_update
on public.interview_evaluation_forms
for update
to authenticated
using (public.has_permission('interview_evaluation:update'))
with check (public.has_permission('interview_evaluation:update'));

drop policy if exists interview_evaluation_forms_delete on public.interview_evaluation_forms;
create policy interview_evaluation_forms_delete
on public.interview_evaluation_forms
for delete
to authenticated
using (public.has_permission('interview_evaluation:delete'));

drop policy if exists interview_evaluation_scores_select on public.interview_evaluation_scores;
create policy interview_evaluation_scores_select
on public.interview_evaluation_scores
for select
to authenticated
using (public.has_permission('interview_evaluation:read'));

drop policy if exists interview_evaluation_scores_insert on public.interview_evaluation_scores;
create policy interview_evaluation_scores_insert
on public.interview_evaluation_scores
for insert
to authenticated
with check (public.has_permission('interview_evaluation:create'));

drop policy if exists interview_evaluation_scores_update on public.interview_evaluation_scores;
create policy interview_evaluation_scores_update
on public.interview_evaluation_scores
for update
to authenticated
using (public.has_permission('interview_evaluation:update'))
with check (public.has_permission('interview_evaluation:update'));

drop policy if exists interview_evaluation_scores_delete on public.interview_evaluation_scores;
create policy interview_evaluation_scores_delete
on public.interview_evaluation_scores
for delete
to authenticated
using (public.has_permission('interview_evaluation:delete'));

drop trigger if exists trg_set_updated_at__interview_evaluation_forms on public.interview_evaluation_forms;
create trigger trg_set_updated_at__interview_evaluation_forms
before update on public.interview_evaluation_forms
for each row execute function public.set_updated_at();

drop trigger if exists trg_set_updated_at__interview_evaluation_scores on public.interview_evaluation_scores;
create trigger trg_set_updated_at__interview_evaluation_scores
before update on public.interview_evaluation_scores
for each row execute function public.set_updated_at();

commit;
