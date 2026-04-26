-- ============================================================
-- SR System: user_vocabulary + sr_items
-- Replaces the simple review_schedule with SM-2 algorithm.
-- Existing review_schedule data is migrated into sr_items.
-- ============================================================

-- ── 1. user_vocabulary ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS charlotte.user_vocabulary (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  term                text        NOT NULL,
  definition          text        NOT NULL DEFAULT '',
  example             text        NOT NULL DEFAULT '',
  example_translation text        NOT NULL DEFAULT '',  -- PT-BR, apenas Novice
  phonetic            text        NOT NULL DEFAULT '',  -- IPA, apenas Inter/Advanced
  category            text        NOT NULL DEFAULT 'word'
                                  CHECK (category IN ('word','idiom','phrasal_verb','grammar')),
  source              text        NOT NULL DEFAULT 'manual'
                                  CHECK (source IN ('manual','charlotte','learn_trail','tip_of_day')),
  created_at          timestamptz NOT NULL DEFAULT now(),

  -- SM-2 fields
  ease_factor         float       NOT NULL DEFAULT 2.5,
  interval_days       int         NOT NULL DEFAULT 0,
  repetitions         int         NOT NULL DEFAULT 0,
  next_review_at      timestamptz NOT NULL DEFAULT now(),
  last_reviewed_at    timestamptz,
  last_rating         text        CHECK (last_rating IN ('hard','ok','easy'))
);

CREATE INDEX IF NOT EXISTS user_vocabulary_user_id_idx
  ON charlotte.user_vocabulary (user_id);
CREATE INDEX IF NOT EXISTS user_vocabulary_next_review_idx
  ON charlotte.user_vocabulary (user_id, next_review_at);

ALTER TABLE charlotte.user_vocabulary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own vocabulary"
  ON charlotte.user_vocabulary
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public view
CREATE OR REPLACE VIEW public.user_vocabulary AS
  SELECT * FROM charlotte.user_vocabulary;

CREATE OR REPLACE FUNCTION public.user_vocabulary_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO charlotte.user_vocabulary VALUES (NEW.*);
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.user_vocabulary_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE charlotte.user_vocabulary SET
    term                = NEW.term,
    definition          = NEW.definition,
    example             = NEW.example,
    example_translation = NEW.example_translation,
    phonetic            = NEW.phonetic,
    category            = NEW.category,
    source              = NEW.source,
    ease_factor         = NEW.ease_factor,
    interval_days       = NEW.interval_days,
    repetitions         = NEW.repetitions,
    next_review_at      = NEW.next_review_at,
    last_reviewed_at    = NEW.last_reviewed_at,
    last_rating         = NEW.last_rating
  WHERE id = OLD.id;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.user_vocabulary_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM charlotte.user_vocabulary WHERE id = OLD.id;
  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS user_vocabulary_insert_trigger ON public.user_vocabulary;
DROP TRIGGER IF EXISTS user_vocabulary_update_trigger ON public.user_vocabulary;
DROP TRIGGER IF EXISTS user_vocabulary_delete_trigger ON public.user_vocabulary;

CREATE TRIGGER user_vocabulary_insert_trigger
  INSTEAD OF INSERT ON public.user_vocabulary
  FOR EACH ROW EXECUTE FUNCTION public.user_vocabulary_insert();

CREATE TRIGGER user_vocabulary_update_trigger
  INSTEAD OF UPDATE ON public.user_vocabulary
  FOR EACH ROW EXECUTE FUNCTION public.user_vocabulary_update();

CREATE TRIGGER user_vocabulary_delete_trigger
  INSTEAD OF DELETE ON public.user_vocabulary
  FOR EACH ROW EXECUTE FUNCTION public.user_vocabulary_delete();

-- ── 2. sr_items ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS charlotte.sr_items (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type      text        NOT NULL
                               CHECK (source_type IN ('vocabulary','learn_topic')),
  source_id        text        NOT NULL, -- uuid for vocabulary, 'level:mod:topic' for learn_topic
  card_type        text        NOT NULL
                               CHECK (card_type IN ('gap_fill','reverse','context_guess',
                                                    'charlotte_challenge','listening_gap')),
  content          jsonb       NOT NULL DEFAULT '{}',

  -- metadata (denormalized for query performance)
  user_level       text,
  topic_title      text,

  -- SM-2 fields
  ease_factor      float       NOT NULL DEFAULT 2.5,
  interval_days    int         NOT NULL DEFAULT 0,
  repetitions      int         NOT NULL DEFAULT 0,
  next_review_at   timestamptz NOT NULL DEFAULT now(),
  last_reviewed_at timestamptz,
  last_rating      text        CHECK (last_rating IN ('hard','ok','easy')),

  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sr_items_user_id_idx
  ON charlotte.sr_items (user_id);
CREATE INDEX IF NOT EXISTS sr_items_next_review_idx
  ON charlotte.sr_items (user_id, next_review_at)
  WHERE last_rating IS NULL OR last_rating != 'easy' OR interval_days < 60;

ALTER TABLE charlotte.sr_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sr_items"
  ON charlotte.sr_items
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public view
CREATE OR REPLACE VIEW public.sr_items AS
  SELECT * FROM charlotte.sr_items;

CREATE OR REPLACE FUNCTION public.sr_items_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO charlotte.sr_items VALUES (NEW.*);
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.sr_items_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE charlotte.sr_items SET
    card_type        = NEW.card_type,
    content          = NEW.content,
    ease_factor      = NEW.ease_factor,
    interval_days    = NEW.interval_days,
    repetitions      = NEW.repetitions,
    next_review_at   = NEW.next_review_at,
    last_reviewed_at = NEW.last_reviewed_at,
    last_rating      = NEW.last_rating
  WHERE id = OLD.id;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.sr_items_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM charlotte.sr_items WHERE id = OLD.id;
  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS sr_items_insert_trigger ON public.sr_items;
DROP TRIGGER IF EXISTS sr_items_update_trigger ON public.sr_items;
DROP TRIGGER IF EXISTS sr_items_delete_trigger ON public.sr_items;

CREATE TRIGGER sr_items_insert_trigger
  INSTEAD OF INSERT ON public.sr_items
  FOR EACH ROW EXECUTE FUNCTION public.sr_items_insert();

CREATE TRIGGER sr_items_update_trigger
  INSTEAD OF UPDATE ON public.sr_items
  FOR EACH ROW EXECUTE FUNCTION public.sr_items_update();

CREATE TRIGGER sr_items_delete_trigger
  INSTEAD OF DELETE ON public.sr_items
  FOR EACH ROW EXECUTE FUNCTION public.sr_items_delete();

-- ── 3. Migrate existing review_schedule → sr_items ─────────

INSERT INTO charlotte.sr_items (
  user_id, source_type, source_id, card_type,
  user_level, topic_title,
  next_review_at, created_at,
  ease_factor, interval_days, repetitions
)
SELECT
  user_id,
  'learn_topic',
  user_level || ':' || module_index || ':' || topic_index,
  'gap_fill',
  user_level,
  topic_title,
  (review_due::date + interval '0 days')::timestamptz,
  completed_at,
  -- map old fixed intervals to SM-2 starting values
  CASE review_interval
    WHEN 3  THEN 2.5
    WHEN 7  THEN 2.5
    WHEN 14 THEN 2.6
    WHEN 30 THEN 2.7
  END,
  review_interval,
  CASE review_interval
    WHEN 3  THEN 1
    WHEN 7  THEN 2
    WHEN 14 THEN 3
    WHEN 30 THEN 4
  END
FROM charlotte.review_schedule
WHERE review_done = false
ON CONFLICT DO NOTHING;
