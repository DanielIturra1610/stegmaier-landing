-- Create Lessons Schema
-- Adds lessons and lesson_completions tables for course content management

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('video', 'text', 'pdf', 'quiz', 'assignment')),
    content_url VARCHAR(500),
    content TEXT,
    duration INTEGER CHECK (duration >= 0),
    order_index INTEGER NOT NULL DEFAULT 0 CHECK (order_index >= 0),
    is_published BOOLEAN DEFAULT false,
    is_free BOOLEAN DEFAULT false,
    quiz_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT lessons_order_unique UNIQUE (tenant_id, course_id, order_index, deleted_at)
);

-- Create lesson_completions table
CREATE TABLE IF NOT EXISTS lesson_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT false,
    time_spent INTEGER CHECK (time_spent >= 0),
    completion_percent INTEGER DEFAULT 0 CHECK (completion_percent >= 0 AND completion_percent <= 100),
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT lesson_completions_user_lesson_unique UNIQUE (tenant_id, lesson_id, user_id)
);

-- Create indexes for lessons
CREATE INDEX IF NOT EXISTS idx_lessons_tenant ON lessons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course_order ON lessons(tenant_id, course_id, order_index) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lessons_published ON lessons(tenant_id, is_published) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lessons_free ON lessons(tenant_id, is_free) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lessons_quiz ON lessons(quiz_id) WHERE quiz_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lessons_deleted ON lessons(deleted_at);
CREATE INDEX IF NOT EXISTS idx_lessons_content_type ON lessons(content_type);

-- Create indexes for lesson_completions
CREATE INDEX IF NOT EXISTS idx_lesson_completions_tenant ON lesson_completions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_lesson ON lesson_completions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_user ON lesson_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_user_completed ON lesson_completions(tenant_id, user_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_lesson_user ON lesson_completions(tenant_id, lesson_id, user_id);

-- Trigger for lessons updated_at
CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for lesson_completions updated_at
CREATE TRIGGER update_lesson_completions_updated_at
    BEFORE UPDATE ON lesson_completions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE lessons IS 'Lessons within courses - supports multiple content types';
COMMENT ON COLUMN lessons.content_type IS 'Type of lesson content: video, text, pdf, quiz, assignment';
COMMENT ON COLUMN lessons.content_url IS 'URL to external content (video, PDF, etc.)';
COMMENT ON COLUMN lessons.content IS 'Text content for text-based lessons';
COMMENT ON COLUMN lessons.duration IS 'Lesson duration in minutes';
COMMENT ON COLUMN lessons.order_index IS 'Order of lesson within the course';
COMMENT ON COLUMN lessons.is_published IS 'Whether the lesson is visible to students';
COMMENT ON COLUMN lessons.is_free IS 'Whether the lesson is free to preview without enrollment';
COMMENT ON COLUMN lessons.quiz_id IS 'Optional reference to associated quiz';
COMMENT ON COLUMN lessons.deleted_at IS 'Timestamp of soft deletion';

COMMENT ON TABLE lesson_completions IS 'Tracks student progress and completion of lessons';
COMMENT ON COLUMN lesson_completions.is_completed IS 'Whether the lesson is marked as complete';
COMMENT ON COLUMN lesson_completions.time_spent IS 'Time spent on lesson in minutes';
COMMENT ON COLUMN lesson_completions.completion_percent IS 'Progress percentage (0-100)';
COMMENT ON COLUMN lesson_completions.last_accessed_at IS 'Last time student accessed the lesson';
COMMENT ON COLUMN lesson_completions.completed_at IS 'Timestamp when lesson was completed';
