-- Rollback Tenant Database Schema

-- Drop triggers
DROP TRIGGER IF EXISTS update_assignments_updated_at ON assignments;
DROP TRIGGER IF EXISTS update_quizzes_updated_at ON quizzes;
DROP TRIGGER IF EXISTS update_lesson_progress_updated_at ON lesson_progress;
DROP TRIGGER IF EXISTS update_enrollments_updated_at ON enrollments;
DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;
DROP TRIGGER IF EXISTS update_modules_updated_at ON modules;
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_certificates_course;
DROP INDEX IF EXISTS idx_certificates_user;
DROP INDEX IF EXISTS idx_assignment_submissions_user;
DROP INDEX IF EXISTS idx_assignment_submissions_assignment;
DROP INDEX IF EXISTS idx_assignments_lesson;
DROP INDEX IF EXISTS idx_quiz_attempts_quiz;
DROP INDEX IF EXISTS idx_quiz_attempts_user;
DROP INDEX IF EXISTS idx_quiz_answers_question;
DROP INDEX IF EXISTS idx_quiz_questions_quiz;
DROP INDEX IF EXISTS idx_quizzes_lesson;
DROP INDEX IF EXISTS idx_lesson_progress_enrollment;
DROP INDEX IF EXISTS idx_lesson_progress_lesson;
DROP INDEX IF EXISTS idx_lesson_progress_user;
DROP INDEX IF EXISTS idx_enrollments_status;
DROP INDEX IF EXISTS idx_enrollments_course;
DROP INDEX IF EXISTS idx_enrollments_user;
DROP INDEX IF EXISTS idx_lessons_order;
DROP INDEX IF EXISTS idx_lessons_course;
DROP INDEX IF EXISTS idx_lessons_module;
DROP INDEX IF EXISTS idx_modules_order;
DROP INDEX IF EXISTS idx_modules_course;
DROP INDEX IF EXISTS idx_courses_status;
DROP INDEX IF EXISTS idx_courses_instructor;

-- Drop tables
DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS assignment_submissions;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS quiz_attempts;
DROP TABLE IF EXISTS quiz_answers;
DROP TABLE IF EXISTS quiz_questions;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS lesson_progress;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS modules;
DROP TABLE IF EXISTS courses;

-- Drop extension
DROP EXTENSION IF EXISTS "uuid-ossp";
