package domain

import "errors"

var (
	// Review errors
	ErrReviewNotFound          = errors.New("review not found")
	ErrReviewAlreadyExists     = errors.New("user already reviewed this course")
	ErrUnauthorizedAccess      = errors.New("unauthorized access to review")
	ErrCannotReviewOwnCourse   = errors.New("cannot review your own course")
	ErrMustCompleteToReview    = errors.New("must complete course to review")
	ErrMustEnrollToReview      = errors.New("must be enrolled to review")
	ErrCannotDeleteReview      = errors.New("cannot delete review")
	ErrCannotEditReview        = errors.New("cannot edit review")

	// Validation errors
	ErrInvalidRating           = errors.New("rating must be between 1 and 5")
	ErrInvalidCourseID         = errors.New("invalid course ID")
	ErrInvalidUserID           = errors.New("invalid user ID")
	ErrInvalidReviewID         = errors.New("invalid review ID")
	ErrTitleTooLong            = errors.New("title exceeds maximum length")
	ErrCommentTooShort         = errors.New("comment is too short")
	ErrCommentTooLong          = errors.New("comment exceeds maximum length")
	ErrMissingRequiredField    = errors.New("missing required field")

	// Report errors
	ErrReportNotFound          = errors.New("report not found")
	ErrAlreadyReported         = errors.New("already reported this review")
	ErrCannotReportOwnReview   = errors.New("cannot report your own review")
	ErrInvalidReportReason     = errors.New("invalid report reason")
	ErrReasonTooLong           = errors.New("reason exceeds maximum length")

	// Helpful vote errors
	ErrAlreadyVoted            = errors.New("already voted on this review")
	ErrCannotVoteOwnReview     = errors.New("cannot vote on your own review")
)
