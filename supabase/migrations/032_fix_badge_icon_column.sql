-- ─────────────────────────────────────────────────────────────────────────────
-- 032_fix_badge_icon_column.sql
--
-- Problem: badge_icon was VARCHAR(10) — silently blocked rn_award_achievements
-- from inserting any achievement with icon name > 10 chars (e.g. 'first_practice' = 13).
-- badge_color was VARCHAR(7) — tight for future values.
--
-- Fix: widen badge_icon to TEXT, badge_color to VARCHAR(20).
-- The public.user_achievements view must be dropped and recreated because
-- Postgres cannot alter a column used by a view directly.
-- ─────────────────────────────────────────────────────────────────────────────

DROP VIEW IF EXISTS public.user_achievements;

ALTER TABLE charlotte.user_achievements
  ALTER COLUMN badge_icon  TYPE text,
  ALTER COLUMN badge_color TYPE varchar(20);

CREATE OR REPLACE VIEW public.user_achievements AS
  SELECT id, user_id, achievement_id, earned_at, achievement_type,
         category, badge_icon, badge_color, xp_bonus, rarity,
         achievement_name, achievement_description, achievement_code
  FROM charlotte.user_achievements;
