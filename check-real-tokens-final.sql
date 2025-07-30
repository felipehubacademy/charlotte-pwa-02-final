-- 🔍 VERIFICAR TOKENS REAIS - Execute no SQL Editor do Supabase Dashboard

-- 1. CONTAGEM TOTAL DE TOKENS
SELECT 
  COUNT(*) as total_tokens,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_tokens,
  COUNT(CASE WHEN subscription_type = 'fcm' THEN 1 END) as fcm_tokens,
  COUNT(CASE WHEN subscription_type = 'web_push' THEN 1 END) as web_push_tokens
FROM push_subscriptions;

-- 2. TOKENS DAS SUAS CONTAS
SELECT 
  user_id,
  platform,
  subscription_type,
  is_active,
  LEFT(endpoint, 50) || '...' as endpoint_preview,
  created_at
FROM push_subscriptions 
WHERE user_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'
)
ORDER BY created_at DESC;

-- 3. TOKENS ATIVOS DAS SUAS CONTAS
SELECT 
  user_id,
  platform,
  subscription_type,
  is_active,
  LEFT(endpoint, 50) || '...' as endpoint_preview
FROM push_subscriptions 
WHERE user_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'
)
  AND is_active = true
ORDER BY created_at DESC; 