-- 🧹 RESET COMPLETO DO USUÁRIO DE TESTE
-- Usuário: 5ebb9b09-46f3-4499-b099-46a804da6fb6

-- 1. DELETAR TODOS OS ACHIEVEMENTS
DELETE FROM user_achievements 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6';

-- 2. DELETAR TODAS AS PRÁTICAS
DELETE FROM user_practices 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6';

-- 3. DELETAR TODAS AS SESSÕES
DELETE FROM user_sessions 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6';

-- 4. DELETAR TODO O VOCABULÁRIO
DELETE FROM user_vocabulary 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6';

-- 5. ZERAR PROGRESSO DO USUÁRIO
UPDATE user_progress 
SET 
  total_xp = 0,
  current_level = 1,
  streak_days = 0,
  total_practices = 0, -- ✅ ZERADO: total_practices da tabela user_progress
  longest_streak = 0,
  average_pronunciation_score = null,
  average_grammar_score = null,
  total_text_practices = 0
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6';

-- 6. VERIFICAR SE TUDO FOI ZERADO
SELECT 
  'Achievements' as table_name,
  COUNT(*) as count
FROM user_achievements 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'

UNION ALL

SELECT 
  'Practices' as table_name,
  COUNT(*) as count
FROM user_practices 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'

UNION ALL

SELECT 
  'Sessions' as table_name,
  COUNT(*) as count
FROM user_sessions 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'

UNION ALL

SELECT 
  'Vocabulary' as table_name,
  COUNT(*) as count
FROM user_vocabulary 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'

UNION ALL

SELECT 
  'Progress' as table_name,
  total_xp as count
FROM user_progress 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6';

-- 7. VERIFICAR PROGRESSO FINAL
SELECT 
  total_xp,
  current_level,
  streak_days,
  total_practices
FROM user_progress 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'; 