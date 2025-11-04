-- Drop indexes first
-- Certificate templates indexes
DROP INDEX IF EXISTS idx_certificate_templates_updated_at;
DROP INDEX IF EXISTS idx_certificate_templates_tenant_default;
DROP INDEX IF EXISTS idx_certificate_templates_is_active;
DROP INDEX IF EXISTS idx_certificate_templates_is_default;
DROP INDEX IF EXISTS idx_certificate_templates_name;
DROP INDEX IF EXISTS idx_certificate_templates_created_by;
DROP INDEX IF EXISTS idx_certificate_templates_tenant_id;

-- Certificates indexes
DROP INDEX IF EXISTS idx_certificates_updated_at;
DROP INDEX IF EXISTS idx_certificates_grade;
DROP INDEX IF EXISTS idx_certificates_revoked_at;
DROP INDEX IF EXISTS idx_certificates_expires_at;
DROP INDEX IF EXISTS idx_certificates_completion_date;
DROP INDEX IF EXISTS idx_certificates_issued_at;
DROP INDEX IF EXISTS idx_certificates_tenant_course;
DROP INDEX IF EXISTS idx_certificates_tenant_user;
DROP INDEX IF EXISTS idx_certificates_user_course;
DROP INDEX IF EXISTS idx_certificates_status;
DROP INDEX IF EXISTS idx_certificates_verification_code;
DROP INDEX IF EXISTS idx_certificates_number;
DROP INDEX IF EXISTS idx_certificates_template_id;
DROP INDEX IF EXISTS idx_certificates_progress_id;
DROP INDEX IF EXISTS idx_certificates_enrollment_id;
DROP INDEX IF EXISTS idx_certificates_course_id;
DROP INDEX IF EXISTS idx_certificates_user_id;
DROP INDEX IF EXISTS idx_certificates_tenant_id;

-- Drop foreign key constraint from certificates to templates
ALTER TABLE IF EXISTS certificates
    DROP CONSTRAINT IF EXISTS certificates_template_fk;

-- Drop tables
DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS certificate_templates;
