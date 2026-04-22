-- Migration: charlotte.openai_usage — log every OpenAI API call for cost tracking
-- Tokens are logged in raw counts; cost is computed at query time using a
-- model pricing table kept in the app code (lib/openai-usage.ts PRICING),
-- so we can adjust prices retroactively without migrating data.

CREATE TABLE IF NOT EXISTS charlotte.openai_usage (
  id                BIGSERIAL PRIMARY KEY,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- identity
  user_id           TEXT,                        -- charlotte.users.id (nullable for anonymous)
  endpoint          TEXT NOT NULL,               -- '/api/assistant', '/api/transcribe', etc
  model             TEXT NOT NULL,               -- 'gpt-4o-mini', 'whisper-1', 'gpt-4.1-nano', 'gpt-realtime'

  -- usage
  prompt_tokens     INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens      INTEGER NOT NULL DEFAULT 0,

  -- whisper is billed per second of audio, realtime is billed per minute of audio
  audio_seconds     NUMERIC(10, 3),              -- whisper: audio duration in seconds
  audio_input_min   NUMERIC(10, 4),              -- realtime: input audio minutes
  audio_output_min  NUMERIC(10, 4),              -- realtime: output audio minutes

  -- cached cost snapshot (USD) — computed server-side at insert time for fast aggregates
  cost_usd          NUMERIC(12, 6) NOT NULL DEFAULT 0,

  -- context metadata (for debugging, no PII)
  meta              JSONB                        -- { request_id, latency_ms, error, ... }
);

-- Indexes for typical queries in /admin/metrics
CREATE INDEX IF NOT EXISTS openai_usage_created_at_idx ON charlotte.openai_usage (created_at DESC);
CREATE INDEX IF NOT EXISTS openai_usage_user_id_idx    ON charlotte.openai_usage (user_id);
CREATE INDEX IF NOT EXISTS openai_usage_endpoint_idx   ON charlotte.openai_usage (endpoint);
CREATE INDEX IF NOT EXISTS openai_usage_model_idx      ON charlotte.openai_usage (model);

-- Expose to PostgREST via a public view (service role bypasses RLS anyway,
-- but the view keeps the REST surface tidy).
CREATE OR REPLACE VIEW public.openai_usage AS
  SELECT id, created_at, user_id, endpoint, model,
         prompt_tokens, completion_tokens, total_tokens,
         audio_seconds, audio_input_min, audio_output_min,
         cost_usd, meta
  FROM charlotte.openai_usage;

-- No RLS on the view — only service role reads it from /api/admin/metrics.
-- Writes happen exclusively server-side via the service role client.
