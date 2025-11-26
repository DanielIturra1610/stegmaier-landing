-- Migration 008: Extend assignments schema and create/extend related tables
-- Note: Some tables were already created in migration 001 with basic structure
-- This migration extends them with additional fields

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- Create rubrics table (new table)
-- ========================================
CREATE TABLE IF NOT EXISTS rubrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    criteria JSONB NOT NULL DEFAULT '[]',
    total_points DECIMAL(6,2) NOT NULL DEFAULT 0.0,
    is_template BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Extend assignments table with additional columns
-- ========================================
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS instructions TEXT NOT NULL DEFAULT '';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(50) NOT NULL DEFAULT 'file_upload';
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS module_id UUID;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS max_file_size BIGINT NOT NULL DEFAULT 10485760;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS allowed_file_types TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS max_files INTEGER NOT NULL DEFAULT 5;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS allow_multiple_submissions BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS available_from TIMESTAMP WITH TIME ZONE;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS late_penalty_per_day DECIMAL(5,2) NOT NULL DEFAULT 10.0;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS accept_late_submissions BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS rubric_id UUID;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS max_points DECIMAL(6,2) NOT NULL DEFAULT 100.0;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS passing_score DECIMAL(6,2) NOT NULL DEFAULT 60.0;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS peer_review_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS peer_reviews_required INTEGER NOT NULL DEFAULT 0;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS anonymous_grading BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS plagiarism_check_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS estimated_duration INTEGER NOT NULL DEFAULT 0;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS total_submissions INTEGER NOT NULL DEFAULT 0;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS graded_submissions INTEGER NOT NULL DEFAULT 0;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS average_grade DECIMAL(5,2) NOT NULL DEFAULT 0.0;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS created_by UUID;

-- ========================================
-- Extend assignment_submissions table with additional columns
-- ========================================
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS student_id UUID;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS text_content TEXT NOT NULL DEFAULT '';
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS files TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS submission_number INTEGER NOT NULL DEFAULT 1;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS is_final BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS grade_status VARCHAR(50) NOT NULL DEFAULT 'not_graded';
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS grades TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS total_points_earned DECIMAL(6,2) NOT NULL DEFAULT 0.0;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS total_points_possible DECIMAL(6,2) NOT NULL DEFAULT 0.0;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS percentage_grade DECIMAL(5,2) NOT NULL DEFAULT 0.0;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS letter_grade VARCHAR(5);
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS is_passing BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS instructor_feedback TEXT NOT NULL DEFAULT '';
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS is_late BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS days_late INTEGER NOT NULL DEFAULT 0;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS penalty_applied DECIMAL(5,2) NOT NULL DEFAULT 0.0;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS plagiarism_score DECIMAL(5,2);
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS plagiarism_checked BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS returned_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Copy user_id to student_id if student_id is null
UPDATE assignment_submissions SET student_id = user_id WHERE student_id IS NULL AND user_id IS NOT NULL;

-- ========================================
-- Create assignment_files table (new table)
-- ========================================
CREATE TABLE IF NOT EXISTS assignment_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL DEFAULT 'other',
    file_size BIGINT NOT NULL DEFAULT 0,
    mime_type VARCHAR(255) NOT NULL DEFAULT 'application/octet-stream',
    file_path VARCHAR(1000) NOT NULL,
    file_url VARCHAR(1000),
    is_template BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Create submission_grades table (new table)
-- ========================================
CREATE TABLE IF NOT EXISTS submission_grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    submission_id UUID NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    criterion_id UUID NOT NULL,
    grader_id UUID NOT NULL,
    points_earned DECIMAL(6,2) NOT NULL DEFAULT 0,
    points_possible DECIMAL(6,2) NOT NULL DEFAULT 0,
    feedback TEXT NOT NULL DEFAULT '',
    graded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Create submission_comments table (new table)
-- ========================================
CREATE TABLE IF NOT EXISTS submission_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    submission_id UUID NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    author_id UUID NOT NULL,
    author_role VARCHAR(50) NOT NULL DEFAULT 'instructor',
    content TEXT NOT NULL,
    is_private BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Create peer_reviews table (new table)
-- ========================================
CREATE TABLE IF NOT EXISTS peer_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL,
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    feedback TEXT NOT NULL DEFAULT '',
    scores JSONB DEFAULT '{}',
    due_date TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Create Indexes for Performance
-- ========================================

-- Rubrics indexes
CREATE INDEX IF NOT EXISTS idx_rubrics_tenant_id ON rubrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rubrics_created_by ON rubrics(created_by);
CREATE INDEX IF NOT EXISTS idx_rubrics_is_template ON rubrics(is_template);
CREATE INDEX IF NOT EXISTS idx_rubrics_created_at ON rubrics(created_at DESC);

-- Assignments indexes (for new columns)
CREATE INDEX IF NOT EXISTS idx_assignments_module_id ON assignments(module_id);
CREATE INDEX IF NOT EXISTS idx_assignments_rubric_id ON assignments(rubric_id);
CREATE INDEX IF NOT EXISTS idx_assignments_type ON assignments(assignment_type);
CREATE INDEX IF NOT EXISTS idx_assignments_is_published ON assignments(is_published);
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON assignments(created_by);

-- Assignment submissions indexes (for new columns)
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON assignment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_grade_status ON assignment_submissions(grade_status);
CREATE INDEX IF NOT EXISTS idx_submissions_is_late ON assignment_submissions(is_late);
CREATE INDEX IF NOT EXISTS idx_submissions_is_passing ON assignment_submissions(is_passing);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON assignment_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_graded_at ON assignment_submissions(graded_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON assignment_submissions(created_at DESC);

-- Assignment files indexes
CREATE INDEX IF NOT EXISTS idx_files_tenant_id ON assignment_files(tenant_id);
CREATE INDEX IF NOT EXISTS idx_files_assignment_id ON assignment_files(assignment_id);
CREATE INDEX IF NOT EXISTS idx_files_submission_id ON assignment_files(submission_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON assignment_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_file_type ON assignment_files(file_type);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_at ON assignment_files(uploaded_at DESC);

-- Submission grades indexes
CREATE INDEX IF NOT EXISTS idx_grades_tenant_id ON submission_grades(tenant_id);
CREATE INDEX IF NOT EXISTS idx_grades_submission_id ON submission_grades(submission_id);
CREATE INDEX IF NOT EXISTS idx_grades_criterion_id ON submission_grades(criterion_id);
CREATE INDEX IF NOT EXISTS idx_grades_grader_id ON submission_grades(grader_id);
CREATE INDEX IF NOT EXISTS idx_grades_graded_at ON submission_grades(graded_at DESC);

-- Submission comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_tenant_id ON submission_comments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_comments_submission_id ON submission_comments(submission_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON submission_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_role ON submission_comments(author_role);
CREATE INDEX IF NOT EXISTS idx_comments_is_private ON submission_comments(is_private);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON submission_comments(created_at DESC);

-- Peer reviews indexes
CREATE INDEX IF NOT EXISTS idx_peer_reviews_tenant_id ON peer_reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_peer_reviews_assignment_id ON peer_reviews(assignment_id);
CREATE INDEX IF NOT EXISTS idx_peer_reviews_submission_id ON peer_reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_peer_reviews_reviewer_id ON peer_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_peer_reviews_status ON peer_reviews(status);
CREATE INDEX IF NOT EXISTS idx_peer_reviews_due_date ON peer_reviews(due_date);
CREATE INDEX IF NOT EXISTS idx_peer_reviews_submitted_at ON peer_reviews(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_peer_reviews_created_at ON peer_reviews(created_at DESC);
