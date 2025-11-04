-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT NOT NULL,
    assignment_type VARCHAR(50) NOT NULL CHECK (assignment_type IN (
        'essay', 'file_upload', 'project', 'presentation',
        'research', 'practical', 'portfolio'
    )),

    -- Relations
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    module_id UUID,
    lesson_id UUID,

    -- Submission configuration
    max_file_size BIGINT NOT NULL DEFAULT 10485760, -- 10MB in bytes
    allowed_file_types TEXT[] DEFAULT ARRAY[]::TEXT[],
    max_files INTEGER NOT NULL DEFAULT 5 CHECK (max_files >= 0),
    allow_multiple_submissions BOOLEAN NOT NULL DEFAULT true,

    -- Dates
    available_from TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    late_penalty_per_day DECIMAL(5,2) NOT NULL DEFAULT 10.0 CHECK (late_penalty_per_day >= 0 AND late_penalty_per_day <= 100),
    accept_late_submissions BOOLEAN NOT NULL DEFAULT true,

    -- Evaluation
    rubric_id UUID,
    max_points DECIMAL(6,2) NOT NULL DEFAULT 100.0 CHECK (max_points > 0),
    passing_score DECIMAL(6,2) NOT NULL DEFAULT 60.0 CHECK (passing_score >= 0 AND passing_score <= max_points),

    -- Advanced features
    peer_review_enabled BOOLEAN NOT NULL DEFAULT false,
    peer_reviews_required INTEGER NOT NULL DEFAULT 0 CHECK (peer_reviews_required >= 0),
    anonymous_grading BOOLEAN NOT NULL DEFAULT false,
    plagiarism_check_enabled BOOLEAN NOT NULL DEFAULT false,

    -- State
    is_published BOOLEAN NOT NULL DEFAULT false,
    estimated_duration INTEGER NOT NULL DEFAULT 0 CHECK (estimated_duration >= 0),

    -- Statistics
    total_submissions INTEGER NOT NULL DEFAULT 0 CHECK (total_submissions >= 0),
    graded_submissions INTEGER NOT NULL DEFAULT 0 CHECK (graded_submissions >= 0),
    average_grade DECIMAL(5,2) NOT NULL DEFAULT 0.0 CHECK (average_grade >= 0 AND average_grade <= 100),

    -- Metadata
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT assignments_dates_check CHECK (
        available_from IS NULL OR due_date IS NULL OR available_from < due_date
    ),
    CONSTRAINT assignments_graded_check CHECK (graded_submissions <= total_submissions)
);

-- Create assignment_submissions table
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,

    -- Content
    text_content TEXT NOT NULL DEFAULT '',
    files TEXT[] DEFAULT ARRAY[]::TEXT[], -- UUID strings

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'not_started' CHECK (status IN (
        'not_started', 'in_progress', 'submitted', 'under_review',
        'graded', 'returned', 'late_submission', 'missing'
    )),
    submission_number INTEGER NOT NULL DEFAULT 1 CHECK (submission_number > 0),
    is_final BOOLEAN NOT NULL DEFAULT false,

    -- Grading
    grade_status VARCHAR(50) NOT NULL DEFAULT 'not_graded' CHECK (grade_status IN (
        'not_graded', 'in_progress', 'completed', 'needs_revision'
    )),
    grades TEXT[] DEFAULT ARRAY[]::TEXT[], -- UUID strings of submission_grades
    total_points_earned DECIMAL(6,2) NOT NULL DEFAULT 0.0 CHECK (total_points_earned >= 0),
    total_points_possible DECIMAL(6,2) NOT NULL DEFAULT 0.0 CHECK (total_points_possible >= 0),
    percentage_grade DECIMAL(5,2) NOT NULL DEFAULT 0.0 CHECK (percentage_grade >= 0 AND percentage_grade <= 100),
    letter_grade VARCHAR(5),
    is_passing BOOLEAN NOT NULL DEFAULT false,
    instructor_feedback TEXT NOT NULL DEFAULT '',

    -- Late submission handling
    is_late BOOLEAN NOT NULL DEFAULT false,
    days_late INTEGER NOT NULL DEFAULT 0 CHECK (days_late >= 0),
    penalty_applied DECIMAL(5,2) NOT NULL DEFAULT 0.0 CHECK (penalty_applied >= 0 AND penalty_applied <= 100),

    -- Plagiarism
    plagiarism_score DECIMAL(5,2) CHECK (plagiarism_score >= 0 AND plagiarism_score <= 100),
    plagiarism_checked BOOLEAN NOT NULL DEFAULT false,

    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE,
    graded_at TIMESTAMP WITH TIME ZONE,
    returned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT submission_student_assignment_unique UNIQUE (tenant_id, student_id, assignment_id, submission_number),
    CONSTRAINT submission_points_check CHECK (total_points_earned <= total_points_possible)
);

-- Create assignment_files table
CREATE TABLE IF NOT EXISTS assignment_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES assignment_submissions(id) ON DELETE CASCADE,

    -- File metadata
    filename VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL CHECK (file_type IN (
        'document', 'image', 'video', 'audio', 'presentation',
        'spreadsheet', 'archive', 'code', 'other'
    )),
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    mime_type VARCHAR(255) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_url VARCHAR(1000),

    -- Classification
    is_template BOOLEAN NOT NULL DEFAULT false,
    description TEXT,

    -- Metadata
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT file_belongs_to_assignment_or_submission CHECK (
        (assignment_id IS NOT NULL AND submission_id IS NULL) OR
        (assignment_id IS NULL AND submission_id IS NOT NULL)
    )
);

-- Create rubrics table
CREATE TABLE IF NOT EXISTS rubrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    -- Criteria stored as JSONB for flexibility
    criteria JSONB NOT NULL DEFAULT '[]',
    total_points DECIMAL(6,2) NOT NULL DEFAULT 0.0 CHECK (total_points >= 0),

    -- Template support
    is_template BOOLEAN NOT NULL DEFAULT false,

    -- Metadata
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT rubrics_name_tenant_unique UNIQUE (tenant_id, name)
);

-- Add foreign key from assignments to rubrics (nullable)
ALTER TABLE assignments
    ADD CONSTRAINT assignments_rubric_fk
    FOREIGN KEY (rubric_id)
    REFERENCES rubrics(id)
    ON DELETE SET NULL;

-- Create submission_grades table
CREATE TABLE IF NOT EXISTS submission_grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    submission_id UUID NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    criterion_id UUID NOT NULL, -- References a criterion in rubric
    grader_id UUID NOT NULL,

    -- Score
    points_earned DECIMAL(6,2) NOT NULL CHECK (points_earned >= 0),
    points_possible DECIMAL(6,2) NOT NULL CHECK (points_possible > 0),
    feedback TEXT NOT NULL DEFAULT '',

    -- Metadata
    graded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT grade_points_check CHECK (points_earned <= points_possible)
);

-- Create submission_comments table
CREATE TABLE IF NOT EXISTS submission_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    submission_id UUID NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,

    -- Author
    author_id UUID NOT NULL,
    author_role VARCHAR(50) NOT NULL CHECK (author_role IN ('student', 'instructor', 'peer', 'system')),

    -- Content
    content TEXT NOT NULL,
    is_private BOOLEAN NOT NULL DEFAULT false,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create peer_reviews table
CREATE TABLE IF NOT EXISTS peer_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL,

    -- Configuration
    is_anonymous BOOLEAN NOT NULL DEFAULT false,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),

    -- Review content
    feedback TEXT NOT NULL DEFAULT '',
    scores JSONB DEFAULT '{}', -- Map of criterion_id to score

    -- Dates
    due_date TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT peer_review_unique UNIQUE (tenant_id, submission_id, reviewer_id)
);

-- ========================================
-- Create Indexes for Performance
-- ========================================

-- Assignments indexes
CREATE INDEX idx_assignments_tenant_id ON assignments(tenant_id);
CREATE INDEX idx_assignments_course_id ON assignments(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX idx_assignments_module_id ON assignments(module_id) WHERE module_id IS NOT NULL;
CREATE INDEX idx_assignments_lesson_id ON assignments(lesson_id) WHERE lesson_id IS NOT NULL;
CREATE INDEX idx_assignments_rubric_id ON assignments(rubric_id) WHERE rubric_id IS NOT NULL;
CREATE INDEX idx_assignments_type ON assignments(assignment_type);
CREATE INDEX idx_assignments_is_published ON assignments(is_published);
CREATE INDEX idx_assignments_due_date ON assignments(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_assignments_created_by ON assignments(created_by);
CREATE INDEX idx_assignments_tenant_course ON assignments(tenant_id, course_id) WHERE course_id IS NOT NULL;
CREATE INDEX idx_assignments_tenant_published ON assignments(tenant_id, is_published) WHERE is_published = true;
CREATE INDEX idx_assignments_created_at ON assignments(created_at DESC);
CREATE INDEX idx_assignments_updated_at ON assignments(updated_at DESC);

-- Assignment submissions indexes
CREATE INDEX idx_submissions_tenant_id ON assignment_submissions(tenant_id);
CREATE INDEX idx_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX idx_submissions_student_id ON assignment_submissions(student_id);
CREATE INDEX idx_submissions_status ON assignment_submissions(status);
CREATE INDEX idx_submissions_grade_status ON assignment_submissions(grade_status);
CREATE INDEX idx_submissions_is_late ON assignment_submissions(is_late);
CREATE INDEX idx_submissions_is_passing ON assignment_submissions(is_passing);
CREATE INDEX idx_submissions_tenant_assignment ON assignment_submissions(tenant_id, assignment_id);
CREATE INDEX idx_submissions_tenant_student ON assignment_submissions(tenant_id, student_id);
CREATE INDEX idx_submissions_student_assignment ON assignment_submissions(student_id, assignment_id);
CREATE INDEX idx_submissions_submitted_at ON assignment_submissions(submitted_at DESC) WHERE submitted_at IS NOT NULL;
CREATE INDEX idx_submissions_graded_at ON assignment_submissions(graded_at DESC) WHERE graded_at IS NOT NULL;
CREATE INDEX idx_submissions_percentage_grade ON assignment_submissions(percentage_grade DESC);
CREATE INDEX idx_submissions_created_at ON assignment_submissions(created_at DESC);
CREATE INDEX idx_submissions_updated_at ON assignment_submissions(updated_at DESC);

-- Assignment files indexes
CREATE INDEX idx_files_tenant_id ON assignment_files(tenant_id);
CREATE INDEX idx_files_assignment_id ON assignment_files(assignment_id) WHERE assignment_id IS NOT NULL;
CREATE INDEX idx_files_submission_id ON assignment_files(submission_id) WHERE submission_id IS NOT NULL;
CREATE INDEX idx_files_uploaded_by ON assignment_files(uploaded_by);
CREATE INDEX idx_files_file_type ON assignment_files(file_type);
CREATE INDEX idx_files_is_template ON assignment_files(is_template) WHERE is_template = true;
CREATE INDEX idx_files_uploaded_at ON assignment_files(uploaded_at DESC);

-- Rubrics indexes
CREATE INDEX idx_rubrics_tenant_id ON rubrics(tenant_id);
CREATE INDEX idx_rubrics_created_by ON rubrics(created_by);
CREATE INDEX idx_rubrics_is_template ON rubrics(is_template) WHERE is_template = true;
CREATE INDEX idx_rubrics_tenant_template ON rubrics(tenant_id, is_template) WHERE is_template = true;
CREATE INDEX idx_rubrics_created_at ON rubrics(created_at DESC);
CREATE INDEX idx_rubrics_updated_at ON rubrics(updated_at DESC);

-- Submission grades indexes
CREATE INDEX idx_grades_tenant_id ON submission_grades(tenant_id);
CREATE INDEX idx_grades_submission_id ON submission_grades(submission_id);
CREATE INDEX idx_grades_criterion_id ON submission_grades(criterion_id);
CREATE INDEX idx_grades_grader_id ON submission_grades(grader_id);
CREATE INDEX idx_grades_graded_at ON submission_grades(graded_at DESC);

-- Submission comments indexes
CREATE INDEX idx_comments_tenant_id ON submission_comments(tenant_id);
CREATE INDEX idx_comments_submission_id ON submission_comments(submission_id);
CREATE INDEX idx_comments_author_id ON submission_comments(author_id);
CREATE INDEX idx_comments_author_role ON submission_comments(author_role);
CREATE INDEX idx_comments_is_private ON submission_comments(is_private);
CREATE INDEX idx_comments_created_at ON submission_comments(created_at DESC);

-- Peer reviews indexes
CREATE INDEX idx_peer_reviews_tenant_id ON peer_reviews(tenant_id);
CREATE INDEX idx_peer_reviews_assignment_id ON peer_reviews(assignment_id);
CREATE INDEX idx_peer_reviews_submission_id ON peer_reviews(submission_id);
CREATE INDEX idx_peer_reviews_reviewer_id ON peer_reviews(reviewer_id);
CREATE INDEX idx_peer_reviews_status ON peer_reviews(status);
CREATE INDEX idx_peer_reviews_due_date ON peer_reviews(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_peer_reviews_submitted_at ON peer_reviews(submitted_at DESC) WHERE submitted_at IS NOT NULL;
CREATE INDEX idx_peer_reviews_tenant_reviewer ON peer_reviews(tenant_id, reviewer_id);
CREATE INDEX idx_peer_reviews_created_at ON peer_reviews(created_at DESC);

-- ========================================
-- Add Comments for Documentation
-- ========================================

COMMENT ON TABLE assignments IS 'Stores assignment information for courses';
COMMENT ON TABLE assignment_submissions IS 'Stores student submissions for assignments';
COMMENT ON TABLE assignment_files IS 'Stores files attached to assignments or submissions';
COMMENT ON TABLE rubrics IS 'Stores grading rubrics with criteria and levels';
COMMENT ON TABLE submission_grades IS 'Stores individual criterion grades for submissions';
COMMENT ON TABLE submission_comments IS 'Stores comments and feedback on submissions';
COMMENT ON TABLE peer_reviews IS 'Stores peer review assignments and submissions';

COMMENT ON COLUMN assignments.assignment_type IS 'Type of assignment: essay, file_upload, project, presentation, research, practical, portfolio';
COMMENT ON COLUMN assignments.allowed_file_types IS 'Array of allowed MIME types or file type names';
COMMENT ON COLUMN assignments.late_penalty_per_day IS 'Percentage penalty applied per day late (0-100)';
COMMENT ON COLUMN assignments.peer_reviews_required IS 'Number of peer reviews each student must complete';
COMMENT ON COLUMN assignment_submissions.status IS 'Current status of the submission';
COMMENT ON COLUMN assignment_submissions.grade_status IS 'Grading status: not_graded, in_progress, completed, needs_revision';
COMMENT ON COLUMN assignment_submissions.files IS 'Array of file UUIDs attached to this submission';
COMMENT ON COLUMN assignment_submissions.grades IS 'Array of grade UUIDs for this submission';
COMMENT ON COLUMN assignment_submissions.penalty_applied IS 'Late penalty percentage applied (0-100)';
COMMENT ON COLUMN assignment_files.file_type IS 'Categorized file type based on MIME type';
COMMENT ON COLUMN rubrics.criteria IS 'JSONB array of criteria with levels and weights';
COMMENT ON COLUMN peer_reviews.scores IS 'JSONB object mapping criterion IDs to scores';
