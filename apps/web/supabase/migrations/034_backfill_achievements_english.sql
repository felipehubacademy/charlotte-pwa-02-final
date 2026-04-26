-- ─────────────────────────────────────────────────────────────────────────────
-- 034_backfill_achievements_english.sql
--
-- Backfill: update achievement_name and achievement_description to English
-- for all Inter and Advanced users whose records were stored in Portuguese
-- (i.e. before migration 033 added bilingual support to rn_award_achievements).
-- Novice users are intentionally untouched.
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE charlotte.user_achievements ua
SET
  achievement_name        = en.name,
  achievement_description = en.description
FROM (
  VALUES
    -- first times
    ('first_practice', 'Hello, World!',       'You completed your first practice!'),
    ('first_text',     'First Conversation',  'You sent your first text message!'),
    ('first_audio',    'First Voice',         'You recorded your first voice message!'),
    ('first_grammar',  'Grammar Starter',     'You completed your first grammar practice!'),
    ('first_learn',    'On the Trail',        'You started the Learning Trail!'),
    -- volume
    ('practices_10',   'Warming Up',          '10 practices done — you are getting the hang of it!'),
    ('practices_50',   'In the Zone',         '50 practices! You are building a real habit.'),
    ('practices_100',  'Committed',           '100 practices — you are truly committed!'),
    ('practices_500',  'Practice Legend',     '500 practices. You are a legend!'),
    -- streak
    ('streak_3',       'Consistent',          '3 days in a row — consistency is the key!'),
    ('streak_7',       'Full Week',           'A full week without missing a day — amazing!'),
    ('streak_14',      'Two Weeks',           '14 days in a row — you are unstoppable!'),
    ('streak_30',      'Golden Month',        '30 days in a row — extraordinary dedication!'),
    -- text / chat
    ('text_25',        'Communicative',       '25 text conversations — you love to chat!'),
    ('text_100',       'Chat Fluent',         '100 text conversations — you master writing!'),
    -- audio
    ('audio_10',       'Speaker',             '10 voice messages — you are not afraid to speak!'),
    ('audio_50',       'Golden Voice',        '50 voice messages — your pronunciation is improving a lot!'),
    ('audio_200',      'Pro Speaker',         '200 voice messages — you speak English naturally!'),
    -- grammar
    ('grammar_20',     'Grammar Expert',      '20 grammar practices — your sentences are improving!'),
    ('grammar_50',     'Grammar Master',      '50 grammar practices — you master the rules!'),
    -- trail
    ('learn_25',       'Trail Blazer',        '25 trail exercises — you are improving!'),
    ('learn_100',      'Trail Master',        '100 trail exercises — you completed an incredible journey!'),
    -- daily
    ('daily_100',      'Super Day',           '100 XP in a single day — what energy!'),
    ('daily_200',      'Legendary Day',       '200 XP in a single day — you went all out today!'),
    -- time of day
    ('early_bird',     'Early Bird',          'You practiced English before 8am — what dedication!'),
    ('night_owl',      'Night Owl',           'You practiced after 10pm — night owls are the most determined!')
) AS en(code, name, description)
WHERE ua.achievement_type = en.code
  AND ua.user_id IN (
    SELECT id::text FROM public.users
    WHERE COALESCE(user_level, 'Novice') <> 'Novice'
  );
