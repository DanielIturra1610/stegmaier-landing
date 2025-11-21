package services

import (
	"context"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/courses/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/courses/ports"
	"github.com/google/uuid"
)

// CourseCategoryServiceImpl implements the CourseCategoryService interface
type CourseCategoryServiceImpl struct {
	categoryRepo ports.CourseCategoryRepository
}

// NewCourseCategoryService creates a new course category service instance
func NewCourseCategoryService(
	categoryRepo ports.CourseCategoryRepository,
) ports.CourseCategoryService {
	return &CourseCategoryServiceImpl{
		categoryRepo: categoryRepo,
	}
}

// GetCategory retrieves a category by ID
func (s *CourseCategoryServiceImpl) GetCategory(ctx context.Context, categoryID, tenantID uuid.UUID) (*domain.CourseCategoryResponse, error) {
	category, err := s.categoryRepo.GetCategory(ctx, categoryID, tenantID)
	if err != nil {
		return nil, ports.NewCourseError("GetCategory", err, "failed to get category")
	}

	return domain.CategoryToResponse(category), nil
}

// GetCategoryBySlug retrieves a category by its slug
func (s *CourseCategoryServiceImpl) GetCategoryBySlug(ctx context.Context, slug string, tenantID uuid.UUID) (*domain.CourseCategoryResponse, error) {
	category, err := s.categoryRepo.GetCategoryBySlug(ctx, slug, tenantID)
	if err != nil {
		return nil, ports.NewCourseError("GetCategoryBySlug", err, "failed to get category by slug")
	}

	return domain.CategoryToResponse(category), nil
}

// ListCategories retrieves all categories for a tenant
func (s *CourseCategoryServiceImpl) ListCategories(ctx context.Context, tenantID uuid.UUID, page, pageSize int) (*domain.ListCategoriesResponse, error) {
	// Validate pagination
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Get categories
	categories, total, err := s.categoryRepo.ListCategories(ctx, tenantID, page, pageSize)
	if err != nil {
		return nil, ports.NewCourseError("ListCategories", err, "failed to list categories")
	}

	// Convert to response DTOs
	responses := make([]*domain.CourseCategoryResponse, len(categories))
	for i, cat := range categories {
		responses[i] = domain.CategoryToResponse(cat)
	}

	return &domain.ListCategoriesResponse{
		Categories: responses,
		TotalCount: total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: (total + pageSize - 1) / pageSize,
	}, nil
}

// ListActiveCategories retrieves all active categories
func (s *CourseCategoryServiceImpl) ListActiveCategories(ctx context.Context, tenantID uuid.UUID) ([]*domain.CourseCategoryResponse, error) {
	// Get active categories
	categories, err := s.categoryRepo.ListActiveCategories(ctx, tenantID)
	if err != nil {
		return nil, ports.NewCourseError("ListActiveCategories", err, "failed to list active categories")
	}

	// Convert to response DTOs
	responses := make([]*domain.CourseCategoryResponse, len(categories))
	for i, cat := range categories {
		responses[i] = domain.CategoryToResponse(cat)
	}

	return responses, nil
}

// CreateCategory creates a new category (admin only)
func (s *CourseCategoryServiceImpl) CreateCategory(ctx context.Context, tenantID uuid.UUID, req *domain.CreateCourseCategoryRequest) (*domain.CourseCategoryResponse, error) {
	// Validate request
	if err := req.Validate(); err != nil {
		return nil, ports.NewCourseError("CreateCategory", err, "invalid category data")
	}

	// Check if slug already exists
	exists, err := s.categoryRepo.CategorySlugExists(ctx, req.Slug, tenantID, nil)
	if err != nil {
		return nil, ports.NewCourseError("CreateCategory", err, "failed to check slug")
	}
	if exists {
		return nil, ports.NewCourseError("CreateCategory", ports.ErrCategorySlugExists, "slug already in use")
	}

	// Validate parent category if provided
	if req.ParentID != nil {
		parent, err := s.categoryRepo.GetCategory(ctx, *req.ParentID, tenantID)
		if err != nil {
			return nil, ports.NewCourseError("CreateCategory", ports.ErrInvalidParentCategory, "parent category not found")
		}
		if !parent.IsActive {
			return nil, ports.NewCourseError("CreateCategory", ports.ErrCategoryInactive, "parent category is inactive")
		}
	}

	// Create category entity
	category := domain.NewCourseCategory(tenantID, req.Name, req.Slug)
	category.Description = req.Description
	category.ParentID = req.ParentID
	category.Icon = req.Icon
	category.DisplayOrder = req.DisplayOrder

	// Create in repository
	if err := s.categoryRepo.CreateCategory(ctx, category); err != nil {
		return nil, ports.NewCourseError("CreateCategory", err, "failed to create category")
	}

	return domain.CategoryToResponse(category), nil
}

// UpdateCategory updates an existing category (admin only)
func (s *CourseCategoryServiceImpl) UpdateCategory(ctx context.Context, categoryID, tenantID uuid.UUID, req *domain.UpdateCourseCategoryRequest) (*domain.CourseCategoryResponse, error) {
	// Validate request
	if err := req.Validate(); err != nil {
		return nil, ports.NewCourseError("UpdateCategory", err, "invalid category data")
	}

	// Check if request has any updates
	if !req.HasUpdates() {
		return nil, ports.NewCourseError("UpdateCategory", ports.ErrInvalidInput, "no updates provided")
	}

	// Get existing category
	category, err := s.categoryRepo.GetCategory(ctx, categoryID, tenantID)
	if err != nil {
		return nil, ports.NewCourseError("UpdateCategory", err, "category not found")
	}

	// Check if slug is being changed and if new slug exists
	if req.Slug != nil && *req.Slug != category.Slug {
		exists, err := s.categoryRepo.CategorySlugExists(ctx, *req.Slug, tenantID, &categoryID)
		if err != nil {
			return nil, ports.NewCourseError("UpdateCategory", err, "failed to check slug")
		}
		if exists {
			return nil, ports.NewCourseError("UpdateCategory", ports.ErrCategorySlugExists, "slug already in use")
		}
	}

	// Validate parent category if being changed
	if req.ParentID != nil {
		// Check for circular reference
		if *req.ParentID == categoryID {
			return nil, ports.NewCourseError("UpdateCategory", ports.ErrCircularCategoryReference, "category cannot be its own parent")
		}

		// Validate parent exists and is active
		parent, err := s.categoryRepo.GetCategory(ctx, *req.ParentID, tenantID)
		if err != nil {
			return nil, ports.NewCourseError("UpdateCategory", ports.ErrInvalidParentCategory, "parent category not found")
		}
		if !parent.IsActive {
			return nil, ports.NewCourseError("UpdateCategory", ports.ErrCategoryInactive, "parent category is inactive")
		}

		// Check if parent is a subcategory of this category (prevent circular reference)
		if parent.ParentID != nil && *parent.ParentID == categoryID {
			return nil, ports.NewCourseError("UpdateCategory", ports.ErrCircularCategoryReference, "circular category reference detected")
		}
	}

	// Apply updates
	if err := req.ApplyToCategory(category); err != nil {
		return nil, ports.NewCourseError("UpdateCategory", err, "failed to apply updates")
	}

	// Update in repository
	if err := s.categoryRepo.UpdateCategory(ctx, category); err != nil {
		return nil, ports.NewCourseError("UpdateCategory", err, "failed to update category")
	}

	return domain.CategoryToResponse(category), nil
}

// DeleteCategory deletes a category (admin only, only if no courses are associated)
func (s *CourseCategoryServiceImpl) DeleteCategory(ctx context.Context, categoryID, tenantID uuid.UUID) error {
	// Get category to check course count
	category, err := s.categoryRepo.GetCategory(ctx, categoryID, tenantID)
	if err != nil {
		return ports.NewCourseError("DeleteCategory", err, "category not found")
	}

	// Check if category has courses
	if category.CourseCount > 0 {
		return ports.NewCourseError("DeleteCategory", ports.ErrCategoryHasCourses, "cannot delete category with associated courses")
	}

	// Check if category has subcategories
	subcategories, err := s.categoryRepo.GetSubcategories(ctx, categoryID, tenantID)
	if err != nil {
		return ports.NewCourseError("DeleteCategory", err, "failed to check subcategories")
	}
	if len(subcategories) > 0 {
		return ports.NewCourseError("DeleteCategory", ports.ErrCategoryHasCourses, "cannot delete category with subcategories")
	}

	// Delete the category
	if err := s.categoryRepo.DeleteCategory(ctx, categoryID, tenantID); err != nil {
		return ports.NewCourseError("DeleteCategory", err, "failed to delete category")
	}

	return nil
}

// ActivateCategory activates a category (admin only)
func (s *CourseCategoryServiceImpl) ActivateCategory(ctx context.Context, categoryID, tenantID uuid.UUID) error {
	// Get category
	category, err := s.categoryRepo.GetCategory(ctx, categoryID, tenantID)
	if err != nil {
		return ports.NewCourseError("ActivateCategory", err, "category not found")
	}

	// Check if already active
	if category.IsActive {
		return nil // Already active, no error
	}

	// Activate
	category.Activate()

	// Update in repository
	if err := s.categoryRepo.UpdateCategory(ctx, category); err != nil {
		return ports.NewCourseError("ActivateCategory", err, "failed to activate category")
	}

	return nil
}

// DeactivateCategory deactivates a category (admin only)
func (s *CourseCategoryServiceImpl) DeactivateCategory(ctx context.Context, categoryID, tenantID uuid.UUID) error {
	// Get category
	category, err := s.categoryRepo.GetCategory(ctx, categoryID, tenantID)
	if err != nil {
		return ports.NewCourseError("DeactivateCategory", err, "category not found")
	}

	// Check if already inactive
	if !category.IsActive {
		return nil // Already inactive, no error
	}

	// Deactivate
	category.Deactivate()

	// Update in repository
	if err := s.categoryRepo.UpdateCategory(ctx, category); err != nil {
		return ports.NewCourseError("DeactivateCategory", err, "failed to deactivate category")
	}

	return nil
}

// GetSubcategories retrieves all subcategories of a parent category
func (s *CourseCategoryServiceImpl) GetSubcategories(ctx context.Context, parentID, tenantID uuid.UUID) ([]*domain.CourseCategoryResponse, error) {
	// Validate parent category exists
	_, err := s.categoryRepo.GetCategory(ctx, parentID, tenantID)
	if err != nil {
		return nil, ports.NewCourseError("GetSubcategories", err, "parent category not found")
	}

	// Get subcategories
	subcategories, err := s.categoryRepo.GetSubcategories(ctx, parentID, tenantID)
	if err != nil {
		return nil, ports.NewCourseError("GetSubcategories", err, "failed to get subcategories")
	}

	// Convert to response DTOs
	responses := make([]*domain.CourseCategoryResponse, len(subcategories))
	for i, cat := range subcategories {
		responses[i] = domain.CategoryToResponse(cat)
	}

	return responses, nil
}
