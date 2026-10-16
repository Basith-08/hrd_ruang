begin;

create type public.education_level_enum_v2 as enum (
  'SD / Sederajat',
  'SMP / MTs / Sederajat',
  'SMA / SMK / MA / Sederajat',
  'Diploma I (D1)',
  'Diploma II (D2)',
  'Diploma III (D3)',
  'Diploma IV (D4)',
  'Sarjana (S1)',
  'Magister (S2)',
  'Doktor (S3)'
);

alter table public.education
  alter column level drop default;

alter table public.education
  alter column level type public.education_level_enum_v2
  using (
    case
      when level is null then null
      when level::text in ('Elementary', 'SD', 'SD / Sederajat') then 'SD / Sederajat'::public.education_level_enum_v2
      when level::text in ('Junior High', 'SMP', 'SMP / MTs / Sederajat') then 'SMP / MTs / Sederajat'::public.education_level_enum_v2
      when level::text in ('Senior High', 'SMA', 'SMA / SMK / MA / Sederajat') then 'SMA / SMK / MA / Sederajat'::public.education_level_enum_v2
      when level::text in ('Diploma', 'Diploma I (D1)') then 'Diploma I (D1)'::public.education_level_enum_v2
      when level::text = 'Diploma II (D2)' then 'Diploma II (D2)'::public.education_level_enum_v2
      when level::text = 'Diploma III (D3)' then 'Diploma III (D3)'::public.education_level_enum_v2
      when level::text = 'Diploma IV (D4)' then 'Diploma IV (D4)'::public.education_level_enum_v2
      when level::text in ('Bachelor', 'S1', 'Sarjana (S1)') then 'Sarjana (S1)'::public.education_level_enum_v2
      when level::text in ('Master', 'S2', 'Magister (S2)') then 'Magister (S2)'::public.education_level_enum_v2
      when level::text in ('Doctorate', 'S3', 'Doktor (S3)') then 'Doktor (S3)'::public.education_level_enum_v2
      else null
    end
  );

drop type if exists public.education_level_enum;

alter type public.education_level_enum_v2 rename to education_level_enum;

commit;
