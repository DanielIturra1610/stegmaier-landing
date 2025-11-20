-- Make tenant_id nullable in users, profiles, and profile_preferences tables
-- Users can register without a tenant and select/create one after email verification

-- Make tenant_id nullable in users table
ALTER TABLE users
ALTER COLUMN tenant_id DROP NOT NULL;

-- Make tenant_id nullable in profiles table
ALTER TABLE profiles
ALTER COLUMN tenant_id DROP NOT NULL;

-- Make tenant_id nullable in profile_preferences table
ALTER TABLE profile_preferences
ALTER COLUMN tenant_id DROP NOT NULL;

-- Update the trigger function to handle NULL tenant_id
CREATE OR REPLACE FUNCTION create_default_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default profile (tenant_id can be NULL for new registrations)
    INSERT INTO profiles (
        user_id, tenant_id, first_name, last_name,
        timezone, language, theme
    ) VALUES (
        NEW.id, NEW.tenant_id, NEW.email, '',
        'UTC', 'en', 'light'
    );

    -- Insert default preferences (tenant_id can be NULL for new registrations)
    INSERT INTO profile_preferences (
        user_id, tenant_id
    ) VALUES (
        NEW.id, NEW.tenant_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
