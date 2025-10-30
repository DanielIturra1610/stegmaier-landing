package utils

import "fmt"

// AppError represents a custom application error with a code and message
type AppError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Err     error  `json:"-"` // Internal error, not exposed to client
}

// Error implements the error interface
func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %s (%v)", e.Code, e.Message, e.Err)
	}
	return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

// Unwrap returns the wrapped error
func (e *AppError) Unwrap() error {
	return e.Err
}

// NewAppError creates a new application error
func NewAppError(code, message string, err error) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		Err:     err,
	}
}

// Common error codes
const (
	ErrCodeNotFound          = "NOT_FOUND"
	ErrCodeUnauthorized      = "UNAUTHORIZED"
	ErrCodeForbidden         = "FORBIDDEN"
	ErrCodeBadRequest        = "BAD_REQUEST"
	ErrCodeConflict          = "CONFLICT"
	ErrCodeInternalError     = "INTERNAL_ERROR"
	ErrCodeValidationError   = "VALIDATION_ERROR"
	ErrCodeDatabaseError     = "DATABASE_ERROR"
	ErrCodeTokenExpired      = "TOKEN_EXPIRED"
	ErrCodeInvalidToken      = "INVALID_TOKEN"
	ErrCodeUserAlreadyExists = "USER_ALREADY_EXISTS"
	ErrCodeUserNotFound      = "USER_NOT_FOUND"
	ErrCodeInvalidCredentials = "INVALID_CREDENTIALS"
	ErrCodeEmailNotVerified  = "EMAIL_NOT_VERIFIED"
	ErrCodeTenantNotFound    = "TENANT_NOT_FOUND"
	ErrCodeCourseNotFound    = "COURSE_NOT_FOUND"
	ErrCodeLessonNotFound    = "LESSON_NOT_FOUND"
	ErrCodeNotEnrolled       = "NOT_ENROLLED"
)

// Predefined errors
var (
	ErrNotFound = &AppError{
		Code:    ErrCodeNotFound,
		Message: "Resource not found",
	}

	ErrUnauthorized = &AppError{
		Code:    ErrCodeUnauthorized,
		Message: "Unauthorized access",
	}

	ErrForbidden = &AppError{
		Code:    ErrCodeForbidden,
		Message: "Access forbidden",
	}

	ErrBadRequest = &AppError{
		Code:    ErrCodeBadRequest,
		Message: "Bad request",
	}

	ErrConflict = &AppError{
		Code:    ErrCodeConflict,
		Message: "Resource conflict",
	}

	ErrInternalError = &AppError{
		Code:    ErrCodeInternalError,
		Message: "Internal server error",
	}

	ErrValidationFailed = &AppError{
		Code:    ErrCodeValidationError,
		Message: "Validation failed",
	}

	ErrDatabaseError = &AppError{
		Code:    ErrCodeDatabaseError,
		Message: "Database error",
	}

	ErrTokenExpired = &AppError{
		Code:    ErrCodeTokenExpired,
		Message: "Token has expired",
	}

	ErrInvalidToken = &AppError{
		Code:    ErrCodeInvalidToken,
		Message: "Invalid token",
	}

	ErrUserAlreadyExists = &AppError{
		Code:    ErrCodeUserAlreadyExists,
		Message: "User already exists",
	}

	ErrUserNotFound = &AppError{
		Code:    ErrCodeUserNotFound,
		Message: "User not found",
	}

	ErrInvalidCredentials = &AppError{
		Code:    ErrCodeInvalidCredentials,
		Message: "Invalid credentials",
	}

	ErrEmailNotVerified = &AppError{
		Code:    ErrCodeEmailNotVerified,
		Message: "Email not verified",
	}

	ErrTenantNotFound = &AppError{
		Code:    ErrCodeTenantNotFound,
		Message: "Tenant not found",
	}

	ErrCourseNotFound = &AppError{
		Code:    ErrCodeCourseNotFound,
		Message: "Course not found",
	}

	ErrLessonNotFound = &AppError{
		Code:    ErrCodeLessonNotFound,
		Message: "Lesson not found",
	}

	ErrNotEnrolled = &AppError{
		Code:    ErrCodeNotEnrolled,
		Message: "User not enrolled in course",
	}
)

// IsAppError checks if an error is an AppError
func IsAppError(err error) bool {
	_, ok := err.(*AppError)
	return ok
}

// GetAppError converts an error to AppError if possible
func GetAppError(err error) (*AppError, bool) {
	appErr, ok := err.(*AppError)
	return appErr, ok
}

// WrapError wraps a standard error into an AppError
func WrapError(code, message string, err error) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		Err:     err,
	}
}
