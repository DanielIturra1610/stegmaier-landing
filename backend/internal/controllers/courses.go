package controllers

import (
	"strconv"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/courses/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/courses/ports"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// CourseController handles course-related HTTP requests
type CourseController struct {
	courseService ports.CourseService
}

// NewCourseController creates a new CourseController
func NewCourseController(courseService ports.CourseService) *CourseController {
	return &CourseController{
		courseService: courseService,
	}
}

// GetCourse retrieves a course by ID
// GET /api/v1/courses/:id
func (ctrl *CourseController) GetCourse(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	course, err := ctrl.courseService.GetCourse(c.Context(), courseID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course retrieved successfully", course)
}

// GetCourseBySlug retrieves a course by its slug
// GET /api/v1/courses/slug/:slug
func (ctrl *CourseController) GetCourseBySlug(c *fiber.Ctx) error {
	// Get slug from params
	slug := c.Params("slug")
	if slug == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Slug is required")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	course, err := ctrl.courseService.GetCourseBySlug(c.Context(), slug, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course retrieved successfully", course)
}

// ListCourses retrieves courses with pagination and filters
// GET /api/v1/courses
func (ctrl *CourseController) ListCourses(c *fiber.Ctx) error {
	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse query parameters into ListCoursesRequest
	var req domain.ListCoursesRequest
	if err := c.QueryParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid query parameters")
	}

	// Call service
	response, err := ctrl.courseService.ListCourses(c.Context(), tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Courses retrieved successfully", response)
}

// GetPublishedCourses retrieves all published courses
// GET /api/v1/courses/published
func (ctrl *CourseController) GetPublishedCourses(c *fiber.Ctx) error {
	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
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
	response, err := ctrl.courseService.GetPublishedCourses(c.Context(), tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Published courses retrieved successfully", response)
}

// GetCoursesByInstructor retrieves courses by instructor
// GET /api/v1/courses/instructor/:instructorId
func (ctrl *CourseController) GetCoursesByInstructor(c *fiber.Ctx) error {
	// Get instructor ID from params
	instructorID, err := uuid.Parse(c.Params("instructorId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid instructor ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
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
	response, err := ctrl.courseService.GetCoursesByInstructor(c.Context(), instructorID, tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Instructor courses retrieved successfully", response)
}

// GetCoursesByCategory retrieves courses by category
// GET /api/v1/courses/category/:categoryId
func (ctrl *CourseController) GetCoursesByCategory(c *fiber.Ctx) error {
	// Get category ID from params
	categoryID, err := uuid.Parse(c.Params("categoryId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid category ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
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
	response, err := ctrl.courseService.GetCoursesByCategory(c.Context(), categoryID, tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Category courses retrieved successfully", response)
}

// CreateCourse creates a new course (instructor/admin only)
// POST /api/v1/courses
func (ctrl *CourseController) CreateCourse(c *fiber.Ctx) error {
	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.CreateCourseRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	course, err := ctrl.courseService.CreateCourse(c.Context(), tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Course created successfully", course)
}

// UpdateCourse updates an existing course (instructor/admin only)
// PUT /api/v1/courses/:id
func (ctrl *CourseController) UpdateCourse(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.UpdateCourseRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	course, err := ctrl.courseService.UpdateCourse(c.Context(), courseID, tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course updated successfully", course)
}

// DeleteCourse soft deletes a course (instructor/admin only)
// DELETE /api/v1/courses/:id
func (ctrl *CourseController) DeleteCourse(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	if err := ctrl.courseService.DeleteCourse(c.Context(), courseID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course deleted successfully", nil)
}

// PublishCourse publishes a course (instructor/admin only)
// POST /api/v1/courses/:id/publish
func (ctrl *CourseController) PublishCourse(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	if err := ctrl.courseService.PublishCourse(c.Context(), courseID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course published successfully", nil)
}

// UnpublishCourse unpublishes a course (instructor/admin only)
// POST /api/v1/courses/:id/unpublish
func (ctrl *CourseController) UnpublishCourse(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	if err := ctrl.courseService.UnpublishCourse(c.Context(), courseID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course unpublished successfully", nil)
}

// ArchiveCourse archives a course (instructor/admin only)
// POST /api/v1/courses/:id/archive
func (ctrl *CourseController) ArchiveCourse(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	if err := ctrl.courseService.ArchiveCourse(c.Context(), courseID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course archived successfully", nil)
}

// EnrollCourse enrolls a user in a course
// POST /api/v1/courses/:id/enroll
func (ctrl *CourseController) EnrollCourse(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("id"))
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
	if err := ctrl.courseService.EnrollCourse(c.Context(), courseID, userID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Enrolled in course successfully", nil)
}

// UnenrollCourse unenrolls a user from a course
// POST /api/v1/courses/:id/unenroll
func (ctrl *CourseController) UnenrollCourse(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("id"))
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
	if err := ctrl.courseService.UnenrollCourse(c.Context(), courseID, userID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Unenrolled from course successfully", nil)
}

// RateCourse rates a course
// POST /api/v1/courses/:id/rate
func (ctrl *CourseController) RateCourse(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.RateCourseRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Set course ID from params (override if in body)
	req.CourseID = courseID

	// Call service
	if err := ctrl.courseService.RateCourse(c.Context(), courseID, tenantID, &req); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course rated successfully", nil)
}
