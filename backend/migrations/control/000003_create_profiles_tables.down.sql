-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_create_user_profile ON users;
DROP TRIGGER IF EXISTS trigger_update_preferences_timestamp ON profile_preferences;
DROP TRIGGER IF EXISTS trigger_update_profile_timestamp ON profiles;

-- Drop functions
DROP FUNCTION IF EXISTS create_default_profile();
DROP FUNCTION IF EXISTS update_profile_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_profile_preferences_tenant;
DROP INDEX IF EXISTS idx_profiles_updated_at;
DROP INDEX IF EXISTS idx_profiles_tenant;

-- Drop tables (CASCADE will drop foreign key constraints)
DROP TABLE IF EXISTS profile_preferences CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
