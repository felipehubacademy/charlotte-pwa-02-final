-- ─────────────────────────────────────────────────────────────────────────────
-- 053_purge_pwa_achievements.sql
--
-- charlotte.user_achievements contains 272 rows from the PWA era.
-- The RN system always inserts with a proper achievement_id FK pointing
-- to charlotte.achievements. PWA rows have achievement_id = NULL
-- (old trigger formats: 'milestone', 'dynamic', 'curious-mind', etc.)
--
-- Rule: achievement_id IS NULL → PWA legacy → delete.
--       achievement_id IS NOT NULL → RN system → keep.
--
-- RN users start fresh. PWA history does not carry over.
-- ─────────────────────────────────────────────────────────────────────────────

DELETE FROM charlotte.user_achievements WHERE achievement_id IS NULL;
