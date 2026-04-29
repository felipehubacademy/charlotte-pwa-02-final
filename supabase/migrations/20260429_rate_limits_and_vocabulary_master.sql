-- Move charlotte_rate_limits to charlotte.rate_limits
-- Create updatable public view to maintain web access without exposing schema
ALTER TABLE public.charlotte_rate_limits SET SCHEMA charlotte;
ALTER TABLE charlotte.charlotte_rate_limits RENAME TO rate_limits;

CREATE VIEW public.rate_limits AS SELECT * FROM charlotte.rate_limits;

-- Update trigger function to reference charlotte.rate_limits directly
CREATE OR REPLACE FUNCTION public.delete_rate_limit_on_institutional()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_institutional = true AND (OLD.is_institutional IS DISTINCT FROM TRUE) THEN
    DELETE FROM charlotte.rate_limits WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create vocabulary_master in charlotte schema (empty — populated in future)
-- Used by the Add Word flow to check if a term is pre-cached
CREATE TABLE charlotte.vocabulary_master (
  term           TEXT PRIMARY KEY,
  definition     TEXT,
  phonetic       TEXT,
  part_of_speech TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE charlotte.vocabulary_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vocabulary_master_read_all"
  ON charlotte.vocabulary_master FOR SELECT
  USING (true);

CREATE VIEW public.vocabulary_master AS SELECT * FROM charlotte.vocabulary_master;
