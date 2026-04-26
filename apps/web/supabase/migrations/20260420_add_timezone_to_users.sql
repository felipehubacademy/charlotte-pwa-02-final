-- Migration: adiciona coluna timezone em charlotte.users (tabela real)
-- e atualiza a view public.charlotte_users + trigger INSTEAD OF UPDATE

-- 1. Adicionar coluna na tabela real
ALTER TABLE charlotte.users
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';

COMMENT ON COLUMN charlotte.users.timezone IS
  'IANA timezone do device (ex: America/Sao_Paulo). Atualizado pelo app RN a cada sessão.';

-- 2. Recriar a view expondo o novo campo
DROP VIEW IF EXISTS public.charlotte_users;
CREATE VIEW public.charlotte_users AS
  SELECT
    users.id,
    users.email,
    users.name,
    users.charlotte_level,
    users.placement_test_done,
    users.first_welcome_done,
    users.is_institutional,
    users.is_active,
    users.subscription_status,
    users.trial_ends_at,
    users.must_change_password,
    users.expo_push_token,
    users.created_at,
    users.updated_at,
    users.live_voice_seconds_used,
    users.live_voice_reset_date,
    users.avatar_url,
    users.timezone
  FROM charlotte.users;

-- 3. Atualizar trigger INSTEAD OF UPDATE para incluir timezone
CREATE OR REPLACE FUNCTION public.compat_charlotte_users_upd()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE charlotte.users
  SET email                   = NEW.email,
      name                    = NEW.name,
      charlotte_level         = NEW.charlotte_level,
      placement_test_done     = NEW.placement_test_done,
      is_institutional        = NEW.is_institutional,
      is_active               = NEW.is_active,
      subscription_status     = NEW.subscription_status,
      trial_ends_at           = NEW.trial_ends_at,
      must_change_password    = NEW.must_change_password,
      expo_push_token         = NEW.expo_push_token,
      avatar_url              = NEW.avatar_url,
      timezone                = NEW.timezone,
      updated_at              = now()
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$;
