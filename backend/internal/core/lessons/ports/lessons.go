package ports

import (
	"context"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/lessons/domain"
	"github.com/google/uuid"
)

// LessonRepository defines the interface for lesson data access
type LessonRepository interface {
	// Lesson CRUD operations
	Create(ctx context.Context, lesson *domain.Lesson) error
	Update(ctx context.Context, lesson *domain.Lesson) error
	Delete(ctx context.Context, lessonID, tenantID uuid.UUID) error
	GetByID(ctx context.Context, lessonID, tenantID uuid.UUID) (*domain.Lesson, error)
	GetByCourseID(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) ([]domain.Lesson, int, error)
	GetPublishedByCourseID(ctx context.Context, courseID, tenantID uuid.UUID) ([]domain.Lesson, error)

	// Lesson queries
	Exists(ctx context.Context, lessonID, tenantID uuid.UUID) (bool, error)
	IsPublished(ctx context.Context, lessonID, tenantID uuid.UUID) (bool, error)
	GetMaxOrderIndex(ctx context.Context, courseID, tenantID uuid.UUID) (int, error)

	// Bulk operations
	ReorderLessons(ctx context.Context, courseID, tenantID uuid.UUID, orders []domain.LessonOrder) error
	DeleteByCourseID(ctx context.Context, courseID, tenantID uuid.UUID) error

	// Lesson completion operations
	CreateCompletion(ctx context.Context, completion *domain.LessonCompletion) error
	UpdateCompletion(ctx context.Context, completion *domain.LessonCompletion) error
	GetCompletion(ctx context.Context, lessonID, userID, tenantID uuid.UUID) (*domain.LessonCompletion, error)
	GetCompletionsByUser(ctx context.Context, userID, tenantID uuid.UUID, courseID *uuid.UUID) ([]domain.LessonCompletion, error)
	GetCompletionsByCourse(ctx context.Context, courseID, userID, tenantID uuid.UUID) ([]domain.LessonCompletion, error)
	CompletionExists(ctx context.Context, lessonID, userID, tenantID uuid.UUID) (bool, error)

	// Statistics
	GetCourseCompletionStats(ctx context.Context, courseID, userID, tenantID uuid.UUID) (completed int, total int, err error)
	GetUserCompletionPercentage(ctx context.Context, courseID, userID, tenantID uuid.UUID) (int, error)
}

// LessonService defines the interface for lesson business logic
type LessonService interface {
	// Lesson management (instructor/admin)
	CreateLesson(ctx context.Context, tenantID uuid.UUID, req *domain.CreateLessonRequest) (*domain.LessonDetailResponse, error)
	UpdateLesson(ctx context.Context, lessonID, tenantID uuid.UUID, req *domain.UpdateLessonRequest) (*domain.LessonDetailResponse, error)
	UpdateLessonVideo(ctx context.Context, lessonID, tenantID, mediaID uuid.UUID, videoURL string) (*domain.LessonDetailResponse, error)
	DeleteLesson(ctx context.Context, lessonID, tenantID uuid.UUID) error
	ReorderLessons(ctx context.Context, courseID, tenantID uuid.UUID, req *domain.ReorderLessonsRequest) error

	// Lesson retrieval (public/authenticated)
	GetLesson(ctx context.Context, lessonID, tenantID uuid.UUID, userID *uuid.UUID) (*domain.LessonDetailResponse, error)
	GetLessonsByCourse(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) (*domain.ListLessonsResponse, error)
	GetLessonsWithProgress(ctx context.Context, courseID, userID, tenantID uuid.UUID, page, pageSize int) (*domain.ListLessonsWithProgressResponse, error)

	// Lesson completion (student)
	MarkLessonComplete(ctx context.Context, lessonID, userID, tenantID uuid.UUID, req *domain.MarkLessonCompleteRequest) error
	GetLessonCompletion(ctx context.Context, lessonID, userID, tenantID uuid.UUID) (*domain.LessonCompletionResponse, error)
	GetCourseProgress(ctx context.Context, courseID, userID, tenantID uuid.UUID) (completed int, total int, percentage int, err error)
}
