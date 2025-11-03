package controllers

import (
	authPorts "github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/ports"
	coursePorts "github.com/DanielIturra1610/stegmaier-landing/internal/core/courses/ports"
	lessonPorts "github.com/DanielIturra1610/stegmaier-landing/internal/core/lessons/ports"
	profilePorts "github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/ports"
	"github.com/gofiber/fiber/v2"
)

// APIResponse represents a standard API response
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// SuccessResponse sends a successful response
func SuccessResponse(c *fiber.Ctx, statusCode int, message string, data interface{}) error {
	return c.Status(statusCode).JSON(APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// ErrorResponse sends an error response
func ErrorResponse(c *fiber.Ctx, statusCode int, message string) error {
	return c.Status(statusCode).JSON(APIResponse{
		Success: false,
		Error:   message,
	})
}

// MapDomainError maps domain errors to HTTP status codes
func MapDomainError(err error) (int, string) {
	switch err {
	// User errors
	case authPorts.ErrUserNotFound:
		return fiber.StatusNotFound, "User not found"
	case authPorts.ErrEmailAlreadyExists:
		return fiber.StatusConflict, "Email already exists"
	case authPorts.ErrUserAlreadyExists:
		return fiber.StatusConflict, "User already exists"

	// Authentication errors
	case authPorts.ErrInvalidCredentials:
		return fiber.StatusUnauthorized, "Invalid email or password"
	case authPorts.ErrAccountNotVerified:
		return fiber.StatusForbidden, "Account not verified. Please check your email"
	case authPorts.ErrAccountLocked:
		return fiber.StatusForbidden, "Account is locked. Please contact support"
	case authPorts.ErrAccountDisabled:
		return fiber.StatusForbidden, "Account is disabled"

	// Token errors
	case authPorts.ErrInvalidToken:
		return fiber.StatusUnauthorized, "Invalid or malformed token"
	case authPorts.ErrTokenExpired:
		return fiber.StatusUnauthorized, "Token has expired"
	case authPorts.ErrTokenRevoked:
		return fiber.StatusUnauthorized, "Token has been revoked"
	case authPorts.ErrTokenNotFound:
		return fiber.StatusNotFound, "Token not found"
	case authPorts.ErrRefreshTokenInvalid:
		return fiber.StatusUnauthorized, "Invalid refresh token"

	// Email verification errors
	case authPorts.ErrVerificationTokenInvalid:
		return fiber.StatusBadRequest, "Invalid verification token"
	case authPorts.ErrVerificationTokenExpired:
		return fiber.StatusBadRequest, "Verification token has expired"
	case authPorts.ErrAlreadyVerified:
		return fiber.StatusBadRequest, "Email already verified"

	// Password errors
	case authPorts.ErrPasswordTooWeak:
		return fiber.StatusBadRequest, "Password doesn't meet security requirements"
	case authPorts.ErrPasswordTooLong:
		return fiber.StatusBadRequest, "Password exceeds maximum length"
	case authPorts.ErrPasswordSameAsOld:
		return fiber.StatusBadRequest, "New password must be different from old password"
	case authPorts.ErrCurrentPasswordIncorrect:
		return fiber.StatusBadRequest, "Current password is incorrect"
	case authPorts.ErrPasswordResetTokenInvalid:
		return fiber.StatusBadRequest, "Invalid password reset token"
	case authPorts.ErrPasswordResetTokenExpired:
		return fiber.StatusBadRequest, "Password reset token has expired"
	case authPorts.ErrPasswordResetTokenUsed:
		return fiber.StatusBadRequest, "Password reset token has already been used"

	// Authorization errors
	case authPorts.ErrUnauthorized:
		return fiber.StatusUnauthorized, "Unauthorized access"
	case authPorts.ErrForbidden:
		return fiber.StatusForbidden, "Forbidden: insufficient permissions"
	case authPorts.ErrInvalidRole:
		return fiber.StatusBadRequest, "Invalid user role"

	// Validation errors
	case authPorts.ErrInvalidEmail:
		return fiber.StatusBadRequest, "Invalid email format"
	case authPorts.ErrInvalidInput:
		return fiber.StatusBadRequest, "Invalid input data"
	case authPorts.ErrMissingRequiredField:
		return fiber.StatusBadRequest, "Missing required field"

	// Tenant errors
	case authPorts.ErrTenantNotFound:
		return fiber.StatusNotFound, "Tenant not found"
	case authPorts.ErrTenantInactive:
		return fiber.StatusForbidden, "Tenant is inactive"
	case authPorts.ErrTenantMismatch:
		return fiber.StatusForbidden, "User does not belong to this tenant"

	// Profile errors
	case profilePorts.ErrProfileNotFound:
		return fiber.StatusNotFound, "Profile not found"
	case profilePorts.ErrInvalidInput:
		return fiber.StatusBadRequest, "Invalid input data"
	case profilePorts.ErrInvalidPassword:
		return fiber.StatusBadRequest, "Invalid password"
	case profilePorts.ErrUnauthorized:
		return fiber.StatusUnauthorized, "Unauthorized access"
	case profilePorts.ErrUpdateFailed:
		return fiber.StatusInternalServerError, "Failed to update profile"
	case profilePorts.ErrInvalidFileFormat:
		return fiber.StatusBadRequest, "Invalid file format. Only JPEG, PNG, and WebP are allowed"
	case profilePorts.ErrFileTooLarge:
		return fiber.StatusBadRequest, "File size exceeds maximum allowed (5MB)"
	case profilePorts.ErrFileUploadFailed:
		return fiber.StatusInternalServerError, "Failed to upload file"
	case profilePorts.ErrFileDeleteFailed:
		return fiber.StatusInternalServerError, "Failed to delete file"

	// Course errors
	case coursePorts.ErrCourseNotFound:
		return fiber.StatusNotFound, "Course not found"
	case coursePorts.ErrCourseAlreadyExists:
		return fiber.StatusConflict, "Course already exists"
	case coursePorts.ErrCourseSlugExists:
		return fiber.StatusConflict, "Course slug already in use"
	case coursePorts.ErrCourseDeleted:
		return fiber.StatusGone, "Course has been deleted"
	case coursePorts.ErrCourseNotPublished:
		return fiber.StatusForbidden, "Course is not published"
	case coursePorts.ErrCourseArchived:
		return fiber.StatusForbidden, "Course is archived"
	case coursePorts.ErrInvalidCourseData:
		return fiber.StatusBadRequest, "Invalid course data"
	case coursePorts.ErrCourseNotEnrollable:
		return fiber.StatusForbidden, "Course cannot be enrolled"
	case coursePorts.ErrCourseUpdateFailed:
		return fiber.StatusInternalServerError, "Failed to update course"
	case coursePorts.ErrInvalidInstructor:
		return fiber.StatusBadRequest, "Invalid instructor"
	case coursePorts.ErrInvalidCategory:
		return fiber.StatusBadRequest, "Invalid category"

	// Category errors
	case coursePorts.ErrCategoryNotFound:
		return fiber.StatusNotFound, "Category not found"
	case coursePorts.ErrCategoryAlreadyExists:
		return fiber.StatusConflict, "Category already exists"
	case coursePorts.ErrCategorySlugExists:
		return fiber.StatusConflict, "Category slug already in use"
	case coursePorts.ErrCategoryHasCourses:
		return fiber.StatusConflict, "Category has associated courses"
	case coursePorts.ErrCategoryInactive:
		return fiber.StatusForbidden, "Category is inactive"
	case coursePorts.ErrInvalidParentCategory:
		return fiber.StatusBadRequest, "Invalid parent category"
	case coursePorts.ErrCircularCategoryReference:
		return fiber.StatusBadRequest, "Circular category reference detected"
	case coursePorts.ErrInvalidCategoryData:
		return fiber.StatusBadRequest, "Invalid category data"

	// Enrollment errors
	case coursePorts.ErrAlreadyEnrolled:
		return fiber.StatusConflict, "Already enrolled in this course"
	case coursePorts.ErrNotEnrolled:
		return fiber.StatusBadRequest, "Not enrolled in this course"
	case coursePorts.ErrEnrollmentFailed:
		return fiber.StatusInternalServerError, "Failed to enroll in course"
	case coursePorts.ErrUnenrollmentFailed:
		return fiber.StatusInternalServerError, "Failed to unenroll from course"
	case coursePorts.ErrEnrollmentLimitReached:
		return fiber.StatusForbidden, "Course enrollment limit reached"

	// Rating errors
	case coursePorts.ErrInvalidRating:
		return fiber.StatusBadRequest, "Invalid rating value"
	case coursePorts.ErrRatingFailed:
		return fiber.StatusInternalServerError, "Failed to rate course"
	case coursePorts.ErrCannotRateOwnCourse:
		return fiber.StatusForbidden, "Cannot rate your own course"
	case coursePorts.ErrMustBeEnrolledToRate:
		return fiber.StatusForbidden, "Must be enrolled to rate course"

	// Course authorization errors
	case coursePorts.ErrNotCourseOwner:
		return fiber.StatusForbidden, "Not the course owner"
	case coursePorts.ErrInsufficientPermissions:
		return fiber.StatusForbidden, "Insufficient permissions"

	// Lesson errors
	case lessonPorts.ErrLessonNotFound:
		return fiber.StatusNotFound, "Lesson not found"
	case lessonPorts.ErrLessonCompletionNotFound:
		return fiber.StatusNotFound, "Lesson completion not found"
	case lessonPorts.ErrInvalidLessonData:
		return fiber.StatusBadRequest, "Invalid lesson data"
	case lessonPorts.ErrInvalidContentType:
		return fiber.StatusBadRequest, "Invalid content type"
	case lessonPorts.ErrQuizIDRequired:
		return fiber.StatusBadRequest, "Quiz ID required for quiz lessons"
	case lessonPorts.ErrContentRequired:
		return fiber.StatusBadRequest, "Content or content URL required"
	case lessonPorts.ErrInvalidOrderIndex:
		return fiber.StatusBadRequest, "Invalid order index"
	case lessonPorts.ErrInvalidCompletionPercent:
		return fiber.StatusBadRequest, "Invalid completion percent"
	case lessonPorts.ErrInvalidTimeSpent:
		return fiber.StatusBadRequest, "Invalid time spent"
	case lessonPorts.ErrLessonDeleted:
		return fiber.StatusGone, "Lesson has been deleted"
	case lessonPorts.ErrLessonNotPublished:
		return fiber.StatusForbidden, "Lesson is not published"
	case lessonPorts.ErrCourseNotFound:
		return fiber.StatusNotFound, "Course not found"
	case lessonPorts.ErrQuizNotFound:
		return fiber.StatusNotFound, "Quiz not found"
	case lessonPorts.ErrLessonNotEnrollable:
		return fiber.StatusForbidden, "Lesson cannot be accessed"
	case lessonPorts.ErrNotEnrolledInCourse:
		return fiber.StatusForbidden, "Not enrolled in course"
	case lessonPorts.ErrLessonNotFree:
		return fiber.StatusForbidden, "Lesson requires enrollment"
	case lessonPorts.ErrNotLessonOwner:
		return fiber.StatusForbidden, "Not the lesson owner"
	case lessonPorts.ErrInsufficientPermissions:
		return fiber.StatusForbidden, "Insufficient permissions"
	case lessonPorts.ErrUnauthorizedAccess:
		return fiber.StatusUnauthorized, "Unauthorized access to lesson"
	case lessonPorts.ErrLessonUpdateFailed:
		return fiber.StatusInternalServerError, "Failed to update lesson"
	case lessonPorts.ErrCompletionUpdateFailed:
		return fiber.StatusInternalServerError, "Failed to update lesson completion"
	case lessonPorts.ErrReorderFailed:
		return fiber.StatusInternalServerError, "Failed to reorder lessons"
	case lessonPorts.ErrLessonCreationFailed:
		return fiber.StatusInternalServerError, "Failed to create lesson"
	case lessonPorts.ErrCompletionCreationFailed:
		return fiber.StatusInternalServerError, "Failed to create lesson completion"
	case lessonPorts.ErrLessonDeletionFailed:
		return fiber.StatusInternalServerError, "Failed to delete lesson"

	// Default
	default:
		return fiber.StatusInternalServerError, "Internal server error"
	}
}

// HandleError processes an error and sends appropriate response
func HandleError(c *fiber.Ctx, err error) error {
	statusCode, message := MapDomainError(err)
	return ErrorResponse(c, statusCode, message)
}
