-- Migration: vocabulary_master — shared AI-generated content, cached globally
-- First user to add a term pays the GPT cost; all others get instant response.
-- Mirrors the same pattern as tts_cache / tts-audio.
--
-- user_vocabulary keeps its own copy of definition/example (user-editable).
-- vocabulary_master is the source of truth for AI-generated content.

CREATE TABLE IF NOT EXISTS public.vocabulary_master (
  term                   TEXT        PRIMARY KEY,  -- lowercase, trimmed
  definition_en          TEXT        NOT NULL,     -- English definition (Inter/Advanced)
  definition_pt          TEXT        NOT NULL,     -- Portuguese definition (Novice)
  example                TEXT        NOT NULL,     -- English example sentence
  example_translation_pt TEXT        NOT NULL DEFAULT '',  -- PT-BR translation
  phonetic               TEXT        NOT NULL DEFAULT '',  -- IPA
  category               TEXT        NOT NULL DEFAULT 'word'
                                     CHECK (category IN ('word','idiom','phrasal_verb','grammar')),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No RLS needed — reads are public, writes only via service-role (server API)
ALTER TABLE public.vocabulary_master ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vocabulary_master: anyone can read"
  ON public.vocabulary_master FOR SELECT
  USING (true);
