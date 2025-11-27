package domain

import "errors"

// ============================================================================
// Validation Errors
// ============================================================================

var (
	// ErrInvalidDateRange indicates that the date range is invalid
	ErrInvalidDateRange = errors.New("invalid date range: start date must be before end date")

	// ErrInvalidPeriod indicates that the period is invalid
	ErrInvalidPeriod = errors.New("invalid period: must be 'day', 'week', 'month', or 'year'")

	// ErrInvalidCourseID indicates that the course ID is invalid
	ErrInvalidCourseID = errors.New("invalid course ID")

	// ErrInvalidStudentID indicates that the student ID is invalid
	ErrInvalidStudentID = errors.New("invalid student ID")

	// ErrInvalidInstructorID indicates that the instructor ID is invalid
	ErrInvalidInstructorID = errors.New("invalid instructor ID")

	// ErrInvalidMetric indicates that the metric is invalid
	ErrInvalidMetric = errors.New("invalid metric")

	// ErrInvalidExportType indicates that the export type is invalid
	ErrInvalidExportType = errors.New("invalid export type: must be 'csv', 'excel', or 'pdf'")

	// ErrInvalidQuizID indicates that the quiz ID is invalid
	ErrInvalidQuizID = errors.New("invalid quiz ID")

	// ErrInvalidAssignmentID indicates that the assignment ID is invalid
	ErrInvalidAssignmentID = errors.New("invalid assignment ID")

	// ErrInvalidLessonID indicates that the lesson ID is invalid
	ErrInvalidLessonID = errors.New("invalid lesson ID")
)

// ============================================================================
// Data Errors
// ============================================================================

var (
	// ErrNoDataAvailable indicates that no data is available for the requested analytics
	ErrNoDataAvailable = errors.New("no data available for the requested period")

	// ErrInsufficientData indicates that there is insufficient data to generate analytics
	ErrInsufficientData = errors.New("insufficient data to generate meaningful analytics")

	// ErrDataNotFound indicates that the requested data was not found
	ErrDataNotFound = errors.New("analytics data not found")
)

// ============================================================================
// Permission Errors
// ============================================================================

var (
	// ErrUnauthorizedAccess indicates that the user is not authorized to access the analytics
	ErrUnauthorizedAccess = errors.New("unauthorized access to analytics")

	// ErrInsufficientPermissions indicates that the user has insufficient permissions
	ErrInsufficientPermissions = errors.New("insufficient permissions to access this data")
)

// ============================================================================
// Export Errors
// ============================================================================

var (
	// ErrExportFailed indicates that the export operation failed
	ErrExportFailed = errors.New("failed to export analytics data")

	// ErrExportTooLarge indicates that the export data is too large
	ErrExportTooLarge = errors.New("export data too large: please narrow down your date range")

	// ErrUnsupportedFormat indicates that the export format is not supported
	ErrUnsupportedFormat = errors.New("unsupported export format")
)
