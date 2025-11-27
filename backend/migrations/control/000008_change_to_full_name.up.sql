-- Change profiles table to use full_name instead of first_name and last_name
-- This matches the mv-backend pattern and simplifies the user model

-- Add full_name column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Migrate existing data: combine first_name and last_name into full_name
UPDATE profiles
SET full_name = TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')))
WHERE full_name IS NULL;

-- Set empty full_name to NULL
UPDATE profiles
SET full_name = NULL
WHERE full_name = '' OR full_name = ' ';

-- Drop the old columns
ALTER TABLE profiles DROP COLUMN IF EXISTS first_name;
ALTER TABLE profiles DROP COLUMN IF EXISTS last_name;

-- Update the trigger to use full_name
CREATE OR REPLACE FUNCTION create_default_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default profile with minimal data
    -- tenant_id and full_name can be NULL for new registrations
    INSERT INTO profiles (
        user_id,
        tenant_id,
        full_name,
        timezone,
        language,
        theme
    ) VALUES (
        NEW.id,
        NEW.tenant_id,
        NEW.full_name,  -- Use the full_name from users table
        'UTC',
        'en',
        'light'
    );

    -- Insert default preferences
    INSERT INTO profile_preferences (
        user_id,
        tenant_id
    ) VALUES (
        NEW.id,
        NEW.tenant_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON COLUMN profiles.full_name IS 'User full name (optional, can be set after registration)';
