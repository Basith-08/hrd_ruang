ALTER TABLE IF EXISTS public.employee_request_form
  ADD COLUMN IF NOT EXISTS approval_director_bu_id uuid;

ALTER TABLE IF EXISTS public.employee_request_form
  DROP CONSTRAINT IF EXISTS employee_request_form_approval_director_bu_id_fkey;

ALTER TABLE IF EXISTS public.employee_request_form
  ADD CONSTRAINT employee_request_form_approval_director_bu_id_fkey
  FOREIGN KEY (approval_director_bu_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employee_request_form_approval_director_bu_id
  ON public.employee_request_form USING btree (approval_director_bu_id);
