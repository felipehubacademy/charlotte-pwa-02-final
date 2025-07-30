-- 🧹 LIMPAR TOKENS EXPIRADOS - Execute no SQL Editor do Supabase Dashboard

-- 1. DESATIVAR TOKENS ANTIGOS (mais de 24 horas)
UPDATE push_subscriptions 
SET is_active = false
WHERE created_at < NOW() - INTERVAL '24 hours'
AND is_active = true;

-- 2. DELETAR TOKENS iOS DUPLICADOS (manter apenas o mais recente por usuário)
DELETE FROM push_subscriptions 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, platform) id
  FROM push_subscriptions 
  WHERE platform = 'ios'
  ORDER BY user_id, platform, created_at DESC
)
AND platform = 'ios';

-- 3. VERIFICAR TOKENS ATIVOS APÓS LIMPEZA
SELECT
  u.name,
  ps.platform,
  ps.subscription_type,
  ps.created_at,
  EXTRACT(EPOCH FROM (NOW() - ps.created_at))/3600 as hours_old
FROM users u
JOIN push_subscriptions ps ON u.entra_id = ps.user_id
WHERE u.entra_id IN (
  '5ebb9b09-46f3-4499-b099-46a804da6fb6',  -- Felipe Xavier
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'   -- Felipe Xavier - Hub Academy
)
AND ps.is_active = true
ORDER BY u.name, ps.created_at DESC;