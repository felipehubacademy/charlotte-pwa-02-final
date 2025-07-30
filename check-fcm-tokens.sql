-- 🔍 VERIFICAR FCM TOKENS - Execute no SQL Editor do Supabase Dashboard

-- 1. TODOS OS FCM TOKENS
SELECT 
  ps.id,
  ps.user_id,
  ps.platform,
  ps.created_at,
  ps.updated_at,
  ps.fcm_token,
  u.name as user_name,
  u.entra_id
FROM push_subscriptions ps
LEFT JOIN users u ON ps.user_id::uuid = u.id
ORDER BY ps.created_at DESC;

-- 2. FCM TOKENS POR USUÁRIO ESPECÍFICO (Arthur)
SELECT 
  ps.id,
  ps.user_id,
  ps.platform,
  ps.created_at,
  ps.updated_at,
  ps.fcm_token,
  u.name as user_name,
  u.entra_id
FROM push_subscriptions ps
LEFT JOIN users u ON ps.user_id::uuid = u.id
WHERE u.entra_id = 'ade732ef-433b-4736-a73e-4e9376664ad2'
ORDER BY ps.created_at DESC;

-- 3. FCM TOKENS POR USUÁRIO ESPECÍFICO (Felipe Xavier)
SELECT 
  ps.id,
  ps.user_id,
  ps.platform,
  ps.created_at,
  ps.updated_at,
  ps.fcm_token,
  u.name as user_name,
  u.entra_id
FROM push_subscriptions ps
LEFT JOIN users u ON ps.user_id::uuid = u.id
WHERE u.entra_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'
ORDER BY ps.created_at DESC;

-- 4. FCM TOKENS POR USUÁRIO ESPECÍFICO (Felipe Xavier - Hub Academy)
SELECT 
  ps.id,
  ps.user_id,
  ps.platform,
  ps.created_at,
  ps.updated_at,
  ps.fcm_token,
  u.name as user_name,
  u.entra_id
FROM push_subscriptions ps
LEFT JOIN users u ON ps.user_id::uuid = u.id
WHERE u.entra_id = 'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'
ORDER BY ps.created_at DESC;

-- 5. CONTAGEM DE TOKENS POR PLATAFORMA
SELECT 
  platform,
  COUNT(*) as total_tokens
FROM push_subscriptions
GROUP BY platform
ORDER BY total_tokens DESC;

-- 6. TOKENS CRIADOS HOJE
SELECT 
  ps.id,
  ps.user_id,
  ps.platform,
  ps.created_at,
  u.name as user_name
FROM push_subscriptions ps
LEFT JOIN users u ON ps.user_id::uuid = u.id
WHERE DATE(ps.created_at) = CURRENT_DATE
ORDER BY ps.created_at DESC; 