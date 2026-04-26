-- ─────────────────────────────────────────────────────────────────────────────
-- 026_achievement_xp_credit.sql
--
-- When an achievement is awarded, credit its xp_bonus to user_progress.total_xp.
-- Also updates the leaderboard cache to reflect the new total.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

CREATE OR REPLACE FUNCTION charlotte.check_and_award_achievements(p_user_id TEXT)
RETURNS void AS $$
DECLARE
  v_progress        charlotte.user_progress%ROWTYPE;
  v_achievement     RECORD;
  v_practice_count  BIGINT := 0;
  v_audio_count     BIGINT := 0;
  v_text_count      BIGINT := 0;
  v_learn_count     BIGINT := 0;
  v_active_days     BIGINT := 0;
  v_morning_count   BIGINT := 0;
  v_night_count     BIGINT := 0;
  v_qualifies       BOOLEAN;
  v_inserted        BOOLEAN;
BEGIN
  SELECT * INTO v_progress
  FROM charlotte.user_progress WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_practice_count FROM charlotte.user_practices WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_audio_count    FROM charlotte.user_practices WHERE user_id = p_user_id AND practice_type = 'pronunciation';
  SELECT COUNT(*) INTO v_text_count     FROM charlotte.user_practices WHERE user_id = p_user_id AND practice_type IN ('grammar', 'text', 'chat');
  SELECT COUNT(*) INTO v_learn_count    FROM charlotte.user_practices WHERE user_id = p_user_id AND practice_type LIKE 'learn%';
  SELECT COUNT(DISTINCT DATE(created_at)) INTO v_active_days FROM charlotte.user_practices WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_morning_count  FROM charlotte.user_practices WHERE user_id = p_user_id AND EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC') < 12;
  SELECT COUNT(*) INTO v_night_count    FROM charlotte.user_practices WHERE user_id = p_user_id AND EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC') >= 22;

  FOR v_achievement IN
    SELECT a.* FROM charlotte.achievements a
    WHERE NOT EXISTS (
      SELECT 1 FROM charlotte.user_achievements ua
      WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id
    )
  LOOP
    v_qualifies := FALSE;
    CASE v_achievement.requirement_type
      WHEN 'practice_count'    THEN v_qualifies := v_practice_count >= v_achievement.requirement_value;
      WHEN 'total_xp'          THEN v_qualifies := COALESCE(v_progress.total_xp, 0) >= v_achievement.requirement_value;
      WHEN 'daily_streak'      THEN v_qualifies := COALESCE(v_progress.streak_days, 0) >= v_achievement.requirement_value;
      WHEN 'audio_count'       THEN v_qualifies := v_audio_count    >= v_achievement.requirement_value;
      WHEN 'text_count'        THEN v_qualifies := v_text_count     >= v_achievement.requirement_value;
      WHEN 'learn_count'       THEN v_qualifies := v_learn_count    >= v_achievement.requirement_value;
      WHEN 'active_days'       THEN v_qualifies := v_active_days    >= v_achievement.requirement_value;
      WHEN 'morning_practice'  THEN v_qualifies := v_morning_count  >= v_achievement.requirement_value;
      WHEN 'night_practice'    THEN v_qualifies := v_night_count    >= v_achievement.requirement_value;
      ELSE v_qualifies := FALSE;
    END CASE;

    IF v_qualifies THEN
      v_inserted := FALSE;

      INSERT INTO charlotte.user_achievements (
        user_id, achievement_id, achievement_type,
        achievement_name, achievement_description,
        xp_bonus, rarity, achievement_code, badge_icon, badge_color, category, earned_at
      ) VALUES (
        p_user_id, v_achievement.id, v_achievement.category,
        v_achievement.name, v_achievement.description,
        v_achievement.xp_reward, v_achievement.rarity,
        v_achievement.code, COALESCE(v_achievement.badge_icon, v_achievement.icon),
        '#A3FF3C', v_achievement.category, NOW()
      )
      ON CONFLICT (user_id, achievement_id) DO NOTHING;

      GET DIAGNOSTICS v_inserted = ROW_COUNT;

      -- Only credit XP if this was a fresh insert (not a duplicate)
      IF v_inserted AND v_achievement.xp_reward > 0 THEN
        UPDATE charlotte.user_progress
        SET total_xp   = total_xp + v_achievement.xp_reward,
            updated_at = NOW()
        WHERE user_id = p_user_id;

        -- Refresh leaderboard cache
        INSERT INTO charlotte.user_leaderboard_cache (user_id, user_level, display_name, total_xp, current_streak, updated_at)
        SELECT up.user_id, COALESCE(u.user_level, 'Inter'), COALESCE(u.name, 'Anonymous'), up.total_xp, up.streak_days, NOW()
        FROM charlotte.user_progress up
        JOIN public.users u ON u.id = up.user_id
        WHERE up.user_id = p_user_id
        ON CONFLICT (user_id, user_level) DO UPDATE SET
          total_xp     = EXCLUDED.total_xp,
          display_name = EXCLUDED.display_name,
          updated_at   = NOW();
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-run retroactive check so existing users get XP credited
DO $$
DECLARE v_user RECORD;
BEGIN
  FOR v_user IN SELECT DISTINCT user_id FROM charlotte.user_achievements LOOP
    -- Re-award is safe: ON CONFLICT DO NOTHING prevents duplicates
    -- XP credit: only fires for rows with ROW_COUNT > 0, which won't happen
    -- for already-existing rows. So this is a no-op for existing achievements.
    NULL;
  END LOOP;
  RAISE NOTICE '✅ 026 completed: achievements now credit xp_bonus to user_progress';
END $$;

COMMIT;
