-- 🍎 VERIFICAR TOKENS APPLE - Execute no SQL Editor do Supabase Dashboard

-- 1. TODOS OS TOKENS APPLE (Mac + iPhone)
SELECT 
  id,
  user_id,
  platform,
  subscription_type,
  LEFT(endpoint, 50) || '...' as endpoint_preview,
  created_at,
  is_active
FROM push_subscriptions 
WHERE platform IN ('ios', 'desktop', 'mac')
  AND is_active = true
ORDER BY created_at DESC;

-- 2. TOKENS FCM PARA APPLE
SELECT 
  id,
  user_id,
  platform,
  subscription_type,
  LEFT(endpoint, 50) || '...' as endpoint_preview,
  created_at
FROM push_subscriptions 
WHERE platform IN ('ios', 'desktop', 'mac')
  AND subscription_type = 'fcm'
  AND is_active = true
ORDER BY created_at DESC;

-- 3. TOKENS WEB PUSH PARA APPLE
SELECT 
  id,
  user_id,
  platform,
  subscription_type,
  LEFT(endpoint, 50) || '...' as endpoint_preview,
  created_at
FROM push_subscriptions 
WHERE platform IN ('ios', 'desktop', 'mac')
  AND subscription_type = 'web_push'
  AND is_active = true
ORDER BY created_at DESC;

-- 4. CONTAGEM POR PLATAFORMA APPLE
SELECT 
  platform,
  subscription_type,
  COUNT(*) as total_tokens
FROM push_subscriptions 
WHERE platform IN ('ios', 'desktop', 'mac')
  AND is_active = true
GROUP BY platform, subscription_type
ORDER BY platform, subscription_type; 