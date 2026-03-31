-- ─────────────────────────────────────────────────────────────────────────────
-- 025_chat_messages.sql
--
-- Persistent chat history for the free chat screen.
-- Keeps the last 100 messages per user/mode via a DB trigger.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── 1. Table ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS charlotte.chat_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL,
  role       TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT        NOT NULL,
  mode       TEXT        NOT NULL DEFAULT 'chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_mode_time
  ON charlotte.chat_messages (user_id, mode, created_at DESC);

-- ── 2. RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE charlotte.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users own chat messages" ON charlotte.chat_messages;
CREATE POLICY "users own chat messages" ON charlotte.chat_messages
  FOR ALL USING (auth.uid()::text = user_id);

-- ── 3. Auto-cleanup trigger: keep last 100 per user/mode ─────────────────────
CREATE OR REPLACE FUNCTION charlotte.cleanup_old_chat_messages()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM charlotte.chat_messages
  WHERE user_id = NEW.user_id
    AND mode    = NEW.mode
    AND id NOT IN (
      SELECT id
      FROM   charlotte.chat_messages
      WHERE  user_id = NEW.user_id AND mode = NEW.mode
      ORDER  BY created_at DESC
      LIMIT  100
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_cleanup_chat_messages ON charlotte.chat_messages;
CREATE TRIGGER trg_cleanup_chat_messages
  AFTER INSERT ON charlotte.chat_messages
  FOR EACH ROW EXECUTE FUNCTION charlotte.cleanup_old_chat_messages();

-- ── 4. Public compat view + INSTEAD OF trigger ────────────────────────────────
CREATE OR REPLACE VIEW public.chat_messages AS SELECT * FROM charlotte.chat_messages;

CREATE OR REPLACE FUNCTION compat_chat_messages_ins()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO charlotte.chat_messages (id, user_id, role, content, mode, created_at)
  VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.user_id,
    NEW.role,
    NEW.content,
    COALESCE(NEW.mode, 'chat'),
    COALESCE(NEW.created_at, NOW())
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_compat_chat_messages_ins ON public.chat_messages;
CREATE TRIGGER trg_compat_chat_messages_ins
  INSTEAD OF INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION compat_chat_messages_ins();

COMMIT;

DO $$ BEGIN RAISE NOTICE '✅ 025 completed: charlotte.chat_messages ready'; END $$;
