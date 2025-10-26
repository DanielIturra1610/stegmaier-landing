package controllers

import (
	"strconv"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/ports"
	"github.com/gofiber/fiber/v2"
)

// UserManagementController handles administrative user management HTTP requests
type UserManagementController struct {
	userService ports.UserManagementService
}

// NewUserManagementController creates a new UserManagementController
func NewUserManagementController(userService ports.UserManagementService) *UserManagementController {
	return &UserManagementController{
		userService: userService,
	}
}

// CreateUser handles creating a new user by admin
// POST /api/v1/admin/users
func (ctrl *UserManagementController) CreateUser(c *fiber.Ctx) error {
	var dto domain.CreateUserDTO
	if err := c.BodyParser(&dto); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Get tenant ID from context
	tenantID := c.Locals("tenantID").(string)

	// Call service using Fiber's context
	user, err := ctrl.userService.CreateUser(c.Context(), tenantID, &dto)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "User created successfully", user)
}

// GetUserByID handles getting a user by ID
// GET /api/v1/admin/users/:id
func (ctrl *UserManagementController) GetUserByID(c *fiber.Ctx) error {
	userID := c.Params("id")
	if userID == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "User ID is required")
	}

	// Get tenant ID from context
	tenantID := c.Locals("tenantID").(string)

	// Call service using Fiber's context
	user, err := ctrl.userService.GetUserByID(c.Context(), tenantID, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "User retrieved successfully", user)
}

// UpdateUser handles updating a user by admin
// PUT /api/v1/admin/users/:id
func (ctrl *UserManagementController) UpdateUser(c *fiber.Ctx) error {
	userID := c.Params("id")
	if userID == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "User ID is required")
	}

	var dto domain.UpdateUserDTO
	if err := c.BodyParser(&dto); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Get tenant ID from context
	tenantID := c.Locals("tenantID").(string)

	// Call service using Fiber's context
	user, err := ctrl.userService.UpdateUser(c.Context(), tenantID, userID, &dto)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "User updated successfully", user)
}

// DeleteUser handles deleting a user by admin
// DELETE /api/v1/admin/users/:id
func (ctrl *UserManagementController) DeleteUser(c *fiber.Ctx) error {
	userID := c.Params("id")
	if userID == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "User ID is required")
	}

	// Get tenant ID from context
	tenantID := c.Locals("tenantID").(string)

	// Call service using Fiber's context
	err := ctrl.userService.DeleteUser(c.Context(), tenantID, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "User deleted successfully", nil)
}

// ListUsers handles listing users with filters and pagination
// GET /api/v1/admin/users
func (ctrl *UserManagementController) ListUsers(c *fiber.Ctx) error {
	// Get tenant ID from context
	tenantID := c.Locals("tenantID").(string)

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Parse filters
	filters := &domain.UserListFilters{
		Role:   c.Query("role"),
		Search: c.Query("search"),
	}

	// Parse is_verified filter
	if isVerifiedStr := c.Query("is_verified"); isVerifiedStr != "" {
		isVerified := isVerifiedStr == "true"
		filters.IsVerified = &isVerified
	}

	// Call service using Fiber's context
	users, total, err := ctrl.userService.ListUsers(c.Context(), tenantID, filters, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	// Return paginated response
	return SuccessResponse(c, fiber.StatusOK, "Users retrieved successfully", fiber.Map{
		"users": users,
		"pagination": fiber.Map{
			"page":       page,
			"page_size":  pageSize,
			"total":      total,
			"total_pages": (total + pageSize - 1) / pageSize,
		},
	})
}

// GetUsersByTenant handles getting all users for a tenant
// GET /api/v1/admin/tenants/:tenantId/users
func (ctrl *UserManagementController) GetUsersByTenant(c *fiber.Ctx) error {
	tenantID := c.Params("tenantId")
	if tenantID == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID is required")
	}

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Call service using Fiber's context
	users, total, err := ctrl.userService.GetUsersByTenant(c.Context(), tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	// Return paginated response
	return SuccessResponse(c, fiber.StatusOK, "Users retrieved successfully", fiber.Map{
		"users": users,
		"pagination": fiber.Map{
			"page":        page,
			"page_size":   pageSize,
			"total":       total,
			"total_pages": (total + pageSize - 1) / pageSize,
		},
	})
}

// GetUsersByRole handles getting users by role
// GET /api/v1/admin/users/role/:role
func (ctrl *UserManagementController) GetUsersByRole(c *fiber.Ctx) error {
	roleStr := c.Params("role")
	if roleStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Role is required")
	}

	role := domain.UserRole(roleStr)

	// Validate role
	if !domain.IsValidRole(string(role)) {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid role")
	}

	// Get tenant ID from context
	tenantID := c.Locals("tenantID").(string)

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "20"))

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Call service using Fiber's context
	users, total, err := ctrl.userService.GetUsersByRole(c.Context(), tenantID, role, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	// Return paginated response
	return SuccessResponse(c, fiber.StatusOK, "Users retrieved successfully", fiber.Map{
		"users": users,
		"pagination": fiber.Map{
			"page":        page,
			"page_size":   pageSize,
			"total":       total,
			"total_pages": (total + pageSize - 1) / pageSize,
		},
	})
}

// CountUsersByTenant handles counting users by tenant
// GET /api/v1/admin/tenants/:tenantId/users/count
func (ctrl *UserManagementController) CountUsersByTenant(c *fiber.Ctx) error {
	tenantID := c.Params("tenantId")
	if tenantID == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID is required")
	}

	// Call service using Fiber's context
	count, err := ctrl.userService.CountUsersByTenant(c.Context(), tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "User count retrieved successfully", fiber.Map{
		"count": count,
	})
}

// CountUsersByRole handles counting users by role
// GET /api/v1/admin/users/role/:role/count
func (ctrl *UserManagementController) CountUsersByRole(c *fiber.Ctx) error {
	roleStr := c.Params("role")
	if roleStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Role is required")
	}

	role := domain.UserRole(roleStr)

	// Validate role
	if !domain.IsValidRole(string(role)) {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid role")
	}

	// Get tenant ID from context
	tenantID := c.Locals("tenantID").(string)

	// Call service using Fiber's context
	count, err := ctrl.userService.CountUsersByRole(c.Context(), tenantID, role)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "User count retrieved successfully", fiber.Map{
		"count": count,
	})
}

// VerifyUserByAdmin handles manually verifying a user's email
// POST /api/v1/admin/users/:id/verify
func (ctrl *UserManagementController) VerifyUserByAdmin(c *fiber.Ctx) error {
	userID := c.Params("id")
	if userID == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "User ID is required")
	}

	// Get tenant ID from context
	tenantID := c.Locals("tenantID").(string)

	// Call service using Fiber's context
	err := ctrl.userService.VerifyUserByAdmin(c.Context(), tenantID, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "User verified successfully", nil)
}

// UnverifyUser handles removing a user's verification status
// POST /api/v1/admin/users/:id/unverify
func (ctrl *UserManagementController) UnverifyUser(c *fiber.Ctx) error {
	userID := c.Params("id")
	if userID == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "User ID is required")
	}

	// Get tenant ID from context
	tenantID := c.Locals("tenantID").(string)

	// Call service using Fiber's context
	err := ctrl.userService.UnverifyUser(c.Context(), tenantID, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "User unverified successfully", nil)
}

// ResetUserPassword handles resetting a user's password by admin
// POST /api/v1/admin/users/:id/reset-password
func (ctrl *UserManagementController) ResetUserPassword(c *fiber.Ctx) error {
	userID := c.Params("id")
	if userID == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "User ID is required")
	}

	// Parse request body for new password
	var body struct {
		NewPassword string `json:"new_password"`
	}
	if err := c.BodyParser(&body); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if body.NewPassword == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "New password is required")
	}

	// Get tenant ID from context
	tenantID := c.Locals("tenantID").(string)

	// Call service using Fiber's context
	err := ctrl.userService.ResetUserPassword(c.Context(), tenantID, userID, body.NewPassword)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "User password reset successfully", nil)
}

// ForcePasswordChange handles flagging a user account to require password change
// POST /api/v1/admin/users/:id/force-password-change
func (ctrl *UserManagementController) ForcePasswordChange(c *fiber.Ctx) error {
	userID := c.Params("id")
	if userID == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "User ID is required")
	}

	// Get tenant ID from context
	tenantID := c.Locals("tenantID").(string)

	// Call service using Fiber's context
	err := ctrl.userService.ForcePasswordChange(c.Context(), tenantID, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "User flagged for password change successfully", nil)
}
