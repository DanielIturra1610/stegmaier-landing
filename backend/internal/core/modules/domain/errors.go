package domain

import "errors"

var (
	// Module errors
	ErrModuleNotFound       = errors.New("module not found")
	ErrUnauthorizedAccess   = errors.New("unauthorized access to module")
	ErrInvalidTitle         = errors.New("invalid module title")
	ErrInvalidDescription   = errors.New("invalid module description")
	ErrInvalidOrder         = errors.New("invalid module order")
	ErrInvalidCourseID      = errors.New("invalid course ID")
	ErrModuleAlreadyExists  = errors.New("module already exists")
	ErrCannotDeleteModule   = errors.New("cannot delete module with lessons")

	// Progress errors
	ErrProgressNotFound     = errors.New("module progress not found")
	ErrInvalidProgress      = errors.New("invalid progress data")

	// Validation errors
	ErrMissingRequiredField = errors.New("missing required field")
	ErrTitleTooLong         = errors.New("title exceeds maximum length")
	ErrDescriptionTooLong   = errors.New("description exceeds maximum length")
	ErrInvalidDuration      = errors.New("invalid duration")
)

// Validation constants
const (
	MaxTitleLength       = 200
	MaxDescriptionLength = 1000
	MinTitleLength       = 3
)
