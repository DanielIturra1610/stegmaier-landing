-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_preferences_timestamp ON profile_preferences;
DROP TRIGGER IF EXISTS trigger_update_profile_timestamp ON profiles;

-- Drop function
DROP FUNCTION IF EXISTS update_profile_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_profile_preferences_tenant;
DROP INDEX IF EXISTS idx_profiles_updated_at;
DROP INDEX IF EXISTS idx_profiles_tenant;

-- Drop tables
DROP TABLE IF EXISTS profile_preferences;
DROP TABLE IF EXISTS profiles;
