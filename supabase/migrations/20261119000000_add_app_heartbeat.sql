BEGIN;

CREATE TABLE public.app_heartbeat (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_ping_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.app_heartbeat ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.app_heartbeat FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.app_heartbeat TO service_role;

COMMIT;
