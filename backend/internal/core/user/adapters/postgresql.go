package adapters

import (
	"context"
	"fmt"
	"strings"
	"time"

	authdomain "github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/user/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/user/ports"
	"github.com/jmoiron/sqlx"
)

// PostgreSQLUserRepository implements UserRepository interface
type PostgreSQLUserRepository struct {
	db *sqlx.DB
}

// NewPostgreSQLUserRepository creates a new PostgreSQL user repository
func NewPostgreSQLUserRepository(db *sqlx.DB) ports.UserRepository {
	return &PostgreSQLUserRepository{db: db}
}

// Create creates a new user
func (r *PostgreSQLUserRepository) Create(ctx context.Context, user *authdomain.User) error {
	query := `
		INSERT INTO users (id, tenant_id, email, password_hash, full_name, roles, active_role, is_verified, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`

	_, err := r.db.ExecContext(ctx, query,
		user.ID,
		user.TenantID,
		user.Email,
		user.PasswordHash,
		user.FullName,
		user.Roles,
		user.ActiveRole,
		user.IsVerified,
		user.CreatedAt,
		user.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	return nil
}

// GetByID retrieves a user by ID
func (r *PostgreSQLUserRepository) GetByID(ctx context.Context, userID string) (*authdomain.User, error) {
	query := `
		SELECT id, tenant_id, email, password_hash, full_name, role, is_verified, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	var user authdomain.User
	err := r.db.GetContext(ctx, &user, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user by ID: %w", err)
	}

	return &user, nil
}

// GetByEmail retrieves a user by email
func (r *PostgreSQLUserRepository) GetByEmail(ctx context.Context, email string) (*authdomain.User, error) {
	query := `
		SELECT id, tenant_id, email, password_hash, full_name, role, is_verified, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	var user authdomain.User
	err := r.db.GetContext(ctx, &user, query, email)
	if err != nil {
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}

	return &user, nil
}

// Update updates a user
func (r *PostgreSQLUserRepository) Update(ctx context.Context, user *authdomain.User) error {
	query := `
		UPDATE users
		SET email = $1, password_hash = $2, full_name = $3, roles = $4, active_role = $5, is_verified = $6, updated_at = $7
		WHERE id = $8
	`

	_, err := r.db.ExecContext(ctx, query,
		user.Email,
		user.PasswordHash,
		user.FullName,
		user.Roles,
		user.ActiveRole,
		user.IsVerified,
		time.Now(),
		user.ID,
	)

	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	return nil
}

// Delete soft deletes a user
func (r *PostgreSQLUserRepository) Delete(ctx context.Context, userID string) error {
	query := `DELETE FROM users WHERE id = $1`

	_, err := r.db.ExecContext(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	return nil
}

// List returns a paginated list of users with filters
func (r *PostgreSQLUserRepository) List(ctx context.Context, filters *domain.UserFiltersDTO) ([]*authdomain.User, int, error) {
	// Build WHERE clause
	conditions := []string{}
	args := []interface{}{}
	argIndex := 1

	if filters.TenantID != "" {
		conditions = append(conditions, fmt.Sprintf("tenant_id = $%d", argIndex))
		args = append(args, filters.TenantID)
		argIndex++
	}

	if filters.Role != "" {
		conditions = append(conditions, fmt.Sprintf("role = $%d", argIndex))
		args = append(args, filters.Role)
		argIndex++
	}

	if filters.IsVerified != nil {
		conditions = append(conditions, fmt.Sprintf("is_verified = $%d", argIndex))
		args = append(args, *filters.IsVerified)
		argIndex++
	}

	if filters.Search != "" {
		searchPattern := "%" + filters.Search + "%"
		conditions = append(conditions, fmt.Sprintf("(email ILIKE $%d OR full_name ILIKE $%d)", argIndex, argIndex))
		args = append(args, searchPattern)
		argIndex++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Count total
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM users %s", whereClause)
	var totalCount int
	err := r.db.GetContext(ctx, &totalCount, countQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count users: %w", err)
	}

	// Get paginated results
	offset := (filters.Page - 1) * filters.PageSize
	query := fmt.Sprintf(`
		SELECT id, tenant_id, email, password_hash, full_name, role, is_verified, created_at, updated_at
		FROM users
		%s
		ORDER BY %s %s
		LIMIT $%d OFFSET $%d
	`, whereClause, filters.SortBy, strings.ToUpper(filters.SortOrder), argIndex, argIndex+1)

	args = append(args, filters.PageSize, offset)

	var users []*authdomain.User
	err = r.db.SelectContext(ctx, &users, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list users: %w", err)
	}

	return users, totalCount, nil
}

// GetByTenant retrieves all users in a tenant
func (r *PostgreSQLUserRepository) GetByTenant(ctx context.Context, tenantID string) ([]*authdomain.User, error) {
	query := `
		SELECT id, tenant_id, email, password_hash, full_name, role, is_verified, created_at, updated_at
		FROM users
		WHERE tenant_id = $1
		ORDER BY created_at DESC
	`

	var users []*authdomain.User
	err := r.db.SelectContext(ctx, &users, query, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get users by tenant: %w", err)
	}

	return users, nil
}

// GetByRole retrieves all users with a specific role
func (r *PostgreSQLUserRepository) GetByRole(ctx context.Context, role string) ([]*authdomain.User, error) {
	query := `
		SELECT id, tenant_id, email, password_hash, full_name, role, is_verified, created_at, updated_at
		FROM users
		WHERE role = $1
		ORDER BY created_at DESC
	`

	var users []*authdomain.User
	err := r.db.SelectContext(ctx, &users, query, role)
	if err != nil {
		return nil, fmt.Errorf("failed to get users by role: %w", err)
	}

	return users, nil
}

// Count counts users matching filters
func (r *PostgreSQLUserRepository) Count(ctx context.Context, filters *domain.UserFiltersDTO) (int, error) {
	conditions := []string{}
	args := []interface{}{}
	argIndex := 1

	if filters.TenantID != "" {
		conditions = append(conditions, fmt.Sprintf("tenant_id = $%d", argIndex))
		args = append(args, filters.TenantID)
		argIndex++
	}

	if filters.Role != "" {
		conditions = append(conditions, fmt.Sprintf("role = $%d", argIndex))
		args = append(args, filters.Role)
		argIndex++
	}

	if filters.IsVerified != nil {
		conditions = append(conditions, fmt.Sprintf("is_verified = $%d", argIndex))
		args = append(args, *filters.IsVerified)
		argIndex++
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	query := fmt.Sprintf("SELECT COUNT(*) FROM users %s", whereClause)

	var count int
	err := r.db.GetContext(ctx, &count, query, args...)
	if err != nil {
		return 0, fmt.Errorf("failed to count users: %w", err)
	}

	return count, nil
}

// CountByTenant counts users in a tenant
func (r *PostgreSQLUserRepository) CountByTenant(ctx context.Context, tenantID string) (int, error) {
	query := `SELECT COUNT(*) FROM users WHERE tenant_id = $1`

	var count int
	err := r.db.GetContext(ctx, &count, query, tenantID)
	if err != nil {
		return 0, fmt.Errorf("failed to count users by tenant: %w", err)
	}

	return count, nil
}

// CountByRole counts users with a specific role
func (r *PostgreSQLUserRepository) CountByRole(ctx context.Context, role string) (int, error) {
	query := `SELECT COUNT(*) FROM users WHERE role = $1`

	var count int
	err := r.db.GetContext(ctx, &count, query, role)
	if err != nil {
		return 0, fmt.Errorf("failed to count users by role: %w", err)
	}

	return count, nil
}

// SetVerified sets the verified status of a user
func (r *PostgreSQLUserRepository) SetVerified(ctx context.Context, userID string, verified bool) error {
	query := `UPDATE users SET is_verified = $1, updated_at = $2 WHERE id = $3`

	_, err := r.db.ExecContext(ctx, query, verified, time.Now(), userID)
	if err != nil {
		return fmt.Errorf("failed to set verified status: %w", err)
	}

	return nil
}

// Exists checks if a user with the given email exists
func (r *PostgreSQLUserRepository) Exists(ctx context.Context, email string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`

	var exists bool
	err := r.db.GetContext(ctx, &exists, query, email)
	if err != nil {
		return false, fmt.Errorf("failed to check if user exists: %w", err)
	}

	return exists, nil
}

// BulkDelete deletes multiple users
func (r *PostgreSQLUserRepository) BulkDelete(ctx context.Context, userIDs []string) error {
	if len(userIDs) == 0 {
		return nil
	}

	query := `DELETE FROM users WHERE id = ANY($1)`

	_, err := r.db.ExecContext(ctx, query, userIDs)
	if err != nil {
		return fmt.Errorf("failed to bulk delete users: %w", err)
	}

	return nil
}

// BulkUpdateRole updates role for multiple users
func (r *PostgreSQLUserRepository) BulkUpdateRole(ctx context.Context, userIDs []string, newRole string) error {
	if len(userIDs) == 0 {
		return nil
	}

	query := `UPDATE users SET role = $1, updated_at = $2 WHERE id = ANY($3)`

	_, err := r.db.ExecContext(ctx, query, newRole, time.Now(), userIDs)
	if err != nil {
		return fmt.Errorf("failed to bulk update roles: %w", err)
	}

	return nil
}

// GetStats retrieves user statistics for a tenant
func (r *PostgreSQLUserRepository) GetStats(ctx context.Context, tenantID string) (*domain.UserStatsDTO, error) {
	stats := &domain.UserStatsDTO{
		UsersByRole: make(map[string]int),
	}

	// Total users
	err := r.db.GetContext(ctx, &stats.TotalUsers,
		`SELECT COUNT(*) FROM users WHERE tenant_id = $1`, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to count total users: %w", err)
	}

	// Verified users
	err = r.db.GetContext(ctx, &stats.VerifiedUsers,
		`SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND is_verified = true`, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to count verified users: %w", err)
	}

	// Unverified users
	stats.UnverifiedUsers = stats.TotalUsers - stats.VerifiedUsers

	// Users by role
	rows, err := r.db.QueryContext(ctx,
		`SELECT role, COUNT(*) as count FROM users WHERE tenant_id = $1 GROUP BY role`, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to count users by role: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var role string
		var count int
		if err := rows.Scan(&role, &count); err != nil {
			return nil, fmt.Errorf("failed to scan role count: %w", err)
		}
		stats.UsersByRole[role] = count
	}

	// Recent users (last 7 days)
	sevenDaysAgo := time.Now().AddDate(0, 0, -7)
	err = r.db.GetContext(ctx, &stats.RecentUsers,
		`SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND created_at >= $2`, tenantID, sevenDaysAgo)
	if err != nil {
		return nil, fmt.Errorf("failed to count recent users: %w", err)
	}

	return stats, nil
}
