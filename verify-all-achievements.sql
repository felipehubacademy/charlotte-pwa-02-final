-- 🔍 VERIFICAÇÃO COMPLETA DE TODOS OS ACHIEVEMENTS
-- Usuário: 5ebb9b09-46f3-4499-b099-46a804da6fb6

-- 1. TODOS OS ACHIEVEMENTS DISPONÍVEIS
SELECT 
  name,
  description,
  requirement_type,
  requirement_value,
  category,
  xp_reward
FROM achievements 
ORDER BY category, name;

-- 2. ACHIEVEMENTS CONCEDIDOS AO USUÁRIO
SELECT 
  achievement_name,
  earned_at,
  xp_bonus
FROM user_achievements 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
ORDER BY earned_at DESC;

-- 3. PRÁTICAS DO USUÁRIO (últimas 20)
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
LIMIT 20; 