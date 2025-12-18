-- Rollback: restore role column for backwards compatibility
-- This migration adds back the role column

-- Add role column back
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'student';

-- Populate role from roles array (take first role)
UPDATE users
SET role = roles[1]
WHERE array_length(roles, 1) > 0;

-- Re-add constraint
ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('admin', 'instructor', 'student', 'superadmin'));

-- Re-add index
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
