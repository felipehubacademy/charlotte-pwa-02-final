-- 🐛 DEBUG PARTE 1: VERIFICAR SE HÁ DUPLICATAS
-- Usuário: 5ebb9b09-46f3-4499-b099-46a804da6fb6

SELECT 
  achievement_name,
  COUNT(*) as count,
  STRING_AGG(earned_at::text, ', ') as earned_times
FROM user_achievements 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
GROUP BY achievement_name
HAVING COUNT(*) > 1
ORDER BY count DESC; 