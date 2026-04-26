-- Add score column to learn_history (pronunciation exercises: 0-100)
ALTER TABLE charlotte.learn_history
  ADD COLUMN IF NOT EXISTS score INTEGER;
