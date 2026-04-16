DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'charlotte'
      AND tablename  = 'learn_progress'
      AND policyname = 'Users can update own learn_progress'
  ) THEN
    CREATE POLICY "Users can update own learn_progress"
      ON charlotte.learn_progress FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
