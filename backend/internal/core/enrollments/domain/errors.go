package domain

import "errors"

// Enrollment errors
var (
	// Enrollment related errors
	ErrEnrollmentNotFound         = errors.New("enrollment not found")
	ErrEnrollmentAlreadyCancelled = errors.New("enrollment already cancelled")
	ErrEnrollmentAlreadyCompleted = errors.New("enrollment already completed")
	ErrAlreadyEnrolled            = errors.New("user already enrolled in this course")

	// Course related errors
	ErrCourseNotFound      = errors.New("course not found")
	ErrCourseFull          = errors.New("course is full")
	ErrCourseNotPublished  = errors.New("course is not published")

	// Enrollment request errors
	ErrEnrollmentRequestNotFound         = errors.New("enrollment request not found")
	ErrEnrollmentRequestAlreadyExists    = errors.New("enrollment request already exists")
	ErrEnrollmentRequestAlreadyProcessed = errors.New("enrollment request already processed")

	// Authorization errors
	ErrUnauthorizedAccess = errors.New("unauthorized access to this resource")
)
