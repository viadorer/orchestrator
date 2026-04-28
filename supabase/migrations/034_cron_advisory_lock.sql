-- ===========================================
-- 034: Cron Advisory Lock — race condition protection
-- Prevents duplicate cron execution (e.g. when Vercel runs overlapping invocations).
-- ===========================================

-- Try to acquire a session-level advisory lock.
-- Returns true if lock acquired, false if another session holds it.
-- Lock is automatically released when the session ends (Supabase request finishes).
--
-- Usage:
--   SELECT try_acquire_cron_lock('agent_orchestrator');
--   -- if true: proceed with work
--   -- if false: another instance is running, skip silently
CREATE OR REPLACE FUNCTION try_acquire_cron_lock(lock_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  -- Convert text lock name to bigint key (PostgreSQL advisory locks use bigint)
  -- Use hashtext() for stable hash; XOR with a constant to avoid conflicts with user-defined locks
  lock_key BIGINT;
BEGIN
  lock_key := ('x' || substring(md5(lock_name) for 16))::bit(64)::bigint;
  RETURN pg_try_advisory_lock(lock_key);
END;
$$;

-- Explicitly release a lock (optional — locks auto-release on session end).
CREATE OR REPLACE FUNCTION release_cron_lock(lock_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  lock_key BIGINT;
BEGIN
  lock_key := ('x' || substring(md5(lock_name) for 16))::bit(64)::bigint;
  RETURN pg_advisory_unlock(lock_key);
END;
$$;

-- Grant execute to authenticated and service_role
GRANT EXECUTE ON FUNCTION try_acquire_cron_lock(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION release_cron_lock(TEXT) TO authenticated, service_role;
