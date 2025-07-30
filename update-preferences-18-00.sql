-- 🔧 ATUALIZAR PREFERENCES PARA 18:00 - Execute no SQL Editor do Supabase Dashboard

-- 1. ATUALIZAR PREFERÊNCIAS PARA 18:00 (TESTE SEGURO)
UPDATE users 
SET preferred_reminder_time = '18:00:00'
WHERE entra_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
);

-- 2. VERIFICAR ATUALIZAÇÃO
SELECT 
  name,
  preferred_reminder_time,
  reminder_frequency,
  updated_at
FROM users 
WHERE entra_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'
);

-- 3. VERIFICAR TOKENS ATIVOS
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