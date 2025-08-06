-- 🧪 TESTE: VERIFICAR SE NOTIFICAÇÕES ESTÃO FUNCIONANDO
-- Usuário: 5ebb9b09-46f3-4499-b099-46a804da6fb6

-- 1. VERIFICAR SE O USUÁRIO ESTÁ ZERADO
SELECT 
  'User Progress' as table_name,
  total_xp,
  current_level,
  total_practices
FROM user_progress 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'

UNION ALL

SELECT 
  'Achievements' as table_name,
  COUNT(*) as total_xp,
  0 as current_level,
  0 as total_practices
FROM user_achievements 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'

UNION ALL

SELECT 
  'Practices' as table_name,
  COUNT(*) as total_xp,
  0 as current_level,
  0 as total_practices
FROM user_practices 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6';

-- 2. VERIFICAR SE A API DE ACHIEVEMENTS RECENTES FUNCIONA
-- Execute no browser: http://localhost:3000/api/achievements/recent?userId=5ebb9b09-46f3-4499-b099-46a804da6fb6

-- 3. VERIFICAR LOGS DO CONSOLE
-- Abra o DevTools e procure por:
-- 🔍 "Checking for recent achievements..."
-- 🏆 "Found recent achievements: X"
-- 🏆 "Showing achievement notifications: X" 