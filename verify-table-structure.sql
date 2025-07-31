-- VERIFICAR: Estrutura real da tabela push_subscriptions
-- Execute no Supabase SQL Editor

-- 1. Ver estrutura completa da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'push_subscriptions' 
ORDER BY ordinal_position;

-- 2. Ver TODOS os dados de Felipe (TODAS as colunas)
SELECT *
FROM push_subscriptions ps
WHERE ps.user_id::text IN (
  SELECT u.id::text FROM users u WHERE u.name ILIKE '%felipe%'
)
ORDER BY ps.created_at DESC
LIMIT 10;

-- 3. Ver especificamente as colunas de token/endpoint
SELECT 
  u.name,
  ps.platform,
  ps.subscription_type,
  ps.endpoint IS NOT NULL as has_endpoint,
  ps.fcm_token IS NOT NULL as has_fcm_token,
  CASE 
    WHEN ps.endpoint IS NOT NULL THEN LEFT(ps.endpoint, 50)
    ELSE 'NULL'
  END as endpoint_preview,
  CASE 
    WHEN ps.fcm_token IS NOT NULL THEN LEFT(ps.fcm_token, 20)
    ELSE 'NULL'
  END as fcm_token_preview,
  ps.keys,
  ps.is_active,
  ps.created_at
FROM push_subscriptions ps
JOIN users u ON ps.user_id::text = u.id::text
WHERE u.name ILIKE '%felipe%'
ORDER BY ps.created_at DESC;