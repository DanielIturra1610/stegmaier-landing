package controllers

import (
	"fmt"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/analytics/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/analytics/ports"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// AnalyticsController handles HTTP requests for analytics
type AnalyticsController struct {
	service ports.AnalyticsService
}

// NewAnalyticsController creates a new analytics controller
func NewAnalyticsController(service ports.AnalyticsService) *AnalyticsController {
	return &AnalyticsController{
		service: service,
	}
}

// RegisterRoutes registers all analytics routes
// NOTE: Authentication, Tenant, and Membership middlewares are already applied in server.go
// The 'analytics' parameter is the protected /analytics group with all middlewares
func (c *AnalyticsController) RegisterRoutes(analytics fiber.Router) {
	// Use the analytics router directly - it already has Auth, Tenant, and Membership middlewares

	// My Stats (Current User)
	analytics.Get("/my-stats", c.GetMyStats)

	// Student Analytics
	analytics.Get("/students/:studentID", c.GetStudentAnalytics)
	analytics.Get("/students/:studentID/dashboard", c.GetStudentDashboard)

	// Course Analytics
	analytics.Get("/courses/:courseID", c.GetCourseAnalytics)
	analytics.Get("/courses/:courseID/lessons", c.GetCourseLessonAnalytics)
	analytics.Get("/courses/:courseID/quizzes", c.GetCourseQuizAnalytics)
	analytics.Get("/courses/:courseID/assignments", c.GetCourseAssignmentAnalytics)

	// Instructor Analytics
	analytics.Get("/instructors/:instructorID", c.GetInstructorAnalytics)
	analytics.Get("/instructors/:instructorID/dashboard", c.GetInstructorDashboard)

	// Platform Analytics (Admin only)
	analytics.Get("/platform", c.GetPlatformAnalytics)
	analytics.Get("/platform/dashboard", c.GetAdminDashboard)

	// Leaderboards
	analytics.Get("/leaderboard", c.GetLeaderboard)

	// Specific Analytics
	analytics.Get("/quizzes/:quizID", c.GetQuizAnalytics)
	analytics.Get("/assignments/:assignmentID", c.GetAssignmentAnalytics)
	analytics.Get("/lessons/:lessonID", c.GetLessonAnalytics)

	// Export
	analytics.Post("/export", c.ExportAnalytics)
}

// ============================================================================
// Student Analytics Handlers
// ============================================================================

// GetStudentAnalytics retrieves comprehensive analytics for a student
// @Summary Get student analytics
// @Description Retrieves comprehensive analytics for a specific student
// @Tags Analytics
// @Accept json
// @Produce json
// @Param studentID path string true "Student ID"
// @Param start_date query string false "Start date (RFC3339 format)"
// @Param end_date query string false "End date (RFC3339 format)"
// @Param course_id query string false "Optional course ID for course-specific analytics"
// @Success 200 {object} domain.StudentAnalyticsResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /analytics/students/{studentID} [get]
func (c *AnalyticsController) GetStudentAnalytics(ctx *fiber.Ctx) error {
	// Get tenant ID from context (set by auth middleware)
	tenantID, err := utils.GetTenantUUID(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Parse student ID
	studentIDStr := ctx.Params("studentID")
	studentID, parseErr := uuid.Parse(studentIDStr)
	if parseErr != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid student ID",
		})
	}

	// Parse query parameters
	req := &domain.GetStudentAnalyticsRequest{
		StudentID: studentID,
	}

	// Parse start_date
	if startDateStr := ctx.Query("start_date"); startDateStr != "" {
		startDate, parseErr := time.Parse(time.RFC3339, startDateStr)
		if parseErr != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid start_date format",
			})
		}
		req.StartDate = &startDate
	}

	// Parse end_date
	if endDateStr := ctx.Query("end_date"); endDateStr != "" {
		endDate, parseErr := time.Parse(time.RFC3339, endDateStr)
		if parseErr != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid end_date format",
			})
		}
		req.EndDate = &endDate
	}

	// Parse course_id
	if courseIDStr := ctx.Query("course_id"); courseIDStr != "" {
		courseID, parseErr := uuid.Parse(courseIDStr)
		if parseErr != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid course_id",
			})
		}
		req.CourseID = &courseID
	}

	// Get analytics
	analytics, err := c.service.GetStudentAnalytics(ctx.Context(), tenantID, studentID, req)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(analytics)
}

// GetStudentDashboard retrieves dashboard data for a student
// @Summary Get student dashboard
// @Description Retrieves dashboard data for a specific student
// @Tags Analytics
// @Accept json
// @Produce json
// @Param studentID path string true "Student ID"
// @Success 200 {object} domain.StudentDashboard
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /analytics/students/{studentID}/dashboard [get]
func (c *AnalyticsController) GetStudentDashboard(ctx *fiber.Ctx) error {
	tenantID, err := utils.GetTenantUUID(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	studentIDStr := ctx.Params("studentID")
	studentID, parseErr := uuid.Parse(studentIDStr)
	if parseErr != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid student ID",
		})
	}

	dashboard, err := c.service.GetStudentDashboard(ctx.Context(), tenantID, studentID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(dashboard)
}

// GetMyStats retrieves dashboard data for the currently authenticated user
// @Summary Get my stats
// @Description Retrieves dashboard statistics for the currently authenticated user
// @Tags Analytics
// @Accept json
// @Produce json
// @Success 200 {object} domain.StudentDashboard
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /analytics/my-stats [get]
func (c *AnalyticsController) GetMyStats(ctx *fiber.Ctx) error {
	tenantID, err := utils.GetTenantUUID(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Get current user ID from context (set by auth middleware)
	userID := ctx.Locals("userID")
	if userID == nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: user ID not found",
		})
	}

	// Convert userID to UUID
	var studentID uuid.UUID
	switch v := userID.(type) {
	case string:
		parsed, err := uuid.Parse(v)
		if err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid user ID format",
			})
		}
		studentID = parsed
	case uuid.UUID:
		studentID = v
	default:
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user ID type",
		})
	}

	// Get student dashboard using the same service method
	dashboard, err := c.service.GetStudentDashboard(ctx.Context(), tenantID, studentID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(dashboard)
}

// ============================================================================
// Course Analytics Handlers
// ============================================================================

// GetCourseAnalytics retrieves comprehensive analytics for a course
// @Summary Get course analytics
// @Description Retrieves comprehensive analytics for a specific course
// @Tags Analytics
// @Accept json
// @Produce json
// @Param courseID path string true "Course ID"
// @Param start_date query string false "Start date (RFC3339 format)"
// @Param end_date query string false "End date (RFC3339 format)"
// @Success 200 {object} domain.CourseAnalyticsResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /analytics/courses/{courseID} [get]
func (c *AnalyticsController) GetCourseAnalytics(ctx *fiber.Ctx) error {
	tenantID, err := utils.GetTenantUUID(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	courseIDStr := ctx.Params("courseID")
	courseID, parseErr := uuid.Parse(courseIDStr)
	if parseErr != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid course ID",
		})
	}

	req := &domain.GetCourseAnalyticsRequest{
		CourseID: courseID,
	}

	if startDateStr := ctx.Query("start_date"); startDateStr != "" {
		startDate, parseErr := time.Parse(time.RFC3339, startDateStr)
		if parseErr != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid start_date format",
			})
		}
		req.StartDate = &startDate
	}

	if endDateStr := ctx.Query("end_date"); endDateStr != "" {
		endDate, parseErr := time.Parse(time.RFC3339, endDateStr)
		if parseErr != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid end_date format",
			})
		}
		req.EndDate = &endDate
	}

	analytics, err := c.service.GetCourseAnalytics(ctx.Context(), tenantID, courseID, req)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(analytics)
}

// GetCourseLessonAnalytics retrieves analytics for all lessons in a course
// @Summary Get course lesson analytics
// @Description Retrieves analytics for all lessons in a specific course
// @Tags Analytics
// @Accept json
// @Produce json
// @Param courseID path string true "Course ID"
// @Success 200 {array} domain.LessonAnalytics
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /analytics/courses/{courseID}/lessons [get]
func (c *AnalyticsController) GetCourseLessonAnalytics(ctx *fiber.Ctx) error {
	tenantID, err := utils.GetTenantUUID(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	courseIDStr := ctx.Params("courseID")
	courseID, parseErr := uuid.Parse(courseIDStr)
	if parseErr != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid course ID",
		})
	}

	lessons, err := c.service.GetCourseLessonAnalytics(ctx.Context(), tenantID, courseID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(lessons)
}

// GetCourseQuizAnalytics retrieves analytics for all quizzes in a course
// @Summary Get course quiz analytics
// @Description Retrieves analytics for all quizzes in a specific course
// @Tags Analytics
// @Accept json
// @Produce json
// @Param courseID path string true "Course ID"
// @Success 200 {array} domain.QuizAnalytics
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /analytics/courses/{courseID}/quizzes [get]
func (c *AnalyticsController) GetCourseQuizAnalytics(ctx *fiber.Ctx) error {
	tenantID, err := utils.GetTenantUUID(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	courseIDStr := ctx.Params("courseID")
	courseID, parseErr := uuid.Parse(courseIDStr)
	if parseErr != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid course ID",
		})
	}

	quizzes, err := c.service.GetCourseQuizAnalytics(ctx.Context(), tenantID, courseID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(quizzes)
}

// GetCourseAssignmentAnalytics retrieves analytics for all assignments in a course
// @Summary Get course assignment analytics
// @Description Retrieves analytics for all assignments in a specific course
// @Tags Analytics
// @Accept json
// @Produce json
// @Param courseID path string true "Course ID"
// @Success 200 {array} domain.AssignmentAnalytics
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /analytics/courses/{courseID}/assignments [get]
func (c *AnalyticsController) GetCourseAssignmentAnalytics(ctx *fiber.Ctx) error {
	tenantID, err := utils.GetTenantUUID(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	courseIDStr := ctx.Params("courseID")
	courseID, parseErr := uuid.Parse(courseIDStr)
	if parseErr != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid course ID",
		})
	}

	assignments, err := c.service.GetCourseAssignmentAnalytics(ctx.Context(), tenantID, courseID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(assignments)
}

// ============================================================================
// Instructor Analytics Handlers
// ============================================================================

// GetInstructorAnalytics retrieves comprehensive analytics for an instructor
// @Summary Get instructor analytics
// @Description Retrieves comprehensive analytics for a specific instructor
// @Tags Analytics
// @Accept json
// @Produce json
// @Param instructorID path string true "Instructor ID"
// @Param start_date query string false "Start date (RFC3339 format)"
// @Param end_date query string false "End date (RFC3339 format)"
// @Success 200 {object} domain.InstructorAnalyticsResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /analytics/instructors/{instructorID} [get]
func (c *AnalyticsController) GetInstructorAnalytics(ctx *fiber.Ctx) error {
	tenantID, err := utils.GetTenantUUID(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	instructorIDStr := ctx.Params("instructorID")
	instructorID, parseErr := uuid.Parse(instructorIDStr)
	if parseErr != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid instructor ID",
		})
	}

	req := &domain.GetInstructorAnalyticsRequest{
		InstructorID: instructorID,
	}

	if startDateStr := ctx.Query("start_date"); startDateStr != "" {
		startDate, parseErr := time.Parse(time.RFC3339, startDateStr)
		if parseErr != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid start_date format",
			})
		}
		req.StartDate = &startDate
	}

	if endDateStr := ctx.Query("end_date"); endDateStr != "" {
		endDate, parseErr := time.Parse(time.RFC3339, endDateStr)
		if parseErr != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid end_date format",
			})
		}
		req.EndDate = &endDate
	}

	analytics, err := c.service.GetInstructorAnalytics(ctx.Context(), tenantID, instructorID, req)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(analytics)
}

// GetInstructorDashboard retrieves dashboard data for an instructor
// @Summary Get instructor dashboard
// @Description Retrieves dashboard data for a specific instructor
// @Tags Analytics
// @Accept json
// @Produce json
// @Param instructorID path string true "Instructor ID"
// @Success 200 {object} domain.InstructorDashboard
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /analytics/instructors/{instructorID}/dashboard [get]
func (c *AnalyticsController) GetInstructorDashboard(ctx *fiber.Ctx) error {
	tenantID, err := utils.GetTenantUUID(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	instructorIDStr := ctx.Params("instructorID")
	instructorID, parseErr := uuid.Parse(instructorIDStr)
	if parseErr != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid instructor ID",
		})
	}

	dashboard, err := c.service.GetInstructorDashboard(ctx.Context(), tenantID, instructorID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(dashboard)
}

// ============================================================================
// Platform Analytics Handlers
// ============================================================================

// GetPlatformAnalytics retrieves overall platform analytics
// @Summary Get platform analytics
// @Description Retrieves overall platform analytics (admin only)
// @Tags Analytics
// @Accept json
// @Produce json
// @Param start_date query string false "Start date (RFC3339 format)"
// @Param end_date query string false "End date (RFC3339 format)"
// @Param period query string false "Aggregation period (day, week, month, year)"
// @Success 200 {object} domain.PlatformAnalyticsResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /analytics/platform [get]
func (c *AnalyticsController) GetPlatformAnalytics(ctx *fiber.Ctx) error {
	tenantID, err := utils.GetTenantUUID(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	req := &domain.GetAnalyticsRequest{}

	if startDateStr := ctx.Query("start_date"); startDateStr != "" {
		startDate, parseErr := time.Parse(time.RFC3339, startDateStr)
		if parseErr != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid start_date format",
			})
		}
		req.StartDate = &startDate
	}

	if endDateStr := ctx.Query("end_date"); endDateStr != "" {
		endDate, parseErr := time.Parse(time.RFC3339, endDateStr)
		if parseErr != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid end_date format",
			})
		}
		req.EndDate = &endDate
	}

	if period := ctx.Query("period"); period != "" {
		req.Period = period
	}

	analytics, err := c.service.GetPlatformAnalytics(ctx.Context(), tenantID, req)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(analytics)
}

// GetAdminDashboard retrieves dashboard data for admins
// @Summary Get admin dashboard
// @Description Retrieves dashboard data for platform administrators
// @Tags Analytics
// @Accept json
// @Produce json
// @Success 200 {object} domain.AdminDashboard
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /analytics/platform/dashboard [get]
func (c *AnalyticsController) GetAdminDashboard(ctx *fiber.Ctx) error {
	tenantID, err := utils.GetTenantUUID(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	dashboard, err := c.service.GetAdminDashboard(ctx.Context(), tenantID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(dashboard)
}

// ============================================================================
// Leaderboard Handler
// ============================================================================

// GetLeaderboard retrieves leaderboard data
// @Summary Get leaderboard
// @Description Retrieves leaderboard data for a specific metric
// @Tags Analytics
// @Accept json
// @Produce json
// @Param metric query string true "Metric (courses_completed, quiz_score, time_spent, certificates)"
// @Param course_id query string false "Optional course ID for course-specific leaderboard"
// @Param limit query int false "Limit (default 10, max 100)"
// @Param period query string false "Period (week, month, all-time)"
// @Success 200 {object} domain.LeaderboardResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /analytics/leaderboard [get]
func (c *AnalyticsController) GetLeaderboard(ctx *fiber.Ctx) error {
	tenantID, err := utils.GetTenantUUID(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	metric := ctx.Query("metric")
	if metric == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "metric is required",
		})
	}

	req := &domain.GetLeaderboardRequest{
		Metric: metric,
		Limit:  10,
		Period: "all-time",
	}

	if courseIDStr := ctx.Query("course_id"); courseIDStr != "" {
		courseID, err := uuid.Parse(courseIDStr)
		if err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid course_id",
			})
		}
		req.CourseID = &courseID
	}

	if limitStr := ctx.Query("limit"); limitStr != "" {
		var limit int
		if _, err := fmt.Sscanf(limitStr, "%d", &limit); err == nil {
			req.Limit = limit
		}
	}

	if period := ctx.Query("period"); period != "" {
		req.Period = period
	}

	leaderboard, err := c.service.GetLeaderboard(ctx.Context(), tenantID, req)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(leaderboard)
}

// ============================================================================
// Specific Analytics Handlers
// ============================================================================

// GetQuizAnalytics retrieves detailed analytics for a quiz
// @Summary Get quiz analytics
// @Description Retrieves detailed analytics for a specific quiz
// @Tags Analytics
// @Accept json
// @Produce json
// @Param quizID path string true "Quiz ID"
// @Success 200 {object} domain.QuizAnalyticsResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /analytics/quizzes/{quizID} [get]
func (c *AnalyticsController) GetQuizAnalytics(ctx *fiber.Ctx) error {
	tenantID, err := utils.GetTenantUUID(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	quizIDStr := ctx.Params("quizID")
	quizID, parseErr := uuid.Parse(quizIDStr)
	if parseErr != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid quiz ID",
		})
	}

	analytics, err := c.service.GetQuizAnalytics(ctx.Context(), tenantID, quizID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(analytics)
}

// GetAssignmentAnalytics retrieves detailed analytics for an assignment
// @Summary Get assignment analytics
// @Description Retrieves detailed analytics for a specific assignment
// @Tags Analytics
// @Accept json
// @Produce json
// @Param assignmentID path string true "Assignment ID"
// @Success 200 {object} domain.AssignmentAnalyticsResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /analytics/assignments/{assignmentID} [get]
func (c *AnalyticsController) GetAssignmentAnalytics(ctx *fiber.Ctx) error {
	tenantID, err := utils.GetTenantUUID(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	assignmentIDStr := ctx.Params("assignmentID")
	assignmentID, parseErr := uuid.Parse(assignmentIDStr)
	if parseErr != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid assignment ID",
		})
	}

	analytics, err := c.service.GetAssignmentAnalytics(ctx.Context(), tenantID, assignmentID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(analytics)
}

// GetLessonAnalytics retrieves analytics for a specific lesson
// @Summary Get lesson analytics
// @Description Retrieves analytics for a specific lesson
// @Tags Analytics
// @Accept json
// @Produce json
// @Param lessonID path string true "Lesson ID"
// @Success 200 {object} domain.LessonAnalytics
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /analytics/lessons/{lessonID} [get]
func (c *AnalyticsController) GetLessonAnalytics(ctx *fiber.Ctx) error {
	tenantID, err := utils.GetTenantUUID(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	lessonIDStr := ctx.Params("lessonID")
	lessonID, parseErr := uuid.Parse(lessonIDStr)
	if parseErr != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid lesson ID",
		})
	}

	analytics, err := c.service.GetLessonAnalytics(ctx.Context(), tenantID, lessonID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(analytics)
}

// ============================================================================
// Export Handler
// ============================================================================

// ExportAnalytics exports analytics data in the requested format
// @Summary Export analytics
// @Description Exports analytics data in the requested format (CSV, Excel, PDF)
// @Tags Analytics
// @Accept json
// @Produce json
// @Param request body domain.ExportRequest true "Export request"
// @Success 200 {object} domain.ExportResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /analytics/export [post]
func (c *AnalyticsController) ExportAnalytics(ctx *fiber.Ctx) error {
	tenantID, err := utils.GetTenantUUID(ctx)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	var req domain.ExportRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	response, err := c.service.ExportAnalytics(ctx.Context(), tenantID, &req)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(response)
}
