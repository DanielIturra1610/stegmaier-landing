-- Remove redundant role column, keep only roles array
-- This migration simplifies the multi-role architecture

-- Drop the role column (roles array is the single source of truth)
ALTER TABLE users
DROP COLUMN IF EXISTS role;

-- Update comment
COMMENT ON COLUMN users.roles IS 'Array of all roles assigned to the user (single source of truth for user roles)';
