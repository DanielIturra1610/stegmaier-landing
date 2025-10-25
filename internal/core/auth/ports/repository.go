package ports

import (
	"context"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/domain"
)

// AuthRepository defines the interface for authentication data persistence.
// This interface abstracts the data layer operations for the authentication domain,
// following the hexagonal architecture pattern. Implementations should handle
// all database interactions and data persistence logic.
//
// All methods accept a context.Context as the first parameter for cancellation
// and deadline support. Methods should return domain-specific errors when
// operations fail.
type AuthRepository interface {
	// User operations

	// CreateUser persists a new user to the database.
	// Returns an error if the email already exists or if the operation fails.
	CreateUser(ctx context.Context, user *domain.User) error

	// GetUserByID retrieves a user by their unique identifier.
	// Returns ErrUserNotFound if the user doesn't exist.
	GetUserByID(ctx context.Context, userID string) (*domain.User, error)

	// GetUserByEmail retrieves a user by their email address.
	// Returns ErrUserNotFound if no user exists with the given email.
	GetUserByEmail(ctx context.Context, email string) (*domain.User, error)

	// UpdateUser updates an existing user's information.
	// Returns an error if the user doesn't exist or if the operation fails.
	UpdateUser(ctx context.Context, user *domain.User) error

	// DeleteUser removes a user from the database.
	// Returns an error if the user doesn't exist or if the operation fails.
	DeleteUser(ctx context.Context, userID string) error

	// ListUsers retrieves a paginated list of users with optional filtering.
	// Returns the list of users, total count, and an error if the operation fails.
	ListUsers(ctx context.Context, filters *domain.UserListFilters, page, pageSize int) ([]*domain.User, int, error)

	// Email verification operations

	// CreateVerificationToken persists a new email verification token.
	// Returns an error if the operation fails.
	CreateVerificationToken(ctx context.Context, token *domain.VerificationToken) error

	// GetVerificationToken retrieves a verification token by its token string.
	// Returns ErrTokenNotFound if the token doesn't exist.
	GetVerificationToken(ctx context.Context, token string) (*domain.VerificationToken, error)

	// DeleteVerificationToken removes a verification token by its ID.
	// Returns an error if the operation fails.
	DeleteVerificationToken(ctx context.Context, tokenID string) error

	// DeleteVerificationTokensByUserID removes all verification tokens for a user.
	// This is useful when a user is deleted or verified.
	DeleteVerificationTokensByUserID(ctx context.Context, userID string) error

	// Password reset operations

	// CreatePasswordResetToken persists a new password reset token.
	// Returns an error if the operation fails.
	CreatePasswordResetToken(ctx context.Context, token *domain.PasswordResetToken) error

	// GetPasswordResetToken retrieves a password reset token by its token string.
	// Returns ErrTokenNotFound if the token doesn't exist.
	GetPasswordResetToken(ctx context.Context, token string) (*domain.PasswordResetToken, error)

	// MarkPasswordResetTokenAsUsed marks a password reset token as used.
	// Returns an error if the token doesn't exist or if the operation fails.
	MarkPasswordResetTokenAsUsed(ctx context.Context, tokenID string) error

	// DeletePasswordResetToken removes a password reset token by its ID.
	// Returns an error if the operation fails.
	DeletePasswordResetToken(ctx context.Context, tokenID string) error

	// DeletePasswordResetTokensByUserID removes all password reset tokens for a user.
	// This is useful when a user is deleted or changes their password.
	DeletePasswordResetTokensByUserID(ctx context.Context, userID string) error

	// Refresh token operations

	// CreateRefreshToken persists a new refresh token.
	// Returns an error if the operation fails.
	CreateRefreshToken(ctx context.Context, token *domain.RefreshToken) error

	// GetRefreshToken retrieves a refresh token by its token string.
	// Returns ErrTokenNotFound if the token doesn't exist.
	GetRefreshToken(ctx context.Context, token string) (*domain.RefreshToken, error)

	// RevokeRefreshToken marks a refresh token as revoked by its ID.
	// Returns an error if the token doesn't exist or if the operation fails.
	RevokeRefreshToken(ctx context.Context, tokenID string) error

	// RevokeAllUserRefreshTokens revokes all refresh tokens for a specific user.
	// This is useful for "logout from all devices" functionality.
	RevokeAllUserRefreshTokens(ctx context.Context, userID string) error

	// DeleteExpiredRefreshTokens removes all expired refresh tokens from the database.
	// This should be called periodically to clean up old tokens.
	DeleteExpiredRefreshTokens(ctx context.Context) error

	// Utility operations

	// EmailExists checks if an email address is already registered.
	// Returns true if the email exists, false otherwise.
	EmailExists(ctx context.Context, email string) (bool, error)

	// EmailExistsExcludingUser checks if an email exists for any user except the specified one.
	// This is useful when updating a user's email to ensure uniqueness.
	EmailExistsExcludingUser(ctx context.Context, email string, userID string) (bool, error)
}

// UserRepository defines extended user management operations.
// This is separated from AuthRepository for better separation of concerns.
// While AuthRepository handles authentication-specific operations,
// UserRepository focuses on user profile and administrative operations.
type UserRepository interface {
	// Profile operations

	// UpdateProfile updates a user's profile information (name, email, etc.).
	// Returns an error if the user doesn't exist or if the operation fails.
	UpdateProfile(ctx context.Context, userID string, updates *domain.UpdateProfileDTO) error

	// ChangePassword updates a user's password hash.
	// The newPasswordHash should already be hashed by the service layer.
	ChangePassword(ctx context.Context, userID string, newPasswordHash string) error

	// Admin operations

	// GetUsersByTenant retrieves all users for a specific tenant with pagination.
	// Returns the list of users, total count, and an error if the operation fails.
	GetUsersByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]*domain.User, int, error)

	// GetUsersByRole retrieves users filtered by role for a specific tenant with pagination.
	// Returns the list of users, total count, and an error if the operation fails.
	GetUsersByRole(ctx context.Context, tenantID string, role domain.UserRole, page, pageSize int) ([]*domain.User, int, error)

	// CountUsersByTenant returns the total number of users for a specific tenant.
	CountUsersByTenant(ctx context.Context, tenantID string) (int, error)

	// CountUsersByRole returns the number of users with a specific role in a tenant.
	CountUsersByRole(ctx context.Context, tenantID string, role domain.UserRole) (int, error)

	// Batch operations

	// GetUsersByIDs retrieves multiple users by their IDs in a single query.
	// This is useful for batch operations and reducing database round trips.
	GetUsersByIDs(ctx context.Context, userIDs []string) ([]*domain.User, error)
}
