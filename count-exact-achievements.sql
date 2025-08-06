-- 🔍 CONTAR EXATAMENTE TODOS OS ACHIEVEMENTS

-- 1. TOTAL DE ACHIEVEMENTS
SELECT 
  COUNT(*) as total_achievements
FROM achievements;

-- 2. DISTRIBUIÇÃO POR CATEGORIA
SELECT 
  category,
  COUNT(*) as achievements_count
FROM achievements 
GROUP BY category
ORDER BY achievements_count DESC;

-- 3. EXEMPLO: ACHIEVEMENTS QUE USAM practice_count
SELECT 
  name,
  description,
  requirement_value
FROM achievements 
WHERE requirement_type = 'practice_count'
ORDER BY requirement_value;

-- 4. EXEMPLO: ACHIEVEMENTS QUE USAM daily_streak
SELECT 
  name,
  description,
  requirement_value
FROM achievements 
WHERE requirement_type = 'daily_streak'
ORDER BY requirement_value;

-- 5. EXEMPLO: ACHIEVEMENTS QUE USAM audio_count
SELECT 
  name,
  description,
  requirement_value
FROM achievements 
WHERE requirement_type = 'audio_count'
ORDER BY requirement_value; 