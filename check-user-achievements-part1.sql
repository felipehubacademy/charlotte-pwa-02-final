-- 🔍 PARTE 1: VERIFICAR TODOS OS ACHIEVEMENTS CONCEDIDOS
-- Usuário: 5ebb9b09-46f3-4499-b099-46a804da6fb6

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