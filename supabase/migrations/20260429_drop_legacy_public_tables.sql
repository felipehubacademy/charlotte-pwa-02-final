-- Drop legacy PWA tables from public schema.
-- These tables were only read by supabase-service.ts and related PWA
-- components, all of which have been removed. No triggers write to them —
-- compat triggers write to charlotte.* directly. Data is stale.
--
-- Kept: public.users (used by admin, AuthProvider, delete-account API)
--       public.tts_cache (used by /api/tts-cached, called by mobile)

DROP TABLE IF EXISTS public.user_practices        CASCADE;
DROP TABLE IF EXISTS public.user_progress         CASCADE;
DROP TABLE IF EXISTS public.user_sessions         CASCADE;
DROP TABLE IF EXISTS public.user_leaderboard_cache CASCADE;
DROP TABLE IF EXISTS public.user_additional_roles  CASCADE;
