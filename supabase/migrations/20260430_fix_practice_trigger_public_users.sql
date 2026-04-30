-- Fix triggers broken by public.users → lms.users migration.
--
-- rn_on_practice_insert queried FROM public.users (column user_level).
-- rn_award_achievements had a fallback to public.users.
-- Both fail now that public.users is gone — causing the entire INSERT
-- into charlotte.practices to roll back, so no XP was ever recorded.
--
-- Fix: use charlotte.users (column charlotte_level) which is the canonical
-- table for all RN users.

CREATE OR REPLACE FUNCTION public.rn_on_practice_insert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_old_xp       int;
  v_new_xp       int;
  v_today        date := current_date;
  v_milestones   int[] := ARRAY[100, 250, 500, 1000, 2500, 5000, 10000];
  v_milestone    int;
  v_user_level   text;
  v_display_name text;
  v_en           boolean := false;
  v_ach_id       uuid;
  v_ach_name     text;
  v_ach_desc     text;
  v_ach_rarity   text;
  v_ach_icon     text;
  v_ach_bonus    int;
BEGIN
  -- Update XP + streak
  INSERT INTO charlotte.progress (user_id, total_xp, streak_days, last_practice_date, updated_at)
    VALUES (NEW.user_id, NEW.xp_earned, 1, v_today, now())
  ON CONFLICT (user_id) DO UPDATE
    SET total_xp           = progress.total_xp + NEW.xp_earned,
        streak_days        = CASE
                               WHEN progress.last_practice_date = v_today - 1 THEN progress.streak_days + 1
                               WHEN progress.last_practice_date = v_today     THEN progress.streak_days
                               ELSE 1
                             END,
        last_practice_date = v_today,
        updated_at         = now();

  -- Get user level and display name from charlotte.users (canonical for RN)
  SELECT COALESCE(u.charlotte_level, 'Novice'),
         COALESCE(
           CASE
             WHEN u.name IS NOT NULL AND u.name <> '' THEN
               CASE
                 WHEN position(' ' IN trim(u.name)) > 0 THEN
                   split_part(trim(u.name), ' ', 1) || ' ' ||
                   upper(left(trim(split_part(trim(u.name), ' ', 2)), 1)) || '.'
                 ELSE trim(u.name)
               END
             ELSE split_part(u.email, '@', 1)
           END, 'Anonymous')
    INTO v_user_level, v_display_name
    FROM charlotte.users u WHERE u.id = NEW.user_id;

  v_en := (v_user_level = 'Advanced');

  -- XP milestones (real practice types only)
  IF NEW.practice_type NOT LIKE 'mission_reward_%'
     AND NEW.practice_type NOT LIKE 'achievement_reward_%' THEN

    SELECT total_xp - NEW.xp_earned INTO v_old_xp
      FROM charlotte.progress WHERE user_id = NEW.user_id;
    v_new_xp := v_old_xp + NEW.xp_earned;

    FOREACH v_milestone IN ARRAY v_milestones LOOP
      IF v_old_xp < v_milestone AND v_new_xp >= v_milestone THEN

        v_ach_name   := CASE WHEN v_en THEN
          CASE v_milestone WHEN 100 THEN 'First Steps' WHEN 250 THEN 'In Progress' WHEN 500 THEN 'Halfway There' WHEN 1000 THEN 'Dedicated' WHEN 2500 THEN 'Advancing' WHEN 5000 THEN 'Expert' WHEN 10000 THEN 'Master' END
        ELSE
          CASE v_milestone WHEN 100 THEN 'Primeiros Passos' WHEN 250 THEN 'Em Progresso' WHEN 500 THEN 'Meio Caminho' WHEN 1000 THEN 'Dedicado' WHEN 2500 THEN 'Avançando' WHEN 5000 THEN 'Expert' WHEN 10000 THEN 'Mestre' END
        END;
        v_ach_desc   := CASE WHEN v_en THEN
          CASE v_milestone WHEN 100 THEN 'You earned your first 100 XP!' WHEN 250 THEN 'Reached 250 XP — keep it up!' WHEN 500 THEN '500 XP earned!' WHEN 1000 THEN '1,000 XP — you are dedicated!' WHEN 2500 THEN '2,500 XP — impressive!' WHEN 5000 THEN '5,000 XP — expert level!' WHEN 10000 THEN '10,000 XP — you are a master!' END
        ELSE
          CASE v_milestone WHEN 100 THEN 'Você ganhou seus primeiros 100 XP!' WHEN 250 THEN 'Chegou a 250 XP — continue assim!' WHEN 500 THEN '500 XP conquistados!' WHEN 1000 THEN '1.000 XP — você é dedicado!' WHEN 2500 THEN '2.500 XP — impressionante!' WHEN 5000 THEN '5.000 XP — nível expert!' WHEN 10000 THEN '10.000 XP — você é um mestre!' END
        END;
        v_ach_rarity := CASE v_milestone WHEN 100 THEN 'common' WHEN 250 THEN 'common' WHEN 500 THEN 'rare' WHEN 1000 THEN 'rare' WHEN 2500 THEN 'epic' WHEN 5000 THEN 'epic' WHEN 10000 THEN 'legendary' END;
        v_ach_icon   := CASE v_milestone WHEN 100 THEN 'xp_100' WHEN 250 THEN 'xp_250' WHEN 500 THEN 'xp_500' WHEN 1000 THEN 'xp_1000' WHEN 2500 THEN 'xp_2500' WHEN 5000 THEN 'xp_5000' WHEN 10000 THEN 'xp_10000' END;
        v_ach_bonus  := CASE v_milestone WHEN 100 THEN 20 WHEN 250 THEN 30 WHEN 500 THEN 60 WHEN 1000 THEN 100 WHEN 2500 THEN 200 WHEN 5000 THEN 350 WHEN 10000 THEN 600 END;

        IF NOT EXISTS (
          SELECT 1 FROM charlotte.user_achievements
          WHERE user_id = NEW.user_id::text
            AND achievement_type = 'xp_milestone'
            AND achievement_name = v_ach_name
        ) THEN
          INSERT INTO charlotte.user_achievements (
            user_id, achievement_type, achievement_name, achievement_description,
            xp_bonus, rarity, badge_icon, badge_color, category
          ) VALUES (
            NEW.user_id::text, 'xp_milestone', v_ach_name, v_ach_desc,
            v_ach_bonus, v_ach_rarity, v_ach_icon, '#A3FF3C', 'xp_milestone'
          );
          UPDATE charlotte.progress
            SET total_xp = total_xp + v_ach_bonus, updated_at = now()
            WHERE user_id = NEW.user_id;
          UPDATE charlotte.leaderboard_cache
            SET total_xp = total_xp + v_ach_bonus, updated_at = now()
            WHERE user_id = NEW.user_id;
        END IF;
      END IF;
    END LOOP;

    PERFORM public.rn_award_achievements(NEW.user_id);

  END IF;

  -- Upsert leaderboard cache
  INSERT INTO charlotte.leaderboard_cache (user_id, user_level, display_name, total_xp, updated_at)
    VALUES (NEW.user_id, COALESCE(v_user_level, 'Novice'), COALESCE(v_display_name, 'Anonymous'), NEW.xp_earned, now())
  ON CONFLICT (user_id) DO UPDATE
    SET total_xp     = leaderboard_cache.total_xp + EXCLUDED.total_xp,
        user_level   = COALESCE(v_user_level, leaderboard_cache.user_level),
        display_name = COALESCE(v_display_name, leaderboard_cache.display_name),
        updated_at   = now();

  RETURN NEW;
END;
$$;

-- Remove broken public.users fallback from rn_award_achievements
CREATE OR REPLACE FUNCTION public.rn_award_achievements(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql AS $$
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
  -- User level: charlotte.users is canonical for RN users
  SELECT COALESCE(charlotte_level, 'Novice') INTO v_user_level
    FROM charlotte.users WHERE id = p_user_id;

  v_user_level := COALESCE(v_user_level, 'Novice');

  SELECT COALESCE(total_xp, 0), COALESCE(streak_days, 0)
    INTO v_total_xp, v_streak
    FROM charlotte.progress WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_total_practices
    FROM charlotte.practices
    WHERE user_id = p_user_id
      AND practice_type NOT LIKE 'achievement_reward_%'
      AND practice_type NOT LIKE 'mission_reward_%';

  SELECT COUNT(*) INTO v_text_count
    FROM charlotte.practices WHERE user_id = p_user_id AND practice_type = 'text_message';

  SELECT COUNT(*) INTO v_audio_count
    FROM charlotte.practices WHERE user_id = p_user_id
      AND practice_type IN ('audio_message', 'live_voice', 'pronunciation');

  SELECT COUNT(*) INTO v_grammar_count
    FROM charlotte.practices WHERE user_id = p_user_id
      AND practice_type IN ('grammar', 'grammar_message');

  SELECT COUNT(*) INTO v_learn_count
    FROM charlotte.practices WHERE user_id = p_user_id AND practice_type = 'learn_exercise';

  SELECT COALESCE(SUM(xp_earned), 0) INTO v_today_xp
    FROM charlotte.practices WHERE user_id = p_user_id
      AND created_at >= current_date
      AND practice_type NOT LIKE 'achievement_reward_%'
      AND practice_type NOT LIKE 'mission_reward_%';

  SELECT COALESCE(jsonb_array_length(completed), 0) INTO v_trail_topics
    FROM charlotte.learn_progress
    WHERE user_id = p_user_id AND level = v_user_level;

  FOR ach IN
    SELECT a.* FROM charlotte.achievements a
    WHERE a.user_level = v_user_level AND a.is_active = true
    ORDER BY a.sort_order, a.code
  LOOP
    CONTINUE WHEN EXISTS (
      SELECT 1 FROM charlotte.user_achievements
      WHERE user_id = p_user_id::text AND achievement_id = ach.id
    );

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
