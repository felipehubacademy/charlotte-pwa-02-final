-- Enable RLS on charlotte.user_achievements and restrict reads to the owner.
-- user_id is varchar, so auth.uid() must be cast to text.
ALTER TABLE charlotte.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_achievements_own"
  ON charlotte.user_achievements
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- Enable RLS on charlotte.achievements (public catalogue — readable by all authenticated users).
ALTER TABLE charlotte.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "achievements_read_all"
  ON charlotte.achievements
  FOR SELECT
  USING (true);
