begin;

create table if not exists public.export_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text null,
  description text null,
  file_name text not null,
  file_path text not null,
  storage_bucket text not null default 'export-templates',
  detected_fields jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.export_template_fields (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.export_templates(id) on delete cascade,
  field_key text not null,
  field_label text null,
  source_type text not null default 'auto',
  source_path text null,
  field_type text not null default 'text',
  is_required boolean not null default false,
  is_editable boolean not null default true,
  default_value text null,
  created_at timestamptz not null default now()
);

create table if not exists public.generated_exports (
  id uuid primary key default gen_random_uuid(),
  template_id uuid null references public.export_templates(id) on delete set null,
  candidate_id uuid null,
  file_name text not null,
  file_path text null,
  payload jsonb not null,
  generated_by uuid null,
  created_at timestamptz not null default now()
);

create index if not exists idx_export_template_fields_template_id
  on public.export_template_fields(template_id);

create index if not exists idx_generated_exports_template_id
  on public.generated_exports(template_id);

create index if not exists idx_generated_exports_candidate_id
  on public.generated_exports(candidate_id);

create unique index if not exists uq_export_template_fields_template_id_field_key
  on public.export_template_fields(template_id, field_key);

drop trigger if exists trg_set_updated_at__export_templates on public.export_templates;
create trigger trg_set_updated_at__export_templates
before update on public.export_templates
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'export-templates',
  'export-templates',
  false,
  10485760,
  array['application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

commit;
