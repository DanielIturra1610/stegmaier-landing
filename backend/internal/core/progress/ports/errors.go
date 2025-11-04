package ports

import "errors"

// ============================================================
// Course Progress Errors
// ============================================================

var (
	// ErrProgressNotFound is returned when course progress is not found
	ErrProgressNotFound = errors.New("course progress not found")

	// ErrProgressAlreadyExists is returned when trying to create duplicate progress
	ErrProgressAlreadyExists = errors.New("course progress already exists")

	// ErrProgressCreationFailed is returned when progress creation fails
	ErrProgressCreationFailed = errors.New("failed to create course progress")

	// ErrProgressUpdateFailed is returned when progress update fails
	ErrProgressUpdateFailed = errors.New("failed to update course progress")

	// ErrProgressDeletionFailed is returned when progress deletion fails
	ErrProgressDeletionFailed = errors.New("failed to delete course progress")

	// ErrInvalidProgressData is returned when progress data is invalid
	ErrInvalidProgressData = errors.New("invalid course progress data")

	// ErrInvalidProgressStatus is returned when progress status is invalid
	ErrInvalidProgressStatus = errors.New("invalid progress status")

	// ErrProgressAlreadyCompleted is returned when trying to modify completed progress
	ErrProgressAlreadyCompleted = errors.New("course progress is already completed")

	// ErrProgressNotStarted is returned when progress has not been started
	ErrProgressNotStarted = errors.New("course progress has not been started")

	// ErrCannotCompleteProgress is returned when progress cannot be completed
	ErrCannotCompleteProgress = errors.New("cannot complete progress: requirements not met")
)

// ============================================================
// Progress Snapshot Errors
// ============================================================

var (
	// ErrSnapshotNotFound is returned when progress snapshot is not found
	ErrSnapshotNotFound = errors.New("progress snapshot not found")

	// ErrSnapshotCreationFailed is returned when snapshot creation fails
	ErrSnapshotCreationFailed = errors.New("failed to create progress snapshot")

	// ErrSnapshotDeletionFailed is returned when snapshot deletion fails
	ErrSnapshotDeletionFailed = errors.New("failed to delete progress snapshot")

	// ErrInvalidSnapshotData is returned when snapshot data is invalid
	ErrInvalidSnapshotData = errors.New("invalid progress snapshot data")

	// ErrInvalidMilestoneType is returned when milestone type is invalid
	ErrInvalidMilestoneType = errors.New("invalid milestone type")
)

// ============================================================
// Progress Tracking Errors
// ============================================================

var (
	// ErrInvalidCompletionData is returned when completion data is invalid
	ErrInvalidCompletionData = errors.New("invalid completion data")

	// ErrInvalidTimeSpent is returned when time spent is invalid
	ErrInvalidTimeSpent = errors.New("invalid time spent value")

	// ErrInvalidProgressPercentage is returned when progress percentage is invalid
	ErrInvalidProgressPercentage = errors.New("invalid progress percentage (must be 0-100)")

	// ErrLessonNotCompleted is returned when lesson is not completed
	ErrLessonNotCompleted = errors.New("lesson is not completed")

	// ErrQuizNotCompleted is returned when quiz is not completed
	ErrQuizNotCompleted = errors.New("quiz is not completed")

	// ErrProgressCalculationFailed is returned when progress calculation fails
	ErrProgressCalculationFailed = errors.New("failed to calculate progress")
)

// ============================================================
// Progress Permission Errors
// ============================================================

var (
	// ErrUnauthorizedAccess is returned when user doesn't have permission
	ErrUnauthorizedAccess = errors.New("unauthorized access to progress")

	// ErrInsufficientPermissions is returned when user doesn't have required permissions
	ErrInsufficientPermissions = errors.New("insufficient permissions for this action")

	// ErrNotEnrolled is returned when user is not enrolled in the course
	ErrNotEnrolled = errors.New("user is not enrolled in this course")
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

	// ErrInvalidLessonID is returned when lesson ID is invalid
	ErrInvalidLessonID = errors.New("invalid lesson ID")

	// ErrInvalidQuizID is returned when quiz ID is invalid
	ErrInvalidQuizID = errors.New("invalid quiz ID")

	// ErrInvalidDateRange is returned when date range is invalid
	ErrInvalidDateRange = errors.New("invalid date range")

	// ErrInvalidPageParameters is returned when page parameters are invalid
	ErrInvalidPageParameters = errors.New("invalid page parameters")
)

// ============================================================
// Statistics Errors
// ============================================================

var (
	// ErrStatisticsFailed is returned when retrieving statistics fails
	ErrStatisticsFailed = errors.New("failed to retrieve progress statistics")

	// ErrNoProgressData is returned when no progress data is found
	ErrNoProgressData = errors.New("no progress data found")

	// ErrInsufficientData is returned when there is insufficient data for statistics
	ErrInsufficientData = errors.New("insufficient data for statistics")
)

// ============================================================
// Course/Enrollment Errors
// ============================================================

var (
	// ErrCourseNotFound is returned when course is not found
	ErrCourseNotFound = errors.New("course not found")

	// ErrEnrollmentNotFound is returned when enrollment is not found
	ErrEnrollmentNotFound = errors.New("enrollment not found")

	// ErrEnrollmentNotActive is returned when enrollment is not active
	ErrEnrollmentNotActive = errors.New("enrollment is not active")

	// ErrCourseNotPublished is returned when course is not published
	ErrCourseNotPublished = errors.New("course is not published")

	// ErrCourseHasNoContent is returned when course has no lessons or quizzes
	ErrCourseHasNoContent = errors.New("course has no content")
)
