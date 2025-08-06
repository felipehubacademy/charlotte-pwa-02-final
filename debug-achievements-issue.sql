-- 🐛 DEBUG: INVESTIGAR PROBLEMA DE ACHIEVEMENTS EM EXCESSO
-- Usuário: 5ebb9b09-46f3-4499-b099-46a804da6fb6

-- 1. VERIFICAR SE HÁ DUPLICATAS
SELECT 
  achievement_name,
  COUNT(*) as count,
  STRING_AGG(earned_at::text, ', ') as earned_times
FROM user_achievements 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
GROUP BY achievement_name
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. VERIFICAR ACHIEVEMENTS CONCEDIDOS NA ÚLTIMA PRÁTICA
SELECT 
  achievement_name,
  xp_bonus,
  earned_at,
  achievement_type,
  category
FROM user_achievements 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
  AND earned_at >= (SELECT MAX(created_at) FROM user_practices WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6')
ORDER BY earned_at DESC;

-- 3. VERIFICAR ÚLTIMA PRÁTICA DO USUÁRIO
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

-- 4. VERIFICAR SE HÁ ACHIEVEMENTS CONCEDIDOS ANTES DO RESET
SELECT 
  achievement_name,
  earned_at,
  CASE 
    WHEN earned_at < '2024-01-01' THEN 'ANTES DO RESET'
    ELSE 'DEPOIS DO RESET'
  END as reset_status
FROM user_achievements 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
ORDER BY earned_at DESC;

-- 5. VERIFICAR SE O SISTEMA ESTÁ CONCEDENDO ACHIEVEMENTS BASEADOS EM DADOS ANTIGOS
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