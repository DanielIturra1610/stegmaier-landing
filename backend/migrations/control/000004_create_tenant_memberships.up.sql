-- ============================================================================
-- Tenant Memberships Table
-- ============================================================================
-- This table manages the many-to-many relationship between users and tenants
-- It controls which users have access to which tenants and with what role
-- Security: A user can only access tenants where they have an active membership

CREATE TABLE IF NOT EXISTS tenant_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Relationships
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,

    -- Role within the tenant
    role VARCHAR(50) NOT NULL DEFAULT 'student',

    -- Membership status
    status VARCHAR(20) NOT NULL DEFAULT 'active',

    -- Invitation tracking
    invited_by UUID,
    invited_at TIMESTAMP,

    -- Acceptance tracking
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign keys
    CONSTRAINT fk_membership_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_membership_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_membership_invited_by FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL,

    -- Constraints
    CONSTRAINT chk_membership_role CHECK (role IN ('admin', 'instructor', 'student')),
    CONSTRAINT chk_membership_status CHECK (status IN ('pending', 'active', 'inactive', 'rejected')),

    -- Unique constraint: one membership per user-tenant pair
    CONSTRAINT uq_user_tenant UNIQUE (user_id, tenant_id)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Fast lookup of all tenants for a user
CREATE INDEX idx_memberships_user_id ON tenant_memberships(user_id) WHERE status = 'active';

-- Fast lookup of all members of a tenant
CREATE INDEX idx_memberships_tenant_id ON tenant_memberships(tenant_id) WHERE status = 'active';

-- Fast lookup of pending invitations
CREATE INDEX idx_memberships_status ON tenant_memberships(status) WHERE status = 'pending';

-- Fast lookup by invited_by for auditing
CREATE INDEX idx_memberships_invited_by ON tenant_memberships(invited_by);

-- Composite index for user-tenant lookups
CREATE INDEX idx_memberships_user_tenant_active ON tenant_memberships(user_id, tenant_id) WHERE status = 'active';

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_membership_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_membership_timestamp
BEFORE UPDATE ON tenant_memberships
FOR EACH ROW
EXECUTE FUNCTION update_membership_updated_at();

-- ============================================================================
-- Add owner_id to tenants table
-- ============================================================================

-- Add owner_id column to track who created the tenant
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS owner_id UUID;

-- Add foreign key constraint
ALTER TABLE tenants ADD CONSTRAINT fk_tenant_owner
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;

-- Create index for fast owner lookups
CREATE INDEX idx_tenants_owner_id ON tenants(owner_id);

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE tenant_memberships IS 'Manages user access to tenants with role-based permissions';
COMMENT ON COLUMN tenant_memberships.user_id IS 'User who has membership in the tenant';
COMMENT ON COLUMN tenant_memberships.tenant_id IS 'Tenant that the user has access to';
COMMENT ON COLUMN tenant_memberships.role IS 'Role of the user within this tenant (admin, instructor, student)';
COMMENT ON COLUMN tenant_memberships.status IS 'Status of the membership: pending (invited), active (accepted), inactive (disabled), rejected (declined invitation)';
COMMENT ON COLUMN tenant_memberships.invited_by IS 'User who created the invitation (NULL if auto-created)';
COMMENT ON COLUMN tenant_memberships.invited_at IS 'When the invitation was created';
COMMENT ON COLUMN tenant_memberships.joined_at IS 'When the user accepted the invitation and joined';
COMMENT ON COLUMN tenants.owner_id IS 'User who created/owns this tenant (has special privileges)';
