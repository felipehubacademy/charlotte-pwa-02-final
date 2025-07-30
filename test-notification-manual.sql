-- 🧪 TESTE MANUAL DE NOTIFICAÇÃO - Execute no SQL Editor do Supabase Dashboard

-- 1. VERIFICAR SE EXISTEM TOKENS VÁLIDOS
SELECT 
  COUNT(*) as total_tokens,
  COUNT(CASE WHEN platform = 'fcm' THEN 1 END) as fcm_tokens,
  COUNT(CASE WHEN platform = 'desktop' THEN 1 END) as desktop_tokens,
  COUNT(CASE WHEN platform = 'ios' THEN 1 END) as ios_tokens
FROM push_subscriptions;

-- 2. VERIFICAR TOKENS MAIS RECENTES
SELECT 
  ps.id,
  ps.platform,
  ps.created_at,
  ps.fcm_token,
  u.name as user_name
FROM push_subscriptions ps
LEFT JOIN users u ON ps.user_id::uuid = u.id
ORDER BY ps.created_at DESC
LIMIT 10;

-- 3. VERIFICAR SE HÁ TOKENS PARA iOS ESPECIFICAMENTE
SELECT 
  ps.id,
  ps.platform,
  ps.created_at,
  ps.fcm_token,
  u.name as user_name,
  u.entra_id
FROM push_subscriptions ps
LEFT JOIN users u ON ps.user_id::uuid = u.id
WHERE ps.platform = 'ios' OR ps.platform = 'fcm'
ORDER BY ps.created_at DESC; 