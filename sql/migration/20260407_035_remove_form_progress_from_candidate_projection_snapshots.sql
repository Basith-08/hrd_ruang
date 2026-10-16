update public.candidate_account_projection
set primary_job_snapshot = coalesce(primary_job_snapshot, '{}'::jsonb) - 'form_progress_percent'
where coalesce(primary_job_snapshot, '{}'::jsonb) ? 'form_progress_percent';

update public.candidate_application_projection
set job_snapshot = coalesce(job_snapshot, '{}'::jsonb) - 'form_progress_percent'
where coalesce(job_snapshot, '{}'::jsonb) ? 'form_progress_percent';
