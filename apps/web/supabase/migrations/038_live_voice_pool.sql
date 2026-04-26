-- migrations/038_live_voice_pool.sql
-- Adiciona rastreamento do pool mensal de Live Voice em charlotte.users.
-- 1800 s = 30 min/mês por usuário.

-- ── 1. Novas colunas ─────────────────────────────────────────────────────────

ALTER TABLE charlotte.users
  ADD COLUMN IF NOT EXISTS live_voice_seconds_used  integer  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS live_voice_reset_date    date;

COMMENT ON COLUMN charlotte.users.live_voice_seconds_used
  IS 'Segundos de Live Voice consumidos no mês corrente (reset no 1º dia de cada mês).';
COMMENT ON COLUMN charlotte.users.live_voice_reset_date
  IS 'Primeiro dia do mês em que live_voice_seconds_used foi zerado pela última vez (YYYY-MM-01).';

-- ── 2. Atualizar trigger INSTEAD OF UPDATE da view pública ─────────────────
--
-- O trigger criado em 036 tem uma lista explícita de colunas; sem essa
-- atualização, writes em live_voice_seconds_used / live_voice_reset_date
-- através de public.charlotte_users seriam silenciosamente ignorados.

CREATE OR REPLACE FUNCTION public.compat_charlotte_users_upd()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE charlotte.users
  SET email                      = NEW.email,
      name                       = NEW.name,
      charlotte_level            = NEW.charlotte_level,
      placement_test_done        = NEW.placement_test_done,
      is_institutional           = NEW.is_institutional,
      is_active                  = NEW.is_active,
      subscription_status        = NEW.subscription_status,
      trial_ends_at              = NEW.trial_ends_at,
      must_change_password       = NEW.must_change_password,
      expo_push_token            = NEW.expo_push_token,
      live_voice_seconds_used    = NEW.live_voice_seconds_used,
      live_voice_reset_date      = NEW.live_voice_reset_date,
      updated_at                 = NEW.updated_at
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$;
