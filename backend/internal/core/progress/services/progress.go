package services

import (
	"context"
	"log"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/progress/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/progress/ports"
	"github.com/google/uuid"
)

// ProgressService implements the ProgressService interface
type ProgressService struct {
	repo ports.ProgressRepository
}

// NewProgressService creates a new progress service
func NewProgressService(repo ports.ProgressRepository) ports.ProgressService {
	return &ProgressService{
		repo: repo,
	}
}

// ============================================================
// Student Progress Operations
// ============================================================

// GetMyProgress retrieves the progress for the current user in a course
func (s *ProgressService) GetMyProgress(ctx context.Context, courseID, userID, tenantID uuid.UUID) (*domain.CourseProgressDetailResponse, error) {
	log.Printf("[ProgressService] GetMyProgress - userID: %s, courseID: %s", userID, courseID)

	// Get progress
	progress, err := s.repo.GetProgressByUserAndCourse(ctx, userID, courseID, tenantID)
	if err != nil {
		log.Printf("[ProgressService] Error getting progress: %v", err)
		return nil, err
	}

	// Get recent snapshots (last 5)
	snapshots, _, err := s.repo.ListSnapshotsByProgress(ctx, userID, courseID, tenantID, 1, 5)
	if err != nil {
		log.Printf("[ProgressService] Error getting snapshots: %v", err)
		// Don't fail if snapshots can't be retrieved
		snapshots = []*domain.ProgressSnapshot{}
	}

	return domain.CourseProgressToDetailResponse(progress, snapshots), nil
}

// GetMyProgressList retrieves all progress for the current user
func (s *ProgressService) GetMyProgressList(ctx context.Context, userID, tenantID uuid.UUID, page, pageSize int) ([]*domain.CourseProgressResponse, int, error) {
	log.Printf("[ProgressService] GetMyProgressList - userID: %s", userID)

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Get progress list
	progressList, totalCount, err := s.repo.ListProgressByUser(ctx, userID, tenantID, page, pageSize)
	if err != nil {
		log.Printf("[ProgressService] Error listing progress: %v", err)
		return nil, 0, err
	}

	// Convert to response DTOs
	responses := make([]*domain.CourseProgressResponse, len(progressList))
	for i, progress := range progressList {
		responses[i] = domain.CourseProgressToResponse(progress)
	}

	return responses, totalCount, nil
}

// GetMyProgressSummary retrieves a summary of progress across all courses for the current user
func (s *ProgressService) GetMyProgressSummary(ctx context.Context, userID, tenantID uuid.UUID) (*domain.ProgressSummaryResponse, error) {
	log.Printf("[ProgressService] GetMyProgressSummary - userID: %s", userID)

	// Get summary from repository
	summary, err := s.repo.GetUserProgressSummary(ctx, userID, tenantID)
	if err != nil {
		log.Printf("[ProgressService] Error getting summary: %v", err)
		return nil, err
	}

	return summary, nil
}

// UpdateMyProgress updates the progress for the current user in a course
func (s *ProgressService) UpdateMyProgress(ctx context.Context, courseID, userID, tenantID uuid.UUID, req *domain.UpdateProgressRequest) (*domain.CourseProgressResponse, error) {
	log.Printf("[ProgressService] UpdateMyProgress - userID: %s, courseID: %s", userID, courseID)

	// Validate request
	if err := req.Validate(); err != nil {
		return nil, err
	}

	// Get current progress
	progress, err := s.repo.GetProgressByUserAndCourse(ctx, userID, courseID, tenantID)
	if err != nil {
		log.Printf("[ProgressService] Error getting progress: %v", err)
		return nil, err
	}

	// Check if already completed
	if progress.IsCompleted() {
		return nil, ports.ErrProgressAlreadyCompleted
	}

	// Store old progress percentage for milestone detection
	oldPercentage := progress.ProgressPercentage

	// Update progress
	progress.UpdateProgress(req.CompletedLessons, req.CompletedQuizzes, req.TimeSpent)

	// Save to repository
	if err := s.repo.UpdateProgress(ctx, progress); err != nil {
		log.Printf("[ProgressService] Error updating progress: %v", err)
		return nil, ports.ErrProgressUpdateFailed
	}

	// Check for milestone achievement
	newPercentage := progress.ProgressPercentage
	if isMilestone, milestoneType := domain.IsMilestone(newPercentage); isMilestone && oldPercentage < newPercentage {
		// Create milestone snapshot
		if err := s.CreateMilestoneSnapshot(ctx, userID, courseID, tenantID, milestoneType); err != nil {
			log.Printf("[ProgressService] Warning: Failed to create milestone snapshot: %v", err)
			// Don't fail the update if snapshot creation fails
		}
	}

	return domain.CourseProgressToResponse(progress), nil
}

// RecordActivity records activity (lesson or quiz completion) and updates progress
func (s *ProgressService) RecordActivity(ctx context.Context, courseID, userID, tenantID uuid.UUID, req *domain.RecordProgressRequest) error {
	log.Printf("[ProgressService] RecordActivity - userID: %s, courseID: %s", userID, courseID)

	// Validate request
	if err := req.Validate(); err != nil {
		return err
	}

	// Get current progress
	progress, err := s.repo.GetProgressByUserAndCourse(ctx, userID, courseID, tenantID)
	if err != nil {
		log.Printf("[ProgressService] Error getting progress: %v", err)
		return err
	}

	// Update last accessed
	progress.UpdateLastAccessed()

	// If this is a completion, trigger recalculation
	if req.CompletionStatus {
		// This would typically trigger a recalculation
		// For now, we'll just update the last accessed time
		log.Printf("[ProgressService] Activity completed, triggering recalculation")

		// In a real implementation, we would:
		// 1. Count completed lessons/quizzes from lesson_completions and quiz_attempts
		// 2. Update the progress accordingly
		// For now, we just save the last accessed update
	}

	// Save to repository
	if err := s.repo.UpdateProgress(ctx, progress); err != nil {
		log.Printf("[ProgressService] Error updating progress: %v", err)
		return ports.ErrProgressUpdateFailed
	}

	return nil
}

// GetMyProgressHistory retrieves the progress history (snapshots) for the current user in a course
func (s *ProgressService) GetMyProgressHistory(ctx context.Context, courseID, userID, tenantID uuid.UUID, req *domain.GetProgressHistoryRequest) (*domain.ListProgressHistoryResponse, error) {
	log.Printf("[ProgressService] GetMyProgressHistory - userID: %s, courseID: %s", userID, courseID)

	// Validate request
	if err := req.Validate(); err != nil {
		return nil, err
	}

	var snapshots []*domain.ProgressSnapshot
	var totalCount int
	var err error

	// Check if date range is specified
	if req.StartDate != nil && req.EndDate != nil {
		snapshots, totalCount, err = s.repo.ListSnapshotsByDateRange(ctx, userID, courseID, tenantID, *req.StartDate, *req.EndDate, req.Page, req.PageSize)
	} else {
		snapshots, totalCount, err = s.repo.ListSnapshotsByProgress(ctx, userID, courseID, tenantID, req.Page, req.PageSize)
	}

	if err != nil {
		log.Printf("[ProgressService] Error getting snapshots: %v", err)
		return nil, err
	}

	return domain.ProgressSnapshotsToListResponse(snapshots, totalCount, req.Page, req.PageSize), nil
}

// ============================================================
// Instructor/Admin Progress Management
// ============================================================

// GetCourseProgress retrieves a specific course progress (instructor/admin)
func (s *ProgressService) GetCourseProgress(ctx context.Context, progressID, tenantID uuid.UUID) (*domain.CourseProgressDetailResponse, error) {
	log.Printf("[ProgressService] GetCourseProgress - progressID: %s", progressID)

	// Get progress
	progress, err := s.repo.GetProgress(ctx, progressID, tenantID)
	if err != nil {
		log.Printf("[ProgressService] Error getting progress: %v", err)
		return nil, err
	}

	// Get recent snapshots
	snapshots, _, err := s.repo.ListSnapshotsByProgress(ctx, progress.UserID, progress.CourseID, tenantID, 1, 5)
	if err != nil {
		log.Printf("[ProgressService] Error getting snapshots: %v", err)
		snapshots = []*domain.ProgressSnapshot{}
	}

	return domain.CourseProgressToDetailResponse(progress, snapshots), nil
}

// GetProgressByUser retrieves progress for a specific user and course (instructor/admin)
func (s *ProgressService) GetProgressByUser(ctx context.Context, userID, courseID, tenantID uuid.UUID) (*domain.CourseProgressDetailResponse, error) {
	log.Printf("[ProgressService] GetProgressByUser - userID: %s, courseID: %s", userID, courseID)

	// Get progress
	progress, err := s.repo.GetProgressByUserAndCourse(ctx, userID, courseID, tenantID)
	if err != nil {
		log.Printf("[ProgressService] Error getting progress: %v", err)
		return nil, err
	}

	// Get recent snapshots
	snapshots, _, err := s.repo.ListSnapshotsByProgress(ctx, userID, courseID, tenantID, 1, 5)
	if err != nil {
		log.Printf("[ProgressService] Error getting snapshots: %v", err)
		snapshots = []*domain.ProgressSnapshot{}
	}

	return domain.CourseProgressToDetailResponse(progress, snapshots), nil
}

// ListCourseProgress retrieves all progress for a course (instructor/admin)
func (s *ProgressService) ListCourseProgress(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) ([]*domain.CourseProgressResponse, int, error) {
	log.Printf("[ProgressService] ListCourseProgress - courseID: %s", courseID)

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Get progress list
	progressList, totalCount, err := s.repo.ListProgressByCourse(ctx, courseID, tenantID, page, pageSize)
	if err != nil {
		log.Printf("[ProgressService] Error listing progress: %v", err)
		return nil, 0, err
	}

	// Convert to response DTOs
	responses := make([]*domain.CourseProgressResponse, len(progressList))
	for i, progress := range progressList {
		responses[i] = domain.CourseProgressToResponse(progress)
	}

	return responses, totalCount, nil
}

// MarkProgressAsCompleted marks a progress as completed (instructor/admin)
func (s *ProgressService) MarkProgressAsCompleted(ctx context.Context, progressID, tenantID uuid.UUID, certificateID *uuid.UUID) error {
	log.Printf("[ProgressService] MarkProgressAsCompleted - progressID: %s", progressID)

	// Get progress
	progress, err := s.repo.GetProgress(ctx, progressID, tenantID)
	if err != nil {
		log.Printf("[ProgressService] Error getting progress: %v", err)
		return err
	}

	// Check if already completed
	if progress.IsCompleted() {
		return ports.ErrProgressAlreadyCompleted
	}

	// Mark as completed
	progress.MarkAsCompleted(certificateID)

	// Save to repository
	if err := s.repo.UpdateProgress(ctx, progress); err != nil {
		log.Printf("[ProgressService] Error updating progress: %v", err)
		return ports.ErrProgressUpdateFailed
	}

	// Create completion snapshot
	if err := s.CreateMilestoneSnapshot(ctx, progress.UserID, progress.CourseID, tenantID, domain.Milestone100Percent); err != nil {
		log.Printf("[ProgressService] Warning: Failed to create completion snapshot: %v", err)
	}

	return nil
}

// ResetProgress resets a user's progress in a course (instructor/admin)
func (s *ProgressService) ResetProgress(ctx context.Context, progressID, tenantID uuid.UUID) error {
	log.Printf("[ProgressService] ResetProgress - progressID: %s", progressID)

	// Get progress
	progress, err := s.repo.GetProgress(ctx, progressID, tenantID)
	if err != nil {
		log.Printf("[ProgressService] Error getting progress: %v", err)
		return err
	}

	// Reset progress data
	progress.Status = domain.ProgressStatusNotStarted
	progress.ProgressPercentage = 0
	progress.CompletedLessons = 0
	progress.CompletedQuizzes = 0
	progress.TotalTimeSpent = 0
	progress.StartedAt = nil
	progress.CompletedAt = nil
	progress.LastAccessedAt = nil
	progress.CertificateID = nil
	progress.UpdateTimestamp()

	// Save to repository
	if err := s.repo.UpdateProgress(ctx, progress); err != nil {
		log.Printf("[ProgressService] Error updating progress: %v", err)
		return ports.ErrProgressUpdateFailed
	}

	return nil
}

// DeleteProgress deletes a user's progress (instructor/admin)
func (s *ProgressService) DeleteProgress(ctx context.Context, progressID, tenantID uuid.UUID) error {
	log.Printf("[ProgressService] DeleteProgress - progressID: %s", progressID)

	// Delete from repository
	if err := s.repo.DeleteProgress(ctx, progressID, tenantID); err != nil {
		log.Printf("[ProgressService] Error deleting progress: %v", err)
		return ports.ErrProgressDeletionFailed
	}

	return nil
}

// ============================================================
// Progress Statistics (Instructor/Admin)
// ============================================================

// GetCourseStatistics retrieves statistics for a course
func (s *ProgressService) GetCourseStatistics(ctx context.Context, courseID, tenantID uuid.UUID, req *domain.GetCourseStatisticsRequest) (*domain.ProgressStatisticsResponse, error) {
	log.Printf("[ProgressService] GetCourseStatistics - courseID: %s", courseID)

	// Validate request
	if err := req.Validate(); err != nil {
		return nil, err
	}

	// Get statistics from repository
	stats, err := s.repo.GetCourseStatistics(ctx, courseID, tenantID)
	if err != nil {
		log.Printf("[ProgressService] Error getting statistics: %v", err)
		return nil, ports.ErrStatisticsFailed
	}

	// Convert to response
	response := &domain.ProgressStatisticsResponse{
		CourseID:              courseID,
		TotalStudents:         stats.TotalStudents,
		ActiveStudents:        stats.ActiveStudents,
		CompletedStudents:     stats.CompletedStudents,
		NotStartedStudents:    stats.TotalStudents - stats.ActiveStudents - stats.CompletedStudents,
		AverageProgress:       stats.AverageProgress,
		AverageTimeSpent:      stats.AverageTimeSpent,
		CompletionRate:        stats.CompletionRate,
		AverageLessonsPerUser: stats.AverageLessonsPerUser,
		AverageQuizzesPerUser: stats.AverageQuizzesPerUser,
	}

	return response, nil
}

// GetProgressAnalytics retrieves analytics for a course with optional date range
func (s *ProgressService) GetProgressAnalytics(ctx context.Context, courseID, tenantID uuid.UUID, startDate, endDate *time.Time) (interface{}, error) {
	log.Printf("[ProgressService] GetProgressAnalytics - courseID: %s", courseID)

	// Get basic statistics
	stats, err := s.repo.GetCourseStatistics(ctx, courseID, tenantID)
	if err != nil {
		log.Printf("[ProgressService] Error getting statistics: %v", err)
		return nil, ports.ErrStatisticsFailed
	}

	// Build analytics response
	analytics := map[string]interface{}{
		"courseId":              courseID,
		"totalStudents":         stats.TotalStudents,
		"activeStudents":        stats.ActiveStudents,
		"completedStudents":     stats.CompletedStudents,
		"notStartedStudents":    stats.TotalStudents - stats.ActiveStudents - stats.CompletedStudents,
		"averageProgress":       stats.AverageProgress,
		"averageTimeSpent":      stats.AverageTimeSpent,
		"completionRate":        stats.CompletionRate,
		"averageLessonsPerUser": stats.AverageLessonsPerUser,
		"averageQuizzesPerUser": stats.AverageQuizzesPerUser,
	}

	// Add date range if specified
	if startDate != nil && endDate != nil {
		analytics["startDate"] = startDate
		analytics["endDate"] = endDate
	}

	return analytics, nil
}

// ============================================================
// Snapshot Management
// ============================================================

// CreateMilestoneSnapshot creates a snapshot for a milestone achievement
func (s *ProgressService) CreateMilestoneSnapshot(ctx context.Context, userID, courseID, tenantID uuid.UUID, milestoneType domain.MilestoneType) error {
	log.Printf("[ProgressService] CreateMilestoneSnapshot - userID: %s, courseID: %s, milestone: %s", userID, courseID, milestoneType)

	// Get current progress
	progress, err := s.repo.GetProgressByUserAndCourse(ctx, userID, courseID, tenantID)
	if err != nil {
		log.Printf("[ProgressService] Error getting progress: %v", err)
		return err
	}

	// Create snapshot
	snapshot := domain.NewProgressSnapshot(
		tenantID,
		userID,
		courseID,
		progress.EnrollmentID,
		progress.ProgressPercentage,
		progress.CompletedLessons,
		progress.CompletedQuizzes,
		progress.TotalTimeSpent,
		milestoneType,
	)

	// Save to repository
	if err := s.repo.CreateSnapshot(ctx, snapshot); err != nil {
		log.Printf("[ProgressService] Error creating snapshot: %v", err)
		return ports.ErrSnapshotCreationFailed
	}

	return nil
}

// GetProgressSnapshots retrieves snapshots for a user's progress in a course
func (s *ProgressService) GetProgressSnapshots(ctx context.Context, userID, courseID, tenantID uuid.UUID, page, pageSize int) (*domain.ListProgressHistoryResponse, error) {
	log.Printf("[ProgressService] GetProgressSnapshots - userID: %s, courseID: %s", userID, courseID)

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Get snapshots
	snapshots, totalCount, err := s.repo.ListSnapshotsByProgress(ctx, userID, courseID, tenantID, page, pageSize)
	if err != nil {
		log.Printf("[ProgressService] Error getting snapshots: %v", err)
		return nil, err
	}

	return domain.ProgressSnapshotsToListResponse(snapshots, totalCount, page, pageSize), nil
}

// ============================================================
// System Operations
// ============================================================

// InitializeProgress creates initial progress for a user enrollment
func (s *ProgressService) InitializeProgress(ctx context.Context, enrollmentID, userID, courseID, tenantID uuid.UUID, totalLessons, totalQuizzes int) (*domain.CourseProgressResponse, error) {
	log.Printf("[ProgressService] InitializeProgress - enrollmentID: %s, userID: %s, courseID: %s", enrollmentID, userID, courseID)

	// Check if progress already exists
	exists, err := s.repo.ProgressExists(ctx, userID, courseID, tenantID)
	if err != nil {
		log.Printf("[ProgressService] Error checking if progress exists: %v", err)
		return nil, err
	}

	if exists {
		return nil, ports.ErrProgressAlreadyExists
	}

	// Create new progress
	progress := domain.NewCourseProgress(tenantID, userID, courseID, enrollmentID, totalLessons, totalQuizzes)

	// Save to repository
	if err := s.repo.CreateProgress(ctx, progress); err != nil {
		log.Printf("[ProgressService] Error creating progress: %v", err)
		return nil, ports.ErrProgressCreationFailed
	}

	return domain.CourseProgressToResponse(progress), nil
}

// RecalculateProgress recalculates progress based on actual completions
func (s *ProgressService) RecalculateProgress(ctx context.Context, userID, courseID, tenantID uuid.UUID) (*domain.CourseProgressResponse, error) {
	log.Printf("[ProgressService] RecalculateProgress - userID: %s, courseID: %s", userID, courseID)

	// Get current progress
	progress, err := s.repo.GetProgressByUserAndCourse(ctx, userID, courseID, tenantID)
	if err != nil {
		log.Printf("[ProgressService] Error getting progress: %v", err)
		return nil, err
	}

	// In a real implementation, we would:
	// 1. Query lesson_completions to count completed lessons
	// 2. Query quiz_attempts to count completed quizzes
	// 3. Sum up time spent from both
	// 4. Update the progress entity

	// For now, we'll just recalculate the percentage based on current data
	progress.ProgressPercentage = progress.CalculateProgressPercentage()
	progress.UpdateTimestamp()

	// Save to repository
	if err := s.repo.UpdateProgress(ctx, progress); err != nil {
		log.Printf("[ProgressService] Error updating progress: %v", err)
		return nil, ports.ErrProgressUpdateFailed
	}

	return domain.CourseProgressToResponse(progress), nil
}

// SyncProgressFromEnrollment syncs progress with enrollment data
func (s *ProgressService) SyncProgressFromEnrollment(ctx context.Context, enrollmentID, tenantID uuid.UUID) error {
	log.Printf("[ProgressService] SyncProgressFromEnrollment - enrollmentID: %s", enrollmentID)

	// Get progress by enrollment
	progress, err := s.repo.GetProgressByEnrollment(ctx, enrollmentID, tenantID)
	if err != nil {
		log.Printf("[ProgressService] Error getting progress: %v", err)
		return err
	}

	// In a real implementation, we would:
	// 1. Get enrollment data
	// 2. Sync status, dates, certificate, etc.
	// 3. Update progress accordingly

	// For now, just update the timestamp
	progress.UpdateTimestamp()

	// Save to repository
	if err := s.repo.UpdateProgress(ctx, progress); err != nil {
		log.Printf("[ProgressService] Error updating progress: %v", err)
		return ports.ErrProgressUpdateFailed
	}

	return nil
}
