package controllers

import (
	"strconv"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/reviews/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/reviews/ports"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// ReviewController handles review-related HTTP requests
type ReviewController struct {
	reviewService ports.ReviewService
}

// NewReviewController creates a new ReviewController
func NewReviewController(reviewService ports.ReviewService) *ReviewController {
	return &ReviewController{
		reviewService: reviewService,
	}
}

// ============================================================================
// Review CRUD Operations
// ============================================================================

// CreateReview creates a new review
// POST /api/v1/reviews
func (ctrl *ReviewController) CreateReview(c *fiber.Ctx) error {
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
	var req domain.CreateReviewRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	review, err := ctrl.reviewService.CreateReview(tenantID, userID, req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Review created successfully", review)
}

// GetReview retrieves a single review by ID
// GET /api/v1/reviews/:id
func (ctrl *ReviewController) GetReview(c *fiber.Ctx) error {
	// Get review ID from params
	reviewID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid review ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	review, err := ctrl.reviewService.GetReview(tenantID, reviewID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Review retrieved successfully", review)
}

// GetUserReviewForCourse retrieves user's review for a specific course
// GET /api/v1/courses/:courseId/my-review
func (ctrl *ReviewController) GetUserReviewForCourse(c *fiber.Ctx) error {
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
	review, err := ctrl.reviewService.GetUserReviewForCourse(tenantID, userID, courseID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Review retrieved successfully", review)
}

// UpdateReview updates an existing review
// PATCH /api/v1/reviews/:id
func (ctrl *ReviewController) UpdateReview(c *fiber.Ctx) error {
	// Get review ID from params
	reviewID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid review ID")
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
	var req domain.UpdateReviewRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	review, err := ctrl.reviewService.UpdateReview(tenantID, userID, reviewID, req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Review updated successfully", review)
}

// DeleteReview deletes a review
// DELETE /api/v1/reviews/:id
func (ctrl *ReviewController) DeleteReview(c *fiber.Ctx) error {
	// Get review ID from params
	reviewID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid review ID")
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
	if err := ctrl.reviewService.DeleteReview(tenantID, userID, reviewID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Review deleted successfully", nil)
}

// ============================================================================
// Query Operations
// ============================================================================

// GetCourseReviews retrieves all reviews for a course
// GET /api/v1/courses/:courseId/reviews
func (ctrl *ReviewController) GetCourseReviews(c *fiber.Ctx) error {
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

	// Get optional user ID (for showing user's votes)
	var userID *uuid.UUID
	if userIDStr, ok := c.Locals("userID").(string); ok {
		if uid, err := uuid.Parse(userIDStr); err == nil {
			userID = &uid
		}
	}

	// Get query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "10"))
	sortBy := c.Query("sort_by", "recent") // recent, helpful, rating_high, rating_low

	// Call service
	reviews, err := ctrl.reviewService.GetCourseReviews(tenantID, courseID, userID, page, pageSize, sortBy)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Reviews retrieved successfully", reviews)
}

// GetUserReviews retrieves all reviews by a user
// GET /api/v1/users/:userId/reviews
func (ctrl *ReviewController) GetUserReviews(c *fiber.Ctx) error {
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

	// Get query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "10"))

	// Call service
	reviews, err := ctrl.reviewService.GetUserReviews(tenantID, userID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "User reviews retrieved successfully", reviews)
}

// GetMyReviews retrieves all reviews by the authenticated user
// GET /api/v1/reviews/my
func (ctrl *ReviewController) GetMyReviews(c *fiber.Ctx) error {
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

	// Get query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "10"))

	// Call service
	reviews, err := ctrl.reviewService.GetUserReviews(tenantID, userID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Your reviews retrieved successfully", reviews)
}

// GetCourseRating retrieves the aggregated rating for a course
// GET /api/v1/courses/:courseId/rating
func (ctrl *ReviewController) GetCourseRating(c *fiber.Ctx) error {
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

	// Call service
	rating, err := ctrl.reviewService.GetCourseRating(tenantID, courseID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course rating retrieved successfully", rating)
}

// ============================================================================
// Helpful Votes Operations
// ============================================================================

// VoteReview votes on a review's helpfulness
// POST /api/v1/reviews/:id/vote
func (ctrl *ReviewController) VoteReview(c *fiber.Ctx) error {
	// Get review ID from params
	reviewID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid review ID")
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
	var body struct {
		IsHelpful bool `json:"is_helpful"`
	}
	if err := c.BodyParser(&body); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Create vote request
	req := domain.VoteReviewRequest{
		ReviewID:  reviewID,
		IsHelpful: body.IsHelpful,
	}

	// Call service
	if err := ctrl.reviewService.VoteReview(tenantID, userID, req); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Vote registered successfully", nil)
}

// RemoveVote removes a vote from a review
// DELETE /api/v1/reviews/:id/vote
func (ctrl *ReviewController) RemoveVote(c *fiber.Ctx) error {
	// Get review ID from params
	reviewID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid review ID")
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
	if err := ctrl.reviewService.RemoveVote(tenantID, userID, reviewID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Vote removed successfully", nil)
}

// ============================================================================
// Report Operations
// ============================================================================

// ReportReview reports a review as inappropriate
// POST /api/v1/reviews/:id/report
func (ctrl *ReviewController) ReportReview(c *fiber.Ctx) error {
	// Get review ID from params
	reviewID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid review ID")
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
	var body struct {
		Reason string `json:"reason"`
	}
	if err := c.BodyParser(&body); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Create report request
	req := domain.ReportReviewRequest{
		ReviewID: reviewID,
		Reason:   body.Reason,
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	report, err := ctrl.reviewService.ReportReview(tenantID, userID, req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Review reported successfully", report)
}

// GetReviewReports retrieves all reports for a review (admin only)
// GET /api/v1/reviews/:id/reports
func (ctrl *ReviewController) GetReviewReports(c *fiber.Ctx) error {
	// Get review ID from params
	reviewID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid review ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	reports, err := ctrl.reviewService.GetReviewReports(tenantID, reviewID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Reports retrieved successfully", reports)
}

// GetPendingReports retrieves all pending reports (admin only)
// GET /api/v1/reviews/reports/pending
func (ctrl *ReviewController) GetPendingReports(c *fiber.Ctx) error {
	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Get query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "10"))

	// Call service
	reports, total, err := ctrl.reviewService.GetPendingReports(tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Pending reports retrieved successfully", fiber.Map{
		"reports": reports,
		"total":   total,
		"page":    page,
		"page_size": pageSize,
	})
}

// UpdateReportStatus updates the status of a report (admin only)
// PATCH /api/v1/reviews/reports/:reportId/status
func (ctrl *ReviewController) UpdateReportStatus(c *fiber.Ctx) error {
	// Get report ID from params
	reportID, err := uuid.Parse(c.Params("reportId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid report ID")
	}

	// Get admin ID from context
	adminID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.UpdateReportStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	if err := ctrl.reviewService.UpdateReportStatus(tenantID, adminID, reportID, req.Status); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Report status updated successfully", nil)
}

// DeleteReviewByAdmin deletes a review as admin
// DELETE /api/v1/admin/reviews/:id
func (ctrl *ReviewController) DeleteReviewByAdmin(c *fiber.Ctx) error {
	// Get review ID from params
	reviewID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid review ID")
	}

	// Get admin ID from context
	adminID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	if err := ctrl.reviewService.DeleteReviewByAdmin(tenantID, adminID, reviewID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Review deleted successfully", nil)
}
