package adapters

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/ports"
	"github.com/jmoiron/sqlx"
)

// PostgreSQLAuthRepository implements AuthRepository interface for PostgreSQL
type PostgreSQLAuthRepository struct {
	db *sqlx.DB
}

// NewPostgreSQLAuthRepository creates a new PostgreSQL auth repository
func NewPostgreSQLAuthRepository(db *sqlx.DB) ports.AuthRepository {
	return &PostgreSQLAuthRepository{db: db}
}

// User operations

// CreateUser persists a new user to the database
func (r *PostgreSQLAuthRepository) CreateUser(ctx context.Context, user *domain.User) error {
	query := `
		INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_verified, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`

	// Convert *string to sql.NullString for proper NULL handling
	var tenantID sql.NullString
	if user.TenantID != nil {
		tenantID = sql.NullString{String: *user.TenantID, Valid: true}
	}

	_, err := r.db.ExecContext(ctx, query,
		user.ID,
		tenantID, // Use sql.NullString instead of *string
		user.Email,
		user.PasswordHash,
		user.FullName,
		user.Role,
		user.IsVerified,
		user.CreatedAt,
		user.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	return nil
}

// GetUserByID retrieves a user by their unique identifier
func (r *PostgreSQLAuthRepository) GetUserByID(ctx context.Context, userID string) (*domain.User, error) {
	query := `
		SELECT id, tenant_id, email, password_hash, full_name, role, is_verified, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	var user domain.User
	err := r.db.GetContext(ctx, &user, query, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ports.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by ID: %w", err)
	}

	return &user, nil
}

// GetUserByEmail retrieves a user by their email address
func (r *PostgreSQLAuthRepository) GetUserByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `
		SELECT id, tenant_id, email, password_hash, full_name, role, is_verified, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	var user domain.User
	err := r.db.GetContext(ctx, &user, query, email)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ports.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}

	return &user, nil
}

// UpdateUser updates an existing user's information
func (r *PostgreSQLAuthRepository) UpdateUser(ctx context.Context, user *domain.User) error {
	query := `
		UPDATE users
		SET email = $2, password_hash = $3, full_name = $4, role = $5, is_verified = $6, updated_at = $7
		WHERE id = $1
	`

	result, err := r.db.ExecContext(ctx, query,
		user.ID,
		user.Email,
		user.PasswordHash,
		user.FullName,
		user.Role,
		user.IsVerified,
		user.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ports.ErrUserNotFound
	}

	return nil
}

// DeleteUser removes a user from the database
func (r *PostgreSQLAuthRepository) DeleteUser(ctx context.Context, userID string) error {
	query := `DELETE FROM users WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ports.ErrUserNotFound
	}

	return nil
}

// ListUsers retrieves a paginated list of users with optional filtering
func (r *PostgreSQLAuthRepository) ListUsers(ctx context.Context, filters *domain.UserListFilters, page, pageSize int) ([]*domain.User, int, error) {
	// Build query with filters
	query := `
		SELECT id, tenant_id, email, password_hash, full_name, role, is_verified, created_at, updated_at
		FROM users
		WHERE 1=1
	`
	countQuery := `SELECT COUNT(*) FROM users WHERE 1=1`
	args := []interface{}{}
	argPosition := 1

	// Apply filters
	if filters != nil {
		if filters.Role != "" {
			query += fmt.Sprintf(" AND role = $%d", argPosition)
			countQuery += fmt.Sprintf(" AND role = $%d", argPosition)
			args = append(args, filters.Role)
			argPosition++
		}

		if filters.IsVerified != nil {
			query += fmt.Sprintf(" AND is_verified = $%d", argPosition)
			countQuery += fmt.Sprintf(" AND is_verified = $%d", argPosition)
			args = append(args, *filters.IsVerified)
			argPosition++
		}

		if filters.Search != "" {
			searchPattern := "%" + filters.Search + "%"
			query += fmt.Sprintf(" AND (email ILIKE $%d OR full_name ILIKE $%d)", argPosition, argPosition)
			countQuery += fmt.Sprintf(" AND (email ILIKE $%d OR full_name ILIKE $%d)", argPosition, argPosition)
			args = append(args, searchPattern)
			argPosition++
		}
	}

	// Get total count
	var total int
	err := r.db.GetContext(ctx, &total, countQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count users: %w", err)
	}

	// Add pagination
	offset := (page - 1) * pageSize
	query += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", argPosition, argPosition+1)
	args = append(args, pageSize, offset)

	// Execute query
	var users []*domain.User
	err = r.db.SelectContext(ctx, &users, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list users: %w", err)
	}

	return users, total, nil
}

// Email verification operations

// CreateVerificationToken persists a new email verification token
func (r *PostgreSQLAuthRepository) CreateVerificationToken(ctx context.Context, token *domain.VerificationToken) error {
	query := `
		INSERT INTO verification_tokens (id, user_id, token, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`

	_, err := r.db.ExecContext(ctx, query,
		token.ID,
		token.UserID,
		token.Token,
		token.ExpiresAt,
		token.CreatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create verification token: %w", err)
	}

	return nil
}

// GetVerificationToken retrieves a verification token by its token string
func (r *PostgreSQLAuthRepository) GetVerificationToken(ctx context.Context, token string) (*domain.VerificationToken, error) {
	query := `
		SELECT id, user_id, token, expires_at, created_at
		FROM verification_tokens
		WHERE token = $1
	`

	var verificationToken domain.VerificationToken
	err := r.db.GetContext(ctx, &verificationToken, query, token)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ports.ErrTokenNotFound
		}
		return nil, fmt.Errorf("failed to get verification token: %w", err)
	}

	return &verificationToken, nil
}

// DeleteVerificationToken removes a verification token by its ID
func (r *PostgreSQLAuthRepository) DeleteVerificationToken(ctx context.Context, tokenID string) error {
	query := `DELETE FROM verification_tokens WHERE id = $1`

	_, err := r.db.ExecContext(ctx, query, tokenID)
	if err != nil {
		return fmt.Errorf("failed to delete verification token: %w", err)
	}

	return nil
}

// DeleteVerificationTokensByUserID removes all verification tokens for a user
func (r *PostgreSQLAuthRepository) DeleteVerificationTokensByUserID(ctx context.Context, userID string) error {
	query := `DELETE FROM verification_tokens WHERE user_id = $1`

	_, err := r.db.ExecContext(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("failed to delete verification tokens by user ID: %w", err)
	}

	return nil
}

// Password reset operations

// CreatePasswordResetToken persists a new password reset token
func (r *PostgreSQLAuthRepository) CreatePasswordResetToken(ctx context.Context, token *domain.PasswordResetToken) error {
	query := `
		INSERT INTO password_reset_tokens (id, user_id, token, expires_at, used_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`

	_, err := r.db.ExecContext(ctx, query,
		token.ID,
		token.UserID,
		token.Token,
		token.ExpiresAt,
		token.UsedAt,
		token.CreatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create password reset token: %w", err)
	}

	return nil
}

// GetPasswordResetToken retrieves a password reset token by its token string
func (r *PostgreSQLAuthRepository) GetPasswordResetToken(ctx context.Context, token string) (*domain.PasswordResetToken, error) {
	query := `
		SELECT id, user_id, token, expires_at, used_at, created_at
		FROM password_reset_tokens
		WHERE token = $1
	`

	var resetToken domain.PasswordResetToken
	err := r.db.GetContext(ctx, &resetToken, query, token)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ports.ErrTokenNotFound
		}
		return nil, fmt.Errorf("failed to get password reset token: %w", err)
	}

	return &resetToken, nil
}

// MarkPasswordResetTokenAsUsed marks a password reset token as used
func (r *PostgreSQLAuthRepository) MarkPasswordResetTokenAsUsed(ctx context.Context, tokenID string) error {
	query := `
		UPDATE password_reset_tokens
		SET used_at = $2
		WHERE id = $1
	`

	now := time.Now()
	result, err := r.db.ExecContext(ctx, query, tokenID, now)
	if err != nil {
		return fmt.Errorf("failed to mark password reset token as used: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ports.ErrTokenNotFound
	}

	return nil
}

// DeletePasswordResetToken removes a password reset token by its ID
func (r *PostgreSQLAuthRepository) DeletePasswordResetToken(ctx context.Context, tokenID string) error {
	query := `DELETE FROM password_reset_tokens WHERE id = $1`

	_, err := r.db.ExecContext(ctx, query, tokenID)
	if err != nil {
		return fmt.Errorf("failed to delete password reset token: %w", err)
	}

	return nil
}

// DeletePasswordResetTokensByUserID removes all password reset tokens for a user
func (r *PostgreSQLAuthRepository) DeletePasswordResetTokensByUserID(ctx context.Context, userID string) error {
	query := `DELETE FROM password_reset_tokens WHERE user_id = $1`

	_, err := r.db.ExecContext(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("failed to delete password reset tokens by user ID: %w", err)
	}

	return nil
}

// Refresh token operations

// CreateRefreshToken persists a new refresh token
func (r *PostgreSQLAuthRepository) CreateRefreshToken(ctx context.Context, token *domain.RefreshToken) error {
	query := `
		INSERT INTO refresh_tokens (id, user_id, token, expires_at, revoked_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`

	_, err := r.db.ExecContext(ctx, query,
		token.ID,
		token.UserID,
		token.Token,
		token.ExpiresAt,
		token.RevokedAt,
		token.CreatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create refresh token: %w", err)
	}

	return nil
}

// GetRefreshToken retrieves a refresh token by its token string
func (r *PostgreSQLAuthRepository) GetRefreshToken(ctx context.Context, token string) (*domain.RefreshToken, error) {
	query := `
		SELECT id, user_id, token, expires_at, revoked_at, created_at
		FROM refresh_tokens
		WHERE token = $1
	`

	var refreshToken domain.RefreshToken
	err := r.db.GetContext(ctx, &refreshToken, query, token)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ports.ErrTokenNotFound
		}
		return nil, fmt.Errorf("failed to get refresh token: %w", err)
	}

	return &refreshToken, nil
}

// RevokeRefreshToken marks a refresh token as revoked by its ID
func (r *PostgreSQLAuthRepository) RevokeRefreshToken(ctx context.Context, tokenID string) error {
	query := `
		UPDATE refresh_tokens
		SET revoked_at = $2
		WHERE id = $1
	`

	now := time.Now()
	result, err := r.db.ExecContext(ctx, query, tokenID, now)
	if err != nil {
		return fmt.Errorf("failed to revoke refresh token: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ports.ErrTokenNotFound
	}

	return nil
}

// RevokeAllUserRefreshTokens revokes all refresh tokens for a specific user
func (r *PostgreSQLAuthRepository) RevokeAllUserRefreshTokens(ctx context.Context, userID string) error {
	query := `
		UPDATE refresh_tokens
		SET revoked_at = $2
		WHERE user_id = $1 AND revoked_at IS NULL
	`

	now := time.Now()
	_, err := r.db.ExecContext(ctx, query, userID, now)
	if err != nil {
		return fmt.Errorf("failed to revoke all user refresh tokens: %w", err)
	}

	return nil
}

// DeleteExpiredRefreshTokens removes all expired refresh tokens from the database
func (r *PostgreSQLAuthRepository) DeleteExpiredRefreshTokens(ctx context.Context) error {
	query := `DELETE FROM refresh_tokens WHERE expires_at < $1`

	now := time.Now()
	_, err := r.db.ExecContext(ctx, query, now)
	if err != nil {
		return fmt.Errorf("failed to delete expired refresh tokens: %w", err)
	}

	return nil
}

// Utility operations

// EmailExists checks if an email address is already registered
func (r *PostgreSQLAuthRepository) EmailExists(ctx context.Context, email string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`

	var exists bool
	err := r.db.GetContext(ctx, &exists, query, email)
	if err != nil {
		return false, fmt.Errorf("failed to check email existence: %w", err)
	}

	return exists, nil
}

// EmailExistsExcludingUser checks if an email exists for any user except the specified one
func (r *PostgreSQLAuthRepository) EmailExistsExcludingUser(ctx context.Context, email string, userID string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 AND id != $2)`

	var exists bool
	err := r.db.GetContext(ctx, &exists, query, email, userID)
	if err != nil {
		return false, fmt.Errorf("failed to check email existence: %w", err)
	}

	return exists, nil
}

// PostgreSQLUserRepository implements UserRepository interface for PostgreSQL
type PostgreSQLUserRepository struct {
	db *sqlx.DB
}

// NewPostgreSQLUserRepository creates a new PostgreSQL user repository
func NewPostgreSQLUserRepository(db *sqlx.DB) ports.UserRepository {
	return &PostgreSQLUserRepository{db: db}
}

// Profile operations

// UpdateProfile updates a user's profile information
func (r *PostgreSQLUserRepository) UpdateProfile(ctx context.Context, userID string, updates *domain.UpdateProfileDTO) error {
	// Build dynamic update query
	query := `UPDATE users SET updated_at = $1`
	args := []interface{}{time.Now()}
	argPosition := 2

	if updates.FullName != "" {
		query += fmt.Sprintf(", full_name = $%d", argPosition)
		args = append(args, updates.FullName)
		argPosition++
	}

	if updates.Email != "" {
		query += fmt.Sprintf(", email = $%d", argPosition)
		args = append(args, updates.Email)
		argPosition++
	}

	query += fmt.Sprintf(" WHERE id = $%d", argPosition)
	args = append(args, userID)

	result, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("failed to update profile: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ports.ErrUserNotFound
	}

	return nil
}

// ChangePassword updates a user's password hash
func (r *PostgreSQLUserRepository) ChangePassword(ctx context.Context, userID string, newPasswordHash string) error {
	query := `
		UPDATE users
		SET password_hash = $2, updated_at = $3
		WHERE id = $1
	`

	result, err := r.db.ExecContext(ctx, query, userID, newPasswordHash, time.Now())
	if err != nil {
		return fmt.Errorf("failed to change password: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ports.ErrUserNotFound
	}

	return nil
}

// Admin operations

// GetUsersByTenant retrieves all users for a specific tenant with pagination
func (r *PostgreSQLUserRepository) GetUsersByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]*domain.User, int, error) {
	// Get total count
	countQuery := `SELECT COUNT(*) FROM users WHERE tenant_id = $1`
	var total int
	err := r.db.GetContext(ctx, &total, countQuery, tenantID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count users: %w", err)
	}

	// Get paginated users
	offset := (page - 1) * pageSize
	query := `
		SELECT id, tenant_id, email, password_hash, full_name, role, is_verified, created_at, updated_at
		FROM users
		WHERE tenant_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	var users []*domain.User
	err = r.db.SelectContext(ctx, &users, query, tenantID, pageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get users by tenant: %w", err)
	}

	return users, total, nil
}

// GetUsersByRole retrieves users filtered by role for a specific tenant with pagination
func (r *PostgreSQLUserRepository) GetUsersByRole(ctx context.Context, tenantID string, role domain.UserRole, page, pageSize int) ([]*domain.User, int, error) {
	// Get total count
	countQuery := `SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND role = $2`
	var total int
	err := r.db.GetContext(ctx, &total, countQuery, tenantID, role)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count users: %w", err)
	}

	// Get paginated users
	offset := (page - 1) * pageSize
	query := `
		SELECT id, tenant_id, email, password_hash, full_name, role, is_verified, created_at, updated_at
		FROM users
		WHERE tenant_id = $1 AND role = $2
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4
	`

	var users []*domain.User
	err = r.db.SelectContext(ctx, &users, query, tenantID, role, pageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get users by role: %w", err)
	}

	return users, total, nil
}

// CountUsersByTenant returns the total number of users for a specific tenant
func (r *PostgreSQLUserRepository) CountUsersByTenant(ctx context.Context, tenantID string) (int, error) {
	query := `SELECT COUNT(*) FROM users WHERE tenant_id = $1`

	var count int
	err := r.db.GetContext(ctx, &count, query, tenantID)
	if err != nil {
		return 0, fmt.Errorf("failed to count users by tenant: %w", err)
	}

	return count, nil
}

// CountUsersByRole returns the number of users with a specific role in a tenant
func (r *PostgreSQLUserRepository) CountUsersByRole(ctx context.Context, tenantID string, role domain.UserRole) (int, error) {
	query := `SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND role = $2`

	var count int
	err := r.db.GetContext(ctx, &count, query, tenantID, role)
	if err != nil {
		return 0, fmt.Errorf("failed to count users by role: %w", err)
	}

	return count, nil
}

// Batch operations

// GetUsersByIDs retrieves multiple users by their IDs in a single query
func (r *PostgreSQLUserRepository) GetUsersByIDs(ctx context.Context, userIDs []string) ([]*domain.User, error) {
	if len(userIDs) == 0 {
		return []*domain.User{}, nil
	}

	query, args, err := sqlx.In(`
		SELECT id, tenant_id, email, password_hash, full_name, role, is_verified, created_at, updated_at
		FROM users
		WHERE id IN (?)
	`, userIDs)
	if err != nil {
		return nil, fmt.Errorf("failed to build query: %w", err)
	}

	query = r.db.Rebind(query)

	var users []*domain.User
	err = r.db.SelectContext(ctx, &users, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get users by IDs: %w", err)
	}

	return users, nil
}
