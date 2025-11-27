package services

import (
	"context"
	"fmt"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/reviews/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/reviews/ports"
	"github.com/google/uuid"
)

// CourseRatingSync defines the interface for syncing course ratings
// This is used to update the courses table after review changes
type CourseRatingSync interface {
	SyncRatingFromReviews(ctx context.Context, courseID, tenantID uuid.UUID) error
}

// ReviewService implementa la lógica de negocio para Reviews
type ReviewService struct {
	repo             ports.ReviewRepository
	courseRatingSync CourseRatingSync
	// TODO: Add EnrollmentRepository for validation
}

// NewReviewService crea una nueva instancia del servicio
func NewReviewService(repo ports.ReviewRepository, courseRatingSync CourseRatingSync) ports.ReviewService {
	return &ReviewService{
		repo:             repo,
		courseRatingSync: courseRatingSync,
	}
}

// ============================================================================
// CRUD Operations
// ============================================================================

// CreateReview crea una nueva review
func (s *ReviewService) CreateReview(tenantID, userID uuid.UUID, req domain.CreateReviewRequest) (*domain.ReviewResponse, error) {
	// Validate request
	if err := req.Validate(); err != nil {
		return nil, err
	}

	// Check if user already reviewed this course
	existing, err := s.repo.GetByUserAndCourse(tenantID, userID, req.CourseID)
	if err != nil && err != domain.ErrReviewNotFound {
		return nil, err
	}
	if existing != nil {
		return nil, domain.ErrReviewAlreadyExists
	}

	// TODO: Validate that user is enrolled in the course
	// TODO: Validate that user is not the course instructor
	// TODO: Optional: Validate that user completed the course

	// Create review entity
	review := &domain.Review{
		ID:        uuid.New(),
		TenantID:  tenantID,
		CourseID:  req.CourseID,
		UserID:    userID,
		Rating:    req.Rating,
		Title:     req.Title,
		Comment:   req.Comment,
		IsPublic:  req.IsPublic,
		IsEdited:  false,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Save review
	if err := s.repo.Create(review); err != nil {
		return nil, err
	}

	// Recalculate and sync course rating
	s.recalculateAndSyncRating(tenantID, req.CourseID)

	// Convert to response
	return s.toResponse(review, 0, 0, nil), nil
}

// GetReview obtiene una review por ID
func (s *ReviewService) GetReview(tenantID, reviewID uuid.UUID) (*domain.ReviewResponse, error) {
	review, err := s.repo.GetByID(tenantID, reviewID)
	if err != nil {
		return nil, err
	}

	// Get helpful counts
	helpful, unhelpful, err := s.repo.GetHelpfulCounts(tenantID, reviewID)
	if err != nil {
		helpful = 0
		unhelpful = 0
	}

	return s.toResponse(review, helpful, unhelpful, nil), nil
}

// GetUserReviewForCourse obtiene la review de un usuario para un curso
func (s *ReviewService) GetUserReviewForCourse(tenantID, userID, courseID uuid.UUID) (*domain.ReviewResponse, error) {
	review, err := s.repo.GetByUserAndCourse(tenantID, userID, courseID)
	if err != nil {
		return nil, err
	}

	// Get helpful counts
	helpful, unhelpful, err := s.repo.GetHelpfulCounts(tenantID, review.ID)
	if err != nil {
		helpful = 0
		unhelpful = 0
	}

	// Get user's own vote (should be nil since it's their review)
	return s.toResponse(review, helpful, unhelpful, nil), nil
}

// UpdateReview actualiza una review existente
func (s *ReviewService) UpdateReview(tenantID, userID, reviewID uuid.UUID, req domain.UpdateReviewRequest) (*domain.ReviewResponse, error) {
	// Validate request
	if err := req.Validate(); err != nil {
		return nil, err
	}

	// Get existing review
	review, err := s.repo.GetByID(tenantID, reviewID)
	if err != nil {
		return nil, err
	}

	// Check ownership
	if review.UserID != userID {
		return nil, domain.ErrUnauthorizedAccess
	}

	// Update fields
	if req.Rating != nil {
		review.Rating = *req.Rating
	}
	if req.Title != nil {
		review.Title = req.Title
	}
	if req.Comment != nil {
		review.Comment = req.Comment
	}
	if req.IsPublic != nil {
		review.IsPublic = *req.IsPublic
	}

	review.IsEdited = true
	review.UpdatedAt = time.Now()

	// Save changes
	if err := s.repo.Update(review); err != nil {
		return nil, err
	}

	// Recalculate and sync course rating if rating or visibility changed
	if req.Rating != nil || req.IsPublic != nil {
		s.recalculateAndSyncRating(tenantID, review.CourseID)
	}

	// Get helpful counts
	helpful, unhelpful, err := s.repo.GetHelpfulCounts(tenantID, reviewID)
	if err != nil {
		helpful = 0
		unhelpful = 0
	}

	return s.toResponse(review, helpful, unhelpful, nil), nil
}

// DeleteReview elimina una review
func (s *ReviewService) DeleteReview(tenantID, userID, reviewID uuid.UUID) error {
	// Get existing review
	review, err := s.repo.GetByID(tenantID, reviewID)
	if err != nil {
		return err
	}

	// Check ownership
	if review.UserID != userID {
		return domain.ErrUnauthorizedAccess
	}

	// Soft delete
	if err := s.repo.SoftDelete(tenantID, reviewID); err != nil {
		return err
	}

	// Recalculate and sync course rating
	s.recalculateAndSyncRating(tenantID, review.CourseID)

	return nil
}

// ============================================================================
// Query Operations
// ============================================================================

// GetCourseReviews obtiene las reviews de un curso
func (s *ReviewService) GetCourseReviews(tenantID, courseID uuid.UUID, userID *uuid.UUID, page, pageSize int, sortBy string) (*domain.ReviewListResponse, error) {
	// Get reviews
	reviews, total, err := s.repo.GetCourseReviews(tenantID, courseID, page, pageSize, sortBy)
	if err != nil {
		return nil, err
	}

	// Convert to responses
	responses := make([]domain.ReviewResponse, len(reviews))
	for i, review := range reviews {
		// Get helpful counts
		helpful, unhelpful, _ := s.repo.GetHelpfulCounts(tenantID, review.ID)

		// Get user vote if userID provided
		var userVote *bool
		if userID != nil {
			vote, _ := s.repo.GetUserVote(tenantID, review.ID, *userID)
			if vote != nil {
				userVote = &vote.IsHelpful
			}
		}

		responses[i] = *s.toResponse(&review, helpful, unhelpful, userVote)
	}

	totalPages := (total + pageSize - 1) / pageSize

	return &domain.ReviewListResponse{
		Reviews:    responses,
		TotalCount: total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

// GetUserReviews obtiene las reviews de un usuario
func (s *ReviewService) GetUserReviews(tenantID, userID uuid.UUID, page, pageSize int) (*domain.ReviewListResponse, error) {
	// Get reviews
	reviews, total, err := s.repo.GetUserReviews(tenantID, userID, page, pageSize)
	if err != nil {
		return nil, err
	}

	// Convert to responses
	responses := make([]domain.ReviewResponse, len(reviews))
	for i, review := range reviews {
		// Get helpful counts
		helpful, unhelpful, _ := s.repo.GetHelpfulCounts(tenantID, review.ID)

		responses[i] = *s.toResponse(&review, helpful, unhelpful, nil)
	}

	totalPages := (total + pageSize - 1) / pageSize

	return &domain.ReviewListResponse{
		Reviews:    responses,
		TotalCount: total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

// GetCourseRating obtiene el rating agregado de un curso
func (s *ReviewService) GetCourseRating(tenantID, courseID uuid.UUID) (*domain.CourseRatingResponse, error) {
	rating, err := s.repo.GetCourseRating(tenantID, courseID)
	if err != nil {
		return nil, err
	}

	distribution := rating.CalculateRatingDistribution()

	return &domain.CourseRatingResponse{
		CourseID:      rating.CourseID,
		AverageRating: rating.AverageRating,
		TotalReviews:  rating.TotalReviews,
		RatingDistribution: distribution,
		RatingCounts: map[int]int{
			5: rating.Rating5Stars,
			4: rating.Rating4Stars,
			3: rating.Rating3Stars,
			2: rating.Rating2Stars,
			1: rating.Rating1Star,
		},
	}, nil
}

// ============================================================================
// Helpful Votes Operations
// ============================================================================

// VoteReview registra un voto de utilidad en una review
func (s *ReviewService) VoteReview(tenantID, userID uuid.UUID, req domain.VoteReviewRequest) error {
	// Validate request
	if err := req.Validate(); err != nil {
		return err
	}

	// Get review to check ownership
	review, err := s.repo.GetByID(tenantID, req.ReviewID)
	if err != nil {
		return err
	}

	// Cannot vote on own review
	if review.UserID == userID {
		return domain.ErrCannotVoteOwnReview
	}

	// Check if user already voted
	existingVote, err := s.repo.GetUserVote(tenantID, req.ReviewID, userID)
	if err != nil {
		return err
	}

	if existingVote != nil {
		// Update existing vote
		existingVote.IsHelpful = req.IsHelpful
		return s.repo.UpdateHelpfulVote(existingVote)
	}

	// Create new vote
	vote := &domain.ReviewHelpful{
		ID:        uuid.New(),
		TenantID:  tenantID,
		ReviewID:  req.ReviewID,
		UserID:    userID,
		IsHelpful: req.IsHelpful,
		CreatedAt: time.Now(),
	}

	return s.repo.CreateHelpfulVote(vote)
}

// RemoveVote elimina el voto de un usuario en una review
func (s *ReviewService) RemoveVote(tenantID, userID, reviewID uuid.UUID) error {
	return s.repo.DeleteHelpfulVote(tenantID, reviewID, userID)
}

// ============================================================================
// Report Operations
// ============================================================================

// ReportReview crea un reporte de una review
func (s *ReviewService) ReportReview(tenantID, userID uuid.UUID, req domain.ReportReviewRequest) (*domain.ReviewReportResponse, error) {
	// Validate request
	if err := req.Validate(); err != nil {
		return nil, err
	}

	// Get review to check ownership
	review, err := s.repo.GetByID(tenantID, req.ReviewID)
	if err != nil {
		return nil, err
	}

	// Cannot report own review
	if review.UserID == userID {
		return nil, domain.ErrCannotReportOwnReview
	}

	// Check if user already reported
	hasReported, err := s.repo.UserHasReported(tenantID, req.ReviewID, userID)
	if err != nil {
		return nil, err
	}
	if hasReported {
		return nil, domain.ErrAlreadyReported
	}

	// Create report
	report := &domain.ReviewReport{
		ID:         uuid.New(),
		TenantID:   tenantID,
		ReviewID:   req.ReviewID,
		ReporterID: userID,
		Reason:     req.Reason,
		Status:     domain.ReportStatusPending,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	if err := s.repo.CreateReport(report); err != nil {
		return nil, err
	}

	return s.toReportResponse(report), nil
}

// GetReviewReports obtiene los reportes de una review
func (s *ReviewService) GetReviewReports(tenantID, reviewID uuid.UUID) ([]domain.ReviewReportResponse, error) {
	reports, err := s.repo.GetReportsByReview(tenantID, reviewID)
	if err != nil {
		return nil, err
	}

	responses := make([]domain.ReviewReportResponse, len(reports))
	for i, report := range reports {
		responses[i] = *s.toReportResponse(&report)
	}

	return responses, nil
}

// GetPendingReports obtiene los reportes pendientes
func (s *ReviewService) GetPendingReports(tenantID uuid.UUID, page, pageSize int) ([]domain.ReviewReportResponse, int, error) {
	reports, total, err := s.repo.GetPendingReports(tenantID, page, pageSize)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]domain.ReviewReportResponse, len(reports))
	for i, report := range reports {
		responses[i] = *s.toReportResponse(&report)
	}

	return responses, total, nil
}

// UpdateReportStatus actualiza el estado de un reporte (solo admins)
func (s *ReviewService) UpdateReportStatus(tenantID, adminID, reportID uuid.UUID, status domain.ReportStatus) error {
	// TODO: Validate admin permissions

	// Get report
	report, err := s.repo.GetReportByID(tenantID, reportID)
	if err != nil {
		return err
	}

	// Update status
	if err := s.repo.UpdateReportStatus(tenantID, reportID, status); err != nil {
		return err
	}

	// If approved, delete the review
	if status == domain.ReportStatusApproved {
		if err := s.repo.SoftDelete(tenantID, report.ReviewID); err != nil {
			fmt.Printf("Error deleting reported review: %v\n", err)
		}

		// Recalculate and sync course rating
		review, _ := s.repo.GetByID(tenantID, report.ReviewID)
		if review != nil {
			s.recalculateAndSyncRating(tenantID, review.CourseID)
		}
	}

	return nil
}

// ============================================================================
// Admin Operations
// ============================================================================

// DeleteReviewByAdmin elimina una review (solo admins)
func (s *ReviewService) DeleteReviewByAdmin(tenantID, adminID, reviewID uuid.UUID) error {
	// TODO: Validate admin permissions

	// Get review
	review, err := s.repo.GetByID(tenantID, reviewID)
	if err != nil {
		return err
	}

	// Soft delete
	if err := s.repo.SoftDelete(tenantID, reviewID); err != nil {
		return err
	}

	// Recalculate and sync course rating
	s.recalculateAndSyncRating(tenantID, review.CourseID)

	return nil
}

// ============================================================================
// Helper Methods
// ============================================================================

// recalculateAndSyncRating recalculates course rating and syncs with courses table
func (s *ReviewService) recalculateAndSyncRating(tenantID, courseID uuid.UUID) {
	// Recalculate rating in course_ratings table
	if err := s.repo.RecalculateCourseRating(tenantID, courseID); err != nil {
		fmt.Printf("Error recalculating course rating: %v\n", err)
		return // Don't try to sync if recalculation failed
	}

	// Sync with courses table
	if s.courseRatingSync != nil {
		ctx := context.Background()
		if err := s.courseRatingSync.SyncRatingFromReviews(ctx, courseID, tenantID); err != nil {
			fmt.Printf("Error syncing course rating: %v\n", err)
		}
	}
}

// toResponse convierte una review a ReviewResponse
func (s *ReviewService) toResponse(review *domain.Review, helpfulCount, unhelpfulCount int, userVoted *bool) *domain.ReviewResponse {
	return &domain.ReviewResponse{
		ID:             review.ID,
		CourseID:       review.CourseID,
		UserID:         review.UserID,
		UserName:       "User", // TODO: Fetch from User service
		UserAvatar:     nil,    // TODO: Fetch from User service
		Rating:         review.Rating,
		Title:          review.Title,
		Comment:        review.Comment,
		IsPublic:       review.IsPublic,
		IsEdited:       review.IsEdited,
		HelpfulCount:   helpfulCount,
		UnhelpfulCount: unhelpfulCount,
		UserVoted:      userVoted,
		CreatedAt:      review.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:      review.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

// toReportResponse convierte un reporte a ReviewReportResponse
func (s *ReviewService) toReportResponse(report *domain.ReviewReport) *domain.ReviewReportResponse {
	return &domain.ReviewReportResponse{
		ID:         report.ID,
		ReviewID:   report.ReviewID,
		ReporterID: report.ReporterID,
		Reason:     report.Reason,
		Status:     report.Status,
		CreatedAt:  report.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:  report.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}
