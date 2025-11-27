-- Revert Lessons Schema

-- Drop indexes for lesson_completions
DROP INDEX IF EXISTS idx_lesson_completions_tenant;
DROP INDEX IF EXISTS idx_lesson_completions_lesson;
DROP INDEX IF EXISTS idx_lesson_completions_user;
DROP INDEX IF EXISTS idx_lesson_completions_user_completed;
DROP INDEX IF EXISTS idx_lesson_completions_lesson_user;

-- Drop indexes for lessons
DROP INDEX IF EXISTS idx_lessons_tenant;
DROP INDEX IF EXISTS idx_lessons_course;
DROP INDEX IF EXISTS idx_lessons_course_order;
DROP INDEX IF EXISTS idx_lessons_published;
DROP INDEX IF EXISTS idx_lessons_free;
DROP INDEX IF EXISTS idx_lessons_quiz;
DROP INDEX IF EXISTS idx_lessons_deleted;
DROP INDEX IF EXISTS idx_lessons_content_type;

-- Drop triggers
DROP TRIGGER IF EXISTS update_lesson_completions_updated_at ON lesson_completions;
DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;

-- Drop tables (CASCADE will remove foreign key constraints)
DROP TABLE IF EXISTS lesson_completions CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
