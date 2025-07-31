-- VERIFICAR: Todas subscriptions ativas com nomes dos usuários
-- Execute no Supabase SQL Editor

-- 1. TODAS subscriptions ativas por usuário
SELECT 
  users.name,
  users.entra_id,
  users.preferred_reminder_time,
  push_subscriptions.platform,
  push_subscriptions.subscription_type,
  LEFT(push_subscriptions.endpoint, 60) as endpoint_preview,
  push_subscriptions.is_active,
  push_subscriptions.created_at
FROM users 
LEFT JOIN push_subscriptions ON users.id = push_subscriptions.user_id::text
WHERE push_subscriptions.is_active = true
ORDER BY users.name, push_subscriptions.platform, push_subscriptions.created_at DESC;

-- 2. Contar subscriptions por usuário
SELECT 
  users.name,
  COUNT(push_subscriptions.id) as total_subscriptions,
  STRING_AGG(push_subscriptions.platform, ', ') as platforms
FROM users 
LEFT JOIN push_subscriptions ON users.id = push_subscriptions.user_id::text
WHERE push_subscriptions.is_active = true
GROUP BY users.name, users.id
ORDER BY total_subscriptions DESC;