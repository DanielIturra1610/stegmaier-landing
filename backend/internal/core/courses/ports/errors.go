package ports

import (
	"errors"
	"fmt"
)

// Repository errors - Course
var (
	// ErrCourseNotFound is returned when a course is not found
	ErrCourseNotFound = errors.New("course not found")

	// ErrCourseAlreadyExists is returned when trying to create a course that already exists
	ErrCourseAlreadyExists = errors.New("course already exists")

	// ErrCourseSlugExists is returned when a course slug is already in use
	ErrCourseSlugExists = errors.New("course slug already exists")

	// ErrCourseDeleted is returned when trying to access a soft-deleted course
	ErrCourseDeleted = errors.New("course has been deleted")

	// ErrCourseNotPublished is returned when trying to enroll in an unpublished course
	ErrCourseNotPublished = errors.New("course is not published")

	// ErrCourseArchived is returned when trying to access an archived course
	ErrCourseArchived = errors.New("course is archived")
)

// Repository errors - Category
var (
	// ErrCategoryNotFound is returned when a category is not found
	ErrCategoryNotFound = errors.New("category not found")

	// ErrCategoryAlreadyExists is returned when trying to create a category that already exists
	ErrCategoryAlreadyExists = errors.New("category already exists")

	// ErrCategorySlugExists is returned when a category slug is already in use
	ErrCategorySlugExists = errors.New("category slug already exists")

	// ErrCategoryHasCourses is returned when trying to delete a category with courses
	ErrCategoryHasCourses = errors.New("category has associated courses")

	// ErrCategoryInactive is returned when trying to use an inactive category
	ErrCategoryInactive = errors.New("category is inactive")

	// ErrInvalidParentCategory is returned when parent category is invalid
	ErrInvalidParentCategory = errors.New("invalid parent category")

	// ErrCircularCategoryReference is returned when category hierarchy creates a cycle
	ErrCircularCategoryReference = errors.New("circular category reference detected")
)

// Repository errors - General
var (
	// ErrDatabaseError is returned for generic database errors
	ErrDatabaseError = errors.New("database error occurred")

	// ErrTransactionFailed is returned when a database transaction fails
	ErrTransactionFailed = errors.New("database transaction failed")

	// ErrQueryFailed is returned when a database query fails
	ErrQueryFailed = errors.New("database query failed")
)

// Service errors - Course
var (
	// ErrInvalidCourseData is returned when course data is invalid
	ErrInvalidCourseData = errors.New("invalid course data")

	// ErrCourseNotEnrollable is returned when a course cannot be enrolled
	ErrCourseNotEnrollable = errors.New("course cannot be enrolled")

	// ErrCourseUpdateFailed is returned when course update fails
	ErrCourseUpdateFailed = errors.New("failed to update course")

	// ErrCoursePublishFailed is returned when course publish fails
	ErrCoursePublishFailed = errors.New("failed to publish course")

	// ErrCourseUnpublishFailed is returned when course unpublish fails
	ErrCourseUnpublishFailed = errors.New("failed to unpublish course")

	// ErrCourseArchiveFailed is returned when course archive fails
	ErrCourseArchiveFailed = errors.New("failed to archive course")

	// ErrCourseDeleteFailed is returned when course deletion fails
	ErrCourseDeleteFailed = errors.New("failed to delete course")

	// ErrInvalidInstructor is returned when instructor is invalid
	ErrInvalidInstructor = errors.New("invalid instructor")

	// ErrInvalidCategory is returned when category is invalid
	ErrInvalidCategory = errors.New("invalid category")
)

// Service errors - Category
var (
	// ErrInvalidCategoryData is returned when category data is invalid
	ErrInvalidCategoryData = errors.New("invalid category data")

	// ErrCategoryUpdateFailed is returned when category update fails
	ErrCategoryUpdateFailed = errors.New("failed to update category")

	// ErrCategoryDeleteFailed is returned when category deletion fails
	ErrCategoryDeleteFailed = errors.New("failed to delete category")
)

// Service errors - Enrollment
var (
	// ErrAlreadyEnrolled is returned when user is already enrolled in a course
	ErrAlreadyEnrolled = errors.New("user is already enrolled in this course")

	// ErrNotEnrolled is returned when user is not enrolled in a course
	ErrNotEnrolled = errors.New("user is not enrolled in this course")

	// ErrEnrollmentFailed is returned when enrollment fails
	ErrEnrollmentFailed = errors.New("failed to enroll in course")

	// ErrUnenrollmentFailed is returned when unenrollment fails
	ErrUnenrollmentFailed = errors.New("failed to unenroll from course")

	// ErrEnrollmentLimitReached is returned when course enrollment limit is reached
	ErrEnrollmentLimitReached = errors.New("course enrollment limit reached")
)

// Service errors - Rating
var (
	// ErrInvalidRating is returned when rating value is invalid
	ErrInvalidRating = errors.New("invalid rating value")

	// ErrRatingFailed is returned when rating operation fails
	ErrRatingFailed = errors.New("failed to rate course")

	// ErrCannotRateOwnCourse is returned when instructor tries to rate their own course
	ErrCannotRateOwnCourse = errors.New("cannot rate your own course")

	// ErrMustBeEnrolledToRate is returned when non-enrolled user tries to rate
	ErrMustBeEnrolledToRate = errors.New("must be enrolled to rate course")
)

// Service errors - Authorization
var (
	// ErrUnauthorized is returned when user is not authorized for an action
	ErrUnauthorized = errors.New("unauthorized access")

	// ErrNotCourseOwner is returned when user is not the course owner
	ErrNotCourseOwner = errors.New("user is not the course owner")

	// ErrInsufficientPermissions is returned when user lacks required permissions
	ErrInsufficientPermissions = errors.New("insufficient permissions")
)

// Service errors - Validation
var (
	// ErrInvalidInput is returned when input validation fails
	ErrInvalidInput = errors.New("invalid input")

	// ErrInvalidPagination is returned when pagination parameters are invalid
	ErrInvalidPagination = errors.New("invalid pagination parameters")

	// ErrInvalidFilter is returned when filter parameters are invalid
	ErrInvalidFilter = errors.New("invalid filter parameters")

	// ErrInvalidSortOrder is returned when sort order is invalid
	ErrInvalidSortOrder = errors.New("invalid sort order")
)

// CourseError wraps an error with additional context
type CourseError struct {
	Op  string // Operation that failed
	Err error  // Underlying error
	Msg string // Additional message
}

// Error implements the error interface
func (e *CourseError) Error() string {
	if e.Msg != "" {
		return fmt.Sprintf("%s: %s: %v", e.Op, e.Msg, e.Err)
	}
	return fmt.Sprintf("%s: %v", e.Op, e.Err)
}

// Unwrap returns the underlying error
func (e *CourseError) Unwrap() error {
	return e.Err
}

// NewCourseError creates a new CourseError
func NewCourseError(op string, err error, msg string) *CourseError {
	return &CourseError{
		Op:  op,
		Err: err,
		Msg: msg,
	}
}

// IsNotFoundError checks if an error is a not found error
func IsNotFoundError(err error) bool {
	return errors.Is(err, ErrCourseNotFound) ||
		errors.Is(err, ErrCategoryNotFound)
}

// IsAlreadyExistsError checks if an error is an already exists error
func IsAlreadyExistsError(err error) bool {
	return errors.Is(err, ErrCourseAlreadyExists) ||
		errors.Is(err, ErrCourseSlugExists) ||
		errors.Is(err, ErrCategoryAlreadyExists) ||
		errors.Is(err, ErrCategorySlugExists) ||
		errors.Is(err, ErrAlreadyEnrolled)
}

// IsValidationError checks if an error is a validation error
func IsValidationError(err error) bool {
	return errors.Is(err, ErrInvalidInput) ||
		errors.Is(err, ErrInvalidCourseData) ||
		errors.Is(err, ErrInvalidCategoryData) ||
		errors.Is(err, ErrInvalidRating) ||
		errors.Is(err, ErrInvalidPagination) ||
		errors.Is(err, ErrInvalidFilter) ||
		errors.Is(err, ErrInvalidSortOrder)
}

// IsUnauthorizedError checks if an error is an unauthorized error
func IsUnauthorizedError(err error) bool {
	return errors.Is(err, ErrUnauthorized) ||
		errors.Is(err, ErrNotCourseOwner) ||
		errors.Is(err, ErrInsufficientPermissions)
}

// IsBusinessRuleError checks if an error is a business rule violation
func IsBusinessRuleError(err error) bool {
	return errors.Is(err, ErrCourseNotEnrollable) ||
		errors.Is(err, ErrCourseNotPublished) ||
		errors.Is(err, ErrCourseArchived) ||
		errors.Is(err, ErrCourseDeleted) ||
		errors.Is(err, ErrCategoryHasCourses) ||
		errors.Is(err, ErrCategoryInactive) ||
		errors.Is(err, ErrEnrollmentLimitReached) ||
		errors.Is(err, ErrCannotRateOwnCourse) ||
		errors.Is(err, ErrMustBeEnrolledToRate) ||
		errors.Is(err, ErrNotEnrolled)
}

// IsDatabaseError checks if an error is a database error
func IsDatabaseError(err error) bool {
	return errors.Is(err, ErrDatabaseError) ||
		errors.Is(err, ErrTransactionFailed) ||
		errors.Is(err, ErrQueryFailed)
}

// IsCategoryError checks if an error is related to categories
func IsCategoryError(err error) bool {
	return errors.Is(err, ErrCategoryNotFound) ||
		errors.Is(err, ErrCategoryAlreadyExists) ||
		errors.Is(err, ErrCategorySlugExists) ||
		errors.Is(err, ErrCategoryHasCourses) ||
		errors.Is(err, ErrCategoryInactive) ||
		errors.Is(err, ErrInvalidParentCategory) ||
		errors.Is(err, ErrCircularCategoryReference) ||
		errors.Is(err, ErrInvalidCategoryData) ||
		errors.Is(err, ErrCategoryUpdateFailed) ||
		errors.Is(err, ErrCategoryDeleteFailed)
}

// IsEnrollmentError checks if an error is related to enrollment
func IsEnrollmentError(err error) bool {
	return errors.Is(err, ErrAlreadyEnrolled) ||
		errors.Is(err, ErrNotEnrolled) ||
		errors.Is(err, ErrEnrollmentFailed) ||
		errors.Is(err, ErrUnenrollmentFailed) ||
		errors.Is(err, ErrEnrollmentLimitReached)
}
