-- Remove tenant contact and business information fields
DROP INDEX IF EXISTS idx_tenants_email;
DROP INDEX IF EXISTS idx_tenants_owner;

ALTER TABLE tenants
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS phone,
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS website,
DROP COLUMN IF EXISTS owner_id;
