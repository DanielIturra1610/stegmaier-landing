package ports

import (
	"errors"
	"fmt"
)

// Repository errors
var (
	// ErrProfileNotFound is returned when a profile is not found
	ErrProfileNotFound = errors.New("profile not found")

	// ErrProfileAlreadyExists is returned when trying to create a profile that already exists
	ErrProfileAlreadyExists = errors.New("profile already exists")

	// ErrPreferencesNotFound is returned when preferences are not found
	ErrPreferencesNotFound = errors.New("preferences not found")

	// ErrDatabaseError is returned for generic database errors
	ErrDatabaseError = errors.New("database error occurred")
)

// Service errors
var (
	// ErrInvalidProfileData is returned when profile data is invalid
	ErrInvalidProfileData = errors.New("invalid profile data")

	// ErrUnauthorized is returned when user is not authorized for an action
	ErrUnauthorized = errors.New("unauthorized access")

	// ErrCurrentPasswordIncorrect is returned when current password doesn't match
	ErrCurrentPasswordIncorrect = errors.New("current password is incorrect")

	// ErrPasswordChangeFailed is returned when password change fails
	ErrPasswordChangeFailed = errors.New("failed to change password")

	// ErrAvatarUploadFailed is returned when avatar upload fails
	ErrAvatarUploadFailed = errors.New("failed to upload avatar")

	// ErrAvatarDeleteFailed is returned when avatar deletion fails
	ErrAvatarDeleteFailed = errors.New("failed to delete avatar")

	// ErrFileStorageUnavailable is returned when file storage is unavailable
	ErrFileStorageUnavailable = errors.New("file storage service unavailable")
)

// File storage errors
var (
	// ErrInvalidFileFormat is returned when file format is not supported
	ErrInvalidFileFormat = errors.New("invalid file format")

	// ErrFileTooLarge is returned when file exceeds size limit
	ErrFileTooLarge = errors.New("file size exceeds limit")

	// ErrFileNotFound is returned when file is not found
	ErrFileNotFound = errors.New("file not found")

	// ErrFileUploadFailed is returned when file upload fails
	ErrFileUploadFailed = errors.New("file upload failed")

	// ErrFileDeleteFailed is returned when file deletion fails
	ErrFileDeleteFailed = errors.New("file deletion failed")
)

// ProfileError wraps an error with additional context
type ProfileError struct {
	Op  string // Operation that failed
	Err error  // Underlying error
	Msg string // Additional message
}

// Error implements the error interface
func (e *ProfileError) Error() string {
	if e.Msg != "" {
		return fmt.Sprintf("%s: %s: %v", e.Op, e.Msg, e.Err)
	}
	return fmt.Sprintf("%s: %v", e.Op, e.Err)
}

// Unwrap returns the underlying error
func (e *ProfileError) Unwrap() error {
	return e.Err
}

// NewProfileError creates a new ProfileError
func NewProfileError(op string, err error, msg string) *ProfileError {
	return &ProfileError{
		Op:  op,
		Err: err,
		Msg: msg,
	}
}

// IsNotFoundError checks if an error is a not found error
func IsNotFoundError(err error) bool {
	return errors.Is(err, ErrProfileNotFound) ||
		errors.Is(err, ErrPreferencesNotFound) ||
		errors.Is(err, ErrFileNotFound)
}

// IsValidationError checks if an error is a validation error
func IsValidationError(err error) bool {
	return errors.Is(err, ErrInvalidProfileData)
}

// IsUnauthorizedError checks if an error is an unauthorized error
func IsUnauthorizedError(err error) bool {
	return errors.Is(err, ErrUnauthorized)
}

// IsStorageError checks if an error is a storage-related error
func IsStorageError(err error) bool {
	return errors.Is(err, ErrFileStorageUnavailable) ||
		errors.Is(err, ErrFileUploadFailed) ||
		errors.Is(err, ErrFileDeleteFailed)
}
