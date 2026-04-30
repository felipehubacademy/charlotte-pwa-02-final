-- Move public.users to lms schema.
-- FK constraints on lms.* tables reference public.users by OID — they follow
-- the table automatically when the schema changes, no DROP/RECREATE needed.
-- The lms_classes_with_company view uses an unqualified JOIN users u which
-- resolved via search_path; we recreate it with an explicit lms.users reference.

-- 1. Move table
ALTER TABLE public.users SET SCHEMA lms;

-- 2. Recreate lms_classes_with_company with explicit schema reference
CREATE OR REPLACE VIEW lms.lms_classes_with_company AS
SELECT
  c.id,
  c.code,
  c.name,
  c.description,
  c.primary_teacher_id,
  c.secondary_teacher_id,
  c.azure_group_name,
  c.azure_group_id,
  c.sync_status,
  c.semester,
  c.start_date,
  c.end_date,
  c.max_students,
  c.is_active,
  c.apps,
  c.created_at,
  c.updated_at,
  c.created_by,
  c.level,
  c.language,
  c.location,
  c.schedule_days,
  c.schedule_time,
  c.schedule_duration,
  c.timezone,
  c.teams_team_id,
  c.teams_channel_id,
  c.teams_meeting_link,
  c.teams_calendar_id,
  c.has_live_classes,
  c.has_recordings,
  c.has_exclusive_content,
  c.is_enrollment_open,
  c.status,
  c.notes,
  c.tags,
  c.company_id,
  c.deactivated_at,
  c.deactivated_by,
  comp.name  AS company_name,
  u.name     AS teacher_name,
  u.email    AS teacher_email
FROM lms.lms_classes c
LEFT JOIN lms.companies comp ON c.company_id = comp.id
LEFT JOIN lms.users u ON c.primary_teacher_id = u.id;
