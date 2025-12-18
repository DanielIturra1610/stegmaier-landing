package controllers

import (
	"log"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/ports"
	"github.com/gofiber/fiber/v2"
)

// AuthController handles authentication HTTP requests
type AuthController struct {
	authService ports.AuthService
}

// NewAuthController creates a new AuthController
func NewAuthController(authService ports.AuthService) *AuthController {
	return &AuthController{
		authService: authService,
	}
}

// Register handles user registration
// POST /api/v1/auth/register
func (ctrl *AuthController) Register(c *fiber.Ctx) error {
	log.Println("🔵 Register handler called")
	var dto domain.RegisterDTO
	if err := c.BodyParser(&dto); err != nil {
		log.Printf("❌ Body parse error: %v\n", err)
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}
	log.Printf("✅ Body parsed successfully: %s\n", dto.Email)

	// Get tenant ID from context (set by tenant middleware)
	// For public registration without tenant, we'll use empty string
	// The service layer will handle tenant assignment
	tenantID := ""
	if tid := c.Locals("tenant_id"); tid != nil {
		if tidStr, ok := tid.(string); ok {
			tenantID = tidStr
		}
	}
	log.Printf("🔵 TenantID: %s\n", tenantID)

	// Call service using Fiber's context
	log.Println("🔵 Calling authService.Register...")
	response, err := ctrl.authService.Register(c.Context(), tenantID, &dto)
	if err != nil {
		log.Printf("❌ Service error: %v\n", err)
		return HandleError(c, err)
	}

	log.Println("✅ Registration successful")
	return SuccessResponse(c, fiber.StatusCreated, "User registered successfully", response)
}

// Login handles user authentication
// POST /api/v1/auth/login
func (ctrl *AuthController) Login(c *fiber.Ctx) error {
	var dto domain.LoginDTO
	if err := c.BodyParser(&dto); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Get tenant ID from context (may be empty for users without tenant)
	tenantID := ""
	if tid := c.Locals("tenant_id"); tid != nil {
		if tidStr, ok := tid.(string); ok {
			tenantID = tidStr
		}
	}

	// Call service using Fiber's context
	response, err := ctrl.authService.Login(c.Context(), tenantID, &dto)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Login successful", response)
}

// Logout handles user logout
// POST /api/v1/auth/logout
func (ctrl *AuthController) Logout(c *fiber.Ctx) error {
	var dto domain.RefreshTokenDTO
	if err := c.BodyParser(&dto); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Get user ID from context (set by auth middleware)
	userID := c.Locals("userID").(string)

	// Call service using Fiber's context
	err := ctrl.authService.Logout(c.Context(), userID, dto.RefreshToken)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Logout successful", nil)
}

// RefreshToken handles token refresh
// POST /api/v1/auth/refresh
func (ctrl *AuthController) RefreshToken(c *fiber.Ctx) error {
	var dto domain.RefreshTokenDTO
	if err := c.BodyParser(&dto); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service using Fiber's context
	response, err := ctrl.authService.RefreshAccessToken(c.Context(), &dto)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Token refreshed successfully", response)
}

// VerifyEmail handles email verification
// POST /api/v1/auth/verify-email
func (ctrl *AuthController) VerifyEmail(c *fiber.Ctx) error {
	var dto domain.VerifyEmailDTO
	if err := c.BodyParser(&dto); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service using Fiber's context
	err := ctrl.authService.VerifyEmail(c.Context(), &dto)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Email verified successfully", nil)
}

// ResendVerification handles resending verification email
// POST /api/v1/auth/resend-verification
func (ctrl *AuthController) ResendVerification(c *fiber.Ctx) error {
	var dto domain.ResendVerificationDTO
	if err := c.BodyParser(&dto); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service using Fiber's context
	err := ctrl.authService.ResendVerification(c.Context(), &dto)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Verification email sent successfully", nil)
}

// ForgotPassword handles password reset request
// POST /api/v1/auth/forgot-password
func (ctrl *AuthController) ForgotPassword(c *fiber.Ctx) error {
	var dto domain.ForgotPasswordDTO
	if err := c.BodyParser(&dto); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Get tenant ID from context
	tenantID := c.Locals("tenant_id").(string)

	// Call service using Fiber's context
	err := ctrl.authService.ForgotPassword(c.Context(), tenantID, &dto)
	if err != nil {
		return HandleError(c, err)
	}

	// Always return success for security (don't reveal if email exists)
	return SuccessResponse(c, fiber.StatusOK, "If the email exists, a password reset link has been sent", nil)
}

// ResetPassword handles password reset
// POST /api/v1/auth/reset-password
func (ctrl *AuthController) ResetPassword(c *fiber.Ctx) error {
	var dto domain.ResetPasswordDTO
	if err := c.BodyParser(&dto); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service using Fiber's context
	err := ctrl.authService.ResetPassword(c.Context(), &dto)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Password reset successfully", nil)
}

// ChangePassword handles password change for authenticated users
// POST /api/v1/auth/change-password
func (ctrl *AuthController) ChangePassword(c *fiber.Ctx) error {
	var dto domain.ChangePasswordDTO
	if err := c.BodyParser(&dto); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Get user ID from context (set by auth middleware)
	userID := c.Locals("userID").(string)

	// Call service using Fiber's context
	err := ctrl.authService.ChangePassword(c.Context(), userID, &dto)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Password changed successfully", nil)
}

// GetCurrentUser handles getting current user profile
// GET /api/v1/auth/me
func (ctrl *AuthController) GetCurrentUser(c *fiber.Ctx) error {
	// Get user ID from context (set by auth middleware)
	userID := c.Locals("userID").(string)

	// Call service using Fiber's context
	user, err := ctrl.authService.GetCurrentUser(c.Context(), userID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "User retrieved successfully", user)
}

// UpdateProfile handles updating user profile
// PUT /api/v1/auth/profile
func (ctrl *AuthController) UpdateProfile(c *fiber.Ctx) error {
	var dto domain.UpdateProfileDTO
	if err := c.BodyParser(&dto); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Get user ID from context (set by auth middleware)
	userID := c.Locals("userID").(string)

	// Call service using Fiber's context
	user, err := ctrl.authService.UpdateProfile(c.Context(), userID, &dto)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Profile updated successfully", user)
}

// RevokeAllSessions handles revoking all user sessions
// POST /api/v1/auth/revoke-sessions
func (ctrl *AuthController) RevokeAllSessions(c *fiber.Ctx) error {
	// Get user ID from context (set by auth middleware)
	userID := c.Locals("userID").(string)

	// Call service using Fiber's context
	err := ctrl.authService.RevokeAllSessions(c.Context(), userID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "All sessions revoked successfully", nil)
}

// SwitchRole handles switching between user's assigned roles
// POST /api/v1/auth/switch-role
func (ctrl *AuthController) SwitchRole(c *fiber.Ctx) error {
	var dto domain.SwitchRoleDTO
	if err := c.BodyParser(&dto); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Get user ID from context (set by auth middleware)
	userID := c.Locals("userID").(string)

	// Get tenant ID from context
	tenantID := ""
	if tid := c.Locals("tenant_id"); tid != nil {
		if tidStr, ok := tid.(string); ok {
			tenantID = tidStr
		}
	}

	// Call service using Fiber's context
	response, err := ctrl.authService.SwitchRole(c.Context(), userID, tenantID, &dto)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Role switched successfully", response)
}
