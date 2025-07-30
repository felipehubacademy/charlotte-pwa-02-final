-- 🔍 VERIFICAR ESTRUTURA DA TABELA - Execute no SQL Editor do Supabase Dashboard

-- 1. ESTRUTURA DA TABELA push_subscriptions
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'push_subscriptions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. VERIFICAR SE EXISTE COLUNA fcm_token
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'push_subscriptions' 
  AND table_schema = 'public'
  AND column_name LIKE '%fcm%';

-- 3. VERIFICAR DADOS REAIS (FCM tokens na coluna endpoint)
SELECT 
  id,
  user_id,
  platform,
  subscription_type,
  LEFT(endpoint, 50) || '...' as endpoint_preview,
  created_at
FROM push_subscriptions 
WHERE subscription_type = 'fcm'
ORDER BY created_at DESC
LIMIT 10;

-- 4. VERIFICAR DADOS REAIS (Web Push na coluna endpoint)
SELECT 
  id,
  user_id,
  platform,
  subscription_type,
  LEFT(endpoint, 50) || '...' as endpoint_preview,
  created_at
FROM push_subscriptions 
WHERE subscription_type = 'web_push'
ORDER BY created_at DESC
LIMIT 10; 