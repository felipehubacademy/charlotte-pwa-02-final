-- ─────────────────────────────────────────────────────────────────────────────
-- 026_rn_tables.sql
-- React Native exclusive tables — completely separate from PWA data.
-- PWA continues using charlotte.user_practices / charlotte.user_progress as-is.
-- RN users start fresh (zero XP).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. rn_user_practices ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rn_user_practices (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_type TEXT        NOT NULL,   -- 'text_message' | 'audio_message' | 'learn_exercise'
  xp_earned     INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rn_user_practices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own rn_practices"
  ON public.rn_user_practices
  FOR ALL USING (auth.uid() = user_id);

-- ── 2. rn_user_progress ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rn_user_progress (
  user_id      UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp     INTEGER     NOT NULL DEFAULT 0,
  streak_days  INTEGER     NOT NULL DEFAULT 0,
  last_practice_date DATE,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rn_user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own rn_progress"
  ON public.rn_user_progress
  FOR ALL USING (auth.uid() = user_id);

-- ── 3. rn_leaderboard_cache ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rn_leaderboard_cache (
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_level   TEXT        NOT NULL DEFAULT 'Novice',
  display_name TEXT        NOT NULL DEFAULT 'Anonymous',
  total_xp     INTEGER     NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id)
);

ALTER TABLE public.rn_leaderboard_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rn_leaderboard"
  ON public.rn_leaderboard_cache
  FOR SELECT USING (true);

CREATE POLICY "Users manage own rn_leaderboard entry"
  ON public.rn_leaderboard_cache
  FOR ALL USING (auth.uid() = user_id);

-- ── 4. Trigger: INSERT on rn_user_practices → update progress + leaderboard ─

CREATE OR REPLACE FUNCTION public.rn_on_practice_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today          DATE := CURRENT_DATE;
  v_last_date      DATE;
  v_new_streak     INTEGER;
  v_user_level     TEXT;
  v_display_name   TEXT;
BEGIN
  -- ── Upsert rn_user_progress ──────────────────────────────────────────────
  SELECT last_practice_date, streak_days
    INTO v_last_date, v_new_streak
    FROM public.rn_user_progress
   WHERE user_id = NEW.user_id;

  IF v_last_date IS NULL THEN
    -- First ever practice
    v_new_streak := 1;
  ELSIF v_last_date = v_today THEN
    -- Same day — keep streak
    SELECT streak_days INTO v_new_streak
      FROM public.rn_user_progress WHERE user_id = NEW.user_id;
  ELSIF v_last_date = v_today - INTERVAL '1 day' THEN
    -- Consecutive day — extend streak
    v_new_streak := COALESCE(v_new_streak, 0) + 1;
  ELSE
    -- Streak broken
    v_new_streak := 1;
  END IF;

  INSERT INTO public.rn_user_progress (user_id, total_xp, streak_days, last_practice_date, updated_at)
    VALUES (NEW.user_id, NEW.xp_earned, v_new_streak, v_today, now())
  ON CONFLICT (user_id) DO UPDATE
    SET total_xp            = rn_user_progress.total_xp + EXCLUDED.total_xp,
        streak_days         = v_new_streak,
        last_practice_date  = v_today,
        updated_at          = now();

  -- ── Upsert rn_leaderboard_cache ──────────────────────────────────────────
  -- Get user_level and name from public.users
  SELECT COALESCE(u.user_level, 'Novice'),
         COALESCE(
           CASE
             WHEN u.name IS NOT NULL AND u.name <> '' THEN
               -- Format as "First L."
               CASE
                 WHEN position(' ' IN trim(u.name)) > 0 THEN
                   split_part(trim(u.name), ' ', 1) || ' ' ||
                   upper(left(trim(split_part(trim(u.name), ' ', 2)), 1)) || '.'
                 ELSE trim(u.name)
               END
             ELSE split_part(u.email, '@', 1)
           END,
           'Anonymous'
         )
    INTO v_user_level, v_display_name
    FROM public.users u
   WHERE u.id = NEW.user_id;

  INSERT INTO public.rn_leaderboard_cache (user_id, user_level, display_name, total_xp, updated_at)
    VALUES (NEW.user_id, COALESCE(v_user_level, 'Novice'), COALESCE(v_display_name, 'Anonymous'),
            NEW.xp_earned, now())
  ON CONFLICT (user_id) DO UPDATE
    SET total_xp     = rn_leaderboard_cache.total_xp + EXCLUDED.total_xp,
        user_level   = COALESCE(v_user_level, rn_leaderboard_cache.user_level),
        display_name = COALESCE(v_display_name, rn_leaderboard_cache.display_name),
        updated_at   = now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_rn_practice_insert
  AFTER INSERT ON public.rn_user_practices
  FOR EACH ROW EXECUTE FUNCTION public.rn_on_practice_insert();

-- ── 5. Grants ────────────────────────────────────────────────────────────────
GRANT ALL ON public.rn_user_practices    TO authenticated;
GRANT ALL ON public.rn_user_progress     TO authenticated;
GRANT ALL ON public.rn_leaderboard_cache TO authenticated;
