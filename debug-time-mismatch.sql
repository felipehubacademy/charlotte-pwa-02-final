-- VERIFICAR: Por que não enviou às 12:05 Brasil
-- Execute no Supabase SQL Editor

-- 1. Ver preferências atuais
SELECT 
  users.name,
  users.entra_id,
  notification_preferences.preferred_reminder_time,
  notification_preferences.practice_reminders
FROM users 
JOIN notification_preferences ON users.id = notification_preferences.user_id
WHERE users.entra_id IN (
  'cbdf2d66-dfb2-4424-ac9d-bc4b66c666b4', -- iPhone
  '5ebb9b09-46f3-4499-b099-46a804da6fb6', -- Mac  
  'ade732ef-433b-4736-a73e-4e9376664ad2'  -- Arthur
);

-- 2. TESTE: Que horário UTC é 12:05 Brasil? 
-- Brasil = UTC-3, então 12:05 Brasil = 15:05 UTC
-- Cron 14:15 UTC = 11:15 Brasil ❌
-- Cron 15:05 UTC = 12:05 Brasil ✅

-- 3. Ver horário atual UTC
SELECT NOW() as current_utc;