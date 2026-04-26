-- migrations/040_spaced_repetition.sql
-- Sistema de revisão espaçada + tracking de erros por exercício.
--
-- charlotte.exercise_errors: armazena cada erro cometido pelo usuário
-- charlotte.review_schedule: agenda de revisão por tópico (3, 7, 14, 30 dias)

-- ── 1. Tabela de erros por exercício ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS charlotte.exercise_errors (
  id           bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_level   text        NOT NULL,
  module_index int         NOT NULL,
  topic_index  int         NOT NULL,
  exercise_type text       NOT NULL,  -- 'multiple_choice', 'fill_gap', 'word_order', 'translate', etc.
  exercise_data jsonb,                -- payload do exercício (questão, resposta correta, resposta do user)
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_errors_user ON charlotte.exercise_errors(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_errors_topic ON charlotte.exercise_errors(user_id, user_level, module_index, topic_index);

ALTER TABLE charlotte.exercise_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "errors: insert own" ON charlotte.exercise_errors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "errors: read own" ON charlotte.exercise_errors
  FOR SELECT USING (auth.uid() = user_id);

-- ── 2. Tabela de agenda de revisão ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS charlotte.review_schedule (
  id              bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_level      text        NOT NULL,
  module_index    int         NOT NULL,
  topic_index     int         NOT NULL,
  topic_title     text,                       -- para exibir sem lookup
  completed_at    timestamptz NOT NULL,        -- quando o tópico foi concluído
  review_interval int         NOT NULL,        -- dias: 3, 7, 14, 30
  review_due      date        NOT NULL,        -- data em que a revisão deve ocorrer
  review_done     boolean     NOT NULL DEFAULT false,
  review_done_at  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, user_level, module_index, topic_index, review_interval)
);

CREATE INDEX IF NOT EXISTS idx_review_due ON charlotte.review_schedule(user_id, review_due) WHERE NOT review_done;
CREATE INDEX IF NOT EXISTS idx_review_user ON charlotte.review_schedule(user_id, review_done, review_due);

ALTER TABLE charlotte.review_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review: insert own" ON charlotte.review_schedule
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "review: read own" ON charlotte.review_schedule
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "review: update own" ON charlotte.review_schedule
  FOR UPDATE USING (auth.uid() = user_id);

-- ── 3. Views públicas ───────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.charlotte_exercise_errors
  AS SELECT * FROM charlotte.exercise_errors;

CREATE OR REPLACE VIEW public.charlotte_review_schedule
  AS SELECT * FROM charlotte.review_schedule;

-- INSTEAD OF triggers para INSERT/UPDATE via views

CREATE OR REPLACE FUNCTION public.compat_exercise_errors_ins()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO charlotte.exercise_errors (user_id, user_level, module_index, topic_index, exercise_type, exercise_data)
  VALUES (NEW.user_id, NEW.user_level, NEW.module_index, NEW.topic_index, NEW.exercise_type, NEW.exercise_data);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS compat_ins ON public.charlotte_exercise_errors;
CREATE TRIGGER compat_ins
  INSTEAD OF INSERT ON public.charlotte_exercise_errors
  FOR EACH ROW EXECUTE FUNCTION public.compat_exercise_errors_ins();

CREATE OR REPLACE FUNCTION public.compat_review_schedule_ins()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO charlotte.review_schedule (user_id, user_level, module_index, topic_index, topic_title, completed_at, review_interval, review_due)
  VALUES (NEW.user_id, NEW.user_level, NEW.module_index, NEW.topic_index, NEW.topic_title, NEW.completed_at, NEW.review_interval, NEW.review_due)
  ON CONFLICT (user_id, user_level, module_index, topic_index, review_interval) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS compat_ins ON public.charlotte_review_schedule;
CREATE TRIGGER compat_ins
  INSTEAD OF INSERT ON public.charlotte_review_schedule
  FOR EACH ROW EXECUTE FUNCTION public.compat_review_schedule_ins();

CREATE OR REPLACE FUNCTION public.compat_review_schedule_upd()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE charlotte.review_schedule
  SET review_done    = NEW.review_done,
      review_done_at = NEW.review_done_at
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS compat_upd ON public.charlotte_review_schedule;
CREATE TRIGGER compat_upd
  INSTEAD OF UPDATE ON public.charlotte_review_schedule
  FOR EACH ROW EXECUTE FUNCTION public.compat_review_schedule_upd();
