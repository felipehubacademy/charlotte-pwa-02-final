-- 🔍 DEBUG: VERIFICAR TOKENS INATIVOS - Execute no SQL Editor do Supabase Dashboard

-- 1. TODOS OS TOKENS DAS MINHAS CONTAS (ativos e inativos)
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
ORDER BY u.name, ps.created_at DESC;

-- 2. VERIFICAR SE HÁ TOKENS RECENTES (últimas 24h)
SELECT 
  ps.id,
  ps.user_id,
  ps.platform,
  ps.subscription_type,
  ps.is_active,
  ps.created_at,
  u.name as user_name
FROM push_subscriptions ps
LEFT JOIN users u ON ps.user_id::uuid = u.id
WHERE ps.user_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'
)
  AND ps.created_at > NOW() - INTERVAL '24 hours'
ORDER BY ps.created_at DESC;

-- 3. VERIFICAR SE HÁ TOKENS PARA PLATAFORMA APPLE
SELECT 
  ps.id,
  ps.user_id,
  ps.platform,
  ps.subscription_type,
  ps.is_active,
  ps.created_at,
  u.name as user_name
FROM push_subscriptions ps
LEFT JOIN users u ON ps.user_id::uuid = u.id
WHERE ps.user_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'
)
  AND ps.platform IN ('ios', 'desktop', 'mac')
ORDER BY ps.created_at DESC; 