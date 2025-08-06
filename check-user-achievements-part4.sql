-- 🔍 PARTE 4: PROGRESSO ATUAL DO USUÁRIO
-- Usuário: 5ebb9b09-46f3-4499-b099-46a804da6fb6

SELECT 
  total_xp,
  current_level,
  streak_days,
  total_practices
FROM user_progress 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'; 