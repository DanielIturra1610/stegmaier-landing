package controllers

import (
	"strconv"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/enrollments/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/enrollments/ports"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// EnrollmentController handles HTTP requests for enrollment operations
type EnrollmentController struct {
	service ports.EnrollmentService
}

// NewEnrollmentController creates a new enrollment controller
func NewEnrollmentController(service ports.EnrollmentService) *EnrollmentController {
	return &EnrollmentController{
		service: service,
	}
}

// ============================================================================
// Student Enrollment Operations
// ============================================================================

// EnrollInCourse handles student enrollment in a course
// @Summary Enroll in a course
// @Description Allows a student to enroll in a course (creates enrollment or enrollment request based on course settings)
// @Tags enrollments
// @Accept json
// @Produce json
// @Param request body domain.EnrollInCourseRequest true "Enrollment request"
// @Success 201 {object} domain.EnrollmentResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 409 {object} map[string]interface{} "Already enrolled"
// @Failure 500 {object} map[string]interface{}
// @Router /enrollments/enroll [post]
// @Security Bearer
func (c *EnrollmentController) EnrollInCourse(ctx *fiber.Ctx) error {
	// Get tenant ID from context (injected by tenant middleware)
	tenantIDStr, ok := ctx.Locals("tenant_id").(string)
	if !ok || tenantIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid tenant ID",
		})
	}

	// Get user ID from context (injected by auth middleware)
	userIDStr, ok := ctx.Locals("userID").(string)
	if !ok || userIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: user ID not found",
		})
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user ID",
		})
	}

	// Parse request body
	var req domain.EnrollInCourseRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Call service
	enrollment, err := c.service.EnrollInCourse(ctx.Context(), userID, tenantID, &req)
	if err != nil {
		// Handle specific errors
		switch err {
		case domain.ErrAlreadyEnrolled:
			return ctx.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "already enrolled in this course",
			})
		case domain.ErrCourseNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "course not found",
			})
		case domain.ErrCourseFull:
			return ctx.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "course is full",
			})
		case domain.ErrCourseNotPublished:
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "course is not published",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to enroll in course",
			})
		}
	}

	return ctx.Status(fiber.StatusCreated).JSON(enrollment)
}

// GetMyEnrollments retrieves all enrollments for the authenticated user
// @Summary Get my enrollments
// @Description Retrieves all courses the authenticated user is enrolled in
// @Tags enrollments
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param pageSize query int false "Page size" default(20)
// @Success 200 {object} domain.ListEnrollmentsResponse
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /enrollments/my [get]
// @Security Bearer
func (c *EnrollmentController) GetMyEnrollments(ctx *fiber.Ctx) error {
	tenantIDStr, ok := ctx.Locals("tenant_id").(string)
	if !ok || tenantIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid tenant ID",
		})
	}

	userIDStr, ok := ctx.Locals("userID").(string)
	if !ok || userIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: user ID not found",
		})
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user ID",
		})
	}

	// Parse pagination parameters
	page, _ := strconv.Atoi(ctx.Query("page", "1"))
	pageSize, _ := strconv.Atoi(ctx.Query("pageSize", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Call service
	enrollments, err := c.service.GetMyEnrollments(ctx.Context(), userID, tenantID, page, pageSize)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to retrieve enrollments",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(enrollments)
}

// GetMyEnrollment retrieves a specific enrollment for the authenticated user
// @Summary Get my enrollment details
// @Description Retrieves detailed information about a specific enrollment
// @Tags enrollments
// @Accept json
// @Produce json
// @Param enrollmentID path string true "Enrollment ID"
// @Success 200 {object} domain.EnrollmentDetailResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{} "Not your enrollment"
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /enrollments/my/{enrollmentID} [get]
// @Security Bearer
func (c *EnrollmentController) GetMyEnrollment(ctx *fiber.Ctx) error {
	tenantIDStr, ok := ctx.Locals("tenant_id").(string)
	if !ok || tenantIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid tenant ID",
		})
	}

	userIDStr, ok := ctx.Locals("userID").(string)
	if !ok || userIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: user ID not found",
		})
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user ID",
		})
	}

	// Parse enrollment ID
	enrollmentIDStr := ctx.Params("enrollmentID")
	enrollmentID, err := uuid.Parse(enrollmentIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid enrollment ID",
		})
	}

	// Call service
	enrollment, err := c.service.GetMyEnrollment(ctx.Context(), enrollmentID, userID, tenantID)
	if err != nil {
		switch err {
		case domain.ErrEnrollmentNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "enrollment not found",
			})
		case domain.ErrUnauthorizedAccess:
			return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "you don't have access to this enrollment",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to retrieve enrollment",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(enrollment)
}

// CancelMyEnrollment allows a student to cancel their enrollment
// @Summary Cancel my enrollment
// @Description Allows a student to cancel their enrollment in a course
// @Tags enrollments
// @Accept json
// @Produce json
// @Param enrollmentID path string true "Enrollment ID"
// @Param request body domain.CancelEnrollmentRequest true "Cancellation request"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /enrollments/my/{enrollmentID}/cancel [post]
// @Security Bearer
func (c *EnrollmentController) CancelMyEnrollment(ctx *fiber.Ctx) error {
	tenantIDStr, ok := ctx.Locals("tenant_id").(string)
	if !ok || tenantIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid tenant ID",
		})
	}

	userIDStr, ok := ctx.Locals("userID").(string)
	if !ok || userIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: user ID not found",
		})
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user ID",
		})
	}

	// Parse enrollment ID
	enrollmentIDStr := ctx.Params("enrollmentID")
	enrollmentID, err := uuid.Parse(enrollmentIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid enrollment ID",
		})
	}

	// Parse request body
	var req domain.CancelEnrollmentRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Call service
	err = c.service.CancelMyEnrollment(ctx.Context(), enrollmentID, userID, tenantID, req.Reason)
	if err != nil {
		switch err {
		case domain.ErrEnrollmentNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "enrollment not found",
			})
		case domain.ErrUnauthorizedAccess:
			return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "you don't have access to this enrollment",
			})
		case domain.ErrEnrollmentAlreadyCancelled:
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "enrollment is already cancelled",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to cancel enrollment",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "enrollment cancelled successfully",
	})
}

// CheckCourseAccess checks if the authenticated user has access to a course
// @Summary Check course access
// @Description Checks if the authenticated user can access a specific course
// @Tags enrollments
// @Accept json
// @Produce json
// @Param courseID path string true "Course ID"
// @Success 200 {object} map[string]interface{} "Returns {hasAccess: bool}"
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /enrollments/courses/{courseID}/access [get]
// @Security Bearer
func (c *EnrollmentController) CheckCourseAccess(ctx *fiber.Ctx) error {
	tenantIDStr, ok := ctx.Locals("tenant_id").(string)
	if !ok || tenantIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid tenant ID",
		})
	}

	userIDStr, ok := ctx.Locals("userID").(string)
	if !ok || userIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: user ID not found",
		})
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user ID",
		})
	}

	// Parse course ID
	courseIDStr := ctx.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid course ID",
		})
	}

	// Call service
	hasAccess, err := c.service.CheckCourseAccess(ctx.Context(), userID, courseID, tenantID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to check course access",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"hasAccess": hasAccess,
	})
}

// RecordCourseAccess records that a user accessed a course (updates last_accessed_at)
// @Summary Record course access
// @Description Records that the user accessed a course, updating the last accessed timestamp
// @Tags enrollments
// @Accept json
// @Produce json
// @Param courseID path string true "Course ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /enrollments/courses/{courseID}/access [post]
// @Security Bearer
func (c *EnrollmentController) RecordCourseAccess(ctx *fiber.Ctx) error {
	tenantIDStr, ok := ctx.Locals("tenant_id").(string)
	if !ok || tenantIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid tenant ID",
		})
	}

	userIDStr, ok := ctx.Locals("userID").(string)
	if !ok || userIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: user ID not found",
		})
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user ID",
		})
	}

	// Parse course ID
	courseIDStr := ctx.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid course ID",
		})
	}

	// Call service
	err = c.service.RecordCourseAccess(ctx.Context(), userID, courseID, tenantID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to record course access",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "course access recorded",
	})
}

// ============================================================================
// Enrollment Request Operations (Student)
// ============================================================================

// RequestEnrollment creates an enrollment request for courses requiring approval
// @Summary Request enrollment
// @Description Creates an enrollment request for courses that require instructor/admin approval
// @Tags enrollment-requests
// @Accept json
// @Produce json
// @Param request body domain.EnrollInCourseRequest true "Enrollment request"
// @Success 201 {object} domain.EnrollmentRequestResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 409 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /enrollment-requests [post]
// @Security Bearer
func (c *EnrollmentController) RequestEnrollment(ctx *fiber.Ctx) error {
	tenantIDStr, ok := ctx.Locals("tenant_id").(string)
	if !ok || tenantIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid tenant ID",
		})
	}

	userIDStr, ok := ctx.Locals("userID").(string)
	if !ok || userIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: user ID not found",
		})
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user ID",
		})
	}

	// Parse request body
	var req domain.EnrollInCourseRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Call service
	enrollmentRequest, err := c.service.RequestEnrollment(ctx.Context(), userID, tenantID, &req)
	if err != nil {
		switch err {
		case domain.ErrAlreadyEnrolled:
			return ctx.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "already enrolled in this course",
			})
		case domain.ErrEnrollmentRequestAlreadyExists:
			return ctx.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "enrollment request already exists",
			})
		case domain.ErrCourseNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "course not found",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to create enrollment request",
			})
		}
	}

	return ctx.Status(fiber.StatusCreated).JSON(enrollmentRequest)
}

// GetMyEnrollmentRequests retrieves all enrollment requests for the authenticated user
// @Summary Get my enrollment requests
// @Description Retrieves all enrollment requests made by the authenticated user
// @Tags enrollment-requests
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param pageSize query int false "Page size" default(20)
// @Success 200 {object} domain.ListEnrollmentRequestsResponse
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /enrollment-requests/my [get]
// @Security Bearer
func (c *EnrollmentController) GetMyEnrollmentRequests(ctx *fiber.Ctx) error {
	tenantIDStr, ok := ctx.Locals("tenant_id").(string)
	if !ok || tenantIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid tenant ID",
		})
	}

	userIDStr, ok := ctx.Locals("userID").(string)
	if !ok || userIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: user ID not found",
		})
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user ID",
		})
	}

	// Parse pagination parameters
	page, _ := strconv.Atoi(ctx.Query("page", "1"))
	pageSize, _ := strconv.Atoi(ctx.Query("pageSize", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Call service
	requests, err := c.service.GetMyEnrollmentRequests(ctx.Context(), userID, tenantID, page, pageSize)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to retrieve enrollment requests",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(requests)
}

// CancelEnrollmentRequest allows a student to cancel their enrollment request
// @Summary Cancel enrollment request
// @Description Allows a student to cancel their pending enrollment request
// @Tags enrollment-requests
// @Accept json
// @Produce json
// @Param requestID path string true "Enrollment Request ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 403 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /enrollment-requests/{requestID}/cancel [post]
// @Security Bearer
func (c *EnrollmentController) CancelEnrollmentRequest(ctx *fiber.Ctx) error {
	tenantIDStr, ok := ctx.Locals("tenant_id").(string)
	if !ok || tenantIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid tenant ID",
		})
	}

	userIDStr, ok := ctx.Locals("userID").(string)
	if !ok || userIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: user ID not found",
		})
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user ID",
		})
	}

	// Parse request ID
	requestIDStr := ctx.Params("requestID")
	requestID, err := uuid.Parse(requestIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request ID",
		})
	}

	// Call service
	err = c.service.CancelEnrollmentRequest(ctx.Context(), requestID, userID, tenantID)
	if err != nil {
		switch err {
		case domain.ErrEnrollmentRequestNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "enrollment request not found",
			})
		case domain.ErrUnauthorizedAccess:
			return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "you don't have access to this enrollment request",
			})
		case domain.ErrEnrollmentRequestAlreadyProcessed:
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "enrollment request has already been processed",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to cancel enrollment request",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "enrollment request cancelled successfully",
	})
}

// ============================================================================
// Enrollment Management (Instructor/Admin)
// ============================================================================

// GetEnrollment retrieves a specific enrollment (instructor/admin)
// @Summary Get enrollment details
// @Description Retrieves detailed information about a specific enrollment (instructor/admin only)
// @Tags enrollments
// @Accept json
// @Produce json
// @Param enrollmentID path string true "Enrollment ID"
// @Success 200 {object} domain.EnrollmentDetailResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /enrollments/{enrollmentID} [get]
// @Security Bearer
func (c *EnrollmentController) GetEnrollment(ctx *fiber.Ctx) error {
	tenantIDStr, ok := ctx.Locals("tenant_id").(string)
	if !ok || tenantIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid tenant ID",
		})
	}

	// Parse enrollment ID
	enrollmentIDStr := ctx.Params("enrollmentID")
	enrollmentID, err := uuid.Parse(enrollmentIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid enrollment ID",
		})
	}

	// Call service
	enrollment, err := c.service.GetEnrollment(ctx.Context(), enrollmentID, tenantID)
	if err != nil {
		switch err {
		case domain.ErrEnrollmentNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "enrollment not found",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to retrieve enrollment",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(enrollment)
}

// ListEnrollments retrieves enrollments with filters (instructor/admin)
// @Summary List enrollments
// @Description Retrieves enrollments with optional filters (instructor/admin only)
// @Tags enrollments
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param pageSize query int false "Page size" default(20)
// @Param userID query string false "Filter by user ID"
// @Param courseID query string false "Filter by course ID"
// @Param status query string false "Filter by status (pending/active/completed/cancelled/expired)"
// @Param sortBy query string false "Sort by field (enrolled_at/progress/last_accessed/completed_at)"
// @Param sortOrder query string false "Sort order (asc/desc)"
// @Success 200 {object} domain.ListEnrollmentsResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /enrollments [get]
// @Security Bearer
func (c *EnrollmentController) ListEnrollments(ctx *fiber.Ctx) error {
	tenantIDStr, ok := ctx.Locals("tenant_id").(string)
	if !ok || tenantIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid tenant ID",
		})
	}

	// Parse query parameters
	page, _ := strconv.Atoi(ctx.Query("page", "1"))
	pageSize, _ := strconv.Atoi(ctx.Query("pageSize", "20"))

	req := &domain.ListEnrollmentsRequest{
		Page:     page,
		PageSize: pageSize,
	}

	// Parse optional filters
	if userIDStr := ctx.Query("userID"); userIDStr != "" {
		userID, err := uuid.Parse(userIDStr)
		if err == nil {
			req.UserID = &userID
		}
	}

	if courseIDStr := ctx.Query("courseID"); courseIDStr != "" {
		courseID, err := uuid.Parse(courseIDStr)
		if err == nil {
			req.CourseID = &courseID
		}
	}

	if statusStr := ctx.Query("status"); statusStr != "" {
		status := domain.EnrollmentStatus(statusStr)
		req.Status = &status
	}

	if sortBy := ctx.Query("sortBy"); sortBy != "" {
		req.SortBy = &sortBy
	}

	if sortOrder := ctx.Query("sortOrder"); sortOrder != "" {
		req.SortOrder = &sortOrder
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Call service
	enrollments, err := c.service.ListEnrollments(ctx.Context(), tenantID, req)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to list enrollments",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(enrollments)
}

// GetCourseEnrollments retrieves all enrollments for a course (instructor/admin)
// @Summary Get course enrollments
// @Description Retrieves all enrollments for a specific course (instructor/admin only)
// @Tags enrollments
// @Accept json
// @Produce json
// @Param courseID path string true "Course ID"
// @Param page query int false "Page number" default(1)
// @Param pageSize query int false "Page size" default(20)
// @Success 200 {object} domain.ListEnrollmentsResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /enrollments/courses/{courseID} [get]
// @Security Bearer
func (c *EnrollmentController) GetCourseEnrollments(ctx *fiber.Ctx) error {
	tenantIDStr, ok := ctx.Locals("tenant_id").(string)
	if !ok || tenantIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid tenant ID",
		})
	}

	// Parse course ID
	courseIDStr := ctx.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid course ID",
		})
	}

	// Parse pagination parameters
	page, _ := strconv.Atoi(ctx.Query("page", "1"))
	pageSize, _ := strconv.Atoi(ctx.Query("pageSize", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Call service
	enrollments, err := c.service.GetCourseEnrollments(ctx.Context(), courseID, tenantID, page, pageSize)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to retrieve course enrollments",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(enrollments)
}

// UpdateEnrollmentProgress updates the progress of an enrollment (instructor/admin)
// @Summary Update enrollment progress
// @Description Updates the progress percentage of an enrollment (instructor/admin only)
// @Tags enrollments
// @Accept json
// @Produce json
// @Param enrollmentID path string true "Enrollment ID"
// @Param request body domain.UpdateProgressRequest true "Progress update request"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /enrollments/{enrollmentID}/progress [put]
// @Security Bearer
func (c *EnrollmentController) UpdateEnrollmentProgress(ctx *fiber.Ctx) error {
	tenantIDStr, ok := ctx.Locals("tenant_id").(string)
	if !ok || tenantIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid tenant ID",
		})
	}

	// Parse enrollment ID
	enrollmentIDStr := ctx.Params("enrollmentID")
	enrollmentID, err := uuid.Parse(enrollmentIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid enrollment ID",
		})
	}

	// Parse request body
	var req domain.UpdateProgressRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Call service
	err = c.service.UpdateEnrollmentProgress(ctx.Context(), enrollmentID, tenantID, req.ProgressPercentage)
	if err != nil {
		switch err {
		case domain.ErrEnrollmentNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "enrollment not found",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to update enrollment progress",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "enrollment progress updated successfully",
	})
}

// CompleteEnrollment marks an enrollment as completed (instructor/admin)
// @Summary Complete enrollment
// @Description Marks an enrollment as completed, optionally linking a certificate (instructor/admin only)
// @Tags enrollments
// @Accept json
// @Produce json
// @Param enrollmentID path string true "Enrollment ID"
// @Param certificateID body string false "Certificate ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /enrollments/{enrollmentID}/complete [post]
// @Security Bearer
func (c *EnrollmentController) CompleteEnrollment(ctx *fiber.Ctx) error {
	tenantIDStr, ok := ctx.Locals("tenant_id").(string)
	if !ok || tenantIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid tenant ID",
		})
	}

	// Parse enrollment ID
	enrollmentIDStr := ctx.Params("enrollmentID")
	enrollmentID, err := uuid.Parse(enrollmentIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid enrollment ID",
		})
	}

	// Parse optional certificate ID from body
	var body struct {
		CertificateID *uuid.UUID `json:"certificateId,omitempty"`
	}
	if err := ctx.BodyParser(&body); err != nil {
		// Ignore parsing errors for optional body
	}

	// Call service
	err = c.service.CompleteEnrollment(ctx.Context(), enrollmentID, tenantID, body.CertificateID)
	if err != nil {
		switch err {
		case domain.ErrEnrollmentNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "enrollment not found",
			})
		case domain.ErrEnrollmentAlreadyCompleted:
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "enrollment is already completed",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to complete enrollment",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "enrollment completed successfully",
	})
}

// CancelEnrollment cancels an enrollment (instructor/admin)
// @Summary Cancel enrollment
// @Description Cancels an enrollment (instructor/admin only)
// @Tags enrollments
// @Accept json
// @Produce json
// @Param enrollmentID path string true "Enrollment ID"
// @Param request body domain.CancelEnrollmentRequest true "Cancellation request"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /enrollments/{enrollmentID}/cancel [post]
// @Security Bearer
func (c *EnrollmentController) CancelEnrollment(ctx *fiber.Ctx) error {
	tenantIDStr, ok := ctx.Locals("tenant_id").(string)
	if !ok || tenantIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid tenant ID",
		})
	}

	// Parse enrollment ID
	enrollmentIDStr := ctx.Params("enrollmentID")
	enrollmentID, err := uuid.Parse(enrollmentIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid enrollment ID",
		})
	}

	// Parse request body
	var req domain.CancelEnrollmentRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Call service
	err = c.service.CancelEnrollment(ctx.Context(), enrollmentID, tenantID, req.Reason)
	if err != nil {
		switch err {
		case domain.ErrEnrollmentNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "enrollment not found",
			})
		case domain.ErrEnrollmentAlreadyCancelled:
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "enrollment is already cancelled",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to cancel enrollment",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "enrollment cancelled successfully",
	})
}

// ExtendEnrollment extends the expiration date of an enrollment (instructor/admin)
// @Summary Extend enrollment
// @Description Extends the expiration date of an enrollment (instructor/admin only)
// @Tags enrollments
// @Accept json
// @Produce json
// @Param enrollmentID path string true "Enrollment ID"
// @Param request body domain.ExtendEnrollmentRequest true "Extension request"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /enrollments/{enrollmentID}/extend [post]
// @Security Bearer
func (c *EnrollmentController) ExtendEnrollment(ctx *fiber.Ctx) error {
	tenantIDStr, ok := ctx.Locals("tenant_id").(string)
	if !ok || tenantIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid tenant ID",
		})
	}

	// Parse enrollment ID
	enrollmentIDStr := ctx.Params("enrollmentID")
	enrollmentID, err := uuid.Parse(enrollmentIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid enrollment ID",
		})
	}

	// Parse request body
	var req domain.ExtendEnrollmentRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Call service
	err = c.service.ExtendEnrollment(ctx.Context(), enrollmentID, tenantID, req.NewExpiresAt)
	if err != nil {
		switch err {
		case domain.ErrEnrollmentNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "enrollment not found",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to extend enrollment",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "enrollment extended successfully",
	})
}

// DeleteEnrollment deletes an enrollment (admin only)
// @Summary Delete enrollment
// @Description Permanently deletes an enrollment (admin only)
// @Tags enrollments
// @Accept json
// @Produce json
// @Param enrollmentID path string true "Enrollment ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /enrollments/{enrollmentID} [delete]
// @Security Bearer
func (c *EnrollmentController) DeleteEnrollment(ctx *fiber.Ctx) error {
	tenantIDStr, ok := ctx.Locals("tenant_id").(string)
	if !ok || tenantIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid tenant ID",
		})
	}

	// Parse enrollment ID
	enrollmentIDStr := ctx.Params("enrollmentID")
	enrollmentID, err := uuid.Parse(enrollmentIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid enrollment ID",
		})
	}

	// Call service
	err = c.service.DeleteEnrollment(ctx.Context(), enrollmentID, tenantID)
	if err != nil {
		switch err {
		case domain.ErrEnrollmentNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "enrollment not found",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to delete enrollment",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "enrollment deleted successfully",
	})
}

// ============================================================================
// Enrollment Request Management (Instructor/Admin)
// ============================================================================

// GetEnrollmentRequest retrieves a specific enrollment request (instructor/admin)
// @Summary Get enrollment request details
// @Description Retrieves detailed information about an enrollment request (instructor/admin only)
// @Tags enrollment-requests
// @Accept json
// @Produce json
// @Param requestID path string true "Enrollment Request ID"
// @Success 200 {object} domain.EnrollmentRequestResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /enrollment-requests/{requestID} [get]
// @Security Bearer
func (c *EnrollmentController) GetEnrollmentRequest(ctx *fiber.Ctx) error {
	tenantIDStr, ok := ctx.Locals("tenant_id").(string)
	if !ok || tenantIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid tenant ID",
		})
	}

	// Parse request ID
	requestIDStr := ctx.Params("requestID")
	requestID, err := uuid.Parse(requestIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request ID",
		})
	}

	// Call service
	enrollmentRequest, err := c.service.GetEnrollmentRequest(ctx.Context(), requestID, tenantID)
	if err != nil {
		switch err {
		case domain.ErrEnrollmentRequestNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "enrollment request not found",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to retrieve enrollment request",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(enrollmentRequest)
}

// ListEnrollmentRequests retrieves enrollment requests with filters (instructor/admin)
// @Summary List enrollment requests
// @Description Retrieves enrollment requests with optional filters (instructor/admin only)
// @Tags enrollment-requests
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param pageSize query int false "Page size" default(20)
// @Param courseID query string false "Filter by course ID"
// @Param status query string false "Filter by status (pending/approved/rejected/cancelled)"
// @Param sortBy query string false "Sort by field (requested_at/reviewed_at)"
// @Param sortOrder query string false "Sort order (asc/desc)"
// @Success 200 {object} domain.ListEnrollmentRequestsResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /enrollment-requests [get]
// @Security Bearer
func (c *EnrollmentController) ListEnrollmentRequests(ctx *fiber.Ctx) error {
	tenantIDStr, ok := ctx.Locals("tenant_id").(string)
	if !ok || tenantIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid tenant ID",
		})
	}

	// Parse query parameters
	page, _ := strconv.Atoi(ctx.Query("page", "1"))
	pageSize, _ := strconv.Atoi(ctx.Query("pageSize", "20"))

	req := &domain.ListEnrollmentRequestsRequest{
		Page:     page,
		PageSize: pageSize,
	}

	// Parse optional filters
	if courseIDStr := ctx.Query("courseID"); courseIDStr != "" {
		courseID, err := uuid.Parse(courseIDStr)
		if err == nil {
			req.CourseID = &courseID
		}
	}

	if statusStr := ctx.Query("status"); statusStr != "" {
		status := domain.EnrollmentRequestStatus(statusStr)
		req.Status = &status
	}

	if sortBy := ctx.Query("sortBy"); sortBy != "" {
		req.SortBy = &sortBy
	}

	if sortOrder := ctx.Query("sortOrder"); sortOrder != "" {
		req.SortOrder = &sortOrder
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Call service
	requests, err := c.service.ListEnrollmentRequests(ctx.Context(), tenantID, req)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to list enrollment requests",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(requests)
}

// GetPendingEnrollmentRequests retrieves pending enrollment requests for a course
// @Summary Get pending enrollment requests for a course
// @Description Retrieves all pending enrollment requests for a specific course (instructor/admin only)
// @Tags enrollment-requests
// @Accept json
// @Produce json
// @Param courseID path string true "Course ID"
// @Param page query int false "Page number" default(1)
// @Param pageSize query int false "Page size" default(20)
// @Success 200 {object} domain.ListEnrollmentRequestsResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /enrollment-requests/courses/{courseID}/pending [get]
// @Security Bearer
func (c *EnrollmentController) GetPendingEnrollmentRequests(ctx *fiber.Ctx) error {
	tenantIDStr, ok := ctx.Locals("tenant_id").(string)
	if !ok || tenantIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid tenant ID",
		})
	}

	// Parse course ID
	courseIDStr := ctx.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid course ID",
		})
	}

	// Parse pagination parameters
	page, _ := strconv.Atoi(ctx.Query("page", "1"))
	pageSize, _ := strconv.Atoi(ctx.Query("pageSize", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Call service
	requests, err := c.service.GetPendingEnrollmentRequests(ctx.Context(), courseID, tenantID, page, pageSize)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to retrieve pending enrollment requests",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(requests)
}

// ApproveEnrollmentRequest approves an enrollment request (instructor/admin)
// @Summary Approve enrollment request
// @Description Approves an enrollment request, creating an enrollment (instructor/admin only)
// @Tags enrollment-requests
// @Accept json
// @Produce json
// @Param requestID path string true "Enrollment Request ID"
// @Success 201 {object} domain.EnrollmentResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /enrollment-requests/{requestID}/approve [post]
// @Security Bearer
func (c *EnrollmentController) ApproveEnrollmentRequest(ctx *fiber.Ctx) error {
	tenantIDStr, ok := ctx.Locals("tenant_id").(string)
	if !ok || tenantIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid tenant ID",
		})
	}

	reviewerID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: user ID not found",
		})
	}

	// Parse request ID
	requestIDStr := ctx.Params("requestID")
	requestID, err := uuid.Parse(requestIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request ID",
		})
	}

	// Call service
	enrollment, err := c.service.ApproveEnrollmentRequest(ctx.Context(), requestID, reviewerID, tenantID)
	if err != nil {
		switch err {
		case domain.ErrEnrollmentRequestNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "enrollment request not found",
			})
		case domain.ErrEnrollmentRequestAlreadyProcessed:
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "enrollment request has already been processed",
			})
		case domain.ErrCourseFull:
			return ctx.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "course is full",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to approve enrollment request",
			})
		}
	}

	return ctx.Status(fiber.StatusCreated).JSON(enrollment)
}

// RejectEnrollmentRequest rejects an enrollment request (instructor/admin)
// @Summary Reject enrollment request
// @Description Rejects an enrollment request with a reason (instructor/admin only)
// @Tags enrollment-requests
// @Accept json
// @Produce json
// @Param requestID path string true "Enrollment Request ID"
// @Param request body domain.RejectEnrollmentRequestRequest true "Rejection request"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /enrollment-requests/{requestID}/reject [post]
// @Security Bearer
func (c *EnrollmentController) RejectEnrollmentRequest(ctx *fiber.Ctx) error {
	tenantIDStr, ok := ctx.Locals("tenant_id").(string)
	if !ok || tenantIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid tenant ID",
		})
	}

	reviewerID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: user ID not found",
		})
	}

	// Parse request ID
	requestIDStr := ctx.Params("requestID")
	requestID, err := uuid.Parse(requestIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request ID",
		})
	}

	// Parse request body
	var req domain.RejectEnrollmentRequestRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Call service
	err = c.service.RejectEnrollmentRequest(ctx.Context(), requestID, reviewerID, tenantID, req.Reason)
	if err != nil {
		switch err {
		case domain.ErrEnrollmentRequestNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "enrollment request not found",
			})
		case domain.ErrEnrollmentRequestAlreadyProcessed:
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "enrollment request has already been processed",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to reject enrollment request",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "enrollment request rejected successfully",
	})
}

// ============================================================================
// Statistics (Instructor/Admin)
// ============================================================================

// GetCourseEnrollmentStats retrieves enrollment statistics for a course
// @Summary Get course enrollment statistics
// @Description Retrieves enrollment statistics for a specific course (instructor/admin only)
// @Tags enrollments
// @Accept json
// @Produce json
// @Param courseID path string true "Course ID"
// @Success 200 {object} domain.EnrollmentStatsResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /enrollments/courses/{courseID}/stats [get]
// @Security Bearer
func (c *EnrollmentController) GetCourseEnrollmentStats(ctx *fiber.Ctx) error {
	tenantIDStr, ok := ctx.Locals("tenant_id").(string)
	if !ok || tenantIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid tenant ID",
		})
	}

	// Parse course ID
	courseIDStr := ctx.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid course ID",
		})
	}

	// Call service
	stats, err := c.service.GetCourseEnrollmentStats(ctx.Context(), courseID, tenantID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to retrieve enrollment statistics",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(stats)
}

// ============================================================================
// Bulk Operations (Admin/System)
// ============================================================================

// ProcessExpiredEnrollments processes all expired enrollments (admin/system only)
// @Summary Process expired enrollments
// @Description Marks all expired enrollments as expired (admin/system only)
// @Tags enrollments
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{} "Returns {processedCount: int}"
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /enrollments/process-expired [post]
// @Security Bearer
func (c *EnrollmentController) ProcessExpiredEnrollments(ctx *fiber.Ctx) error {
	tenantIDStr, ok := ctx.Locals("tenant_id").(string)
	if !ok || tenantIDStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid tenant ID",
		})
	}

	// Call service
	processedCount, err := c.service.ProcessExpiredEnrollments(ctx.Context(), tenantID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to process expired enrollments",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message":        "expired enrollments processed successfully",
		"processedCount": processedCount,
	})
}

// ============================================================================
// Route Registration
// ============================================================================

// RegisterRoutes registers all enrollment routes
// NOTE: Middlewares (Auth, Tenant, Membership) are applied in server.go before calling this
func (c *EnrollmentController) RegisterRoutes(router fiber.Router) {
	// Student enrollment operations - register directly to inherit middlewares
	router.Post("/enrollments/enroll", c.EnrollInCourse)

	// My enrollments
	router.Get("/enrollments/my", c.GetMyEnrollments)
	router.Get("/enrollments/my/:enrollmentID", c.GetMyEnrollment)
	router.Post("/enrollments/my/:enrollmentID/cancel", c.CancelMyEnrollment)

	// Course access
	router.Get("/enrollments/courses/:courseID/access", c.CheckCourseAccess)
	router.Post("/enrollments/courses/:courseID/access", c.RecordCourseAccess)

	// Enrollment management (instructor/admin)
	router.Get("/enrollments/:enrollmentID", c.GetEnrollment)
	router.Get("/enrollments", c.ListEnrollments)
	router.Get("/enrollments/courses/:courseID", c.GetCourseEnrollments)
	router.Put("/enrollments/:enrollmentID/progress", c.UpdateEnrollmentProgress)
	router.Post("/enrollments/:enrollmentID/complete", c.CompleteEnrollment)
	router.Post("/enrollments/:enrollmentID/cancel", c.CancelEnrollment)
	router.Post("/enrollments/:enrollmentID/extend", c.ExtendEnrollment)
	router.Delete("/enrollments/:enrollmentID", c.DeleteEnrollment)

	// Statistics
	router.Get("/enrollments/courses/:courseID/stats", c.GetCourseEnrollmentStats)

	// Bulk operations
	router.Post("/enrollments/process-expired", c.ProcessExpiredEnrollments)

	// Enrollment request operations
	router.Post("/enrollment-requests", c.RequestEnrollment)
	router.Get("/enrollment-requests/my", c.GetMyEnrollmentRequests)
	router.Post("/enrollment-requests/:requestID/cancel", c.CancelEnrollmentRequest)

	// Instructor/admin operations
	router.Get("/enrollment-requests/:requestID", c.GetEnrollmentRequest)
	router.Get("/enrollment-requests", c.ListEnrollmentRequests)
	router.Get("/enrollment-requests/courses/:courseID/pending", c.GetPendingEnrollmentRequests)
	router.Post("/enrollment-requests/:requestID/approve", c.ApproveEnrollmentRequest)
	router.Post("/enrollment-requests/:requestID/reject", c.RejectEnrollmentRequest)
}
