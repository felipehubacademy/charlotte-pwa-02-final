-- Remove broken functions and stale trigger found during post-migration audit.
--
-- All items below referenced public.users (moved to lms.users) or
-- user_leaderboard_cache (dropped with PWA tables). None had active triggers
-- in production — they were dead legacy code from the PWA era.

-- Stale trigger on lms.users that tried to update non-existent user_leaderboard_cache
DROP TRIGGER IF EXISTS sync_leaderboard_on_user_update ON lms.users;

-- Dead legacy functions (PWA-era leaderboard management)
DROP FUNCTION IF EXISTS public.trigger_sync_leaderboard_on_user_change();
DROP FUNCTION IF EXISTS public.auto_update_leaderboard_cache();
DROP FUNCTION IF EXISTS public.populate_initial_leaderboard();
DROP FUNCTION IF EXISTS public.populate_leaderboard_cache();
DROP FUNCTION IF EXISTS public.sync_leaderboard_with_users();
DROP FUNCTION IF EXISTS public.update_leaderboard_cache();
DROP FUNCTION IF EXISTS public.validate_leaderboard_consistency();

-- Dead legacy achievement/progress functions (used charlotte.user_practices
-- and charlotte.user_progress which no longer exist)
DROP FUNCTION IF EXISTS charlotte.check_and_award_achievements(TEXT);
DROP FUNCTION IF EXISTS public.update_user_progress_on_practice();

-- Dead debug function (referenced public.users)
DROP FUNCTION IF EXISTS public.rn_award_achievements_debug(uuid);
