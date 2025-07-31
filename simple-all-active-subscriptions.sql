-- SIMPLES: Todas subscriptions ativas com nomes
-- Execute no Supabase SQL Editor

-- Subscriptions ativas com nomes dos usuários
SELECT 
  users.name,
  users.preferred_reminder_time,
  push_subscriptions.platform,
  LEFT(push_subscriptions.endpoint, 60) as endpoint_preview,
  push_subscriptions.created_at
FROM push_subscriptions 
JOIN users ON push_subscriptions.user_id::text = users.id
WHERE push_subscriptions.is_active = true
ORDER BY users.name, push_subscriptions.platform;