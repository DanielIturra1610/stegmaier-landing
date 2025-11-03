package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// ============================================================
// Request DTOs
// ============================================================

// EnrollInCourseRequest represents a request to enroll in a course
type EnrollInCourseRequest struct {
	CourseID       uuid.UUID  `json:"courseId" validate:"required"`
	RequestMessage *string    `json:"requestMessage,omitempty"` // For courses requiring approval
	ExpiresAt      *time.Time `json:"expiresAt,omitempty"`      // For time-limited enrollments
}

// ApproveEnrollmentRequestRequest represents a request to approve an enrollment request
type ApproveEnrollmentRequestRequest struct {
	RequestID uuid.UUID `json:"requestId" validate:"required"`
}

// RejectEnrollmentRequestRequest represents a request to reject an enrollment request
type RejectEnrollmentRequestRequest struct {
	RequestID uuid.UUID `json:"requestId" validate:"required"`
	Reason    string    `json:"reason" validate:"required,min=5"`
}

// CancelEnrollmentRequest represents a request to cancel an enrollment
type CancelEnrollmentRequest struct {
	EnrollmentID uuid.UUID `json:"enrollmentId" validate:"required"`
	Reason       *string   `json:"reason,omitempty"`
}

// ExtendEnrollmentRequest represents a request to extend an enrollment expiration
type ExtendEnrollmentRequest struct {
	EnrollmentID uuid.UUID `json:"enrollmentId" validate:"required"`
	NewExpiresAt time.Time `json:"newExpiresAt" validate:"required"`
}

// UpdateProgressRequest represents a request to update enrollment progress
type UpdateProgressRequest struct {
	EnrollmentID       uuid.UUID `json:"enrollmentId" validate:"required"`
	ProgressPercentage int       `json:"progressPercentage" validate:"min=0,max=100"`
}

// ListEnrollmentsRequest represents a request to list enrollments with filters
type ListEnrollmentsRequest struct {
	Page     int               `json:"page" validate:"min=1"`
	PageSize int               `json:"pageSize" validate:"min=1,max=100"`
	UserID   *uuid.UUID        `json:"userId,omitempty"`   // Filter by student
	CourseID *uuid.UUID        `json:"courseId,omitempty"` // Filter by course
	Status   *EnrollmentStatus `json:"status,omitempty"`   // Filter by status
	SortBy   *string           `json:"sortBy,omitempty"`   // enrolled_at, progress, last_accessed
	SortOrder *string          `json:"sortOrder,omitempty"` // asc, desc
}

// ListEnrollmentRequestsRequest represents a request to list enrollment requests
type ListEnrollmentRequestsRequest struct {
	Page     int                      `json:"page" validate:"min=1"`
	PageSize int                      `json:"pageSize" validate:"min=1,max=100"`
	CourseID *uuid.UUID               `json:"courseId,omitempty"` // Filter by course
	Status   *EnrollmentRequestStatus `json:"status,omitempty"`   // Filter by status
	SortBy   *string                  `json:"sortBy,omitempty"`   // requested_at, reviewed_at
	SortOrder *string                 `json:"sortOrder,omitempty"` // asc, desc
}

// ============================================================
// Response DTOs
// ============================================================

// EnrollmentResponse represents an enrollment in responses
type EnrollmentResponse struct {
	ID                 uuid.UUID        `json:"id"`
	TenantID           uuid.UUID        `json:"tenantId"`
	UserID             uuid.UUID        `json:"userId"`
	UserName           *string          `json:"userName,omitempty"`      // Populated from user service
	CourseID           uuid.UUID        `json:"courseId"`
	CourseName         *string          `json:"courseName,omitempty"`    // Populated from course
	Status             EnrollmentStatus `json:"status"`
	ProgressPercentage int              `json:"progressPercentage"`
	EnrolledAt         time.Time        `json:"enrolledAt"`
	StartedAt          *time.Time       `json:"startedAt,omitempty"`
	CompletedAt        *time.Time       `json:"completedAt,omitempty"`
	ExpiresAt          *time.Time       `json:"expiresAt,omitempty"`
	LastAccessedAt     *time.Time       `json:"lastAccessedAt,omitempty"`
	CertificateID      *uuid.UUID       `json:"certificateId,omitempty"`
	IsExpired          bool             `json:"isExpired"`
	CanAccess          bool             `json:"canAccess"`
	CreatedAt          time.Time        `json:"createdAt"`
	UpdatedAt          time.Time        `json:"updatedAt"`
}

// EnrollmentDetailResponse represents detailed enrollment information
type EnrollmentDetailResponse struct {
	*EnrollmentResponse
	CancellationReason *string `json:"cancellationReason,omitempty"`
	DaysEnrolled       int     `json:"daysEnrolled"`
	DaysUntilExpiry    *int    `json:"daysUntilExpiry,omitempty"`
}

// EnrollmentRequestResponse represents an enrollment request in responses
type EnrollmentRequestResponse struct {
	ID              uuid.UUID               `json:"id"`
	TenantID        uuid.UUID               `json:"tenantId"`
	UserID          uuid.UUID               `json:"userId"`
	UserName        *string                 `json:"userName,omitempty"`    // Populated from user service
	CourseID        uuid.UUID               `json:"courseId"`
	CourseName      *string                 `json:"courseName,omitempty"`  // Populated from course
	Status          EnrollmentRequestStatus `json:"status"`
	RequestMessage  *string                 `json:"requestMessage,omitempty"`
	ReviewedBy      *uuid.UUID              `json:"reviewedBy,omitempty"`
	ReviewerName    *string                 `json:"reviewerName,omitempty"` // Populated from user service
	RejectionReason *string                 `json:"rejectionReason,omitempty"`
	RequestedAt     time.Time               `json:"requestedAt"`
	ReviewedAt      *time.Time              `json:"reviewedAt,omitempty"`
	CreatedAt       time.Time               `json:"createdAt"`
	UpdatedAt       time.Time               `json:"updatedAt"`
}

// ListEnrollmentsResponse represents paginated enrollment list response
type ListEnrollmentsResponse struct {
	Enrollments []*EnrollmentResponse `json:"enrollments"`
	TotalCount  int                   `json:"totalCount"`
	Page        int                   `json:"page"`
	PageSize    int                   `json:"pageSize"`
	TotalPages  int                   `json:"totalPages"`
}

// ListEnrollmentRequestsResponse represents paginated enrollment request list response
type ListEnrollmentRequestsResponse struct {
	Requests   []*EnrollmentRequestResponse `json:"requests"`
	TotalCount int                          `json:"totalCount"`
	Page       int                          `json:"page"`
	PageSize   int                          `json:"pageSize"`
	TotalPages int                          `json:"totalPages"`
}

// EnrollmentStatsResponse represents enrollment statistics for a course
type EnrollmentStatsResponse struct {
	CourseID            uuid.UUID `json:"courseId"`
	TotalEnrollments    int       `json:"totalEnrollments"`
	ActiveEnrollments   int       `json:"activeEnrollments"`
	CompletedEnrollments int      `json:"completedEnrollments"`
	CancelledEnrollments int      `json:"cancelledEnrollments"`
	AverageProgress     float64   `json:"averageProgress"`
	CompletionRate      float64   `json:"completionRate"` // Percentage
}

// ============================================================
// Validation Methods
// ============================================================

// Validate validates the EnrollInCourseRequest
func (r *EnrollInCourseRequest) Validate() error {
	if r.CourseID == uuid.Nil {
		return errors.New("course ID is required")
	}
	if r.RequestMessage != nil && len(*r.RequestMessage) > 500 {
		return errors.New("request message must not exceed 500 characters")
	}
	if r.ExpiresAt != nil && r.ExpiresAt.Before(time.Now().UTC()) {
		return errors.New("expiration date must be in the future")
	}
	return nil
}

// Validate validates the RejectEnrollmentRequestRequest
func (r *RejectEnrollmentRequestRequest) Validate() error {
	if r.RequestID == uuid.Nil {
		return errors.New("request ID is required")
	}
	if r.Reason == "" {
		return errors.New("rejection reason is required")
	}
	if len(r.Reason) < 5 {
		return errors.New("rejection reason must be at least 5 characters")
	}
	if len(r.Reason) > 500 {
		return errors.New("rejection reason must not exceed 500 characters")
	}
	return nil
}

// Validate validates the CancelEnrollmentRequest
func (r *CancelEnrollmentRequest) Validate() error {
	if r.EnrollmentID == uuid.Nil {
		return errors.New("enrollment ID is required")
	}
	if r.Reason != nil && len(*r.Reason) > 500 {
		return errors.New("cancellation reason must not exceed 500 characters")
	}
	return nil
}

// Validate validates the ExtendEnrollmentRequest
func (r *ExtendEnrollmentRequest) Validate() error {
	if r.EnrollmentID == uuid.Nil {
		return errors.New("enrollment ID is required")
	}
	if r.NewExpiresAt.Before(time.Now().UTC()) {
		return errors.New("new expiration date must be in the future")
	}
	return nil
}

// Validate validates the UpdateProgressRequest
func (r *UpdateProgressRequest) Validate() error {
	if r.EnrollmentID == uuid.Nil {
		return errors.New("enrollment ID is required")
	}
	if r.ProgressPercentage < 0 || r.ProgressPercentage > 100 {
		return errors.New("progress percentage must be between 0 and 100")
	}
	return nil
}

// Validate validates the ListEnrollmentsRequest
func (r *ListEnrollmentsRequest) Validate() error {
	if r.Page < 1 {
		r.Page = 1
	}
	if r.PageSize < 1 {
		r.PageSize = 20
	}
	if r.PageSize > 100 {
		r.PageSize = 100
	}
	if r.Status != nil && !ValidateEnrollmentStatus(*r.Status) {
		return errors.New("invalid enrollment status")
	}
	if r.SortBy != nil {
		validSortBy := map[string]bool{
			"enrolled_at":    true,
			"progress":       true,
			"last_accessed":  true,
			"completed_at":   true,
		}
		if !validSortBy[*r.SortBy] {
			return errors.New("invalid sort by field")
		}
	}
	if r.SortOrder != nil {
		if *r.SortOrder != "asc" && *r.SortOrder != "desc" {
			return errors.New("sort order must be 'asc' or 'desc'")
		}
	}
	return nil
}

// Validate validates the ListEnrollmentRequestsRequest
func (r *ListEnrollmentRequestsRequest) Validate() error {
	if r.Page < 1 {
		r.Page = 1
	}
	if r.PageSize < 1 {
		r.PageSize = 20
	}
	if r.PageSize > 100 {
		r.PageSize = 100
	}
	if r.Status != nil && !ValidateEnrollmentRequestStatus(*r.Status) {
		return errors.New("invalid enrollment request status")
	}
	if r.SortBy != nil {
		validSortBy := map[string]bool{
			"requested_at": true,
			"reviewed_at":  true,
		}
		if !validSortBy[*r.SortBy] {
			return errors.New("invalid sort by field")
		}
	}
	if r.SortOrder != nil {
		if *r.SortOrder != "asc" && *r.SortOrder != "desc" {
			return errors.New("sort order must be 'asc' or 'desc'")
		}
	}
	return nil
}

// ============================================================
// Conversion Functions
// ============================================================

// EnrollmentToResponse converts an Enrollment entity to EnrollmentResponse
func EnrollmentToResponse(enrollment *Enrollment) *EnrollmentResponse {
	return &EnrollmentResponse{
		ID:                 enrollment.ID,
		TenantID:           enrollment.TenantID,
		UserID:             enrollment.UserID,
		CourseID:           enrollment.CourseID,
		Status:             enrollment.Status,
		ProgressPercentage: enrollment.ProgressPercentage,
		EnrolledAt:         enrollment.EnrolledAt,
		StartedAt:          enrollment.StartedAt,
		CompletedAt:        enrollment.CompletedAt,
		ExpiresAt:          enrollment.ExpiresAt,
		LastAccessedAt:     enrollment.LastAccessedAt,
		CertificateID:      enrollment.CertificateID,
		IsExpired:          enrollment.IsExpired(),
		CanAccess:          enrollment.CanAccess(),
		CreatedAt:          enrollment.CreatedAt,
		UpdatedAt:          enrollment.UpdatedAt,
	}
}

// EnrollmentToDetailResponse converts an Enrollment entity to EnrollmentDetailResponse
func EnrollmentToDetailResponse(enrollment *Enrollment) *EnrollmentDetailResponse {
	daysEnrolled := int(time.Since(enrollment.EnrolledAt).Hours() / 24)

	var daysUntilExpiry *int
	if enrollment.ExpiresAt != nil {
		days := int(time.Until(*enrollment.ExpiresAt).Hours() / 24)
		daysUntilExpiry = &days
	}

	return &EnrollmentDetailResponse{
		EnrollmentResponse: EnrollmentToResponse(enrollment),
		CancellationReason: enrollment.CancellationReason,
		DaysEnrolled:       daysEnrolled,
		DaysUntilExpiry:    daysUntilExpiry,
	}
}

// EnrollmentRequestToResponse converts an EnrollmentRequest entity to EnrollmentRequestResponse
func EnrollmentRequestToResponse(request *EnrollmentRequest) *EnrollmentRequestResponse {
	return &EnrollmentRequestResponse{
		ID:              request.ID,
		TenantID:        request.TenantID,
		UserID:          request.UserID,
		CourseID:        request.CourseID,
		Status:          request.Status,
		RequestMessage:  request.RequestMessage,
		ReviewedBy:      request.ReviewedBy,
		RejectionReason: request.RejectionReason,
		RequestedAt:     request.RequestedAt,
		ReviewedAt:      request.ReviewedAt,
		CreatedAt:       request.CreatedAt,
		UpdatedAt:       request.UpdatedAt,
	}
}

// EnrollmentsToListResponse converts a slice of enrollments to ListEnrollmentsResponse
func EnrollmentsToListResponse(enrollments []*Enrollment, totalCount, page, pageSize int) *ListEnrollmentsResponse {
	enrollmentResponses := make([]*EnrollmentResponse, len(enrollments))
	for i, enrollment := range enrollments {
		enrollmentResponses[i] = EnrollmentToResponse(enrollment)
	}

	totalPages := (totalCount + pageSize - 1) / pageSize

	return &ListEnrollmentsResponse{
		Enrollments: enrollmentResponses,
		TotalCount:  totalCount,
		Page:        page,
		PageSize:    pageSize,
		TotalPages:  totalPages,
	}
}

// EnrollmentRequestsToListResponse converts a slice of enrollment requests to ListEnrollmentRequestsResponse
func EnrollmentRequestsToListResponse(requests []*EnrollmentRequest, totalCount, page, pageSize int) *ListEnrollmentRequestsResponse {
	requestResponses := make([]*EnrollmentRequestResponse, len(requests))
	for i, request := range requests {
		requestResponses[i] = EnrollmentRequestToResponse(request)
	}

	totalPages := (totalCount + pageSize - 1) / pageSize

	return &ListEnrollmentRequestsResponse{
		Requests:   requestResponses,
		TotalCount: totalCount,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}
}
