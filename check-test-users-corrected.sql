-- 🔍 VERIFICAR STATUS ATUAL DOS USUÁRIOS DE TESTE (CORRIGIDO)
-- Usando entra_id corretos

-- 1. VERIFICAR ACHIEVEMENTS ATUAIS
SELECT 
  'Achievements atuais' as info,
  user_id,
  COUNT(*) as achievements_count,
  STRING_AGG(achievement_name, ', ') as achievements
FROM user_achievements 
WHERE user_id IN (
  'a211b07f-b7b9-4314-a986-184e47fe964f',  -- Felipe Moura
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
)
GROUP BY user_id

UNION ALL

-- 2. VERIFICAR XP E PROGRESSO ATUAL
SELECT 
  'Progresso atual' as info,
  user_id,
  total_xp as achievements_count,
  CONCAT('Level ', current_level, ' - Streak: ', streak_days, ' dias') as achievements
FROM user_progress 
WHERE user_id IN (
  'a211b07f-b7b9-4314-a986-184e47fe964f',  -- Felipe Moura
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
)

UNION ALL

-- 3. VERIFICAR PRÁTICAS ATUAIS
SELECT 
  'Práticas atuais' as info,
  user_id,
  COUNT(*) as achievements_count,
  CONCAT(COUNT(*), ' práticas') as achievements
FROM user_practices 
WHERE user_id IN (
  'a211b07f-b7b9-4314-a986-184e47fe964f',  -- Felipe Moura
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
)
GROUP BY user_id

UNION ALL

-- 4. VERIFICAR SESSÕES ATUAIS
SELECT 
  'Sessões atuais' as info,
  user_id,
  COUNT(*) as achievements_count,
  CONCAT(COUNT(*), ' sessões') as achievements
FROM user_sessions 
WHERE user_id IN (
  'a211b07f-b7b9-4314-a986-184e47fe964f',  -- Felipe Moura
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
)
GROUP BY user_id

UNION ALL

-- 5. VERIFICAR VOCABULÁRIO ATUAL
SELECT 
  'Vocabulário atual' as info,
  user_id,
  COUNT(*) as achievements_count,
  CONCAT(COUNT(*), ' palavras') as achievements
FROM user_vocabulary 
WHERE user_id IN (
  'a211b07f-b7b9-4314-a986-184e47fe964f',  -- Felipe Moura
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
)
GROUP BY user_id; 