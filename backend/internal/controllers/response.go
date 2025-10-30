package controllers

import (
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/ports"
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
	case ports.ErrUserNotFound:
		return fiber.StatusNotFound, "User not found"
	case ports.ErrEmailAlreadyExists:
		return fiber.StatusConflict, "Email already exists"
	case ports.ErrUserAlreadyExists:
		return fiber.StatusConflict, "User already exists"

	// Authentication errors
	case ports.ErrInvalidCredentials:
		return fiber.StatusUnauthorized, "Invalid email or password"
	case ports.ErrAccountNotVerified:
		return fiber.StatusForbidden, "Account not verified. Please check your email"
	case ports.ErrAccountLocked:
		return fiber.StatusForbidden, "Account is locked. Please contact support"
	case ports.ErrAccountDisabled:
		return fiber.StatusForbidden, "Account is disabled"

	// Token errors
	case ports.ErrInvalidToken:
		return fiber.StatusUnauthorized, "Invalid or malformed token"
	case ports.ErrTokenExpired:
		return fiber.StatusUnauthorized, "Token has expired"
	case ports.ErrTokenRevoked:
		return fiber.StatusUnauthorized, "Token has been revoked"
	case ports.ErrTokenNotFound:
		return fiber.StatusNotFound, "Token not found"
	case ports.ErrRefreshTokenInvalid:
		return fiber.StatusUnauthorized, "Invalid refresh token"

	// Email verification errors
	case ports.ErrVerificationTokenInvalid:
		return fiber.StatusBadRequest, "Invalid verification token"
	case ports.ErrVerificationTokenExpired:
		return fiber.StatusBadRequest, "Verification token has expired"
	case ports.ErrAlreadyVerified:
		return fiber.StatusBadRequest, "Email already verified"

	// Password errors
	case ports.ErrPasswordTooWeak:
		return fiber.StatusBadRequest, "Password doesn't meet security requirements"
	case ports.ErrPasswordTooLong:
		return fiber.StatusBadRequest, "Password exceeds maximum length"
	case ports.ErrPasswordSameAsOld:
		return fiber.StatusBadRequest, "New password must be different from old password"
	case ports.ErrCurrentPasswordIncorrect:
		return fiber.StatusBadRequest, "Current password is incorrect"
	case ports.ErrPasswordResetTokenInvalid:
		return fiber.StatusBadRequest, "Invalid password reset token"
	case ports.ErrPasswordResetTokenExpired:
		return fiber.StatusBadRequest, "Password reset token has expired"
	case ports.ErrPasswordResetTokenUsed:
		return fiber.StatusBadRequest, "Password reset token has already been used"

	// Authorization errors
	case ports.ErrUnauthorized:
		return fiber.StatusUnauthorized, "Unauthorized access"
	case ports.ErrForbidden:
		return fiber.StatusForbidden, "Forbidden: insufficient permissions"
	case ports.ErrInvalidRole:
		return fiber.StatusBadRequest, "Invalid user role"

	// Validation errors
	case ports.ErrInvalidEmail:
		return fiber.StatusBadRequest, "Invalid email format"
	case ports.ErrInvalidInput:
		return fiber.StatusBadRequest, "Invalid input data"
	case ports.ErrMissingRequiredField:
		return fiber.StatusBadRequest, "Missing required field"

	// Tenant errors
	case ports.ErrTenantNotFound:
		return fiber.StatusNotFound, "Tenant not found"
	case ports.ErrTenantInactive:
		return fiber.StatusForbidden, "Tenant is inactive"
	case ports.ErrTenantMismatch:
		return fiber.StatusForbidden, "User does not belong to this tenant"

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
