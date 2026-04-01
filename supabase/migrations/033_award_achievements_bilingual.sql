-- ─────────────────────────────────────────────────────────────────────────────
-- 033_award_achievements_bilingual.sql
--
-- Update rn_award_achievements to detect user level and use English names/
-- descriptions for Inter and Advanced users (Novice stays in Portuguese).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.rn_award_achievements(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_xp        int  := 0;
  v_streak          int  := 0;
  v_total_practices int  := 0;
  v_text_count      int  := 0;
  v_audio_count     int  := 0;
  v_grammar_count   int  := 0;
  v_learn_count     int  := 0;
  v_today_xp        int  := 0;
  v_current_hour    int  := EXTRACT(HOUR FROM now() AT TIME ZONE 'America/Sao_Paulo');
  v_awarded         jsonb := '[]'::jsonb;
  v_code  text; v_name text; v_desc text; v_icon text;
  v_rarity text; v_bonus int; v_cat text;
  v_user_level text := 'Novice';
  v_is_pt  boolean;
BEGIN
  -- Detect user level for language selection
  SELECT COALESCE(user_level, 'Novice') INTO v_user_level
    FROM public.users WHERE id = p_user_id;
  v_is_pt := (v_user_level = 'Novice');

  -- Gather stats
  SELECT COALESCE(total_xp, 0), COALESCE(streak_days, 0)
    INTO v_total_xp, v_streak
    FROM public.rn_user_progress WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_total_practices FROM public.rn_user_practices
    WHERE user_id = p_user_id
      AND practice_type NOT LIKE 'achievement_reward_%'
      AND practice_type NOT LIKE 'mission_reward_%';

  SELECT COUNT(*) INTO v_text_count FROM public.rn_user_practices
    WHERE user_id = p_user_id AND practice_type = 'text_message';

  SELECT COUNT(*) INTO v_audio_count FROM public.rn_user_practices
    WHERE user_id = p_user_id
      AND practice_type IN ('audio_message', 'live_voice', 'pronunciation');

  SELECT COUNT(*) INTO v_grammar_count FROM public.rn_user_practices
    WHERE user_id = p_user_id AND practice_type = 'grammar';

  SELECT COUNT(*) INTO v_learn_count FROM public.rn_user_practices
    WHERE user_id = p_user_id AND practice_type = 'learn_exercise';

  SELECT COALESCE(SUM(xp_earned), 0) INTO v_today_xp FROM public.rn_user_practices
    WHERE user_id = p_user_id AND created_at >= current_date;

  -- ── PRIMEIRAS VEZES / FIRST TIMES ────────────────────────────────────────

  v_code:='first_practice';
  v_name:=CASE WHEN v_is_pt THEN 'Olá, Mundo!'       ELSE 'Hello, World!'               END;
  v_desc:=CASE WHEN v_is_pt THEN 'Você completou sua primeira prática!'
                             ELSE 'You completed your first practice!'                    END;
  v_icon:='first_practice'; v_rarity:='common'; v_bonus:=20; v_cat:='general';
  IF v_total_practices>=1 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A3FF3C',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='first_text';
  v_name:=CASE WHEN v_is_pt THEN 'Primeira Conversa'  ELSE 'First Conversation'          END;
  v_desc:=CASE WHEN v_is_pt THEN 'Você enviou sua primeira mensagem de texto!'
                             ELSE 'You sent your first text message!'                     END;
  v_icon:='first_text'; v_rarity:='common'; v_bonus:=20; v_cat:='text';
  IF v_text_count>=1 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#60A5FA',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='first_audio';
  v_name:=CASE WHEN v_is_pt THEN 'Primeira Voz'       ELSE 'First Voice'                 END;
  v_desc:=CASE WHEN v_is_pt THEN 'Você gravou sua primeira mensagem de voz!'
                             ELSE 'You recorded your first voice message!'                END;
  v_icon:='first_audio'; v_rarity:='common'; v_bonus:=25; v_cat:='audio';
  IF v_audio_count>=1 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#F472B6',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='first_grammar';
  v_name:=CASE WHEN v_is_pt THEN 'Gramático Iniciante' ELSE 'Grammar Starter'            END;
  v_desc:=CASE WHEN v_is_pt THEN 'Você fez sua primeira prática de gramática!'
                             ELSE 'You completed your first grammar practice!'            END;
  v_icon:='first_grammar'; v_rarity:='common'; v_bonus:=25; v_cat:='grammar';
  IF v_grammar_count>=1 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A3FF3C',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='first_learn';
  v_name:=CASE WHEN v_is_pt THEN 'Na Trilha'           ELSE 'On the Trail'               END;
  v_desc:=CASE WHEN v_is_pt THEN 'Você começou a Trilha de Aprendizado!'
                             ELSE 'You started the Learning Trail!'                       END;
  v_icon:='first_learn'; v_rarity:='common'; v_bonus:=20; v_cat:='learn';
  IF v_learn_count>=1 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A3FF3C',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  -- ── VOLUME ───────────────────────────────────────────────────────────────

  v_code:='practices_10';
  v_name:=CASE WHEN v_is_pt THEN 'Aquecendo'           ELSE 'Warming Up'                 END;
  v_desc:=CASE WHEN v_is_pt THEN 'Você completou 10 práticas — está começando a pegar o jeito!'
                             ELSE '10 practices done — you are getting the hang of it!'  END;
  v_icon:='practices_10'; v_rarity:='common'; v_bonus:=35; v_cat:='general';
  IF v_total_practices>=10 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#FF6B35',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='practices_50';
  v_name:=CASE WHEN v_is_pt THEN 'No Ritmo'            ELSE 'In the Zone'                END;
  v_desc:=CASE WHEN v_is_pt THEN '50 práticas! Você está criando um hábito de verdade.'
                             ELSE '50 practices! You are building a real habit.'          END;
  v_icon:='practices_50'; v_rarity:='rare'; v_bonus:=80; v_cat:='general';
  IF v_total_practices>=50 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#3B82F6',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='practices_100';
  v_name:=CASE WHEN v_is_pt THEN 'Comprometido'        ELSE 'Committed'                  END;
  v_desc:=CASE WHEN v_is_pt THEN '100 práticas — você é verdadeiramente comprometido!'
                             ELSE '100 practices — you are truly committed!'              END;
  v_icon:='practices_100'; v_rarity:='epic'; v_bonus:=160; v_cat:='general';
  IF v_total_practices>=100 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A855F7',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='practices_500';
  v_name:=CASE WHEN v_is_pt THEN 'Lenda da Prática'   ELSE 'Practice Legend'             END;
  v_desc:=CASE WHEN v_is_pt THEN '500 práticas. Você é uma lenda!'
                             ELSE '500 practices. You are a legend!'                      END;
  v_icon:='practices_500'; v_rarity:='legendary'; v_bonus:=500; v_cat:='general';
  IF v_total_practices>=500 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#EAB308',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  -- ── STREAK ───────────────────────────────────────────────────────────────

  v_code:='streak_3';
  v_name:=CASE WHEN v_is_pt THEN 'Consistente'         ELSE 'Consistent'                 END;
  v_desc:=CASE WHEN v_is_pt THEN '3 dias seguidos — a consistência é o segredo!'
                             ELSE '3 days in a row — consistency is the key!'             END;
  v_icon:='streak_3'; v_rarity:='common'; v_bonus:=30; v_cat:='streak';
  IF v_streak>=3 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#FF6B35',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='streak_7';
  v_name:=CASE WHEN v_is_pt THEN 'Semana Completa'     ELSE 'Full Week'                  END;
  v_desc:=CASE WHEN v_is_pt THEN 'Uma semana inteira sem falhar — incrível!'
                             ELSE 'A full week without missing a day — amazing!'          END;
  v_icon:='streak_7'; v_rarity:='rare'; v_bonus:=75; v_cat:='streak';
  IF v_streak>=7 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#3B82F6',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='streak_14';
  v_name:=CASE WHEN v_is_pt THEN 'Duas Semanas'        ELSE 'Two Weeks'                  END;
  v_desc:=CASE WHEN v_is_pt THEN '14 dias consecutivos — você é imparável!'
                             ELSE '14 days in a row — you are unstoppable!'               END;
  v_icon:='streak_14'; v_rarity:='epic'; v_bonus:=150; v_cat:='streak';
  IF v_streak>=14 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A855F7',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='streak_30';
  v_name:=CASE WHEN v_is_pt THEN 'Mês de Ouro'         ELSE 'Golden Month'               END;
  v_desc:=CASE WHEN v_is_pt THEN '30 dias seguidos — dedicação extraordinária!'
                             ELSE '30 days in a row — extraordinary dedication!'          END;
  v_icon:='streak_30'; v_rarity:='legendary'; v_bonus:=400; v_cat:='streak';
  IF v_streak>=30 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#EAB308',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  -- ── CHAT / TEXT ───────────────────────────────────────────────────────────

  v_code:='text_25';
  v_name:=CASE WHEN v_is_pt THEN 'Comunicativo'        ELSE 'Communicative'              END;
  v_desc:=CASE WHEN v_is_pt THEN '25 conversas por texto — você adora conversar!'
                             ELSE '25 text conversations — you love to chat!'             END;
  v_icon:='text_25'; v_rarity:='rare'; v_bonus:=70; v_cat:='text';
  IF v_text_count>=25 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#3B82F6',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='text_100';
  v_name:=CASE WHEN v_is_pt THEN 'Fluente no Chat'     ELSE 'Chat Fluent'                END;
  v_desc:=CASE WHEN v_is_pt THEN '100 conversas por texto — você domina a escrita!'
                             ELSE '100 text conversations — you master writing!'          END;
  v_icon:='text_100'; v_rarity:='epic'; v_bonus:=150; v_cat:='text';
  IF v_text_count>=100 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A855F7',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  -- ── AUDIO ────────────────────────────────────────────────────────────────

  v_code:='audio_10';
  v_name:=CASE WHEN v_is_pt THEN 'Falante'             ELSE 'Speaker'                    END;
  v_desc:=CASE WHEN v_is_pt THEN '10 mensagens de voz — você não tem medo de falar!'
                             ELSE '10 voice messages — you are not afraid to speak!'      END;
  v_icon:='audio_10'; v_rarity:='rare'; v_bonus:=65; v_cat:='audio';
  IF v_audio_count>=10 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#F472B6',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='audio_50';
  v_name:=CASE WHEN v_is_pt THEN 'Voz de Ouro'         ELSE 'Golden Voice'               END;
  v_desc:=CASE WHEN v_is_pt THEN '50 mensagens de voz — sua pronúncia está evoluindo muito!'
                             ELSE '50 voice messages — your pronunciation is improving a lot!' END;
  v_icon:='audio_50'; v_rarity:='epic'; v_bonus:=150; v_cat:='audio';
  IF v_audio_count>=50 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A855F7',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='audio_200';
  v_name:=CASE WHEN v_is_pt THEN 'Locutor Profissional' ELSE 'Pro Speaker'               END;
  v_desc:=CASE WHEN v_is_pt THEN '200 mensagens de voz — você fala inglês com naturalidade!'
                             ELSE '200 voice messages — you speak English naturally!'     END;
  v_icon:='audio_200'; v_rarity:='legendary'; v_bonus:=350; v_cat:='audio';
  IF v_audio_count>=200 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#EAB308',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  -- ── GRAMMAR ──────────────────────────────────────────────────────────────

  v_code:='grammar_20';
  v_name:=CASE WHEN v_is_pt THEN 'Gramático Avançado'  ELSE 'Grammar Expert'             END;
  v_desc:=CASE WHEN v_is_pt THEN '20 práticas de gramática — suas frases estão melhorando!'
                             ELSE '20 grammar practices — your sentences are improving!'  END;
  v_icon:='grammar_20'; v_rarity:='rare'; v_bonus:=70; v_cat:='grammar';
  IF v_grammar_count>=20 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#3B82F6',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='grammar_50';
  v_name:=CASE WHEN v_is_pt THEN 'Mestre da Gramática' ELSE 'Grammar Master'             END;
  v_desc:=CASE WHEN v_is_pt THEN '50 práticas de gramática — você domina as regras!'
                             ELSE '50 grammar practices — you master the rules!'          END;
  v_icon:='grammar_50'; v_rarity:='epic'; v_bonus:=150; v_cat:='grammar';
  IF v_grammar_count>=50 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A855F7',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  -- ── TRILHA / TRAIL ───────────────────────────────────────────────────────

  v_code:='learn_25';
  v_name:=CASE WHEN v_is_pt THEN 'Trilheiro'           ELSE 'Trail Blazer'               END;
  v_desc:=CASE WHEN v_is_pt THEN '25 exercícios na trilha — você está evoluindo!'
                             ELSE '25 trail exercises — you are improving!'               END;
  v_icon:='learn_25'; v_rarity:='rare'; v_bonus:=70; v_cat:='learn';
  IF v_learn_count>=25 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#3B82F6',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='learn_100';
  v_name:=CASE WHEN v_is_pt THEN 'Mestre da Trilha'    ELSE 'Trail Master'               END;
  v_desc:=CASE WHEN v_is_pt THEN '100 exercícios na trilha — você completou uma jornada incrível!'
                             ELSE '100 trail exercises — you completed an incredible journey!' END;
  v_icon:='learn_100'; v_rarity:='epic'; v_bonus:=160; v_cat:='learn';
  IF v_learn_count>=100 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A855F7',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  -- ── SUPER DIA / SUPER DAY ────────────────────────────────────────────────

  v_code:='daily_100';
  v_name:=CASE WHEN v_is_pt THEN 'Super Dia'           ELSE 'Super Day'                  END;
  v_desc:=CASE WHEN v_is_pt THEN '100 XP em um único dia — que energia!'
                             ELSE '100 XP in a single day — what energy!'                 END;
  v_icon:='daily_100'; v_rarity:='rare'; v_bonus:=60; v_cat:='habit';
  IF v_today_xp>=100 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code AND earned_at>=current_date) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#3B82F6',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='daily_200';
  v_name:=CASE WHEN v_is_pt THEN 'Dia Lendário'        ELSE 'Legendary Day'              END;
  v_desc:=CASE WHEN v_is_pt THEN '200 XP em um único dia — você foi longe hoje!'
                             ELSE '200 XP in a single day — you went all out today!'      END;
  v_icon:='daily_200'; v_rarity:='epic'; v_bonus:=120; v_cat:='habit';
  IF v_today_xp>=200 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code AND earned_at>=current_date) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A855F7',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  -- ── HORÁRIO / TIME OF DAY ────────────────────────────────────────────────

  v_code:='early_bird';
  v_name:=CASE WHEN v_is_pt THEN 'Madrugador'          ELSE 'Early Bird'                 END;
  v_desc:=CASE WHEN v_is_pt THEN 'Você praticou inglês antes das 8h — que dedicação!'
                             ELSE 'You practiced English before 8am — what dedication!'   END;
  v_icon:='early_bird'; v_rarity:='rare'; v_bonus:=50; v_cat:='habit';
  IF v_current_hour<8 AND v_today_xp>0 AND NOT EXISTS(SELECT 1 FROM charlotte.user_achievements WHERE user_id=p_user_id::text AND achievement_type=v_code) THEN
    INSERT INTO charlotte.user_achievements(user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category) VALUES(p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#F59E0B',v_cat);
    UPDATE public.rn_user_progress SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp=total_xp+v_bonus,updated_at=now() WHERE user_id=p_user_id;
    v_awarded:=v_awarded||jsonb_build_object('name',v_name,'bonus',v_bonus);
  END IF;

  v_code:='night_owl';
  v_name:=CASE WHEN v_is_pt THEN 'Coruja Noturna'      ELSE 'Night Owl'                  END;
  v_desc:=CASE WHEN v_is_pt THEN 'Você praticou depois das 22h — os noturnos são os mais determinados!'
                             ELSE 'You practiced after 10pm — night owls are the most determined!' END;
  v_icon:='night_owl'; v_rarity:='rare'; v_bonus:=50; v_cat:='habit';
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
