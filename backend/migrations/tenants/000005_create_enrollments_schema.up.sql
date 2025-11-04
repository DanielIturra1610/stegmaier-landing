-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'expired', 'cancelled')),
    progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    certificate_id UUID,
    cancellation_reason TEXT CHECK (cancellation_reason IS NULL OR LENGTH(cancellation_reason) <= 500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT enrollments_user_course_unique UNIQUE (tenant_id, user_id, course_id)
);

-- Create enrollment_requests table
CREATE TABLE IF NOT EXISTS enrollment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    request_message TEXT CHECK (request_message IS NULL OR LENGTH(request_message) <= 500),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason TEXT CHECK (rejection_reason IS NULL OR LENGTH(rejection_reason) <= 500),
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT enrollment_requests_user_course_unique UNIQUE (tenant_id, user_id, course_id)
);

-- Create indexes for performance
-- Enrollments indexes
CREATE INDEX idx_enrollments_tenant_id ON enrollments(tenant_id);
CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_user_course ON enrollments(user_id, course_id);
CREATE INDEX idx_enrollments_tenant_user ON enrollments(tenant_id, user_id);
CREATE INDEX idx_enrollments_tenant_course ON enrollments(tenant_id, course_id);
CREATE INDEX idx_enrollments_enrolled_at ON enrollments(enrolled_at DESC);
CREATE INDEX idx_enrollments_last_accessed_at ON enrollments(last_accessed_at DESC) WHERE last_accessed_at IS NOT NULL;
CREATE INDEX idx_enrollments_completed_at ON enrollments(completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_enrollments_expires_at ON enrollments(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_enrollments_progress ON enrollments(progress_percentage DESC);

-- Enrollment requests indexes
CREATE INDEX idx_enrollment_requests_tenant_id ON enrollment_requests(tenant_id);
CREATE INDEX idx_enrollment_requests_user_id ON enrollment_requests(user_id);
CREATE INDEX idx_enrollment_requests_course_id ON enrollment_requests(course_id);
CREATE INDEX idx_enrollment_requests_status ON enrollment_requests(status);
CREATE INDEX idx_enrollment_requests_user_course ON enrollment_requests(user_id, course_id);
CREATE INDEX idx_enrollment_requests_tenant_course ON enrollment_requests(tenant_id, course_id);
CREATE INDEX idx_enrollment_requests_requested_at ON enrollment_requests(requested_at DESC);
CREATE INDEX idx_enrollment_requests_reviewed_at ON enrollment_requests(reviewed_at DESC) WHERE reviewed_at IS NOT NULL;
CREATE INDEX idx_enrollment_requests_reviewed_by ON enrollment_requests(reviewed_by) WHERE reviewed_by IS NOT NULL;
CREATE INDEX idx_enrollment_requests_pending ON enrollment_requests(course_id, requested_at DESC) WHERE status = 'pending';

-- Add comments for documentation
COMMENT ON TABLE enrollments IS 'Stores student enrollments in courses with progress tracking';
COMMENT ON TABLE enrollment_requests IS 'Stores enrollment requests for courses requiring approval';
COMMENT ON COLUMN enrollments.status IS 'Enrollment status: pending, active, completed, expired, cancelled';
COMMENT ON COLUMN enrollments.progress_percentage IS 'Course completion progress from 0 to 100';
COMMENT ON COLUMN enrollments.expires_at IS 'Optional expiration date for time-limited enrollments';
COMMENT ON COLUMN enrollment_requests.status IS 'Request status: pending, approved, rejected';
