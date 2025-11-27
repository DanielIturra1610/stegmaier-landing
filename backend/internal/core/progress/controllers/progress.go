package controllers

import (
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/progress/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/progress/ports"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// ============================================================
// Progress Controller
// ============================================================

// ProgressController handles all HTTP requests for course progress tracking
type ProgressController struct {
	service ports.ProgressService
}

// NewProgressController creates a new ProgressController instance
func NewProgressController(service ports.ProgressService) *ProgressController {
	return &ProgressController{
		service: service,
	}
}

// ============================================================
// Student Progress Endpoints
// ============================================================

// GetMyProgress godoc
// @Summary Get my progress for a specific course
// @Description Get detailed progress information for a student's enrollment in a course
// @Tags Progress (Student)
// @Accept json
// @Produce json
// @Param courseId path string true "Course ID" format(uuid)
// @Security BearerAuth
// @Success 200 {object} domain.CourseProgressDetailResponse
// @Failure 400 {object} map[string]string "Invalid course ID"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "Progress not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /progress/my/courses/{courseId} [get]
func (c *ProgressController) GetMyProgress(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Extract user ID from context
	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: user ID not found",
		})
	}

	// Parse course ID from URL parameter
	courseIDStr := ctx.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid course ID format",
		})
	}

	// Get progress from service
	progress, err := c.service.GetMyProgress(ctx.Context(), courseID, userID, tenantID)
	if err != nil {
		switch err {
		case ports.ErrProgressNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "progress not found for this course",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to get progress",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(progress)
}

// GetMyProgressList godoc
// @Summary Get all my course progress
// @Description Get a paginated list of all courses the student is enrolled in with their progress
// @Tags Progress (Student)
// @Accept json
// @Produce json
// @Param page query int false "Page number (default: 1)" minimum(1)
// @Param pageSize query int false "Page size (default: 20, max: 100)" minimum(1) maximum(100)
// @Security BearerAuth
// @Success 200 {object} map[string]interface{} "List of progress with pagination"
// @Failure 400 {object} map[string]string "Invalid pagination parameters"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /progress/my [get]
func (c *ProgressController) GetMyProgressList(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Extract user ID from context
	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: user ID not found",
		})
	}

	// Parse pagination parameters
	page := ctx.QueryInt("page", 1)
	pageSize := ctx.QueryInt("pageSize", 20)

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Get progress list from service
	progressList, totalCount, err := c.service.GetMyProgressList(ctx.Context(), userID, tenantID, page, pageSize)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get progress list",
		})
	}

	// Calculate total pages
	totalPages := (totalCount + pageSize - 1) / pageSize

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"progress":   progressList,
		"totalCount": totalCount,
		"page":       page,
		"pageSize":   pageSize,
		"totalPages": totalPages,
	})
}

// GetMyProgressSummary godoc
// @Summary Get my progress summary
// @Description Get a summary of the student's progress across all enrolled courses
// @Tags Progress (Student)
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} domain.ProgressSummaryResponse
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /progress/my/summary [get]
func (c *ProgressController) GetMyProgressSummary(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, err := utils.GetTenantUUID(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Extract user ID from context
	userIDRaw := ctx.Locals("userID")
	if userIDRaw == nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: user ID not found",
		})
	}

	userIDStr, ok := userIDRaw.(string)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: invalid user ID type",
		})
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: invalid user ID format",
		})
	}

	// Get summary from service
	summary, err := c.service.GetMyProgressSummary(ctx.Context(), userID, tenantID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get progress summary",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(summary)
}

// UpdateMyProgress godoc
// @Summary Update my course progress
// @Description Update progress information for a specific course (completed lessons/quizzes, time spent)
// @Tags Progress (Student)
// @Accept json
// @Produce json
// @Param courseId path string true "Course ID" format(uuid)
// @Param request body domain.UpdateProgressRequest true "Progress update data"
// @Security BearerAuth
// @Success 200 {object} domain.CourseProgressResponse
// @Failure 400 {object} map[string]string "Invalid request"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "Progress not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /progress/my/courses/{courseId} [put]
func (c *ProgressController) UpdateMyProgress(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Extract user ID from context
	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: user ID not found",
		})
	}

	// Parse course ID from URL parameter
	courseIDStr := ctx.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid course ID format",
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

	// Update progress via service
	progress, err := c.service.UpdateMyProgress(ctx.Context(), courseID, userID, tenantID, &req)
	if err != nil {
		switch err {
		case ports.ErrProgressNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "progress not found for this course",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to update progress",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(progress)
}

// RecordActivity godoc
// @Summary Record learning activity
// @Description Record completion of a lesson or quiz and update time spent
// @Tags Progress (Student)
// @Accept json
// @Produce json
// @Param courseId path string true "Course ID" format(uuid)
// @Param request body domain.RecordProgressRequest true "Activity data"
// @Security BearerAuth
// @Success 200 {object} map[string]string "Activity recorded successfully"
// @Failure 400 {object} map[string]string "Invalid request"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "Progress not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /progress/my/courses/{courseId}/activity [post]
func (c *ProgressController) RecordActivity(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Extract user ID from context
	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: user ID not found",
		})
	}

	// Parse course ID from URL parameter
	courseIDStr := ctx.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid course ID format",
		})
	}

	// Parse request body
	var req domain.RecordProgressRequest
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

	// Record activity via service
	err = c.service.RecordActivity(ctx.Context(), courseID, userID, tenantID, &req)
	if err != nil {
		switch err {
		case ports.ErrProgressNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "progress not found for this course",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to record activity",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "activity recorded successfully",
	})
}

// GetMyProgressHistory godoc
// @Summary Get my progress history
// @Description Get historical snapshots of progress for a specific course with optional filters
// @Tags Progress (Student)
// @Accept json
// @Produce json
// @Param courseId path string true "Course ID" format(uuid)
// @Param page query int false "Page number (default: 1)" minimum(1)
// @Param pageSize query int false "Page size (default: 20, max: 100)" minimum(1) maximum(100)
// @Param startDate query string false "Start date filter (RFC3339 format)"
// @Param endDate query string false "End date filter (RFC3339 format)"
// @Param milestone query string false "Milestone filter (25%, 50%, 75%, 100%)"
// @Param sortBy query string false "Sort field (snapshot_date)"
// @Param sortOrder query string false "Sort order (asc, desc)"
// @Security BearerAuth
// @Success 200 {object} domain.ListProgressHistoryResponse
// @Failure 400 {object} map[string]string "Invalid request"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /progress/my/courses/{courseId}/history [get]
func (c *ProgressController) GetMyProgressHistory(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Extract user ID from context
	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: user ID not found",
		})
	}

	// Parse course ID from URL parameter
	courseIDStr := ctx.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid course ID format",
		})
	}

	// Build request from query parameters
	req := &domain.GetProgressHistoryRequest{
		Page:     ctx.QueryInt("page", 1),
		PageSize: ctx.QueryInt("pageSize", 20),
	}

	// Parse optional date filters
	if startDateStr := ctx.Query("startDate"); startDateStr != "" {
		startDate, err := time.Parse(time.RFC3339, startDateStr)
		if err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid start date format (use RFC3339)",
			})
		}
		req.StartDate = &startDate
	}

	if endDateStr := ctx.Query("endDate"); endDateStr != "" {
		endDate, err := time.Parse(time.RFC3339, endDateStr)
		if err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid end date format (use RFC3339)",
			})
		}
		req.EndDate = &endDate
	}

	// Parse optional filters
	if milestone := ctx.Query("milestone"); milestone != "" {
		req.Milestone = &milestone
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

	// Get progress history from service
	history, err := c.service.GetMyProgressHistory(ctx.Context(), courseID, userID, tenantID, req)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get progress history",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(history)
}

// ============================================================
// Instructor/Admin Progress Management Endpoints
// ============================================================

// GetCourseProgress godoc
// @Summary Get specific progress record
// @Description Get detailed progress information for a specific progress ID (Admin/Instructor)
// @Tags Progress (Admin/Instructor)
// @Accept json
// @Produce json
// @Param progressId path string true "Progress ID" format(uuid)
// @Security BearerAuth
// @Success 200 {object} domain.CourseProgressDetailResponse
// @Failure 400 {object} map[string]string "Invalid progress ID"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "Progress not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /progress/{progressId} [get]
func (c *ProgressController) GetCourseProgress(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Parse progress ID from URL parameter
	progressIDStr := ctx.Params("progressID")
	progressID, err := uuid.Parse(progressIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid progress ID format",
		})
	}

	// Get progress from service
	progress, err := c.service.GetCourseProgress(ctx.Context(), progressID, tenantID)
	if err != nil {
		switch err {
		case ports.ErrProgressNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "progress not found",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to get progress",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(progress)
}

// GetProgressByUser godoc
// @Summary Get user's progress for a course
// @Description Get detailed progress information for a specific user in a specific course (Admin/Instructor)
// @Tags Progress (Admin/Instructor)
// @Accept json
// @Produce json
// @Param userId path string true "User ID" format(uuid)
// @Param courseId path string true "Course ID" format(uuid)
// @Security BearerAuth
// @Success 200 {object} domain.CourseProgressDetailResponse
// @Failure 400 {object} map[string]string "Invalid user ID or course ID"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "Progress not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /progress/users/{userId}/courses/{courseId} [get]
func (c *ProgressController) GetProgressByUser(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Parse user ID from URL parameter
	userIDStr := ctx.Params("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user ID format",
		})
	}

	// Parse course ID from URL parameter
	courseIDStr := ctx.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid course ID format",
		})
	}

	// Get progress from service
	progress, err := c.service.GetProgressByUser(ctx.Context(), userID, courseID, tenantID)
	if err != nil {
		switch err {
		case ports.ErrProgressNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "progress not found for this user and course",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to get progress",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(progress)
}

// ListCourseProgress godoc
// @Summary List all progress for a course
// @Description Get a paginated list of all students' progress in a specific course (Admin/Instructor)
// @Tags Progress (Admin/Instructor)
// @Accept json
// @Produce json
// @Param courseId path string true "Course ID" format(uuid)
// @Param page query int false "Page number (default: 1)" minimum(1)
// @Param pageSize query int false "Page size (default: 20, max: 100)" minimum(1) maximum(100)
// @Security BearerAuth
// @Success 200 {object} map[string]interface{} "List of progress with pagination"
// @Failure 400 {object} map[string]string "Invalid request"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /progress/courses/{courseId} [get]
func (c *ProgressController) ListCourseProgress(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Parse course ID from URL parameter
	courseIDStr := ctx.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid course ID format",
		})
	}

	// Parse pagination parameters
	page := ctx.QueryInt("page", 1)
	pageSize := ctx.QueryInt("pageSize", 20)

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Get progress list from service
	progressList, totalCount, err := c.service.ListCourseProgress(ctx.Context(), courseID, tenantID, page, pageSize)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get progress list",
		})
	}

	// Calculate total pages
	totalPages := (totalCount + pageSize - 1) / pageSize

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"progress":   progressList,
		"totalCount": totalCount,
		"page":       page,
		"pageSize":   pageSize,
		"totalPages": totalPages,
	})
}

// MarkProgressAsCompleted godoc
// @Summary Mark progress as completed
// @Description Mark a student's course progress as completed, optionally linking a certificate (Admin/Instructor)
// @Tags Progress (Admin/Instructor)
// @Accept json
// @Produce json
// @Param progressId path string true "Progress ID" format(uuid)
// @Param request body domain.CompleteCourseRequest true "Completion data"
// @Security BearerAuth
// @Success 200 {object} map[string]string "Progress marked as completed"
// @Failure 400 {object} map[string]string "Invalid request"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "Progress not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /progress/{progressId}/complete [post]
func (c *ProgressController) MarkProgressAsCompleted(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Parse progress ID from URL parameter
	progressIDStr := ctx.Params("progressID")
	progressID, err := uuid.Parse(progressIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid progress ID format",
		})
	}

	// Parse request body
	var req domain.CompleteCourseRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	// Mark as completed via service
	err = c.service.MarkProgressAsCompleted(ctx.Context(), progressID, tenantID, req.CertificateID)
	if err != nil {
		switch err {
		case ports.ErrProgressNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "progress not found",
			})
		case ports.ErrProgressAlreadyCompleted:
			return ctx.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "progress is already completed",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to mark progress as completed",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "progress marked as completed successfully",
	})
}

// ResetProgress godoc
// @Summary Reset course progress
// @Description Reset a student's progress for a course to initial state (Admin/Instructor)
// @Tags Progress (Admin/Instructor)
// @Accept json
// @Produce json
// @Param progressId path string true "Progress ID" format(uuid)
// @Security BearerAuth
// @Success 200 {object} map[string]string "Progress reset successfully"
// @Failure 400 {object} map[string]string "Invalid progress ID"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "Progress not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /progress/{progressId}/reset [post]
func (c *ProgressController) ResetProgress(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Parse progress ID from URL parameter
	progressIDStr := ctx.Params("progressID")
	progressID, err := uuid.Parse(progressIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid progress ID format",
		})
	}

	// Reset progress via service
	err = c.service.ResetProgress(ctx.Context(), progressID, tenantID)
	if err != nil {
		switch err {
		case ports.ErrProgressNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "progress not found",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to reset progress",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "progress reset successfully",
	})
}

// DeleteProgress godoc
// @Summary Delete progress record
// @Description Permanently delete a progress record (Admin only)
// @Tags Progress (Admin/Instructor)
// @Accept json
// @Produce json
// @Param progressId path string true "Progress ID" format(uuid)
// @Security BearerAuth
// @Success 200 {object} map[string]string "Progress deleted successfully"
// @Failure 400 {object} map[string]string "Invalid progress ID"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "Progress not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /progress/{progressId} [delete]
func (c *ProgressController) DeleteProgress(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Parse progress ID from URL parameter
	progressIDStr := ctx.Params("progressID")
	progressID, err := uuid.Parse(progressIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid progress ID format",
		})
	}

	// Delete progress via service
	err = c.service.DeleteProgress(ctx.Context(), progressID, tenantID)
	if err != nil {
		switch err {
		case ports.ErrProgressNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "progress not found",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to delete progress",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "progress deleted successfully",
	})
}

// ============================================================
// Statistics Endpoints
// ============================================================

// GetCourseStatistics godoc
// @Summary Get course progress statistics
// @Description Get comprehensive statistics about student progress in a course (Admin/Instructor)
// @Tags Progress (Statistics)
// @Accept json
// @Produce json
// @Param courseId path string true "Course ID" format(uuid)
// @Param startDate query string false "Start date filter (RFC3339 format)"
// @Param endDate query string false "End date filter (RFC3339 format)"
// @Param status query string false "Status filter (not_started, in_progress, completed)"
// @Security BearerAuth
// @Success 200 {object} domain.ProgressStatisticsResponse
// @Failure 400 {object} map[string]string "Invalid request"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /progress/courses/{courseId}/statistics [get]
func (c *ProgressController) GetCourseStatistics(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Parse course ID from URL parameter
	courseIDStr := ctx.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid course ID format",
		})
	}

	// Build request from query parameters
	req := &domain.GetCourseStatisticsRequest{}

	// Parse optional date filters
	if startDateStr := ctx.Query("startDate"); startDateStr != "" {
		startDate, err := time.Parse(time.RFC3339, startDateStr)
		if err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid start date format (use RFC3339)",
			})
		}
		req.StartDate = &startDate
	}

	if endDateStr := ctx.Query("endDate"); endDateStr != "" {
		endDate, err := time.Parse(time.RFC3339, endDateStr)
		if err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid end date format (use RFC3339)",
			})
		}
		req.EndDate = &endDate
	}

	// Parse optional status filter
	if statusStr := ctx.Query("status"); statusStr != "" {
		status := domain.ProgressStatus(statusStr)
		req.Status = &status
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Get statistics from service
	stats, err := c.service.GetCourseStatistics(ctx.Context(), courseID, tenantID, req)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get course statistics",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(stats)
}

// GetProgressAnalytics godoc
// @Summary Get progress analytics
// @Description Get detailed analytics and insights about student progress in a course (Admin/Instructor)
// @Tags Progress (Statistics)
// @Accept json
// @Produce json
// @Param courseId path string true "Course ID" format(uuid)
// @Param startDate query string false "Start date filter (RFC3339 format)"
// @Param endDate query string false "End date filter (RFC3339 format)"
// @Security BearerAuth
// @Success 200 {object} map[string]interface{} "Analytics data"
// @Failure 400 {object} map[string]string "Invalid request"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /progress/courses/{courseId}/analytics [get]
func (c *ProgressController) GetProgressAnalytics(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Parse course ID from URL parameter
	courseIDStr := ctx.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid course ID format",
		})
	}

	// Parse optional date filters
	var startDate, endDate *time.Time
	if startDateStr := ctx.Query("startDate"); startDateStr != "" {
		parsedDate, err := time.Parse(time.RFC3339, startDateStr)
		if err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid start date format (use RFC3339)",
			})
		}
		startDate = &parsedDate
	}

	if endDateStr := ctx.Query("endDate"); endDateStr != "" {
		parsedDate, err := time.Parse(time.RFC3339, endDateStr)
		if err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid end date format (use RFC3339)",
			})
		}
		endDate = &parsedDate
	}

	// Get analytics from service
	analytics, err := c.service.GetProgressAnalytics(ctx.Context(), courseID, tenantID, startDate, endDate)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get progress analytics",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(analytics)
}

// ============================================================
// Snapshot Endpoints
// ============================================================

// CreateMilestoneSnapshot godoc
// @Summary Create a milestone snapshot
// @Description Create a progress snapshot when a student reaches a milestone (25%, 50%, 75%, 100%)
// @Tags Progress (Snapshots)
// @Accept json
// @Produce json
// @Param courseId path string true "Course ID" format(uuid)
// @Param milestoneType query string true "Milestone type (25%, 50%, 75%, 100%)"
// @Security BearerAuth
// @Success 201 {object} map[string]string "Snapshot created successfully"
// @Failure 400 {object} map[string]string "Invalid request"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "Progress not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /progress/my/courses/{courseId}/snapshot [post]
func (c *ProgressController) CreateMilestoneSnapshot(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Extract user ID from context
	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: user ID not found",
		})
	}

	// Parse course ID from URL parameter
	courseIDStr := ctx.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid course ID format",
		})
	}

	// Parse milestone type from query parameter
	milestoneTypeStr := ctx.Query("milestoneType")
	if milestoneTypeStr == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "milestone type is required",
		})
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
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid milestone type (valid: 25%, 50%, 75%, 100%)",
		})
	}

	// Create snapshot via service
	err = c.service.CreateMilestoneSnapshot(ctx.Context(), userID, courseID, tenantID, milestoneType)
	if err != nil {
		switch err {
		case ports.ErrProgressNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "progress not found for this course",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to create milestone snapshot",
			})
		}
	}

	return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "milestone snapshot created successfully",
	})
}

// GetProgressSnapshots godoc
// @Summary Get progress snapshots
// @Description Get all milestone snapshots for a student's course progress
// @Tags Progress (Snapshots)
// @Accept json
// @Produce json
// @Param courseId path string true "Course ID" format(uuid)
// @Param page query int false "Page number (default: 1)" minimum(1)
// @Param pageSize query int false "Page size (default: 20, max: 100)" minimum(1) maximum(100)
// @Security BearerAuth
// @Success 200 {object} domain.ListProgressHistoryResponse
// @Failure 400 {object} map[string]string "Invalid request"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /progress/my/courses/{courseId}/snapshots [get]
func (c *ProgressController) GetProgressSnapshots(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Extract user ID from context
	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: user ID not found",
		})
	}

	// Parse course ID from URL parameter
	courseIDStr := ctx.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid course ID format",
		})
	}

	// Parse pagination parameters
	page := ctx.QueryInt("page", 1)
	pageSize := ctx.QueryInt("pageSize", 20)

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Get snapshots from service
	snapshots, err := c.service.GetProgressSnapshots(ctx.Context(), userID, courseID, tenantID, page, pageSize)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get progress snapshots",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(snapshots)
}

// ============================================================
// Route Registration
// ============================================================

// RegisterRoutes registers all progress routes
func (c *ProgressController) RegisterRoutes(progress fiber.Router) {
	// NOTE: The 'progress' router is already the /progress group with Auth, Tenant, and Membership middlewares applied
	// All routes here are relative to /progress

	// ============================================================
	// Student Progress Routes - /progress/my/*
	// ============================================================
	studentProgress := progress.Group("/my")
	{
		// Get my progress summary across all courses
		studentProgress.Get("/summary", c.GetMyProgressSummary)

		// Get all my course progress (paginated)
		studentProgress.Get("", c.GetMyProgressList)

		// Course-specific student progress operations
		studentProgress.Get("/courses/:courseID", c.GetMyProgress)
		studentProgress.Put("/courses/:courseID", c.UpdateMyProgress)
		studentProgress.Post("/courses/:courseID/activity", c.RecordActivity)
		studentProgress.Get("/courses/:courseID/history", c.GetMyProgressHistory)

		// Milestone snapshots
		studentProgress.Post("/courses/:courseID/snapshot", c.CreateMilestoneSnapshot)
		studentProgress.Get("/courses/:courseID/snapshots", c.GetProgressSnapshots)
	}

	// ============================================================
	// Admin/Instructor Progress Management Routes - /progress/*
	// ============================================================
	{
		// Get specific progress by ID
		progress.Get("/:progressID", c.GetCourseProgress)

		// Delete progress (admin only)
		progress.Delete("/:progressID", c.DeleteProgress)

		// Progress management operations
		progress.Post("/:progressID/complete", c.MarkProgressAsCompleted)
		progress.Post("/:progressID/reset", c.ResetProgress)

		// Get progress by user and course
		progress.Get("/users/:userID/courses/:courseID", c.GetProgressByUser)

		// Course-specific progress operations
		progress.Get("/courses/:courseID", c.ListCourseProgress)
		progress.Get("/courses/:courseID/statistics", c.GetCourseStatistics)
		progress.Get("/courses/:courseID/analytics", c.GetProgressAnalytics)
	}
}
