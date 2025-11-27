package controllers

import (
	"log"
	"time"

	progressadapters "github.com/DanielIturra1610/stegmaier-landing/internal/core/progress/adapters"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/progress/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/progress/ports"
	progressservices "github.com/DanielIturra1610/stegmaier-landing/internal/core/progress/services"
	"github.com/DanielIturra1610/stegmaier-landing/internal/middleware"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// TenantAwareProgressController handles progress-related HTTP requests with dynamic tenant DB connection
// This controller creates repositories and services dynamically using the tenant DB from context
type TenantAwareProgressController struct{}

// NewTenantAwareProgressController creates a new TenantAwareProgressController
func NewTenantAwareProgressController() *TenantAwareProgressController {
	return &TenantAwareProgressController{}
}

// getProgressService creates a progress service using the tenant DB from context
func (ctrl *TenantAwareProgressController) getProgressService(c *fiber.Ctx) (ports.ProgressService, error) {
	tenantDB, err := middleware.MustGetTenantDBFromContext(c)
	if err != nil {
		return nil, err
	}

	// sqlx.DB embeds *sql.DB, so we can access it directly
	// The progress adapter uses *sql.DB
	progressRepo := progressadapters.NewPostgreSQLProgressRepository(tenantDB.DB)

	// Create and return service
	return progressservices.NewProgressService(progressRepo), nil
}

// ============================================================================
// Student Progress Operations
// ============================================================================

// GetMyProgress retrieves detailed progress for the current user in a course
// GET /api/v1/progress/my/courses/:courseID
func (ctrl *TenantAwareProgressController) GetMyProgress(c *fiber.Ctx) error {
	progressService, err := ctrl.getProgressService(c)
	if err != nil {
		log.Printf("❌ Failed to get progress service: %v", err)
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get course ID from params
	courseIDStr := c.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID format")
	}

	// Get user ID from context
	userIDRaw := c.Locals("userID")
	if userIDRaw == nil {
		return ErrorResponse(c, fiber.StatusUnauthorized, "User ID not found")
	}
	userIDStr, ok := userIDRaw.(string)
	if !ok {
		return ErrorResponse(c, fiber.StatusUnauthorized, "Invalid user ID type")
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusUnauthorized, "Invalid user ID format")
	}

	// Get tenant ID from context
	tenantID, err := utils.GetTenantUUID(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	progress, err := progressService.GetMyProgress(c.Context(), courseID, userID, tenantID)
	if err != nil {
		if err == ports.ErrProgressNotFound {
			return ErrorResponse(c, fiber.StatusNotFound, "Progress not found for this course")
		}
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress retrieved successfully", progress)
}

// GetMyProgressList retrieves all progress for the current user
// GET /api/v1/progress/my
func (ctrl *TenantAwareProgressController) GetMyProgressList(c *fiber.Ctx) error {
	progressService, err := ctrl.getProgressService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get user ID from context
	userIDRaw := c.Locals("userID")
	if userIDRaw == nil {
		return ErrorResponse(c, fiber.StatusUnauthorized, "User ID not found")
	}
	userIDStr, ok := userIDRaw.(string)
	if !ok {
		return ErrorResponse(c, fiber.StatusUnauthorized, "Invalid user ID type")
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusUnauthorized, "Invalid user ID format")
	}

	// Get tenant ID from context
	tenantID, err := utils.GetTenantUUID(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse pagination parameters
	page := c.QueryInt("page", 1)
	pageSize := c.QueryInt("pageSize", 20)

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Call service
	progressList, totalCount, err := progressService.GetMyProgressList(c.Context(), userID, tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	// Calculate total pages
	totalPages := (totalCount + pageSize - 1) / pageSize

	return SuccessResponse(c, fiber.StatusOK, "Progress list retrieved successfully", fiber.Map{
		"progress":   progressList,
		"totalCount": totalCount,
		"page":       page,
		"pageSize":   pageSize,
		"totalPages": totalPages,
	})
}

// GetMyProgressSummary retrieves progress summary for the current user across all courses
// GET /api/v1/progress/my/summary
func (ctrl *TenantAwareProgressController) GetMyProgressSummary(c *fiber.Ctx) error {
	progressService, err := ctrl.getProgressService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get user ID from context
	userIDRaw := c.Locals("userID")
	if userIDRaw == nil {
		return ErrorResponse(c, fiber.StatusUnauthorized, "User ID not found")
	}
	userIDStr, ok := userIDRaw.(string)
	if !ok {
		return ErrorResponse(c, fiber.StatusUnauthorized, "Invalid user ID type")
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusUnauthorized, "Invalid user ID format")
	}

	// Get tenant ID from context
	tenantID, err := utils.GetTenantUUID(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	summary, err := progressService.GetMyProgressSummary(c.Context(), userID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress summary retrieved successfully", summary)
}

// UpdateMyProgress updates progress for the current user in a course
// PUT /api/v1/progress/my/courses/:courseID
func (ctrl *TenantAwareProgressController) UpdateMyProgress(c *fiber.Ctx) error {
	progressService, err := ctrl.getProgressService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get course ID from params
	courseIDStr := c.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID format")
	}

	// Get user ID from context
	userIDRaw := c.Locals("userID")
	if userIDRaw == nil {
		return ErrorResponse(c, fiber.StatusUnauthorized, "User ID not found")
	}
	userIDStr, ok := userIDRaw.(string)
	if !ok {
		return ErrorResponse(c, fiber.StatusUnauthorized, "Invalid user ID type")
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusUnauthorized, "Invalid user ID format")
	}

	// Get tenant ID from context
	tenantID, err := utils.GetTenantUUID(c)
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
	progress, err := progressService.UpdateMyProgress(c.Context(), courseID, userID, tenantID, &req)
	if err != nil {
		if err == ports.ErrProgressNotFound {
			return ErrorResponse(c, fiber.StatusNotFound, "Progress not found for this course")
		}
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress updated successfully", progress)
}

// RecordActivity records lesson or quiz completion activity
// POST /api/v1/progress/my/courses/:courseID/activity
func (ctrl *TenantAwareProgressController) RecordActivity(c *fiber.Ctx) error {
	progressService, err := ctrl.getProgressService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get course ID from params
	courseIDStr := c.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID format")
	}

	// Get user ID from context
	userIDRaw := c.Locals("userID")
	if userIDRaw == nil {
		return ErrorResponse(c, fiber.StatusUnauthorized, "User ID not found")
	}
	userIDStr, ok := userIDRaw.(string)
	if !ok {
		return ErrorResponse(c, fiber.StatusUnauthorized, "Invalid user ID type")
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusUnauthorized, "Invalid user ID format")
	}

	// Get tenant ID from context
	tenantID, err := utils.GetTenantUUID(c)
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
	err = progressService.RecordActivity(c.Context(), courseID, userID, tenantID, &req)
	if err != nil {
		if err == ports.ErrProgressNotFound {
			return ErrorResponse(c, fiber.StatusNotFound, "Progress not found for this course")
		}
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Activity recorded successfully", nil)
}

// GetMyProgressHistory retrieves progress history (snapshots) for the current user in a course
// GET /api/v1/progress/my/courses/:courseID/history
func (ctrl *TenantAwareProgressController) GetMyProgressHistory(c *fiber.Ctx) error {
	progressService, err := ctrl.getProgressService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get course ID from params
	courseIDStr := c.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID format")
	}

	// Get user ID from context
	userIDRaw := c.Locals("userID")
	if userIDRaw == nil {
		return ErrorResponse(c, fiber.StatusUnauthorized, "User ID not found")
	}
	userIDStr, ok := userIDRaw.(string)
	if !ok {
		return ErrorResponse(c, fiber.StatusUnauthorized, "Invalid user ID type")
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusUnauthorized, "Invalid user ID format")
	}

	// Get tenant ID from context
	tenantID, err := utils.GetTenantUUID(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Build request from query parameters
	req := &domain.GetProgressHistoryRequest{
		Page:     c.QueryInt("page", 1),
		PageSize: c.QueryInt("pageSize", 20),
	}

	// Parse optional date filters
	if startDateStr := c.Query("startDate"); startDateStr != "" {
		startDate, err := time.Parse(time.RFC3339, startDateStr)
		if err != nil {
			return ErrorResponse(c, fiber.StatusBadRequest, "Invalid start date format (use RFC3339)")
		}
		req.StartDate = &startDate
	}

	if endDateStr := c.Query("endDate"); endDateStr != "" {
		endDate, err := time.Parse(time.RFC3339, endDateStr)
		if err != nil {
			return ErrorResponse(c, fiber.StatusBadRequest, "Invalid end date format (use RFC3339)")
		}
		req.EndDate = &endDate
	}

	// Parse optional filters
	if milestone := c.Query("milestone"); milestone != "" {
		req.Milestone = &milestone
	}
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
	history, err := progressService.GetMyProgressHistory(c.Context(), courseID, userID, tenantID, req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress history retrieved successfully", history)
}

// ============================================================================
// Instructor/Admin Progress Management
// ============================================================================

// GetCourseProgress retrieves a specific course progress by ID
// GET /api/v1/progress/:progressID
func (ctrl *TenantAwareProgressController) GetCourseProgress(c *fiber.Ctx) error {
	progressService, err := ctrl.getProgressService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get progress ID from params
	progressIDStr := c.Params("progressID")
	progressID, err := uuid.Parse(progressIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid progress ID format")
	}

	// Get tenant ID from context
	tenantID, err := utils.GetTenantUUID(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	progress, err := progressService.GetCourseProgress(c.Context(), progressID, tenantID)
	if err != nil {
		if err == ports.ErrProgressNotFound {
			return ErrorResponse(c, fiber.StatusNotFound, "Progress not found")
		}
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress retrieved successfully", progress)
}

// GetProgressByUser retrieves progress for a specific user in a course
// GET /api/v1/progress/users/:userID/courses/:courseID
func (ctrl *TenantAwareProgressController) GetProgressByUser(c *fiber.Ctx) error {
	progressService, err := ctrl.getProgressService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get user ID from params
	userIDStr := c.Params("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID format")
	}

	// Get course ID from params
	courseIDStr := c.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID format")
	}

	// Get tenant ID from context
	tenantID, err := utils.GetTenantUUID(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	progress, err := progressService.GetProgressByUser(c.Context(), userID, courseID, tenantID)
	if err != nil {
		if err == ports.ErrProgressNotFound {
			return ErrorResponse(c, fiber.StatusNotFound, "Progress not found for this user and course")
		}
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress retrieved successfully", progress)
}

// ListCourseProgress lists all progress for a course
// GET /api/v1/progress/courses/:courseID
func (ctrl *TenantAwareProgressController) ListCourseProgress(c *fiber.Ctx) error {
	progressService, err := ctrl.getProgressService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get course ID from params
	courseIDStr := c.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID format")
	}

	// Get tenant ID from context
	tenantID, err := utils.GetTenantUUID(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse pagination parameters
	page := c.QueryInt("page", 1)
	pageSize := c.QueryInt("pageSize", 20)

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Call service
	progressList, totalCount, err := progressService.ListCourseProgress(c.Context(), courseID, tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	// Calculate total pages
	totalPages := (totalCount + pageSize - 1) / pageSize

	return SuccessResponse(c, fiber.StatusOK, "Course progress list retrieved successfully", fiber.Map{
		"progress":   progressList,
		"totalCount": totalCount,
		"page":       page,
		"pageSize":   pageSize,
		"totalPages": totalPages,
	})
}

// MarkProgressAsCompleted marks a progress as completed (admin/instructor action)
// POST /api/v1/progress/:progressID/complete
func (ctrl *TenantAwareProgressController) MarkProgressAsCompleted(c *fiber.Ctx) error {
	progressService, err := ctrl.getProgressService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get progress ID from params
	progressIDStr := c.Params("progressID")
	progressID, err := uuid.Parse(progressIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid progress ID format")
	}

	// Get tenant ID from context
	tenantID, err := utils.GetTenantUUID(c)
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
	err = progressService.MarkProgressAsCompleted(c.Context(), progressID, tenantID, req.CertificateID)
	if err != nil {
		if err == ports.ErrProgressNotFound {
			return ErrorResponse(c, fiber.StatusNotFound, "Progress not found")
		}
		if err == ports.ErrProgressAlreadyCompleted {
			return ErrorResponse(c, fiber.StatusConflict, "Progress is already completed")
		}
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress marked as completed successfully", nil)
}

// ResetProgress resets a user's progress in a course
// POST /api/v1/progress/:progressID/reset
func (ctrl *TenantAwareProgressController) ResetProgress(c *fiber.Ctx) error {
	progressService, err := ctrl.getProgressService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get progress ID from params
	progressIDStr := c.Params("progressID")
	progressID, err := uuid.Parse(progressIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid progress ID format")
	}

	// Get tenant ID from context
	tenantID, err := utils.GetTenantUUID(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	err = progressService.ResetProgress(c.Context(), progressID, tenantID)
	if err != nil {
		if err == ports.ErrProgressNotFound {
			return ErrorResponse(c, fiber.StatusNotFound, "Progress not found")
		}
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress reset successfully", nil)
}

// DeleteProgress deletes a progress record
// DELETE /api/v1/progress/:progressID
func (ctrl *TenantAwareProgressController) DeleteProgress(c *fiber.Ctx) error {
	progressService, err := ctrl.getProgressService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get progress ID from params
	progressIDStr := c.Params("progressID")
	progressID, err := uuid.Parse(progressIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid progress ID format")
	}

	// Get tenant ID from context
	tenantID, err := utils.GetTenantUUID(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	err = progressService.DeleteProgress(c.Context(), progressID, tenantID)
	if err != nil {
		if err == ports.ErrProgressNotFound {
			return ErrorResponse(c, fiber.StatusNotFound, "Progress not found")
		}
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress deleted successfully", nil)
}

// ============================================================================
// Progress Statistics (Instructor/Admin)
// ============================================================================

// GetCourseStatistics retrieves statistics for a course
// GET /api/v1/progress/courses/:courseID/statistics
func (ctrl *TenantAwareProgressController) GetCourseStatistics(c *fiber.Ctx) error {
	progressService, err := ctrl.getProgressService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get course ID from params
	courseIDStr := c.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID format")
	}

	// Get tenant ID from context
	tenantID, err := utils.GetTenantUUID(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Build request from query parameters
	req := &domain.GetCourseStatisticsRequest{}

	// Parse optional date filters
	if startDateStr := c.Query("startDate"); startDateStr != "" {
		startDate, err := time.Parse(time.RFC3339, startDateStr)
		if err != nil {
			return ErrorResponse(c, fiber.StatusBadRequest, "Invalid start date format (use RFC3339)")
		}
		req.StartDate = &startDate
	}

	if endDateStr := c.Query("endDate"); endDateStr != "" {
		endDate, err := time.Parse(time.RFC3339, endDateStr)
		if err != nil {
			return ErrorResponse(c, fiber.StatusBadRequest, "Invalid end date format (use RFC3339)")
		}
		req.EndDate = &endDate
	}

	// Parse optional status filter
	if statusStr := c.Query("status"); statusStr != "" {
		status := domain.ProgressStatus(statusStr)
		req.Status = &status
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	stats, err := progressService.GetCourseStatistics(c.Context(), courseID, tenantID, req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course statistics retrieved successfully", stats)
}

// GetProgressAnalytics retrieves analytics for course progress
// GET /api/v1/progress/courses/:courseID/analytics
func (ctrl *TenantAwareProgressController) GetProgressAnalytics(c *fiber.Ctx) error {
	progressService, err := ctrl.getProgressService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get course ID from params
	courseIDStr := c.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID format")
	}

	// Get tenant ID from context
	tenantID, err := utils.GetTenantUUID(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse optional date filters
	var startDate, endDate *time.Time
	if startDateStr := c.Query("startDate"); startDateStr != "" {
		parsedDate, err := time.Parse(time.RFC3339, startDateStr)
		if err != nil {
			return ErrorResponse(c, fiber.StatusBadRequest, "Invalid start date format (use RFC3339)")
		}
		startDate = &parsedDate
	}

	if endDateStr := c.Query("endDate"); endDateStr != "" {
		parsedDate, err := time.Parse(time.RFC3339, endDateStr)
		if err != nil {
			return ErrorResponse(c, fiber.StatusBadRequest, "Invalid end date format (use RFC3339)")
		}
		endDate = &parsedDate
	}

	// Call service
	analytics, err := progressService.GetProgressAnalytics(c.Context(), courseID, tenantID, startDate, endDate)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress analytics retrieved successfully", analytics)
}

// ============================================================================
// Snapshot Management
// ============================================================================

// CreateMilestoneSnapshot creates a milestone snapshot for the current user
// POST /api/v1/progress/my/courses/:courseID/snapshot
func (ctrl *TenantAwareProgressController) CreateMilestoneSnapshot(c *fiber.Ctx) error {
	progressService, err := ctrl.getProgressService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get course ID from params
	courseIDStr := c.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID format")
	}

	// Get user ID from context
	userIDRaw := c.Locals("userID")
	if userIDRaw == nil {
		return ErrorResponse(c, fiber.StatusUnauthorized, "User ID not found")
	}
	userIDStr, ok := userIDRaw.(string)
	if !ok {
		return ErrorResponse(c, fiber.StatusUnauthorized, "Invalid user ID type")
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusUnauthorized, "Invalid user ID format")
	}

	// Get tenant ID from context
	tenantID, err := utils.GetTenantUUID(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse milestone type from query parameter
	milestoneTypeStr := c.Query("milestoneType")
	if milestoneTypeStr == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Milestone type is required")
	}

	milestoneType := domain.MilestoneType(milestoneTypeStr)

	// Validate milestone type
	validMilestones := map[domain.MilestoneType]bool{
		domain.Milestone25Percent:  true,
		domain.Milestone50Percent:  true,
		domain.Milestone75Percent:  true,
		domain.Milestone100Percent: true,
	}

	if !validMilestones[milestoneType] {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid milestone type (valid: 25%, 50%, 75%, 100%)")
	}

	// Call service
	err = progressService.CreateMilestoneSnapshot(c.Context(), userID, courseID, tenantID, milestoneType)
	if err != nil {
		if err == ports.ErrProgressNotFound {
			return ErrorResponse(c, fiber.StatusNotFound, "Progress not found for this course")
		}
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Milestone snapshot created successfully", nil)
}

// GetProgressSnapshots retrieves snapshots for the current user in a course
// GET /api/v1/progress/my/courses/:courseID/snapshots
func (ctrl *TenantAwareProgressController) GetProgressSnapshots(c *fiber.Ctx) error {
	progressService, err := ctrl.getProgressService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get course ID from params
	courseIDStr := c.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID format")
	}

	// Get user ID from context
	userIDRaw := c.Locals("userID")
	if userIDRaw == nil {
		return ErrorResponse(c, fiber.StatusUnauthorized, "User ID not found")
	}
	userIDStr, ok := userIDRaw.(string)
	if !ok {
		return ErrorResponse(c, fiber.StatusUnauthorized, "Invalid user ID type")
	}
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusUnauthorized, "Invalid user ID format")
	}

	// Get tenant ID from context
	tenantID, err := utils.GetTenantUUID(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse pagination parameters
	page := c.QueryInt("page", 1)
	pageSize := c.QueryInt("pageSize", 20)

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Call service
	snapshots, err := progressService.GetProgressSnapshots(c.Context(), userID, courseID, tenantID, page, pageSize)
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
func (ctrl *TenantAwareProgressController) InitializeProgress(c *fiber.Ctx) error {
	progressService, err := ctrl.getProgressService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get tenant ID from context
	tenantID, err := utils.GetTenantUUID(c)
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
	progress, err := progressService.InitializeProgress(c.Context(), req.EnrollmentID, req.UserID, req.CourseID, tenantID, req.TotalLessons, req.TotalQuizzes)
	if err != nil {
		if err == ports.ErrProgressAlreadyExists {
			return ErrorResponse(c, fiber.StatusConflict, "Progress already exists for this enrollment")
		}
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Progress initialized successfully", progress)
}

// RecalculateProgress recalculates progress based on actual completions
// POST /api/v1/progress/users/:userID/courses/:courseID/recalculate
func (ctrl *TenantAwareProgressController) RecalculateProgress(c *fiber.Ctx) error {
	progressService, err := ctrl.getProgressService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get user ID from params
	userIDStr := c.Params("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID format")
	}

	// Get course ID from params
	courseIDStr := c.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID format")
	}

	// Get tenant ID from context
	tenantID, err := utils.GetTenantUUID(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	progress, err := progressService.RecalculateProgress(c.Context(), userID, courseID, tenantID)
	if err != nil {
		if err == ports.ErrProgressNotFound {
			return ErrorResponse(c, fiber.StatusNotFound, "Progress not found")
		}
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress recalculated successfully", progress)
}

// SyncProgressFromEnrollment syncs progress with enrollment data
// POST /api/v1/enrollments/:enrollmentID/progress/sync
func (ctrl *TenantAwareProgressController) SyncProgressFromEnrollment(c *fiber.Ctx) error {
	progressService, err := ctrl.getProgressService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get enrollment ID from params
	enrollmentIDStr := c.Params("enrollmentID")
	enrollmentID, err := uuid.Parse(enrollmentIDStr)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid enrollment ID format")
	}

	// Get tenant ID from context
	tenantID, err := utils.GetTenantUUID(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	err = progressService.SyncProgressFromEnrollment(c.Context(), enrollmentID, tenantID)
	if err != nil {
		if err == ports.ErrProgressNotFound {
			return ErrorResponse(c, fiber.StatusNotFound, "Progress not found for this enrollment")
		}
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress synced successfully", nil)
}

// ============================================================================
// Route Registration
// ============================================================================

// RegisterRoutes registers all progress routes with the Fiber router group
func (ctrl *TenantAwareProgressController) RegisterRoutes(progress fiber.Router) {
	// NOTE: The 'progress' router is already the /progress group with Auth, Tenant, and Membership middlewares applied
	// All routes here are relative to /progress

	// ============================================================
	// Student Progress Routes - /progress/my/*
	// ============================================================
	studentProgress := progress.Group("/my")
	{
		// Get my progress summary across all courses
		studentProgress.Get("/summary", ctrl.GetMyProgressSummary)

		// Get all my course progress (paginated)
		studentProgress.Get("", ctrl.GetMyProgressList)

		// Course-specific student progress operations
		studentProgress.Get("/courses/:courseID", ctrl.GetMyProgress)
		studentProgress.Put("/courses/:courseID", ctrl.UpdateMyProgress)
		studentProgress.Post("/courses/:courseID/activity", ctrl.RecordActivity)
		studentProgress.Get("/courses/:courseID/history", ctrl.GetMyProgressHistory)

		// Milestone snapshots
		studentProgress.Post("/courses/:courseID/snapshot", ctrl.CreateMilestoneSnapshot)
		studentProgress.Get("/courses/:courseID/snapshots", ctrl.GetProgressSnapshots)
	}

	// ============================================================
	// Admin/Instructor Progress Management Routes - /progress/*
	// ============================================================
	{
		// Initialize progress (system endpoint)
		progress.Post("/initialize", ctrl.InitializeProgress)

		// Get specific progress by ID
		progress.Get("/:progressID", ctrl.GetCourseProgress)

		// Delete progress (admin only)
		progress.Delete("/:progressID", ctrl.DeleteProgress)

		// Progress management operations
		progress.Post("/:progressID/complete", ctrl.MarkProgressAsCompleted)
		progress.Post("/:progressID/reset", ctrl.ResetProgress)

		// Get progress by user and course
		progress.Get("/users/:userID/courses/:courseID", ctrl.GetProgressByUser)

		// Recalculate progress
		progress.Post("/users/:userID/courses/:courseID/recalculate", ctrl.RecalculateProgress)

		// Course-specific progress operations
		progress.Get("/courses/:courseID", ctrl.ListCourseProgress)
		progress.Get("/courses/:courseID/statistics", ctrl.GetCourseStatistics)
		progress.Get("/courses/:courseID/analytics", ctrl.GetProgressAnalytics)
	}
}
