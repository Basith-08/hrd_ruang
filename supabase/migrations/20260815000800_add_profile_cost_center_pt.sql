begin;

alter table public.profiles
  add column if not exists cost_center_pt_id uuid;

create index if not exists idx_profiles_cost_center_pt_id
  on public.profiles(cost_center_pt_id);

commit;
