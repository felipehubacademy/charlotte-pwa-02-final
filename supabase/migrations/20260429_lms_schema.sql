-- Move all LMS tables from public to a dedicated lms schema.
-- public will retain only compatibility views going forward.
--
-- FK constraints between lms tables survive automatically (PG tracks by OID).
-- FK constraints from lms tables to public.users remain valid (cross-schema FK).

BEGIN;

-- 1. Create schema and grant access to Supabase roles
CREATE SCHEMA IF NOT EXISTS lms;

GRANT USAGE ON SCHEMA lms TO anon, authenticated, service_role;

-- 2. Drop views that reference the tables being moved
--    (views resolve by name, not OID, so they must be recreated)
DROP VIEW IF EXISTS public.lms_classes_with_company;
DROP VIEW IF EXISTS public.lms_activity_performance_view;
DROP VIEW IF EXISTS public.lms_engagement_metrics_view;
DROP VIEW IF EXISTS public.lms_user_stats_view;

-- 3. Move tables to lms schema
--    Order: parent tables first so FK references stay coherent during move
ALTER TABLE public.companies              SET SCHEMA lms;
ALTER TABLE public.teams_events           SET SCHEMA lms;
ALTER TABLE public.lms_classes            SET SCHEMA lms;
ALTER TABLE public.lms_units              SET SCHEMA lms;
ALTER TABLE public.lms_unit_activities    SET SCHEMA lms;
ALTER TABLE public.lms_live_classes       SET SCHEMA lms;
ALTER TABLE public.lms_class_enrollments  SET SCHEMA lms;
ALTER TABLE public.lms_class_attendance   SET SCHEMA lms;
ALTER TABLE public.lms_class_exclusive_content SET SCHEMA lms;
ALTER TABLE public.lms_class_content_access    SET SCHEMA lms;
ALTER TABLE public.lms_activity_results   SET SCHEMA lms;
ALTER TABLE public.lms_user_progress      SET SCHEMA lms;
ALTER TABLE public.lms_azure_class_groups SET SCHEMA lms;
ALTER TABLE public.lms_debug_logs         SET SCHEMA lms;

-- 4. Grant table-level permissions to Supabase roles
GRANT ALL ON ALL TABLES    IN SCHEMA lms TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA lms TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES    IN SCHEMA lms TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA lms TO authenticated;

-- 5. Recreate views inside lms schema (updated refs: lms.* where applicable)

CREATE VIEW lms.lms_activity_performance_view AS
SELECT
    r.activity_type,
    count(*)                                                      AS total_attempts,
    count(DISTINCT r.user_id)                                     AS unique_users,
    COALESCE(avg(r.score), 0::numeric)                            AS avg_score,
    COALESCE(avg(r.time_spent), 0::numeric)                       AS avg_time_spent,
    count(CASE WHEN r.score >= 80 THEN 1 ELSE NULL::integer END)  AS high_scores,
    count(CASE WHEN r.score  < 60 THEN 1 ELSE NULL::integer END)  AS low_scores,
    date_trunc('day', r.completed_at)                             AS activity_date
FROM lms.lms_activity_results r
GROUP BY r.activity_type, date_trunc('day', r.completed_at)
ORDER BY date_trunc('day', r.completed_at) DESC, count(*) DESC;

CREATE VIEW lms.lms_engagement_metrics_view AS
SELECT
    date_trunc('day', ar.completed_at)            AS date,
    count(DISTINCT ar.user_id)                    AS active_users,
    count(ar.id)                                  AS total_activities,
    COALESCE(avg(ar.score), 0::numeric)           AS avg_score,
    COALESCE(avg(ar.time_spent), 0::numeric)      AS avg_time_spent,
    count(DISTINCT ar.activity_type)              AS activity_types_used
FROM lms.lms_activity_results ar
GROUP BY date_trunc('day', ar.completed_at)
ORDER BY date_trunc('day', ar.completed_at) DESC;

CREATE VIEW lms.lms_classes_with_company AS
SELECT
    c.id, c.code, c.name, c.description,
    c.primary_teacher_id, c.secondary_teacher_id,
    c.azure_group_name, c.azure_group_id, c.sync_status,
    c.semester, c.start_date, c.end_date, c.max_students,
    c.is_active, c.apps, c.created_at, c.updated_at, c.created_by,
    c.level, c.language, c.location,
    c.schedule_days, c.schedule_time, c.schedule_duration, c.timezone,
    c.teams_team_id, c.teams_channel_id, c.teams_meeting_link, c.teams_calendar_id,
    c.has_live_classes, c.has_recordings, c.has_exclusive_content, c.is_enrollment_open,
    c.status, c.notes, c.tags, c.company_id, c.deactivated_at, c.deactivated_by,
    comp.name  AS company_name,
    u.name     AS teacher_name,
    u.email    AS teacher_email
FROM lms.lms_classes c
LEFT JOIN lms.companies      comp ON c.company_id        = comp.id
LEFT JOIN public.users       u    ON c.primary_teacher_id = u.id;

CREATE VIEW lms.lms_user_stats_view AS
SELECT
    u.id, u.name, u.email, u.lms_role, u.lms_level, u.is_active, u.created_at,
    count(ar.id)                                                              AS total_activities,
    COALESCE(avg(ar.score), 0::numeric)                                       AS avg_score,
    COALESCE(sum(ar.score), 0::bigint)                                        AS total_xp,
    count(up.id)                                                              AS units_started,
    count(CASE WHEN up.completion_percentage = 100 THEN 1 ELSE NULL::integer END) AS units_completed,
    COALESCE(avg(up.completion_percentage), 0::numeric)                       AS avg_completion_rate,
    max(ar.completed_at)                                                      AS last_activity
FROM public.users u
LEFT JOIN lms.lms_activity_results ar ON u.id = ar.user_id
LEFT JOIN lms.lms_user_progress    up ON u.id = up.user_id
GROUP BY u.id, u.name, u.email, u.lms_role, u.lms_level, u.is_active, u.created_at;

GRANT SELECT ON ALL TABLES IN SCHEMA lms TO authenticated;

COMMIT;
