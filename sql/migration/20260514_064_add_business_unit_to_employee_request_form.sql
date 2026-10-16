ALTER TABLE IF EXISTS public.employee_request_form
  ADD COLUMN IF NOT EXISTS bu_id uuid;

UPDATE public.employee_request_form erf
SET bu_id = department.bu_id
FROM public.master_department department
WHERE erf.bu_id IS NULL
  AND erf.department_id = department.id
  AND department.bu_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.master_bu bu
    WHERE bu.id = department.bu_id
  );

ALTER TABLE IF EXISTS public.employee_request_form
  DROP CONSTRAINT IF EXISTS employee_request_form_bu_id_fkey;

ALTER TABLE IF EXISTS public.employee_request_form
  ADD CONSTRAINT employee_request_form_bu_id_fkey
  FOREIGN KEY (bu_id) REFERENCES public.master_bu(id);

CREATE INDEX IF NOT EXISTS idx_employee_request_form_bu_id
  ON public.employee_request_form USING btree (bu_id);
