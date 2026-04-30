-- Move tts_cache from public to charlotte schema.
-- public.tts_cache view keeps the same name so no code changes needed.
-- The view is updatable (simple SELECT *), upsert passes through correctly.

ALTER TABLE public.tts_cache SET SCHEMA charlotte;

CREATE VIEW public.tts_cache AS SELECT * FROM charlotte.tts_cache;
