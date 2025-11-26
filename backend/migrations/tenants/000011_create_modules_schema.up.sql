-- Migration 011: Extend modules schema
-- Note: The 'modules' table was already created in migration 001 with basic structure
-- This migration extends it with additional fields

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- Extend modules table with additional columns
-- ========================================
ALTER TABLE modules ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS duration INTEGER;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Copy order_index to "order" if exists
UPDATE modules SET "order" = order_index WHERE "order" = 0 AND order_index IS NOT NULL AND order_index > 0;

-- ========================================
-- Create module_progress table (new table)
-- ========================================
CREATE TABLE IF NOT EXISTS module_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    completed_lessons INTEGER NOT NULL DEFAULT 0,
    total_lessons INTEGER NOT NULL DEFAULT 0,
    progress_percent DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- Create Indexes for Performance
-- ========================================

-- Modules indexes (for new columns)
CREATE INDEX IF NOT EXISTS idx_modules_tenant_id ON modules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_modules_is_published ON modules(is_published);
CREATE INDEX IF NOT EXISTS idx_modules_created_by ON modules(created_by);
CREATE INDEX IF NOT EXISTS idx_modules_tenant_course ON modules(tenant_id, course_id);
CREATE INDEX IF NOT EXISTS idx_modules_deleted_at ON modules(deleted_at);
CREATE INDEX IF NOT EXISTS idx_modules_created_at ON modules(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_modules_updated_at ON modules(updated_at DESC);

-- Module progress indexes
CREATE INDEX IF NOT EXISTS idx_module_progress_tenant_id ON module_progress(tenant_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_module_id ON module_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_user_id ON module_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_tenant_user ON module_progress(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_tenant_module ON module_progress(tenant_id, module_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_progress_percent ON module_progress(progress_percent);
CREATE INDEX IF NOT EXISTS idx_module_progress_completed_at ON module_progress(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_module_progress_last_accessed_at ON module_progress(last_accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_module_progress_created_at ON module_progress(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_module_progress_updated_at ON module_progress(updated_at DESC);
