package ports

import (
	"context"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/domain"
)

// EmailService defines the interface for sending emails from the auth module.
// This interface allows the auth service to send verification and password reset emails
// without depending directly on the email implementation.
type EmailService interface {
	// SendWelcomeEmail sends a welcome email with verification link to a new user.
	SendWelcomeEmail(ctx context.Context, to, userName, verificationToken string) error

	// SendPasswordResetEmail sends a password reset email with reset link.
	SendPasswordResetEmail(ctx context.Context, to, userName, resetToken string) error
}

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

	// GetFirstActiveMembership retrieves the first active tenant membership for a user.
	// This is used during login to determine the user's tenant when they don't have
	// a tenant_id set in their user record. Returns nil, nil if no membership exists.
	GetFirstActiveMembership(ctx context.Context, userID string) (*domain.UserMembership, error)
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

// AuthService defines the interface for authentication business logic.
// This interface encapsulates all authentication-related use cases and business rules.
// It sits between the presentation layer (controllers) and the data layer (repositories),
// orchestrating the business logic and ensuring proper validation and error handling.
//
// All methods return domain-specific errors that can be mapped to appropriate
// HTTP status codes by the presentation layer.
type AuthService interface {
	// Authentication operations

	// Register creates a new user account with email verification.
	// It validates the input, hashes the password, creates the user,
	// generates a verification token, and sends a verification email.
	// Returns ErrEmailAlreadyExists if the email is already registered.
	Register(ctx context.Context, tenantID string, dto *domain.RegisterDTO) (*domain.AuthResponse, error)

	// Login authenticates a user with email and password.
	// It validates credentials, checks if the account is verified,
	// generates JWT access and refresh tokens.
	// Returns ErrInvalidCredentials if credentials are incorrect,
	// or ErrAccountNotVerified if the email hasn't been verified.
	Login(ctx context.Context, tenantID string, dto *domain.LoginDTO) (*domain.AuthResponse, error)

	// Logout invalidates a user's refresh token.
	// This effectively logs out the user from the specific device/session.
	Logout(ctx context.Context, userID string, refreshToken string) error

	// RefreshAccessToken generates a new access token using a valid refresh token.
	// This allows users to maintain their session without re-authenticating.
	// Returns ErrRefreshTokenInvalid if the refresh token is invalid or expired.
	RefreshAccessToken(ctx context.Context, dto *domain.RefreshTokenDTO) (*domain.AuthResponse, error)

	// RevokeAllSessions revokes all refresh tokens for a user.
	// This logs out the user from all devices and is useful for security purposes
	// (e.g., when password is changed or suspicious activity is detected).
	RevokeAllSessions(ctx context.Context, userID string) error

	// Email verification operations

	// VerifyEmail verifies a user's email address using a verification token.
	// Once verified, the user can fully access the system.
	// Returns ErrVerificationTokenInvalid or ErrVerificationTokenExpired on failure.
	VerifyEmail(ctx context.Context, dto *domain.VerifyEmailDTO) error

	// ResendVerification generates and sends a new verification email.
	// This is useful when the original verification email was lost or expired.
	// Returns ErrAlreadyVerified if the user is already verified.
	ResendVerification(ctx context.Context, dto *domain.ResendVerificationDTO) error

	// Password management operations

	// ForgotPassword initiates the password reset process.
	// It generates a password reset token and sends it via email.
	// For security reasons, it always returns success even if the email doesn't exist.
	ForgotPassword(ctx context.Context, tenantID string, dto *domain.ForgotPasswordDTO) error

	// ResetPassword resets a user's password using a valid reset token.
	// It validates the token, hashes the new password, and updates the user record.
	// Returns ErrPasswordResetTokenInvalid or ErrPasswordResetTokenExpired on failure.
	ResetPassword(ctx context.Context, dto *domain.ResetPasswordDTO) error

	// ChangePassword changes a user's password after verifying their current password.
	// This is used when a user wants to change their password from within the app.
	// Returns ErrCurrentPasswordIncorrect if the current password is wrong.
	ChangePassword(ctx context.Context, userID string, dto *domain.ChangePasswordDTO) error

	// User profile operations

	// GetCurrentUser retrieves the authenticated user's profile information.
	// Returns a sanitized UserDTO without sensitive information.
	GetCurrentUser(ctx context.Context, userID string) (*domain.UserDTO, error)

	// UpdateProfile updates a user's profile information (name, email, etc.).
	// It validates the input and checks for email uniqueness if email is being updated.
	// Returns ErrEmailAlreadyExists if the new email is already in use.
	UpdateProfile(ctx context.Context, userID string, dto *domain.UpdateProfileDTO) (*domain.UserDTO, error)

	// Multi-role operations

	// SwitchRole allows a user with multiple roles to switch their active role.
	// It validates that the requested role is assigned to the user,
	// updates the active role, and generates a new JWT token with the new active role.
	// Returns ErrRoleNotAssigned if the role is not assigned to the user.
	SwitchRole(ctx context.Context, userID string, tenantID string, dto *domain.SwitchRoleDTO) (*domain.SwitchRoleResponse, error)
}

// UserManagementService defines the interface for user management operations.
// This is separated from AuthService for better separation of concerns.
// While AuthService handles authentication and self-service user operations,
// UserManagementService focuses on administrative operations that require
// elevated privileges (admin or system operations).
type UserManagementService interface {
	// Admin operations - User CRUD

	// CreateUser creates a new user account by an administrator.
	// Unlike Register, this can set the user as verified immediately
	// and assign any role. It validates the input and ensures email uniqueness.
	// Returns ErrEmailAlreadyExists if the email is already registered.
	CreateUser(ctx context.Context, tenantID string, dto *domain.CreateUserDTO) (*domain.UserDTO, error)

	// GetUserByID retrieves a user's information by their ID.
	// This is an administrative operation that returns full user details.
	// Returns ErrUserNotFound if the user doesn't exist.
	GetUserByID(ctx context.Context, tenantID string, userID string) (*domain.UserDTO, error)

	// UpdateUser updates a user's information by an administrator.
	// This allows updating any user field including role and verification status.
	// Returns ErrUserNotFound if the user doesn't exist.
	UpdateUser(ctx context.Context, tenantID string, userID string, dto *domain.UpdateUserDTO) (*domain.UserDTO, error)

	// DeleteUser permanently removes a user from the system.
	// This also removes all associated tokens and sessions.
	// Returns ErrUserNotFound if the user doesn't exist.
	DeleteUser(ctx context.Context, tenantID string, userID string) error

	// ListUsers retrieves a paginated list of users with optional filtering.
	// Filters can include role, verification status, and search terms.
	// Returns the list of users, total count, and an error if the operation fails.
	ListUsers(ctx context.Context, tenantID string, filters *domain.UserListFilters, page, pageSize int) ([]*domain.UserDTO, int, error)

	// Admin operations - User statistics

	// GetUsersByTenant retrieves all users for a specific tenant with pagination.
	// This is useful for tenant management and analytics.
	GetUsersByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]*domain.UserDTO, int, error)

	// GetUsersByRole retrieves users filtered by a specific role with pagination.
	// This helps administrators manage users with specific privileges.
	GetUsersByRole(ctx context.Context, tenantID string, role domain.UserRole, page, pageSize int) ([]*domain.UserDTO, int, error)

	// CountUsersByTenant returns the total number of users in a tenant.
	// Useful for analytics and tenant capacity planning.
	CountUsersByTenant(ctx context.Context, tenantID string) (int, error)

	// CountUsersByRole returns the number of users with a specific role.
	// Useful for role-based analytics and capacity planning.
	CountUsersByRole(ctx context.Context, tenantID string, role domain.UserRole) (int, error)

	// Admin operations - Batch operations

	// GetUsersByIDs retrieves multiple users by their IDs in a single operation.
	// This is efficient for bulk operations and reduces database queries.
	GetUsersByIDs(ctx context.Context, tenantID string, userIDs []string) ([]*domain.UserDTO, error)

	// Admin operations - User verification

	// VerifyUserByAdmin manually verifies a user's email by an administrator.
	// This bypasses the normal email verification flow.
	VerifyUserByAdmin(ctx context.Context, tenantID string, userID string) error

	// UnverifyUser removes a user's verification status.
	// This might be used if a user's email bounces or for security reasons.
	UnverifyUser(ctx context.Context, tenantID string, userID string) error

	// Admin operations - User password management

	// ResetUserPassword resets a user's password by an administrator.
	// This bypasses the normal password reset flow and can be used
	// when a user is locked out or for security purposes.
	ResetUserPassword(ctx context.Context, tenantID string, userID string, newPassword string) error

	// ForcePasswordChange flags a user account to require password change on next login.
	// This is useful for security policies or when a password compromise is suspected.
	ForcePasswordChange(ctx context.Context, tenantID string, userID string) error
}
