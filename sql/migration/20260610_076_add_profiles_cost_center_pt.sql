begin;

alter table if exists public.profiles
  add column if not exists cost_center_pt text;

update public.profiles
set cost_center_pt = nullif(btrim(coalesce(cost_center_pt, personal_data ->> 'cost_center_pt')), '')
where cost_center_pt is null
  and nullif(btrim(personal_data ->> 'cost_center_pt'), '') is not null;

commit;
