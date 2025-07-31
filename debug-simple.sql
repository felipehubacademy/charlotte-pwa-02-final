-- 🔍 DEBUG SIMPLES - Execute no SQL Editor do Supabase Dashboard

-- 1. VERIFICAR SUAS CONTAS BÁSICAS
SELECT 
  name,
  entra_id,
  preferred_reminder_time,
  reminder_frequency
FROM users 
WHERE entra_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'
);

-- 2. VERIFICAR TOKENS ATIVOS SIMPLES
SELECT
  u.name,
  COUNT(*) as total_tokens
FROM users u
JOIN push_subscriptions ps ON u.entra_id = ps.user_id
WHERE u.entra_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'
)
AND ps.is_active = true
GROUP BY u.name, u.entra_id;