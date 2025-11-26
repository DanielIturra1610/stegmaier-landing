package controllers

import (
	"log"
	"strconv"

	authdomain "github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/user/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/user/ports"
	"github.com/DanielIturra1610/stegmaier-landing/internal/middleware"
	"github.com/gofiber/fiber/v2"
)

// UserManagementController handles HTTP requests for user management
type UserManagementController struct {
	service ports.UserManagementService
}

// NewUserManagementController creates a new user management controller
func NewUserManagementController(service ports.UserManagementService) *UserManagementController {
	return &UserManagementController{
		service: service,
	}
}

// CreateUser handles POST /api/v1/admin/users
func (c *UserManagementController) CreateUser(ctx *fiber.Ctx) error {
	var dto domain.CreateUserDTO
	if err := ctx.BodyParser(&dto); err != nil {
		log.Printf("⚠️  Invalid request body: %v", err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid request body",
		})
	}

	// Get the requesting user's role from context to validate role assignment
	requestingUserRole := ctx.Locals(middleware.UserRoleKey)
	if requestingUserRole != nil {
		creatorRole := requestingUserRole.(string)

		// Role hierarchy validation to prevent privilege escalation
		// Only superadmin can create superadmin users
		if dto.Role == "superadmin" && creatorRole != "superadmin" {
			log.Printf("⚠️  Role escalation attempt: %s tried to create superadmin user", creatorRole)
			return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"success": false,
				"error":   "Only superadmin can create superadmin users",
			})
		}

		// Admin can create: student, instructor, admin (but not superadmin)
		// Instructor can create: student only
		if creatorRole == "instructor" && dto.Role != "student" {
			log.Printf("⚠️  Role escalation attempt: instructor tried to create %s user", dto.Role)
			return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"success": false,
				"error":   "Instructors can only create student users",
			})
		}
	}

	// Get tenant from context
	tenantID := ctx.Locals(middleware.TenantIDKey)
	if tenantID != nil {
		dto.TenantID = tenantID.(string)
	}

	user, err := c.service.CreateUser(ctx.Context(), &dto)
	if err != nil {
		return HandleError(ctx, err)
	}

	return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"user": user.SanitizeUser(),
		},
	})
}

// ListUsers handles GET /api/v1/admin/users
func (c *UserManagementController) ListUsers(ctx *fiber.Ctx) error {
	filters := &domain.UserFiltersDTO{
		TenantID:  ctx.Query("tenant_id"),
		Role:      ctx.Query("role"),
		Search:    ctx.Query("search"),
		SortBy:    ctx.Query("sort_by"),
		SortOrder: ctx.Query("sort_order"),
	}

	// Parse pagination
	if page := ctx.Query("page"); page != "" {
		if p, err := strconv.Atoi(page); err == nil {
			filters.Page = p
		}
	}

	if pageSize := ctx.Query("page_size"); pageSize != "" {
		if ps, err := strconv.Atoi(pageSize); err == nil {
			filters.PageSize = ps
		}
	}

	// Parse is_verified
	if verified := ctx.Query("is_verified"); verified != "" {
		if v, err := strconv.ParseBool(verified); err == nil {
			filters.IsVerified = &v
		}
	}

	response, err := c.service.ListUsers(ctx.Context(), filters)
	if err != nil {
		return HandleError(ctx, err)
	}

	// Sanitize users
	sanitizedUsers := make([]interface{}, len(response.Users))
	for i, user := range response.Users {
		sanitizedUsers[i] = (&user).SanitizeUser()
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"users":       sanitizedUsers,
			"total_count": response.TotalCount,
			"page":        response.Page,
			"page_size":   response.PageSize,
			"total_pages": response.TotalPages,
		},
	})
}

// GetUserByID handles GET /api/v1/admin/users/:id
func (c *UserManagementController) GetUserByID(ctx *fiber.Ctx) error {
	userID := ctx.Params("id")
	if userID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "User ID is required",
		})
	}

	user, err := c.service.GetUser(ctx.Context(), userID)
	if err != nil {
		return HandleError(ctx, err)
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"user": user.SanitizeUser(),
		},
	})
}

// UpdateUser handles PUT /api/v1/admin/users/:id
func (c *UserManagementController) UpdateUser(ctx *fiber.Ctx) error {
	userID := ctx.Params("id")
	if userID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "User ID is required",
		})
	}

	var dto domain.UpdateUserDTO
	if err := ctx.BodyParser(&dto); err != nil {
		log.Printf("⚠️  Invalid request body: %v", err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid request body",
		})
	}

	user, err := c.service.UpdateUser(ctx.Context(), userID, &dto)
	if err != nil {
		return HandleError(ctx, err)
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"user": user.SanitizeUser(),
		},
	})
}

// DeleteUser handles DELETE /api/v1/admin/users/:id
func (c *UserManagementController) DeleteUser(ctx *fiber.Ctx) error {
	userID := ctx.Params("id")
	if userID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "User ID is required",
		})
	}

	if err := c.service.DeleteUser(ctx.Context(), userID); err != nil {
		return HandleError(ctx, err)
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "User deleted successfully",
	})
}

// VerifyUserByAdmin handles POST /api/v1/admin/users/:id/verify
func (c *UserManagementController) VerifyUserByAdmin(ctx *fiber.Ctx) error {
	userID := ctx.Params("id")
	if userID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "User ID is required",
		})
	}

	if err := c.service.VerifyUser(ctx.Context(), userID); err != nil {
		return HandleError(ctx, err)
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "User verified successfully",
	})
}

// UnverifyUser handles POST /api/v1/admin/users/:id/unverify
func (c *UserManagementController) UnverifyUser(ctx *fiber.Ctx) error {
	userID := ctx.Params("id")
	if userID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "User ID is required",
		})
	}

	if err := c.service.UnverifyUser(ctx.Context(), userID); err != nil {
		return HandleError(ctx, err)
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "User unverified successfully",
	})
}

// ResetUserPassword handles POST /api/v1/admin/users/:id/reset-password
func (c *UserManagementController) ResetUserPassword(ctx *fiber.Ctx) error {
	userID := ctx.Params("id")
	if userID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "User ID is required",
		})
	}

	var dto domain.ResetPasswordDTO
	if err := ctx.BodyParser(&dto); err != nil {
		log.Printf("⚠️  Invalid request body: %v", err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid request body",
		})
	}

	if err := c.service.ResetUserPassword(ctx.Context(), userID, &dto); err != nil {
		return HandleError(ctx, err)
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "Password reset successfully",
	})
}

// ForcePasswordChange handles POST /api/v1/admin/users/:id/force-password-change
func (c *UserManagementController) ForcePasswordChange(ctx *fiber.Ctx) error {
	userID := ctx.Params("id")
	if userID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "User ID is required",
		})
	}

	if err := c.service.ForcePasswordChange(ctx.Context(), userID); err != nil {
		return HandleError(ctx, err)
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"message": "Password change forced successfully",
	})
}

// GetUsersByRole handles GET /api/v1/admin/users/role/:role
func (c *UserManagementController) GetUsersByRole(ctx *fiber.Ctx) error {
	role := ctx.Params("role")
	if role == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Role is required",
		})
	}

	// Validate role
	if !authdomain.IsValidRole(role) {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid role",
		})
	}

	users, err := c.service.GetUsersByRole(ctx.Context(), role)
	if err != nil {
		return HandleError(ctx, err)
	}

	// Sanitize users
	sanitizedUsers := make([]*authdomain.User, len(users))
	for i, user := range users {
		sanitizedUsers[i] = user.SanitizeUser()
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"users": sanitizedUsers,
			"count": len(users),
		},
	})
}

// CountUsersByRole handles GET /api/v1/admin/users/role/:role/count
func (c *UserManagementController) CountUsersByRole(ctx *fiber.Ctx) error {
	role := ctx.Params("role")
	if role == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Role is required",
		})
	}

	count, err := c.service.CountUsersByRole(ctx.Context(), role)
	if err != nil {
		return HandleError(ctx, err)
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"role":  role,
			"count": count,
		},
	})
}

// GetUsersByTenant handles GET /api/v1/superadmin/tenants/:tenantId/users
func (c *UserManagementController) GetUsersByTenant(ctx *fiber.Ctx) error {
	tenantID := ctx.Params("tenantId")
	if tenantID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Tenant ID is required",
		})
	}

	users, err := c.service.GetUsersByTenant(ctx.Context(), tenantID)
	if err != nil {
		return HandleError(ctx, err)
	}

	// Sanitize users
	sanitizedUsers := make([]*authdomain.User, len(users))
	for i, user := range users {
		sanitizedUsers[i] = user.SanitizeUser()
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"tenant_id": tenantID,
			"users":     sanitizedUsers,
			"count":     len(users),
		},
	})
}

// CountUsersByTenant handles GET /api/v1/superadmin/tenants/:tenantId/users/count
func (c *UserManagementController) CountUsersByTenant(ctx *fiber.Ctx) error {
	tenantID := ctx.Params("tenantId")
	if tenantID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Tenant ID is required",
		})
	}

	count, err := c.service.CountUsersByTenant(ctx.Context(), tenantID)
	if err != nil {
		return HandleError(ctx, err)
	}

	return ctx.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"tenant_id": tenantID,
			"count":     count,
		},
	})
}
