-- VERIFICAR: Campos que podem estar bloqueando
-- Execute no Supabase SQL Editor

-- 1. Ver reminder_frequency (pode estar 'disabled')
SELECT 
  name,
  entra_id,
  preferred_reminder_time,
  reminder_frequency,
  CASE 
    WHEN reminder_frequency = 'disabled' THEN '❌ BLOCKED'
    ELSE '✅ OK'
  END as frequency_status
FROM users 
WHERE entra_id IN (
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4',
  '5ebb9b09-46f3-4499-b099-46a804da6fb6', 
  'ade732ef-433b-4736-a73e-4e9376664ad2'
);

-- 2. Ver notification_preferences.practice_reminders
SELECT 
  users.name,
  users.entra_id,
  notification_preferences.practice_reminders,
  CASE 
    WHEN notification_preferences.practice_reminders = true THEN '✅ OK'
    ELSE '❌ BLOCKED'
  END as reminders_status
FROM users 
LEFT JOIN notification_preferences ON users.id = notification_preferences.user_id
WHERE users.entra_id IN (
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4',
  '5ebb9b09-46f3-4499-b099-46a804da6fb6', 
  'ade732ef-433b-4736-a73e-4e9376664ad2'
);

-- 3. Simular a query exata do código
SELECT 
  users.id,
  users.entra_id,
  users.name,
  users.preferred_reminder_time,
  users.reminder_frequency
FROM users 
WHERE users.reminder_frequency != 'disabled'
  AND users.preferred_reminder_time IN ('12:05:00', '12:00:00', '12:15:00', '11:05:00', '13:05:00')
  AND users.entra_id IN (
    'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4',
    '5ebb9b09-46f3-4499-b099-46a804da6fb6', 
    'ade732ef-433b-4736-a73e-4e9376664ad2'
  );