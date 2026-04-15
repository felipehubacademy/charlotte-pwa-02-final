-- ─────────────────────────────────────────────────────────────────────────────
-- 047_fix_achievements_unified.sql
--
-- Unified achievement system:
-- 1. Populate charlotte.achievements with all achievements per user_level
--    (Novice/Inter = PT-BR, Advanced = English)
-- 2. rn_award_achievements reads from charlotte.achievements (data-driven)
--    and fixes the broken table reference (rn_user_practices → charlotte.practices)
--    and grammar type mismatch ('grammar' → also 'grammar_message')
-- 3. Trigger calls rn_award_achievements automatically (single mechanism)
-- 4. Backfill: award missing achievements for existing users
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Populate charlotte.achievements catalog ────────────────────────────────
-- requirement_type values:
--   total_practices, text_messages, audio_messages, grammar_exercises,
--   learn_exercises, streak_days, today_xp, early_bird, night_owl, xp_milestone

-- Drop old single-code unique constraint; add composite (code, user_level) unique constraint
DO $$ BEGIN
  ALTER TABLE charlotte.achievements DROP CONSTRAINT IF EXISTS achievements_code_key;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE charlotte.achievements ADD CONSTRAINT achievements_code_level_unique UNIQUE (code, user_level);
EXCEPTION WHEN duplicate_table THEN NULL;
         WHEN duplicate_object THEN NULL;
END $$;

-- Upsert to preserve existing IDs (referenced by user_achievements FK)
INSERT INTO charlotte.achievements
  (code, name, description, xp_reward, requirement_type, requirement_value, user_level, category, badge_color, badge_icon, rarity, is_active, sort_order)
VALUES
-- ── Novice / Inter (PT-BR) ─────────────────────────────────────────────────
-- First times
('first_practice',  'Olá, Mundo!',           'Você completou sua primeira prática!',                   20,  'total_practices',  1,   'Novice', 'general', '#A3FF3C', 'first_practice',  'common',    true, 10),
('first_practice',  'Olá, Mundo!',           'Você completou sua primeira prática!',                   20,  'total_practices',  1,   'Inter',  'general', '#A3FF3C', 'first_practice',  'common',    true, 10),
('first_text',      'Primeira Conversa',     'Você enviou sua primeira mensagem de texto!',             20,  'text_messages',    1,   'Novice', 'text',    '#60A5FA', 'first_text',      'common',    true, 11),
('first_text',      'Primeira Conversa',     'Você enviou sua primeira mensagem de texto!',             20,  'text_messages',    1,   'Inter',  'text',    '#60A5FA', 'first_text',      'common',    true, 11),
('first_audio',     'Primeira Voz',          'Você gravou sua primeira mensagem de voz!',               25,  'audio_messages',   1,   'Novice', 'audio',   '#F472B6', 'first_audio',     'common',    true, 12),
('first_audio',     'Primeira Voz',          'Você gravou sua primeira mensagem de voz!',               25,  'audio_messages',   1,   'Inter',  'audio',   '#F472B6', 'first_audio',     'common',    true, 12),
('first_grammar',   'Gramático Iniciante',   'Você fez sua primeira prática de gramática!',             25,  'grammar_exercises',1,   'Novice', 'grammar', '#A3FF3C', 'first_grammar',   'common',    true, 13),
('first_grammar',   'Gramático Iniciante',   'Você fez sua primeira prática de gramática!',             25,  'grammar_exercises',1,   'Inter',  'grammar', '#A3FF3C', 'first_grammar',   'common',    true, 13),
('first_learn',     'Na Trilha',             'Você começou a Trilha de Aprendizado!',                   20,  'learn_exercises',  1,   'Novice', 'learn',   '#A3FF3C', 'first_learn',     'common',    true, 14),
('first_learn',     'Na Trilha',             'Você começou a Trilha de Aprendizado!',                   20,  'learn_exercises',  1,   'Inter',  'learn',   '#A3FF3C', 'first_learn',     'common',    true, 14),
-- Volume
('practices_10',    'Aquecendo',             'Você completou 10 práticas — está pegando o jeito!',      35,  'total_practices',  10,  'Novice', 'general', '#FF6B35', 'practices_10',    'common',    true, 20),
('practices_10',    'Aquecendo',             'Você completou 10 práticas — está pegando o jeito!',      35,  'total_practices',  10,  'Inter',  'general', '#FF6B35', 'practices_10',    'common',    true, 20),
('practices_50',    'No Ritmo',              '50 práticas! Você está criando um hábito de verdade.',    80,  'total_practices',  50,  'Novice', 'general', '#3B82F6', 'practices_50',    'rare',      true, 21),
('practices_50',    'No Ritmo',              '50 práticas! Você está criando um hábito de verdade.',    80,  'total_practices',  50,  'Inter',  'general', '#3B82F6', 'practices_50',    'rare',      true, 21),
('practices_100',   'Comprometido',          '100 práticas — você é verdadeiramente comprometido!',     160, 'total_practices',  100, 'Novice', 'general', '#A855F7', 'practices_100',   'epic',      true, 22),
('practices_100',   'Comprometido',          '100 práticas — você é verdadeiramente comprometido!',     160, 'total_practices',  100, 'Inter',  'general', '#A855F7', 'practices_100',   'epic',      true, 22),
('practices_500',   'Lenda da Prática',      '500 práticas. Você é uma lenda!',                         500, 'total_practices',  500, 'Novice', 'general', '#EAB308', 'practices_500',   'legendary', true, 23),
('practices_500',   'Lenda da Prática',      '500 práticas. Você é uma lenda!',                         500, 'total_practices',  500, 'Inter',  'general', '#EAB308', 'practices_500',   'legendary', true, 23),
-- Streak
('streak_3',        'Consistente',           '3 dias seguidos — a consistência é o segredo!',           30,  'streak_days',      3,   'Novice', 'streak',  '#FF6B35', 'streak_3',        'common',    true, 30),
('streak_3',        'Consistente',           '3 dias seguidos — a consistência é o segredo!',           30,  'streak_days',      3,   'Inter',  'streak',  '#FF6B35', 'streak_3',        'common',    true, 30),
('streak_7',        'Semana Completa',       'Uma semana inteira sem falhar — incrível!',               75,  'streak_days',      7,   'Novice', 'streak',  '#3B82F6', 'streak_7',        'rare',      true, 31),
('streak_7',        'Semana Completa',       'Uma semana inteira sem falhar — incrível!',               75,  'streak_days',      7,   'Inter',  'streak',  '#3B82F6', 'streak_7',        'rare',      true, 31),
('streak_14',       'Duas Semanas',          '14 dias consecutivos — você é imparável!',                150, 'streak_days',      14,  'Novice', 'streak',  '#A855F7', 'streak_14',       'epic',      true, 32),
('streak_14',       'Duas Semanas',          '14 dias consecutivos — você é imparável!',                150, 'streak_days',      14,  'Inter',  'streak',  '#A855F7', 'streak_14',       'epic',      true, 32),
('streak_30',       'Mês de Ouro',           '30 dias seguidos — dedicação extraordinária!',            400, 'streak_days',      30,  'Novice', 'streak',  '#EAB308', 'streak_30',       'legendary', true, 33),
('streak_30',       'Mês de Ouro',           '30 dias seguidos — dedicação extraordinária!',            400, 'streak_days',      30,  'Inter',  'streak',  '#EAB308', 'streak_30',       'legendary', true, 33),
-- Text
('text_25',         'Comunicativo',          '25 conversas por texto — você adora conversar!',          70,  'text_messages',    25,  'Novice', 'text',    '#3B82F6', 'text_25',         'rare',      true, 40),
('text_25',         'Comunicativo',          '25 conversas por texto — você adora conversar!',          70,  'text_messages',    25,  'Inter',  'text',    '#3B82F6', 'text_25',         'rare',      true, 40),
('text_100',        'Fluente no Chat',       '100 conversas por texto — você domina a escrita!',        150, 'text_messages',    100, 'Novice', 'text',    '#A855F7', 'text_100',        'epic',      true, 41),
('text_100',        'Fluente no Chat',       '100 conversas por texto — você domina a escrita!',        150, 'text_messages',    100, 'Inter',  'text',    '#A855F7', 'text_100',        'epic',      true, 41),
-- Audio
('audio_10',        'Falante',               '10 mensagens de voz — você não tem medo de falar!',       65,  'audio_messages',   10,  'Novice', 'audio',   '#F472B6', 'audio_10',        'rare',      true, 50),
('audio_10',        'Falante',               '10 mensagens de voz — você não tem medo de falar!',       65,  'audio_messages',   10,  'Inter',  'audio',   '#F472B6', 'audio_10',        'rare',      true, 50),
('audio_50',        'Voz de Ouro',           '50 mensagens de voz — sua pronúncia está evoluindo!',     150, 'audio_messages',   50,  'Novice', 'audio',   '#A855F7', 'audio_50',        'epic',      true, 51),
('audio_50',        'Voz de Ouro',           '50 mensagens de voz — sua pronúncia está evoluindo!',     150, 'audio_messages',   50,  'Inter',  'audio',   '#A855F7', 'audio_50',        'epic',      true, 51),
('audio_200',       'Locutor Profissional',  '200 mensagens de voz — você fala inglês com naturalidade!', 350, 'audio_messages', 200, 'Novice', 'audio',   '#EAB308', 'audio_200',       'legendary', true, 52),
('audio_200',       'Locutor Profissional',  '200 mensagens de voz — você fala inglês com naturalidade!', 350, 'audio_messages', 200, 'Inter',  'audio',   '#EAB308', 'audio_200',       'legendary', true, 52),
-- Grammar
('grammar_20',      'Gramático Avançado',    '20 práticas de gramática — sua precisão está melhorando!', 70, 'grammar_exercises',20,  'Novice', 'grammar', '#3B82F6', 'grammar_20',      'rare',      true, 60),
('grammar_20',      'Gramático Avançado',    '20 práticas de gramática — sua precisão está melhorando!', 70, 'grammar_exercises',20,  'Inter',  'grammar', '#3B82F6', 'grammar_20',      'rare',      true, 60),
('grammar_50',      'Mestre da Gramática',   '50 práticas de gramática — você é um mestre!',             150, 'grammar_exercises',50, 'Novice', 'grammar', '#A855F7', 'grammar_50',      'epic',      true, 61),
('grammar_50',      'Mestre da Gramática',   '50 práticas de gramática — você é um mestre!',             150, 'grammar_exercises',50, 'Inter',  'grammar', '#A855F7', 'grammar_50',      'epic',      true, 61),
-- Learn trail
('learn_25',        'Trilheiro',             '25 exercícios da trilha — você está avançando muito!',    70,  'learn_exercises',  25,  'Novice', 'learn',   '#3B82F6', 'learn_25',        'rare',      true, 70),
('learn_25',        'Trilheiro',             '25 exercícios da trilha — você está avançando muito!',    70,  'learn_exercises',  25,  'Inter',  'learn',   '#3B82F6', 'learn_25',        'rare',      true, 70),
('learn_100',       'Mestre da Trilha',      '100 exercícios da trilha — você dominou a trilha!',       160, 'learn_exercises',  100, 'Novice', 'learn',   '#A855F7', 'learn_100',       'epic',      true, 71),
('learn_100',       'Mestre da Trilha',      '100 exercícios da trilha — você dominou a trilha!',       160, 'learn_exercises',  100, 'Inter',  'learn',   '#A855F7', 'learn_100',       'epic',      true, 71),
-- Daily
('daily_100',       'Super Dia',             '100 XP em um dia — que sessão incrível!',                 60,  'today_xp',         100, 'Novice', 'daily',   '#F59E0B', 'daily_100',       'rare',      true, 80),
('daily_100',       'Super Dia',             '100 XP em um dia — que sessão incrível!',                 60,  'today_xp',         100, 'Inter',  'daily',   '#F59E0B', 'daily_100',       'rare',      true, 80),
('daily_200',       'Dia Lendário',          '200 XP em um dia — absolutamente lendário!',              120, 'today_xp',         200, 'Novice', 'daily',   '#A855F7', 'daily_200',       'epic',      true, 81),
('daily_200',       'Dia Lendário',          '200 XP em um dia — absolutamente lendário!',              120, 'today_xp',         200, 'Inter',  'daily',   '#A855F7', 'daily_200',       'epic',      true, 81),
('early_bird',      'Madrugador',            'Praticando antes das 8h — quem cedo madruga...',           50,  'early_bird',       0,   'Novice', 'daily',   '#F59E0B', 'early_bird',      'rare',      true, 82),
('early_bird',      'Madrugador',            'Praticando antes das 8h — quem cedo madruga...',           50,  'early_bird',       0,   'Inter',  'daily',   '#F59E0B', 'early_bird',      'rare',      true, 82),
('night_owl',       'Coruja Noturna',        'Praticando depois das 22h — a noite é sua!',               50,  'night_owl',        0,   'Novice', 'daily',   '#6366F1', 'night_owl',       'rare',      true, 83),
('night_owl',       'Coruja Noturna',        'Praticando depois das 22h — a noite é sua!',               50,  'night_owl',        0,   'Inter',  'daily',   '#6366F1', 'night_owl',       'rare',      true, 83),

-- ── Advanced (English) ────────────────────────────────────────────────────
-- First times
('first_practice',  'Hello, World!',         'You completed your first practice!',                      20,  'total_practices',  1,   'Advanced', 'general', '#A3FF3C', 'first_practice',  'common',    true, 10),
('first_text',      'First Conversation',    'You sent your first text message!',                       20,  'text_messages',    1,   'Advanced', 'text',    '#60A5FA', 'first_text',      'common',    true, 11),
('first_audio',     'First Voice',           'You recorded your first voice message!',                  25,  'audio_messages',   1,   'Advanced', 'audio',   '#F472B6', 'first_audio',     'common',    true, 12),
('first_grammar',   'Grammar Beginner',      'You completed your first grammar practice!',              25,  'grammar_exercises',1,   'Advanced', 'grammar', '#A3FF3C', 'first_grammar',   'common',    true, 13),
('first_learn',     'On the Trail',          'You started the Learning Trail!',                         20,  'learn_exercises',  1,   'Advanced', 'learn',   '#A3FF3C', 'first_learn',     'common',    true, 14),
-- Volume
('practices_10',    'Warming Up',            '10 practices — you are getting the hang of it!',          35,  'total_practices',  10,  'Advanced', 'general', '#FF6B35', 'practices_10',    'common',    true, 20),
('practices_50',    'In the Zone',           '50 practices! You are building a real habit.',             80,  'total_practices',  50,  'Advanced', 'general', '#3B82F6', 'practices_50',    'rare',      true, 21),
('practices_100',   'Committed',             '100 practices — you are truly committed!',                 160, 'total_practices',  100, 'Advanced', 'general', '#A855F7', 'practices_100',   'epic',      true, 22),
('practices_500',   'Practice Legend',       '500 practices. You are a legend!',                        500, 'total_practices',  500, 'Advanced', 'general', '#EAB308', 'practices_500',   'legendary', true, 23),
-- Streak
('streak_3',        'Consistent',            '3 days in a row — consistency is the secret!',            30,  'streak_days',      3,   'Advanced', 'streak',  '#FF6B35', 'streak_3',        'common',    true, 30),
('streak_7',        'Full Week',             'A whole week without missing — amazing!',                 75,  'streak_days',      7,   'Advanced', 'streak',  '#3B82F6', 'streak_7',        'rare',      true, 31),
('streak_14',       'Two Weeks',             '14 consecutive days — you are unstoppable!',              150, 'streak_days',      14,  'Advanced', 'streak',  '#A855F7', 'streak_14',       'epic',      true, 32),
('streak_30',       'Golden Month',          '30 days in a row — extraordinary dedication!',            400, 'streak_days',      30,  'Advanced', 'streak',  '#EAB308', 'streak_30',       'legendary', true, 33),
-- Text
('text_25',         'Communicative',         '25 text conversations — you love to chat!',               70,  'text_messages',    25,  'Advanced', 'text',    '#3B82F6', 'text_25',         'rare',      true, 40),
('text_100',        'Chat Fluent',           '100 text conversations — you master written English!',    150, 'text_messages',    100, 'Advanced', 'text',    '#A855F7', 'text_100',        'epic',      true, 41),
-- Audio
('audio_10',        'Speaker',               '10 voice messages — you are not afraid to speak!',        65,  'audio_messages',   10,  'Advanced', 'audio',   '#F472B6', 'audio_10',        'rare',      true, 50),
('audio_50',        'Golden Voice',          '50 voice messages — your pronunciation is evolving!',     150, 'audio_messages',   50,  'Advanced', 'audio',   '#A855F7', 'audio_50',        'epic',      true, 51),
('audio_200',       'Pro Speaker',           '200 voice messages — you speak English naturally!',       350, 'audio_messages',   200, 'Advanced', 'audio',   '#EAB308', 'audio_200',       'legendary', true, 52),
-- Grammar
('grammar_20',      'Advanced Grammarian',   '20 grammar exercises — your accuracy is improving!',      70,  'grammar_exercises',20,  'Advanced', 'grammar', '#3B82F6', 'grammar_20',      'rare',      true, 60),
('grammar_50',      'Grammar Master',        '50 grammar exercises — you are a grammar master!',        150, 'grammar_exercises',50,  'Advanced', 'grammar', '#A855F7', 'grammar_50',      'epic',      true, 61),
-- Learn trail
('learn_25',        'Trail Blazer',          '25 trail exercises — you are blazing through the content!', 70, 'learn_exercises', 25,  'Advanced', 'learn',   '#3B82F6', 'learn_25',        'rare',      true, 70),
('learn_100',       'Trail Master',          '100 trail exercises — you have mastered the learning trail!', 160, 'learn_exercises', 100, 'Advanced', 'learn', '#A855F7', 'learn_100',       'epic',      true, 71),
-- Daily
('daily_100',       'Super Day',             '100 XP in one day — what a session!',                     60,  'today_xp',         100, 'Advanced', 'daily',   '#F59E0B', 'daily_100',       'rare',      true, 80),
('daily_200',       'Legendary Day',         '200 XP in one day — absolutely legendary!',               120, 'today_xp',         200, 'Advanced', 'daily',   '#A855F7', 'daily_200',       'epic',      true, 81),
('early_bird',      'Early Bird',            'Practicing before 8am — the early bird gets the worm!',   50,  'early_bird',       0,   'Advanced', 'daily',   '#F59E0B', 'early_bird',      'rare',      true, 82),
('night_owl',       'Night Owl',             'Practicing after 10pm — the night is yours!',              50,  'night_owl',        0,   'Advanced', 'daily',   '#6366F1', 'night_owl',       'rare',      true, 83)
ON CONFLICT (code, user_level) DO UPDATE SET
  name             = EXCLUDED.name,
  description      = EXCLUDED.description,
  xp_reward        = EXCLUDED.xp_reward,
  requirement_type = EXCLUDED.requirement_type,
  requirement_value= EXCLUDED.requirement_value,
  category         = EXCLUDED.category,
  badge_color      = EXCLUDED.badge_color,
  badge_icon       = EXCLUDED.badge_icon,
  rarity           = EXCLUDED.rarity,
  is_active        = EXCLUDED.is_active,
  sort_order       = EXCLUDED.sort_order;


-- ── 2. Data-driven rn_award_achievements ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.rn_award_achievements(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_level      text    := 'Novice';
  v_total_xp        int     := 0;
  v_streak          int     := 0;
  v_total_practices int     := 0;
  v_text_count      int     := 0;
  v_audio_count     int     := 0;
  v_grammar_count   int     := 0;
  v_learn_count     int     := 0;
  v_today_xp        int     := 0;
  v_current_hour    int     := EXTRACT(HOUR FROM now() AT TIME ZONE 'America/Sao_Paulo');
  v_awarded         jsonb   := '[]'::jsonb;
  v_qualifies       boolean := false;
  ach               RECORD;
BEGIN
  SELECT COALESCE(user_level, 'Novice') INTO v_user_level
    FROM public.users WHERE id = p_user_id;

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

  -- FIX: accept both 'grammar' and 'grammar_message'
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

  -- Loop through achievements for this user's level
  FOR ach IN
    SELECT a.*
    FROM charlotte.achievements a
    WHERE a.user_level = v_user_level
      AND a.is_active = true
    ORDER BY a.sort_order, a.code
  LOOP
    -- Skip if already earned (check by code + user_level via achievement_id)
    CONTINUE WHEN EXISTS (
      SELECT 1 FROM charlotte.user_achievements
      WHERE user_id = p_user_id::text
        AND achievement_id = ach.id
    );

    -- Evaluate condition
    v_qualifies := CASE ach.requirement_type
      WHEN 'total_practices'  THEN v_total_practices  >= ach.requirement_value
      WHEN 'text_messages'    THEN v_text_count        >= ach.requirement_value
      WHEN 'audio_messages'   THEN v_audio_count       >= ach.requirement_value
      WHEN 'grammar_exercises'THEN v_grammar_count     >= ach.requirement_value
      WHEN 'learn_exercises'  THEN v_learn_count       >= ach.requirement_value
      WHEN 'streak_days'      THEN v_streak            >= ach.requirement_value
      WHEN 'today_xp'         THEN v_today_xp          >= ach.requirement_value
      WHEN 'early_bird'       THEN v_current_hour < 8 AND v_today_xp > 0
      WHEN 'night_owl'        THEN v_current_hour >= 22 AND v_today_xp > 0
      ELSE false
    END;

    -- Special: daily achievements can repeat each day
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

      -- Credit XP bonus
      UPDATE charlotte.progress
        SET total_xp = total_xp + ach.xp_reward, updated_at = now()
        WHERE user_id = p_user_id;
      UPDATE charlotte.leaderboard_cache
        SET total_xp = total_xp + ach.xp_reward, updated_at = now()
        WHERE user_id = p_user_id;

      v_awarded := v_awarded || jsonb_build_object('name', ach.name, 'bonus', ach.xp_reward, 'code', ach.code);
    END IF;
  END LOOP;

  RETURN v_awarded;
END;
$$;


-- ── 3. Unified trigger: XP milestones + calls rn_award_achievements ───────────

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

  -- Get user level and display name
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

    -- Unified: call rn_award_achievements from trigger
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


-- ── 4. Backfill: award missing achievements for all existing users ─────────────
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
      NULL; -- skip invalid UUIDs or other issues
    END;
  END LOOP;
END;
$$;
