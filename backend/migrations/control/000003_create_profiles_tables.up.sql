-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
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
    CONSTRAINT chk_first_name_length CHECK (LENGTH(first_name) >= 2 AND LENGTH(first_name) <= 100),
    CONSTRAINT chk_last_name_length CHECK (LENGTH(last_name) >= 2 AND LENGTH(last_name) <= 100),
    CONSTRAINT chk_bio_length CHECK (bio IS NULL OR LENGTH(bio) <= 500),
    CONSTRAINT chk_phone_length CHECK (phone_number IS NULL OR LENGTH(phone_number) <= 20)
);

-- Create profile_preferences table
CREATE TABLE IF NOT EXISTS profile_preferences (
    user_id                    UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
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
CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX idx_profiles_updated_at ON profiles(updated_at);
CREATE INDEX idx_profile_preferences_tenant ON profile_preferences(tenant_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on profiles
CREATE TRIGGER trigger_update_profile_timestamp
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_updated_at();

-- Create trigger to automatically update updated_at on preferences
CREATE TRIGGER trigger_update_preferences_timestamp
    BEFORE UPDATE ON profile_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_updated_at();

-- Create function to auto-create profile on user registration
CREATE OR REPLACE FUNCTION create_default_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default profile
    INSERT INTO profiles (
        user_id, tenant_id, first_name, last_name,
        timezone, language, theme
    ) VALUES (
        NEW.id, NEW.tenant_id, NEW.email, '',
        'UTC', 'en', 'light'
    );

    -- Insert default preferences
    INSERT INTO profile_preferences (
        user_id, tenant_id
    ) VALUES (
        NEW.id, NEW.tenant_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create profile when user is created
CREATE TRIGGER trigger_create_user_profile
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_profile();

-- Add comments for documentation
COMMENT ON TABLE profiles IS 'User profile information including personal details and preferences';
COMMENT ON TABLE profile_preferences IS 'User notification and privacy preferences';
COMMENT ON COLUMN profiles.avatar_url IS 'URL to user avatar image (stored in file storage)';
COMMENT ON COLUMN profiles.bio IS 'User biography (max 500 characters)';
COMMENT ON COLUMN profiles.theme IS 'UI theme preference: light, dark, or system';
COMMENT ON COLUMN profiles.timezone IS 'IANA timezone identifier (e.g., America/New_York)';
COMMENT ON COLUMN profiles.language IS 'ISO 639-1 language code (e.g., en, es)';
