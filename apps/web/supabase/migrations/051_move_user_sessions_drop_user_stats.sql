-- ─────────────────────────────────────────────────────────────────────────────
-- 051_move_user_sessions_drop_user_stats.sql
--
-- user_sessions: PWA-only table — move from charlotte → public.
--   Same zero-downtime pattern as migration 049 (drop compat view, move table).
--   PWA code (supabase.from('user_sessions')) keeps working transparently.
--
-- user_stats: unused by both PWA and RN — drop.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── user_sessions: move to public ────────────────────────────────────────────

DROP VIEW IF EXISTS public.user_sessions CASCADE;
ALTER TABLE charlotte.user_sessions SET SCHEMA public;

-- ── user_stats: drop (no code references it anywhere) ────────────────────────

DROP VIEW IF EXISTS public.user_stats CASCADE;
DROP TABLE IF EXISTS charlotte.user_stats;

COMMIT;
