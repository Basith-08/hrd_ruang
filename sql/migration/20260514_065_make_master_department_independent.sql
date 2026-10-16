ALTER TABLE IF EXISTS public.master_department
  DROP CONSTRAINT IF EXISTS master_department_name_bu_id_key;

DROP INDEX IF EXISTS public.idx_master_department_bu_id;

ALTER TABLE IF EXISTS public.master_department
  ALTER COLUMN bu_id DROP NOT NULL;
