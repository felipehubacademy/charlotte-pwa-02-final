-- ─────────────────────────────────────────────────────────────────────────────
-- 024_achievements_system.sql
--
-- Implements the full achievements system:
--   1. Ensure requirement_type / requirement_value exist on charlotte.achievements
--   2. Seed comprehensive achievement catalog (by level, frequency, difficulty)
--   3. Create check_and_award_achievements() function
--   4. Update update_user_progress_on_practice() to call it
--   5. Enable Realtime on user_achievements so the RN app can subscribe
-- ─────────────────────────────────────────────────────────────────────────────
-- Column names in charlotte.achievements (remote): code, name, description, icon,
--   xp_reward, category, rarity, user_level, requirement_type, requirement_value

BEGIN;

-- ── 1. Ensure requirement columns exist ──────────────────────────────────────
ALTER TABLE charlotte.achievements
  ADD COLUMN IF NOT EXISTS requirement_type  TEXT    DEFAULT 'practice_count',
  ADD COLUMN IF NOT EXISTS requirement_value INTEGER DEFAULT 1;

-- ── 2. Seed achievement catalog ───────────────────────────────────────────────
-- requirement_type values:
--   practice_count  → total practices
--   total_xp        → cumulative XP
--   daily_streak    → streak_days
--   audio_count     → pronunciation practices
--   text_count      → grammar/text/chat practices
--   learn_count     → learn module practices
--   morning_practice → practices before noon (UTC hour < 12)
--   night_practice  → practices after 22h UTC
--   active_days     → distinct days with a practice

INSERT INTO charlotte.achievements
  (code, name, description, icon, xp_reward, category, rarity,
   requirement_type, requirement_value)
VALUES
  -- ── Practice count milestones ────────────────────────────────────────────
  ('first_practice',    'First Steps',           'Complete your first practice session',      '🎯', 50,   'general',     'common',    'practice_count',   1),
  ('practice_5',        'Getting Warmed Up',     'Complete 5 practice sessions',              '🔥', 100,  'general',     'common',    'practice_count',   5),
  ('practice_10',       'Consistent Learner',    'Complete 10 practice sessions',             '💪', 150,  'milestone',   'common',    'practice_count',  10),
  ('practice_25',       'Dedicated Student',     'Complete 25 practice sessions',             '📚', 250,  'milestone',   'rare',      'practice_count',  25),
  ('practice_50',       'Half Century',          'Complete 50 practice sessions',             '🌟', 400,  'milestone',   'rare',      'practice_count',  50),
  ('practice_100',      'Century Club',          'Complete 100 practice sessions',            '💯', 700,  'milestone',   'epic',      'practice_count', 100),
  ('practice_250',      'Practice Makes Perfect','Complete 250 practice sessions',            '🏆',1200,  'milestone',   'epic',      'practice_count', 250),
  ('practice_500',      'Language Machine',      'Complete 500 practice sessions',            '🤖',2500,  'milestone',   'legendary', 'practice_count', 500),

  -- ── XP milestones ────────────────────────────────────────────────────────
  ('xp_100',            'First 100',             'Earn your first 100 XP',                   '⚡',  50,  'xp',          'common',    'total_xp',       100),
  ('xp_500',            'Rising Star',           'Reach 500 XP',                             '✨', 100,  'xp',          'common',    'total_xp',       500),
  ('xp_1000',           'XP Achiever',           'Reach 1,000 XP',                           '🌙', 200,  'xp',          'rare',      'total_xp',      1000),
  ('xp_2500',           'XP Collector',          'Reach 2,500 XP',                           '💎', 350,  'xp',          'rare',      'total_xp',      2500),
  ('xp_5000',           'XP Hunter',             'Reach 5,000 XP',                           '🔮', 600,  'xp',          'epic',      'total_xp',      5000),
  ('xp_10000',          'XP Master',             'Reach 10,000 XP',                          '👑',1500,  'xp',          'legendary', 'total_xp',     10000),

  -- ── Streaks ───────────────────────────────────────────────────────────────
  ('streak_3',          'On a Roll',             'Practice 3 days in a row',                 '🔥', 100,  'streak',      'common',    'daily_streak',     3),
  ('streak_7',          'Week Warrior',          'Practice 7 days in a row',                 '⚡', 200,  'streak',      'rare',      'daily_streak',     7),
  ('streak_14',         'Two Week Beast',        'Practice 14 days in a row',                '🌊', 400,  'streak',      'rare',      'daily_streak',    14),
  ('streak_30',         'Monthly Champion',      'Practice every day for a month',           '🏅', 800,  'streak',      'epic',      'daily_streak',    30),
  ('streak_60',         'Unstoppable Force',     'Practice 60 days in a row',                '🚀',1500,  'streak',      'epic',      'daily_streak',    60),
  ('streak_100',        'Centurion Streak',      'Practice 100 days in a row',               '🦁',3000,  'streak',      'legendary', 'daily_streak',   100),

  -- ── Audio / Pronunciation ─────────────────────────────────────────────────
  ('audio_1',           'First Word',            'Complete your first pronunciation practice','🎤',  50,  'audio',       'common',    'audio_count',      1),
  ('audio_10',          'Speaking Up',           'Complete 10 pronunciation practices',      '🎙️', 150,  'audio',       'common',    'audio_count',     10),
  ('audio_25',          'Vocal Challenger',      'Complete 25 pronunciation practices',      '🔊', 300,  'audio',       'rare',      'audio_count',     25),
  ('audio_50',          'Pronunciation Pro',     'Complete 50 pronunciation practices',      '🎵', 500,  'audio',       'rare',      'audio_count',     50),
  ('audio_100',         'Voice Master',          'Complete 100 pronunciation practices',     '🎶',1000,  'audio',       'epic',      'audio_count',    100),
  ('audio_250',         'Phonetic Legend',       'Complete 250 pronunciation practices',     '🎼',2000,  'audio',       'legendary', 'audio_count',    250),

  -- ── Grammar / Text ────────────────────────────────────────────────────────
  ('text_1',            'First Sentence',        'Complete your first grammar practice',     '📝',  50,  'grammar',     'common',    'text_count',       1),
  ('text_10',           'Grammar Novice',        'Complete 10 grammar practices',            '📖', 150,  'grammar',     'common',    'text_count',      10),
  ('text_25',           'Grammar Explorer',      'Complete 25 grammar practices',            '📘', 300,  'grammar',     'rare',      'text_count',      25),
  ('text_50',           'Grammar Enthusiast',    'Complete 50 grammar practices',            '📗', 500,  'grammar',     'rare',      'text_count',      50),
  ('text_100',          'Grammar Expert',        'Complete 100 grammar practices',           '📕',1000,  'grammar',     'epic',      'text_count',     100),

  -- ── Learn modules ─────────────────────────────────────────────────────────
  ('learn_1',           'First Lesson',          'Complete your first learn module',         '🎓',  50,  'learn',       'common',    'learn_count',      1),
  ('learn_10',          'Avid Learner',          'Complete 10 learn modules',                '📐', 200,  'learn',       'rare',      'learn_count',     10),
  ('learn_25',          'Module Master',         'Complete 25 learn modules',                '🎯', 500,  'learn',       'epic',      'learn_count',     25),
  ('learn_50',          'Curriculum Legend',     'Complete 50 learn modules',                '🏫',1000,  'learn',       'legendary', 'learn_count',     50),

  -- ── Habit / Time-based ────────────────────────────────────────────────────
  ('morning_1',         'Early Bird',            'Practice before noon',                     '🌅',  75,  'habit',       'common',    'morning_practice',  1),
  ('morning_5',         'Morning Routine',       'Practice before noon 5 times',             '☀️', 200,  'habit',       'rare',      'morning_practice',  5),
  ('night_1',           'Night Owl',             'Practice after 10 PM',                     '🌙',  75,  'habit',       'common',    'night_practice',    1),
  ('night_5',           'Midnight Scholar',      'Practice after 10 PM, 5 times',            '🦉', 200,  'habit',       'rare',      'night_practice',    5),

  -- ── Active days ───────────────────────────────────────────────────────────
  ('active_7',          'Week of Learning',      'Practice on 7 different days',             '📅', 150,  'consistency', 'common',    'active_days',       7),
  ('active_30',         'Month of Dedication',   'Practice on 30 different days',            '🗓️', 500,  'consistency', 'rare',      'active_days',      30),
  ('active_90',         'Quarter Champion',      'Practice on 90 different days',            '📆',1200,  'consistency', 'epic',      'active_days',      90)

ON CONFLICT (code) DO UPDATE SET
  requirement_type  = EXCLUDED.requirement_type,
  requirement_value = EXCLUDED.requirement_value,
  name         = EXCLUDED.name,
  description  = EXCLUDED.description,
  xp_reward    = EXCLUDED.xp_reward,
  icon         = EXCLUDED.icon,
  rarity       = EXCLUDED.rarity,
  category     = EXCLUDED.category;

-- ── 3. Achievement award function ─────────────────────────────────────────────
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
BEGIN
  -- Load user progress
  SELECT * INTO v_progress
  FROM charlotte.user_progress
  WHERE user_id = p_user_id;

  -- Practice counts by type
  SELECT COUNT(*) INTO v_practice_count
  FROM charlotte.user_practices
  WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_audio_count
  FROM charlotte.user_practices
  WHERE user_id = p_user_id AND practice_type = 'pronunciation';

  SELECT COUNT(*) INTO v_text_count
  FROM charlotte.user_practices
  WHERE user_id = p_user_id AND practice_type IN ('grammar', 'text', 'chat');

  SELECT COUNT(*) INTO v_learn_count
  FROM charlotte.user_practices
  WHERE user_id = p_user_id AND practice_type LIKE 'learn%';

  -- Distinct days with at least one practice
  SELECT COUNT(DISTINCT DATE(created_at)) INTO v_active_days
  FROM charlotte.user_practices
  WHERE user_id = p_user_id;

  -- Morning practices (before noon UTC as an approximation)
  SELECT COUNT(*) INTO v_morning_count
  FROM charlotte.user_practices
  WHERE user_id = p_user_id
    AND EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC') < 12;

  -- Night practices (22h+ UTC)
  SELECT COUNT(*) INTO v_night_count
  FROM charlotte.user_practices
  WHERE user_id = p_user_id
    AND EXTRACT(HOUR FROM created_at AT TIME ZONE 'UTC') >= 22;

  -- Check each unearned achievement
  FOR v_achievement IN
    SELECT a.*
    FROM charlotte.achievements a
    WHERE NOT EXISTS (
      SELECT 1 FROM charlotte.user_achievements ua
      WHERE ua.user_id = p_user_id
        AND ua.achievement_id = a.id
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
      INSERT INTO charlotte.user_achievements (
        user_id, achievement_id,
        achievement_type,
        achievement_name, achievement_description,
        xp_bonus, rarity,
        achievement_code, badge_icon, badge_color, category,
        earned_at
      ) VALUES (
        p_user_id,
        v_achievement.id,
        v_achievement.category,
        v_achievement.name,
        v_achievement.description,
        v_achievement.xp_reward,
        v_achievement.rarity,
        v_achievement.code,
        COALESCE(v_achievement.badge_icon, v_achievement.icon),
        '#A3FF3C',
        v_achievement.category,
        NOW()
      )
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 4. Update trigger to call achievement check ───────────────────────────────
CREATE OR REPLACE FUNCTION update_user_progress_on_practice()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO charlotte.user_progress (
    user_id, total_xp, total_practices, last_practice_date
  )
  VALUES (
    NEW.user_id,
    COALESCE(NEW.xp_earned, 0),
    1,
    CURRENT_DATE
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_xp           = charlotte.user_progress.total_xp + COALESCE(NEW.xp_earned, 0),
    total_practices    = charlotte.user_progress.total_practices + 1,
    last_practice_date = CURRENT_DATE,
    streak_days = CASE
      WHEN charlotte.user_progress.last_practice_date = CURRENT_DATE - INTERVAL '1 day'
        THEN charlotte.user_progress.streak_days + 1
      WHEN charlotte.user_progress.last_practice_date = CURRENT_DATE
        THEN charlotte.user_progress.streak_days
      ELSE 1
    END,
    longest_streak = GREATEST(
      charlotte.user_progress.longest_streak,
      CASE
        WHEN charlotte.user_progress.last_practice_date = CURRENT_DATE - INTERVAL '1 day'
          THEN charlotte.user_progress.streak_days + 1
        WHEN charlotte.user_progress.last_practice_date = CURRENT_DATE
          THEN charlotte.user_progress.streak_days
        ELSE 1
      END
    ),
    current_level = CASE
      WHEN (charlotte.user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 10000 THEN 10
      WHEN (charlotte.user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 5000  THEN 9
      WHEN (charlotte.user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 2500  THEN 8
      WHEN (charlotte.user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 1500  THEN 7
      WHEN (charlotte.user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 1000  THEN 6
      WHEN (charlotte.user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 600   THEN 5
      WHEN (charlotte.user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 350   THEN 4
      WHEN (charlotte.user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 200   THEN 3
      WHEN (charlotte.user_progress.total_xp + COALESCE(NEW.xp_earned, 0)) >= 100   THEN 2
      ELSE 1
    END,
    updated_at = NOW();

  -- Sync leaderboard cache
  INSERT INTO charlotte.user_leaderboard_cache (user_id, user_level, display_name, total_xp, current_streak, updated_at)
  SELECT
    up.user_id,
    COALESCE(u.user_level, 'Inter'),
    COALESCE(u.name, 'Anonymous'),
    up.total_xp,
    up.streak_days,
    NOW()
  FROM charlotte.user_progress up
  JOIN public.users u ON u.id = up.user_id
  WHERE up.user_id = NEW.user_id
  ON CONFLICT (user_id, user_level) DO UPDATE SET
    total_xp       = EXCLUDED.total_xp,
    current_streak = EXCLUDED.current_streak,
    display_name   = EXCLUDED.display_name,
    updated_at     = NOW();

  -- Check and award any newly earned achievements
  PERFORM charlotte.check_and_award_achievements(NEW.user_id::TEXT);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 5. Enable Realtime on user_achievements ───────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE charlotte.user_achievements;

-- ── 6. Retroactively award achievements to existing users ─────────────────────
DO $$
DECLARE
  v_user RECORD;
BEGIN
  FOR v_user IN SELECT DISTINCT user_id FROM charlotte.user_progress LOOP
    PERFORM charlotte.check_and_award_achievements(v_user.user_id::TEXT);
  END LOOP;
  RAISE NOTICE '✅ Retroactive achievement check completed';
END $$;

COMMIT;

DO $$ BEGIN
  RAISE NOTICE '✅ 024 completed: % achievements seeded',
    (SELECT COUNT(*) FROM charlotte.achievements);
END $$;
