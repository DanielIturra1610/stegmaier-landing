package controllers

import (
	"strconv"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/enrollments/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/enrollments/ports"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// EnrollmentController handles enrollment-related HTTP requests
type EnrollmentController struct {
	enrollmentService ports.EnrollmentService
}

// NewEnrollmentController creates a new EnrollmentController
func NewEnrollmentController(enrollmentService ports.EnrollmentService) *EnrollmentController {
	return &EnrollmentController{
		enrollmentService: enrollmentService,
	}
}

// ============================================================================
// Student Enrollment Operations
// ============================================================================

// EnrollInCourse enrolls the current user in a course
// POST /api/v1/courses/:courseId/enroll
func (ctrl *EnrollmentController) EnrollInCourse(c *fiber.Ctx) error {
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
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body (optional fields)
	var req domain.EnrollInCourseRequest
	if err := c.BodyParser(&req); err != nil {
		// If parsing fails, use empty request (only courseID is required)
		req = domain.EnrollInCourseRequest{}
	}

	// Set course ID from params
	req.CourseID = courseID

	// Call service
	enrollment, err := ctrl.enrollmentService.EnrollInCourse(c.Context(), userID, tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Enrolled in course successfully", enrollment)
}

// GetMyEnrollments retrieves all enrollments for the current user
// GET /api/v1/enrollments/me
func (ctrl *EnrollmentController) GetMyEnrollments(c *fiber.Ctx) error {
	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

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
	response, err := ctrl.enrollmentService.GetMyEnrollments(c.Context(), userID, tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Enrollments retrieved successfully", response)
}

// GetMyEnrollment retrieves a specific enrollment for the current user
// GET /api/v1/enrollments/:id/me
func (ctrl *EnrollmentController) GetMyEnrollment(c *fiber.Ctx) error {
	// Get enrollment ID from params
	enrollmentID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid enrollment ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	enrollment, err := ctrl.enrollmentService.GetMyEnrollment(c.Context(), enrollmentID, userID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Enrollment retrieved successfully", enrollment)
}

// CancelMyEnrollment cancels the current user's enrollment
// POST /api/v1/enrollments/:id/cancel
func (ctrl *EnrollmentController) CancelMyEnrollment(c *fiber.Ctx) error {
	// Get enrollment ID from params
	enrollmentID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid enrollment ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body (optional reason)
	var req struct {
		Reason *string `json:"reason,omitempty"`
	}
	if err := c.BodyParser(&req); err != nil {
		// If parsing fails, reason is optional
		req.Reason = nil
	}

	// Call service
	if err := ctrl.enrollmentService.CancelMyEnrollment(c.Context(), enrollmentID, userID, tenantID, req.Reason); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Enrollment cancelled successfully", nil)
}

// CheckCourseAccess checks if the current user can access a course
// GET /api/v1/courses/:courseId/access
func (ctrl *EnrollmentController) CheckCourseAccess(c *fiber.Ctx) error {
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
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	canAccess, err := ctrl.enrollmentService.CheckCourseAccess(c.Context(), userID, courseID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Access checked successfully", map[string]bool{
		"canAccess": canAccess,
	})
}

// UpdateMyProgress updates the progress for the current user's enrollment
// PUT /api/v1/enrollments/:id/progress
func (ctrl *EnrollmentController) UpdateMyProgress(c *fiber.Ctx) error {
	// Get enrollment ID from params
	enrollmentID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid enrollment ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req struct {
		ProgressPercentage int `json:"progressPercentage"`
	}
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	if err := ctrl.enrollmentService.UpdateMyProgress(c.Context(), enrollmentID, userID, tenantID, req.ProgressPercentage); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress updated successfully", nil)
}

// RecordCourseAccess records that the user accessed a course
// POST /api/v1/courses/:courseId/access
func (ctrl *EnrollmentController) RecordCourseAccess(c *fiber.Ctx) error {
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
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	if err := ctrl.enrollmentService.RecordCourseAccess(c.Context(), userID, courseID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course access recorded successfully", nil)
}

// ============================================================================
// Enrollment Request Operations (Student)
// ============================================================================

// RequestEnrollment creates an enrollment request for courses requiring approval
// POST /api/v1/courses/:courseId/request
func (ctrl *EnrollmentController) RequestEnrollment(c *fiber.Ctx) error {
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
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body (optional message)
	var req domain.EnrollInCourseRequest
	if err := c.BodyParser(&req); err != nil {
		req = domain.EnrollInCourseRequest{}
	}

	// Set course ID from params
	req.CourseID = courseID

	// Call service
	request, err := ctrl.enrollmentService.RequestEnrollment(c.Context(), userID, tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Enrollment request created successfully", request)
}

// GetMyEnrollmentRequests retrieves all enrollment requests for the current user
// GET /api/v1/enrollment-requests/me
func (ctrl *EnrollmentController) GetMyEnrollmentRequests(c *fiber.Ctx) error {
	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

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
	response, err := ctrl.enrollmentService.GetMyEnrollmentRequests(c.Context(), userID, tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Enrollment requests retrieved successfully", response)
}

// CancelEnrollmentRequest cancels an enrollment request
// DELETE /api/v1/enrollment-requests/:id
func (ctrl *EnrollmentController) CancelEnrollmentRequest(c *fiber.Ctx) error {
	// Get request ID from params
	requestID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	if err := ctrl.enrollmentService.CancelEnrollmentRequest(c.Context(), requestID, userID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Enrollment request cancelled successfully", nil)
}

// ============================================================================
// Enrollment Management (Instructor/Admin)
// ============================================================================

// GetEnrollment retrieves a specific enrollment (instructor/admin)
// GET /api/v1/enrollments/:id
func (ctrl *EnrollmentController) GetEnrollment(c *fiber.Ctx) error {
	// Get enrollment ID from params
	enrollmentID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid enrollment ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	enrollment, err := ctrl.enrollmentService.GetEnrollment(c.Context(), enrollmentID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Enrollment retrieved successfully", enrollment)
}

// ListEnrollments retrieves all enrollments with filters (instructor/admin)
// GET /api/v1/enrollments
func (ctrl *EnrollmentController) ListEnrollments(c *fiber.Ctx) error {
	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse pagination and filter parameters
	req := &domain.ListEnrollmentsRequest{
		Page:     1,
		PageSize: 20,
	}

	if pageParam := c.Query("page"); pageParam != "" {
		if p, err := strconv.Atoi(pageParam); err == nil && p > 0 {
			req.Page = p
		}
	}

	if pageSizeParam := c.Query("pageSize"); pageSizeParam != "" {
		if ps, err := strconv.Atoi(pageSizeParam); err == nil && ps > 0 {
			req.PageSize = ps
		}
	}

	// Parse optional filters
	if userIDParam := c.Query("userId"); userIDParam != "" {
		if userID, err := uuid.Parse(userIDParam); err == nil {
			req.UserID = &userID
		}
	}

	if courseIDParam := c.Query("courseId"); courseIDParam != "" {
		if courseID, err := uuid.Parse(courseIDParam); err == nil {
			req.CourseID = &courseID
		}
	}

	if statusParam := c.Query("status"); statusParam != "" {
		status := domain.EnrollmentStatus(statusParam)
		req.Status = &status
	}

	if sortByParam := c.Query("sortBy"); sortByParam != "" {
		req.SortBy = &sortByParam
	}

	if sortOrderParam := c.Query("sortOrder"); sortOrderParam != "" {
		req.SortOrder = &sortOrderParam
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	response, err := ctrl.enrollmentService.ListEnrollments(c.Context(), tenantID, req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Enrollments retrieved successfully", response)
}

// GetCourseEnrollments retrieves all enrollments for a specific course
// GET /api/v1/courses/:courseId/enrollments
func (ctrl *EnrollmentController) GetCourseEnrollments(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("courseId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

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
	response, err := ctrl.enrollmentService.GetCourseEnrollments(c.Context(), courseID, tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course enrollments retrieved successfully", response)
}

// UpdateEnrollmentProgress updates the progress of an enrollment (instructor/admin)
// PUT /api/v1/enrollments/:id/progress/admin
func (ctrl *EnrollmentController) UpdateEnrollmentProgress(c *fiber.Ctx) error {
	// Get enrollment ID from params
	enrollmentID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid enrollment ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req struct {
		ProgressPercentage int `json:"progressPercentage"`
	}
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	if err := ctrl.enrollmentService.UpdateEnrollmentProgress(c.Context(), enrollmentID, tenantID, req.ProgressPercentage); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Enrollment progress updated successfully", nil)
}

// CompleteEnrollment marks an enrollment as completed (instructor/admin)
// POST /api/v1/enrollments/:id/complete
func (ctrl *EnrollmentController) CompleteEnrollment(c *fiber.Ctx) error {
	// Get enrollment ID from params
	enrollmentID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid enrollment ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body (optional certificate ID)
	var req struct {
		CertificateID *uuid.UUID `json:"certificateId,omitempty"`
	}
	if err := c.BodyParser(&req); err != nil {
		req.CertificateID = nil
	}

	// Call service
	if err := ctrl.enrollmentService.CompleteEnrollment(c.Context(), enrollmentID, tenantID, req.CertificateID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Enrollment completed successfully", nil)
}

// CancelEnrollment cancels an enrollment (instructor/admin)
// POST /api/v1/enrollments/:id/cancel/admin
func (ctrl *EnrollmentController) CancelEnrollment(c *fiber.Ctx) error {
	// Get enrollment ID from params
	enrollmentID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid enrollment ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body (optional reason)
	var req struct {
		Reason *string `json:"reason,omitempty"`
	}
	if err := c.BodyParser(&req); err != nil {
		req.Reason = nil
	}

	// Call service
	if err := ctrl.enrollmentService.CancelEnrollment(c.Context(), enrollmentID, tenantID, req.Reason); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Enrollment cancelled successfully", nil)
}

// ExtendEnrollment extends the expiration date of an enrollment (instructor/admin)
// POST /api/v1/enrollments/:id/extend
func (ctrl *EnrollmentController) ExtendEnrollment(c *fiber.Ctx) error {
	// Get enrollment ID from params
	enrollmentID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid enrollment ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req struct {
		NewExpiresAt time.Time `json:"newExpiresAt"`
	}
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	if err := ctrl.enrollmentService.ExtendEnrollment(c.Context(), enrollmentID, tenantID, req.NewExpiresAt); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Enrollment extended successfully", nil)
}

// DeleteEnrollment deletes an enrollment (instructor/admin)
// DELETE /api/v1/enrollments/:id
func (ctrl *EnrollmentController) DeleteEnrollment(c *fiber.Ctx) error {
	// Get enrollment ID from params
	enrollmentID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid enrollment ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	if err := ctrl.enrollmentService.DeleteEnrollment(c.Context(), enrollmentID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Enrollment deleted successfully", nil)
}

// ============================================================================
// Enrollment Request Management (Instructor/Admin)
// ============================================================================

// GetEnrollmentRequest retrieves a specific enrollment request (instructor/admin)
// GET /api/v1/enrollment-requests/:id
func (ctrl *EnrollmentController) GetEnrollmentRequest(c *fiber.Ctx) error {
	// Get request ID from params
	requestID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	request, err := ctrl.enrollmentService.GetEnrollmentRequest(c.Context(), requestID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Enrollment request retrieved successfully", request)
}

// ListEnrollmentRequests retrieves all enrollment requests with filters (instructor/admin)
// GET /api/v1/enrollment-requests
func (ctrl *EnrollmentController) ListEnrollmentRequests(c *fiber.Ctx) error {
	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse pagination and filter parameters
	req := &domain.ListEnrollmentRequestsRequest{
		Page:     1,
		PageSize: 20,
	}

	if pageParam := c.Query("page"); pageParam != "" {
		if p, err := strconv.Atoi(pageParam); err == nil && p > 0 {
			req.Page = p
		}
	}

	if pageSizeParam := c.Query("pageSize"); pageSizeParam != "" {
		if ps, err := strconv.Atoi(pageSizeParam); err == nil && ps > 0 {
			req.PageSize = ps
		}
	}

	// Parse optional filters
	if courseIDParam := c.Query("courseId"); courseIDParam != "" {
		if courseID, err := uuid.Parse(courseIDParam); err == nil {
			req.CourseID = &courseID
		}
	}

	if statusParam := c.Query("status"); statusParam != "" {
		status := domain.EnrollmentRequestStatus(statusParam)
		req.Status = &status
	}

	if sortByParam := c.Query("sortBy"); sortByParam != "" {
		req.SortBy = &sortByParam
	}

	if sortOrderParam := c.Query("sortOrder"); sortOrderParam != "" {
		req.SortOrder = &sortOrderParam
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	response, err := ctrl.enrollmentService.ListEnrollmentRequests(c.Context(), tenantID, req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Enrollment requests retrieved successfully", response)
}

// GetPendingEnrollmentRequests retrieves pending enrollment requests for a course
// GET /api/v1/courses/:courseId/enrollment-requests/pending
func (ctrl *EnrollmentController) GetPendingEnrollmentRequests(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("courseId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

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
	response, err := ctrl.enrollmentService.GetPendingEnrollmentRequests(c.Context(), courseID, tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Pending enrollment requests retrieved successfully", response)
}

// ApproveEnrollmentRequest approves an enrollment request
// POST /api/v1/enrollment-requests/:id/approve
func (ctrl *EnrollmentController) ApproveEnrollmentRequest(c *fiber.Ctx) error {
	// Get request ID from params
	requestID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request ID")
	}

	// Get reviewer ID from context (current user)
	reviewerID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid reviewer ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	enrollment, err := ctrl.enrollmentService.ApproveEnrollmentRequest(c.Context(), requestID, reviewerID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Enrollment request approved successfully", enrollment)
}

// RejectEnrollmentRequest rejects an enrollment request
// POST /api/v1/enrollment-requests/:id/reject
func (ctrl *EnrollmentController) RejectEnrollmentRequest(c *fiber.Ctx) error {
	// Get request ID from params
	requestID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request ID")
	}

	// Get reviewer ID from context (current user)
	reviewerID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid reviewer ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req struct {
		Reason string `json:"reason"`
	}
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate reason
	if req.Reason == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Rejection reason is required")
	}
	if len(req.Reason) < 5 {
		return ErrorResponse(c, fiber.StatusBadRequest, "Rejection reason must be at least 5 characters")
	}

	// Call service
	if err := ctrl.enrollmentService.RejectEnrollmentRequest(c.Context(), requestID, reviewerID, tenantID, req.Reason); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Enrollment request rejected successfully", nil)
}

// ============================================================================
// Statistics and Bulk Operations
// ============================================================================

// GetCourseEnrollmentStats retrieves enrollment statistics for a course
// GET /api/v1/courses/:courseId/enrollment-stats
func (ctrl *EnrollmentController) GetCourseEnrollmentStats(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("courseId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	stats, err := ctrl.enrollmentService.GetCourseEnrollmentStats(c.Context(), courseID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Enrollment statistics retrieved successfully", stats)
}

// ProcessExpiredEnrollments processes and marks expired enrollments (admin/system)
// POST /api/v1/enrollments/process-expired
func (ctrl *EnrollmentController) ProcessExpiredEnrollments(c *fiber.Ctx) error {
	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	count, err := ctrl.enrollmentService.ProcessExpiredEnrollments(c.Context(), tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Expired enrollments processed successfully", map[string]int{
		"processedCount": count,
	})
}
