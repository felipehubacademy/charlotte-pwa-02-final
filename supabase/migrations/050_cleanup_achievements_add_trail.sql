-- ─────────────────────────────────────────────────────────────────────────────
-- 050_cleanup_achievements_add_trail.sql
--
-- 1. Remove legacy achievement definitions from charlotte.achievements
--    (old codes with requirement_types the RN system cannot evaluate:
--    pronunciation_score, grammar_score, live_sessions, etc.)
--    115 user_achievements rows reference these — nullify FK first so
--    user history is preserved, only the catalog row is deleted.
--
-- 2. Add 12 trail-completion badges (4 per level) that the frontend
--    already shows but were never in the DB catalog.
--
-- 3. Add trail_topics + total_xp_earned to rn_award_achievements,
--    and include the trail badges in the backfill run.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── 1. Nullify FK on user_achievements for legacy catalog rows ────────────────
-- Preserves user history (name, description, earned_at, xp_bonus all remain).
-- Only clears the achievement_id pointer to the catalog row being deleted.

UPDATE charlotte.user_achievements
  SET achievement_id = NULL
  WHERE achievement_id IN (
    SELECT id FROM charlotte.achievements
    WHERE code NOT IN (
      'first_practice','first_text','first_audio','first_grammar','first_learn',
      'practices_10','practices_50','practices_100','practices_500',
      'streak_3','streak_7','streak_14','streak_30',
      'text_25','text_100',
      'audio_10','audio_50','audio_200',
      'grammar_20','grammar_50',
      'learn_25','learn_100',
      'daily_100','daily_200','early_bird','night_owl',
      -- trail badges (being added below)
      'novice_first_topic','novice_halfway','novice_master','novice_promoted',
      'inter_first_topic','inter_halfway','inter_champion','inter_promoted',
      'advanced_first_topic','advanced_halfway','advanced_master','advanced_fluent'
    )
  );

-- ── 2. Delete legacy catalog rows ─────────────────────────────────────────────

DELETE FROM charlotte.achievements
  WHERE code NOT IN (
    'first_practice','first_text','first_audio','first_grammar','first_learn',
    'practices_10','practices_50','practices_100','practices_500',
    'streak_3','streak_7','streak_14','streak_30',
    'text_25','text_100',
    'audio_10','audio_50','audio_200',
    'grammar_20','grammar_50',
    'learn_25','learn_100',
    'daily_100','daily_200','early_bird','night_owl',
    'novice_first_topic','novice_halfway','novice_master','novice_promoted',
    'inter_first_topic','inter_halfway','inter_champion','inter_promoted',
    'advanced_first_topic','advanced_halfway','advanced_master','advanced_fluent'
  );

-- ── 3. Add 12 trail badges ────────────────────────────────────────────────────
-- requirement_type = 'trail_topics'     → count of completed topics in learn_progress
-- requirement_type = 'total_xp_earned'  → all-time XP in charlotte.progress

INSERT INTO charlotte.achievements
  (code, name, description, xp_reward, requirement_type, requirement_value, user_level, category, badge_color, badge_icon, rarity, is_active, sort_order)
VALUES
-- Novice (PT-BR)
('novice_first_topic', 'A Jornada Começa',  'Complete o primeiro tópico da trilha Novice.',                  15,  'trail_topics',    1,     'Novice',   'learn',   '#A3FF3C', 'novice_first_topic', 'common',    true, 90),
('novice_halfway',     'No Embalo',          'Complete 25 dos 50 tópicos da trilha Novice.',                  60,  'trail_topics',    25,    'Novice',   'learn',   '#3B82F6', 'novice_halfway',     'rare',      true, 91),
('novice_master',      'Mestre do Básico',   'Complete todos os 50 tópicos da trilha Novice.',                150, 'trail_topics',    50,    'Novice',   'learn',   '#A855F7', 'novice_master',      'epic',      true, 92),
('novice_promoted',    'Passou de Fase!',    'Acumule 4.000 XP e seja promovido ao nível Inter.',            200, 'total_xp_earned', 4000,  'Novice',   'general', '#EAB308', 'novice_promoted',    'legendary', true, 93),
-- Inter (PT-BR)
('inter_first_topic',  'A Jornada Continua', 'Complete o primeiro tópico da trilha Inter.',                   15,  'trail_topics',    1,     'Inter',    'learn',   '#A3FF3C', 'inter_first_topic',  'common',    true, 90),
('inter_halfway',      'No Embalo',          'Complete 35 dos 70 tópicos da trilha Inter.',                   80,  'trail_topics',    35,    'Inter',    'learn',   '#3B82F6', 'inter_halfway',      'rare',      true, 91),
('inter_champion',     'Campeão Inter',      'Complete todos os 70 tópicos da trilha Inter.',                 200, 'trail_topics',    70,    'Inter',    'learn',   '#A855F7', 'inter_champion',     'epic',      true, 92),
('inter_promoted',     'Rumo ao Advanced!',  'Acumule 9.800 XP e seja promovido ao nível Advanced.',         300, 'total_xp_earned', 9800,  'Inter',    'general', '#EAB308', 'inter_promoted',     'legendary', true, 93),
-- Advanced (English)
('advanced_first_topic','Elite Learner',     'Complete the first topic on the Advanced trail.',               15,  'trail_topics',    1,     'Advanced', 'learn',   '#A3FF3C', 'advanced_first_topic','common',   true, 90),
('advanced_halfway',   'Deep End',           'Complete 20 of 40 Advanced trail topics.',                      100, 'trail_topics',    20,    'Advanced', 'learn',   '#3B82F6', 'advanced_halfway',   'rare',      true, 91),
('advanced_master',    'Advanced Master',    'Complete all 40 Advanced trail topics.',                        250, 'trail_topics',    40,    'Advanced', 'learn',   '#A855F7', 'advanced_master',    'epic',      true, 92),
('advanced_fluent',    'Fluent',             'Accumulate 20,000 total XP.',                                   500, 'total_xp_earned', 20000, 'Advanced', 'general', '#EAB308', 'advanced_fluent',    'legendary', true, 93)
ON CONFLICT (code, user_level) DO UPDATE SET
  name              = EXCLUDED.name,
  description       = EXCLUDED.description,
  xp_reward         = EXCLUDED.xp_reward,
  requirement_type  = EXCLUDED.requirement_type,
  requirement_value = EXCLUDED.requirement_value,
  category          = EXCLUDED.category,
  badge_color       = EXCLUDED.badge_color,
  badge_icon        = EXCLUDED.badge_icon,
  rarity            = EXCLUDED.rarity,
  is_active         = EXCLUDED.is_active,
  sort_order        = EXCLUDED.sort_order;


-- ── 4. Updated rn_award_achievements: add trail_topics + total_xp_earned ──────

CREATE OR REPLACE FUNCTION public.rn_award_achievements(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_level      text;
  v_total_xp        int     := 0;
  v_streak          int     := 0;
  v_total_practices int     := 0;
  v_text_count      int     := 0;
  v_audio_count     int     := 0;
  v_grammar_count   int     := 0;
  v_learn_count     int     := 0;
  v_today_xp        int     := 0;
  v_trail_topics    int     := 0;
  v_current_hour    int     := EXTRACT(HOUR FROM now() AT TIME ZONE 'America/Sao_Paulo');
  v_awarded         jsonb   := '[]'::jsonb;
  v_qualifies       boolean := false;
  ach               RECORD;
BEGIN
  -- ── User level: charlotte.users is canonical for RN users ────────────────
  SELECT charlotte_level INTO v_user_level
    FROM charlotte.users WHERE id = p_user_id;

  IF v_user_level IS NULL THEN
    SELECT user_level INTO v_user_level
      FROM public.users WHERE id = p_user_id;
  END IF;

  v_user_level := COALESCE(v_user_level, 'Novice');

  -- ── Stats ─────────────────────────────────────────────────────────────────
  SELECT COALESCE(total_xp, 0), COALESCE(streak_days, 0)
    INTO v_total_xp, v_streak
    FROM charlotte.progress WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_total_practices
    FROM charlotte.practices
    WHERE user_id = p_user_id
      AND practice_type NOT LIKE 'achievement_reward_%'
      AND practice_type NOT LIKE 'mission_reward_%';

  SELECT COUNT(*) INTO v_text_count
    FROM charlotte.practices WHERE user_id = p_user_id
      AND practice_type = 'text_message';

  SELECT COUNT(*) INTO v_audio_count
    FROM charlotte.practices WHERE user_id = p_user_id
      AND practice_type IN ('audio_message', 'live_voice', 'pronunciation');

  SELECT COUNT(*) INTO v_grammar_count
    FROM charlotte.practices WHERE user_id = p_user_id
      AND practice_type IN ('grammar', 'grammar_message');

  SELECT COUNT(*) INTO v_learn_count
    FROM charlotte.practices WHERE user_id = p_user_id
      AND practice_type = 'learn_exercise';

  SELECT COALESCE(SUM(xp_earned), 0) INTO v_today_xp
    FROM charlotte.practices WHERE user_id = p_user_id
      AND created_at >= current_date
      AND practice_type NOT LIKE 'achievement_reward_%'
      AND practice_type NOT LIKE 'mission_reward_%';

  -- Trail topics completed for user's current level
  SELECT COALESCE(jsonb_array_length(completed), 0) INTO v_trail_topics
    FROM charlotte.learn_progress
    WHERE user_id = p_user_id AND level = v_user_level;

  -- ── Loop through catalog for this user's level ────────────────────────────
  FOR ach IN
    SELECT a.*
    FROM charlotte.achievements a
    WHERE a.user_level = v_user_level
      AND a.is_active = true
    ORDER BY a.sort_order, a.code
  LOOP
    -- Skip if already earned (non-daily: match by achievement_id)
    CONTINUE WHEN EXISTS (
      SELECT 1 FROM charlotte.user_achievements
      WHERE user_id = p_user_id::text
        AND achievement_id = ach.id
    );

    -- Evaluate condition
    v_qualifies := CASE ach.requirement_type
      WHEN 'total_practices'   THEN v_total_practices >= ach.requirement_value
      WHEN 'text_messages'     THEN v_text_count       >= ach.requirement_value
      WHEN 'audio_messages'    THEN v_audio_count      >= ach.requirement_value
      WHEN 'grammar_exercises' THEN v_grammar_count    >= ach.requirement_value
      WHEN 'learn_exercises'   THEN v_learn_count      >= ach.requirement_value
      WHEN 'streak_days'       THEN v_streak           >= ach.requirement_value
      WHEN 'today_xp'          THEN v_today_xp         >= ach.requirement_value
      WHEN 'early_bird'        THEN v_current_hour < 8 AND v_today_xp > 0
      WHEN 'night_owl'         THEN v_current_hour >= 22 AND v_today_xp > 0
      WHEN 'trail_topics'      THEN v_trail_topics     >= ach.requirement_value
      WHEN 'total_xp_earned'   THEN v_total_xp         >= ach.requirement_value
      ELSE false
    END;

    -- Daily achievements can repeat each day
    IF ach.requirement_type IN ('today_xp', 'early_bird', 'night_owl') THEN
      CONTINUE WHEN EXISTS (
        SELECT 1 FROM charlotte.user_achievements
        WHERE user_id = p_user_id::text
          AND achievement_id = ach.id
          AND earned_at >= current_date
      );
    END IF;

    IF v_qualifies THEN
      INSERT INTO charlotte.user_achievements (
        user_id, achievement_id, achievement_code, achievement_type,
        achievement_name, achievement_description,
        xp_bonus, rarity, badge_icon, badge_color, category
      ) VALUES (
        p_user_id::text, ach.id, ach.code, ach.code,
        ach.name, ach.description,
        ach.xp_reward, ach.rarity, ach.badge_icon, ach.badge_color, ach.category
      ) ON CONFLICT DO NOTHING;

      UPDATE charlotte.progress
        SET total_xp = total_xp + ach.xp_reward, updated_at = now()
        WHERE user_id = p_user_id;
      UPDATE charlotte.leaderboard_cache
        SET total_xp = total_xp + ach.xp_reward, updated_at = now()
        WHERE user_id = p_user_id;

      v_awarded := v_awarded || jsonb_build_object(
        'name', ach.name, 'bonus', ach.xp_reward, 'code', ach.code
      );
    END IF;
  END LOOP;

  RETURN v_awarded;
END;
$$;


-- ── 5. Backfill trail badges for existing users ───────────────────────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT user_id
    FROM charlotte.practices
    WHERE practice_type NOT LIKE 'achievement_reward_%'
      AND practice_type NOT LIKE 'mission_reward_%'
  LOOP
    BEGIN
      PERFORM public.rn_award_achievements(r.user_id);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END;
$$;

COMMIT;
