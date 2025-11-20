-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create modules table
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

    -- Content
    title VARCHAR(200) NOT NULL CHECK (char_length(title) >= 3),
    description TEXT,

    -- Ordering and visibility
    "order" INTEGER NOT NULL DEFAULT 0 CHECK ("order" >= 0),
    is_published BOOLEAN NOT NULL DEFAULT false,

    -- Duration
    duration INTEGER CHECK (duration IS NULL OR duration >= 0), -- Estimated duration in minutes

    -- Metadata
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT modules_title_length CHECK (char_length(title) <= 200),
    CONSTRAINT modules_description_length CHECK (description IS NULL OR char_length(description) <= 1000),
    CONSTRAINT modules_tenant_course_order_unique UNIQUE (tenant_id, course_id, "order")
);

-- Create module_progress table
CREATE TABLE IF NOT EXISTS module_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,

    -- Progress tracking
    completed_lessons INTEGER NOT NULL DEFAULT 0 CHECK (completed_lessons >= 0),
    total_lessons INTEGER NOT NULL DEFAULT 0 CHECK (total_lessons >= 0),
    progress_percent DECIMAL(5,2) NOT NULL DEFAULT 0.0 CHECK (progress_percent >= 0 AND progress_percent <= 100),

    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT module_progress_tenant_module_user_unique UNIQUE (tenant_id, module_id, user_id),
    CONSTRAINT module_progress_completed_check CHECK (completed_lessons <= total_lessons)
);

-- ========================================
-- Create Indexes for Performance
-- ========================================

-- Modules indexes
CREATE INDEX idx_modules_tenant_id ON modules(tenant_id);
CREATE INDEX idx_modules_course_id ON modules(course_id);
CREATE INDEX idx_modules_is_published ON modules(is_published);
CREATE INDEX idx_modules_created_by ON modules(created_by);
CREATE INDEX idx_modules_tenant_course ON modules(tenant_id, course_id);
CREATE INDEX idx_modules_tenant_course_order ON modules(tenant_id, course_id, "order");
CREATE INDEX idx_modules_tenant_published ON modules(tenant_id, is_published) WHERE is_published = true;
CREATE INDEX idx_modules_course_order ON modules(course_id, "order") WHERE deleted_at IS NULL;
CREATE INDEX idx_modules_deleted_at ON modules(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_modules_created_at ON modules(created_at DESC);
CREATE INDEX idx_modules_updated_at ON modules(updated_at DESC);

-- Module progress indexes
CREATE INDEX idx_module_progress_tenant_id ON module_progress(tenant_id);
CREATE INDEX idx_module_progress_module_id ON module_progress(module_id);
CREATE INDEX idx_module_progress_user_id ON module_progress(user_id);
CREATE INDEX idx_module_progress_tenant_user ON module_progress(tenant_id, user_id);
CREATE INDEX idx_module_progress_tenant_module ON module_progress(tenant_id, module_id);
CREATE INDEX idx_module_progress_progress_percent ON module_progress(progress_percent);
CREATE INDEX idx_module_progress_completed_at ON module_progress(completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_module_progress_last_accessed_at ON module_progress(last_accessed_at DESC);
CREATE INDEX idx_module_progress_created_at ON module_progress(created_at DESC);
CREATE INDEX idx_module_progress_updated_at ON module_progress(updated_at DESC);

-- ========================================
-- Add Comments for Documentation
-- ========================================

COMMENT ON TABLE modules IS 'Stores course modules (sections) that organize lessons';
COMMENT ON TABLE module_progress IS 'Tracks user progress through course modules';

COMMENT ON COLUMN modules.title IS 'Module title (3-200 characters)';
COMMENT ON COLUMN modules.description IS 'Optional module description (max 1000 characters)';
COMMENT ON COLUMN modules."order" IS 'Display order within the course (0-based)';
COMMENT ON COLUMN modules.is_published IS 'Whether the module is visible to students';
COMMENT ON COLUMN modules.duration IS 'Estimated duration in minutes';
COMMENT ON COLUMN modules.deleted_at IS 'Soft delete timestamp';

COMMENT ON COLUMN module_progress.completed_lessons IS 'Number of lessons completed in this module';
COMMENT ON COLUMN module_progress.total_lessons IS 'Total number of lessons in this module';
COMMENT ON COLUMN module_progress.progress_percent IS 'Progress percentage (0-100)';
COMMENT ON COLUMN module_progress.started_at IS 'When the user first accessed this module';
COMMENT ON COLUMN module_progress.completed_at IS 'When the user completed all lessons in this module';
COMMENT ON COLUMN module_progress.last_accessed_at IS 'Last time the user accessed a lesson in this module';
