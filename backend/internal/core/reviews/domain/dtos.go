package domain

import (
	"strings"

	"github.com/google/uuid"
)

// CreateReviewRequest represents a request to create a review
type CreateReviewRequest struct {
	CourseID uuid.UUID `json:"course_id"`
	Rating   int       `json:"rating"`
	Title    *string   `json:"title,omitempty"`
	Comment  *string   `json:"comment,omitempty"`
	IsPublic bool      `json:"is_public"`
}

// Validate validates the create review request
func (r *CreateReviewRequest) Validate() error {
	if r.CourseID == uuid.Nil {
		return ErrInvalidCourseID
	}

	if !IsValidRating(r.Rating) {
		return ErrInvalidRating
	}

	if r.Title != nil {
		title := strings.TrimSpace(*r.Title)
		if len(title) > MaxTitleLength {
			return ErrTitleTooLong
		}
	}

	if r.Comment != nil {
		comment := strings.TrimSpace(*r.Comment)
		if len(comment) > 0 && len(comment) < MinCommentLength {
			return ErrCommentTooShort
		}
		if len(comment) > MaxCommentLength {
			return ErrCommentTooLong
		}
	}

	return nil
}

// UpdateReviewRequest represents a request to update a review
type UpdateReviewRequest struct {
	Rating   *int    `json:"rating,omitempty"`
	Title    *string `json:"title,omitempty"`
	Comment  *string `json:"comment,omitempty"`
	IsPublic *bool   `json:"is_public,omitempty"`
}

// Validate validates the update review request
func (r *UpdateReviewRequest) Validate() error {
	if r.Rating != nil && !IsValidRating(*r.Rating) {
		return ErrInvalidRating
	}

	if r.Title != nil {
		title := strings.TrimSpace(*r.Title)
		if len(title) > MaxTitleLength {
			return ErrTitleTooLong
		}
	}

	if r.Comment != nil {
		comment := strings.TrimSpace(*r.Comment)
		if len(comment) > 0 && len(comment) < MinCommentLength {
			return ErrCommentTooShort
		}
		if len(comment) > MaxCommentLength {
			return ErrCommentTooLong
		}
	}

	return nil
}

// ReportReviewRequest represents a request to report a review
type ReportReviewRequest struct {
	ReviewID uuid.UUID `json:"review_id"`
	Reason   string    `json:"reason"`
}

// Validate validates the report review request
func (r *ReportReviewRequest) Validate() error {
	if r.ReviewID == uuid.Nil {
		return ErrInvalidReviewID
	}

	reason := strings.TrimSpace(r.Reason)
	if reason == "" {
		return ErrMissingRequiredField
	}

	if len(reason) > MaxReasonLength {
		return ErrReasonTooLong
	}

	return nil
}

// VoteReviewRequest represents a request to vote on review helpfulness
type VoteReviewRequest struct {
	ReviewID  uuid.UUID `json:"review_id"`
	IsHelpful bool      `json:"is_helpful"`
}

// Validate validates the vote review request
func (r *VoteReviewRequest) Validate() error {
	if r.ReviewID == uuid.Nil {
		return ErrInvalidReviewID
	}
	return nil
}

// ReviewResponse represents a review response
type ReviewResponse struct {
	ID             uuid.UUID `json:"id"`
	CourseID       uuid.UUID `json:"course_id"`
	UserID         uuid.UUID `json:"user_id"`
	UserName       string    `json:"user_name"`
	UserAvatar     *string   `json:"user_avatar,omitempty"`
	Rating         int       `json:"rating"`
	Title          *string   `json:"title,omitempty"`
	Comment        *string   `json:"comment,omitempty"`
	IsPublic       bool      `json:"is_public"`
	IsEdited       bool      `json:"is_edited"`
	HelpfulCount   int       `json:"helpful_count"`
	UnhelpfulCount int       `json:"unhelpful_count"`
	UserVoted      *bool     `json:"user_voted,omitempty"` // nil = not voted, true = helpful, false = not helpful
	CreatedAt      string    `json:"created_at"`
	UpdatedAt      string    `json:"updated_at"`
}

// ReviewListResponse represents a paginated list of reviews
type ReviewListResponse struct {
	Reviews    []ReviewResponse `json:"reviews"`
	TotalCount int              `json:"total_count"`
	Page       int              `json:"page"`
	PageSize   int              `json:"page_size"`
	TotalPages int              `json:"total_pages"`
}

// CourseRatingResponse represents course rating statistics
type CourseRatingResponse struct {
	CourseID           uuid.UUID        `json:"course_id"`
	AverageRating      float64          `json:"average_rating"`
	TotalReviews       int              `json:"total_reviews"`
	RatingDistribution map[int]float64  `json:"rating_distribution"` // Percentage per star (1-5)
	RatingCounts       map[int]int      `json:"rating_counts"`       // Count per star (1-5)
}

// ReviewReportResponse represents a review report response
type ReviewReportResponse struct {
	ID         uuid.UUID    `json:"id"`
	ReviewID   uuid.UUID    `json:"review_id"`
	ReporterID uuid.UUID    `json:"reporter_id"`
	Reason     string       `json:"reason"`
	Status     ReportStatus `json:"status"`
	CreatedAt  string       `json:"created_at"`
	UpdatedAt  string       `json:"updated_at"`
}

// UpdateReportStatusRequest represents a request to update report status
type UpdateReportStatusRequest struct {
	Status ReportStatus `json:"status"`
}

// Validate validates the update report status request
func (r *UpdateReportStatusRequest) Validate() error {
	if !IsValidReportStatus(r.Status) {
		return ErrInvalidReportReason
	}
	return nil
}

// GetReviewsFilter represents filters for getting reviews
type GetReviewsFilter struct {
	CourseID   *uuid.UUID
	UserID     *uuid.UUID
	Rating     *int
	IsPublic   *bool
	Page       int
	PageSize   int
	SortBy     string // "recent", "helpful", "rating_high", "rating_low"
}

// Validate validates the get reviews filter
func (f *GetReviewsFilter) Validate() error {
	if f.Rating != nil && !IsValidRating(*f.Rating) {
		return ErrInvalidRating
	}

	if f.Page < 1 {
		f.Page = 1
	}

	if f.PageSize < 1 {
		f.PageSize = 10
	}

	if f.PageSize > 100 {
		f.PageSize = 100
	}

	validSortBy := map[string]bool{
		"recent":      true,
		"helpful":     true,
		"rating_high": true,
		"rating_low":  true,
	}

	if f.SortBy == "" {
		f.SortBy = "recent"
	} else if !validSortBy[f.SortBy] {
		f.SortBy = "recent"
	}

	return nil
}
