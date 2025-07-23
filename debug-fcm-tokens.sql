-- Debug: Verificar tokens FCM salvos no banco
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Ver todos os tokens FCM ativos
SELECT 
  user_id,
  subscription_type,
  platform,
  is_active,
  created_at,
  updated_at,
  LEFT(endpoint, 50) as endpoint_preview
FROM push_subscriptions 
WHERE subscription_type = 'fcm' 
  AND is_active = true
ORDER BY created_at DESC;

-- 2. Ver especificamente para seu usuário
SELECT 
  user_id,
  subscription_type,
  platform,
  is_active,
  created_at,
  updated_at,
  LEFT(endpoint, 50) as endpoint_preview
FROM push_subscriptions 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
  AND subscription_type = 'fcm'
ORDER BY created_at DESC;

-- 3. Contar tokens por tipo
SELECT 
  subscription_type,
  COUNT(*) as total,
  COUNT(CASE WHEN is_active THEN 1 END) as active
FROM push_subscriptions 
GROUP BY subscription_type;

-- 4. Ver tokens mais recentes (últimos 10 minutos)
SELECT 
  user_id,
  subscription_type,
  platform,
  is_active,
  created_at,
  LEFT(endpoint, 50) as endpoint_preview
FROM push_subscriptions 
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC; 