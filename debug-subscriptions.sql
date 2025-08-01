-- 🔍 INVESTIGAÇÃO: Múltiplas Subscriptions
-- Execute para verificar se há subscriptions duplicadas

-- 1. Verificar todas as subscriptions do Felipe
SELECT 
    id,
    user_id,
    platform,
    subscription_type,
    is_active,
    created_at,
    endpoint
FROM push_subscriptions 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'  -- Felipe
ORDER BY created_at;

-- 2. Verificar subscriptions ativas por plataforma
SELECT 
    platform,
    subscription_type,
    COUNT(*) as total_subscriptions,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_subscriptions
FROM push_subscriptions 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'  -- Felipe
GROUP BY platform, subscription_type;

-- 3. Verificar se há endpoints duplicados
SELECT 
    endpoint,
    COUNT(*) as duplicate_count,
    array_agg(platform) as platforms,
    array_agg(created_at) as created_dates
FROM push_subscriptions 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'  -- Felipe
GROUP BY endpoint
HAVING COUNT(*) > 1;

-- 4. Verificar subscriptions por tipo
SELECT 
    subscription_type,
    platform,
    is_active,
    COUNT(*) as count
FROM push_subscriptions 
WHERE user_id = '5ebb9b09-46f3-4499-b099-46a804da6fb6'  -- Felipe
GROUP BY subscription_type, platform, is_active
ORDER BY subscription_type, platform; 