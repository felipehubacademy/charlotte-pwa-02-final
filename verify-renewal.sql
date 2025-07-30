-- 🔍 VERIFICAR RENOVAÇÃO - Execute APÓS renovar subscriptions

SELECT
  u.name,
  ps.platform,
  ps.subscription_type,
  ps.is_active,
  ps.created_at,
  EXTRACT(EPOCH FROM (NOW() - ps.created_at))/60 as minutes_old
FROM users u
JOIN push_subscriptions ps ON u.entra_id = ps.user_id
WHERE u.entra_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
)
AND ps.is_active = true
AND ps.created_at > NOW() - INTERVAL '30 minutes'  -- Tokens dos últimos 30 min
ORDER BY u.name, ps.created_at DESC;