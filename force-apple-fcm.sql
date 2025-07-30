-- 🍎 FORÇAR FCM PARA APPLE - Execute no SQL Editor do Supabase Dashboard

-- 1. LIMPAR TOKENS ANTIGOS APPLE (opcional - descomente se necessário)
-- UPDATE push_subscriptions 
-- SET is_active = false 
-- WHERE platform IN ('ios', 'desktop', 'mac')
--   AND created_at < NOW() - INTERVAL '1 day';

-- 2. VERIFICAR TOKENS ATIVOS APPLE
SELECT 
  id,
  user_id,
  platform,
  subscription_type,
  is_active,
  created_at
FROM push_subscriptions 
WHERE platform IN ('ios', 'desktop', 'mac')
  AND is_active = true
ORDER BY created_at DESC;

-- 3. VERIFICAR SE HÁ FCM PARA APPLE
SELECT 
  COUNT(*) as total_apple_fcm
FROM push_subscriptions 
WHERE platform IN ('ios', 'desktop', 'mac')
  AND subscription_type = 'fcm'
  AND is_active = true; 