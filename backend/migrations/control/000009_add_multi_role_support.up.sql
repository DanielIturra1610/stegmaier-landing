-- Add multi-role support to users table
-- This migration adds fields for managing users with multiple roles

-- Add roles array column (stored as TEXT array)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT ARRAY[role]::TEXT[];

-- Add active_role column (the currently selected role for multi-role users)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS active_role VARCHAR(50) DEFAULT role;

-- Populate roles array from existing role column for existing users
UPDATE users 
SET roles = ARRAY[role]::TEXT[] 
WHERE roles IS NULL OR roles = '{}';

-- Populate active_role from existing role column for existing users
UPDATE users 
SET active_role = role 
WHERE active_role IS NULL OR active_role = '';

-- Add constraint to ensure active_role is valid
ALTER TABLE users
ADD CONSTRAINT users_active_role_check 
CHECK (active_role IN ('admin', 'instructor', 'student', 'superadmin'));

-- Create index for roles array for better query performance
CREATE INDEX IF NOT EXISTS idx_users_roles ON users USING GIN(roles);

-- Create index for active_role for better query performance
CREATE INDEX IF NOT EXISTS idx_users_active_role ON users(active_role);

-- Add comment for documentation
COMMENT ON COLUMN users.roles IS 'Array of all roles assigned to the user (supports multi-role users)';
COMMENT ON COLUMN users.active_role IS 'Currently active role for users with multiple roles';
