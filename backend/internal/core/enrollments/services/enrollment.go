package services

import (
	"context"
	"log"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/enrollments/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/enrollments/ports"
	"github.com/google/uuid"
)

// EnrollmentService implements the EnrollmentService interface
type EnrollmentService struct {
	repo ports.EnrollmentRepository
}

// NewEnrollmentService creates a new enrollment service
func NewEnrollmentService(repo ports.EnrollmentRepository) ports.EnrollmentService {
	return &EnrollmentService{
		repo: repo,
	}
}

// ============================================================
// Enrollment operations (Student)
// ============================================================

// EnrollInCourse enrolls a user in a course
func (s *EnrollmentService) EnrollInCourse(ctx context.Context, userID, tenantID uuid.UUID, req *domain.EnrollInCourseRequest) (*domain.EnrollmentResponse, error) {
	log.Printf("[EnrollmentService] EnrollInCourse - userID: %s, courseID: %s, tenantID: %s", userID, req.CourseID, tenantID)

	// Validate request
	if err := req.Validate(); err != nil {
		log.Printf("[EnrollmentService] Validation failed: %v", err)
		return nil, err
	}

	// Check if user is already enrolled
	isEnrolled, err := s.repo.IsUserEnrolled(ctx, userID, req.CourseID, tenantID)
	if err != nil {
		log.Printf("[EnrollmentService] Error checking enrollment: %v", err)
		return nil, ports.ErrEnrollmentCreationFailed
	}
	if isEnrolled {
		log.Printf("[EnrollmentService] User already enrolled")
		return nil, ports.ErrAlreadyEnrolled
	}

	// Create enrollment
	enrollment := domain.NewEnrollment(tenantID, userID, req.CourseID, req.ExpiresAt)

	if err := s.repo.CreateEnrollment(ctx, enrollment); err != nil {
		log.Printf("[EnrollmentService] Error creating enrollment: %v", err)
		return nil, ports.ErrEnrollmentCreationFailed
	}

	log.Printf("[EnrollmentService] Enrollment created successfully: %s", enrollment.ID)
	return domain.EnrollmentToResponse(enrollment), nil
}

// GetMyEnrollments returns all enrollments for a user
func (s *EnrollmentService) GetMyEnrollments(ctx context.Context, userID, tenantID uuid.UUID, page, pageSize int) (*domain.ListEnrollmentsResponse, error) {
	log.Printf("[EnrollmentService] GetMyEnrollments - userID: %s, page: %d, pageSize: %d", userID, page, pageSize)

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	enrollments, totalCount, err := s.repo.ListEnrollmentsByUser(ctx, userID, tenantID, page, pageSize)
	if err != nil {
		log.Printf("[EnrollmentService] Error listing enrollments: %v", err)
		return nil, err
	}

	return domain.EnrollmentsToListResponse(enrollments, totalCount, page, pageSize), nil
}

// GetMyEnrollment returns a specific enrollment for a user
func (s *EnrollmentService) GetMyEnrollment(ctx context.Context, enrollmentID, userID, tenantID uuid.UUID) (*domain.EnrollmentDetailResponse, error) {
	log.Printf("[EnrollmentService] GetMyEnrollment - enrollmentID: %s, userID: %s", enrollmentID, userID)

	enrollment, err := s.repo.GetEnrollment(ctx, enrollmentID, tenantID)
	if err != nil {
		log.Printf("[EnrollmentService] Error getting enrollment: %v", err)
		return nil, err
	}

	// Verify ownership
	if enrollment.UserID != userID {
		log.Printf("[EnrollmentService] Unauthorized access attempt")
		return nil, ports.ErrUnauthorizedAccess
	}

	return domain.EnrollmentToDetailResponse(enrollment), nil
}

// CancelMyEnrollment cancels a user's enrollment
func (s *EnrollmentService) CancelMyEnrollment(ctx context.Context, enrollmentID, userID, tenantID uuid.UUID, reason *string) error {
	log.Printf("[EnrollmentService] CancelMyEnrollment - enrollmentID: %s, userID: %s", enrollmentID, userID)

	enrollment, err := s.repo.GetEnrollment(ctx, enrollmentID, tenantID)
	if err != nil {
		log.Printf("[EnrollmentService] Error getting enrollment: %v", err)
		return err
	}

	// Verify ownership
	if enrollment.UserID != userID {
		log.Printf("[EnrollmentService] Unauthorized access attempt")
		return ports.ErrUnauthorizedAccess
	}

	// Check if already completed
	if enrollment.IsCompleted() {
		log.Printf("[EnrollmentService] Cannot cancel completed enrollment")
		return ports.ErrEnrollmentAlreadyCompleted
	}

	// Check if already cancelled
	if enrollment.Status == domain.EnrollmentStatusCancelled {
		log.Printf("[EnrollmentService] Enrollment already cancelled")
		return ports.ErrEnrollmentCancelled
	}

	if err := s.repo.CancelEnrollment(ctx, enrollmentID, tenantID, reason); err != nil {
		log.Printf("[EnrollmentService] Error cancelling enrollment: %v", err)
		return ports.ErrEnrollmentUpdateFailed
	}

	log.Printf("[EnrollmentService] Enrollment cancelled successfully")
	return nil
}

// CheckCourseAccess checks if a user can access a course
func (s *EnrollmentService) CheckCourseAccess(ctx context.Context, userID, courseID, tenantID uuid.UUID) (bool, error) {
	log.Printf("[EnrollmentService] CheckCourseAccess - userID: %s, courseID: %s", userID, courseID)

	canAccess, err := s.repo.CanUserAccessCourse(ctx, userID, courseID, tenantID)
	if err != nil {
		log.Printf("[EnrollmentService] Error checking access: %v", err)
		return false, err
	}

	return canAccess, nil
}

// ============================================================
// Progress tracking (Student)
// ============================================================

// UpdateMyProgress updates a user's enrollment progress
func (s *EnrollmentService) UpdateMyProgress(ctx context.Context, enrollmentID, userID, tenantID uuid.UUID, progressPercentage int) error {
	log.Printf("[EnrollmentService] UpdateMyProgress - enrollmentID: %s, progress: %d%%", enrollmentID, progressPercentage)

	// Validate progress
	if progressPercentage < 0 || progressPercentage > 100 {
		return ports.ErrInvalidProgress
	}

	enrollment, err := s.repo.GetEnrollment(ctx, enrollmentID, tenantID)
	if err != nil {
		log.Printf("[EnrollmentService] Error getting enrollment: %v", err)
		return err
	}

	// Verify ownership
	if enrollment.UserID != userID {
		log.Printf("[EnrollmentService] Unauthorized access attempt")
		return ports.ErrUnauthorizedAccess
	}

	// Cannot update progress of cancelled/expired enrollments
	if !enrollment.CanAccess() {
		log.Printf("[EnrollmentService] Cannot update progress - enrollment not accessible")
		return ports.ErrCannotAccessCourse
	}

	// Mark as started if first progress update
	if enrollment.StartedAt == nil {
		if err := s.repo.MarkAsStarted(ctx, enrollmentID, tenantID); err != nil {
			log.Printf("[EnrollmentService] Error marking as started: %v", err)
		}
	}

	if err := s.repo.UpdateProgress(ctx, enrollmentID, tenantID, progressPercentage); err != nil {
		log.Printf("[EnrollmentService] Error updating progress: %v", err)
		return ports.ErrEnrollmentUpdateFailed
	}

	log.Printf("[EnrollmentService] Progress updated successfully")
	return nil
}

// RecordCourseAccess records when a user accesses a course
func (s *EnrollmentService) RecordCourseAccess(ctx context.Context, userID, courseID, tenantID uuid.UUID) error {
	log.Printf("[EnrollmentService] RecordCourseAccess - userID: %s, courseID: %s", userID, courseID)

	enrollment, err := s.repo.GetEnrollmentByUserAndCourse(ctx, userID, courseID, tenantID)
	if err != nil {
		log.Printf("[EnrollmentService] Error getting enrollment: %v", err)
		return ports.ErrNotEnrolled
	}

	// Mark as started if first access
	if enrollment.StartedAt == nil {
		if err := s.repo.MarkAsStarted(ctx, enrollment.ID, tenantID); err != nil {
			log.Printf("[EnrollmentService] Error marking as started: %v", err)
		}
	}

	if err := s.repo.UpdateLastAccessed(ctx, enrollment.ID, tenantID); err != nil {
		log.Printf("[EnrollmentService] Error updating last accessed: %v", err)
		return ports.ErrEnrollmentUpdateFailed
	}

	return nil
}

// ============================================================
// Enrollment Request operations (Student)
// ============================================================

// RequestEnrollment creates an enrollment request for a course requiring approval
func (s *EnrollmentService) RequestEnrollment(ctx context.Context, userID, tenantID uuid.UUID, req *domain.EnrollInCourseRequest) (*domain.EnrollmentRequestResponse, error) {
	log.Printf("[EnrollmentService] RequestEnrollment - userID: %s, courseID: %s", userID, req.CourseID)

	// Validate request
	if err := req.Validate(); err != nil {
		log.Printf("[EnrollmentService] Validation failed: %v", err)
		return nil, err
	}

	// Check if user is already enrolled
	isEnrolled, err := s.repo.IsUserEnrolled(ctx, userID, req.CourseID, tenantID)
	if err != nil {
		log.Printf("[EnrollmentService] Error checking enrollment: %v", err)
		return nil, ports.ErrEnrollmentRequestCreationFailed
	}
	if isEnrolled {
		log.Printf("[EnrollmentService] User already enrolled")
		return nil, ports.ErrAlreadyEnrolled
	}

	// Check if there's already a pending request
	existingRequest, err := s.repo.GetEnrollmentRequestByUserAndCourse(ctx, userID, req.CourseID, tenantID)
	if err == nil && existingRequest != nil && existingRequest.IsPending() {
		log.Printf("[EnrollmentService] Enrollment request already exists")
		return nil, ports.ErrEnrollmentRequestAlreadyExists
	}

	// Create enrollment request
	enrollmentRequest := domain.NewEnrollmentRequest(tenantID, userID, req.CourseID, req.RequestMessage)

	if err := s.repo.CreateEnrollmentRequest(ctx, enrollmentRequest); err != nil {
		log.Printf("[EnrollmentService] Error creating enrollment request: %v", err)
		return nil, ports.ErrEnrollmentRequestCreationFailed
	}

	log.Printf("[EnrollmentService] Enrollment request created successfully: %s", enrollmentRequest.ID)
	return domain.EnrollmentRequestToResponse(enrollmentRequest), nil
}

// GetMyEnrollmentRequests returns all enrollment requests for a user
func (s *EnrollmentService) GetMyEnrollmentRequests(ctx context.Context, userID, tenantID uuid.UUID, page, pageSize int) (*domain.ListEnrollmentRequestsResponse, error) {
	log.Printf("[EnrollmentService] GetMyEnrollmentRequests - userID: %s", userID)

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	filters := &domain.ListEnrollmentRequestsRequest{
		Page:     page,
		PageSize: pageSize,
	}

	requests, _, err := s.repo.ListEnrollmentRequests(ctx, tenantID, filters)
	if err != nil {
		log.Printf("[EnrollmentService] Error listing enrollment requests: %v", err)
		return nil, err
	}

	// Filter by userID
	var userRequests []*domain.EnrollmentRequest
	for _, req := range requests {
		if req.UserID == userID {
			userRequests = append(userRequests, req)
		}
	}

	return domain.EnrollmentRequestsToListResponse(userRequests, len(userRequests), page, pageSize), nil
}

// CancelEnrollmentRequest cancels an enrollment request
func (s *EnrollmentService) CancelEnrollmentRequest(ctx context.Context, requestID, userID, tenantID uuid.UUID) error {
	log.Printf("[EnrollmentService] CancelEnrollmentRequest - requestID: %s, userID: %s", requestID, userID)

	request, err := s.repo.GetEnrollmentRequest(ctx, requestID, tenantID)
	if err != nil {
		log.Printf("[EnrollmentService] Error getting enrollment request: %v", err)
		return err
	}

	// Verify ownership
	if request.UserID != userID {
		log.Printf("[EnrollmentService] Unauthorized access attempt")
		return ports.ErrUnauthorizedAccess
	}

	// Can only cancel pending requests
	if !request.IsPending() {
		log.Printf("[EnrollmentService] Cannot cancel non-pending request")
		return ports.ErrEnrollmentRequestAlreadyReviewed
	}

	if err := s.repo.DeleteEnrollmentRequest(ctx, requestID, tenantID); err != nil {
		log.Printf("[EnrollmentService] Error deleting enrollment request: %v", err)
		return ports.ErrEnrollmentRequestUpdateFailed
	}

	log.Printf("[EnrollmentService] Enrollment request cancelled successfully")
	return nil
}

// ============================================================
// Enrollment management (Instructor/Admin)
// ============================================================

// GetEnrollment returns a specific enrollment (admin/instructor)
func (s *EnrollmentService) GetEnrollment(ctx context.Context, enrollmentID, tenantID uuid.UUID) (*domain.EnrollmentDetailResponse, error) {
	log.Printf("[EnrollmentService] GetEnrollment - enrollmentID: %s", enrollmentID)

	enrollment, err := s.repo.GetEnrollment(ctx, enrollmentID, tenantID)
	if err != nil {
		log.Printf("[EnrollmentService] Error getting enrollment: %v", err)
		return nil, err
	}

	return domain.EnrollmentToDetailResponse(enrollment), nil
}

// ListEnrollments returns a paginated list of enrollments with filters
func (s *EnrollmentService) ListEnrollments(ctx context.Context, tenantID uuid.UUID, req *domain.ListEnrollmentsRequest) (*domain.ListEnrollmentsResponse, error) {
	log.Printf("[EnrollmentService] ListEnrollments - page: %d, pageSize: %d", req.Page, req.PageSize)

	if err := req.Validate(); err != nil {
		log.Printf("[EnrollmentService] Validation failed: %v", err)
		return nil, err
	}

	enrollments, totalCount, err := s.repo.ListEnrollments(ctx, tenantID, req)
	if err != nil {
		log.Printf("[EnrollmentService] Error listing enrollments: %v", err)
		return nil, err
	}

	return domain.EnrollmentsToListResponse(enrollments, totalCount, req.Page, req.PageSize), nil
}

// GetCourseEnrollments returns all enrollments for a specific course
func (s *EnrollmentService) GetCourseEnrollments(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) (*domain.ListEnrollmentsResponse, error) {
	log.Printf("[EnrollmentService] GetCourseEnrollments - courseID: %s", courseID)

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	enrollments, totalCount, err := s.repo.ListEnrollmentsByCourse(ctx, courseID, tenantID, page, pageSize)
	if err != nil {
		log.Printf("[EnrollmentService] Error listing course enrollments: %v", err)
		return nil, err
	}

	return domain.EnrollmentsToListResponse(enrollments, totalCount, page, pageSize), nil
}

// UpdateEnrollmentProgress updates an enrollment's progress (admin/instructor)
func (s *EnrollmentService) UpdateEnrollmentProgress(ctx context.Context, enrollmentID, tenantID uuid.UUID, progressPercentage int) error {
	log.Printf("[EnrollmentService] UpdateEnrollmentProgress - enrollmentID: %s, progress: %d%%", enrollmentID, progressPercentage)

	if progressPercentage < 0 || progressPercentage > 100 {
		return ports.ErrInvalidProgress
	}

	enrollment, err := s.repo.GetEnrollment(ctx, enrollmentID, tenantID)
	if err != nil {
		log.Printf("[EnrollmentService] Error getting enrollment: %v", err)
		return err
	}

	if !enrollment.CanAccess() {
		log.Printf("[EnrollmentService] Cannot update progress - enrollment not accessible")
		return ports.ErrCannotAccessCourse
	}

	if err := s.repo.UpdateProgress(ctx, enrollmentID, tenantID, progressPercentage); err != nil {
		log.Printf("[EnrollmentService] Error updating progress: %v", err)
		return ports.ErrEnrollmentUpdateFailed
	}

	return nil
}

// CompleteEnrollment marks an enrollment as completed
func (s *EnrollmentService) CompleteEnrollment(ctx context.Context, enrollmentID, tenantID uuid.UUID, certificateID *uuid.UUID) error {
	log.Printf("[EnrollmentService] CompleteEnrollment - enrollmentID: %s", enrollmentID)

	enrollment, err := s.repo.GetEnrollment(ctx, enrollmentID, tenantID)
	if err != nil {
		log.Printf("[EnrollmentService] Error getting enrollment: %v", err)
		return err
	}

	if enrollment.IsCompleted() {
		log.Printf("[EnrollmentService] Enrollment already completed")
		return ports.ErrEnrollmentAlreadyCompleted
	}

	if err := s.repo.MarkAsCompleted(ctx, enrollmentID, tenantID, certificateID); err != nil {
		log.Printf("[EnrollmentService] Error marking as completed: %v", err)
		return ports.ErrEnrollmentUpdateFailed
	}

	log.Printf("[EnrollmentService] Enrollment marked as completed")
	return nil
}

// CancelEnrollment cancels an enrollment (admin/instructor)
func (s *EnrollmentService) CancelEnrollment(ctx context.Context, enrollmentID, tenantID uuid.UUID, reason *string) error {
	log.Printf("[EnrollmentService] CancelEnrollment - enrollmentID: %s", enrollmentID)

	enrollment, err := s.repo.GetEnrollment(ctx, enrollmentID, tenantID)
	if err != nil {
		log.Printf("[EnrollmentService] Error getting enrollment: %v", err)
		return err
	}

	if enrollment.IsCompleted() {
		log.Printf("[EnrollmentService] Cannot cancel completed enrollment")
		return ports.ErrEnrollmentAlreadyCompleted
	}

	if enrollment.Status == domain.EnrollmentStatusCancelled {
		log.Printf("[EnrollmentService] Enrollment already cancelled")
		return ports.ErrEnrollmentCancelled
	}

	if err := s.repo.CancelEnrollment(ctx, enrollmentID, tenantID, reason); err != nil {
		log.Printf("[EnrollmentService] Error cancelling enrollment: %v", err)
		return ports.ErrEnrollmentUpdateFailed
	}

	return nil
}

// ExtendEnrollment extends an enrollment's expiration date
func (s *EnrollmentService) ExtendEnrollment(ctx context.Context, enrollmentID, tenantID uuid.UUID, newExpiresAt time.Time) error {
	log.Printf("[EnrollmentService] ExtendEnrollment - enrollmentID: %s, newExpiresAt: %v", enrollmentID, newExpiresAt)

	if newExpiresAt.Before(time.Now().UTC()) {
		return ports.ErrExpirationDateInPast
	}

	enrollment, err := s.repo.GetEnrollment(ctx, enrollmentID, tenantID)
	if err != nil {
		log.Printf("[EnrollmentService] Error getting enrollment: %v", err)
		return err
	}

	if enrollment.Status == domain.EnrollmentStatusCancelled {
		log.Printf("[EnrollmentService] Cannot extend cancelled enrollment")
		return ports.ErrEnrollmentCancelled
	}

	if err := s.repo.ExtendEnrollment(ctx, enrollmentID, tenantID, newExpiresAt); err != nil {
		log.Printf("[EnrollmentService] Error extending enrollment: %v", err)
		return ports.ErrEnrollmentUpdateFailed
	}

	log.Printf("[EnrollmentService] Enrollment extended successfully")
	return nil
}

// DeleteEnrollment deletes an enrollment (admin only)
func (s *EnrollmentService) DeleteEnrollment(ctx context.Context, enrollmentID, tenantID uuid.UUID) error {
	log.Printf("[EnrollmentService] DeleteEnrollment - enrollmentID: %s", enrollmentID)

	if err := s.repo.DeleteEnrollment(ctx, enrollmentID, tenantID); err != nil {
		log.Printf("[EnrollmentService] Error deleting enrollment: %v", err)
		return ports.ErrEnrollmentDeletionFailed
	}

	return nil
}

// ============================================================
// Enrollment Request management (Instructor/Admin)
// ============================================================

// GetEnrollmentRequest returns a specific enrollment request
func (s *EnrollmentService) GetEnrollmentRequest(ctx context.Context, requestID, tenantID uuid.UUID) (*domain.EnrollmentRequestResponse, error) {
	log.Printf("[EnrollmentService] GetEnrollmentRequest - requestID: %s", requestID)

	request, err := s.repo.GetEnrollmentRequest(ctx, requestID, tenantID)
	if err != nil {
		log.Printf("[EnrollmentService] Error getting enrollment request: %v", err)
		return nil, err
	}

	return domain.EnrollmentRequestToResponse(request), nil
}

// ListEnrollmentRequests returns a paginated list of enrollment requests
func (s *EnrollmentService) ListEnrollmentRequests(ctx context.Context, tenantID uuid.UUID, req *domain.ListEnrollmentRequestsRequest) (*domain.ListEnrollmentRequestsResponse, error) {
	log.Printf("[EnrollmentService] ListEnrollmentRequests - page: %d, pageSize: %d", req.Page, req.PageSize)

	if err := req.Validate(); err != nil {
		log.Printf("[EnrollmentService] Validation failed: %v", err)
		return nil, err
	}

	requests, totalCount, err := s.repo.ListEnrollmentRequests(ctx, tenantID, req)
	if err != nil {
		log.Printf("[EnrollmentService] Error listing enrollment requests: %v", err)
		return nil, err
	}

	return domain.EnrollmentRequestsToListResponse(requests, totalCount, req.Page, req.PageSize), nil
}

// GetPendingEnrollmentRequests returns pending enrollment requests for a course
func (s *EnrollmentService) GetPendingEnrollmentRequests(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) (*domain.ListEnrollmentRequestsResponse, error) {
	log.Printf("[EnrollmentService] GetPendingEnrollmentRequests - courseID: %s", courseID)

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	requests, totalCount, err := s.repo.ListPendingEnrollmentRequestsByCourse(ctx, courseID, tenantID, page, pageSize)
	if err != nil {
		log.Printf("[EnrollmentService] Error listing pending requests: %v", err)
		return nil, err
	}

	return domain.EnrollmentRequestsToListResponse(requests, totalCount, page, pageSize), nil
}

// ApproveEnrollmentRequest approves an enrollment request and creates enrollment
func (s *EnrollmentService) ApproveEnrollmentRequest(ctx context.Context, requestID, reviewerID, tenantID uuid.UUID) (*domain.EnrollmentResponse, error) {
	log.Printf("[EnrollmentService] ApproveEnrollmentRequest - requestID: %s, reviewerID: %s", requestID, reviewerID)

	request, err := s.repo.GetEnrollmentRequest(ctx, requestID, tenantID)
	if err != nil {
		log.Printf("[EnrollmentService] Error getting enrollment request: %v", err)
		return nil, err
	}

	if !request.IsPending() {
		log.Printf("[EnrollmentService] Cannot approve non-pending request")
		return nil, ports.ErrEnrollmentRequestAlreadyReviewed
	}

	// Check if user is already enrolled (could have been enrolled via another path)
	isEnrolled, err := s.repo.IsUserEnrolled(ctx, request.UserID, request.CourseID, tenantID)
	if err != nil {
		log.Printf("[EnrollmentService] Error checking enrollment: %v", err)
		return nil, ports.ErrEnrollmentCreationFailed
	}
	if isEnrolled {
		log.Printf("[EnrollmentService] User already enrolled")
		return nil, ports.ErrAlreadyEnrolled
	}

	// Approve request
	request.Approve(reviewerID)
	if err := s.repo.UpdateEnrollmentRequest(ctx, request); err != nil {
		log.Printf("[EnrollmentService] Error updating enrollment request: %v", err)
		return nil, ports.ErrEnrollmentRequestUpdateFailed
	}

	// Create enrollment
	enrollment := domain.NewEnrollment(tenantID, request.UserID, request.CourseID, nil)
	if err := s.repo.CreateEnrollment(ctx, enrollment); err != nil {
		log.Printf("[EnrollmentService] Error creating enrollment: %v", err)
		return nil, ports.ErrEnrollmentCreationFailed
	}

	log.Printf("[EnrollmentService] Enrollment request approved and enrollment created: %s", enrollment.ID)
	return domain.EnrollmentToResponse(enrollment), nil
}

// RejectEnrollmentRequest rejects an enrollment request
func (s *EnrollmentService) RejectEnrollmentRequest(ctx context.Context, requestID, reviewerID, tenantID uuid.UUID, reason string) error {
	log.Printf("[EnrollmentService] RejectEnrollmentRequest - requestID: %s, reviewerID: %s", requestID, reviewerID)

	if len(reason) < 5 {
		return ports.ErrInvalidRejectionReason
	}

	request, err := s.repo.GetEnrollmentRequest(ctx, requestID, tenantID)
	if err != nil {
		log.Printf("[EnrollmentService] Error getting enrollment request: %v", err)
		return err
	}

	if !request.IsPending() {
		log.Printf("[EnrollmentService] Cannot reject non-pending request")
		return ports.ErrEnrollmentRequestAlreadyReviewed
	}

	request.Reject(reviewerID, reason)
	if err := s.repo.UpdateEnrollmentRequest(ctx, request); err != nil {
		log.Printf("[EnrollmentService] Error updating enrollment request: %v", err)
		return ports.ErrEnrollmentRequestUpdateFailed
	}

	log.Printf("[EnrollmentService] Enrollment request rejected")
	return nil
}

// ============================================================
// Statistics (Instructor/Admin)
// ============================================================

// GetCourseEnrollmentStats returns enrollment statistics for a course
func (s *EnrollmentService) GetCourseEnrollmentStats(ctx context.Context, courseID, tenantID uuid.UUID) (*domain.EnrollmentStatsResponse, error) {
	log.Printf("[EnrollmentService] GetCourseEnrollmentStats - courseID: %s", courseID)

	stats, err := s.repo.GetEnrollmentStats(ctx, courseID, tenantID)
	if err != nil {
		log.Printf("[EnrollmentService] Error getting enrollment stats: %v", err)
		return nil, ports.ErrStatisticsFailed
	}

	return stats, nil
}

// ============================================================
// Bulk operations (Admin/System)
// ============================================================

// ProcessExpiredEnrollments marks expired enrollments as expired
func (s *EnrollmentService) ProcessExpiredEnrollments(ctx context.Context, tenantID uuid.UUID) (int, error) {
	log.Printf("[EnrollmentService] ProcessExpiredEnrollments - tenantID: %s", tenantID)

	count, err := s.repo.MarkExpiredEnrollments(ctx, tenantID)
	if err != nil {
		log.Printf("[EnrollmentService] Error processing expired enrollments: %v", err)
		return 0, err
	}

	log.Printf("[EnrollmentService] Processed %d expired enrollments", count)
	return count, nil
}
