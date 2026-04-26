-- ─────────────────────────────────────────────────────────────────────────────
-- 020_learn_trail.sql
-- Tables for the structured learning trail (grammar + pronunciation modules)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── learn_progress ────────────────────────────────────────────────────────────
-- One row per user per level. Tracks exactly where the user is in their trail.

CREATE TABLE IF NOT EXISTS learn_progress (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level          TEXT        NOT NULL CHECK (level IN ('Novice', 'Inter', 'Advanced')),
  module_index   INTEGER     NOT NULL DEFAULT 0,
  topic_index    INTEGER     NOT NULL DEFAULT 0,
  -- JSON array of completed topic keys, e.g. [{"m":0,"t":0},{"m":0,"t":1}]
  completed      JSONB       NOT NULL DEFAULT '[]'::jsonb,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, level)
);

ALTER TABLE learn_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own learn_progress"
  ON learn_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learn_progress"
  ON learn_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learn_progress"
  ON learn_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- ── learn_history ─────────────────────────────────────────────────────────────
-- One row per exercise answered. Used for stats and future adaptive review.

CREATE TABLE IF NOT EXISTS learn_history (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level          TEXT        NOT NULL,
  module_index   INTEGER     NOT NULL,
  topic_index    INTEGER     NOT NULL,
  exercise_type  TEXT        NOT NULL,  -- 'multiple_choice' | 'word_bank' | 'fill_gap' | 'fix_error' | 'read_answer' | 'repeat' | 'listen_write'
  is_correct     BOOLEAN     NOT NULL,
  xp_earned      INTEGER     NOT NULL DEFAULT 0,
  answered_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE learn_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own learn_history"
  ON learn_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learn_history"
  ON learn_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS learn_progress_user_idx  ON learn_progress (user_id);
CREATE INDEX IF NOT EXISTS learn_history_user_idx   ON learn_history  (user_id);
CREATE INDEX IF NOT EXISTS learn_history_date_idx   ON learn_history  (user_id, answered_at DESC);
