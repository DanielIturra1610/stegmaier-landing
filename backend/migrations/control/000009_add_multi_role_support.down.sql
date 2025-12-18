-- Rollback multi-role support from users table
-- This migration removes the multi-role fields

-- Drop indexes first
DROP INDEX IF EXISTS idx_users_active_role;
DROP INDEX IF EXISTS idx_users_roles;

-- Drop constraint
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_active_role_check;

-- Drop columns
ALTER TABLE users 
DROP COLUMN IF EXISTS active_role;

ALTER TABLE users 
DROP COLUMN IF EXISTS roles;

-- The original role column remains unchanged
