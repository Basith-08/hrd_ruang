-- Data referensi generik untuk instalasi awal.
-- Bukan data resmi perusahaan; silakan ganti dari menu Master Data.
begin;

insert into public.master_pt (name, address, description)
values (
  'PT Contoh Nusantara',
  'Jakarta, Indonesia',
  'SEED referensi generik - bukan data resmi perusahaan.'
)
on conflict (name) do nothing;

insert into public.master_bu (name, description)
values
  ('Corporate', 'SEED referensi generik - fungsi korporat.'),
  ('Operations', 'SEED referensi generik - fungsi operasional.'),
  ('Commercial', 'SEED referensi generik - fungsi komersial.'),
  ('Technology', 'SEED referensi generik - fungsi teknologi.')
on conflict (name) do nothing;

insert into public.master_department (bu_id, name, description)
select bu.id, source.name, source.description
from (
  values
    ('Corporate', 'Human Resources', 'SEED referensi generik - departemen HR.'),
    ('Corporate', 'Finance', 'SEED referensi generik - departemen keuangan.'),
    ('Operations', 'Operations', 'SEED referensi generik - departemen operasional.'),
    ('Technology', 'Information Technology', 'SEED referensi generik - departemen teknologi informasi.'),
    ('Commercial', 'Sales & Marketing', 'SEED referensi generik - departemen penjualan dan pemasaran.')
) as source(bu_name, name, description)
join public.master_bu bu on bu.name = source.bu_name
where not exists (
  select 1
  from public.master_department existing
  where existing.name = source.name
);

insert into public.master_job_level (name, description, required_date_min_months)
values
  ('Staff', 'SEED referensi generik - level staf.', null),
  ('Senior Staff', 'SEED referensi generik - level senior staf.', null),
  ('Supervisor', 'SEED referensi generik - level supervisor.', null),
  ('Assistant Manager', 'SEED referensi generik - level assistant manager.', null),
  ('Manager', 'SEED referensi generik - level manager.', null),
  ('Senior Manager', 'SEED referensi generik - level senior manager.', null),
  ('General Manager', 'SEED referensi generik - level general manager.', null),
  ('Director', 'SEED referensi generik - level direktur.', null)
on conflict (name) do nothing;

insert into public.master_designation (name, description, required_date_min_months, job_level_id)
select source.name, source.description, null, level.id
from (
  values
    ('HR Staff', 'Staff', 'SEED referensi generik - jabatan HR.'),
    ('Recruitment Staff', 'Staff', 'SEED referensi generik - jabatan rekrutmen.'),
    ('HR Supervisor', 'Supervisor', 'SEED referensi generik - jabatan HR.'),
    ('HR Manager', 'Manager', 'SEED referensi generik - jabatan HR.'),
    ('Finance Staff', 'Staff', 'SEED referensi generik - jabatan keuangan.'),
    ('IT Staff', 'Staff', 'SEED referensi generik - jabatan teknologi informasi.'),
    ('Operations Staff', 'Staff', 'SEED referensi generik - jabatan operasional.'),
    ('Sales Staff', 'Staff', 'SEED referensi generik - jabatan penjualan.'),
    ('Marketing Staff', 'Staff', 'SEED referensi generik - jabatan pemasaran.')
) as source(name, level_name, description)
join public.master_job_level level on level.name = source.level_name
where not exists (
  select 1
  from public.master_designation existing
  where existing.name = source.name
);

commit;
