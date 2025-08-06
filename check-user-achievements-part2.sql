-- 🔍 PARTE 2: RESUMO DOS ACHIEVEMENTS POR CATEGORIA
-- Usuário: 5ebb9b09-46f3-4499-b099-46a804da6fb6

SELECT 
  category,
  COUNT(*) as achievements_count,
  SUM(xp_bonus) as total_xp_bonus,
  STRING_AGG(achievement_name, ', ') as achievements
FROM user_achievements 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
GROUP BY category
ORDER BY total_xp_bonus DESC; 