-- ACTIVE / FINAL
-- Normalizes assigned interviewers into a dedicated table so each interviewer can be tracked separately.

begin;

create table if not exists public.interview_evaluation_interviewers (
  id uuid primary key default gen_random_uuid(),
  interview_evaluation_form_id uuid not null references public.interview_evaluation_forms(id) on delete cascade,
  interviewer_user_id uuid references public.profiles(id) on delete set null,
  interviewer_name text not null,
  interviewer_email text,
  interviewer_job_level text,
  interviewer_label text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint interview_evaluation_interviewers_name_not_blank
    check (btrim(interviewer_name) <> ''),
  constraint interview_evaluation_interviewers_label_not_blank
    check (btrim(interviewer_label) <> '')
);

create index if not exists idx_interview_evaluation_interviewers_form_id
  on public.interview_evaluation_interviewers(interview_evaluation_form_id);

create index if not exists idx_interview_evaluation_interviewers_user_id
  on public.interview_evaluation_interviewers(interviewer_user_id);

create unique index if not exists idx_interview_evaluation_interviewers_form_label_unique
  on public.interview_evaluation_interviewers(interview_evaluation_form_id, interviewer_label);

insert into public.interview_evaluation_interviewers (
  interview_evaluation_form_id,
  interviewer_user_id,
  interviewer_name,
  interviewer_email,
  interviewer_job_level,
  interviewer_label
)
select
  form.id,
  case
    when btrim(coalesce(recipient ->> 'user_id', '')) ~* '^[0-9a-f-]{8}-[0-9a-f-]{4}-[1-5][0-9a-f-]{3}-[89ab][0-9a-f-]{3}-[0-9a-f-]{12}$'
      then (recipient ->> 'user_id')::uuid
    else null
  end,
  coalesce(
    nullif(btrim(recipient ->> 'name'), ''),
    nullif(btrim(recipient ->> 'label'), '')
  ),
  nullif(btrim(recipient ->> 'email'), ''),
  nullif(btrim(recipient ->> 'job_level'), ''),
  coalesce(
    nullif(btrim(recipient ->> 'label'), ''),
    nullif(btrim(recipient ->> 'name'), '')
  )
from public.interview_evaluation_forms form
cross join lateral jsonb_array_elements(
  case
    when jsonb_typeof(form.interviewer_recipients) = 'array' then form.interviewer_recipients
    else '[]'::jsonb
  end
) as recipient
where coalesce(
  nullif(btrim(recipient ->> 'label'), ''),
  nullif(btrim(recipient ->> 'name'), '')
) is not null
on conflict (interview_evaluation_form_id, interviewer_label) do nothing;

insert into public.interview_evaluation_interviewers (
  interview_evaluation_form_id,
  interviewer_name,
  interviewer_label
)
select
  form.id,
  btrim(form.interviewer_name),
  btrim(form.interviewer_name)
from public.interview_evaluation_forms form
where btrim(coalesce(form.interviewer_name, '')) <> ''
  and not exists (
    select 1
    from public.interview_evaluation_interviewers interviewer
    where interviewer.interview_evaluation_form_id = form.id
  )
on conflict (interview_evaluation_form_id, interviewer_label) do nothing;

alter table public.interview_evaluation_interviewers enable row level security;

drop policy if exists interview_evaluation_interviewers_select on public.interview_evaluation_interviewers;
create policy interview_evaluation_interviewers_select
on public.interview_evaluation_interviewers
for select
to authenticated
using (
  public.has_permission('interview_evaluation:read')
  or public.has_permission('interview_evaluation:interviewer_form')
  or public.has_permission('interview_evaluation:update')
);

drop policy if exists interview_evaluation_interviewers_insert on public.interview_evaluation_interviewers;
create policy interview_evaluation_interviewers_insert
on public.interview_evaluation_interviewers
for insert
to authenticated
with check (public.has_permission('interview_evaluation:create'));

drop policy if exists interview_evaluation_interviewers_update on public.interview_evaluation_interviewers;
create policy interview_evaluation_interviewers_update
on public.interview_evaluation_interviewers
for update
to authenticated
using (public.has_permission('interview_evaluation:update'))
with check (public.has_permission('interview_evaluation:update'));

drop policy if exists interview_evaluation_interviewers_delete on public.interview_evaluation_interviewers;
create policy interview_evaluation_interviewers_delete
on public.interview_evaluation_interviewers
for delete
to authenticated
using (public.has_permission('interview_evaluation:delete'));

drop trigger if exists trg_set_updated_at__interview_evaluation_interviewers on public.interview_evaluation_interviewers;
create trigger trg_set_updated_at__interview_evaluation_interviewers
before update on public.interview_evaluation_interviewers
for each row execute function public.set_updated_at();

commit;
