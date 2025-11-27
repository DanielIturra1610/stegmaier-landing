package domain

import (
	"time"

	"github.com/google/uuid"
)

// ============================================================
// Enums and Constants
// ============================================================

// EnrollmentStatus represents the status of an enrollment
type EnrollmentStatus string

const (
	EnrollmentStatusPending   EnrollmentStatus = "pending"   // Awaiting approval
	EnrollmentStatusActive    EnrollmentStatus = "active"    // Currently enrolled
	EnrollmentStatusCompleted EnrollmentStatus = "completed" // Course completed
	EnrollmentStatusExpired   EnrollmentStatus = "expired"   // Enrollment expired
	EnrollmentStatusCancelled EnrollmentStatus = "cancelled" // Enrollment cancelled
)

// EnrollmentRequestStatus represents the status of an enrollment request
type EnrollmentRequestStatus string

const (
	EnrollmentRequestStatusPending  EnrollmentRequestStatus = "pending"  // Awaiting review
	EnrollmentRequestStatusApproved EnrollmentRequestStatus = "approved" // Request approved
	EnrollmentRequestStatusRejected EnrollmentRequestStatus = "rejected" // Request rejected
)

// ============================================================
// Entities
// ============================================================

// Enrollment represents a student enrollment in a course
type Enrollment struct {
	ID                 uuid.UUID        `json:"id"`
	TenantID           uuid.UUID        `json:"tenantId"`
	UserID             uuid.UUID        `json:"userId"`              // Student ID
	CourseID           uuid.UUID        `json:"courseId"`
	Status             EnrollmentStatus `json:"status"`
	ProgressPercentage int              `json:"progressPercentage"`  // 0-100
	EnrolledAt         time.Time        `json:"enrolledAt"`
	StartedAt          *time.Time       `json:"startedAt,omitempty"` // When student first accessed course content
	CompletedAt        *time.Time       `json:"completedAt,omitempty"`
	ExpiresAt          *time.Time       `json:"expiresAt,omitempty"` // For time-limited courses
	LastAccessedAt     *time.Time       `json:"lastAccessedAt,omitempty"`
	CertificateID      *uuid.UUID       `json:"certificateId,omitempty"` // Generated when completed
	CancellationReason *string          `json:"cancellationReason,omitempty"`
	CreatedAt          time.Time        `json:"createdAt"`
	UpdatedAt          time.Time        `json:"updatedAt"`
}

// EnrollmentRequest represents a request to enroll in a course requiring approval
type EnrollmentRequest struct {
	ID               uuid.UUID               `json:"id"`
	TenantID         uuid.UUID               `json:"tenantId"`
	UserID           uuid.UUID               `json:"userId"`     // Student requesting enrollment
	CourseID         uuid.UUID               `json:"courseId"`
	Status           EnrollmentRequestStatus `json:"status"`
	RequestMessage   *string                 `json:"requestMessage,omitempty"`   // Optional message from student
	ReviewedBy       *uuid.UUID              `json:"reviewedBy,omitempty"`       // Instructor/Admin who reviewed
	RejectionReason  *string                 `json:"rejectionReason,omitempty"`  // Reason if rejected
	RequestedAt      time.Time               `json:"requestedAt"`
	ReviewedAt       *time.Time              `json:"reviewedAt,omitempty"`
	CreatedAt        time.Time               `json:"createdAt"`
	UpdatedAt        time.Time               `json:"updatedAt"`
}

// ============================================================
// Constructors
// ============================================================

// NewEnrollment creates a new enrollment with default values
func NewEnrollment(tenantID, userID, courseID uuid.UUID, expiresAt *time.Time) *Enrollment {
	now := time.Now().UTC()
	return &Enrollment{
		ID:                 uuid.New(),
		TenantID:           tenantID,
		UserID:             userID,
		CourseID:           courseID,
		Status:             EnrollmentStatusActive,
		ProgressPercentage: 0,
		EnrolledAt:         now,
		StartedAt:          nil,
		CompletedAt:        nil,
		ExpiresAt:          expiresAt,
		LastAccessedAt:     nil,
		CertificateID:      nil,
		CancellationReason: nil,
		CreatedAt:          now,
		UpdatedAt:          now,
	}
}

// NewEnrollmentRequest creates a new enrollment request
func NewEnrollmentRequest(tenantID, userID, courseID uuid.UUID, requestMessage *string) *EnrollmentRequest {
	now := time.Now().UTC()
	return &EnrollmentRequest{
		ID:              uuid.New(),
		TenantID:        tenantID,
		UserID:          userID,
		CourseID:        courseID,
		Status:          EnrollmentRequestStatusPending,
		RequestMessage:  requestMessage,
		ReviewedBy:      nil,
		RejectionReason: nil,
		RequestedAt:     now,
		ReviewedAt:      nil,
		CreatedAt:       now,
		UpdatedAt:       now,
	}
}

// ============================================================
// Enrollment Methods
// ============================================================

// UpdateTimestamp updates the UpdatedAt field to current time
func (e *Enrollment) UpdateTimestamp() {
	e.UpdatedAt = time.Now().UTC()
}

// MarkAsStarted marks the enrollment as started (first access)
func (e *Enrollment) MarkAsStarted() {
	if e.StartedAt == nil {
		now := time.Now().UTC()
		e.StartedAt = &now
		e.UpdateTimestamp()
	}
}

// UpdateLastAccessed updates the last accessed timestamp
func (e *Enrollment) UpdateLastAccessed() {
	now := time.Now().UTC()
	e.LastAccessedAt = &now
	e.UpdateTimestamp()
}

// UpdateProgress updates the progress percentage
func (e *Enrollment) UpdateProgress(percentage int) {
	if percentage < 0 {
		percentage = 0
	}
	if percentage > 100 {
		percentage = 100
	}
	e.ProgressPercentage = percentage
	e.UpdateTimestamp()
}

// MarkAsCompleted marks the enrollment as completed
func (e *Enrollment) MarkAsCompleted(certificateID *uuid.UUID) {
	now := time.Now().UTC()
	e.Status = EnrollmentStatusCompleted
	e.CompletedAt = &now
	e.ProgressPercentage = 100
	e.CertificateID = certificateID
	e.UpdateTimestamp()
}

// Cancel cancels the enrollment
func (e *Enrollment) Cancel(reason *string) {
	e.Status = EnrollmentStatusCancelled
	e.CancellationReason = reason
	e.UpdateTimestamp()
}

// MarkAsExpired marks the enrollment as expired
func (e *Enrollment) MarkAsExpired() {
	e.Status = EnrollmentStatusExpired
	e.UpdateTimestamp()
}

// ExtendExpiration extends the expiration date
func (e *Enrollment) ExtendExpiration(newExpiresAt time.Time) {
	e.ExpiresAt = &newExpiresAt
	if e.Status == EnrollmentStatusExpired {
		e.Status = EnrollmentStatusActive
	}
	e.UpdateTimestamp()
}

// IsActive returns true if the enrollment is active
func (e *Enrollment) IsActive() bool {
	return e.Status == EnrollmentStatusActive
}

// IsCompleted returns true if the enrollment is completed
func (e *Enrollment) IsCompleted() bool {
	return e.Status == EnrollmentStatusCompleted
}

// IsExpired returns true if the enrollment is expired
func (e *Enrollment) IsExpired() bool {
	if e.Status == EnrollmentStatusExpired {
		return true
	}
	if e.ExpiresAt != nil && time.Now().UTC().After(*e.ExpiresAt) {
		return true
	}
	return false
}

// CanAccess returns true if the student can access the course
func (e *Enrollment) CanAccess() bool {
	return (e.Status == EnrollmentStatusActive || e.Status == EnrollmentStatusCompleted) && !e.IsExpired()
}

// ============================================================
// EnrollmentRequest Methods
// ============================================================

// UpdateTimestamp updates the UpdatedAt field to current time
func (er *EnrollmentRequest) UpdateTimestamp() {
	er.UpdatedAt = time.Now().UTC()
}

// Approve approves the enrollment request
func (er *EnrollmentRequest) Approve(reviewerID uuid.UUID) {
	now := time.Now().UTC()
	er.Status = EnrollmentRequestStatusApproved
	er.ReviewedBy = &reviewerID
	er.ReviewedAt = &now
	er.UpdateTimestamp()
}

// Reject rejects the enrollment request
func (er *EnrollmentRequest) Reject(reviewerID uuid.UUID, reason string) {
	now := time.Now().UTC()
	er.Status = EnrollmentRequestStatusRejected
	er.ReviewedBy = &reviewerID
	er.RejectionReason = &reason
	er.ReviewedAt = &now
	er.UpdateTimestamp()
}

// IsPending returns true if the request is pending
func (er *EnrollmentRequest) IsPending() bool {
	return er.Status == EnrollmentRequestStatusPending
}

// IsApproved returns true if the request is approved
func (er *EnrollmentRequest) IsApproved() bool {
	return er.Status == EnrollmentRequestStatusApproved
}

// IsRejected returns true if the request is rejected
func (er *EnrollmentRequest) IsRejected() bool {
	return er.Status == EnrollmentRequestStatusRejected
}

// ============================================================
// Validation Functions
// ============================================================

// ValidateEnrollmentStatus validates an enrollment status
func ValidateEnrollmentStatus(status EnrollmentStatus) bool {
	switch status {
	case EnrollmentStatusPending,
		EnrollmentStatusActive,
		EnrollmentStatusCompleted,
		EnrollmentStatusExpired,
		EnrollmentStatusCancelled:
		return true
	default:
		return false
	}
}

// ValidateEnrollmentRequestStatus validates an enrollment request status
func ValidateEnrollmentRequestStatus(status EnrollmentRequestStatus) bool {
	switch status {
	case EnrollmentRequestStatusPending,
		EnrollmentRequestStatusApproved,
		EnrollmentRequestStatusRejected:
		return true
	default:
		return false
	}
}
