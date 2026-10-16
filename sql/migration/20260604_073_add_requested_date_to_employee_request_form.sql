ALTER TABLE IF EXISTS public.employee_request_form
  ADD COLUMN IF NOT EXISTS requested_date date;

UPDATE public.employee_request_form
SET requested_date = COALESCE(created_at::date, (now() AT TIME ZONE 'Asia/Jakarta')::date)
WHERE requested_date IS NULL;

ALTER TABLE IF EXISTS public.employee_request_form
  ALTER COLUMN requested_date SET DEFAULT ((now() AT TIME ZONE 'Asia/Jakarta')::date);
