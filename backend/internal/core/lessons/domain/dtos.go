package domain

import (
	"time"

	"github.com/google/uuid"
)

// CreateLessonRequest represents a request to create a lesson
type CreateLessonRequest struct {
	CourseID    uuid.UUID   `json:"course_id" validate:"required"`
	ModuleID    uuid.UUID   `json:"module_id" validate:"required"`
	Title       string      `json:"title" validate:"required,min=3,max=200"`
	Description *string     `json:"description,omitempty" validate:"omitempty,max=1000"`
	ContentType ContentType `json:"content_type" validate:"required"`
	ContentURL  *string     `json:"content_url,omitempty" validate:"omitempty,url,max=500"`
	Content     *string     `json:"content,omitempty" validate:"omitempty,max=50000"`
	Duration    *int        `json:"duration,omitempty" validate:"omitempty,min=1,max=1440"` // Max 24 hours
	OrderIndex  int         `json:"order_index" validate:"min=0"`
	IsPublished bool        `json:"is_published"`
	IsFree      bool        `json:"is_free"`
	QuizID      *uuid.UUID  `json:"quiz_id,omitempty"`
}

// Validate validates the create lesson request
func (req *CreateLessonRequest) Validate() error {
	if req.Title == "" {
		return ErrInvalidLessonData
	}

	if !IsValidContentType(req.ContentType) {
		return ErrInvalidContentType
	}

	if req.ContentType == ContentTypeQuiz && req.QuizID == nil {
		return ErrQuizIDRequired
	}

	// For non-quiz lessons, require content or content URL
	if req.ContentType != ContentTypeQuiz && req.ContentURL == nil && req.Content == nil {
		return ErrContentRequired
	}

	if req.OrderIndex < 0 {
		return ErrInvalidOrderIndex
	}

	return nil
}

// UpdateLessonRequest represents a request to update a lesson
type UpdateLessonRequest struct {
	ModuleID    *uuid.UUID  `json:"module_id,omitempty"`
	Title       *string     `json:"title,omitempty" validate:"omitempty,min=3,max=200"`
	Description *string     `json:"description,omitempty" validate:"omitempty,max=1000"`
	ContentType *ContentType `json:"content_type,omitempty"`
	ContentURL  *string     `json:"content_url,omitempty" validate:"omitempty,url,max=500"`
	Content     *string     `json:"content,omitempty" validate:"omitempty,max=50000"`
	Duration    *int        `json:"duration,omitempty" validate:"omitempty,min=1,max=1440"`
	OrderIndex  *int        `json:"order_index,omitempty" validate:"omitempty,min=0"`
	IsPublished *bool       `json:"is_published,omitempty"`
	IsFree      *bool       `json:"is_free,omitempty"`
	QuizID      *uuid.UUID  `json:"quiz_id,omitempty"`
}

// Validate validates the update lesson request
func (req *UpdateLessonRequest) Validate() error {
	if req.Title != nil && *req.Title == "" {
		return ErrInvalidLessonData
	}

	if req.ContentType != nil && !IsValidContentType(*req.ContentType) {
		return ErrInvalidContentType
	}

	if req.OrderIndex != nil && *req.OrderIndex < 0 {
		return ErrInvalidOrderIndex
	}

	return nil
}

// ReorderLessonsRequest represents a request to reorder lessons
type ReorderLessonsRequest struct {
	LessonOrders []LessonOrder `json:"lesson_orders" validate:"required,min=1"`
}

// LessonOrder represents a lesson ID and its new order index
type LessonOrder struct {
	LessonID   uuid.UUID `json:"lesson_id" validate:"required"`
	OrderIndex int       `json:"order_index" validate:"min=0"`
}

// Validate validates the reorder lessons request
func (req *ReorderLessonsRequest) Validate() error {
	if len(req.LessonOrders) == 0 {
		return ErrInvalidLessonData
	}

	// Check for duplicate lesson IDs
	seen := make(map[uuid.UUID]bool)
	for _, order := range req.LessonOrders {
		if seen[order.LessonID] {
			return NewLessonError("duplicate lesson ID in reorder request")
		}
		seen[order.LessonID] = true

		if order.OrderIndex < 0 {
			return ErrInvalidOrderIndex
		}
	}

	return nil
}

// MarkLessonCompleteRequest represents a request to mark a lesson as complete
type MarkLessonCompleteRequest struct {
	CompletionPercent int  `json:"completion_percent" validate:"min=0,max=100"`
	TimeSpent         *int `json:"time_spent,omitempty" validate:"omitempty,min=0"`
}

// Validate validates the mark lesson complete request
func (req *MarkLessonCompleteRequest) Validate() error {
	if req.CompletionPercent < 0 || req.CompletionPercent > 100 {
		return ErrInvalidCompletionPercent
	}

	if req.TimeSpent != nil && *req.TimeSpent < 0 {
		return ErrInvalidTimeSpent
	}

	return nil
}

// LessonResponse represents a lesson response
type LessonResponse struct {
	ID          uuid.UUID   `json:"id"`
	TenantID    uuid.UUID   `json:"tenant_id"`
	CourseID    uuid.UUID   `json:"course_id"`
	ModuleID    *uuid.UUID  `json:"module_id,omitempty"`
	Title       string      `json:"title"`
	Description *string     `json:"description,omitempty"`
	ContentType ContentType `json:"content_type"`
	Duration    *int        `json:"duration,omitempty"`
	OrderIndex  int         `json:"order_index"`
	IsPublished bool        `json:"is_published"`
	IsFree      bool        `json:"is_free"`
	QuizID      *uuid.UUID  `json:"quiz_id,omitempty"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}

// LessonDetailResponse represents a detailed lesson response (includes content)
type LessonDetailResponse struct {
	ID          uuid.UUID   `json:"id"`
	TenantID    uuid.UUID   `json:"tenant_id"`
	CourseID    uuid.UUID   `json:"course_id"`
	ModuleID    *uuid.UUID  `json:"module_id,omitempty"`
	Title       string      `json:"title"`
	Description *string     `json:"description,omitempty"`
	ContentType ContentType `json:"content_type"`
	ContentURL  *string     `json:"content_url,omitempty"`
	Content     *string     `json:"content,omitempty"`
	Duration    *int        `json:"duration,omitempty"`
	OrderIndex  int         `json:"order_index"`
	IsPublished bool        `json:"is_published"`
	IsFree      bool        `json:"is_free"`
	QuizID      *uuid.UUID  `json:"quiz_id,omitempty"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}

// LessonWithProgressResponse represents a lesson with user progress
type LessonWithProgressResponse struct {
	Lesson     LessonResponse            `json:"lesson"`
	Completion *LessonCompletionResponse `json:"completion,omitempty"`
}

// LessonCompletionResponse represents a lesson completion response
type LessonCompletionResponse struct {
	ID                uuid.UUID  `json:"id"`
	LessonID          uuid.UUID  `json:"lesson_id"`
	UserID            uuid.UUID  `json:"user_id"`
	IsCompleted       bool       `json:"is_completed"`
	TimeSpent         *int       `json:"time_spent,omitempty"`
	CompletionPercent int        `json:"completion_percent"`
	LastAccessedAt    *time.Time `json:"last_accessed_at,omitempty"`
	CompletedAt       *time.Time `json:"completed_at,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

// ListLessonsResponse represents a paginated list of lessons
type ListLessonsResponse struct {
	Lessons    []LessonResponse `json:"lessons"`
	TotalCount int              `json:"total_count"`
	Page       int              `json:"page"`
	PageSize   int              `json:"page_size"`
	TotalPages int              `json:"total_pages"`
}

// ListLessonsWithProgressResponse represents a paginated list of lessons with progress
type ListLessonsWithProgressResponse struct {
	Lessons    []LessonWithProgressResponse `json:"lessons"`
	TotalCount int                          `json:"total_count"`
	Page       int                          `json:"page"`
	PageSize   int                          `json:"page_size"`
	TotalPages int                          `json:"total_pages"`
}

// FromEntity converts a Lesson entity to LessonResponse
func (lr *LessonResponse) FromEntity(lesson *Lesson) {
	lr.ID = lesson.ID
	lr.TenantID = lesson.TenantID
	lr.CourseID = lesson.CourseID
	lr.ModuleID = lesson.ModuleID
	lr.Title = lesson.Title
	lr.Description = lesson.Description
	lr.ContentType = lesson.ContentType
	lr.Duration = lesson.Duration
	lr.OrderIndex = lesson.OrderIndex
	lr.IsPublished = lesson.IsPublished
	lr.IsFree = lesson.IsFree
	lr.QuizID = lesson.QuizID
	lr.CreatedAt = lesson.CreatedAt
	lr.UpdatedAt = lesson.UpdatedAt
}

// FromEntity converts a Lesson entity to LessonDetailResponse
func (ldr *LessonDetailResponse) FromEntity(lesson *Lesson) {
	ldr.ID = lesson.ID
	ldr.TenantID = lesson.TenantID
	ldr.CourseID = lesson.CourseID
	ldr.ModuleID = lesson.ModuleID
	ldr.Title = lesson.Title
	ldr.Description = lesson.Description
	ldr.ContentType = lesson.ContentType
	ldr.ContentURL = lesson.ContentURL
	ldr.Content = lesson.Content
	ldr.Duration = lesson.Duration
	ldr.OrderIndex = lesson.OrderIndex
	ldr.IsPublished = lesson.IsPublished
	ldr.IsFree = lesson.IsFree
	ldr.QuizID = lesson.QuizID
	ldr.CreatedAt = lesson.CreatedAt
	ldr.UpdatedAt = lesson.UpdatedAt
}

// FromEntity converts a LessonCompletion entity to LessonCompletionResponse
func (lcr *LessonCompletionResponse) FromEntity(completion *LessonCompletion) {
	lcr.ID = completion.ID
	lcr.LessonID = completion.LessonID
	lcr.UserID = completion.UserID
	lcr.IsCompleted = completion.IsCompleted
	lcr.TimeSpent = completion.TimeSpent
	lcr.CompletionPercent = completion.CompletionPercent
	lcr.LastAccessedAt = completion.LastAccessedAt
	lcr.CompletedAt = completion.CompletedAt
	lcr.CreatedAt = completion.CreatedAt
	lcr.UpdatedAt = completion.UpdatedAt
}
