-- migrations/039_analytics_events.sql
-- Tabela de analytics in-house — zero dependências externas, LGPD-compliant.

CREATE TABLE IF NOT EXISTS charlotte.analytics_events (
  id          bigint     GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     uuid       NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name  text       NOT NULL,
  user_level  text,
  platform    text,        -- 'ios' | 'android'
  app_version text,
  properties  jsonb,       -- payload livre (duração, módulo, exercício, etc.)
  created_at  timestamptz  NOT NULL DEFAULT now()
);

-- Índices para queries comuns
CREATE INDEX IF NOT EXISTS idx_analytics_user     ON charlotte.analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event    ON charlotte.analytics_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_created  ON charlotte.analytics_events(created_at DESC);

-- RLS: users só podem inserir seus próprios eventos, ler nada (analytics é server-only)
ALTER TABLE charlotte.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics: insert own"
  ON charlotte.analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- View pública para compatibilidade com o SDK JS (que usa public schema)
CREATE OR REPLACE VIEW public.charlotte_analytics_events
  AS SELECT * FROM charlotte.analytics_events;

CREATE OR REPLACE FUNCTION public.compat_analytics_ins()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO charlotte.analytics_events (user_id, event_name, user_level, platform, app_version, properties)
  VALUES (NEW.user_id, NEW.event_name, NEW.user_level, NEW.platform, NEW.app_version, NEW.properties);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS compat_ins ON public.charlotte_analytics_events;
CREATE TRIGGER compat_ins
  INSTEAD OF INSERT ON public.charlotte_analytics_events
  FOR EACH ROW EXECUTE FUNCTION public.compat_analytics_ins();
