package controllers

import (
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/tenants/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/tenants/services"
	"github.com/gofiber/fiber/v2"
)

// TenantController handles HTTP requests for tenant operations
type TenantController struct {
	tenantService *services.TenantService
}

// NewTenantController creates a new tenant controller
func NewTenantController(tenantService *services.TenantService) *TenantController {
	return &TenantController{
		tenantService: tenantService,
	}
}

// CreateTenant creates a new tenant organization
// @Summary Create tenant
// @Description Creates a new tenant organization with the authenticated user as admin
// @Tags tenants
// @Accept json
// @Produce json
// @Param tenant body domain.CreateTenantDTO true "Tenant creation data"
// @Success 201 {object} domain.CreateTenantResponse
// @Failure 400 {object} fiber.Map
// @Failure 401 {object} fiber.Map
// @Router /api/v1/tenants [post]
func (c *TenantController) CreateTenant(ctx *fiber.Ctx) error {
	// Get user ID from context (set by auth middleware)
	userID := ctx.Locals("userID")
	if userID == nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized",
		})
	}

	var dto domain.CreateTenantDTO
	if err := ctx.BodyParser(&dto); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	result, err := c.tenantService.CreateTenant(ctx.Context(), &dto, userID.(string))
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "Tenant created successfully",
		"data":    result,
	})
}

// GetUserTenants retrieves all tenants for the authenticated user
// @Summary Get user tenants
// @Description Get all tenants that the authenticated user has access to
// @Tags tenants
// @Produce json
// @Success 200 {array} domain.TenantWithMembership
// @Failure 401 {object} fiber.Map
// @Router /api/v1/tenants [get]
func (c *TenantController) GetUserTenants(ctx *fiber.Ctx) error {
	userID := ctx.Locals("userID")
	if userID == nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized",
		})
	}

	tenants, err := c.tenantService.GetUserTenants(ctx.Context(), userID.(string))
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to get tenants",
			"error":   err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Tenants retrieved successfully",
		"data":    tenants,
	})
}

// GetPendingInvitations retrieves pending invitations for the authenticated user
// @Summary Get pending invitations
// @Description Get all pending tenant invitations for the authenticated user
// @Tags tenants
// @Produce json
// @Success 200 {array} domain.Invitation
// @Failure 401 {object} fiber.Map
// @Router /api/v1/tenants/invitations [get]
func (c *TenantController) GetPendingInvitations(ctx *fiber.Ctx) error {
	userID := ctx.Locals("userID")
	if userID == nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized",
		})
	}

	invitations, err := c.tenantService.GetPendingInvitations(ctx.Context(), userID.(string))
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to get invitations",
			"error":   err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Invitations retrieved successfully",
		"data":    invitations,
	})
}

// SelectTenant allows user to select an active tenant
// @Summary Select tenant
// @Description Select a tenant to work in (updates user's current tenant and generates new JWT)
// @Tags tenants
// @Accept json
// @Produce json
// @Param tenant body domain.SelectTenantDTO true "Tenant selection data"
// @Success 200 {object} domain.SelectTenantResponse
// @Failure 400 {object} fiber.Map
// @Failure 401 {object} fiber.Map
// @Router /api/v1/tenants/select [post]
func (c *TenantController) SelectTenant(ctx *fiber.Ctx) error {
	userID := ctx.Locals("userID")
	if userID == nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized",
		})
	}

	var dto domain.SelectTenantDTO
	if err := ctx.BodyParser(&dto); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	result, err := c.tenantService.SelectTenant(ctx.Context(), &dto, userID.(string))
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Tenant selected successfully",
		"data":    result,
	})
}

// InviteUser invites a user to join the tenant
// @Summary Invite user to tenant
// @Description Admin invites a user by email to join the tenant (requires admin role)
// @Tags tenants
// @Accept json
// @Produce json
// @Param invitation body domain.InviteUserDTO true "Invitation data"
// @Success 200 {object} domain.InviteUserResponse
// @Failure 400 {object} fiber.Map
// @Failure 401 {object} fiber.Map
// @Failure 403 {object} fiber.Map
// @Router /api/v1/tenants/invite [post]
func (c *TenantController) InviteUser(ctx *fiber.Ctx) error {
	userID := ctx.Locals("userID")
	if userID == nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized",
		})
	}

	tenantID := ctx.Locals("tenant_id")
	if tenantID == nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "No tenant selected",
		})
	}

	var dto domain.InviteUserDTO
	if err := ctx.BodyParser(&dto); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	result, err := c.tenantService.InviteUser(ctx.Context(), &dto, tenantID.(string), userID.(string))
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "User invited successfully",
		"data":    result,
	})
}

// CreateUserInTenant creates a new user directly in the tenant
// @Summary Create user in tenant
// @Description Admin creates a new user directly in the tenant (requires admin role)
// @Tags tenants
// @Accept json
// @Produce json
// @Param user body domain.CreateUserInTenantDTO true "User creation data"
// @Success 201 {object} domain.CreateUserInTenantResponse
// @Failure 400 {object} fiber.Map
// @Failure 401 {object} fiber.Map
// @Failure 403 {object} fiber.Map
// @Router /api/v1/tenants/users [post]
func (c *TenantController) CreateUserInTenant(ctx *fiber.Ctx) error {
	userID := ctx.Locals("userID")
	if userID == nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized",
		})
	}

	tenantID := ctx.Locals("tenant_id")
	if tenantID == nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "No tenant selected",
		})
	}

	var dto domain.CreateUserInTenantDTO
	if err := ctx.BodyParser(&dto); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	result, err := c.tenantService.CreateUserInTenant(ctx.Context(), &dto, tenantID.(string), userID.(string))
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "User created successfully",
		"data":    result,
	})
}

// AcceptInvitation accepts a pending invitation
// @Summary Accept invitation
// @Description Accept a pending invitation to join a tenant
// @Tags tenants
// @Accept json
// @Produce json
// @Param invitation body domain.AcceptInvitationDTO true "Invitation acceptance data"
// @Success 200 {object} fiber.Map
// @Failure 400 {object} fiber.Map
// @Failure 401 {object} fiber.Map
// @Router /api/v1/tenants/invitations/accept [post]
func (c *TenantController) AcceptInvitation(ctx *fiber.Ctx) error {
	userID := ctx.Locals("userID")
	if userID == nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized",
		})
	}

	var dto domain.AcceptInvitationDTO
	if err := ctx.BodyParser(&dto); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	err := c.tenantService.AcceptInvitation(ctx.Context(), &dto, userID.(string))
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Invitation accepted successfully",
	})
}

// RejectInvitation rejects a pending invitation
// @Summary Reject invitation
// @Description Reject a pending invitation to join a tenant
// @Tags tenants
// @Accept json
// @Produce json
// @Param invitation body domain.RejectInvitationDTO true "Invitation rejection data"
// @Success 200 {object} fiber.Map
// @Failure 400 {object} fiber.Map
// @Failure 401 {object} fiber.Map
// @Router /api/v1/tenants/invitations/reject [post]
func (c *TenantController) RejectInvitation(ctx *fiber.Ctx) error {
	userID := ctx.Locals("userID")
	if userID == nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized",
		})
	}

	var dto domain.RejectInvitationDTO
	if err := ctx.BodyParser(&dto); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
			"error":   err.Error(),
		})
	}

	err := c.tenantService.RejectInvitation(ctx.Context(), &dto, userID.(string))
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Invitation rejected successfully",
	})
}

// GetTenantMembers retrieves all members of the current tenant
// @Summary Get tenant members
// @Description Get all members of the current tenant (admin only)
// @Tags tenants
// @Produce json
// @Success 200 {array} domain.TenantMembership
// @Failure 401 {object} fiber.Map
// @Failure 403 {object} fiber.Map
// @Router /api/v1/tenants/members [get]
func (c *TenantController) GetTenantMembers(ctx *fiber.Ctx) error {
	userID := ctx.Locals("userID")
	if userID == nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized",
		})
	}

	tenantID := ctx.Locals("tenant_id")
	if tenantID == nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "No tenant selected",
		})
	}

	members, err := c.tenantService.GetTenantMembers(ctx.Context(), tenantID.(string), userID.(string))
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Members retrieved successfully",
		"data":    members,
	})
}

// GetTenantMembersWithUsers retrieves all members of the current tenant with user details
// @Summary Get tenant members with user details
// @Description Get all members of the current tenant with user info (admin only)
// @Tags tenants
// @Produce json
// @Success 200 {array} domain.MemberWithUser
// @Failure 401 {object} fiber.Map
// @Failure 403 {object} fiber.Map
// @Router /api/v1/admin/tenants/users [get]
func (c *TenantController) GetTenantMembersWithUsers(ctx *fiber.Ctx) error {
	userID := ctx.Locals("userID")
	if userID == nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized",
		})
	}

	tenantID := ctx.Locals("tenant_id")
	if tenantID == nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "No tenant selected",
		})
	}

	members, err := c.tenantService.GetTenantMembersWithUsers(ctx.Context(), tenantID.(string), userID.(string))
	if err != nil {
		return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"message": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Members with user details retrieved successfully",
		"data": fiber.Map{
			"users":       members,
			"total_count": len(members),
		},
	})
}
