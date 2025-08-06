-- 🧹 LIMPAR ACHIEVEMENTS INCORRETOS DO USUÁRIO DE TESTE
-- Usuário: 5ebb9b09-46f3-4499-b099-46a804da6fb6

-- 1. VERIFICAR QUAIS ACHIEVEMENTS FORAM CONCEDIDOS INCORRETAMENTE
SELECT 
  achievement_name,
  xp_bonus,
  earned_at,
  category
FROM user_achievements 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
  AND earned_at = '2025-08-06 19:17:31.287+00'
ORDER BY xp_bonus DESC;

-- 2. DELETAR TODOS OS ACHIEVEMENTS INCORRETOS (concedidos simultaneamente)
DELETE FROM user_achievements 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
  AND earned_at = '2025-08-06 19:17:31.287+00';

-- 3. VERIFICAR SE FORAM DELETADOS
SELECT COUNT(*) as remaining_achievements
FROM user_achievements 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6';

-- 4. ATUALIZAR XP DO USUÁRIO (remover XP dos achievements incorretos)
UPDATE user_progress 
SET total_xp = total_xp - 763
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6';

-- 5. VERIFICAR XP ATUALIZADO
SELECT 
  total_xp,
  current_level,
  total_practices
FROM user_progress 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'; 