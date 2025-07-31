-- TESTE: Android direto com ENTRA_ID correto
-- Execute no Supabase SQL Editor

-- Ver subscription do Android usando ENTRA_ID
SELECT 
  u.name,
  u.id as user_table_id,
  u.entra_id,
  ps.user_id as subscription_user_id,
  ps.platform,
  ps.subscription_type,
  LEFT(ps.endpoint, 60) as endpoint_preview,
  ps.is_active,
  ps.created_at
FROM push_subscriptions ps
JOIN users u ON ps.user_id = u.entra_id  -- 🔥 USANDO ENTRA_ID!
WHERE ps.user_id = 'ade732ef-433b-4736-a73e-4e9376664ad2'  -- Arthur Android
ORDER BY ps.created_at DESC;

-- Ver notification_preferences do Arthur
SELECT *
FROM notification_preferences np
JOIN users u ON np.user_id::text = u.id::text  -- users.id
WHERE u.entra_id = 'ade732ef-433b-4736-a73e-4e9376664ad2';