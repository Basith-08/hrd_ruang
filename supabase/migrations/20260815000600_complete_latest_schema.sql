-- Complements the older public-schema snapshot with application migrations
-- that are required by the current HRD Ruang application.
begin;

alter table public.employee_request_form
  add column if not exists notes text;

alter table public.interview_evaluation_forms
  add column if not exists notes text;

alter table public.interview_evaluation_forms
  alter column interview_date type timestamp without time zone
  using interview_date::timestamp without time zone;

create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  email text not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone not null default now(),
  used_at timestamp with time zone
);

create index if not exists idx_password_reset_tokens_token
  on public.password_reset_tokens(token);
create index if not exists idx_password_reset_tokens_user_id
  on public.password_reset_tokens(user_id);
create index if not exists idx_password_reset_tokens_expires_at
  on public.password_reset_tokens(expires_at);

alter table public.password_reset_tokens enable row level security;

drop policy if exists "Allow authenticated users to view their own tokens"
  on public.password_reset_tokens;
drop policy if exists "Allow insert for password reset"
  on public.password_reset_tokens;
drop policy if exists "Allow update used_at"
  on public.password_reset_tokens;

create policy "Allow authenticated users to view their own tokens"
  on public.password_reset_tokens
  for select
  using (auth.uid() = user_id);

create policy "Allow insert for password reset"
  on public.password_reset_tokens
  for insert
  with check (true);

create policy "Allow update used_at"
  on public.password_reset_tokens
  for update
  using (true)
  with check (true);

commit;

begin;

update storage.buckets
set allowed_mime_types = (
  select array_agg(distinct mime_type)
  from unnest(
    coalesce(allowed_mime_types, '{}'::text[]) || array[
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  ) as mime_type
)
where id = 'candidate-documents'
  and allowed_mime_types is not null;

commit;
