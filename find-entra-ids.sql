-- 🔍 ENCONTRAR ENTRA_ID DOS USUÁRIOS DE TESTE

-- Buscar usuários pelos IDs fornecidos
SELECT 
  id,
  entra_id,
  name,
  email,
  user_level
FROM users 
WHERE id IN (
  '163485d2-777a-47a3-848b-5af79a115dcf',
  '45842a23-6a3a-44fc-af02-156edc57451b',
  'c34c4eb7-0cc5-4d42-bfcb-a3058fe9da84'
);

-- Verificar se existem dados com esses entra_id
SELECT 
  'user_achievements' as table_name,
  COUNT(*) as records_count
FROM user_achievements 
WHERE user_id IN (
  SELECT entra_id FROM users WHERE id IN (
    '163485d2-777a-47a3-848b-5af79a115dcf',
    '45842a23-6a3a-44fc-af02-156edc57451b',
    'c34c4eb7-0cc5-4d42-bfcb-a3058fe9da84'
  )
)

UNION ALL

SELECT 
  'user_progress' as table_name,
  COUNT(*) as records_count
FROM user_progress 
WHERE user_id IN (
  SELECT entra_id FROM users WHERE id IN (
    '163485d2-777a-47a3-848b-5af79a115dcf',
    '45842a23-6a3a-44fc-af02-156edc57451b',
    'c34c4eb7-0cc5-4d42-bfcb-a3058fe9da84'
  )
)

UNION ALL

SELECT 
  'user_practices' as table_name,
  COUNT(*) as records_count
FROM user_practices 
WHERE user_id IN (
  SELECT entra_id FROM users WHERE id IN (
    '163485d2-777a-47a3-848b-5af79a115dcf',
    '45842a23-6a3a-44fc-af02-156edc57451b',
    'c34c4eb7-0cc5-4d42-bfcb-a3058fe9da84'
  )
); 