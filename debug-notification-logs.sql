-- 🔍 INVESTIGAÇÃO: Notificações Duplicadas
-- Execute este SQL para descobrir o que causou as 3 notificações simultâneas

-- 1. Verificar todas as notificações do Felipe naquele dia
SELECT 
    id,
    user_id,
    notification_type,
    message_title,
    message_body,
    status,
    created_at,
    metadata
FROM notification_logs 
WHERE user_id = 'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'  -- Felipe
  AND created_at >= '2025-01-31 20:00:00'
  AND created_at <= '2025-01-31 21:00:00'
ORDER BY created_at;

-- 2. Verificar se há múltiplas entradas para o mesmo usuário no mesmo segundo
SELECT 
    user_id,
    notification_type,
    message_title,
    COUNT(*) as total_duplicates,
    MIN(created_at) as first_sent,
    MAX(created_at) as last_sent
FROM notification_logs 
WHERE user_id = 'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4'  -- Felipe
  AND created_at >= '2025-01-31 20:50:00'
  AND created_at <= '2025-01-31 21:00:00'
  AND notification_type = 'practice_reminder'
GROUP BY user_id, notification_type, message_title
HAVING COUNT(*) > 1;

-- 3. Verificar todas as notificações de practice_reminder naquele horário
SELECT 
    user_id,
    notification_type,
    message_title,
    created_at,
    status
FROM notification_logs 
WHERE notification_type = 'practice_reminder'
  AND created_at >= '2025-01-31 20:50:00'
  AND created_at <= '2025-01-31 21:00:00'
ORDER BY created_at;

-- 4. Verificar se há múltiplas execuções do scheduler
SELECT 
    COUNT(*) as total_executions,
    DATE_TRUNC('minute', created_at) as execution_minute
FROM notification_logs 
WHERE notification_type = 'practice_reminder'
  AND created_at >= '2025-01-31 20:50:00'
  AND created_at <= '2025-01-31 21:00:00'
GROUP BY DATE_TRUNC('minute', created_at)
ORDER BY execution_minute;

-- 5. Verificar configurações do usuário Felipe
SELECT 
    u.id,
    u.name,
    u.preferred_reminder_time,
    u.reminder_frequency,
    np.practice_reminders
FROM users u
LEFT JOIN notification_preferences np ON u.id = np.user_id
WHERE u.entra_id = 'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4';  -- Felipe 