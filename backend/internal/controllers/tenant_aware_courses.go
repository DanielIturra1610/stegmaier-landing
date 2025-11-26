package controllers

import (
	"log"
	"strconv"

	courseadapters "github.com/DanielIturra1610/stegmaier-landing/internal/core/courses/adapters"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/courses/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/courses/ports"
	courseservices "github.com/DanielIturra1610/stegmaier-landing/internal/core/courses/services"
	"github.com/DanielIturra1610/stegmaier-landing/internal/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// TenantAwareCourseController handles course-related HTTP requests with dynamic tenant DB connection
// This controller creates repositories and services dynamically using the tenant DB from context
type TenantAwareCourseController struct{}

// NewTenantAwareCourseController creates a new TenantAwareCourseController
func NewTenantAwareCourseController() *TenantAwareCourseController {
	return &TenantAwareCourseController{}
}

// getCourseService creates a course service using the tenant DB from context
func (ctrl *TenantAwareCourseController) getCourseService(c *fiber.Ctx) (ports.CourseService, error) {
	tenantDB, err := middleware.MustGetTenantDBFromContext(c)
	if err != nil {
		return nil, err
	}

	// Create repositories with tenant DB
	courseRepo := courseadapters.NewPostgreSQLCourseRepository(tenantDB)
	categoryRepo := courseadapters.NewPostgreSQLCourseCategoryRepository(tenantDB)

	// Create and return service
	return courseservices.NewCourseService(courseRepo, categoryRepo), nil
}

// GetCourse retrieves a course by ID
// GET /api/v1/courses/:id
func (ctrl *TenantAwareCourseController) GetCourse(c *fiber.Ctx) error {
	// Get course service with tenant DB
	courseService, err := ctrl.getCourseService(c)
	if err != nil {
		log.Printf("❌ Failed to get course service: %v", err)
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
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
	course, err := courseService.GetCourse(c.Context(), courseID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course retrieved successfully", course)
}

// GetCourseBySlug retrieves a course by its slug
// GET /api/v1/courses/slug/:slug
func (ctrl *TenantAwareCourseController) GetCourseBySlug(c *fiber.Ctx) error {
	courseService, err := ctrl.getCourseService(c)
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

	course, err := courseService.GetCourseBySlug(c.Context(), slug, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course retrieved successfully", course)
}

// ListCourses retrieves courses with pagination and filters
// GET /api/v1/courses
func (ctrl *TenantAwareCourseController) ListCourses(c *fiber.Ctx) error {
	courseService, err := ctrl.getCourseService(c)
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

	var req domain.ListCoursesRequest
	if err := c.QueryParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid query parameters")
	}

	response, err := courseService.ListCourses(c.Context(), tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Courses retrieved successfully", response)
}

// GetPublishedCourses retrieves all published courses
// GET /api/v1/courses/published
func (ctrl *TenantAwareCourseController) GetPublishedCourses(c *fiber.Ctx) error {
	courseService, err := ctrl.getCourseService(c)
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

	response, err := courseService.GetPublishedCourses(c.Context(), tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Published courses retrieved successfully", response)
}

// GetCoursesByInstructor retrieves courses by instructor
// GET /api/v1/courses/instructor/:instructorId
func (ctrl *TenantAwareCourseController) GetCoursesByInstructor(c *fiber.Ctx) error {
	courseService, err := ctrl.getCourseService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	instructorID, err := uuid.Parse(c.Params("instructorId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid instructor ID")
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

	response, err := courseService.GetCoursesByInstructor(c.Context(), instructorID, tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Instructor courses retrieved successfully", response)
}

// GetCoursesByCategory retrieves courses by category
// GET /api/v1/courses/category/:categoryId
func (ctrl *TenantAwareCourseController) GetCoursesByCategory(c *fiber.Ctx) error {
	courseService, err := ctrl.getCourseService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	categoryID, err := uuid.Parse(c.Params("categoryId"))
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

	response, err := courseService.GetCoursesByCategory(c.Context(), categoryID, tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Category courses retrieved successfully", response)
}

// CreateCourse creates a new course (instructor/admin only)
// POST /api/v1/courses
func (ctrl *TenantAwareCourseController) CreateCourse(c *fiber.Ctx) error {
	courseService, err := ctrl.getCourseService(c)
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

	var req domain.CreateCourseRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	course, err := courseService.CreateCourse(c.Context(), tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Course created successfully", course)
}

// UpdateCourse updates an existing course (instructor/admin only)
// PUT /api/v1/courses/:id
func (ctrl *TenantAwareCourseController) UpdateCourse(c *fiber.Ctx) error {
	courseService, err := ctrl.getCourseService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	courseID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	var req domain.UpdateCourseRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	course, err := courseService.UpdateCourse(c.Context(), courseID, tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course updated successfully", course)
}

// DeleteCourse soft deletes a course (instructor/admin only)
// DELETE /api/v1/courses/:id
func (ctrl *TenantAwareCourseController) DeleteCourse(c *fiber.Ctx) error {
	courseService, err := ctrl.getCourseService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	courseID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	if err := courseService.DeleteCourse(c.Context(), courseID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course deleted successfully", nil)
}

// PublishCourse publishes a course (instructor/admin only)
// POST /api/v1/courses/:id/publish
func (ctrl *TenantAwareCourseController) PublishCourse(c *fiber.Ctx) error {
	courseService, err := ctrl.getCourseService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	courseID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	if err := courseService.PublishCourse(c.Context(), courseID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course published successfully", nil)
}

// UnpublishCourse unpublishes a course (instructor/admin only)
// POST /api/v1/courses/:id/unpublish
func (ctrl *TenantAwareCourseController) UnpublishCourse(c *fiber.Ctx) error {
	courseService, err := ctrl.getCourseService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	courseID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	if err := courseService.UnpublishCourse(c.Context(), courseID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course unpublished successfully", nil)
}

// ArchiveCourse archives a course (instructor/admin only)
// POST /api/v1/courses/:id/archive
func (ctrl *TenantAwareCourseController) ArchiveCourse(c *fiber.Ctx) error {
	courseService, err := ctrl.getCourseService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	courseID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	if err := courseService.ArchiveCourse(c.Context(), courseID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course archived successfully", nil)
}

// EnrollCourse enrolls a user in a course
// POST /api/v1/courses/:id/enroll
func (ctrl *TenantAwareCourseController) EnrollCourse(c *fiber.Ctx) error {
	courseService, err := ctrl.getCourseService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	courseID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	if err := courseService.EnrollCourse(c.Context(), courseID, userID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Enrolled in course successfully", nil)
}

// UnenrollCourse unenrolls a user from a course
// POST /api/v1/courses/:id/unenroll
func (ctrl *TenantAwareCourseController) UnenrollCourse(c *fiber.Ctx) error {
	courseService, err := ctrl.getCourseService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	courseID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	if err := courseService.UnenrollCourse(c.Context(), courseID, userID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Unenrolled from course successfully", nil)
}

// RateCourse rates a course
// POST /api/v1/courses/:id/rate
func (ctrl *TenantAwareCourseController) RateCourse(c *fiber.Ctx) error {
	courseService, err := ctrl.getCourseService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	courseID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	tenantIDStr := middleware.GetTenantIDFromContext(c)
	if tenantIDStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Tenant ID required")
	}
	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	var req domain.RateCourseRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	req.CourseID = courseID

	if err := courseService.RateCourse(c.Context(), courseID, tenantID, &req); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course rated successfully", nil)
}
