-- Drop all indexes first
-- Peer reviews indexes
DROP INDEX IF EXISTS idx_peer_reviews_created_at;
DROP INDEX IF EXISTS idx_peer_reviews_tenant_reviewer;
DROP INDEX IF EXISTS idx_peer_reviews_submitted_at;
DROP INDEX IF EXISTS idx_peer_reviews_due_date;
DROP INDEX IF EXISTS idx_peer_reviews_status;
DROP INDEX IF EXISTS idx_peer_reviews_reviewer_id;
DROP INDEX IF EXISTS idx_peer_reviews_submission_id;
DROP INDEX IF EXISTS idx_peer_reviews_assignment_id;
DROP INDEX IF EXISTS idx_peer_reviews_tenant_id;

-- Submission comments indexes
DROP INDEX IF EXISTS idx_comments_created_at;
DROP INDEX IF EXISTS idx_comments_is_private;
DROP INDEX IF EXISTS idx_comments_author_role;
DROP INDEX IF EXISTS idx_comments_author_id;
DROP INDEX IF EXISTS idx_comments_submission_id;
DROP INDEX IF EXISTS idx_comments_tenant_id;

-- Submission grades indexes
DROP INDEX IF EXISTS idx_grades_graded_at;
DROP INDEX IF EXISTS idx_grades_grader_id;
DROP INDEX IF EXISTS idx_grades_criterion_id;
DROP INDEX IF EXISTS idx_grades_submission_id;
DROP INDEX IF EXISTS idx_grades_tenant_id;

-- Rubrics indexes
DROP INDEX IF EXISTS idx_rubrics_updated_at;
DROP INDEX IF EXISTS idx_rubrics_created_at;
DROP INDEX IF EXISTS idx_rubrics_tenant_template;
DROP INDEX IF EXISTS idx_rubrics_is_template;
DROP INDEX IF EXISTS idx_rubrics_created_by;
DROP INDEX IF EXISTS idx_rubrics_tenant_id;

-- Assignment files indexes
DROP INDEX IF EXISTS idx_files_uploaded_at;
DROP INDEX IF EXISTS idx_files_is_template;
DROP INDEX IF EXISTS idx_files_file_type;
DROP INDEX IF EXISTS idx_files_uploaded_by;
DROP INDEX IF EXISTS idx_files_submission_id;
DROP INDEX IF EXISTS idx_files_assignment_id;
DROP INDEX IF EXISTS idx_files_tenant_id;

-- Assignment submissions indexes
DROP INDEX IF EXISTS idx_submissions_updated_at;
DROP INDEX IF EXISTS idx_submissions_created_at;
DROP INDEX IF EXISTS idx_submissions_percentage_grade;
DROP INDEX IF EXISTS idx_submissions_graded_at;
DROP INDEX IF EXISTS idx_submissions_submitted_at;
DROP INDEX IF EXISTS idx_submissions_student_assignment;
DROP INDEX IF EXISTS idx_submissions_tenant_student;
DROP INDEX IF EXISTS idx_submissions_tenant_assignment;
DROP INDEX IF EXISTS idx_submissions_is_passing;
DROP INDEX IF EXISTS idx_submissions_is_late;
DROP INDEX IF EXISTS idx_submissions_grade_status;
DROP INDEX IF EXISTS idx_submissions_status;
DROP INDEX IF EXISTS idx_submissions_student_id;
DROP INDEX IF EXISTS idx_submissions_assignment_id;
DROP INDEX IF EXISTS idx_submissions_tenant_id;

-- Assignments indexes
DROP INDEX IF EXISTS idx_assignments_updated_at;
DROP INDEX IF EXISTS idx_assignments_created_at;
DROP INDEX IF EXISTS idx_assignments_tenant_published;
DROP INDEX IF EXISTS idx_assignments_tenant_course;
DROP INDEX IF EXISTS idx_assignments_created_by;
DROP INDEX IF EXISTS idx_assignments_due_date;
DROP INDEX IF EXISTS idx_assignments_is_published;
DROP INDEX IF EXISTS idx_assignments_type;
DROP INDEX IF EXISTS idx_assignments_rubric_id;
DROP INDEX IF EXISTS idx_assignments_lesson_id;
DROP INDEX IF EXISTS idx_assignments_module_id;
DROP INDEX IF EXISTS idx_assignments_course_id;
DROP INDEX IF EXISTS idx_assignments_tenant_id;

-- Drop tables in reverse order (respecting foreign key dependencies)
DROP TABLE IF EXISTS peer_reviews CASCADE;
DROP TABLE IF EXISTS submission_comments CASCADE;
DROP TABLE IF EXISTS submission_grades CASCADE;
DROP TABLE IF EXISTS assignment_files CASCADE;
DROP TABLE IF EXISTS assignment_submissions CASCADE;

-- Remove foreign key constraint before dropping assignments table
ALTER TABLE IF EXISTS assignments DROP CONSTRAINT IF EXISTS assignments_rubric_fk;

-- Drop remaining tables
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS rubrics CASCADE;
