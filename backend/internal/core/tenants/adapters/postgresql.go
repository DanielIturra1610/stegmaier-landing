package adapters

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/tenants/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/database"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

// PostgresTenantRepository implements the TenantRepository interface
type PostgresTenantRepository struct {
	controlDB *sqlx.DB
	manager   *database.Manager
}

// NewPostgresTenantRepository creates a new PostgreSQL tenant repository
func NewPostgresTenantRepository(controlDB *sqlx.DB, manager *database.Manager) *PostgresTenantRepository {
	return &PostgresTenantRepository{
		controlDB: controlDB,
		manager:   manager,
	}
}

// CreateTenant creates a new tenant and automatically creates admin membership for owner
func (r *PostgresTenantRepository) CreateTenant(ctx context.Context, name, slug, dbName, description, email, phone string, address, website *string, ownerID string) (string, error) {
	tx, err := r.controlDB.BeginTx(ctx, nil)
	if err != nil {
		return "", fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Create tenant
	tenantID := uuid.New().String()
	query := `
		INSERT INTO tenants (id, name, slug, database_name, description, email, phone, address, website, owner_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`
	now := time.Now()
	_, err = tx.ExecContext(ctx, query, tenantID, name, slug, dbName, description, email, phone, address, website, ownerID, now, now)
	if err != nil {
		return "", fmt.Errorf("failed to create tenant: %w", err)
	}

	// Create admin membership for owner
	membershipID := uuid.New().String()
	membershipQuery := `
		INSERT INTO tenant_memberships (id, user_id, tenant_id, role, status, joined_at, created_at, updated_at)
		VALUES ($1, $2, $3, 'admin', 'active', $4, $5, $6)
	`
	_, err = tx.ExecContext(ctx, membershipQuery, membershipID, ownerID, tenantID, now, now, now)
	if err != nil {
		return "", fmt.Errorf("failed to create admin membership: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return "", fmt.Errorf("failed to commit transaction: %w", err)
	}

	return tenantID, nil
}

// DeleteTenant deletes a tenant and its memberships (for rollback purposes)
func (r *PostgresTenantRepository) DeleteTenant(ctx context.Context, tenantID string) error {
	tx, err := r.controlDB.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Delete memberships first (foreign key constraint)
	_, err = tx.ExecContext(ctx, "DELETE FROM tenant_memberships WHERE tenant_id = $1", tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete memberships: %w", err)
	}

	// Delete tenant
	_, err = tx.ExecContext(ctx, "DELETE FROM tenants WHERE id = $1", tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete tenant: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// GetTenantByID retrieves a tenant by its ID
func (r *PostgresTenantRepository) GetTenantByID(ctx context.Context, tenantID string) (*database.TenantInfo, error) {
	query := `
		SELECT id, name, slug, database_name, node_number, status
		FROM tenants
		WHERE id = $1
	`

	var tenant database.TenantInfo

	err := r.controlDB.QueryRowContext(ctx, query, tenantID).Scan(
		&tenant.ID,
		&tenant.Name,
		&tenant.Slug,
		&tenant.DatabaseName,
		&tenant.NodeNumber,
		&tenant.Status,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("tenant not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant: %w", err)
	}

	return &tenant, nil
}

// GetTenantBySlug retrieves a tenant by its slug
func (r *PostgresTenantRepository) GetTenantBySlug(ctx context.Context, slug string) (*database.TenantInfo, error) {
	query := `
		SELECT id, name, slug, database_name, node_number, status
		FROM tenants
		WHERE slug = $1
	`

	var tenant database.TenantInfo

	err := r.controlDB.QueryRowContext(ctx, query, slug).Scan(
		&tenant.ID,
		&tenant.Name,
		&tenant.Slug,
		&tenant.DatabaseName,
		&tenant.NodeNumber,
		&tenant.Status,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("tenant not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant: %w", err)
	}

	return &tenant, nil
}

// TenantExistsBySlug checks if a tenant with the given slug exists
func (r *PostgresTenantRepository) TenantExistsBySlug(ctx context.Context, slug string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM tenants WHERE slug = $1)`

	var exists bool
	err := r.controlDB.QueryRowContext(ctx, query, slug).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check tenant existence: %w", err)
	}

	return exists, nil
}

// CreateMembership creates a new tenant membership
func (r *PostgresTenantRepository) CreateMembership(ctx context.Context, membership *domain.TenantMembership) error {
	query := `
		INSERT INTO tenant_memberships (id, user_id, tenant_id, role, status, invited_by, invited_at, joined_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`

	now := time.Now()
	membership.ID = uuid.New().String()
	membership.CreatedAt = now
	membership.UpdatedAt = now

	var invitedBy sql.NullString
	if membership.InvitedBy != nil {
		invitedBy = sql.NullString{String: *membership.InvitedBy, Valid: true}
	}

	var invitedAt sql.NullTime
	if membership.InvitedAt != nil {
		invitedAt = sql.NullTime{Time: *membership.InvitedAt, Valid: true}
	}

	var joinedAt sql.NullTime
	if membership.JoinedAt != nil {
		joinedAt = sql.NullTime{Time: *membership.JoinedAt, Valid: true}
	}

	_, err := r.controlDB.ExecContext(ctx, query,
		membership.ID,
		membership.UserID,
		membership.TenantID,
		membership.Role,
		membership.Status,
		invitedBy,
		invitedAt,
		joinedAt,
		membership.CreatedAt,
		membership.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create membership: %w", err)
	}

	return nil
}

// GetMembership retrieves a membership by user ID and tenant ID
func (r *PostgresTenantRepository) GetMembership(ctx context.Context, userID, tenantID string) (*domain.TenantMembership, error) {
	query := `
		SELECT id, user_id, tenant_id, role, status, invited_by, invited_at, joined_at, created_at, updated_at
		FROM tenant_memberships
		WHERE user_id = $1 AND tenant_id = $2
	`

	var membership domain.TenantMembership
	var invitedBy sql.NullString
	var invitedAt, joinedAt sql.NullTime

	err := r.controlDB.QueryRowContext(ctx, query, userID, tenantID).Scan(
		&membership.ID,
		&membership.UserID,
		&membership.TenantID,
		&membership.Role,
		&membership.Status,
		&invitedBy,
		&invitedAt,
		&joinedAt,
		&membership.CreatedAt,
		&membership.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("membership not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get membership: %w", err)
	}

	if invitedBy.Valid {
		membership.InvitedBy = &invitedBy.String
	}
	if invitedAt.Valid {
		membership.InvitedAt = &invitedAt.Time
	}
	if joinedAt.Valid {
		membership.JoinedAt = &joinedAt.Time
	}

	return &membership, nil
}

// GetUserTenants retrieves all tenants for a user with their membership details
func (r *PostgresTenantRepository) GetUserTenants(ctx context.Context, userID string) ([]*domain.TenantWithMembership, error) {
	query := `
		SELECT
			t.id,
			t.name,
			t.slug,
			t.database_name,
			t.owner_id,
			(t.owner_id = $1) as is_owner,
			tm.role,
			tm.status,
			tm.joined_at
		FROM tenants t
		INNER JOIN tenant_memberships tm ON t.id = tm.tenant_id
		WHERE tm.user_id = $1 AND tm.status = 'active'
		ORDER BY tm.joined_at DESC
	`

	rows, err := r.controlDB.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user tenants: %w", err)
	}
	defer rows.Close()

	var tenants []*domain.TenantWithMembership
	for rows.Next() {
		var tenant domain.TenantWithMembership
		var ownerID sql.NullString
		var joinedAt sql.NullTime

		err := rows.Scan(
			&tenant.ID,
			&tenant.Name,
			&tenant.Slug,
			&tenant.DatabaseName,
			&ownerID,
			&tenant.IsOwner,
			&tenant.Role,
			&tenant.Status,
			&joinedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan tenant: %w", err)
		}

		if ownerID.Valid {
			tenant.OwnerID = &ownerID.String
		}
		if joinedAt.Valid {
			tenant.JoinedAt = &joinedAt.Time
		}

		tenants = append(tenants, &tenant)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating tenants: %w", err)
	}

	return tenants, nil
}

// GetPendingInvitations retrieves all pending invitations for a user
func (r *PostgresTenantRepository) GetPendingInvitations(ctx context.Context, userID string) ([]*domain.Invitation, error) {
	query := `
		SELECT
			tm.id,
			tm.tenant_id,
			t.name as tenant_name,
			tm.user_id,
			u.email as user_email,
			tm.role,
			tm.invited_by,
			inviter.full_name as invited_by_name,
			inviter.email as invited_by_email,
			tm.invited_at,
			tm.status
		FROM tenant_memberships tm
		INNER JOIN tenants t ON tm.tenant_id = t.id
		INNER JOIN users u ON tm.user_id = u.id
		LEFT JOIN users inviter ON tm.invited_by = inviter.id
		WHERE tm.user_id = $1 AND tm.status = 'pending'
		ORDER BY tm.invited_at DESC
	`

	rows, err := r.controlDB.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get pending invitations: %w", err)
	}
	defer rows.Close()

	var invitations []*domain.Invitation
	for rows.Next() {
		var invitation domain.Invitation

		err := rows.Scan(
			&invitation.ID,
			&invitation.TenantID,
			&invitation.TenantName,
			&invitation.UserID,
			&invitation.UserEmail,
			&invitation.Role,
			&invitation.InvitedBy,
			&invitation.InvitedByName,
			&invitation.InvitedByEmail,
			&invitation.InvitedAt,
			&invitation.Status,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan invitation: %w", err)
		}

		invitations = append(invitations, &invitation)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating invitations: %w", err)
	}

	return invitations, nil
}

// UpdateMembershipStatus updates the status of a membership
func (r *PostgresTenantRepository) UpdateMembershipStatus(ctx context.Context, membershipID, status string) error {
	query := `
		UPDATE tenant_memberships
		SET status = $1, updated_at = $2
		WHERE id = $3
	`

	result, err := r.controlDB.ExecContext(ctx, query, status, time.Now(), membershipID)
	if err != nil {
		return fmt.Errorf("failed to update membership status: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("membership not found")
	}

	return nil
}

// UpdateMembershipJoinedAt updates the joined_at timestamp when accepting invitation
func (r *PostgresTenantRepository) UpdateMembershipJoinedAt(ctx context.Context, membershipID string) error {
	query := `
		UPDATE tenant_memberships
		SET joined_at = $1, updated_at = $2
		WHERE id = $3
	`

	now := time.Now()
	result, err := r.controlDB.ExecContext(ctx, query, now, now, membershipID)
	if err != nil {
		return fmt.Errorf("failed to update membership joined_at: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("membership not found")
	}

	return nil
}

// UpdateUserTenant updates the user's current tenant_id
func (r *PostgresTenantRepository) UpdateUserTenant(ctx context.Context, userID, tenantID string) error {
	query := `
		UPDATE users
		SET tenant_id = $1, updated_at = $2
		WHERE id = $3
	`

	var tenantIDParam interface{}
	if tenantID == "" {
		tenantIDParam = nil
	} else {
		tenantIDParam = tenantID
	}

	result, err := r.controlDB.ExecContext(ctx, query, tenantIDParam, time.Now(), userID)
	if err != nil {
		return fmt.Errorf("failed to update user tenant: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("user not found")
	}

	return nil
}

// GetTenantMembers retrieves all members of a tenant
func (r *PostgresTenantRepository) GetTenantMembers(ctx context.Context, tenantID string) ([]*domain.TenantMembership, error) {
	query := `
		SELECT id, user_id, tenant_id, role, status, invited_by, invited_at, joined_at, created_at, updated_at
		FROM tenant_memberships
		WHERE tenant_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.controlDB.QueryContext(ctx, query, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant members: %w", err)
	}
	defer rows.Close()

	var members []*domain.TenantMembership
	for rows.Next() {
		var member domain.TenantMembership
		var invitedBy sql.NullString
		var invitedAt, joinedAt sql.NullTime

		err := rows.Scan(
			&member.ID,
			&member.UserID,
			&member.TenantID,
			&member.Role,
			&member.Status,
			&invitedBy,
			&invitedAt,
			&joinedAt,
			&member.CreatedAt,
			&member.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan member: %w", err)
		}

		if invitedBy.Valid {
			member.InvitedBy = &invitedBy.String
		}
		if invitedAt.Valid {
			member.InvitedAt = &invitedAt.Time
		}
		if joinedAt.Valid {
			member.JoinedAt = &joinedAt.Time
		}

		members = append(members, &member)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating members: %w", err)
	}

	return members, nil
}
