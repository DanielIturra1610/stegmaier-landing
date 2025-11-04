package ports

import (
	"context"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/progress/domain"
	"github.com/google/uuid"
)

// ============================================================
// Repository Interface
// ============================================================

// ProgressRepository defines the interface for progress data operations
type ProgressRepository interface {
	// Course Progress CRUD operations
	CreateProgress(ctx context.Context, progress *domain.CourseProgress) error
	GetProgress(ctx context.Context, progressID, tenantID uuid.UUID) (*domain.CourseProgress, error)
	GetProgressByUserAndCourse(ctx context.Context, userID, courseID, tenantID uuid.UUID) (*domain.CourseProgress, error)
	GetProgressByEnrollment(ctx context.Context, enrollmentID, tenantID uuid.UUID) (*domain.CourseProgress, error)
	ListProgressByUser(ctx context.Context, userID, tenantID uuid.UUID, page, pageSize int) ([]*domain.CourseProgress, int, error)
	ListProgressByCourse(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) ([]*domain.CourseProgress, int, error)
	UpdateProgress(ctx context.Context, progress *domain.CourseProgress) error
	DeleteProgress(ctx context.Context, progressID, tenantID uuid.UUID) error

	// Progress status operations
	MarkProgressAsStarted(ctx context.Context, progressID, tenantID uuid.UUID) error
	MarkProgressAsCompleted(ctx context.Context, progressID, tenantID uuid.UUID, certificateID *uuid.UUID) error
	UpdateLastAccessed(ctx context.Context, progressID, tenantID uuid.UUID) error
	UpdateProgressData(ctx context.Context, progressID, tenantID uuid.UUID, completedLessons, completedQuizzes, timeSpent int) error

	// Progress Snapshot operations
	CreateSnapshot(ctx context.Context, snapshot *domain.ProgressSnapshot) error
	GetSnapshot(ctx context.Context, snapshotID, tenantID uuid.UUID) (*domain.ProgressSnapshot, error)
	ListSnapshotsByProgress(ctx context.Context, userID, courseID, tenantID uuid.UUID, page, pageSize int) ([]*domain.ProgressSnapshot, int, error)
	ListSnapshotsByMilestone(ctx context.Context, userID, courseID, tenantID uuid.UUID, milestoneType domain.MilestoneType) ([]*domain.ProgressSnapshot, error)
	ListSnapshotsByDateRange(ctx context.Context, userID, courseID, tenantID uuid.UUID, startDate, endDate time.Time, page, pageSize int) ([]*domain.ProgressSnapshot, int, error)
	DeleteSnapshot(ctx context.Context, snapshotID, tenantID uuid.UUID) error

	// Statistics operations
	GetCourseStatistics(ctx context.Context, courseID, tenantID uuid.UUID) (*domain.ProgressStatistics, error)
	GetUserProgressSummary(ctx context.Context, userID, tenantID uuid.UUID) (*domain.ProgressSummaryResponse, error)
	CountProgressByStatus(ctx context.Context, courseID, tenantID uuid.UUID, status domain.ProgressStatus) (int, error)
	GetAverageProgressPercentage(ctx context.Context, courseID, tenantID uuid.UUID) (float64, error)
	GetAverageTimeSpent(ctx context.Context, courseID, tenantID uuid.UUID) (float64, error)

	// Validation operations
	ProgressExists(ctx context.Context, userID, courseID, tenantID uuid.UUID) (bool, error)
}

// ============================================================
// Service Interface
// ============================================================

// ProgressService defines the interface for progress business logic
type ProgressService interface {
	// Student Progress Operations
	GetMyProgress(ctx context.Context, courseID, userID, tenantID uuid.UUID) (*domain.CourseProgressDetailResponse, error)
	GetMyProgressList(ctx context.Context, userID, tenantID uuid.UUID, page, pageSize int) ([]*domain.CourseProgressResponse, int, error)
	GetMyProgressSummary(ctx context.Context, userID, tenantID uuid.UUID) (*domain.ProgressSummaryResponse, error)
	UpdateMyProgress(ctx context.Context, courseID, userID, tenantID uuid.UUID, req *domain.UpdateProgressRequest) (*domain.CourseProgressResponse, error)
	RecordActivity(ctx context.Context, courseID, userID, tenantID uuid.UUID, req *domain.RecordProgressRequest) error
	GetMyProgressHistory(ctx context.Context, courseID, userID, tenantID uuid.UUID, req *domain.GetProgressHistoryRequest) (*domain.ListProgressHistoryResponse, error)

	// Instructor/Admin Progress Management
	GetCourseProgress(ctx context.Context, progressID, tenantID uuid.UUID) (*domain.CourseProgressDetailResponse, error)
	GetProgressByUser(ctx context.Context, userID, courseID, tenantID uuid.UUID) (*domain.CourseProgressDetailResponse, error)
	ListCourseProgress(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) ([]*domain.CourseProgressResponse, int, error)
	MarkProgressAsCompleted(ctx context.Context, progressID, tenantID uuid.UUID, certificateID *uuid.UUID) error
	ResetProgress(ctx context.Context, progressID, tenantID uuid.UUID) error
	DeleteProgress(ctx context.Context, progressID, tenantID uuid.UUID) error

	// Progress Statistics (Instructor/Admin)
	GetCourseStatistics(ctx context.Context, courseID, tenantID uuid.UUID, req *domain.GetCourseStatisticsRequest) (*domain.ProgressStatisticsResponse, error)
	GetProgressAnalytics(ctx context.Context, courseID, tenantID uuid.UUID, startDate, endDate *time.Time) (interface{}, error)

	// Snapshot Management
	CreateMilestoneSnapshot(ctx context.Context, userID, courseID, tenantID uuid.UUID, milestoneType domain.MilestoneType) error
	GetProgressSnapshots(ctx context.Context, userID, courseID, tenantID uuid.UUID, page, pageSize int) (*domain.ListProgressHistoryResponse, error)

	// System Operations
	InitializeProgress(ctx context.Context, enrollmentID, userID, courseID, tenantID uuid.UUID, totalLessons, totalQuizzes int) (*domain.CourseProgressResponse, error)
	RecalculateProgress(ctx context.Context, userID, courseID, tenantID uuid.UUID) (*domain.CourseProgressResponse, error)
	SyncProgressFromEnrollment(ctx context.Context, enrollmentID, tenantID uuid.UUID) error
}
