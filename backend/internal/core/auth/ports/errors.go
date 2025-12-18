package ports

import "errors"

// Authentication errors
var (
	// ErrInvalidCredentials is returned when login credentials are incorrect
	ErrInvalidCredentials = errors.New("invalid email or password")

	// ErrAccountNotVerified is returned when user tries to login without verifying email
	ErrAccountNotVerified = errors.New("account not verified, please check your email")

	// ErrAccountLocked is returned when user account is locked
	ErrAccountLocked = errors.New("account is locked, please contact support")

	// ErrAccountDisabled is returned when user account is disabled
	ErrAccountDisabled = errors.New("account is disabled")
)

// User errors
var (
	// ErrUserNotFound is returned when user doesn't exist
	ErrUserNotFound = errors.New("user not found")

	// ErrEmailAlreadyExists is returned when trying to register with existing email
	ErrEmailAlreadyExists = errors.New("email already registered")

	// ErrUserAlreadyExists is returned when user already exists
	ErrUserAlreadyExists = errors.New("user already exists")

	// ErrUserCreationFailed is returned when user creation fails
	ErrUserCreationFailed = errors.New("failed to create user")
)

// Token errors
var (
	// ErrInvalidToken is returned when token is invalid or malformed
	ErrInvalidToken = errors.New("invalid or malformed token")

	// ErrTokenExpired is returned when token has expired
	ErrTokenExpired = errors.New("token has expired")

	// ErrTokenRevoked is returned when token has been revoked
	ErrTokenRevoked = errors.New("token has been revoked")

	// ErrTokenNotFound is returned when token doesn't exist
	ErrTokenNotFound = errors.New("token not found")

	// ErrRefreshTokenInvalid is returned when refresh token is invalid
	ErrRefreshTokenInvalid = errors.New("invalid refresh token")

	// ErrTokenGenerationFailed is returned when token generation fails
	ErrTokenGenerationFailed = errors.New("failed to generate token")
)

// Email verification errors
var (
	// ErrVerificationTokenInvalid is returned when verification token is invalid
	ErrVerificationTokenInvalid = errors.New("invalid verification token")

	// ErrVerificationTokenExpired is returned when verification token has expired
	ErrVerificationTokenExpired = errors.New("verification token has expired")

	// ErrAlreadyVerified is returned when user is already verified
	ErrAlreadyVerified = errors.New("email already verified")

	// ErrVerificationEmailFailed is returned when sending verification email fails
	ErrVerificationEmailFailed = errors.New("failed to send verification email")
)

// Password errors
var (
	// ErrPasswordTooWeak is returned when password doesn't meet security requirements
	ErrPasswordTooWeak = errors.New("password doesn't meet security requirements")

	// ErrPasswordTooLong is returned when password exceeds maximum length
	ErrPasswordTooLong = errors.New("password exceeds maximum length of 72 characters")

	// ErrPasswordSameAsOld is returned when new password is same as old password
	ErrPasswordSameAsOld = errors.New("new password must be different from old password")

	// ErrCurrentPasswordIncorrect is returned when current password is wrong
	ErrCurrentPasswordIncorrect = errors.New("current password is incorrect")

	// ErrPasswordResetTokenInvalid is returned when password reset token is invalid
	ErrPasswordResetTokenInvalid = errors.New("invalid password reset token")

	// ErrPasswordResetTokenExpired is returned when password reset token has expired
	ErrPasswordResetTokenExpired = errors.New("password reset token has expired")

	// ErrPasswordResetTokenUsed is returned when password reset token was already used
	ErrPasswordResetTokenUsed = errors.New("password reset token has already been used")

	// ErrPasswordResetEmailFailed is returned when sending password reset email fails
	ErrPasswordResetEmailFailed = errors.New("failed to send password reset email")
)

// Authorization errors
var (
	// ErrUnauthorized is returned when user is not authorized
	ErrUnauthorized = errors.New("unauthorized access")

	// ErrForbidden is returned when user doesn't have permission
	ErrForbidden = errors.New("forbidden: insufficient permissions")

	// ErrInvalidRole is returned when role is invalid
	ErrInvalidRole = errors.New("invalid user role")

	// ErrRoleNotAssigned is returned when trying to set an active role that user doesn't have
	ErrRoleNotAssigned = errors.New("role not assigned to user")
)

// Validation errors
var (
	// ErrInvalidEmail is returned when email format is invalid
	ErrInvalidEmail = errors.New("invalid email format")

	// ErrInvalidInput is returned when input validation fails
	ErrInvalidInput = errors.New("invalid input data")

	// ErrMissingRequiredField is returned when required field is missing
	ErrMissingRequiredField = errors.New("missing required field")
)

// Database errors
var (
	// ErrDatabaseConnection is returned when database connection fails
	ErrDatabaseConnection = errors.New("database connection error")

	// ErrDatabaseQuery is returned when database query fails
	ErrDatabaseQuery = errors.New("database query error")

	// ErrTransactionFailed is returned when database transaction fails
	ErrTransactionFailed = errors.New("database transaction failed")
)

// Tenant errors
var (
	// ErrTenantNotFound is returned when tenant doesn't exist
	ErrTenantNotFound = errors.New("tenant not found")

	// ErrTenantInactive is returned when tenant is inactive
	ErrTenantInactive = errors.New("tenant is inactive")

	// ErrTenantMismatch is returned when user doesn't belong to tenant
	ErrTenantMismatch = errors.New("user does not belong to this tenant")
)

// General errors
var (
	// ErrInternalServer is returned for unexpected internal errors
	ErrInternalServer = errors.New("internal server error")

	// ErrServiceUnavailable is returned when service is temporarily unavailable
	ErrServiceUnavailable = errors.New("service temporarily unavailable")

	// ErrOperationFailed is returned when an operation fails
	ErrOperationFailed = errors.New("operation failed")
)
