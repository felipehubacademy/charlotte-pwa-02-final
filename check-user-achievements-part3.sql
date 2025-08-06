-- 🔍 PARTE 3: TOTAL DE XP DOS ACHIEVEMENTS
-- Usuário: 5ebb9b09-46f3-4499-b099-46a804da6fb6

SELECT 
  COUNT(*) as total_achievements,
  SUM(xp_bonus) as total_xp_from_achievements,
  AVG(xp_bonus) as avg_xp_per_achievement
FROM user_achievements 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'; 