package controllers

import (
	"strconv"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/courses/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/courses/ports"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// CategoryController handles category-related HTTP requests
type CategoryController struct {
	categoryService ports.CourseCategoryService
}

// NewCategoryController creates a new CategoryController
func NewCategoryController(categoryService ports.CourseCategoryService) *CategoryController {
	return &CategoryController{
		categoryService: categoryService,
	}
}

// GetCategory retrieves a category by ID
// GET /api/v1/categories/:id
func (ctrl *CategoryController) GetCategory(c *fiber.Ctx) error {
	// Get category ID from params
	categoryID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid category ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	category, err := ctrl.categoryService.GetCategory(c.Context(), categoryID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Category retrieved successfully", category)
}

// GetCategoryBySlug retrieves a category by its slug
// GET /api/v1/categories/slug/:slug
func (ctrl *CategoryController) GetCategoryBySlug(c *fiber.Ctx) error {
	// Get slug from params
	slug := c.Params("slug")
	if slug == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Slug is required")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	category, err := ctrl.categoryService.GetCategoryBySlug(c.Context(), slug, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Category retrieved successfully", category)
}

// ListCategories retrieves categories with pagination
// GET /api/v1/categories
func (ctrl *CategoryController) ListCategories(c *fiber.Ctx) error {
	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse pagination parameters
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

	// Call service
	response, err := ctrl.categoryService.ListCategories(c.Context(), tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Categories retrieved successfully", response)
}

// ListActiveCategories retrieves all active categories
// GET /api/v1/categories/active
func (ctrl *CategoryController) ListActiveCategories(c *fiber.Ctx) error {
	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	categories, err := ctrl.categoryService.ListActiveCategories(c.Context(), tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Active categories retrieved successfully", categories)
}

// GetSubcategories retrieves subcategories of a parent category
// GET /api/v1/categories/:id/subcategories
func (ctrl *CategoryController) GetSubcategories(c *fiber.Ctx) error {
	// Get parent category ID from params
	parentID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid category ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	subcategories, err := ctrl.categoryService.GetSubcategories(c.Context(), parentID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Subcategories retrieved successfully", subcategories)
}

// CreateCategory creates a new category (admin only)
// POST /api/v1/categories
func (ctrl *CategoryController) CreateCategory(c *fiber.Ctx) error {
	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.CreateCourseCategoryRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	category, err := ctrl.categoryService.CreateCategory(c.Context(), tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Category created successfully", category)
}

// UpdateCategory updates an existing category (admin only)
// PUT /api/v1/categories/:id
func (ctrl *CategoryController) UpdateCategory(c *fiber.Ctx) error {
	// Get category ID from params
	categoryID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid category ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.UpdateCourseCategoryRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	category, err := ctrl.categoryService.UpdateCategory(c.Context(), categoryID, tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Category updated successfully", category)
}

// DeleteCategory deletes a category (admin only)
// DELETE /api/v1/categories/:id
func (ctrl *CategoryController) DeleteCategory(c *fiber.Ctx) error {
	// Get category ID from params
	categoryID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid category ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	if err := ctrl.categoryService.DeleteCategory(c.Context(), categoryID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Category deleted successfully", nil)
}

// ActivateCategory activates a category (admin only)
// POST /api/v1/categories/:id/activate
func (ctrl *CategoryController) ActivateCategory(c *fiber.Ctx) error {
	// Get category ID from params
	categoryID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid category ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	if err := ctrl.categoryService.ActivateCategory(c.Context(), categoryID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Category activated successfully", nil)
}

// DeactivateCategory deactivates a category (admin only)
// POST /api/v1/categories/:id/deactivate
func (ctrl *CategoryController) DeactivateCategory(c *fiber.Ctx) error {
	// Get category ID from params
	categoryID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid category ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	if err := ctrl.categoryService.DeactivateCategory(c.Context(), categoryID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Category deactivated successfully", nil)
}
