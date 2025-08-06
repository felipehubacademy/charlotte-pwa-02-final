-- 🧪 RESET TEST USERS - ZERAR ACHIEVEMENTS E XP (CORRIGIDO)
-- Usuários de teste para testar o sistema de achievements do zero
-- Usando entra_id corretos

-- 1. DELETAR TODOS OS ACHIEVEMENTS DOS USUÁRIOS DE TESTE
DELETE FROM user_achievements 
WHERE user_id IN (
  'a211b07f-b7b9-4314-a986-184e47fe964f',  -- Felipe Moura
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
);

-- 2. ZERAR XP TOTAL DOS USUÁRIOS DE TESTE
UPDATE user_progress 
SET total_xp = 0, current_level = 1, streak_days = 0
WHERE user_id IN (
  'a211b07f-b7b9-4314-a986-184e47fe964f',  -- Felipe Moura
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
);

-- 3. DELETAR TODAS AS PRÁTICAS DOS USUÁRIOS DE TESTE
DELETE FROM user_practices 
WHERE user_id IN (
  'a211b07f-b7b9-4314-a986-184e47fe964f',  -- Felipe Moura
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
);

-- 4. DELETAR SESSÕES DOS USUÁRIOS DE TESTE
DELETE FROM user_sessions 
WHERE user_id IN (
  'a211b07f-b7b9-4314-a986-184e47fe964f',  -- Felipe Moura
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
);

-- 5. DELETAR VOCABULÁRIO DOS USUÁRIOS DE TESTE
DELETE FROM user_vocabulary 
WHERE user_id IN (
  'a211b07f-b7b9-4314-a986-184e47fe964f',  -- Felipe Moura
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
);

-- 6. VERIFICAR RESULTADO
SELECT 
  'user_achievements' as table_name,
  COUNT(*) as remaining_records
FROM user_achievements 
WHERE user_id IN (
  'a211b07f-b7b9-4314-a986-184e47fe964f',  -- Felipe Moura
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
)

UNION ALL

SELECT 
  'user_progress' as table_name,
  COUNT(*) as remaining_records
FROM user_progress 
WHERE user_id IN (
  'a211b07f-b7b9-4314-a986-184e47fe964f',  -- Felipe Moura
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
)

UNION ALL

SELECT 
  'user_practices' as table_name,
  COUNT(*) as remaining_records
FROM user_practices 
WHERE user_id IN (
  'a211b07f-b7b9-4314-a986-184e47fe964f',  -- Felipe Moura
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
)

UNION ALL

SELECT 
  'user_sessions' as table_name,
  COUNT(*) as remaining_records
FROM user_sessions 
WHERE user_id IN (
  'a211b07f-b7b9-4314-a986-184e47fe964f',  -- Felipe Moura
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
)

UNION ALL

SELECT 
  'user_vocabulary' as table_name,
  COUNT(*) as remaining_records
FROM user_vocabulary 
WHERE user_id IN (
  'a211b07f-b7b9-4314-a986-184e47fe964f',  -- Felipe Moura
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
); 