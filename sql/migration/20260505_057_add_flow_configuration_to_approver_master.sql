begin;

alter table public.approver_master
  add column if not exists approval_flow_key text,
  add column if not exists approval_role_key text,
  add column if not exists approval_role_label text;

update public.approver_master
set
  approval_flow_key = coalesce(nullif(trim(approval_flow_key), ''), 'legacy'),
  approval_role_key = coalesce(
    nullif(trim(approval_role_key), ''),
    case
      when step_order = 1 then 'legacy_step_1'
      when step_order = 2 then 'legacy_step_2'
      else 'legacy_step_' || step_order::text
    end
  ),
  approval_role_label = coalesce(
    nullif(trim(approval_role_label), ''),
    case
      when step_order = 1 then 'Legacy Approval Step 1'
      when step_order = 2 then 'Legacy Approval Step 2'
      else 'Legacy Approval Step ' || step_order::text
    end
  )
where
  approval_flow_key is null
  or approval_role_key is null
  or approval_role_label is null
  or trim(approval_flow_key) = ''
  or trim(approval_role_key) = ''
  or trim(approval_role_label) = '';

alter table public.approver_master
  alter column approval_flow_key set not null,
  alter column approval_role_key set not null,
  alter column approval_role_label set not null;

create unique index if not exists idx_approver_master_flow_step_unique
  on public.approver_master(approval_flow_key, step_order);

create unique index if not exists idx_approver_master_flow_role_unique
  on public.approver_master(approval_flow_key, approval_role_key);

commit;
