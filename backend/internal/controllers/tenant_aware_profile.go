package controllers

import (
	"io"
	"log"

	authPorts "github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/ports"
	profileadapters "github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/adapters"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/ports"
	profileservices "github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/services"
	"github.com/DanielIturra1610/stegmaier-landing/internal/middleware"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/hasher"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// TenantAwareProfileController handles profile-related HTTP requests with dynamic tenant DB connection
// This controller creates repositories and services dynamically using the tenant DB from context
type TenantAwareProfileController struct {
	authRepo       authPorts.AuthRepository
	userRepo       authPorts.UserRepository
	fileStorage    ports.FileStorageService
	passwordHasher hasher.PasswordHasher
}

// NewTenantAwareProfileController creates a new TenantAwareProfileController
func NewTenantAwareProfileController(
	authRepo authPorts.AuthRepository,
	userRepo authPorts.UserRepository,
	fileStorage ports.FileStorageService,
	passwordHasher hasher.PasswordHasher,
) *TenantAwareProfileController {
	return &TenantAwareProfileController{
		authRepo:       authRepo,
		userRepo:       userRepo,
		fileStorage:    fileStorage,
		passwordHasher: passwordHasher,
	}
}

// getProfileService creates a profile service using the tenant DB from context
func (ctrl *TenantAwareProfileController) getProfileService(c *fiber.Ctx) (ports.ProfileService, error) {
	tenantDB, err := middleware.MustGetTenantDBFromContext(c)
	if err != nil {
		return nil, err
	}

	// Create repository with tenant DB
	profileRepo := profileadapters.NewPostgreSQLProfileRepository(tenantDB)

	// Create and return service
	return profileservices.NewProfileService(
		profileRepo,
		ctrl.authRepo,
		ctrl.userRepo,
		ctrl.fileStorage,
		ctrl.passwordHasher,
	), nil
}

// GetMyProfile retrieves the authenticated user's profile
// GET /api/v1/profile/me
func (ctrl *TenantAwareProfileController) GetMyProfile(c *fiber.Ctx) error {
	// Get profile service with tenant DB
	profileService, err := ctrl.getProfileService(c)
	if err != nil {
		log.Printf("❌ Failed to get profile service: %v", err)
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get user ID from context (set by auth middleware)
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context (set by tenant middleware)
	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	profile, err := profileService.GetMyProfile(c.Context(), userID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Profile retrieved successfully", profile)
}

// UpdateMyProfile updates the authenticated user's profile
// PUT /api/v1/profile/me
func (ctrl *TenantAwareProfileController) UpdateMyProfile(c *fiber.Ctx) error {
	profileService, err := ctrl.getProfileService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	if err := profileService.UpdateMyProfile(c.Context(), userID, tenantID, &req); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Profile updated successfully", nil)
}

// ChangePassword changes the user's password
// POST /api/v1/profile/change-password
func (ctrl *TenantAwareProfileController) ChangePassword(c *fiber.Ctx) error {
	profileService, err := ctrl.getProfileService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.ChangePasswordRequestDTO
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	if err := profileService.ChangePassword(c.Context(), userID, tenantID, &req); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Password changed successfully", nil)
}

// UploadAvatar uploads and sets a new avatar for the user
// POST /api/v1/profile/avatar
func (ctrl *TenantAwareProfileController) UploadAvatar(c *fiber.Ctx) error {
	profileService, err := ctrl.getProfileService(c)
	if err != nil {
		log.Printf("❌ Failed to get profile service for avatar upload: %v", err)
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
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
	response, err := profileService.UploadAvatar(c.Context(), userID, tenantID, req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, response.Message, fiber.Map{
		"avatarUrl": response.AvatarURL,
	})
}

// DeleteAvatar removes the user's avatar
// DELETE /api/v1/profile/avatar
func (ctrl *TenantAwareProfileController) DeleteAvatar(c *fiber.Ctx) error {
	profileService, err := ctrl.getProfileService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	response, err := profileService.DeleteAvatar(c.Context(), userID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, response.Message, nil)
}

// UpdatePreferences updates the user's preferences
// PUT /api/v1/profile/preferences
func (ctrl *TenantAwareProfileController) UpdatePreferences(c *fiber.Ctx) error {
	profileService, err := ctrl.getProfileService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.UpdatePreferencesRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	if err := profileService.UpdatePreferences(c.Context(), userID, tenantID, &req); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Preferences updated successfully", nil)
}

// ============================================================
// Admin Endpoints
// ============================================================

// GetProfile retrieves any user's profile (admin only)
// GET /api/v1/admin/profiles/:id
func (ctrl *TenantAwareProfileController) GetProfile(c *fiber.Ctx) error {
	profileService, err := ctrl.getProfileService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get target user ID from params
	targetUserID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	profile, err := profileService.GetProfile(c.Context(), targetUserID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Profile retrieved successfully", profile)
}

// UpdateProfile updates any user's profile (admin only)
// PUT /api/v1/admin/profiles/:id
func (ctrl *TenantAwareProfileController) UpdateProfile(c *fiber.Ctx) error {
	profileService, err := ctrl.getProfileService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get target user ID from params
	targetUserID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	if err := profileService.UpdateProfile(c.Context(), targetUserID, tenantID, &req); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Profile updated successfully", nil)
}
