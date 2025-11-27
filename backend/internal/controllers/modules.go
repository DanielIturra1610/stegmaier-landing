package controllers

import (
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/modules/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/modules/ports"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// ModuleController handles module-related HTTP requests
type ModuleController struct {
	moduleService ports.ModuleService
}

// NewModuleController creates a new ModuleController
func NewModuleController(moduleService ports.ModuleService) *ModuleController {
	return &ModuleController{
		moduleService: moduleService,
	}
}

// ============================================================================
// Module CRUD Operations
// ============================================================================

// CreateModule creates a new module
// POST /api/v1/modules
func (ctrl *ModuleController) CreateModule(c *fiber.Ctx) error {
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
	var req domain.CreateModuleRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	module, err := ctrl.moduleService.CreateModule(tenantID, userID, req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Module created successfully", module)
}

// GetModule retrieves a single module by ID
// GET /api/v1/modules/:id
func (ctrl *ModuleController) GetModule(c *fiber.Ctx) error {
	// Get module ID from params
	moduleID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid module ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	module, err := ctrl.moduleService.GetModule(tenantID, moduleID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Module retrieved successfully", module)
}

// GetModuleWithLessons retrieves a module with its lessons
// GET /api/v1/modules/:id/lessons
func (ctrl *ModuleController) GetModuleWithLessons(c *fiber.Ctx) error {
	// Get module ID from params
	moduleID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid module ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	module, err := ctrl.moduleService.GetModuleWithLessons(tenantID, moduleID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Module with lessons retrieved successfully", module)
}

// GetCourseModules retrieves all modules for a course
// GET /api/v1/courses/:courseId/modules
func (ctrl *ModuleController) GetCourseModules(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("courseId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	modules, err := ctrl.moduleService.GetCourseModules(tenantID, courseID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course modules retrieved successfully", modules)
}

// GetCourseModulesWithProgress retrieves all modules for a course with user progress
// GET /api/v1/courses/:courseId/modules/progress
func (ctrl *ModuleController) GetCourseModulesWithProgress(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("courseId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

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
	response, err := ctrl.moduleService.GetCourseModulesWithProgress(tenantID, courseID, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course modules with progress retrieved successfully", response)
}

// UpdateModule updates an existing module
// PATCH /api/v1/modules/:id
func (ctrl *ModuleController) UpdateModule(c *fiber.Ctx) error {
	// Get module ID from params
	moduleID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid module ID")
	}

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
	var req domain.UpdateModuleRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	module, err := ctrl.moduleService.UpdateModule(tenantID, userID, moduleID, req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Module updated successfully", module)
}

// DeleteModule deletes a module
// DELETE /api/v1/modules/:id
func (ctrl *ModuleController) DeleteModule(c *fiber.Ctx) error {
	// Get module ID from params
	moduleID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid module ID")
	}

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
	if err := ctrl.moduleService.DeleteModule(tenantID, userID, moduleID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Module deleted successfully", nil)
}

// ============================================================================
// Module Publishing Operations
// ============================================================================

// PublishModule publishes a module
// POST /api/v1/modules/:id/publish
func (ctrl *ModuleController) PublishModule(c *fiber.Ctx) error {
	// Get module ID from params
	moduleID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid module ID")
	}

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
	module, err := ctrl.moduleService.PublishModule(tenantID, userID, moduleID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Module published successfully", module)
}

// UnpublishModule unpublishes a module
// POST /api/v1/modules/:id/unpublish
func (ctrl *ModuleController) UnpublishModule(c *fiber.Ctx) error {
	// Get module ID from params
	moduleID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid module ID")
	}

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
	module, err := ctrl.moduleService.UnpublishModule(tenantID, userID, moduleID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Module unpublished successfully", module)
}

// ============================================================================
// Module Ordering Operations
// ============================================================================

// ReorderModules reorders modules within a course
// POST /api/v1/courses/:courseId/modules/reorder
func (ctrl *ModuleController) ReorderModules(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("courseId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

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
	var req domain.ReorderModulesRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	if err := ctrl.moduleService.ReorderModules(tenantID, userID, courseID, req); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Modules reordered successfully", nil)
}

// ============================================================================
// Module Progress Operations
// ============================================================================

// GetModuleProgress retrieves user progress for a specific module
// GET /api/v1/modules/:id/progress
func (ctrl *ModuleController) GetModuleProgress(c *fiber.Ctx) error {
	// Get module ID from params
	moduleID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid module ID")
	}

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
	progress, err := ctrl.moduleService.GetModuleProgress(tenantID, moduleID, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Module progress retrieved successfully", progress)
}

// UpdateModuleProgress recalculates and updates user progress for a specific module
// POST /api/v1/modules/:id/progress
func (ctrl *ModuleController) UpdateModuleProgress(c *fiber.Ctx) error {
	// Get module ID from params
	moduleID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid module ID")
	}

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
	progress, err := ctrl.moduleService.UpdateModuleProgress(tenantID, moduleID, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Module progress updated successfully", progress)
}
