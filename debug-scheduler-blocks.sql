-- 🔍 DEBUG SCHEDULER BLOCKS - Execute no SQL Editor do Supabase Dashboard

-- 1. VERIFICAR SUAS CONTAS
SELECT 
  u.name,
  u.entra_id,
  u.preferred_reminder_time,
  u.reminder_frequency
FROM users u
WHERE u.entra_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
);

-- 2. VERIFICAR SE PRATICARAM HOJE (PODE ESTAR BLOQUEANDO)
SELECT 
  u.name,
  u.entra_id,
  up.created_at as practice_time,
  up.id as practice_id
FROM users u
LEFT JOIN user_practices up ON u.id = up.user_id 
  AND up.created_at >= CURRENT_DATE
  AND up.created_at < CURRENT_DATE + INTERVAL '1 day'
WHERE u.entra_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'
)
ORDER BY u.name, up.created_at DESC;

-- 3. VERIFICAR NOTIFICAÇÕES RECENTES (PODE ESTAR BLOQUEANDO)
SELECT 
  u.name,
  u.entra_id,
  nl.created_at as notification_time,
  nl.notification_type,
  nl.status
FROM users u
LEFT JOIN notification_logs nl ON u.id = nl.user_id 
  AND nl.created_at >= NOW() - INTERVAL '2 hours'
  AND nl.notification_type = 'practice_reminder'
WHERE u.entra_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'
)
ORDER BY u.name, nl.created_at DESC;

-- 4. VERIFICAR TOKENS ATIVOS
SELECT
  u.name,
  ps.platform,
  ps.subscription_type,
  ps.is_active,
  ps.created_at
FROM users u
JOIN push_subscriptions ps ON u.entra_id = ps.user_id
WHERE u.entra_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'
)
AND ps.is_active = true
ORDER BY u.name, ps.created_at DESC;