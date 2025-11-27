-- Add contact and business information fields to tenants table
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(15),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS website VARCHAR(255),
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_tenants_email ON tenants(email);
CREATE INDEX IF NOT EXISTS idx_tenants_owner ON tenants(owner_id);

-- Add comments
COMMENT ON COLUMN tenants.description IS 'Tenant description';
COMMENT ON COLUMN tenants.email IS 'Primary contact email for the tenant';
COMMENT ON COLUMN tenants.phone IS 'Primary contact phone number';
COMMENT ON COLUMN tenants.address IS 'Physical address of the tenant';
COMMENT ON COLUMN tenants.website IS 'Tenant website URL';
COMMENT ON COLUMN tenants.owner_id IS 'User ID of the tenant owner/creator';
