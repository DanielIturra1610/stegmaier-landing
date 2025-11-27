package ports

import (
	"context"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/enrollments/domain"
	"github.com/google/uuid"
)

// ============================================================
// Repository Interface
// ============================================================

// EnrollmentRepository defines the interface for enrollment data operations
type EnrollmentRepository interface {
	// Enrollment CRUD operations
	CreateEnrollment(ctx context.Context, enrollment *domain.Enrollment) error
	GetEnrollment(ctx context.Context, enrollmentID, tenantID uuid.UUID) (*domain.Enrollment, error)
	GetEnrollmentByUserAndCourse(ctx context.Context, userID, courseID, tenantID uuid.UUID) (*domain.Enrollment, error)
	ListEnrollments(ctx context.Context, tenantID uuid.UUID, filters *domain.ListEnrollmentsRequest) ([]*domain.Enrollment, int, error)
	ListEnrollmentsByUser(ctx context.Context, userID, tenantID uuid.UUID, page, pageSize int) ([]*domain.Enrollment, int, error)
	ListEnrollmentsByCourse(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) ([]*domain.Enrollment, int, error)
	UpdateEnrollment(ctx context.Context, enrollment *domain.Enrollment) error
	DeleteEnrollment(ctx context.Context, enrollmentID, tenantID uuid.UUID) error

	// Enrollment status operations
	UpdateEnrollmentStatus(ctx context.Context, enrollmentID, tenantID uuid.UUID, status domain.EnrollmentStatus) error
	UpdateProgress(ctx context.Context, enrollmentID, tenantID uuid.UUID, progressPercentage int) error
	UpdateLastAccessed(ctx context.Context, enrollmentID, tenantID uuid.UUID) error
	MarkAsStarted(ctx context.Context, enrollmentID, tenantID uuid.UUID) error
	MarkAsCompleted(ctx context.Context, enrollmentID, tenantID uuid.UUID, certificateID *uuid.UUID) error
	CancelEnrollment(ctx context.Context, enrollmentID, tenantID uuid.UUID, reason *string) error
	ExtendEnrollment(ctx context.Context, enrollmentID, tenantID uuid.UUID, newExpiresAt time.Time) error

	// Enrollment validation
	IsUserEnrolled(ctx context.Context, userID, courseID, tenantID uuid.UUID) (bool, error)
	CanUserAccessCourse(ctx context.Context, userID, courseID, tenantID uuid.UUID) (bool, error)
	GetActiveEnrollmentCount(ctx context.Context, courseID, tenantID uuid.UUID) (int, error)

	// Enrollment Request CRUD operations
	CreateEnrollmentRequest(ctx context.Context, request *domain.EnrollmentRequest) error
	GetEnrollmentRequest(ctx context.Context, requestID, tenantID uuid.UUID) (*domain.EnrollmentRequest, error)
	GetEnrollmentRequestByUserAndCourse(ctx context.Context, userID, courseID, tenantID uuid.UUID) (*domain.EnrollmentRequest, error)
	ListEnrollmentRequests(ctx context.Context, tenantID uuid.UUID, filters *domain.ListEnrollmentRequestsRequest) ([]*domain.EnrollmentRequest, int, error)
	ListPendingEnrollmentRequestsByCourse(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) ([]*domain.EnrollmentRequest, int, error)
	UpdateEnrollmentRequest(ctx context.Context, request *domain.EnrollmentRequest) error
	DeleteEnrollmentRequest(ctx context.Context, requestID, tenantID uuid.UUID) error

	// Statistics
	GetEnrollmentStats(ctx context.Context, courseID, tenantID uuid.UUID) (*domain.EnrollmentStatsResponse, error)
	CountEnrollmentsByStatus(ctx context.Context, courseID, tenantID uuid.UUID, status domain.EnrollmentStatus) (int, error)

	// Bulk operations
	MarkExpiredEnrollments(ctx context.Context, tenantID uuid.UUID) (int, error) // Returns count of marked enrollments
}

// ============================================================
// Service Interface
// ============================================================

// EnrollmentService defines the interface for enrollment business logic
type EnrollmentService interface {
	// Enrollment operations (Student)
	EnrollInCourse(ctx context.Context, userID, tenantID uuid.UUID, req *domain.EnrollInCourseRequest) (*domain.EnrollmentResponse, error)
	GetMyEnrollments(ctx context.Context, userID, tenantID uuid.UUID, page, pageSize int) (*domain.ListEnrollmentsResponse, error)
	GetMyEnrollment(ctx context.Context, enrollmentID, userID, tenantID uuid.UUID) (*domain.EnrollmentDetailResponse, error)
	CancelMyEnrollment(ctx context.Context, enrollmentID, userID, tenantID uuid.UUID, reason *string) error
	CheckCourseAccess(ctx context.Context, userID, courseID, tenantID uuid.UUID) (bool, error)

	// Progress tracking (Student)
	UpdateMyProgress(ctx context.Context, enrollmentID, userID, tenantID uuid.UUID, progressPercentage int) error
	RecordCourseAccess(ctx context.Context, userID, courseID, tenantID uuid.UUID) error // Updates last accessed

	// Enrollment Request operations (Student)
	RequestEnrollment(ctx context.Context, userID, tenantID uuid.UUID, req *domain.EnrollInCourseRequest) (*domain.EnrollmentRequestResponse, error)
	GetMyEnrollmentRequests(ctx context.Context, userID, tenantID uuid.UUID, page, pageSize int) (*domain.ListEnrollmentRequestsResponse, error)
	CancelEnrollmentRequest(ctx context.Context, requestID, userID, tenantID uuid.UUID) error

	// Enrollment management (Instructor/Admin)
	GetEnrollment(ctx context.Context, enrollmentID, tenantID uuid.UUID) (*domain.EnrollmentDetailResponse, error)
	ListEnrollments(ctx context.Context, tenantID uuid.UUID, req *domain.ListEnrollmentsRequest) (*domain.ListEnrollmentsResponse, error)
	GetCourseEnrollments(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) (*domain.ListEnrollmentsResponse, error)
	UpdateEnrollmentProgress(ctx context.Context, enrollmentID, tenantID uuid.UUID, progressPercentage int) error
	CompleteEnrollment(ctx context.Context, enrollmentID, tenantID uuid.UUID, certificateID *uuid.UUID) error
	CancelEnrollment(ctx context.Context, enrollmentID, tenantID uuid.UUID, reason *string) error
	ExtendEnrollment(ctx context.Context, enrollmentID, tenantID uuid.UUID, newExpiresAt time.Time) error
	DeleteEnrollment(ctx context.Context, enrollmentID, tenantID uuid.UUID) error

	// Enrollment Request management (Instructor/Admin)
	GetEnrollmentRequest(ctx context.Context, requestID, tenantID uuid.UUID) (*domain.EnrollmentRequestResponse, error)
	ListEnrollmentRequests(ctx context.Context, tenantID uuid.UUID, req *domain.ListEnrollmentRequestsRequest) (*domain.ListEnrollmentRequestsResponse, error)
	GetPendingEnrollmentRequests(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) (*domain.ListEnrollmentRequestsResponse, error)
	ApproveEnrollmentRequest(ctx context.Context, requestID, reviewerID, tenantID uuid.UUID) (*domain.EnrollmentResponse, error)
	RejectEnrollmentRequest(ctx context.Context, requestID, reviewerID, tenantID uuid.UUID, reason string) error

	// Statistics (Instructor/Admin)
	GetCourseEnrollmentStats(ctx context.Context, courseID, tenantID uuid.UUID) (*domain.EnrollmentStatsResponse, error)

	// Bulk operations (Admin/System)
	ProcessExpiredEnrollments(ctx context.Context, tenantID uuid.UUID) (int, error) // Returns count of processed enrollments
}
