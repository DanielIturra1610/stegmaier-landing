-- Drop indexes for module_progress
DROP INDEX IF EXISTS idx_module_progress_updated_at;
DROP INDEX IF EXISTS idx_module_progress_created_at;
DROP INDEX IF EXISTS idx_module_progress_last_accessed_at;
DROP INDEX IF EXISTS idx_module_progress_completed_at;
DROP INDEX IF EXISTS idx_module_progress_progress_percent;
DROP INDEX IF EXISTS idx_module_progress_tenant_module;
DROP INDEX IF EXISTS idx_module_progress_tenant_user;
DROP INDEX IF EXISTS idx_module_progress_user_id;
DROP INDEX IF EXISTS idx_module_progress_module_id;
DROP INDEX IF EXISTS idx_module_progress_tenant_id;

-- Drop indexes for modules
DROP INDEX IF EXISTS idx_modules_updated_at;
DROP INDEX IF EXISTS idx_modules_created_at;
DROP INDEX IF EXISTS idx_modules_deleted_at;
DROP INDEX IF EXISTS idx_modules_course_order;
DROP INDEX IF EXISTS idx_modules_tenant_published;
DROP INDEX IF EXISTS idx_modules_tenant_course_order;
DROP INDEX IF EXISTS idx_modules_tenant_course;
DROP INDEX IF EXISTS idx_modules_created_by;
DROP INDEX IF EXISTS idx_modules_is_published;
DROP INDEX IF EXISTS idx_modules_course_id;
DROP INDEX IF EXISTS idx_modules_tenant_id;

-- Drop tables
DROP TABLE IF EXISTS module_progress;
DROP TABLE IF EXISTS modules;
