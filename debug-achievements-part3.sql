-- 🐛 DEBUG PARTE 3: ESTATÍSTICAS PARA DEBUG
-- Usuário: 5ebb9b09-46f3-4499-b099-46a804da6fb6

SELECT 
  'Total practices' as metric,
  COUNT(*) as value
FROM user_practices 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'

UNION ALL

SELECT 
  'Perfect practices' as metric,
  COUNT(*) as value
FROM user_practices 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
  AND (accuracy_score >= 95 OR grammar_score >= 95 OR pronunciation_score >= 95)

UNION ALL

SELECT 
  'Active days' as metric,
  COUNT(DISTINCT DATE(created_at)) as value
FROM user_practices 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'

UNION ALL

SELECT 
  'Current level' as metric,
  current_level as value
FROM user_progress 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'; 