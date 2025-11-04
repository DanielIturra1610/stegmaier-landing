package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// ============================================================
// Request DTOs
// ============================================================

// UpdateProgressRequest represents a request to update course progress
type UpdateProgressRequest struct {
	CompletedLessons int `json:"completedLessons"`
	CompletedQuizzes int `json:"completedQuizzes"`
	TimeSpent        int `json:"timeSpent"` // Time in minutes
}

// CompleteCourseRequest represents a request to mark a course as completed
type CompleteCourseRequest struct {
	CertificateID *uuid.UUID `json:"certificateId,omitempty"`
}

// RecordProgressRequest represents a request to record progress
type RecordProgressRequest struct {
	LessonID         *uuid.UUID `json:"lessonId,omitempty"`
	QuizID           *uuid.UUID `json:"quizId,omitempty"`
	TimeSpent        int        `json:"timeSpent"` // Time in minutes
	CompletionStatus bool       `json:"completionStatus"`
}

// GetProgressHistoryRequest represents a request to get progress history
type GetProgressHistoryRequest struct {
	Page       int        `json:"page"`
	PageSize   int        `json:"pageSize"`
	StartDate  *time.Time `json:"startDate,omitempty"`
	EndDate    *time.Time `json:"endDate,omitempty"`
	Milestone  *string    `json:"milestone,omitempty"`
	SortBy     *string    `json:"sortBy,omitempty"`     // snapshot_date
	SortOrder  *string    `json:"sortOrder,omitempty"`  // asc, desc
}

// GetCourseStatisticsRequest represents filters for course statistics
type GetCourseStatisticsRequest struct {
	StartDate *time.Time      `json:"startDate,omitempty"`
	EndDate   *time.Time      `json:"endDate,omitempty"`
	Status    *ProgressStatus `json:"status,omitempty"`
}

// ============================================================
// Response DTOs
// ============================================================

// CourseProgressResponse represents a course progress in responses
type CourseProgressResponse struct {
	ID                 uuid.UUID      `json:"id"`
	TenantID           uuid.UUID      `json:"tenantId"`
	UserID             uuid.UUID      `json:"userId"`
	UserName           *string        `json:"userName,omitempty"` // Populated from user service
	CourseID           uuid.UUID      `json:"courseId"`
	CourseName         *string        `json:"courseName,omitempty"` // Populated from course
	EnrollmentID       uuid.UUID      `json:"enrollmentId"`
	Status             ProgressStatus `json:"status"`
	ProgressPercentage int            `json:"progressPercentage"`
	CompletedLessons   int            `json:"completedLessons"`
	TotalLessons       int            `json:"totalLessons"`
	CompletedQuizzes   int            `json:"completedQuizzes"`
	TotalQuizzes       int            `json:"totalQuizzes"`
	TotalTimeSpent     int            `json:"totalTimeSpent"`     // In minutes
	CompletionRate     float64        `json:"completionRate"`     // 0.0 to 1.0
	EstimatedTimeLeft  *int           `json:"estimatedTimeLeft,omitempty"` // Estimated minutes left
	StartedAt          *time.Time     `json:"startedAt,omitempty"`
	CompletedAt        *time.Time     `json:"completedAt,omitempty"`
	LastAccessedAt     *time.Time     `json:"lastAccessedAt,omitempty"`
	CertificateID      *uuid.UUID     `json:"certificateId,omitempty"`
	CreatedAt          time.Time      `json:"createdAt"`
	UpdatedAt          time.Time      `json:"updatedAt"`
}

// CourseProgressDetailResponse represents detailed course progress information
type CourseProgressDetailResponse struct {
	*CourseProgressResponse
	DaysActive            int                       `json:"daysActive"`
	AverageTimePerDay     float64                   `json:"averageTimePerDay"` // Minutes
	MilestonesAchieved    []MilestoneType           `json:"milestonesAchieved"`
	RecentSnapshots       []*ProgressSnapshotResponse `json:"recentSnapshots,omitempty"`
	LessonCompletionRate  float64                   `json:"lessonCompletionRate"`  // Percentage
	QuizCompletionRate    float64                   `json:"quizCompletionRate"`    // Percentage
}

// ProgressSnapshotResponse represents a progress snapshot in responses
type ProgressSnapshotResponse struct {
	ID                 uuid.UUID     `json:"id"`
	UserID             uuid.UUID     `json:"userId"`
	CourseID           uuid.UUID     `json:"courseId"`
	ProgressPercentage int           `json:"progressPercentage"`
	CompletedLessons   int           `json:"completedLessons"`
	CompletedQuizzes   int           `json:"completedQuizzes"`
	TotalTimeSpent     int           `json:"totalTimeSpent"`
	MilestoneType      MilestoneType `json:"milestoneType"`
	MilestoneData      *string       `json:"milestoneData,omitempty"`
	SnapshotDate       time.Time     `json:"snapshotDate"`
	CreatedAt          time.Time     `json:"createdAt"`
}

// ProgressStatisticsResponse represents course progress statistics in responses
type ProgressStatisticsResponse struct {
	CourseID              uuid.UUID `json:"courseId"`
	CourseName            *string   `json:"courseName,omitempty"`
	TotalStudents         int       `json:"totalStudents"`
	ActiveStudents        int       `json:"activeStudents"`
	CompletedStudents     int       `json:"completedStudents"`
	NotStartedStudents    int       `json:"notStartedStudents"`
	AverageProgress       float64   `json:"averageProgress"`       // Percentage
	AverageTimeSpent      float64   `json:"averageTimeSpent"`      // Minutes
	CompletionRate        float64   `json:"completionRate"`        // Percentage
	AverageLessonsPerUser float64   `json:"averageLessonsPerUser"`
	AverageQuizzesPerUser float64   `json:"averageQuizzesPerUser"`
}

// ListProgressHistoryResponse represents paginated progress history
type ListProgressHistoryResponse struct {
	Snapshots  []*ProgressSnapshotResponse `json:"snapshots"`
	TotalCount int                         `json:"totalCount"`
	Page       int                         `json:"page"`
	PageSize   int                         `json:"pageSize"`
	TotalPages int                         `json:"totalPages"`
}

// ProgressSummaryResponse represents a summary of progress across multiple courses
type ProgressSummaryResponse struct {
	TotalCourses      int     `json:"totalCourses"`
	InProgressCourses int     `json:"inProgressCourses"`
	CompletedCourses  int     `json:"completedCourses"`
	AverageProgress   float64 `json:"averageProgress"`   // Percentage
	TotalTimeSpent    int     `json:"totalTimeSpent"`    // Minutes
	TotalCertificates int     `json:"totalCertificates"`
}

// ============================================================
// Validation Methods
// ============================================================

// Validate validates the UpdateProgressRequest
func (r *UpdateProgressRequest) Validate() error {
	if r.CompletedLessons < 0 {
		return errors.New("completed lessons cannot be negative")
	}
	if r.CompletedQuizzes < 0 {
		return errors.New("completed quizzes cannot be negative")
	}
	if r.TimeSpent < 0 {
		return errors.New("time spent cannot be negative")
	}
	return nil
}

// Validate validates the RecordProgressRequest
func (r *RecordProgressRequest) Validate() error {
	if r.LessonID == nil && r.QuizID == nil {
		return errors.New("either lesson ID or quiz ID must be provided")
	}
	if r.LessonID != nil && r.QuizID != nil {
		return errors.New("cannot record progress for both lesson and quiz at the same time")
	}
	if r.TimeSpent < 0 {
		return errors.New("time spent cannot be negative")
	}
	return nil
}

// Validate validates the GetProgressHistoryRequest
func (r *GetProgressHistoryRequest) Validate() error {
	if r.Page < 1 {
		r.Page = 1
	}
	if r.PageSize < 1 {
		r.PageSize = 20
	}
	if r.PageSize > 100 {
		r.PageSize = 100
	}
	if r.StartDate != nil && r.EndDate != nil && r.StartDate.After(*r.EndDate) {
		return errors.New("start date cannot be after end date")
	}
	if r.SortBy != nil {
		validSortBy := map[string]bool{
			"snapshot_date": true,
		}
		if !validSortBy[*r.SortBy] {
			return errors.New("invalid sort by field")
		}
	}
	if r.SortOrder != nil {
		if *r.SortOrder != "asc" && *r.SortOrder != "desc" {
			return errors.New("sort order must be 'asc' or 'desc'")
		}
	}
	return nil
}

// Validate validates the GetCourseStatisticsRequest
func (r *GetCourseStatisticsRequest) Validate() error {
	if r.StartDate != nil && r.EndDate != nil && r.StartDate.After(*r.EndDate) {
		return errors.New("start date cannot be after end date")
	}
	if r.Status != nil && !ValidateProgressStatus(*r.Status) {
		return errors.New("invalid progress status")
	}
	return nil
}

// ============================================================
// Conversion Functions
// ============================================================

// CourseProgressToResponse converts a CourseProgress entity to CourseProgressResponse
func CourseProgressToResponse(progress *CourseProgress) *CourseProgressResponse {
	return &CourseProgressResponse{
		ID:                 progress.ID,
		TenantID:           progress.TenantID,
		UserID:             progress.UserID,
		CourseID:           progress.CourseID,
		EnrollmentID:       progress.EnrollmentID,
		Status:             progress.Status,
		ProgressPercentage: progress.ProgressPercentage,
		CompletedLessons:   progress.CompletedLessons,
		TotalLessons:       progress.TotalLessons,
		CompletedQuizzes:   progress.CompletedQuizzes,
		TotalQuizzes:       progress.TotalQuizzes,
		TotalTimeSpent:     progress.TotalTimeSpent,
		CompletionRate:     progress.GetCompletionRate(),
		StartedAt:          progress.StartedAt,
		CompletedAt:        progress.CompletedAt,
		LastAccessedAt:     progress.LastAccessedAt,
		CertificateID:      progress.CertificateID,
		CreatedAt:          progress.CreatedAt,
		UpdatedAt:          progress.UpdatedAt,
	}
}

// CourseProgressToDetailResponse converts a CourseProgress entity to CourseProgressDetailResponse
func CourseProgressToDetailResponse(progress *CourseProgress, snapshots []*ProgressSnapshot) *CourseProgressDetailResponse {
	// Calculate days active
	daysActive := 0
	if progress.StartedAt != nil {
		daysActive = int(time.Since(*progress.StartedAt).Hours() / 24)
		if daysActive < 1 {
			daysActive = 1
		}
	}

	// Calculate average time per day
	averageTimePerDay := 0.0
	if daysActive > 0 {
		averageTimePerDay = float64(progress.TotalTimeSpent) / float64(daysActive)
	}

	// Calculate milestones achieved
	milestonesAchieved := []MilestoneType{}
	if progress.ProgressPercentage >= 25 {
		milestonesAchieved = append(milestonesAchieved, Milestone25Percent)
	}
	if progress.ProgressPercentage >= 50 {
		milestonesAchieved = append(milestonesAchieved, Milestone50Percent)
	}
	if progress.ProgressPercentage >= 75 {
		milestonesAchieved = append(milestonesAchieved, Milestone75Percent)
	}
	if progress.ProgressPercentage >= 100 {
		milestonesAchieved = append(milestonesAchieved, Milestone100Percent)
	}

	// Convert snapshots
	snapshotResponses := make([]*ProgressSnapshotResponse, len(snapshots))
	for i, snapshot := range snapshots {
		snapshotResponses[i] = ProgressSnapshotToResponse(snapshot)
	}

	// Calculate completion rates
	lessonCompletionRate := 0.0
	if progress.TotalLessons > 0 {
		lessonCompletionRate = (float64(progress.CompletedLessons) / float64(progress.TotalLessons)) * 100
	}

	quizCompletionRate := 0.0
	if progress.TotalQuizzes > 0 {
		quizCompletionRate = (float64(progress.CompletedQuizzes) / float64(progress.TotalQuizzes)) * 100
	}

	return &CourseProgressDetailResponse{
		CourseProgressResponse: CourseProgressToResponse(progress),
		DaysActive:            daysActive,
		AverageTimePerDay:     averageTimePerDay,
		MilestonesAchieved:    milestonesAchieved,
		RecentSnapshots:       snapshotResponses,
		LessonCompletionRate:  lessonCompletionRate,
		QuizCompletionRate:    quizCompletionRate,
	}
}

// ProgressSnapshotToResponse converts a ProgressSnapshot entity to ProgressSnapshotResponse
func ProgressSnapshotToResponse(snapshot *ProgressSnapshot) *ProgressSnapshotResponse {
	return &ProgressSnapshotResponse{
		ID:                 snapshot.ID,
		UserID:             snapshot.UserID,
		CourseID:           snapshot.CourseID,
		ProgressPercentage: snapshot.ProgressPercentage,
		CompletedLessons:   snapshot.CompletedLessons,
		CompletedQuizzes:   snapshot.CompletedQuizzes,
		TotalTimeSpent:     snapshot.TotalTimeSpent,
		MilestoneType:      snapshot.MilestoneType,
		MilestoneData:      snapshot.MilestoneData,
		SnapshotDate:       snapshot.SnapshotDate,
		CreatedAt:          snapshot.CreatedAt,
	}
}

// ProgressSnapshotsToListResponse converts a slice of snapshots to ListProgressHistoryResponse
func ProgressSnapshotsToListResponse(snapshots []*ProgressSnapshot, totalCount, page, pageSize int) *ListProgressHistoryResponse {
	snapshotResponses := make([]*ProgressSnapshotResponse, len(snapshots))
	for i, snapshot := range snapshots {
		snapshotResponses[i] = ProgressSnapshotToResponse(snapshot)
	}

	totalPages := (totalCount + pageSize - 1) / pageSize

	return &ListProgressHistoryResponse{
		Snapshots:  snapshotResponses,
		TotalCount: totalCount,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}
}
