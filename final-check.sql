-- 🎯 VERIFICAÇÃO FINAL - Execute no SQL Editor do Supabase Dashboard

-- 1. USUÁRIOS COM PREFERÊNCIAS PARA 14:15
SELECT 
  u.id,
  u.entra_id,
  u.name,
  u.preferred_reminder_time,
  u.reminder_frequency,
  np.practice_reminders
FROM users u
LEFT JOIN notification_preferences np ON u.id = np.user_id
WHERE u.preferred_reminder_time = '14:15:00'
  AND np.practice_reminders = true
  AND u.reminder_frequency != 'disabled'
ORDER BY u.name;

-- 2. TOKENS ATIVOS PARA ESSES USUÁRIOS
SELECT 
  u.name,
  u.preferred_reminder_time,
  COUNT(CASE WHEN ps.subscription_type = 'fcm' AND ps.is_active = true THEN 1 END) as fcm_tokens,
  COUNT(CASE WHEN ps.subscription_type = 'web_push' AND ps.is_active = true THEN 1 END) as web_push_tokens,
  COUNT(CASE WHEN ps.is_active = true THEN 1 END) as total_active_tokens
FROM users u
LEFT JOIN push_subscriptions ps ON u.id = ps.user_id::uuid
WHERE u.preferred_reminder_time = '14:15:00'
  AND u.reminder_frequency != 'disabled'
GROUP BY u.name, u.preferred_reminder_time
ORDER BY u.name;

-- 3. SIMULAR O QUE O SCHEDULER VAI FAZER
SELECT 
  u.name,
  u.preferred_reminder_time,
  ps.platform,
  ps.subscription_type,
  ps.is_active,
  LEFT(ps.endpoint, 50) || '...' as endpoint_preview
FROM users u
LEFT JOIN push_subscriptions ps ON u.id = ps.user_id::uuid
LEFT JOIN notification_preferences np ON u.id = np.user_id
WHERE u.preferred_reminder_time = '14:15:00'
  AND np.practice_reminders = true
  AND u.reminder_frequency != 'disabled'
  AND ps.is_active = true
ORDER BY u.name, ps.platform; 