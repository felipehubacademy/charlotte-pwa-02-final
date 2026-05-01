-- Adiciona last_seen_at em charlotte_users para rastrear abertura do app
-- independentemente de prática concluída.

ALTER TABLE charlotte_users
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- Índice para ordenação/filtro rápido no admin
CREATE INDEX IF NOT EXISTS idx_charlotte_users_last_seen_at
  ON charlotte_users (last_seen_at DESC NULLS LAST);
