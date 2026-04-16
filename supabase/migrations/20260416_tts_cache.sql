-- Migration: TTS cache table + Supabase Storage bucket for vocabulary audio
-- Terms are cached globally (shared across all users).
-- First user to add a term pays the ElevenLabs cost; all others hit CDN.

-- ── 1. tts_cache table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tts_cache (
  term       TEXT        PRIMARY KEY,  -- lowercase, trimmed
  audio_url  TEXT        NOT NULL,     -- Supabase Storage public URL
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- No RLS needed — read-only for all, writes only via service-role (server-side API)
ALTER TABLE public.tts_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tts_cache: anyone can read"
  ON public.tts_cache FOR SELECT
  USING (true);

-- ── 2. Supabase Storage bucket ───────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tts-audio',
  'tts-audio',
  true,                    -- public bucket — URLs accessible without auth
  524288,                  -- 512 KB max per file (MP3s are ~30-80 KB)
  ARRAY['audio/mpeg', 'audio/mp3']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read files (public bucket)
CREATE POLICY "tts-audio: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tts-audio');

-- Only service role can upload (enforced at API level)
CREATE POLICY "tts-audio: service role insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'tts-audio');
