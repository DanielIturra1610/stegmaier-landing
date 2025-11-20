-- Rollback: Restore strict constraints

ALTER TABLE profiles ADD CONSTRAINT chk_first_name_length
    CHECK (LENGTH(first_name) >= 2 AND LENGTH(first_name) <= 100);

ALTER TABLE profiles ADD CONSTRAINT chk_last_name_length
    CHECK (LENGTH(last_name) >= 2 AND LENGTH(last_name) <= 100);

ALTER TABLE profiles ADD CONSTRAINT chk_bio_length
    CHECK (bio IS NULL OR LENGTH(bio) <= 500);

ALTER TABLE profiles ADD CONSTRAINT chk_phone_length
    CHECK (phone_number IS NULL OR LENGTH(phone_number) <= 20);

ALTER TABLE profiles ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN last_name SET NOT NULL;

-- Restore original trigger
CREATE OR REPLACE FUNCTION create_default_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (
        user_id, tenant_id, first_name, last_name,
        timezone, language, theme
    ) VALUES (
        NEW.id, NEW.tenant_id, NEW.email, '',
        'UTC', 'en', 'light'
    );

    INSERT INTO profile_preferences (
        user_id, tenant_id
    ) VALUES (
        NEW.id, NEW.tenant_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
