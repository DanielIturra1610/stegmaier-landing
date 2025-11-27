package domain

import (
	"time"

	"github.com/google/uuid"
)

// Review represents a course review/rating entity
type Review struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	TenantID  uuid.UUID  `json:"tenant_id" db:"tenant_id"`
	CourseID  uuid.UUID  `json:"course_id" db:"course_id"`
	UserID    uuid.UUID  `json:"user_id" db:"user_id"`
	Rating    int        `json:"rating" db:"rating"` // 1-5 stars
	Title     *string    `json:"title,omitempty" db:"title"`
	Comment   *string    `json:"comment,omitempty" db:"comment"`
	IsPublic  bool       `json:"is_public" db:"is_public"`
	IsEdited  bool       `json:"is_edited" db:"is_edited"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

// ReviewReport represents a report on an inappropriate review
type ReviewReport struct {
	ID        uuid.UUID `json:"id" db:"id"`
	TenantID  uuid.UUID `json:"tenant_id" db:"tenant_id"`
	ReviewID  uuid.UUID `json:"review_id" db:"review_id"`
	ReporterID uuid.UUID `json:"reporter_id" db:"reporter_id"`
	Reason    string    `json:"reason" db:"reason"`
	Status    ReportStatus `json:"status" db:"status"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// ReviewHelpful represents a helpful vote on a review
type ReviewHelpful struct {
	ID        uuid.UUID `json:"id" db:"id"`
	TenantID  uuid.UUID `json:"tenant_id" db:"tenant_id"`
	ReviewID  uuid.UUID `json:"review_id" db:"review_id"`
	UserID    uuid.UUID `json:"user_id" db:"user_id"`
	IsHelpful bool      `json:"is_helpful" db:"is_helpful"` // true = helpful, false = not helpful
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// CourseRating represents aggregated rating statistics for a course
type CourseRating struct {
	CourseID      uuid.UUID `json:"course_id" db:"course_id"`
	TenantID      uuid.UUID `json:"tenant_id" db:"tenant_id"`
	AverageRating float64   `json:"average_rating" db:"average_rating"`
	TotalReviews  int       `json:"total_reviews" db:"total_reviews"`
	Rating5Stars  int       `json:"rating_5_stars" db:"rating_5_stars"`
	Rating4Stars  int       `json:"rating_4_stars" db:"rating_4_stars"`
	Rating3Stars  int       `json:"rating_3_stars" db:"rating_3_stars"`
	Rating2Stars  int       `json:"rating_2_stars" db:"rating_2_stars"`
	Rating1Star   int       `json:"rating_1_star" db:"rating_1_star"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
}

// ReportStatus represents the status of a review report
type ReportStatus string

const (
	ReportStatusPending  ReportStatus = "pending"
	ReportStatusReviewed ReportStatus = "reviewed"
	ReportStatusApproved ReportStatus = "approved" // Review removed
	ReportStatusRejected ReportStatus = "rejected" // Review stays
)

// Validation constants
const (
	MinRating        = 1
	MaxRating        = 5
	MaxTitleLength   = 100
	MaxCommentLength = 2000
	MinCommentLength = 10
	MaxReasonLength  = 500
)

// IsValidRating checks if rating is within valid range
func IsValidRating(rating int) bool {
	return rating >= MinRating && rating <= MaxRating
}

// IsValidReportStatus checks if report status is valid
func IsValidReportStatus(status ReportStatus) bool {
	switch status {
	case ReportStatusPending, ReportStatusReviewed, ReportStatusApproved, ReportStatusRejected:
		return true
	default:
		return false
	}
}

// Validate validates the review entity
func (r *Review) Validate() error {
	if r.CourseID == uuid.Nil {
		return ErrInvalidCourseID
	}

	if r.UserID == uuid.Nil {
		return ErrInvalidUserID
	}

	if !IsValidRating(r.Rating) {
		return ErrInvalidRating
	}

	if r.Title != nil {
		if len(*r.Title) > MaxTitleLength {
			return ErrTitleTooLong
		}
	}

	if r.Comment != nil {
		commentLen := len(*r.Comment)
		if commentLen > 0 && commentLen < MinCommentLength {
			return ErrCommentTooShort
		}
		if commentLen > MaxCommentLength {
			return ErrCommentTooLong
		}
	}

	return nil
}

// CalculateRatingDistribution calculates rating percentage distribution
func (cr *CourseRating) CalculateRatingDistribution() map[int]float64 {
	if cr.TotalReviews == 0 {
		return map[int]float64{
			5: 0, 4: 0, 3: 0, 2: 0, 1: 0,
		}
	}

	total := float64(cr.TotalReviews)
	return map[int]float64{
		5: (float64(cr.Rating5Stars) / total) * 100,
		4: (float64(cr.Rating4Stars) / total) * 100,
		3: (float64(cr.Rating3Stars) / total) * 100,
		2: (float64(cr.Rating2Stars) / total) * 100,
		1: (float64(cr.Rating1Star) / total) * 100,
	}
}
