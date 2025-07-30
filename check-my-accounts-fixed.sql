-- 🎯 VERIFICAR MINHAS CONTAS CORRETAMENTE - Execute no SQL Editor do Supabase Dashboard

-- 1. MINHAS CONTAS COM PREFERÊNCIAS
SELECT 
  u.id,
  u.entra_id,
  u.name,
  u.preferred_reminder_time,
  u.reminder_frequency,
  np.practice_reminders
FROM users u
LEFT JOIN notification_preferences np ON u.id = np.user_id
WHERE u.entra_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
)
ORDER BY u.name;

-- 2. TOKENS ATIVOS DAS MINHAS CONTAS (CORRETO)
SELECT 
  u.name,
  u.preferred_reminder_time,
  COUNT(CASE WHEN ps.subscription_type = 'fcm' AND ps.is_active = true THEN 1 END) as fcm_tokens,
  COUNT(CASE WHEN ps.subscription_type = 'web_push' AND ps.is_active = true THEN 1 END) as web_push_tokens,
  COUNT(CASE WHEN ps.is_active = true THEN 1 END) as total_active_tokens
FROM users u
LEFT JOIN push_subscriptions ps ON u.id = ps.user_id::uuid
WHERE u.entra_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
)
GROUP BY u.name, u.preferred_reminder_time
ORDER BY u.name;

-- 3. DETALHES DOS TOKENS ATIVOS
SELECT 
  ps.id,
  ps.user_id,
  ps.platform,
  ps.subscription_type,
  ps.is_active,
  LEFT(ps.endpoint, 50) || '...' as endpoint_preview,
  ps.created_at,
  u.name as user_name
FROM push_subscriptions ps
LEFT JOIN users u ON ps.user_id::uuid = u.id
WHERE ps.user_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
)
  AND ps.is_active = true
ORDER BY u.name, ps.created_at DESC; 