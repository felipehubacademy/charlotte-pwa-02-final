-- 🔍 INVESTIGAR ACHIEVEMENT "LIVE BEGINNER"
-- Usuário: 5ebb9b09-46f3-4499-b099-46a804da6fb6

-- 1. VERIFICAR CRITÉRIO DO ACHIEVEMENT
SELECT 
  name,
  description,
  requirement_type,
  requirement_value,
  category,
  xp_reward
FROM achievements 
WHERE name = 'Live Beginner';

-- 2. VERIFICAR PRÁTICAS DO USUÁRIO (últimas 10)
SELECT 
  id,
  practice_type,
  created_at,
  xp_awarded,
  accuracy_score,
  grammar_score,
  pronunciation_score
FROM user_practices 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
ORDER BY created_at DESC
LIMIT 10;

-- 3. VERIFICAR SE HÁ OUTROS ACHIEVEMENTS COM CRITÉRIOS SIMILARES
SELECT 
  name,
  requirement_type,
  requirement_value,
  category
FROM achievements 
WHERE requirement_type IN ('practice_count', 'daily_practices', 'weekly_practices')
  AND name LIKE '%Beginner%' OR name LIKE '%Starter%'
ORDER BY name; 