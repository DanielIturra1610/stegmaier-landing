package controllers

import (
	"io"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/ports"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// ProfileController handles profile-related HTTP requests
type ProfileController struct {
	profileService ports.ProfileService
}

// NewProfileController creates a new ProfileController
func NewProfileController(profileService ports.ProfileService) *ProfileController {
	return &ProfileController{
		profileService: profileService,
	}
}

// GetMyProfile retrieves the authenticated user's profile
// GET /api/v1/profile/me
func (ctrl *ProfileController) GetMyProfile(c *fiber.Ctx) error {
	// Get user ID from context (set by auth middleware)
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context (set by tenant middleware)
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	profile, err := ctrl.profileService.GetMyProfile(c.Context(), userID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Profile retrieved successfully", profile)
}

// UpdateMyProfile updates the authenticated user's profile
// PUT /api/v1/profile/me
func (ctrl *ProfileController) UpdateMyProfile(c *fiber.Ctx) error {
	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	if err := ctrl.profileService.UpdateMyProfile(c.Context(), userID, tenantID, &req); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Profile updated successfully", nil)
}

// ChangePassword changes the user's password
// POST /api/v1/profile/change-password
func (ctrl *ProfileController) ChangePassword(c *fiber.Ctx) error {
	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.ChangePasswordRequestDTO
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	if err := ctrl.profileService.ChangePassword(c.Context(), userID, tenantID, &req); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Password changed successfully", nil)
}

// UploadAvatar uploads and sets a new avatar for the user
// POST /api/v1/profile/avatar
func (ctrl *ProfileController) UploadAvatar(c *fiber.Ctx) error {
	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Get file from multipart form
	file, err := c.FormFile("avatar")
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Avatar file is required")
	}

	// Open the file
	fileContent, err := file.Open()
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "Failed to read file")
	}
	defer fileContent.Close()

	// Read file content into bytes
	imageData, err := io.ReadAll(fileContent)
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "Failed to read file content")
	}

	// Create upload request
	req := &domain.UploadAvatarRequest{
		Image:       imageData,
		FileName:    file.Filename,
		ContentType: file.Header.Get("Content-Type"),
	}

	// Call service
	response, err := ctrl.profileService.UploadAvatar(c.Context(), userID, tenantID, req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, response.Message, fiber.Map{
		"avatarUrl": response.AvatarURL,
	})
}

// DeleteAvatar removes the user's avatar
// DELETE /api/v1/profile/avatar
func (ctrl *ProfileController) DeleteAvatar(c *fiber.Ctx) error {
	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	response, err := ctrl.profileService.DeleteAvatar(c.Context(), userID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, response.Message, nil)
}

// UpdatePreferences updates the user's preferences
// PUT /api/v1/profile/preferences
func (ctrl *ProfileController) UpdatePreferences(c *fiber.Ctx) error {
	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.UpdatePreferencesRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	if err := ctrl.profileService.UpdatePreferences(c.Context(), userID, tenantID, &req); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Preferences updated successfully", nil)
}

// ============================================================
// Admin Endpoints
// ============================================================

// GetProfile retrieves any user's profile (admin only)
// GET /api/v1/admin/profiles/:id
func (ctrl *ProfileController) GetProfile(c *fiber.Ctx) error {
	// Get target user ID from params
	targetUserID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	profile, err := ctrl.profileService.GetProfile(c.Context(), targetUserID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Profile retrieved successfully", profile)
}

// UpdateProfile updates any user's profile (admin only)
// PUT /api/v1/admin/profiles/:id
func (ctrl *ProfileController) UpdateProfile(c *fiber.Ctx) error {
	// Get target user ID from params
	targetUserID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	if err := ctrl.profileService.UpdateProfile(c.Context(), targetUserID, tenantID, &req); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Profile updated successfully", nil)
}
