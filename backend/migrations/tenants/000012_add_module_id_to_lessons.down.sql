-- Drop indexes
DROP INDEX IF EXISTS idx_lessons_tenant_module;
DROP INDEX IF EXISTS idx_lessons_module_id;

-- Drop foreign key constraint
ALTER TABLE lessons
DROP CONSTRAINT IF EXISTS lessons_module_fk;

-- Drop module_id column
ALTER TABLE lessons
DROP COLUMN IF EXISTS module_id;
