-- ─────────────────────────────────────────────────────────────────────────────
-- 028_fix_trigger_achievement_columns.sql
-- Fix: remove non-existent columns (title, description) from the XP milestone
-- achievement INSERT inside rn_on_practice_insert trigger.
-- charlotte.user_achievements only has achievement_name / achievement_description.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.rn_on_practice_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_xp       int;
  v_new_xp       int;
  v_today        date := current_date;
  v_milestones   int[] := ARRAY[100, 250, 500, 1000, 2500, 5000, 10000];
  v_milestone    int;
  v_user_level   text;
  v_display_name text;
BEGIN
  -- ── Upsert rn_user_progress ──────────────────────────────────────────────
  INSERT INTO public.rn_user_progress (user_id, total_xp, streak_days, last_practice_date, updated_at)
    VALUES (NEW.user_id, NEW.xp_earned, 1, v_today, now())
  ON CONFLICT (user_id) DO UPDATE
    SET total_xp           = rn_user_progress.total_xp + NEW.xp_earned,
        streak_days        = CASE
                               WHEN rn_user_progress.last_practice_date = v_today - 1 THEN rn_user_progress.streak_days + 1
                               WHEN rn_user_progress.last_practice_date = v_today     THEN rn_user_progress.streak_days
                               ELSE 1
                             END,
        last_practice_date = v_today,
        updated_at         = now();

  -- Read the XP before this practice (total_xp now includes this one)
  SELECT total_xp - NEW.xp_earned INTO v_old_xp
    FROM public.rn_user_progress WHERE user_id = NEW.user_id;

  v_new_xp := v_old_xp + NEW.xp_earned;

  -- ── XP milestone achievements ────────────────────────────────────────────
  FOREACH v_milestone IN ARRAY v_milestones LOOP
    IF v_old_xp < v_milestone AND v_new_xp >= v_milestone THEN
      INSERT INTO charlotte.user_achievements (
        user_id, achievement_id, achievement_type,
        achievement_name, achievement_description,
        xp_bonus, rarity, badge_icon, badge_color, category
      )
      VALUES (
        NEW.user_id::text,
        'rn_xp_' || v_milestone,
        'xp_milestone',
        CASE v_milestone
          WHEN 100   THEN 'Primeiros Passos'
          WHEN 250   THEN 'Em Progresso'
          WHEN 500   THEN 'Meio Caminho'
          WHEN 1000  THEN 'Dedicado'
          WHEN 2500  THEN 'Avançando'
          WHEN 5000  THEN 'Expert'
          WHEN 10000 THEN 'Mestre'
        END,
        CASE v_milestone
          WHEN 100   THEN 'Você ganhou seus primeiros 100 XP!'
          WHEN 250   THEN 'Chegou a 250 XP — continue assim!'
          WHEN 500   THEN '500 XP conquistados!'
          WHEN 1000  THEN '1.000 XP — você é dedicado!'
          WHEN 2500  THEN '2.500 XP — impressionante!'
          WHEN 5000  THEN '5.000 XP — nível expert!'
          WHEN 10000 THEN '10.000 XP — você é um mestre!'
        END,
        0,  -- xp_bonus
        CASE v_milestone
          WHEN 100   THEN 'common'
          WHEN 250   THEN 'common'
          WHEN 500   THEN 'rare'
          WHEN 1000  THEN 'rare'
          WHEN 2500  THEN 'epic'
          WHEN 5000  THEN 'epic'
          WHEN 10000 THEN 'legendary'
        END,
        CASE v_milestone
          WHEN 100   THEN '🌱'
          WHEN 250   THEN '⚡'
          WHEN 500   THEN '🔥'
          WHEN 1000  THEN '💎'
          WHEN 2500  THEN '🚀'
          WHEN 5000  THEN '👑'
          WHEN 10000 THEN '🏆'
        END,
        '#A3FF3C',
        'xp_milestone'
      )
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END IF;
  END LOOP;

  -- ── Upsert rn_leaderboard_cache ──────────────────────────────────────────
  SELECT COALESCE(u.user_level, 'Novice'),
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
    FROM public.users u WHERE u.id = NEW.user_id;

  INSERT INTO public.rn_leaderboard_cache (user_id, user_level, display_name, total_xp, updated_at)
    VALUES (NEW.user_id, COALESCE(v_user_level, 'Novice'), COALESCE(v_display_name, 'Anonymous'), NEW.xp_earned, now())
  ON CONFLICT (user_id) DO UPDATE
    SET total_xp     = rn_leaderboard_cache.total_xp + EXCLUDED.total_xp,
        user_level   = COALESCE(v_user_level, rn_leaderboard_cache.user_level),
        display_name = COALESCE(v_display_name, rn_leaderboard_cache.display_name),
        updated_at   = now();

  RETURN NEW;
END;
$$;
