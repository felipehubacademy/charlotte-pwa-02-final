-- Fix: charlotte.user_achievements permite duplicatas quando achievement_id = NULL
-- porque UNIQUE(user_id, achievement_id) com NULL não funciona no PostgreSQL.
-- Solução: índice único em (user_id, achievement_name).

-- 1. Remover linhas duplicadas existentes (mantém a mais antiga por user+achievement_name)
DELETE FROM charlotte.user_achievements a
WHERE a.id NOT IN (
  SELECT DISTINCT ON (user_id, achievement_name) id
  FROM charlotte.user_achievements
  ORDER BY user_id, achievement_name, earned_at ASC
);

-- 2. Criar índice único em (user_id, achievement_name)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_achievements_user_name
  ON charlotte.user_achievements (user_id, achievement_name);
