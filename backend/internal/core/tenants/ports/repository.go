package ports

import (
	"context"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/tenants/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/database"
)

// TenantRepository defines the interface for tenant data access
type TenantRepository interface {
	// Tenant operations
	CreateTenant(ctx context.Context, name, slug, dbName, description, email, phone string, address, website *string, ownerID string) (string, error)
	DeleteTenant(ctx context.Context, tenantID string) error
	GetTenantByID(ctx context.Context, tenantID string) (*database.TenantInfo, error)
	GetTenantBySlug(ctx context.Context, slug string) (*database.TenantInfo, error)
	TenantExistsBySlug(ctx context.Context, slug string) (bool, error)

	// Membership operations
	CreateMembership(ctx context.Context, membership *domain.TenantMembership) error
	GetMembership(ctx context.Context, userID, tenantID string) (*domain.TenantMembership, error)
	GetUserTenants(ctx context.Context, userID string) ([]*domain.TenantWithMembership, error)
	GetPendingInvitations(ctx context.Context, userID string) ([]*domain.Invitation, error)
	UpdateMembershipStatus(ctx context.Context, membershipID, status string) error
	UpdateMembershipJoinedAt(ctx context.Context, membershipID string) error

	// User operations within tenant context
	UpdateUserTenant(ctx context.Context, userID, tenantID string) error
	GetTenantMembers(ctx context.Context, tenantID string) ([]*domain.TenantMembership, error)
	GetTenantMembersWithUsers(ctx context.Context, tenantID string) ([]*domain.MemberWithUser, error)
}
