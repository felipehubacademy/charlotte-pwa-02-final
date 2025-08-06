-- 🔍 ENCONTRAR ACHIEVEMENT "LIVE BEGINNER"
-- Usuário: 5ebb9b09-46f3-4499-b099-46a804da6fb6

-- 1. BUSCAR TODOS OS ACHIEVEMENTS COM "LIVE" NO NOME
SELECT 
  name,
  description,
  requirement_type,
  requirement_value,
  category,
  xp_reward
FROM achievements 
WHERE name ILIKE '%live%'
ORDER BY name;

-- 2. BUSCAR TODOS OS ACHIEVEMENTS COM "BEGINNER" NO NOME
SELECT 
  name,
  description,
  requirement_type,
  requirement_value,
  category,
  xp_reward
FROM achievements 
WHERE name ILIKE '%beginner%'
ORDER BY name;

-- 3. VERIFICAR SE O ACHIEVEMENT FOI DELETADO DA TABELA
-- (mas ainda existe em user_achievements)
SELECT 
  achievement_name,
  COUNT(*) as count
FROM user_achievements 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
  AND achievement_name ILIKE '%live%'
GROUP BY achievement_name;

-- 4. VERIFICAR TODOS OS ACHIEVEMENTS CONCEDIDOS HOJE
SELECT 
  achievement_name,
  earned_at,
  xp_bonus
FROM user_achievements 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
  AND DATE(earned_at) = CURRENT_DATE
ORDER BY earned_at DESC; 