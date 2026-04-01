-- ─────────────────────────────────────────────────────────────────────────────
-- 031_fix_award_achievements.sql
--
-- Problem: rn_award_achievements was inserting into rn_user_practices from
-- a SECURITY DEFINER RPC, but RLS (auth.uid() = user_id) blocks that INSERT
-- because auth.uid() is NULL when called from a server-side function context.
--
-- Fix: revert to direct UPDATE on rn_user_progress + rn_leaderboard_cache.
-- The modal now queries user_achievements directly for today's bonus XP and
-- merges them into Atividade Recente — so display is still correct.
--
-- Also: revert rn_on_practice_insert to NOT insert achievement_reward rows
-- (that was added in 030 and also caused issues).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Restore clean trigger (no achievement_reward inserts) ─────────────────

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
  v_ach_name     text;
  v_ach_desc     text;
  v_ach_rarity   text;
  v_ach_icon     text;
  v_ach_bonus    int;
BEGIN
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

  -- Only check milestones for real practice types (not mission/achievement rewards)
  IF NEW.practice_type NOT LIKE 'mission_reward_%'
     AND NEW.practice_type NOT LIKE 'achievement_reward_%' THEN

    SELECT total_xp - NEW.xp_earned INTO v_old_xp
      FROM public.rn_user_progress WHERE user_id = NEW.user_id;
    v_new_xp := v_old_xp + NEW.xp_earned;

    FOREACH v_milestone IN ARRAY v_milestones LOOP
      IF v_old_xp < v_milestone AND v_new_xp >= v_milestone THEN

        v_ach_name   := CASE v_milestone WHEN 100 THEN 'Primeiros Passos' WHEN 250 THEN 'Em Progresso' WHEN 500 THEN 'Meio Caminho' WHEN 1000 THEN 'Dedicado' WHEN 2500 THEN 'Avançando' WHEN 5000 THEN 'Expert' WHEN 10000 THEN 'Mestre' END;
        v_ach_desc   := CASE v_milestone WHEN 100 THEN 'Você ganhou seus primeiros 100 XP!' WHEN 250 THEN 'Chegou a 250 XP — continue assim!' WHEN 500 THEN '500 XP conquistados!' WHEN 1000 THEN '1.000 XP — você é dedicado!' WHEN 2500 THEN '2.500 XP — impressionante!' WHEN 5000 THEN '5.000 XP — nível expert!' WHEN 10000 THEN '10.000 XP — você é um mestre!' END;
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
          -- Credit bonus XP directly (no practice insert to avoid recursion)
          UPDATE public.rn_user_progress
            SET total_xp = total_xp + v_ach_bonus, updated_at = now()
            WHERE user_id = NEW.user_id;
          UPDATE public.rn_leaderboard_cache
            SET total_xp = total_xp + v_ach_bonus, updated_at = now()
            WHERE user_id = NEW.user_id;
        END IF;
      END IF;
    END LOOP;

  END IF;

  -- Upsert leaderboard cache
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


-- ── 2. Fix rn_award_achievements: direct UPDATE, no rn_user_practices inserts ─

CREATE OR REPLACE FUNCTION public.rn_award_achievements(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_xp       int  := 0;
  v_streak         int  := 0;
  v_total_practices int := 0;
  v_text_count     int  := 0;
  v_audio_count    int  := 0;
  v_grammar_count  int  := 0;
  v_learn_count    int  := 0;
  v_today_xp       int  := 0;
  v_current_hour   int  := EXTRACT(HOUR FROM now() AT TIME ZONE 'America/Sao_Paulo');
  v_awarded        jsonb := '[]'::jsonb;
  v_code   text; v_name text; v_desc text; v_icon text;
  v_rarity text; v_bonus int; v_cat  text;
BEGIN
  SELECT COALESCE(total_xp, 0), COALESCE(streak_days, 0)
    INTO v_total_xp, v_streak
    FROM public.rn_user_progress WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_total_practices
    FROM public.rn_user_practices
    WHERE user_id = p_user_id
      AND practice_type NOT LIKE 'achievement_reward_%'
      AND practice_type NOT LIKE 'mission_reward_%';

  SELECT COUNT(*) INTO v_text_count
    FROM public.rn_user_practices WHERE user_id = p_user_id AND practice_type = 'text_message';

  SELECT COUNT(*) INTO v_audio_count
    FROM public.rn_user_practices WHERE user_id = p_user_id
      AND practice_type IN ('audio_message', 'live_voice', 'pronunciation');

  SELECT COUNT(*) INTO v_grammar_count
    FROM public.rn_user_practices WHERE user_id = p_user_id AND practice_type = 'grammar';

  SELECT COUNT(*) INTO v_learn_count
    FROM public.rn_user_practices WHERE user_id = p_user_id AND practice_type = 'learn_exercise';

  SELECT COALESCE(SUM(xp_earned), 0) INTO v_today_xp
    FROM public.rn_user_practices WHERE user_id = p_user_id AND created_at >= current_date;

  -- Shared award macro (inline repeated per achievement):
  -- Insert achievement + UPDATE rn_user_progress + UPDATE rn_leaderboard_cache

  -- ── PRIMEIRAS VEZES ──────────────────────────────────────────────────────

  v_code:='first_practice'; v_name:='Olá, Mundo!'; v_desc:='Você completou sua primeira prática!'; v_icon:='first_practice'; v_rarity:='common'; v_bonus:=20; v_cat:='general';
  IF v_total_practices>=1 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A3FF3C',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='first_text'; v_name:='Primeira Conversa'; v_desc:='Você enviou sua primeira mensagem de texto!'; v_icon:='first_text'; v_rarity:='common'; v_bonus:=20; v_cat:='text';
  IF v_text_count>=1 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#60A5FA',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='first_audio'; v_name:='Primeira Voz'; v_desc:='Você gravou sua primeira mensagem de voz!'; v_icon:='first_audio'; v_rarity:='common'; v_bonus:=25; v_cat:='audio';
  IF v_audio_count>=1 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#F472B6',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='first_grammar'; v_name:='Gramático Iniciante'; v_desc:='Você fez sua primeira prática de gramática!'; v_icon:='first_grammar'; v_rarity:='common'; v_bonus:=25; v_cat:='grammar';
  IF v_grammar_count>=1 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A3FF3C',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='first_learn'; v_name:='Na Trilha'; v_desc:='Você começou a Trilha de Aprendizado!'; v_icon:='first_learn'; v_rarity:='common'; v_bonus:=20; v_cat:='learn';
  IF v_learn_count>=1 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A3FF3C',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  -- ── VOLUME ───────────────────────────────────────────────────────────────

  v_code:='practices_10'; v_name:='Aquecendo'; v_desc:='Você completou 10 práticas — está começando a pegar o jeito!'; v_icon:='practices_10'; v_rarity:='common'; v_bonus:=35; v_cat:='general';
  IF v_total_practices>=10 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#FF6B35',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='practices_50'; v_name:='No Ritmo'; v_desc:='50 práticas! Você está criando um hábito de verdade.'; v_icon:='practices_50'; v_rarity:='rare'; v_bonus:=80; v_cat:='general';
  IF v_total_practices>=50 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#3B82F6',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='practices_100'; v_name:='Comprometido'; v_desc:='100 práticas — você é verdadeiramente comprometido!'; v_icon:='practices_100'; v_rarity:='epic'; v_bonus:=160; v_cat:='general';
  IF v_total_practices>=100 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A855F7',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='practices_500'; v_name:='Lenda da Prática'; v_desc:='500 práticas. Você é uma lenda!'; v_icon:='practices_500'; v_rarity:='legendary'; v_bonus:=500; v_cat:='general';
  IF v_total_practices>=500 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#EAB308',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  -- ── STREAK ───────────────────────────────────────────────────────────────

  v_code:='streak_3'; v_name:='Consistente'; v_desc:='3 dias seguidos — a consistência é o segredo!'; v_icon:='streak_3'; v_rarity:='common'; v_bonus:=30; v_cat:='streak';
  IF v_streak>=3 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#FF6B35',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='streak_7'; v_name:='Semana Completa'; v_desc:='Uma semana inteira sem falhar — incrível!'; v_icon:='streak_7'; v_rarity:='rare'; v_bonus:=75; v_cat:='streak';
  IF v_streak>=7 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#3B82F6',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='streak_14'; v_name:='Duas Semanas'; v_desc:='14 dias consecutivos — você é imparável!'; v_icon:='streak_14'; v_rarity:='epic'; v_bonus:=150; v_cat:='streak';
  IF v_streak>=14 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A855F7',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='streak_30'; v_name:='Mês de Ouro'; v_desc:='30 dias seguidos — dedicação extraordinária!'; v_icon:='streak_30'; v_rarity:='legendary'; v_bonus:=400; v_cat:='streak';
  IF v_streak>=30 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#EAB308',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  -- ── CHAT ─────────────────────────────────────────────────────────────────

  v_code:='text_25'; v_name:='Comunicativo'; v_desc:='25 conversas por texto — você adora conversar!'; v_icon:='text_25'; v_rarity:='rare'; v_bonus:=70; v_cat:='text';
  IF v_text_count>=25 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#3B82F6',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='text_100'; v_name:='Fluente no Chat'; v_desc:='100 conversas por texto — você domina a escrita!'; v_icon:='text_100'; v_rarity:='epic'; v_bonus:=150; v_cat:='text';
  IF v_text_count>=100 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A855F7',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  -- ── AUDIO ────────────────────────────────────────────────────────────────

  v_code:='audio_10'; v_name:='Falante'; v_desc:='10 mensagens de voz — você não tem medo de falar!'; v_icon:='audio_10'; v_rarity:='rare'; v_bonus:=65; v_cat:='audio';
  IF v_audio_count>=10 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#F472B6',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='audio_50'; v_name:='Voz de Ouro'; v_desc:='50 mensagens de voz — sua pronúncia está evoluindo muito!'; v_icon:='audio_50'; v_rarity:='epic'; v_bonus:=150; v_cat:='audio';
  IF v_audio_count>=50 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A855F7',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='audio_200'; v_name:='Locutor Profissional'; v_desc:='200 mensagens de voz — você fala inglês com naturalidade!'; v_icon:='audio_200'; v_rarity:='legendary'; v_bonus:=350; v_cat:='audio';
  IF v_audio_count>=200 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#EAB308',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  -- ── GRAMÁTICA ────────────────────────────────────────────────────────────

  v_code:='grammar_20'; v_name:='Gramático Avançado'; v_desc:='20 práticas de gramática — suas frases estão melhorando!'; v_icon:='grammar_20'; v_rarity:='rare'; v_bonus:=70; v_cat:='grammar';
  IF v_grammar_count>=20 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#3B82F6',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='grammar_50'; v_name:='Mestre da Gramática'; v_desc:='50 práticas de gramática — você domina as regras!'; v_icon:='grammar_50'; v_rarity:='epic'; v_bonus:=150; v_cat:='grammar';
  IF v_grammar_count>=50 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A855F7',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  -- ── TRILHA ───────────────────────────────────────────────────────────────

  v_code:='learn_25'; v_name:='Trilheiro'; v_desc:='25 exercícios na trilha — você está evoluindo!'; v_icon:='learn_25'; v_rarity:='rare'; v_bonus:=70; v_cat:='learn';
  IF v_learn_count>=25 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#3B82F6',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='learn_100'; v_name:='Mestre da Trilha'; v_desc:='100 exercícios na trilha — você completou uma jornada incrível!'; v_icon:='learn_100'; v_rarity:='epic'; v_bonus:=160; v_cat:='learn';
  IF v_learn_count>=100 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A855F7',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  -- ── SUPER DIA ────────────────────────────────────────────────────────────

  v_code:='daily_100'; v_name:='Super Dia'; v_desc:='100 XP em um único dia — que energia!'; v_icon:='daily_100'; v_rarity:='rare'; v_bonus:=60; v_cat:='habit';
  IF v_today_xp>=100 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code AND earned_at>=current_date) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#3B82F6',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='daily_200'; v_name:='Dia Lendário'; v_desc:='200 XP em um único dia — você foi longe hoje!'; v_icon:='daily_200'; v_rarity:='epic'; v_bonus:=120; v_cat:='habit';
  IF v_today_xp>=200 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code AND earned_at>=current_date) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A855F7',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  -- ── HORÁRIO ──────────────────────────────────────────────────────────────

  v_code:='early_bird'; v_name:='Madrugador'; v_desc:='Você praticou inglês antes das 8h — que dedicação!'; v_icon:='early_bird'; v_rarity:='rare'; v_bonus:=50; v_cat:='habit';
  IF v_current_hour<8 AND v_today_xp>0 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#F59E0B',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='night_owl'; v_name:='Coruja Noturna'; v_desc:='Você praticou depois das 22h — os noturnos são os mais determinados!'; v_icon:='night_owl'; v_rarity:='rare'; v_bonus:=50; v_cat:='habit';
  IF v_current_hour>=22 AND v_today_xp>0 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#6366F1',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  RETURN v_awarded;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rn_award_achievements(uuid) TO authenticated;
