-- 🎯 FORÇAR FCM PARA MINHAS CONTAS - Execute no SQL Editor do Supabase Dashboard

-- 1. LIMPAR TOKENS ANTIGOS DAS MINHAS CONTAS (opcional)
-- UPDATE push_subscriptions 
-- SET is_active = false 
-- WHERE user_id IN (
--   '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
--   'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
-- )
--   AND created_at < NOW() - INTERVAL '1 hour';

-- 2. VERIFICAR TOKENS ATIVOS DAS MINHAS CONTAS
SELECT 
  ps.id,
  ps.user_id,
  ps.platform,
  ps.subscription_type,
  ps.is_active,
  u.name as user_name,
  u.preferred_reminder_time
FROM push_subscriptions ps
LEFT JOIN users u ON ps.user_id::uuid = u.id
WHERE ps.user_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
)
  AND ps.is_active = true
ORDER BY u.name, ps.created_at DESC;

-- 3. VERIFICAR SE TENHO PREFERÊNCIAS PARA 14:15
SELECT 
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