package controllers

import (
	"strconv"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/progress/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/progress/ports"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// ProgressController handles progress-related HTTP requests
type ProgressController struct {
	progressService ports.ProgressService
}

// NewProgressController creates a new ProgressController
func NewProgressController(progressService ports.ProgressService) *ProgressController {
	return &ProgressController{
		progressService: progressService,
	}
}

// ============================================================================
// Student Progress Operations
// ============================================================================

// GetMyProgress retrieves detailed progress for the current user in a course
// GET /api/v1/courses/:courseId/progress/me
func (ctrl *ProgressController) GetMyProgress(c *fiber.Ctx) error {
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
	progress, err := ctrl.progressService.GetMyProgress(c.Context(), courseID, userID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress retrieved successfully", progress)
}

// GetMyProgressList retrieves all progress for the current user
// GET /api/v1/progress/me
func (ctrl *ProgressController) GetMyProgressList(c *fiber.Ctx) error {
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

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Call service
	progressList, totalCount, err := ctrl.progressService.GetMyProgressList(c.Context(), userID, tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	// Calculate total pages
	totalPages := (totalCount + pageSize - 1) / pageSize

	// Build paginated response
	response := map[string]interface{}{
		"items":      progressList,
		"page":       page,
		"pageSize":   pageSize,
		"totalCount": totalCount,
		"totalPages": totalPages,
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress list retrieved successfully", response)
}

// GetMyProgressSummary retrieves progress summary for the current user across all courses
// GET /api/v1/progress/me/summary
func (ctrl *ProgressController) GetMyProgressSummary(c *fiber.Ctx) error {
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
	summary, err := ctrl.progressService.GetMyProgressSummary(c.Context(), userID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress summary retrieved successfully", summary)
}

// UpdateMyProgress updates progress for the current user in a course
// PUT /api/v1/courses/:courseId/progress/me
func (ctrl *ProgressController) UpdateMyProgress(c *fiber.Ctx) error {
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
	var req domain.UpdateProgressRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	progress, err := ctrl.progressService.UpdateMyProgress(c.Context(), courseID, userID, tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress updated successfully", progress)
}

// RecordActivity records lesson or quiz completion activity
// POST /api/v1/courses/:courseId/progress/me/activity
func (ctrl *ProgressController) RecordActivity(c *fiber.Ctx) error {
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
	var req domain.RecordProgressRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	err = ctrl.progressService.RecordActivity(c.Context(), courseID, userID, tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Activity recorded successfully", nil)
}

// GetMyProgressHistory retrieves progress history (snapshots) for the current user in a course
// GET /api/v1/courses/:courseId/progress/me/history
func (ctrl *ProgressController) GetMyProgressHistory(c *fiber.Ctx) error {
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

	// Build request from query parameters
	req := &domain.GetProgressHistoryRequest{
		Page:     1,
		PageSize: 20,
	}

	// Parse pagination
	if page := c.Query("page"); page != "" {
		if p, err := strconv.Atoi(page); err == nil {
			req.Page = p
		}
	}
	if pageSize := c.Query("pageSize"); pageSize != "" {
		if ps, err := strconv.Atoi(pageSize); err == nil {
			req.PageSize = ps
		}
	}

	// Parse date range
	if startDate := c.Query("startDate"); startDate != "" {
		if t, err := time.Parse(time.RFC3339, startDate); err == nil {
			req.StartDate = &t
		}
	}
	if endDate := c.Query("endDate"); endDate != "" {
		if t, err := time.Parse(time.RFC3339, endDate); err == nil {
			req.EndDate = &t
		}
	}

	// Parse milestone filter
	if milestone := c.Query("milestone"); milestone != "" {
		req.Milestone = &milestone
	}

	// Parse sorting
	if sortBy := c.Query("sortBy"); sortBy != "" {
		req.SortBy = &sortBy
	}
	if sortOrder := c.Query("sortOrder"); sortOrder != "" {
		req.SortOrder = &sortOrder
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	history, err := ctrl.progressService.GetMyProgressHistory(c.Context(), courseID, userID, tenantID, req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress history retrieved successfully", history)
}

// ============================================================================
// Instructor/Admin Progress Management
// ============================================================================

// GetCourseProgress retrieves a specific course progress by ID
// GET /api/v1/progress/:progressId
func (ctrl *ProgressController) GetCourseProgress(c *fiber.Ctx) error {
	// Get progress ID from params
	progressID, err := uuid.Parse(c.Params("progressId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid progress ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	progress, err := ctrl.progressService.GetCourseProgress(c.Context(), progressID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress retrieved successfully", progress)
}

// GetProgressByUser retrieves progress for a specific user in a course
// GET /api/v1/courses/:courseId/users/:userId/progress
func (ctrl *ProgressController) GetProgressByUser(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("courseId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	// Get user ID from params
	userID, err := uuid.Parse(c.Params("userId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	progress, err := ctrl.progressService.GetProgressByUser(c.Context(), userID, courseID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress retrieved successfully", progress)
}

// ListCourseProgress lists all progress for a course
// GET /api/v1/courses/:courseId/progress
func (ctrl *ProgressController) ListCourseProgress(c *fiber.Ctx) error {
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

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Call service
	progressList, totalCount, err := ctrl.progressService.ListCourseProgress(c.Context(), courseID, tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	// Calculate total pages
	totalPages := (totalCount + pageSize - 1) / pageSize

	// Build paginated response
	response := map[string]interface{}{
		"items":      progressList,
		"page":       page,
		"pageSize":   pageSize,
		"totalCount": totalCount,
		"totalPages": totalPages,
	}

	return SuccessResponse(c, fiber.StatusOK, "Course progress list retrieved successfully", response)
}

// MarkProgressAsCompleted marks a progress as completed (admin/instructor action)
// POST /api/v1/progress/:progressId/complete
func (ctrl *ProgressController) MarkProgressAsCompleted(c *fiber.Ctx) error {
	// Get progress ID from params
	progressID, err := uuid.Parse(c.Params("progressId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid progress ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body (optional certificate ID)
	var req domain.CompleteCourseRequest
	if err := c.BodyParser(&req); err != nil {
		// Certificate ID is optional
		req = domain.CompleteCourseRequest{}
	}

	// Call service
	err = ctrl.progressService.MarkProgressAsCompleted(c.Context(), progressID, tenantID, req.CertificateID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress marked as completed successfully", nil)
}

// ResetProgress resets a user's progress in a course
// POST /api/v1/progress/:progressId/reset
func (ctrl *ProgressController) ResetProgress(c *fiber.Ctx) error {
	// Get progress ID from params
	progressID, err := uuid.Parse(c.Params("progressId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid progress ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	err = ctrl.progressService.ResetProgress(c.Context(), progressID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress reset successfully", nil)
}

// DeleteProgress deletes a progress record
// DELETE /api/v1/progress/:progressId
func (ctrl *ProgressController) DeleteProgress(c *fiber.Ctx) error {
	// Get progress ID from params
	progressID, err := uuid.Parse(c.Params("progressId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid progress ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	err = ctrl.progressService.DeleteProgress(c.Context(), progressID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress deleted successfully", nil)
}

// ============================================================================
// Progress Statistics (Instructor/Admin)
// ============================================================================

// GetCourseStatistics retrieves statistics for a course
// GET /api/v1/courses/:courseId/progress/statistics
func (ctrl *ProgressController) GetCourseStatistics(c *fiber.Ctx) error {
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

	// Build request from query parameters
	req := &domain.GetCourseStatisticsRequest{}

	// Parse date range
	if startDate := c.Query("startDate"); startDate != "" {
		if t, err := time.Parse(time.RFC3339, startDate); err == nil {
			req.StartDate = &t
		}
	}
	if endDate := c.Query("endDate"); endDate != "" {
		if t, err := time.Parse(time.RFC3339, endDate); err == nil {
			req.EndDate = &t
		}
	}

	// Parse status filter
	if status := c.Query("status"); status != "" {
		progressStatus := domain.ProgressStatus(status)
		req.Status = &progressStatus
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	statistics, err := ctrl.progressService.GetCourseStatistics(c.Context(), courseID, tenantID, req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course statistics retrieved successfully", statistics)
}

// GetProgressAnalytics retrieves analytics for course progress
// GET /api/v1/courses/:courseId/progress/analytics
func (ctrl *ProgressController) GetProgressAnalytics(c *fiber.Ctx) error {
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

	// Parse date range (optional)
	var startDate, endDate *time.Time
	if sd := c.Query("startDate"); sd != "" {
		if t, err := time.Parse(time.RFC3339, sd); err == nil {
			startDate = &t
		}
	}
	if ed := c.Query("endDate"); ed != "" {
		if t, err := time.Parse(time.RFC3339, ed); err == nil {
			endDate = &t
		}
	}

	// Call service
	analytics, err := ctrl.progressService.GetProgressAnalytics(c.Context(), courseID, tenantID, startDate, endDate)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress analytics retrieved successfully", analytics)
}

// ============================================================================
// Snapshot Management
// ============================================================================

// CreateMilestoneSnapshot creates a milestone snapshot for the current user
// POST /api/v1/courses/:courseId/progress/me/snapshots
func (ctrl *ProgressController) CreateMilestoneSnapshot(c *fiber.Ctx) error {
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

	// Parse milestone type from request body
	var req struct {
		MilestoneType domain.MilestoneType `json:"milestoneType"`
	}
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate milestone type
	if !domain.ValidateMilestoneType(req.MilestoneType) {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid milestone type")
	}

	// Call service
	err = ctrl.progressService.CreateMilestoneSnapshot(c.Context(), userID, courseID, tenantID, req.MilestoneType)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Milestone snapshot created successfully", nil)
}

// GetProgressSnapshots retrieves snapshots for the current user in a course
// GET /api/v1/courses/:courseId/progress/me/snapshots
func (ctrl *ProgressController) GetProgressSnapshots(c *fiber.Ctx) error {
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

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Call service
	snapshots, err := ctrl.progressService.GetProgressSnapshots(c.Context(), userID, courseID, tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Snapshots retrieved successfully", snapshots)
}

// ============================================================================
// System Operations (Admin)
// ============================================================================

// InitializeProgress creates initial progress for an enrollment
// POST /api/v1/progress/initialize
func (ctrl *ProgressController) InitializeProgress(c *fiber.Ctx) error {
	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req struct {
		EnrollmentID uuid.UUID `json:"enrollmentId"`
		UserID       uuid.UUID `json:"userId"`
		CourseID     uuid.UUID `json:"courseId"`
		TotalLessons int       `json:"totalLessons"`
		TotalQuizzes int       `json:"totalQuizzes"`
	}
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate required fields
	if req.EnrollmentID == uuid.Nil || req.UserID == uuid.Nil || req.CourseID == uuid.Nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Enrollment ID, User ID, and Course ID are required")
	}

	// Call service
	progress, err := ctrl.progressService.InitializeProgress(c.Context(), req.EnrollmentID, req.UserID, req.CourseID, tenantID, req.TotalLessons, req.TotalQuizzes)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Progress initialized successfully", progress)
}

// RecalculateProgress recalculates progress based on actual completions
// POST /api/v1/courses/:courseId/users/:userId/progress/recalculate
func (ctrl *ProgressController) RecalculateProgress(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("courseId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	// Get user ID from params
	userID, err := uuid.Parse(c.Params("userId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	progress, err := ctrl.progressService.RecalculateProgress(c.Context(), userID, courseID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress recalculated successfully", progress)
}

// SyncProgressFromEnrollment syncs progress with enrollment data
// POST /api/v1/enrollments/:enrollmentId/progress/sync
func (ctrl *ProgressController) SyncProgressFromEnrollment(c *fiber.Ctx) error {
	// Get enrollment ID from params
	enrollmentID, err := uuid.Parse(c.Params("enrollmentId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid enrollment ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	err = ctrl.progressService.SyncProgressFromEnrollment(c.Context(), enrollmentID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress synced successfully", nil)
}
