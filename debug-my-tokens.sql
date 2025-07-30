-- 🔍 DEBUG MEUS TOKENS - Execute no SQL Editor do Supabase Dashboard
-- 1. VERIFICAR MEUS TOKENS ESPECÍFICOS
SELECT
  u.name,
  ps.platform,
  ps.subscription_type,
  ps.is_active,
  ps.created_at,
  LEFT(ps.endpoint, 50) || '...' as token_preview
FROM users u
JOIN push_subscriptions ps ON u.entra_id = ps.user_id
WHERE u.entra_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
)
ORDER BY u.name, ps.created_at DESC;

-- 2. VERIFICAR SE OS TOKENS SÃO RECENTES
SELECT
  u.name,
  ps.platform,
  ps.subscription_type,
  ps.created_at,
  EXTRACT(EPOCH FROM (NOW() - ps.created_at))/3600 as hours_old
FROM users u
JOIN push_subscriptions ps ON u.entra_id = ps.user_id
WHERE u.entra_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
)
AND ps.is_active = true
ORDER BY u.name, ps.created_at DESC;