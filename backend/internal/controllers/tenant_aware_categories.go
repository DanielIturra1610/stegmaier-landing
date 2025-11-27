package controllers

import (
	"strconv"

	courseadapters "github.com/DanielIturra1610/stegmaier-landing/internal/core/courses/adapters"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/courses/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/courses/ports"
	courseservices "github.com/DanielIturra1610/stegmaier-landing/internal/core/courses/services"
	"github.com/DanielIturra1610/stegmaier-landing/internal/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// TenantAwareCategoryController handles category-related HTTP requests with dynamic tenant DB connection
type TenantAwareCategoryController struct{}

// NewTenantAwareCategoryController creates a new TenantAwareCategoryController
func NewTenantAwareCategoryController() *TenantAwareCategoryController {
	return &TenantAwareCategoryController{}
}

// getCategoryService creates a category service using the tenant DB from context
func (ctrl *TenantAwareCategoryController) getCategoryService(c *fiber.Ctx) (ports.CourseCategoryService, error) {
	tenantDB, err := middleware.MustGetTenantDBFromContext(c)
	if err != nil {
		return nil, err
	}

	// Create repository with tenant DB
	categoryRepo := courseadapters.NewPostgreSQLCourseCategoryRepository(tenantDB)

	// Create and return service
	return courseservices.NewCourseCategoryService(categoryRepo), nil
}

// GetCategory retrieves a category by ID
// GET /api/v1/categories/:id
func (ctrl *TenantAwareCategoryController) GetCategory(c *fiber.Ctx) error {
	categoryService, err := ctrl.getCategoryService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	categoryID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid category ID")
	}

	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	category, err := categoryService.GetCategory(c.Context(), categoryID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Category retrieved successfully", category)
}

// GetCategoryBySlug retrieves a category by its slug
// GET /api/v1/categories/slug/:slug
func (ctrl *TenantAwareCategoryController) GetCategoryBySlug(c *fiber.Ctx) error {
	categoryService, err := ctrl.getCategoryService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	slug := c.Params("slug")
	if slug == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Slug is required")
	}

	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	category, err := categoryService.GetCategoryBySlug(c.Context(), slug, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Category retrieved successfully", category)
}

// ListCategories retrieves categories with pagination
// GET /api/v1/categories
func (ctrl *TenantAwareCategoryController) ListCategories(c *fiber.Ctx) error {
	categoryService, err := ctrl.getCategoryService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	page := 1
	pageSize := 20

	if pageParam := c.Query("page"); pageParam != "" {
		if p, err := strconv.Atoi(pageParam); err == nil && p > 0 {
			page = p
		}
	}

	if pageSizeParam := c.Query("pageSize"); pageSizeParam != "" {
		if ps, err := strconv.Atoi(pageSizeParam); err == nil && ps > 0 {
			pageSize = ps
		}
	}

	response, err := categoryService.ListCategories(c.Context(), tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Categories retrieved successfully", response)
}

// ListActiveCategories retrieves all active categories
// GET /api/v1/categories/active
func (ctrl *TenantAwareCategoryController) ListActiveCategories(c *fiber.Ctx) error {
	categoryService, err := ctrl.getCategoryService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	categories, err := categoryService.ListActiveCategories(c.Context(), tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Active categories retrieved successfully", categories)
}

// GetSubcategories retrieves subcategories of a parent category
// GET /api/v1/categories/:id/subcategories
func (ctrl *TenantAwareCategoryController) GetSubcategories(c *fiber.Ctx) error {
	categoryService, err := ctrl.getCategoryService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	parentID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid category ID")
	}

	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	subcategories, err := categoryService.GetSubcategories(c.Context(), parentID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Subcategories retrieved successfully", subcategories)
}

// CreateCategory creates a new category (admin only)
// POST /api/v1/categories
func (ctrl *TenantAwareCategoryController) CreateCategory(c *fiber.Ctx) error {
	categoryService, err := ctrl.getCategoryService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	var req domain.CreateCourseCategoryRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	category, err := categoryService.CreateCategory(c.Context(), tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Category created successfully", category)
}

// UpdateCategory updates an existing category (admin only)
// PUT /api/v1/categories/:id
func (ctrl *TenantAwareCategoryController) UpdateCategory(c *fiber.Ctx) error {
	categoryService, err := ctrl.getCategoryService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	categoryID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid category ID")
	}

	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	var req domain.UpdateCourseCategoryRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	category, err := categoryService.UpdateCategory(c.Context(), categoryID, tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Category updated successfully", category)
}

// DeleteCategory deletes a category (admin only)
// DELETE /api/v1/categories/:id
func (ctrl *TenantAwareCategoryController) DeleteCategory(c *fiber.Ctx) error {
	categoryService, err := ctrl.getCategoryService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	categoryID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid category ID")
	}

	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	if err := categoryService.DeleteCategory(c.Context(), categoryID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Category deleted successfully", nil)
}

// ActivateCategory activates a category (admin only)
// POST /api/v1/categories/:id/activate
func (ctrl *TenantAwareCategoryController) ActivateCategory(c *fiber.Ctx) error {
	categoryService, err := ctrl.getCategoryService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	categoryID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid category ID")
	}

	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	if err := categoryService.ActivateCategory(c.Context(), categoryID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Category activated successfully", nil)
}

// DeactivateCategory deactivates a category (admin only)
// POST /api/v1/categories/:id/deactivate
func (ctrl *TenantAwareCategoryController) DeactivateCategory(c *fiber.Ctx) error {
	categoryService, err := ctrl.getCategoryService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	categoryID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid category ID")
	}

	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	if err := categoryService.DeactivateCategory(c.Context(), categoryID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Category deactivated successfully", nil)
}
