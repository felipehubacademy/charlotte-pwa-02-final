-- ─────────────────────────────────────────────────────────────────────────────
-- 052_learn_history_score.sql
--
-- Add score column to charlotte.learn_history.
-- Stores Azure Speech SDK pronunciationScore (0-100) for pronunciation
-- exercises (repeat, shadowing). NULL for binary exercises (grammar,
-- listen_write, sentence_stress, minimal_pairs).
--
-- RN change: useLearnProgress.saveExercise now passes
--   score: params.exerciseData?.score ?? null
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE charlotte.learn_history
  ADD COLUMN IF NOT EXISTS score smallint NULL
  CONSTRAINT learn_history_score_range CHECK (score BETWEEN 0 AND 100);

COMMENT ON COLUMN charlotte.learn_history.score IS
  'Pronunciation score 0-100 from Azure Speech SDK. NULL for non-pronunciation exercises.';
