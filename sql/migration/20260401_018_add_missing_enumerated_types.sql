begin;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'employment_status_enum'
  ) then
    create type public.employment_status_enum as enum (
      'Daily',
      'Probation',
      'Contract'
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'position_status_enum'
  ) then
    create type public.position_status_enum as enum (
      'Replacement',
      'New Position MPP',
      'New Position Non-MPP',
      'Internship'
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'gender_enum'
  ) then
    create type public.gender_enum as enum (
      'Male',
      'Female'
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'marital_status_enum'
  ) then
    create type public.marital_status_enum as enum (
      'Single',
      'Married',
      'Divorced'
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'blood_type_enum'
  ) then
    create type public.blood_type_enum as enum (
      'A',
      'B',
      'AB',
      'O'
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'language_proficiency_level'
  ) then
    create type public.language_proficiency_level as enum (
      'good',
      'fair',
      'poor'
    );
  end if;
end $$;

comment on type public.employment_status_enum is
  'Employment status values used by employee_request_form.employment_status.';
comment on type public.position_status_enum is
  'Position status values used by employee_request_form.position_status.';
comment on type public.gender_enum is
  'Gender values used by candidate and family related tables.';
comment on type public.marital_status_enum is
  'Marital status values used by candidate_form.marital_status.';
comment on type public.blood_type_enum is
  'Blood type values used by candidate_form.blood_type.';
comment on type public.language_proficiency_level is
  'Language proficiency values used by candidate_languages speaking/reading/listening/writing.';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'employee_request_form'
      and column_name = 'employment_status'
      and udt_name <> 'employment_status_enum'
  ) then
    alter table public.employee_request_form
      alter column employment_status type public.employment_status_enum
      using (
        case
          when employment_status is null then null
          when employment_status::text = 'Daily' then 'Daily'::public.employment_status_enum
          when employment_status::text = 'Probation' then 'Probation'::public.employment_status_enum
          when employment_status::text = 'Contract' then 'Contract'::public.employment_status_enum
          else null
        end
      );
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'employee_request_form'
      and column_name = 'position_status'
      and udt_name <> 'position_status_enum'
  ) then
    alter table public.employee_request_form
      alter column position_status type public.position_status_enum
      using (
        case
          when position_status is null then null
          when position_status::text = 'Replacement' then 'Replacement'::public.position_status_enum
          when position_status::text = 'New Position MPP' then 'New Position MPP'::public.position_status_enum
          when position_status::text = 'New Position Non-MPP' then 'New Position Non-MPP'::public.position_status_enum
          when position_status::text = 'Internship' then 'Internship'::public.position_status_enum
          else null
        end
      );
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'candidate_form'
      and column_name = 'gender'
      and udt_name <> 'gender_enum'
  ) then
    alter table public.candidate_form
      alter column gender type public.gender_enum
      using (
        case
          when gender is null then null
          when gender::text = 'Male' then 'Male'::public.gender_enum
          when gender::text = 'Female' then 'Female'::public.gender_enum
          else null
        end
      );
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'family_and_emergency'
      and column_name = 'gender'
      and udt_name <> 'gender_enum'
  ) then
    alter table public.family_and_emergency
      alter column gender type public.gender_enum
      using (
        case
          when gender is null then null
          when gender::text = 'Male' then 'Male'::public.gender_enum
          when gender::text = 'Female' then 'Female'::public.gender_enum
          else null
        end
      );
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'candidate_form'
      and column_name = 'marital_status'
      and udt_name <> 'marital_status_enum'
  ) then
    alter table public.candidate_form
      alter column marital_status type public.marital_status_enum
      using (
        case
          when marital_status is null then null
          when marital_status::text = 'Single' then 'Single'::public.marital_status_enum
          when marital_status::text = 'Married' then 'Married'::public.marital_status_enum
          when marital_status::text = 'Divorced' then 'Divorced'::public.marital_status_enum
          else null
        end
      );
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'candidate_form'
      and column_name = 'blood_type'
      and udt_name <> 'blood_type_enum'
  ) then
    alter table public.candidate_form
      alter column blood_type type public.blood_type_enum
      using (
        case
          when blood_type is null then null
          when blood_type::text = 'A' then 'A'::public.blood_type_enum
          when blood_type::text = 'B' then 'B'::public.blood_type_enum
          when blood_type::text = 'AB' then 'AB'::public.blood_type_enum
          when blood_type::text = 'O' then 'O'::public.blood_type_enum
          else null
        end
      );
  end if;
end $$;

do $$
declare
  proficiency_column text;
begin
  for proficiency_column in
    select unnest(array['speaking', 'reading', 'listening', 'writing'])
  loop
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'candidate_languages'
        and column_name = proficiency_column
        and udt_name <> 'language_proficiency_level'
    ) then
      execute format(
        $sql$
          alter table public.candidate_languages
            alter column %I type public.language_proficiency_level
            using (
              case
                when %1$I is null then null
                when lower(%1$I::text) = 'good' then 'good'::public.language_proficiency_level
                when lower(%1$I::text) = 'fair' then 'fair'::public.language_proficiency_level
                when lower(%1$I::text) = 'poor' then 'poor'::public.language_proficiency_level
                else null
              end
            )
        $sql$,
        proficiency_column
      );
    end if;
  end loop;
end $$;

commit;
