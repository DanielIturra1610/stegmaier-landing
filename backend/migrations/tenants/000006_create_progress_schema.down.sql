-- Drop indexes first
-- Progress snapshots indexes
DROP INDEX IF EXISTS idx_progress_snapshots_milestone;
DROP INDEX IF EXISTS idx_progress_snapshots_user_course_date;
DROP INDEX IF EXISTS idx_progress_snapshots_snapshot_date;
DROP INDEX IF EXISTS idx_progress_snapshots_milestone_type;
DROP INDEX IF EXISTS idx_progress_snapshots_tenant_user_course;
DROP INDEX IF EXISTS idx_progress_snapshots_user_course;
DROP INDEX IF EXISTS idx_progress_snapshots_enrollment_id;
DROP INDEX IF EXISTS idx_progress_snapshots_course_id;
DROP INDEX IF EXISTS idx_progress_snapshots_user_id;
DROP INDEX IF EXISTS idx_progress_snapshots_tenant_id;

-- Course progress indexes
DROP INDEX IF EXISTS idx_course_progress_updated_at;
DROP INDEX IF EXISTS idx_course_progress_percentage;
DROP INDEX IF EXISTS idx_course_progress_last_accessed_at;
DROP INDEX IF EXISTS idx_course_progress_completed_at;
DROP INDEX IF EXISTS idx_course_progress_started_at;
DROP INDEX IF EXISTS idx_course_progress_tenant_course;
DROP INDEX IF EXISTS idx_course_progress_tenant_user;
DROP INDEX IF EXISTS idx_course_progress_user_course;
DROP INDEX IF EXISTS idx_course_progress_status;
DROP INDEX IF EXISTS idx_course_progress_enrollment_id;
DROP INDEX IF EXISTS idx_course_progress_course_id;
DROP INDEX IF EXISTS idx_course_progress_user_id;
DROP INDEX IF EXISTS idx_course_progress_tenant_id;

-- Drop tables
DROP TABLE IF EXISTS progress_snapshots;
DROP TABLE IF EXISTS course_progress;
