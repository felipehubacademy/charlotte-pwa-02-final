-- 🧪 RESET TEST USERS - ZERAR ACHIEVEMENTS E XP
-- Usuários de teste para testar o sistema de achievements do zero

-- 1. DELETAR TODOS OS ACHIEVEMENTS DOS USUÁRIOS DE TESTE
DELETE FROM user_achievements 
WHERE user_id IN (
  SELECT entra_id FROM users WHERE id IN (
    '163485d2-777a-47a3-848b-5af79a115dcf',
    '45842a23-6a3a-44fc-af02-156edc57451b',
    'c34c4eb7-0cc5-4d42-bfcb-a3058fe9da84'
  )
);

-- 2. ZERAR XP TOTAL DOS USUÁRIOS DE TESTE
UPDATE user_progress 
SET total_xp = 0, current_level = 1, streak_days = 0
WHERE user_id IN (
  '163485d2-777a-47a3-848b-5af79a115dcf',
  '45842a23-6a3a-44fc-af02-156edc57451b',
  'c34c4eb7-0cc5-4d42-bfcb-a3058fe9da84'
);

-- 3. DELETAR TODAS AS PRÁTICAS DOS USUÁRIOS DE TESTE
DELETE FROM user_practices 
WHERE user_id IN (
  '163485d2-777a-47a3-848b-5af79a115dcf',
  '45842a23-6a3a-44fc-af02-156edc57451b',
  'c34c4eb7-0cc5-4d42-bfcb-a3058fe9da84'
);

-- 4. DELETAR SESSÕES DOS USUÁRIOS DE TESTE
DELETE FROM user_sessions 
WHERE user_id IN (
  '163485d2-777a-47a3-848b-5af79a115dcf',
  '45842a23-6a3a-44fc-af02-156edc57451b',
  'c34c4eb7-0cc5-4d42-bfcb-a3058fe9da84'
);

-- 5. DELETAR VOCABULÁRIO DOS USUÁRIOS DE TESTE
DELETE FROM user_vocabulary 
WHERE user_id IN (
  '163485d2-777a-47a3-848b-5af79a115dcf',
  '45842a23-6a3a-44fc-af02-156edc57451b',
  'c34c4eb7-0cc5-4d42-bfcb-a3058fe9da84'
);

-- 6. VERIFICAR RESULTADO
SELECT 
  'user_achievements' as table_name,
  COUNT(*) as remaining_records
FROM user_achievements 
WHERE user_id IN (
  '163485d2-777a-47a3-848b-5af79a115dcf',
  '45842a23-6a3a-44fc-af02-156edc57451b',
  'c34c4eb7-0cc5-4d42-bfcb-a3058fe9da84'
)

UNION ALL

SELECT 
  'user_progress' as table_name,
  COUNT(*) as remaining_records
FROM user_progress 
WHERE user_id IN (
  '163485d2-777a-47a3-848b-5af79a115dcf',
  '45842a23-6a3a-44fc-af02-156edc57451b',
  'c34c4eb7-0cc5-4d42-bfcb-a3058fe9da84'
)

UNION ALL

SELECT 
  'user_practices' as table_name,
  COUNT(*) as remaining_records
FROM user_practices 
WHERE user_id IN (
  '163485d2-777a-47a3-848b-5af79a115dcf',
  '45842a23-6a3a-44fc-af02-156edc57451b',
  'c34c4eb7-0cc5-4d42-bfcb-a3058fe9da84'
)

UNION ALL

SELECT 
  'user_sessions' as table_name,
  COUNT(*) as remaining_records
FROM user_sessions 
WHERE user_id IN (
  '163485d2-777a-47a3-848b-5af79a115dcf',
  '45842a23-6a3a-44fc-af02-156edc57451b',
  'c34c4eb7-0cc5-4d42-bfcb-a3058fe9da84'
)

UNION ALL

SELECT 
  'user_vocabulary' as table_name,
  COUNT(*) as remaining_records
FROM user_vocabulary 
WHERE user_id IN (
  '163485d2-777a-47a3-848b-5af79a115dcf',
  '45842a23-6a3a-44fc-af02-156edc57451b',
  'c34c4eb7-0cc5-4d42-bfcb-a3058fe9da84'
); 