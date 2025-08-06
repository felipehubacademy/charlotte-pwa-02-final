-- 🧹 LIMPAR ACHIEVEMENT DUPLICADO
-- Usuário: 5ebb9b09-46f3-4499-b099-46a804da6fb6

-- 1. VERIFICAR ACHIEVEMENTS DUPLICADOS
SELECT 
  achievement_name,
  COUNT(*) as count,
  STRING_AGG(earned_at::text, ', ') as earned_times
FROM user_achievements 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
  AND achievement_name = 'Primeiro Passo'
GROUP BY achievement_name
HAVING COUNT(*) > 1;

-- 2. VERIFICAR TODOS OS ACHIEVEMENTS DO USUÁRIO
SELECT 
  id,
  achievement_name,
  earned_at,
  xp_bonus
FROM user_achievements 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
ORDER BY earned_at DESC;

-- 3. DELETAR ACHIEVEMENTS DUPLICADOS (manter apenas o mais antigo)
DELETE FROM user_achievements 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
  AND achievement_name = 'Primeiro Passo'
  AND id NOT IN (
    SELECT id 
    FROM user_achievements 
    WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
      AND achievement_name = 'Primeiro Passo'
    ORDER BY earned_at ASC
    LIMIT 1
  );

-- 4. VERIFICAR SE FOI LIMPO
SELECT 
  achievement_name,
  COUNT(*) as count
FROM user_achievements 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
  AND achievement_name = 'Primeiro Passo'
GROUP BY achievement_name; 