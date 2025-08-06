-- 🔍 VERIFICAR CRITÉRIO DO ACHIEVEMENT "LIVE BEGINNER"
-- Usuário: 5ebb9b09-46f3-4499-b099-46a804da6fb6

-- 1. VERIFICAR ACHIEVEMENT "LIVE BEGINNER" NA TABELA
SELECT 
  name,
  description,
  requirement_type,
  requirement_value,
  category
FROM achievements 
WHERE name LIKE '%Live%' OR name LIKE '%live%'
ORDER BY name;

-- 2. VERIFICAR PRÁTICAS DO USUÁRIO
SELECT 
  practice_type,
  COUNT(*) as count,
  STRING_AGG(created_at::text, ', ') as practice_times
FROM user_practices 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
GROUP BY practice_type
ORDER BY count DESC;

-- 3. VERIFICAR ACHIEVEMENTS CONCEDIDOS HOJE
SELECT 
  achievement_name,
  earned_at,
  xp_bonus
FROM user_achievements 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
  AND DATE(earned_at) = CURRENT_DATE
ORDER BY earned_at DESC; 