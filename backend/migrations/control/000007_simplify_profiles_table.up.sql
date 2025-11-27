-- Simplify profiles table to match mv-backend pattern
-- Remove strict constraints and make fields more flexible

-- Drop the existing constraints that are too strict
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS chk_first_name_length;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS chk_last_name_length;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS chk_bio_length;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS chk_phone_length;

-- Make first_name and last_name nullable (they can be filled in later)
ALTER TABLE profiles ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN last_name DROP NOT NULL;

-- Update the trigger to not insert empty strings that violate constraints
CREATE OR REPLACE FUNCTION create_default_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default profile with NULL values for optional fields
    -- tenant_id can be NULL for new registrations
    INSERT INTO profiles (
        user_id, tenant_id, first_name, last_name,
        timezone, language, theme
    ) VALUES (
        NEW.id, NEW.tenant_id, NULL, NULL,
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
