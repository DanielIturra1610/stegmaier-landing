-- Create profiles table for tenant database
-- Note: user_id references users in the control database, so we don't use REFERENCES constraint
CREATE TABLE IF NOT EXISTS profiles (
    user_id         UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    full_name       VARCHAR(255),
    avatar_url      TEXT,
    bio             TEXT,
    phone_number    VARCHAR(20),
    date_of_birth   DATE,
    country         VARCHAR(100),
    city            VARCHAR(100),
    timezone        VARCHAR(50) NOT NULL DEFAULT 'UTC',
    language        VARCHAR(10) NOT NULL DEFAULT 'en',
    theme           VARCHAR(20) NOT NULL DEFAULT 'light',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_theme CHECK (theme IN ('light', 'dark', 'system')),
    CONSTRAINT chk_timezone_not_empty CHECK (timezone <> ''),
    CONSTRAINT chk_language_length CHECK (LENGTH(language) = 2),
    CONSTRAINT chk_bio_length CHECK (bio IS NULL OR LENGTH(bio) <= 500),
    CONSTRAINT chk_phone_length CHECK (phone_number IS NULL OR LENGTH(phone_number) <= 20)
);

-- Create profile_preferences table
CREATE TABLE IF NOT EXISTS profile_preferences (
    user_id                    UUID PRIMARY KEY,
    tenant_id                  UUID NOT NULL,
    email_notifications        BOOLEAN NOT NULL DEFAULT true,
    push_notifications         BOOLEAN NOT NULL DEFAULT true,
    course_reminders          BOOLEAN NOT NULL DEFAULT true,
    weekly_digest             BOOLEAN NOT NULL DEFAULT false,
    marketing_emails          BOOLEAN NOT NULL DEFAULT false,
    private_profile           BOOLEAN NOT NULL DEFAULT false,
    show_progress_publicly    BOOLEAN NOT NULL DEFAULT true,
    created_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at);
CREATE INDEX IF NOT EXISTS idx_profile_preferences_tenant ON profile_preferences(tenant_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on profiles
DROP TRIGGER IF EXISTS trigger_update_profile_timestamp ON profiles;
CREATE TRIGGER trigger_update_profile_timestamp
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_updated_at();

-- Create trigger to automatically update updated_at on preferences
DROP TRIGGER IF EXISTS trigger_update_preferences_timestamp ON profile_preferences;
CREATE TRIGGER trigger_update_preferences_timestamp
    BEFORE UPDATE ON profile_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_updated_at();

-- Add comments for documentation
COMMENT ON TABLE profiles IS 'User profile information for this tenant';
COMMENT ON TABLE profile_preferences IS 'User notification and privacy preferences for this tenant';
COMMENT ON COLUMN profiles.avatar_url IS 'URL to user avatar image (stored in file storage)';
COMMENT ON COLUMN profiles.bio IS 'User biography (max 500 characters)';
COMMENT ON COLUMN profiles.theme IS 'UI theme preference: light, dark, or system';
COMMENT ON COLUMN profiles.timezone IS 'IANA timezone identifier (e.g., America/New_York)';
COMMENT ON COLUMN profiles.language IS 'ISO 639-1 language code (e.g., en, es)';
