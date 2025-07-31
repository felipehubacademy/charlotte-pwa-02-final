-- REORGANIZAR: push_subscriptions table structure
-- Execute no Supabase SQL Editor

-- BACKUP dos dados que funcionam (iPhone/Mac)
CREATE TABLE push_subscriptions_backup AS
SELECT *
FROM push_subscriptions ps
JOIN users u ON ps.user_id::text = u.id::text
WHERE u.name ILIKE '%felipe%'
  AND ps.subscription_type = 'web_push'
  AND ps.endpoint LIKE '%web.push.apple.com%'
  AND ps.is_active = true;

-- REORGANIZAÇÃO: Deletar registros inúteis/duplicados
-- CUIDADO: Só deletar após confirmar backup

-- 1. Deletar registros com FCM tokens mal colocados no endpoint
DELETE FROM push_subscriptions 
WHERE user_id::text IN (
  SELECT u.id::text FROM users u WHERE u.name ILIKE '%felipe%'
)
AND subscription_type = 'web_push'
AND LENGTH(endpoint) < 100; -- FCM tokens são curtos

-- 2. Deletar registros duplicados (manter o mais recente)
DELETE FROM push_subscriptions 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, endpoint) id
  FROM push_subscriptions 
  WHERE user_id::text IN (
    SELECT u.id::text FROM users u WHERE u.name ILIKE '%felipe%'
  )
  ORDER BY user_id, endpoint, created_at DESC
);

-- 3. Atualizar platform detection correta
UPDATE push_subscriptions 
SET platform = CASE 
  WHEN endpoint LIKE '%web.push.apple.com%' AND subscription_type = 'web_push' THEN 'ios'
  WHEN endpoint LIKE '%fcm.googleapis.com%' AND subscription_type = 'web_push' THEN 'android'
  WHEN endpoint LIKE '%mozilla%' THEN 'firefox'
  WHEN subscription_type = 'fcm' THEN 'android'
  ELSE platform
END
WHERE user_id::text IN (
  SELECT u.id::text FROM users u WHERE u.name ILIKE '%felipe%'
);

-- 4. Limpar coluna fcm_token (deve ser NULL para web_push)
UPDATE push_subscriptions 
SET fcm_token = NULL
WHERE subscription_type = 'web_push'
AND user_id::text IN (
  SELECT u.id::text FROM users u WHERE u.name ILIKE '%felipe%'
);