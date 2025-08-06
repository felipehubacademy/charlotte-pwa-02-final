-- 🔍 VERIFICAR STATUS ATUAL DOS USUÁRIOS DE TESTE (ANTES DO RESET)
-- Usando entra_id em vez de user_id

-- 1. VERIFICAR ACHIEVEMENTS ATUAIS
SELECT 
  'Achievements atuais' as info,
  user_id,
  COUNT(*) as achievements_count,
  STRING_AGG(achievement_name, ', ') as achievements
FROM user_achievements 
WHERE user_id IN (
  SELECT entra_id FROM users WHERE id IN (
    '163485d2-777a-47a3-848b-5af79a115dcf',
    '45842a23-6a3a-44fc-af02-156edc57451b',
    'c34c4eb7-0cc5-4d42-bfcb-a3058fe9da84'
  )
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
  SELECT entra_id FROM users WHERE id IN (
    '163485d2-777a-47a3-848b-5af79a115dcf',
    '45842a23-6a3a-44fc-af02-156edc57451b',
    'c34c4eb7-0cc5-4d42-bfcb-a3058fe9da84'
  )
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
  SELECT entra_id FROM users WHERE id IN (
    '163485d2-777a-47a3-848b-5af79a115dcf',
    '45842a23-6a3a-44fc-af02-156edc57451b',
    'c34c4eb7-0cc5-4d42-bfcb-a3058fe9da84'
  )
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
  SELECT entra_id FROM users WHERE id IN (
    '163485d2-777a-47a3-848b-5af79a115dcf',
    '45842a23-6a3a-44fc-af02-156edc57451b',
    'c34c4eb7-0cc5-4d42-bfcb-a3058fe9da84'
  )
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
  SELECT entra_id FROM users WHERE id IN (
    '163485d2-777a-47a3-848b-5af79a115dcf',
    '45842a23-6a3a-44fc-af02-156edc57451b',
    'c34c4eb7-0cc5-4d42-bfcb-a3058fe9da84'
  )
)
GROUP BY user_id; 