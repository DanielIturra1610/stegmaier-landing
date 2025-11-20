package domain

import (
	"time"

	"github.com/google/uuid"
)

// ContentType represents the type of lesson content
type ContentType string

const (
	ContentTypeVideo      ContentType = "video"
	ContentTypeText       ContentType = "text"
	ContentTypePDF        ContentType = "pdf"
	ContentTypeQuiz       ContentType = "quiz"
	ContentTypeAssignment ContentType = "assignment"
)

// Lesson represents a lesson entity
type Lesson struct {
	ID          uuid.UUID   `json:"id"`
	TenantID    uuid.UUID   `json:"tenant_id"`
	CourseID    uuid.UUID   `json:"course_id"`
	ModuleID    *uuid.UUID  `json:"module_id,omitempty"`    // Associated module/section
	Title       string      `json:"title"`
	Description *string     `json:"description,omitempty"`
	ContentType ContentType `json:"content_type"`
	ContentURL  *string     `json:"content_url,omitempty"`
	Content     *string     `json:"content,omitempty"`      // For text content
	MediaID     *uuid.UUID  `json:"media_id,omitempty"`     // Reference to media table for videos
	VideoURL    *string     `json:"video_url,omitempty"`    // Pre-signed URL for video playback
	Duration    *int        `json:"duration,omitempty"`     // Duration in minutes
	OrderIndex  int         `json:"order_index"`            // Order within the module or course
	IsPublished bool        `json:"is_published"`           // Whether the lesson is published
	IsFree      bool        `json:"is_free"`                // Whether the lesson is free to preview
	QuizID      *uuid.UUID  `json:"quiz_id,omitempty"`      // Associated quiz if any
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
	DeletedAt   *time.Time  `json:"deleted_at,omitempty"`
}

// LessonCompletion represents a lesson completion record
type LessonCompletion struct {
	ID                uuid.UUID  `json:"id"`
	TenantID          uuid.UUID  `json:"tenant_id"`
	LessonID          uuid.UUID  `json:"lesson_id"`
	UserID            uuid.UUID  `json:"user_id"`
	IsCompleted       bool       `json:"is_completed"`
	TimeSpent         *int       `json:"time_spent,omitempty"`         // Time spent in minutes
	CompletionPercent int        `json:"completion_percent"`           // 0-100
	LastAccessedAt    *time.Time `json:"last_accessed_at,omitempty"`
	CompletedAt       *time.Time `json:"completed_at,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

// TableName returns the table name for Lesson
func (Lesson) TableName() string {
	return "lessons"
}

// TableName returns the table name for LessonCompletion
func (LessonCompletion) TableName() string {
	return "lesson_completions"
}

// IsValidContentType checks if the content type is valid
func IsValidContentType(ct ContentType) bool {
	switch ct {
	case ContentTypeVideo, ContentTypeText, ContentTypePDF, ContentTypeQuiz, ContentTypeAssignment:
		return true
	default:
		return false
	}
}

// CanHaveQuiz returns true if the lesson type can have an associated quiz
func (l *Lesson) CanHaveQuiz() bool {
	// Any lesson type can have an associated quiz
	return true
}

// RequiresContent returns true if the lesson requires content or content URL
func (l *Lesson) RequiresContent() bool {
	switch l.ContentType {
	case ContentTypeQuiz:
		// Quiz lessons only need a QuizID
		return false
	default:
		return true
	}
}

// Validate validates the lesson entity
func (l *Lesson) Validate() error {
	if l.Title == "" {
		return ErrInvalidLessonData
	}

	if !IsValidContentType(l.ContentType) {
		return ErrInvalidContentType
	}

	if l.ContentType == ContentTypeQuiz && l.QuizID == nil {
		return ErrQuizIDRequired
	}

	if l.RequiresContent() && l.ContentURL == nil && l.Content == nil {
		return ErrContentRequired
	}

	if l.OrderIndex < 0 {
		return ErrInvalidOrderIndex
	}

	return nil
}

// Validate validates the lesson completion entity
func (lc *LessonCompletion) Validate() error {
	if lc.CompletionPercent < 0 || lc.CompletionPercent > 100 {
		return ErrInvalidCompletionPercent
	}

	if lc.TimeSpent != nil && *lc.TimeSpent < 0 {
		return ErrInvalidTimeSpent
	}

	return nil
}

// MarkComplete marks the lesson completion as complete
func (lc *LessonCompletion) MarkComplete(timeSpent *int) {
	lc.IsCompleted = true
	lc.CompletionPercent = 100
	lc.TimeSpent = timeSpent
	now := time.Now()
	lc.CompletedAt = &now
	lc.LastAccessedAt = &now
	lc.UpdatedAt = now
}

// UpdateProgress updates the lesson completion progress
func (lc *LessonCompletion) UpdateProgress(percent int, timeSpent *int) error {
	if percent < 0 || percent > 100 {
		return ErrInvalidCompletionPercent
	}

	lc.CompletionPercent = percent
	if timeSpent != nil {
		lc.TimeSpent = timeSpent
	}

	now := time.Now()
	lc.LastAccessedAt = &now
	lc.UpdatedAt = now

	// Auto-mark as complete if 100%
	if percent == 100 {
		lc.IsCompleted = true
		lc.CompletedAt = &now
	}

	return nil
}

// Domain errors
var (
	ErrInvalidLessonData         = NewLessonError("invalid lesson data")
	ErrInvalidContentType        = NewLessonError("invalid content type")
	ErrQuizIDRequired            = NewLessonError("quiz ID required for quiz lessons")
	ErrContentRequired           = NewLessonError("content or content URL required")
	ErrInvalidOrderIndex         = NewLessonError("invalid order index")
	ErrInvalidCompletionPercent  = NewLessonError("invalid completion percent")
	ErrInvalidTimeSpent          = NewLessonError("invalid time spent")
)

// LessonError represents a lesson domain error
type LessonError struct {
	Message string
}

func (e LessonError) Error() string {
	return e.Message
}

// NewLessonError creates a new lesson error
func NewLessonError(message string) error {
	return LessonError{Message: message}
}
