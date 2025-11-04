-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    progress_id UUID NOT NULL REFERENCES course_progress(id) ON DELETE CASCADE,
    certificate_number VARCHAR(50) NOT NULL UNIQUE,
    verification_code VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'revoked', 'expired')),
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    revocation_reason TEXT,
    template_id UUID,
    completion_date TIMESTAMP WITH TIME ZONE NOT NULL,
    grade DECIMAL(5,2) CHECK (grade >= 0 AND grade <= 100),
    total_time_spent INTEGER NOT NULL DEFAULT 0 CHECK (total_time_spent >= 0),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT certificates_user_course_unique UNIQUE (tenant_id, user_id, course_id),
    CONSTRAINT certificates_revoked_check CHECK (
        (status = 'revoked' AND revoked_at IS NOT NULL AND revoked_by IS NOT NULL AND revocation_reason IS NOT NULL) OR
        (status != 'revoked')
    ),
    CONSTRAINT certificates_expired_check CHECK (
        (status = 'expired' AND expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP) OR
        (status != 'expired')
    )
);

-- Create certificate_templates table
CREATE TABLE IF NOT EXISTS certificate_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_path VARCHAR(500) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    configuration TEXT NOT NULL DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT certificate_templates_name_tenant_unique UNIQUE (tenant_id, name),
    CONSTRAINT certificate_templates_one_default_per_tenant CHECK (
        NOT is_default OR
        NOT EXISTS (
            SELECT 1 FROM certificate_templates ct2
            WHERE ct2.tenant_id = certificate_templates.tenant_id
            AND ct2.is_default = true
            AND ct2.id != certificate_templates.id
        )
    )
);

-- Add foreign key from certificates to templates (nullable)
ALTER TABLE certificates
    ADD CONSTRAINT certificates_template_fk
    FOREIGN KEY (template_id)
    REFERENCES certificate_templates(id)
    ON DELETE SET NULL;

-- Create indexes for performance
-- Certificates indexes
CREATE INDEX idx_certificates_tenant_id ON certificates(tenant_id);
CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_certificates_course_id ON certificates(course_id);
CREATE INDEX idx_certificates_enrollment_id ON certificates(enrollment_id);
CREATE INDEX idx_certificates_progress_id ON certificates(progress_id);
CREATE INDEX idx_certificates_template_id ON certificates(template_id) WHERE template_id IS NOT NULL;
CREATE INDEX idx_certificates_number ON certificates(certificate_number);
CREATE INDEX idx_certificates_verification_code ON certificates(verification_code);
CREATE INDEX idx_certificates_status ON certificates(status);
CREATE INDEX idx_certificates_user_course ON certificates(user_id, course_id);
CREATE INDEX idx_certificates_tenant_user ON certificates(tenant_id, user_id);
CREATE INDEX idx_certificates_tenant_course ON certificates(tenant_id, course_id);
CREATE INDEX idx_certificates_issued_at ON certificates(issued_at DESC);
CREATE INDEX idx_certificates_completion_date ON certificates(completion_date DESC);
CREATE INDEX idx_certificates_expires_at ON certificates(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_certificates_revoked_at ON certificates(revoked_at DESC) WHERE revoked_at IS NOT NULL;
CREATE INDEX idx_certificates_grade ON certificates(grade DESC) WHERE grade IS NOT NULL;
CREATE INDEX idx_certificates_updated_at ON certificates(updated_at DESC);

-- Certificate templates indexes
CREATE INDEX idx_certificate_templates_tenant_id ON certificate_templates(tenant_id);
CREATE INDEX idx_certificate_templates_created_by ON certificate_templates(created_by);
CREATE INDEX idx_certificate_templates_name ON certificate_templates(name);
CREATE INDEX idx_certificate_templates_is_default ON certificate_templates(is_default) WHERE is_default = true;
CREATE INDEX idx_certificate_templates_is_active ON certificate_templates(is_active);
CREATE INDEX idx_certificate_templates_tenant_default ON certificate_templates(tenant_id, is_default) WHERE is_default = true;
CREATE INDEX idx_certificate_templates_updated_at ON certificate_templates(updated_at DESC);

-- Add comments for documentation
COMMENT ON TABLE certificates IS 'Stores certificates issued for course completion';
COMMENT ON TABLE certificate_templates IS 'Stores certificate templates for PDF generation';

COMMENT ON COLUMN certificates.certificate_number IS 'Unique certificate number in format CERT-XXXXX';
COMMENT ON COLUMN certificates.verification_code IS 'SHA-256 hash for certificate verification';
COMMENT ON COLUMN certificates.status IS 'Certificate status: issued, revoked, expired';
COMMENT ON COLUMN certificates.issued_at IS 'Date when certificate was issued';
COMMENT ON COLUMN certificates.expires_at IS 'Optional expiration date for the certificate';
COMMENT ON COLUMN certificates.revoked_at IS 'Date when certificate was revoked';
COMMENT ON COLUMN certificates.revoked_by IS 'User ID who revoked the certificate';
COMMENT ON COLUMN certificates.revocation_reason IS 'Reason for certificate revocation';
COMMENT ON COLUMN certificates.template_id IS 'Template used for certificate generation';
COMMENT ON COLUMN certificates.completion_date IS 'Date when course was completed';
COMMENT ON COLUMN certificates.grade IS 'Final grade for the course (0-100)';
COMMENT ON COLUMN certificates.total_time_spent IS 'Total time spent on course in minutes';
COMMENT ON COLUMN certificates.metadata IS 'Additional metadata in JSON format';

COMMENT ON COLUMN certificate_templates.name IS 'Template name';
COMMENT ON COLUMN certificate_templates.description IS 'Template description';
COMMENT ON COLUMN certificate_templates.template_path IS 'Path to template file';
COMMENT ON COLUMN certificate_templates.is_default IS 'Whether this is the default template for the tenant';
COMMENT ON COLUMN certificate_templates.is_active IS 'Whether this template is active and can be used';
COMMENT ON COLUMN certificate_templates.configuration IS 'JSON configuration for template rendering';
COMMENT ON COLUMN certificate_templates.created_by IS 'User who created the template';
