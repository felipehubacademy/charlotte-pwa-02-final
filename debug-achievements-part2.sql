-- 🐛 DEBUG PARTE 2: VERIFICAR ÚLTIMAS PRÁTICAS DO USUÁRIO
-- Usuário: 5ebb9b09-46f3-4499-b099-46a804da6fb6

SELECT 
  id,
  practice_type,
  xp_awarded,
  accuracy_score,
  grammar_score,
  pronunciation_score,
  created_at
FROM user_practices 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
ORDER BY created_at DESC
LIMIT 5; 