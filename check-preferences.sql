-- 🔍 VERIFICAR HORÁRIOS NA TABELA USERS
-- Execute no SQL Editor do Supabase Dashboard

-- 1. TODOS OS USUÁRIOS COM SEUS HORÁRIOS
SELECT 
  u.id,
  u.entra_id,
  u.name,
  u.preferred_reminder_time,
  u.reminder_frequency,
  np.practice_reminders,
  np.updated_at as pref_updated
FROM users u
LEFT JOIN notification_preferences np ON u.id = np.user_id
WHERE np.practice_reminders = true
ORDER BY u.preferred_reminder_time;

-- 2. ESPECIFICAMENTE USUÁRIOS COM 12:00:00
SELECT 
  u.id,
  u.entra_id,
  u.name,
  u.preferred_reminder_time,
  u.reminder_frequency
FROM users u
WHERE u.preferred_reminder_time = '12:00:00'
ORDER BY u.name;

-- 3. USUÁRIOS COM 12:00:00 E PREFERÊNCIAS ATIVAS
SELECT 
  u.id,
  u.entra_id,
  u.name,
  u.preferred_reminder_time,
  u.reminder_frequency,
  np.practice_reminders
FROM users u
LEFT JOIN notification_preferences np ON u.id = np.user_id
WHERE u.preferred_reminder_time = '12:00:00'
  AND np.practice_reminders = true
ORDER BY u.name;

-- 4. TODOS OS HORÁRIOS DISTINTOS CONFIGURADOS
SELECT 
  u.preferred_reminder_time,
  COUNT(*) as total_users
FROM users u
WHERE u.preferred_reminder_time IS NOT NULL
GROUP BY u.preferred_reminder_time
ORDER BY u.preferred_reminder_time; 