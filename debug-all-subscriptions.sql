-- DEBUG: TODAS as subscriptions no banco
-- Execute no Supabase SQL Editor

-- 1. Ver TODAS as subscriptions (sem filtro de usuário)
SELECT 
  ps.user_id,
  ps.platform,
  ps.subscription_type,
  LEFT(ps.endpoint, 60) as endpoint_preview,
  CASE 
    WHEN ps.endpoint LIKE '%web.push.apple.com%' THEN '🍎 Apple Web Push'
    WHEN ps.endpoint LIKE '%fcm.googleapis.com%' THEN '🤖 Google FCM'
    ELSE '❓ Other'
  END as push_service_type,
  ps.is_active,
  ps.created_at
FROM push_subscriptions ps
WHERE ps.is_active = true
ORDER BY ps.created_at DESC
LIMIT 20;

-- 2. Ver se user_id está em formato diferente
SELECT 
  ps.user_id,
  LENGTH(ps.user_id) as user_id_length,
  ps.user_id::uuid as user_id_as_uuid,
  ps.platform,
  ps.created_at
FROM push_subscriptions ps
WHERE ps.is_active = true
ORDER BY ps.created_at DESC
LIMIT 10;

-- 3. Procurar por ENTRAIDs conhecidos em qualquer coluna
SELECT 
  ps.*
FROM push_subscriptions ps
WHERE ps.user_id LIKE '%cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4%'
   OR ps.user_id LIKE '%5ebb9b09-46f3-4499-b099-46a804da6fb6%'
   OR ps.user_id LIKE '%ade732ef-433b-4736-a73e-4e9376664ad2%'
   OR ps.endpoint LIKE '%cbdf2d66%'
   OR ps.endpoint LIKE '%5ebb9b09%';

-- 4. Ver todas as tabelas relacionadas a push/notifications
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%push%' 
       OR table_name LIKE '%notification%' 
       OR table_name LIKE '%subscription%')
ORDER BY table_name;