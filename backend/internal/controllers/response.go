package controllers

import (
	authPorts "github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/ports"
	profilePorts "github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/ports"
	"github.com/gofiber/fiber/v2"
)

// APIResponse represents a standard API response
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// SuccessResponse sends a successful response
func SuccessResponse(c *fiber.Ctx, statusCode int, message string, data interface{}) error {
	return c.Status(statusCode).JSON(APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// ErrorResponse sends an error response
func ErrorResponse(c *fiber.Ctx, statusCode int, message string) error {
	return c.Status(statusCode).JSON(APIResponse{
		Success: false,
		Error:   message,
	})
}

// MapDomainError maps domain errors to HTTP status codes
func MapDomainError(err error) (int, string) {
	switch err {
	// User errors
	case authPorts.ErrUserNotFound:
		return fiber.StatusNotFound, "User not found"
	case authPorts.ErrEmailAlreadyExists:
		return fiber.StatusConflict, "Email already exists"
	case authPorts.ErrUserAlreadyExists:
		return fiber.StatusConflict, "User already exists"

	// Authentication errors
	case authPorts.ErrInvalidCredentials:
		return fiber.StatusUnauthorized, "Invalid email or password"
	case authPorts.ErrAccountNotVerified:
		return fiber.StatusForbidden, "Account not verified. Please check your email"
	case authPorts.ErrAccountLocked:
		return fiber.StatusForbidden, "Account is locked. Please contact support"
	case authPorts.ErrAccountDisabled:
		return fiber.StatusForbidden, "Account is disabled"

	// Token errors
	case authPorts.ErrInvalidToken:
		return fiber.StatusUnauthorized, "Invalid or malformed token"
	case authPorts.ErrTokenExpired:
		return fiber.StatusUnauthorized, "Token has expired"
	case authPorts.ErrTokenRevoked:
		return fiber.StatusUnauthorized, "Token has been revoked"
	case authPorts.ErrTokenNotFound:
		return fiber.StatusNotFound, "Token not found"
	case authPorts.ErrRefreshTokenInvalid:
		return fiber.StatusUnauthorized, "Invalid refresh token"

	// Email verification errors
	case authPorts.ErrVerificationTokenInvalid:
		return fiber.StatusBadRequest, "Invalid verification token"
	case authPorts.ErrVerificationTokenExpired:
		return fiber.StatusBadRequest, "Verification token has expired"
	case authPorts.ErrAlreadyVerified:
		return fiber.StatusBadRequest, "Email already verified"

	// Password errors
	case authPorts.ErrPasswordTooWeak:
		return fiber.StatusBadRequest, "Password doesn't meet security requirements"
	case authPorts.ErrPasswordTooLong:
		return fiber.StatusBadRequest, "Password exceeds maximum length"
	case authPorts.ErrPasswordSameAsOld:
		return fiber.StatusBadRequest, "New password must be different from old password"
	case authPorts.ErrCurrentPasswordIncorrect:
		return fiber.StatusBadRequest, "Current password is incorrect"
	case authPorts.ErrPasswordResetTokenInvalid:
		return fiber.StatusBadRequest, "Invalid password reset token"
	case authPorts.ErrPasswordResetTokenExpired:
		return fiber.StatusBadRequest, "Password reset token has expired"
	case authPorts.ErrPasswordResetTokenUsed:
		return fiber.StatusBadRequest, "Password reset token has already been used"

	// Authorization errors
	case authPorts.ErrUnauthorized:
		return fiber.StatusUnauthorized, "Unauthorized access"
	case authPorts.ErrForbidden:
		return fiber.StatusForbidden, "Forbidden: insufficient permissions"
	case authPorts.ErrInvalidRole:
		return fiber.StatusBadRequest, "Invalid user role"

	// Validation errors
	case authPorts.ErrInvalidEmail:
		return fiber.StatusBadRequest, "Invalid email format"
	case authPorts.ErrInvalidInput:
		return fiber.StatusBadRequest, "Invalid input data"
	case authPorts.ErrMissingRequiredField:
		return fiber.StatusBadRequest, "Missing required field"

	// Tenant errors
	case authPorts.ErrTenantNotFound:
		return fiber.StatusNotFound, "Tenant not found"
	case authPorts.ErrTenantInactive:
		return fiber.StatusForbidden, "Tenant is inactive"
	case authPorts.ErrTenantMismatch:
		return fiber.StatusForbidden, "User does not belong to this tenant"

	// Profile errors
	case profilePorts.ErrProfileNotFound:
		return fiber.StatusNotFound, "Profile not found"
	case profilePorts.ErrInvalidInput:
		return fiber.StatusBadRequest, "Invalid input data"
	case profilePorts.ErrInvalidPassword:
		return fiber.StatusBadRequest, "Invalid password"
	case profilePorts.ErrUnauthorized:
		return fiber.StatusUnauthorized, "Unauthorized access"
	case profilePorts.ErrUpdateFailed:
		return fiber.StatusInternalServerError, "Failed to update profile"
	case profilePorts.ErrInvalidFileFormat:
		return fiber.StatusBadRequest, "Invalid file format. Only JPEG, PNG, and WebP are allowed"
	case profilePorts.ErrFileTooLarge:
		return fiber.StatusBadRequest, "File size exceeds maximum allowed (5MB)"
	case profilePorts.ErrFileUploadFailed:
		return fiber.StatusInternalServerError, "Failed to upload file"
	case profilePorts.ErrFileDeleteFailed:
		return fiber.StatusInternalServerError, "Failed to delete file"

	// Default
	default:
		return fiber.StatusInternalServerError, "Internal server error"
	}
}

// HandleError processes an error and sends appropriate response
func HandleError(c *fiber.Ctx, err error) error {
	statusCode, message := MapDomainError(err)
	return ErrorResponse(c, statusCode, message)
}
