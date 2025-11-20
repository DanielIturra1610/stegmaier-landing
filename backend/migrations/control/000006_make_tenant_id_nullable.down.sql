-- Rollback: Make tenant_id required again
-- WARNING: This will fail if there are users without tenant_id

ALTER TABLE users
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE profiles
ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE profile_preferences
ALTER COLUMN tenant_id SET NOT NULL;

-- Restore original trigger function
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
