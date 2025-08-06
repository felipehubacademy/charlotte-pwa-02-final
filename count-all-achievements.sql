-- 🔍 CONTAR E VERIFICAR TODOS OS ACHIEVEMENTS

-- 1. CONTAR TOTAL DE ACHIEVEMENTS
SELECT 
  COUNT(*) as total_achievements
FROM achievements;

-- 2. CONTAR POR CATEGORIA
SELECT 
  category,
  COUNT(*) as count
FROM achievements 
GROUP BY category
ORDER BY count DESC;

-- 3. LISTAR TODOS OS REQUIREMENT_TYPES ÚNICOS
SELECT 
  requirement_type,
  COUNT(*) as count
FROM achievements 
GROUP BY requirement_type
ORDER BY requirement_type;

-- 4. VERIFICAR SE HÁ ACHIEVEMENTS SEM IMPLEMENTAÇÃO
-- (requirement_types que não estão no código)
SELECT DISTINCT
  requirement_type
FROM achievements 
WHERE requirement_type NOT IN (
  'practice_count',
  'user_level_numeric', 
  'daily_streak',
  'perfect_practices',
  'vocabulary_count',
  'daily_practices',
  'weekly_practices',
  'audio_count',
  'text_count',
  'live_sessions',
  'live_duration',
  'accuracy_score',
  'grammar_score',
  'pronunciation_score',
  'audio_duration',
  'message_length',
  'audio_length',
  'word_count',
  'polite_expressions',
  'questions_asked',
  'cultural_mention',
  'emotion_expression',
  'active_days',
  'levels_practiced',
  'photo_practices',
  'morning_practice',
  'lunch_practice',
  'night_practice',
  'monday_practice',
  'friday_practice',
  'weekend_practice',
  'topics_explored'
)
ORDER BY requirement_type; 