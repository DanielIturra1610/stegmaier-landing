-- ============================================================================
-- Rollback Tenant Memberships Migration
-- ============================================================================

-- Drop trigger first
DROP TRIGGER IF EXISTS trigger_update_membership_timestamp ON tenant_memberships;

-- Drop trigger function
DROP FUNCTION IF EXISTS update_membership_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_memberships_user_id;
DROP INDEX IF EXISTS idx_memberships_tenant_id;
DROP INDEX IF EXISTS idx_memberships_status;
DROP INDEX IF EXISTS idx_memberships_invited_by;
DROP INDEX IF EXISTS idx_memberships_user_tenant_active;

-- Drop tenant_memberships table
DROP TABLE IF EXISTS tenant_memberships;

-- Remove owner_id from tenants
DROP INDEX IF EXISTS idx_tenants_owner_id;
ALTER TABLE tenants DROP CONSTRAINT IF EXISTS fk_tenant_owner;
ALTER TABLE tenants DROP COLUMN IF EXISTS owner_id;
