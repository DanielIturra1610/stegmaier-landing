package ports

import (
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/reviews/domain"
	"github.com/google/uuid"
)

// ReviewRepository define las operaciones de persistencia para Reviews
type ReviewRepository interface {
	// CRUD operations
	Create(review *domain.Review) error
	GetByID(tenantID, reviewID uuid.UUID) (*domain.Review, error)
	GetByUserAndCourse(tenantID, userID, courseID uuid.UUID) (*domain.Review, error)
	Update(review *domain.Review) error
	Delete(tenantID, reviewID uuid.UUID) error
	SoftDelete(tenantID, reviewID uuid.UUID) error

	// Query operations
	GetReviews(tenantID uuid.UUID, filter domain.GetReviewsFilter) ([]domain.Review, int, error)
	GetCourseReviews(tenantID, courseID uuid.UUID, page, pageSize int, sortBy string) ([]domain.Review, int, error)
	GetUserReviews(tenantID, userID uuid.UUID, page, pageSize int) ([]domain.Review, int, error)
	CountByCourse(tenantID, courseID uuid.UUID) (int, error)
	CountByUser(tenantID, userID uuid.UUID) (int, error)

	// Rating operations
	GetCourseRating(tenantID, courseID uuid.UUID) (*domain.CourseRating, error)
	UpdateCourseRating(rating *domain.CourseRating) error
	RecalculateCourseRating(tenantID, courseID uuid.UUID) error

	// Helpful votes operations
	CreateHelpfulVote(vote *domain.ReviewHelpful) error
	GetUserVote(tenantID, reviewID, userID uuid.UUID) (*domain.ReviewHelpful, error)
	UpdateHelpfulVote(vote *domain.ReviewHelpful) error
	DeleteHelpfulVote(tenantID, reviewID, userID uuid.UUID) error
	GetHelpfulCounts(tenantID, reviewID uuid.UUID) (helpful int, unhelpful int, error error)

	// Report operations
	CreateReport(report *domain.ReviewReport) error
	GetReportByID(tenantID, reportID uuid.UUID) (*domain.ReviewReport, error)
	GetReportsByReview(tenantID, reviewID uuid.UUID) ([]domain.ReviewReport, error)
	GetPendingReports(tenantID uuid.UUID, page, pageSize int) ([]domain.ReviewReport, int, error)
	UpdateReportStatus(tenantID, reportID uuid.UUID, status domain.ReportStatus) error
	UserHasReported(tenantID, reviewID, userID uuid.UUID) (bool, error)
}

// ReviewService define la lógica de negocio para Reviews
type ReviewService interface {
	// CRUD operations
	CreateReview(tenantID, userID uuid.UUID, req domain.CreateReviewRequest) (*domain.ReviewResponse, error)
	GetReview(tenantID, reviewID uuid.UUID) (*domain.ReviewResponse, error)
	GetUserReviewForCourse(tenantID, userID, courseID uuid.UUID) (*domain.ReviewResponse, error)
	UpdateReview(tenantID, userID, reviewID uuid.UUID, req domain.UpdateReviewRequest) (*domain.ReviewResponse, error)
	DeleteReview(tenantID, userID, reviewID uuid.UUID) error

	// Query operations
	GetCourseReviews(tenantID, courseID uuid.UUID, userID *uuid.UUID, page, pageSize int, sortBy string) (*domain.ReviewListResponse, error)
	GetUserReviews(tenantID, userID uuid.UUID, page, pageSize int) (*domain.ReviewListResponse, error)
	GetCourseRating(tenantID, courseID uuid.UUID) (*domain.CourseRatingResponse, error)

	// Helpful votes operations
	VoteReview(tenantID, userID uuid.UUID, req domain.VoteReviewRequest) error
	RemoveVote(tenantID, userID, reviewID uuid.UUID) error

	// Report operations
	ReportReview(tenantID, userID uuid.UUID, req domain.ReportReviewRequest) (*domain.ReviewReportResponse, error)
	GetReviewReports(tenantID, reviewID uuid.UUID) ([]domain.ReviewReportResponse, error)
	GetPendingReports(tenantID uuid.UUID, page, pageSize int) ([]domain.ReviewReportResponse, int, error)
	UpdateReportStatus(tenantID, adminID, reportID uuid.UUID, status domain.ReportStatus) error

	// Admin operations
	DeleteReviewByAdmin(tenantID, adminID, reviewID uuid.UUID) error
}
