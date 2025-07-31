-- ENCONTRAR: Seus usuários reais no sistema
-- Execute no Supabase SQL Editor

-- 1. Ver TODOS os usuários para encontrar os seus
SELECT 
  id,
  entra_id,
  name,
  email,
  preferred_reminder_time,
  reminder_frequency,
  created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 20;

-- 2. Ver usuários com notificações ativas
SELECT DISTINCT
  u.id,
  u.entra_id, 
  u.name,
  u.email,
  COUNT(ps.id) as total_subscriptions
FROM users u
LEFT JOIN push_subscriptions ps ON u.id::text = ps.user_id::text
GROUP BY u.id, u.entra_id, u.name, u.email
HAVING COUNT(ps.id) > 0
ORDER BY total_subscriptions DESC;

-- 3. Ver usuários com preferências 10:30 (que funcionaram no teste)
SELECT 
  u.id,
  u.entra_id,
  u.name,
  u.preferred_reminder_time,
  u.reminder_frequency
FROM users u
WHERE u.preferred_reminder_time IN ('10:30:00', '10:25:00', '10:15:00', '10:00:00')
ORDER BY u.updated_at DESC;