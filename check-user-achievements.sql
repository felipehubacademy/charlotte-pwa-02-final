-- 🔍 VERIFICAR TODOS OS ACHIEVEMENTS CONCEDIDOS AO USUÁRIO DE TESTE
-- Usuário: 5ebb9b09-46f3-4499-b099-46a804da6fb6

-- 1. VERIFICAR TODOS OS ACHIEVEMENTS CONCEDIDOS
SELECT 
  id,
  user_id,
  achievement_name,
  achievement_description,
  xp_bonus,
  rarity,
  badge_icon,
  earned_at,
  achievement_type,
  category
FROM user_achievements 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
ORDER BY earned_at DESC;

-- 2. RESUMO DOS ACHIEVEMENTS POR CATEGORIA
SELECT 
  category,
  COUNT(*) as achievements_count,
  SUM(xp_bonus) as total_xp_bonus,
  STRING_AGG(achievement_name, ', ') as achievements
FROM user_achievements 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
GROUP BY category
ORDER BY total_xp_bonus DESC;

-- 3. RESUMO POR RARIDADE
SELECT 
  rarity,
  COUNT(*) as achievements_count,
  SUM(xp_bonus) as total_xp_bonus,
  STRING_AGG(achievement_name, ', ') as achievements
FROM user_achievements 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
GROUP BY rarity
ORDER BY total_xp_bonus DESC;

-- 4. TOTAL DE XP DOS ACHIEVEMENTS
SELECT 
  COUNT(*) as total_achievements,
  SUM(xp_bonus) as total_xp_from_achievements,
  AVG(xp_bonus) as avg_xp_per_achievement
FROM user_achievements 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6';

-- 5. ACHIEVEMENTS CONCEDIDOS HOJE
SELECT 
  achievement_name,
  xp_bonus,
  rarity,
  earned_at
FROM user_achievements 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
  AND DATE(earned_at) = CURRENT_DATE
ORDER BY earned_at DESC;

-- 6. VERIFICAR PROGRESSO ATUAL DO USUÁRIO
SELECT 
  total_xp,
  current_level,
  streak_days,
  total_practices
FROM user_progress 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'; 