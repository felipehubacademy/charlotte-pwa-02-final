-- LIMPAR: Subscriptions duplicadas
-- Execute no Supabase SQL Editor

-- 1. Ver subscriptions de Arthur (Android parou)
SELECT 
  platform,
  LEFT(endpoint, 60) as endpoint_preview,
  is_active,
  created_at
FROM push_subscriptions 
WHERE user_id = 'ade732ef-433b-4736-a73e-4e9376664ad2'
ORDER BY created_at DESC;

-- 2. Ver subscriptions Mac/iPhone (recebendo 3x)
SELECT 
  platform,
  LEFT(endpoint, 60) as endpoint_preview,
  is_active,
  created_at
FROM push_subscriptions 
WHERE user_id IN ('cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4', '5ebb9b09-46f3-4499-b099-46a804da6fb6')
ORDER BY user_id, created_at DESC;

-- 3. LIMPAR: Manter apenas a subscription mais recente por usuário/plataforma
-- (Execute após ver os resultados acima)

-- Para Arthur: Manter apenas Android e Windows mais recentes
UPDATE push_subscriptions 
SET is_active = false
WHERE user_id = 'ade732ef-433b-4736-a73e-4e9376664ad2'
  AND id NOT IN (
    SELECT DISTINCT ON (platform) id 
    FROM push_subscriptions 
    WHERE user_id = 'ade732ef-433b-4736-a73e-4e9376664ad2'
      AND is_active = true
    ORDER BY platform, created_at DESC
  );

-- Para iPhone: Manter apenas 1 subscription
UPDATE push_subscriptions 
SET is_active = false
WHERE user_id = 'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'
  AND id NOT IN (
    SELECT id 
    FROM push_subscriptions 
    WHERE user_id = 'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'
      AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1
  );