-- ACTIVE / FINAL
-- Stores recommendation/comments/scores per interviewer assignment instead of sharing one result at form level.

begin;

alter table public.interview_evaluation_interviewers
  add column if not exists comments text;

alter table public.interview_evaluation_interviewers
  add column if not exists recommendation text;

alter table public.interview_evaluation_interviewers
  drop constraint if exists interview_evaluation_interviewers_recommendation_check;

alter table public.interview_evaluation_interviewers
  add constraint interview_evaluation_interviewers_recommendation_check
  check (
    recommendation in (
      'continue_recruitment',
      'find_comparison_candidate',
      'stop_recruitment',
      'save_as_candidate_database'-- ACTIVE / FINAL
-- Stores recommendation/comments/scores per interviewer assignment instead of sharing one result at form level.

begin;

alter table public.interview_evaluation_interviewers
  add column if not exists comments text;

alter table public.interview_evaluation_interviewers
  add column if not exists recommendation text;

alter table public.interview_evaluation_interviewers
  drop constraint if exists interview_evaluation_interviewers_recommendation_check;

alter table public.interview_evaluation_interviewers
  add constraint interview_evaluation_interviewers_recommendation_check
  check (
    recommendation in (
      'continue_recruitment',
      'find_comparison_candidate',
      'stop_recruitment',
      'save_as_candidate_database'
    ) or recommendation is null
  );

create table if not exists public.interview_evaluation_interviewer_scores (
  id uuid primary key default gen_random_uuid(),
  interview_evaluation_interviewer_id uuid not null references public.interview_evaluation_interviewers(id) on delete cascade,
  item_number integer not null check (item_number between 1 and 10),
  category_title text not null,
  category_description text not null,
  score integer check (score between 1 and 6 or score is null),
  info text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint interview_evaluation_interviewer_scores_unique_item
    unique (interview_evaluation_interviewer_id, item_number)
);

create index if not exists idx_interview_evaluation_interviewer_scores_interviewer_id
  on public.interview_evaluation_interviewer_scores(interview_evaluation_interviewer_id);

with candidate_interviewers as (
  select
    interviewer.id as interviewer_id,
    interviewer.interview_evaluation_form_id,
    row_number() over (
      partition by interviewer.interview_evaluation_form_id
      order by interviewer.created_at asc, interviewer.id asc
    ) as interviewer_rank
  from public.interview_evaluation_interviewers interviewer
)
update public.interview_evaluation_interviewers interviewer
set
  comments = form.comments,
  recommendation = form.recommendation
from candidate_interviewers ranked
join public.interview_evaluation_forms form
  on form.id = ranked.interview_evaluation_form_id
where interviewer.id = ranked.interviewer_id
  and ranked.interviewer_rank = 1
  and (form.comments is not null or form.recommendation is not null);

insert into public.interview_evaluation_interviewer_scores (
  interview_evaluation_interviewer_id,
  item_number,
  category_title,
  category_description,
  score,
  info
)
select
  ranked.interviewer_id,
  score.item_number,
  score.category_title,
  score.category_description,
  score.score,
  score.info
from (
  select
    interviewer.id as interviewer_id,
    interviewer.interview_evaluation_form_id,
    row_number() over (
      partition by interviewer.interview_evaluation_form_id
      order by interviewer.created_at asc, interviewer.id asc
    ) as interviewer_rank
  from public.interview_evaluation_interviewers interviewer
) ranked
join public.interview_evaluation_scores score
  on score.interview_evaluation_form_id = ranked.interview_evaluation_form_id
where ranked.interviewer_rank = 1
on conflict (interview_evaluation_interviewer_id, item_number) do nothing;

alter table public.interview_evaluation_interviewer_scores enable row level security;

drop policy if exists interview_evaluation_interviewer_scores_select on public.interview_evaluation_interviewer_scores;
create policy interview_evaluation_interviewer_scores_select
on public.interview_evaluation_interviewer_scores
for select
to authenticated
using (
  public.has_permission('interview_evaluation:read')
  or public.has_permission('interview_evaluation:interviewer_form')
  or public.has_permission('interview_evaluation:update')
);

drop policy if exists interview_evaluation_interviewer_scores_insert on public.interview_evaluation_interviewer_scores;
create policy interview_evaluation_interviewer_scores_insert
on public.interview_evaluation_interviewer_scores
for insert
to authenticated
with check (
  public.has_permission('interview_evaluation:create')
  or public.has_permission('interview_evaluation:update')
  or public.has_permission('interview_evaluation:interviewer_form')
);

drop policy if exists interview_evaluation_interviewer_scores_update on public.interview_evaluation_interviewer_scores;
create policy interview_evaluation_interviewer_scores_update
on public.interview_evaluation_interviewer_scores
for update
to authenticated
using (
  public.has_permission('interview_evaluation:update')
  or public.has_permission('interview_evaluation:interviewer_form')
)
with check (
  public.has_permission('interview_evaluation:update')
  or public.has_permission('interview_evaluation:interviewer_form')
);

drop policy if exists interview_evaluation_interviewer_scores_delete on public.interview_evaluation_interviewer_scores;
create policy interview_evaluation_interviewer_scores_delete
on public.interview_evaluation_interviewer_scores
for delete
to authenticated
using (
  public.has_permission('interview_evaluation:delete')
  or public.has_permission('interview_evaluation:update')
  or public.has_permission('interview_evaluation:interviewer_form')
);

drop trigger if exists trg_set_updated_at__interview_evaluation_interviewer_scores on public.interview_evaluation_interviewer_scores;
create trigger trg_set_updated_at__interview_evaluation_interviewer_scores
before update on public.interview_evaluation_interviewer_scores
for each row execute function public.set_updated_at();

commit;

    ) or recommendation is null
  );

create table if not exists public.interview_evaluation_interviewer_scores (
  id uuid primary key default gen_random_uuid(),
  interview_evaluation_interviewer_id uuid not null references public.interview_evaluation_interviewers(id) on delete cascade,
  item_number integer not null check (item_number between 1 and 10),
  category_title text not null,
  category_description text not null,
  score integer check (score between 1 and 6 or score is null),
  info text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint interview_evaluation_interviewer_scores_unique_item
    unique (interview_evaluation_interviewer_id, item_number)
);

create index if not exists idx_interview_evaluation_interviewer_scores_interviewer_id
  on public.interview_evaluation_interviewer_scores(interview_evaluation_interviewer_id);

with candidate_interviewers as (
  select
    interviewer.id as interviewer_id,
    interviewer.interview_evaluation_form_id,
    row_number() over (
      partition by interviewer.interview_evaluation_form_id
      order by interviewer.created_at asc, interviewer.id asc
    ) as interviewer_rank
  from public.interview_evaluation_interviewers interviewer
)
update public.interview_evaluation_interviewers interviewer
set
  comments = form.comments,
  recommendation = form.recommendation
from candidate_interviewers ranked
join public.interview_evaluation_forms form
  on form.id = ranked.interview_evaluation_form_id
where interviewer.id = ranked.interviewer_id
  and ranked.interviewer_rank = 1
  and (form.comments is not null or form.recommendation is not null);

insert into public.interview_evaluation_interviewer_scores (
  interview_evaluation_interviewer_id,
  item_number,
  category_title,
  category_description,
  score,
  info
)
select
  ranked.interviewer_id,
  score.item_number,
  score.category_title,
  score.category_description,
  score.score,
  score.info
from (
  select
    interviewer.id as interviewer_id,
    interviewer.interview_evaluation_form_id,
    row_number() over (
      partition by interviewer.interview_evaluation_form_id
      order by interviewer.created_at asc, interviewer.id asc
    ) as interviewer_rank
  from public.interview_evaluation_interviewers interviewer
) ranked
join public.interview_evaluation_scores score
  on score.interview_evaluation_form_id = ranked.interview_evaluation_form_id
where ranked.interviewer_rank = 1
on conflict (interview_evaluation_interviewer_id, item_number) do nothing;

alter table public.interview_evaluation_interviewer_scores enable row level security;

drop policy if exists interview_evaluation_interviewer_scores_select on public.interview_evaluation_interviewer_scores;
create policy interview_evaluation_interviewer_scores_select
on public.interview_evaluation_interviewer_scores
for select
to authenticated
using (
  public.has_permission('interview_evaluation:read')
  or public.has_permission('interview_evaluation:interviewer_form')
  or public.has_permission('interview_evaluation:update')
);

drop policy if exists interview_evaluation_interviewer_scores_insert on public.interview_evaluation_interviewer_scores;
create policy interview_evaluation_interviewer_scores_insert
on public.interview_evaluation_interviewer_scores
for insert
to authenticated
with check (
  public.has_permission('interview_evaluation:create')
  or public.has_permission('interview_evaluation:update')
  or public.has_permission('interview_evaluation:interviewer_form')
);

drop policy if exists interview_evaluation_interviewer_scores_update on public.interview_evaluation_interviewer_scores;
create policy interview_evaluation_interviewer_scores_update
on public.interview_evaluation_interviewer_scores
for update
to authenticated
using (
  public.has_permission('interview_evaluation:update')
  or public.has_permission('interview_evaluation:interviewer_form')
)
with check (
  public.has_permission('interview_evaluation:update')
  or public.has_permission('interview_evaluation:interviewer_form')
);

drop policy if exists interview_evaluation_interviewer_scores_delete on public.interview_evaluation_interviewer_scores;
create policy interview_evaluation_interviewer_scores_delete
on public.interview_evaluation_interviewer_scores
for delete
to authenticated
using (
  public.has_permission('interview_evaluation:delete')
  or public.has_permission('interview_evaluation:update')
  or public.has_permission('interview_evaluation:interviewer_form')
);

drop trigger if exists trg_set_updated_at__interview_evaluation_interviewer_scores on public.interview_evaluation_interviewer_scores;
create trigger trg_set_updated_at__interview_evaluation_interviewer_scores
before update on public.interview_evaluation_interviewer_scores
for each row execute function public.set_updated_at();

commit;
