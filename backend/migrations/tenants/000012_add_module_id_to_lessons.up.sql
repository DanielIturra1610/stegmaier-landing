-- Add module_id column to lessons table
ALTER TABLE lessons
ADD COLUMN module_id UUID;

-- Add foreign key constraint to modules table
ALTER TABLE lessons
ADD CONSTRAINT lessons_module_fk
FOREIGN KEY (module_id)
REFERENCES modules(id)
ON DELETE SET NULL;

-- Create index for module_id
CREATE INDEX idx_lessons_module_id ON lessons(module_id) WHERE module_id IS NOT NULL;

-- Create composite index for tenant_id + module_id for better query performance
CREATE INDEX idx_lessons_tenant_module ON lessons(tenant_id, module_id) WHERE module_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN lessons.module_id IS 'Optional reference to the module/section this lesson belongs to';
