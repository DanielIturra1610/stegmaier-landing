package ports

import "errors"

// ============================================================
// Enrollment Errors
// ============================================================

var (
	// ErrEnrollmentNotFound is returned when an enrollment is not found
	ErrEnrollmentNotFound = errors.New("enrollment not found")

	// ErrEnrollmentAlreadyExists is returned when trying to create a duplicate enrollment
	ErrEnrollmentAlreadyExists = errors.New("enrollment already exists")

	// ErrEnrollmentCreationFailed is returned when enrollment creation fails
	ErrEnrollmentCreationFailed = errors.New("failed to create enrollment")

	// ErrEnrollmentUpdateFailed is returned when enrollment update fails
	ErrEnrollmentUpdateFailed = errors.New("failed to update enrollment")

	// ErrEnrollmentDeletionFailed is returned when enrollment deletion fails
	ErrEnrollmentDeletionFailed = errors.New("failed to delete enrollment")

	// ErrInvalidEnrollmentData is returned when enrollment data is invalid
	ErrInvalidEnrollmentData = errors.New("invalid enrollment data")

	// ErrInvalidEnrollmentStatus is returned when enrollment status is invalid
	ErrInvalidEnrollmentStatus = errors.New("invalid enrollment status")
)

// ============================================================
// Enrollment Request Errors
// ============================================================

var (
	// ErrEnrollmentRequestNotFound is returned when an enrollment request is not found
	ErrEnrollmentRequestNotFound = errors.New("enrollment request not found")

	// ErrEnrollmentRequestAlreadyExists is returned when trying to create a duplicate enrollment request
	ErrEnrollmentRequestAlreadyExists = errors.New("enrollment request already exists")

	// ErrEnrollmentRequestCreationFailed is returned when enrollment request creation fails
	ErrEnrollmentRequestCreationFailed = errors.New("failed to create enrollment request")

	// ErrEnrollmentRequestUpdateFailed is returned when enrollment request update fails
	ErrEnrollmentRequestUpdateFailed = errors.New("failed to update enrollment request")

	// ErrEnrollmentRequestAlreadyReviewed is returned when trying to review an already reviewed request
	ErrEnrollmentRequestAlreadyReviewed = errors.New("enrollment request already reviewed")

	// ErrInvalidEnrollmentRequestStatus is returned when enrollment request status is invalid
	ErrInvalidEnrollmentRequestStatus = errors.New("invalid enrollment request status")
)

// ============================================================
// Enrollment Business Logic Errors
// ============================================================

var (
	// ErrAlreadyEnrolled is returned when user is already enrolled in a course
	ErrAlreadyEnrolled = errors.New("user is already enrolled in this course")

	// ErrEnrollmentExpired is returned when enrollment has expired
	ErrEnrollmentExpired = errors.New("enrollment has expired")

	// ErrEnrollmentNotActive is returned when enrollment is not active
	ErrEnrollmentNotActive = errors.New("enrollment is not active")

	// ErrEnrollmentAlreadyCompleted is returned when trying to modify a completed enrollment
	ErrEnrollmentAlreadyCompleted = errors.New("enrollment is already completed")

	// ErrEnrollmentCancelled is returned when enrollment is cancelled
	ErrEnrollmentCancelled = errors.New("enrollment is cancelled")

	// ErrCannotAccessCourse is returned when user cannot access the course
	ErrCannotAccessCourse = errors.New("cannot access course with current enrollment status")

	// ErrCourseNotFound is returned when course is not found
	ErrCourseNotFound = errors.New("course not found")

	// ErrCourseNotPublished is returned when course is not published
	ErrCourseNotPublished = errors.New("course is not published")

	// ErrCourseNotEnrollable is returned when course cannot be enrolled
	ErrCourseNotEnrollable = errors.New("course is not available for enrollment")

	// ErrRequiresApproval is returned when course requires approval for enrollment
	ErrRequiresApproval = errors.New("course requires approval for enrollment")
)

// ============================================================
// Enrollment Permission Errors
// ============================================================

var (
	// ErrNotEnrolled is returned when user is not enrolled in a course
	ErrNotEnrolled = errors.New("user is not enrolled in this course")

	// ErrNotCourseInstructor is returned when user is not the course instructor
	ErrNotCourseInstructor = errors.New("user is not the instructor of this course")

	// ErrUnauthorizedAccess is returned when user doesn't have permission
	ErrUnauthorizedAccess = errors.New("unauthorized access to enrollment")

	// ErrInsufficientPermissions is returned when user doesn't have required permissions
	ErrInsufficientPermissions = errors.New("insufficient permissions for this action")
)

// ============================================================
// Validation Errors
// ============================================================

var (
	// ErrInvalidUserID is returned when user ID is invalid
	ErrInvalidUserID = errors.New("invalid user ID")

	// ErrInvalidCourseID is returned when course ID is invalid
	ErrInvalidCourseID = errors.New("invalid course ID")

	// ErrInvalidEnrollmentID is returned when enrollment ID is invalid
	ErrInvalidEnrollmentID = errors.New("invalid enrollment ID")

	// ErrInvalidRequestID is returned when enrollment request ID is invalid
	ErrInvalidRequestID = errors.New("invalid enrollment request ID")

	// ErrInvalidProgress is returned when progress percentage is invalid
	ErrInvalidProgress = errors.New("invalid progress percentage (must be 0-100)")

	// ErrInvalidExpirationDate is returned when expiration date is invalid
	ErrInvalidExpirationDate = errors.New("invalid expiration date")

	// ErrExpirationDateInPast is returned when expiration date is in the past
	ErrExpirationDateInPast = errors.New("expiration date must be in the future")

	// ErrMissingRejectionReason is returned when rejection reason is missing
	ErrMissingRejectionReason = errors.New("rejection reason is required")

	// ErrInvalidRejectionReason is returned when rejection reason is invalid
	ErrInvalidRejectionReason = errors.New("rejection reason must be at least 5 characters")
)

// ============================================================
// Statistics Errors
// ============================================================

var (
	// ErrStatisticsFailed is returned when retrieving statistics fails
	ErrStatisticsFailed = errors.New("failed to retrieve enrollment statistics")

	// ErrNoEnrollments is returned when no enrollments found
	ErrNoEnrollments = errors.New("no enrollments found")
)
