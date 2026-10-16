-- Recreate the grants lost when the designation-only recruitment view was rebuilt.
grant all on table public.recruitment_queue_view to anon;
grant all on table public.recruitment_queue_view to authenticated;
grant all on table public.recruitment_queue_view to service_role;
