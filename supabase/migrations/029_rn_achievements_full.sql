-- ─────────────────────────────────────────────────────────────────────────────
-- 029_rn_achievements_full.sql
-- Full RN achievement system — 30 achievements across 7 categories.
-- Called via RPC rn_award_achievements(user_id) after every XP-earning event.
-- XP milestones are handled separately by rn_on_practice_insert trigger.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.rn_award_achievements(p_user_id uuid)
RETURNS jsonb   -- returns array of newly awarded achievement names
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- User stats
  v_total_xp        int  := 0;
  v_streak           int  := 0;
  v_total_practices  int  := 0;
  v_text_count       int  := 0;
  v_audio_count      int  := 0;
  v_grammar_count    int  := 0;
  v_learn_count      int  := 0;
  v_today_xp         int  := 0;
  v_current_hour     int  := EXTRACT(HOUR FROM now() AT TIME ZONE 'America/Sao_Paulo');
  v_awarded          jsonb := '[]'::jsonb;

  -- Helper vars
  v_code   text;
  v_name   text;
  v_desc   text;
  v_icon   text;
  v_rarity text;
  v_bonus  int;
  v_cat    text;

BEGIN
  -- ── Gather user stats ────────────────────────────────────────────────────
  SELECT COALESCE(total_xp, 0), COALESCE(streak_days, 0)
    INTO v_total_xp, v_streak
    FROM public.rn_user_progress WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_total_practices
    FROM public.rn_user_practices WHERE user_id = p_user_id;

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

  -- ── Helper: award if not already earned ──────────────────────────────────
  -- Uses a local function-like block repeated for each achievement.
  -- Pattern: set vars → call insert block

  -- ════════════════════════════════════════════════════════════════════════
  -- CATEGORY 1 · PRIMEIRAS VEZES
  -- ════════════════════════════════════════════════════════════════════════

  -- First practice ever
  v_code := 'first_practice'; v_name := 'Olá, Mundo!';
  v_desc := 'Você completou sua primeira prática!';
  v_icon := '👋'; v_rarity := 'common'; v_bonus := 20; v_cat := 'general';
  IF v_total_practices >= 1 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements
    WHERE user_id = p_user_id::text AND achievement_type = v_code
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A3FF3C',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  -- First text chat
  v_code := 'first_text'; v_name := 'Primeira Conversa';
  v_desc := 'Você enviou sua primeira mensagem de texto!';
  v_icon := '💬'; v_rarity := 'common'; v_bonus := 20; v_cat := 'text';
  IF v_text_count >= 1 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements WHERE user_id = p_user_id::text AND achievement_type = v_code
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#60A5FA',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  -- First audio
  v_code := 'first_audio'; v_name := 'Primeira Voz';
  v_desc := 'Você gravou sua primeira mensagem de voz!';
  v_icon := '🎙️'; v_rarity := 'common'; v_bonus := 25; v_cat := 'audio';
  IF v_audio_count >= 1 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements WHERE user_id = p_user_id::text AND achievement_type = v_code
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#F472B6',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  -- First grammar
  v_code := 'first_grammar'; v_name := 'Gramático Iniciante';
  v_desc := 'Você fez sua primeira prática de gramática!';
  v_icon := '✍️'; v_rarity := 'common'; v_bonus := 25; v_cat := 'grammar';
  IF v_grammar_count >= 1 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements WHERE user_id = p_user_id::text AND achievement_type = v_code
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A3FF3C',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  -- First learn exercise
  v_code := 'first_learn'; v_name := 'Na Trilha';
  v_desc := 'Você começou a Trilha de Aprendizado!';
  v_icon := '🎓'; v_rarity := 'common'; v_bonus := 20; v_cat := 'learn';
  IF v_learn_count >= 1 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements WHERE user_id = p_user_id::text AND achievement_type = v_code
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A3FF3C',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  -- ════════════════════════════════════════════════════════════════════════
  -- CATEGORY 2 · VOLUME DE PRÁTICAS
  -- ════════════════════════════════════════════════════════════════════════

  -- 10 practices
  v_code := 'practices_10'; v_name := 'Aquecendo';
  v_desc := 'Você completou 10 práticas — está começando a pegar o jeito!';
  v_icon := '🔥'; v_rarity := 'common'; v_bonus := 35; v_cat := 'general';
  IF v_total_practices >= 10 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements WHERE user_id = p_user_id::text AND achievement_type = v_code
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#FF6B35',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  -- 50 practices
  v_code := 'practices_50'; v_name := 'No Ritmo';
  v_desc := '50 práticas! Você está criando um hábito de verdade.';
  v_icon := '⚡'; v_rarity := 'rare'; v_bonus := 80; v_cat := 'general';
  IF v_total_practices >= 50 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements WHERE user_id = p_user_id::text AND achievement_type = v_code
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#3B82F6',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  -- 100 practices
  v_code := 'practices_100'; v_name := 'Comprometido';
  v_desc := '100 práticas — você é verdadeiramente comprometido!';
  v_icon := '💪'; v_rarity := 'epic'; v_bonus := 160; v_cat := 'general';
  IF v_total_practices >= 100 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements WHERE user_id = p_user_id::text AND achievement_type = v_code
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A855F7',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  -- 500 practices
  v_code := 'practices_500'; v_name := 'Lenda da Prática';
  v_desc := '500 práticas. Você é uma lenda!';
  v_icon := '👑'; v_rarity := 'legendary'; v_bonus := 500; v_cat := 'general';
  IF v_total_practices >= 500 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements WHERE user_id = p_user_id::text AND achievement_type = v_code
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#EAB308',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  -- ════════════════════════════════════════════════════════════════════════
  -- CATEGORY 3 · STREAK
  -- ════════════════════════════════════════════════════════════════════════

  -- 3-day streak
  v_code := 'streak_3'; v_name := 'Consistente';
  v_desc := '3 dias seguidos — a consistência é o segredo!';
  v_icon := '🔥'; v_rarity := 'common'; v_bonus := 30; v_cat := 'streak';
  IF v_streak >= 3 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements WHERE user_id = p_user_id::text AND achievement_type = v_code
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#FF6B35',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  -- 7-day streak
  v_code := 'streak_7'; v_name := 'Semana Completa';
  v_desc := 'Uma semana inteira sem falhar — incrível!';
  v_icon := '📅'; v_rarity := 'rare'; v_bonus := 75; v_cat := 'streak';
  IF v_streak >= 7 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements WHERE user_id = p_user_id::text AND achievement_type = v_code
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#3B82F6',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  -- 14-day streak
  v_code := 'streak_14'; v_name := 'Duas Semanas';
  v_desc := '14 dias consecutivos — você é imparável!';
  v_icon := '🗓️'; v_rarity := 'epic'; v_bonus := 150; v_cat := 'streak';
  IF v_streak >= 14 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements WHERE user_id = p_user_id::text AND achievement_type = v_code
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A855F7',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  -- 30-day streak
  v_code := 'streak_30'; v_name := 'Mês de Ouro';
  v_desc := '30 dias seguidos — dedicação extraordinária!';
  v_icon := '🏅'; v_rarity := 'legendary'; v_bonus := 400; v_cat := 'streak';
  IF v_streak >= 30 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements WHERE user_id = p_user_id::text AND achievement_type = v_code
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#EAB308',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  -- ════════════════════════════════════════════════════════════════════════
  -- CATEGORY 4 · CHAT (TEXTO)
  -- ════════════════════════════════════════════════════════════════════════

  -- 25 text messages
  v_code := 'text_25'; v_name := 'Comunicativo';
  v_desc := '25 conversas por texto — você adora conversar!';
  v_icon := '💬'; v_rarity := 'rare'; v_bonus := 70; v_cat := 'text';
  IF v_text_count >= 25 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements WHERE user_id = p_user_id::text AND achievement_type = v_code
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#3B82F6',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  -- 100 text messages
  v_code := 'text_100'; v_name := 'Fluente no Chat';
  v_desc := '100 conversas por texto — você domina a escrita!';
  v_icon := '✍️'; v_rarity := 'epic'; v_bonus := 150; v_cat := 'text';
  IF v_text_count >= 100 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements WHERE user_id = p_user_id::text AND achievement_type = v_code
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A855F7',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  -- ════════════════════════════════════════════════════════════════════════
  -- CATEGORY 5 · ÁUDIO E VOZ
  -- ════════════════════════════════════════════════════════════════════════

  -- 10 audio messages
  v_code := 'audio_10'; v_name := 'Falante';
  v_desc := '10 mensagens de voz — você não tem medo de falar!';
  v_icon := '🎙️'; v_rarity := 'rare'; v_bonus := 65; v_cat := 'audio';
  IF v_audio_count >= 10 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements WHERE user_id = p_user_id::text AND achievement_type = v_code
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#F472B6',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  -- 50 audio messages
  v_code := 'audio_50'; v_name := 'Voz de Ouro';
  v_desc := '50 mensagens de voz — sua pronúncia está evoluindo muito!';
  v_icon := '🎤'; v_rarity := 'epic'; v_bonus := 150; v_cat := 'audio';
  IF v_audio_count >= 50 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements WHERE user_id = p_user_id::text AND achievement_type = v_code
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A855F7',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  -- 200 audio messages
  v_code := 'audio_200'; v_name := 'Locutor Profissional';
  v_desc := '200 mensagens de voz — você fala inglês com naturalidade!';
  v_icon := '🎵'; v_rarity := 'legendary'; v_bonus := 350; v_cat := 'audio';
  IF v_audio_count >= 200 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements WHERE user_id = p_user_id::text AND achievement_type = v_code
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#EAB308',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  -- ════════════════════════════════════════════════════════════════════════
  -- CATEGORY 6 · GRAMÁTICA
  -- ════════════════════════════════════════════════════════════════════════

  -- 20 grammar practices
  v_code := 'grammar_20'; v_name := 'Gramático Avançado';
  v_desc := '20 práticas de gramática — suas frases estão melhorando!';
  v_icon := '📖'; v_rarity := 'rare'; v_bonus := 70; v_cat := 'grammar';
  IF v_grammar_count >= 20 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements WHERE user_id = p_user_id::text AND achievement_type = v_code
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#3B82F6',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  -- 50 grammar practices
  v_code := 'grammar_50'; v_name := 'Mestre da Gramática';
  v_desc := '50 práticas de gramática — você domina as regras!';
  v_icon := '🏆'; v_rarity := 'epic'; v_bonus := 150; v_cat := 'grammar';
  IF v_grammar_count >= 50 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements WHERE user_id = p_user_id::text AND achievement_type = v_code
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A855F7',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  -- ════════════════════════════════════════════════════════════════════════
  -- CATEGORY 7 · TRILHA DE APRENDIZADO
  -- ════════════════════════════════════════════════════════════════════════

  -- 25 learn exercises
  v_code := 'learn_25'; v_name := 'Trilheiro';
  v_desc := '25 exercícios na trilha — você está evoluindo!';
  v_icon := '🗺️'; v_rarity := 'rare'; v_bonus := 70; v_cat := 'learn';
  IF v_learn_count >= 25 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements WHERE user_id = p_user_id::text AND achievement_type = v_code
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#3B82F6',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  -- 100 learn exercises
  v_code := 'learn_100'; v_name := 'Mestre da Trilha';
  v_desc := '100 exercícios na trilha — você completou uma jornada incrível!';
  v_icon := '🎓'; v_rarity := 'epic'; v_bonus := 160; v_cat := 'learn';
  IF v_learn_count >= 100 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements WHERE user_id = p_user_id::text AND achievement_type = v_code
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A855F7',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  -- ════════════════════════════════════════════════════════════════════════
  -- CATEGORY 8 · SUPER DIA (XP diário)
  -- ════════════════════════════════════════════════════════════════════════

  -- 100 XP in one day
  v_code := 'daily_100'; v_name := 'Super Dia';
  v_desc := '100 XP em um único dia — que energia!';
  v_icon := '⚡'; v_rarity := 'rare'; v_bonus := 60; v_cat := 'habit';
  IF v_today_xp >= 100 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements WHERE user_id = p_user_id::text AND achievement_type = v_code
    AND earned_at >= current_date
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#3B82F6',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  -- 200 XP in one day
  v_code := 'daily_200'; v_name := 'Dia Lendário';
  v_desc := '200 XP em um único dia — você foi longe hoje!';
  v_icon := '🚀'; v_rarity := 'epic'; v_bonus := 120; v_cat := 'habit';
  IF v_today_xp >= 200 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements WHERE user_id = p_user_id::text AND achievement_type = v_code
    AND earned_at >= current_date
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#A855F7',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  -- ════════════════════════════════════════════════════════════════════════
  -- CATEGORY 9 · HORÁRIO (madrugador / coruja)
  -- ════════════════════════════════════════════════════════════════════════

  -- Early bird (before 8am)
  v_code := 'early_bird'; v_name := 'Madrugador';
  v_desc := 'Você praticou inglês antes das 8h — que dedicação!';
  v_icon := '🌅'; v_rarity := 'rare'; v_bonus := 50; v_cat := 'habit';
  IF v_current_hour < 8 AND v_today_xp > 0 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements WHERE user_id = p_user_id::text AND achievement_type = v_code
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#F59E0B',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  -- Night owl (after 22h)
  v_code := 'night_owl'; v_name := 'Coruja Noturna';
  v_desc := 'Você praticou depois das 22h — os noturnos são os mais determinados!';
  v_icon := '🦉'; v_rarity := 'rare'; v_bonus := 50; v_cat := 'habit';
  IF v_current_hour >= 22 AND v_today_xp > 0 AND NOT EXISTS (
    SELECT 1 FROM charlotte.user_achievements WHERE user_id = p_user_id::text AND achievement_type = v_code
  ) THEN
    INSERT INTO charlotte.user_achievements (user_id,achievement_type,achievement_name,achievement_description,xp_bonus,rarity,badge_icon,badge_color,category)
    VALUES (p_user_id::text,v_code,v_name,v_desc,v_bonus,v_rarity,v_icon,'#6366F1',v_cat);
    UPDATE public.rn_user_progress SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    UPDATE public.rn_leaderboard_cache SET total_xp = total_xp + v_bonus, updated_at = now() WHERE user_id = p_user_id;
    v_awarded := v_awarded || jsonb_build_object('name', v_name, 'bonus', v_bonus);
  END IF;

  RETURN v_awarded;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.rn_award_achievements(uuid) TO authenticated;
