-- Drop indexes
-- Enrollment requests indexes
DROP INDEX IF EXISTS idx_enrollment_requests_pending;
DROP INDEX IF EXISTS idx_enrollment_requests_reviewed_by;
DROP INDEX IF EXISTS idx_enrollment_requests_reviewed_at;
DROP INDEX IF EXISTS idx_enrollment_requests_requested_at;
DROP INDEX IF EXISTS idx_enrollment_requests_tenant_course;
DROP INDEX IF EXISTS idx_enrollment_requests_user_course;
DROP INDEX IF EXISTS idx_enrollment_requests_status;
DROP INDEX IF EXISTS idx_enrollment_requests_course_id;
DROP INDEX IF EXISTS idx_enrollment_requests_user_id;
DROP INDEX IF EXISTS idx_enrollment_requests_tenant_id;

-- Enrollments indexes
DROP INDEX IF EXISTS idx_enrollments_progress;
DROP INDEX IF EXISTS idx_enrollments_expires_at;
DROP INDEX IF EXISTS idx_enrollments_completed_at;
DROP INDEX IF EXISTS idx_enrollments_last_accessed_at;
DROP INDEX IF EXISTS idx_enrollments_enrolled_at;
DROP INDEX IF EXISTS idx_enrollments_tenant_course;
DROP INDEX IF EXISTS idx_enrollments_tenant_user;
DROP INDEX IF EXISTS idx_enrollments_user_course;
DROP INDEX IF EXISTS idx_enrollments_status;
DROP INDEX IF EXISTS idx_enrollments_course_id;
DROP INDEX IF EXISTS idx_enrollments_user_id;
DROP INDEX IF EXISTS idx_enrollments_tenant_id;

-- Drop tables
DROP TABLE IF EXISTS enrollment_requests;
DROP TABLE IF EXISTS enrollments;
