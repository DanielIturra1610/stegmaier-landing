-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create course_progress table
CREATE TABLE IF NOT EXISTS course_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    completed_lessons INTEGER NOT NULL DEFAULT 0 CHECK (completed_lessons >= 0),
    total_lessons INTEGER NOT NULL DEFAULT 0 CHECK (total_lessons >= 0),
    completed_quizzes INTEGER NOT NULL DEFAULT 0 CHECK (completed_quizzes >= 0),
    total_quizzes INTEGER NOT NULL DEFAULT 0 CHECK (total_quizzes >= 0),
    total_time_spent INTEGER NOT NULL DEFAULT 0 CHECK (total_time_spent >= 0),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    certificate_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT course_progress_user_course_unique UNIQUE (tenant_id, user_id, course_id),
    CONSTRAINT course_progress_enrollment_unique UNIQUE (tenant_id, enrollment_id),
    CONSTRAINT course_progress_completed_check CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR
        (status != 'completed' AND completed_at IS NULL)
    ),
    CONSTRAINT course_progress_started_check CHECK (
        (status != 'not_started' AND started_at IS NOT NULL) OR
        (status = 'not_started')
    ),
    CONSTRAINT course_progress_lessons_check CHECK (completed_lessons <= total_lessons),
    CONSTRAINT course_progress_quizzes_check CHECK (completed_quizzes <= total_quizzes)
);

-- Create progress_snapshots table
CREATE TABLE IF NOT EXISTS progress_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    progress_percentage INTEGER NOT NULL CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    completed_lessons INTEGER NOT NULL CHECK (completed_lessons >= 0),
    completed_quizzes INTEGER NOT NULL CHECK (completed_quizzes >= 0),
    total_time_spent INTEGER NOT NULL CHECK (total_time_spent >= 0),
    milestone_type VARCHAR(20) NOT NULL CHECK (milestone_type IN ('start', '25_percent', '50_percent', '75_percent', '100_percent', 'custom')),
    milestone_data JSONB,
    snapshot_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
-- Course progress indexes
CREATE INDEX idx_course_progress_tenant_id ON course_progress(tenant_id);
CREATE INDEX idx_course_progress_user_id ON course_progress(user_id);
CREATE INDEX idx_course_progress_course_id ON course_progress(course_id);
CREATE INDEX idx_course_progress_enrollment_id ON course_progress(enrollment_id);
CREATE INDEX idx_course_progress_status ON course_progress(status);
CREATE INDEX idx_course_progress_user_course ON course_progress(user_id, course_id);
CREATE INDEX idx_course_progress_tenant_user ON course_progress(tenant_id, user_id);
CREATE INDEX idx_course_progress_tenant_course ON course_progress(tenant_id, course_id);
CREATE INDEX idx_course_progress_started_at ON course_progress(started_at DESC) WHERE started_at IS NOT NULL;
CREATE INDEX idx_course_progress_completed_at ON course_progress(completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_course_progress_last_accessed_at ON course_progress(last_accessed_at DESC) WHERE last_accessed_at IS NOT NULL;
CREATE INDEX idx_course_progress_percentage ON course_progress(progress_percentage DESC);
CREATE INDEX idx_course_progress_updated_at ON course_progress(updated_at DESC);

-- Progress snapshots indexes
CREATE INDEX idx_progress_snapshots_tenant_id ON progress_snapshots(tenant_id);
CREATE INDEX idx_progress_snapshots_user_id ON progress_snapshots(user_id);
CREATE INDEX idx_progress_snapshots_course_id ON progress_snapshots(course_id);
CREATE INDEX idx_progress_snapshots_enrollment_id ON progress_snapshots(enrollment_id);
CREATE INDEX idx_progress_snapshots_user_course ON progress_snapshots(user_id, course_id);
CREATE INDEX idx_progress_snapshots_tenant_user_course ON progress_snapshots(tenant_id, user_id, course_id);
CREATE INDEX idx_progress_snapshots_milestone_type ON progress_snapshots(milestone_type);
CREATE INDEX idx_progress_snapshots_snapshot_date ON progress_snapshots(snapshot_date DESC);
CREATE INDEX idx_progress_snapshots_user_course_date ON progress_snapshots(user_id, course_id, snapshot_date DESC);
CREATE INDEX idx_progress_snapshots_milestone ON progress_snapshots(user_id, course_id, milestone_type);

-- Add comments for documentation
COMMENT ON TABLE course_progress IS 'Tracks overall student progress in courses with completion statistics';
COMMENT ON TABLE progress_snapshots IS 'Stores historical snapshots of progress at milestone points';
COMMENT ON COLUMN course_progress.status IS 'Progress status: not_started, in_progress, completed';
COMMENT ON COLUMN course_progress.progress_percentage IS 'Overall course completion percentage from 0 to 100';
COMMENT ON COLUMN course_progress.completed_lessons IS 'Number of lessons completed by the student';
COMMENT ON COLUMN course_progress.total_lessons IS 'Total number of lessons in the course';
COMMENT ON COLUMN course_progress.completed_quizzes IS 'Number of quizzes completed by the student';
COMMENT ON COLUMN course_progress.total_quizzes IS 'Total number of quizzes in the course';
COMMENT ON COLUMN course_progress.total_time_spent IS 'Total time spent on the course in minutes';
COMMENT ON COLUMN course_progress.certificate_id IS 'Reference to certificate if course is completed';
COMMENT ON COLUMN progress_snapshots.milestone_type IS 'Type of milestone: start, 25_percent, 50_percent, 75_percent, 100_percent, custom';
COMMENT ON COLUMN progress_snapshots.milestone_data IS 'Additional JSON data for custom milestones';
COMMENT ON COLUMN progress_snapshots.snapshot_date IS 'Date when the snapshot was taken';
