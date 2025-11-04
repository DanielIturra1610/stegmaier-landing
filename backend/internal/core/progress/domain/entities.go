package domain

import (
	"time"

	"github.com/google/uuid"
)

// ProgressStatus represents the status of course progress
type ProgressStatus string

const (
	ProgressStatusNotStarted ProgressStatus = "not_started"
	ProgressStatusInProgress ProgressStatus = "in_progress"
	ProgressStatusCompleted  ProgressStatus = "completed"
)

// MilestoneType represents types of progress milestones
type MilestoneType string

const (
	MilestoneStart      MilestoneType = "start"       // Course started
	Milestone25Percent  MilestoneType = "25_percent"  // 25% complete
	Milestone50Percent  MilestoneType = "50_percent"  // 50% complete
	Milestone75Percent  MilestoneType = "75_percent"  // 75% complete
	Milestone100Percent MilestoneType = "100_percent" // 100% complete
	MilestoneCustom     MilestoneType = "custom"      // Custom milestone
)

// ============================================================
// Course Progress Entity
// ============================================================

// CourseProgress represents the overall progress of a user in a course
type CourseProgress struct {
	ID                 uuid.UUID      `json:"id"`
	TenantID           uuid.UUID      `json:"tenantId"`
	UserID             uuid.UUID      `json:"userId"`
	CourseID           uuid.UUID      `json:"courseId"`
	EnrollmentID       uuid.UUID      `json:"enrollmentId"`
	Status             ProgressStatus `json:"status"`
	ProgressPercentage int            `json:"progressPercentage"` // 0-100
	CompletedLessons   int            `json:"completedLessons"`
	TotalLessons       int            `json:"totalLessons"`
	CompletedQuizzes   int            `json:"completedQuizzes"`
	TotalQuizzes       int            `json:"totalQuizzes"`
	TotalTimeSpent     int            `json:"totalTimeSpent"`     // Total time in minutes
	StartedAt          *time.Time     `json:"startedAt,omitempty"`
	CompletedAt        *time.Time     `json:"completedAt,omitempty"`
	LastAccessedAt     *time.Time     `json:"lastAccessedAt,omitempty"`
	CertificateID      *uuid.UUID     `json:"certificateId,omitempty"`
	CreatedAt          time.Time      `json:"createdAt"`
	UpdatedAt          time.Time      `json:"updatedAt"`
}

// NewCourseProgress creates a new course progress
func NewCourseProgress(tenantID, userID, courseID, enrollmentID uuid.UUID, totalLessons, totalQuizzes int) *CourseProgress {
	now := time.Now().UTC()
	return &CourseProgress{
		ID:                 uuid.New(),
		TenantID:           tenantID,
		UserID:             userID,
		CourseID:           courseID,
		EnrollmentID:       enrollmentID,
		Status:             ProgressStatusNotStarted,
		ProgressPercentage: 0,
		CompletedLessons:   0,
		TotalLessons:       totalLessons,
		CompletedQuizzes:   0,
		TotalQuizzes:       totalQuizzes,
		TotalTimeSpent:     0,
		CreatedAt:          now,
		UpdatedAt:          now,
	}
}

// UpdateTimestamp updates the UpdatedAt field
func (cp *CourseProgress) UpdateTimestamp() {
	cp.UpdatedAt = time.Now().UTC()
}

// MarkAsStarted marks the course progress as started
func (cp *CourseProgress) MarkAsStarted() {
	if cp.Status == ProgressStatusNotStarted {
		now := time.Now().UTC()
		cp.Status = ProgressStatusInProgress
		cp.StartedAt = &now
		cp.LastAccessedAt = &now
		cp.UpdateTimestamp()
	}
}

// MarkAsCompleted marks the course progress as completed
func (cp *CourseProgress) MarkAsCompleted(certificateID *uuid.UUID) {
	now := time.Now().UTC()
	cp.Status = ProgressStatusCompleted
	cp.ProgressPercentage = 100
	cp.CompletedAt = &now
	cp.LastAccessedAt = &now
	cp.CertificateID = certificateID
	cp.UpdateTimestamp()
}

// UpdateLastAccessed updates the last accessed timestamp
func (cp *CourseProgress) UpdateLastAccessed() {
	now := time.Now().UTC()
	cp.LastAccessedAt = &now
	cp.UpdateTimestamp()
}

// UpdateProgress updates the progress based on completions
func (cp *CourseProgress) UpdateProgress(completedLessons, completedQuizzes, timeSpent int) {
	cp.CompletedLessons = completedLessons
	cp.CompletedQuizzes = completedQuizzes
	cp.TotalTimeSpent = timeSpent

	// Calculate progress percentage
	cp.ProgressPercentage = cp.CalculateProgressPercentage()

	// Update status
	if cp.ProgressPercentage > 0 && cp.Status == ProgressStatusNotStarted {
		cp.MarkAsStarted()
	} else if cp.ProgressPercentage == 100 && cp.Status != ProgressStatusCompleted {
		// Auto-complete if 100%
		now := time.Now().UTC()
		cp.Status = ProgressStatusCompleted
		cp.CompletedAt = &now
	} else if cp.ProgressPercentage > 0 && cp.ProgressPercentage < 100 {
		cp.Status = ProgressStatusInProgress
	}

	cp.UpdateLastAccessed()
}

// CalculateProgressPercentage calculates the progress percentage
func (cp *CourseProgress) CalculateProgressPercentage() int {
	totalItems := cp.TotalLessons + cp.TotalQuizzes
	if totalItems == 0 {
		return 0
	}

	completedItems := cp.CompletedLessons + cp.CompletedQuizzes
	percentage := (completedItems * 100) / totalItems

	// Ensure it's between 0 and 100
	if percentage > 100 {
		percentage = 100
	}
	if percentage < 0 {
		percentage = 0
	}

	return percentage
}

// IsCompleted returns true if the course progress is completed
func (cp *CourseProgress) IsCompleted() bool {
	return cp.Status == ProgressStatusCompleted
}

// IsStarted returns true if the course progress has been started
func (cp *CourseProgress) IsStarted() bool {
	return cp.Status != ProgressStatusNotStarted
}

// CanBeCompleted returns true if the course can be marked as completed
func (cp *CourseProgress) CanBeCompleted() bool {
	// Can be completed if all lessons and quizzes are done
	return cp.CompletedLessons >= cp.TotalLessons &&
		cp.CompletedQuizzes >= cp.TotalQuizzes &&
		cp.Status != ProgressStatusCompleted
}

// GetCompletionRate returns the completion rate as a float (0.0 to 1.0)
func (cp *CourseProgress) GetCompletionRate() float64 {
	return float64(cp.ProgressPercentage) / 100.0
}

// ============================================================
// Progress Snapshot Entity
// ============================================================

// ProgressSnapshot represents a snapshot of progress at a specific point in time
type ProgressSnapshot struct {
	ID                 uuid.UUID     `json:"id"`
	TenantID           uuid.UUID     `json:"tenantId"`
	UserID             uuid.UUID     `json:"userId"`
	CourseID           uuid.UUID     `json:"courseId"`
	EnrollmentID       uuid.UUID     `json:"enrollmentId"`
	ProgressPercentage int           `json:"progressPercentage"` // 0-100
	CompletedLessons   int           `json:"completedLessons"`
	CompletedQuizzes   int           `json:"completedQuizzes"`
	TotalTimeSpent     int           `json:"totalTimeSpent"` // Total time in minutes
	MilestoneType      MilestoneType `json:"milestoneType"`
	MilestoneData      *string       `json:"milestoneData,omitempty"` // JSON data for custom milestones
	SnapshotDate       time.Time     `json:"snapshotDate"`
	CreatedAt          time.Time     `json:"createdAt"`
}

// NewProgressSnapshot creates a new progress snapshot
func NewProgressSnapshot(
	tenantID, userID, courseID, enrollmentID uuid.UUID,
	progressPercentage, completedLessons, completedQuizzes, totalTimeSpent int,
	milestoneType MilestoneType,
) *ProgressSnapshot {
	now := time.Now().UTC()
	return &ProgressSnapshot{
		ID:                 uuid.New(),
		TenantID:           tenantID,
		UserID:             userID,
		CourseID:           courseID,
		EnrollmentID:       enrollmentID,
		ProgressPercentage: progressPercentage,
		CompletedLessons:   completedLessons,
		CompletedQuizzes:   completedQuizzes,
		TotalTimeSpent:     totalTimeSpent,
		MilestoneType:      milestoneType,
		SnapshotDate:       now,
		CreatedAt:          now,
	}
}

// IsMilestone checks if a given progress percentage represents a milestone
func IsMilestone(progressPercentage int) (bool, MilestoneType) {
	switch progressPercentage {
	case 0:
		return false, ""
	case 25:
		return true, Milestone25Percent
	case 50:
		return true, Milestone50Percent
	case 75:
		return true, Milestone75Percent
	case 100:
		return true, Milestone100Percent
	default:
		return false, ""
	}
}

// ============================================================
// Progress Statistics
// ============================================================

// ProgressStatistics represents aggregated progress statistics
type ProgressStatistics struct {
	TotalStudents         int     `json:"totalStudents"`
	ActiveStudents        int     `json:"activeStudents"`
	CompletedStudents     int     `json:"completedStudents"`
	AverageProgress       float64 `json:"averageProgress"`
	AverageTimeSpent      float64 `json:"averageTimeSpent"`      // In minutes
	CompletionRate        float64 `json:"completionRate"`        // Percentage
	AverageLessonsPerUser float64 `json:"averageLessonsPerUser"`
	AverageQuizzesPerUser float64 `json:"averageQuizzesPerUser"`
}

// ============================================================
// Validation Functions
// ============================================================

// ValidateProgressStatus checks if the progress status is valid
func ValidateProgressStatus(status ProgressStatus) bool {
	switch status {
	case ProgressStatusNotStarted, ProgressStatusInProgress, ProgressStatusCompleted:
		return true
	default:
		return false
	}
}

// ValidateMilestoneType checks if the milestone type is valid
func ValidateMilestoneType(milestoneType MilestoneType) bool {
	switch milestoneType {
	case MilestoneStart, Milestone25Percent, Milestone50Percent, Milestone75Percent, Milestone100Percent, MilestoneCustom:
		return true
	default:
		return false
	}
}

// ValidateProgressPercentage checks if the progress percentage is valid
func ValidateProgressPercentage(percentage int) bool {
	return percentage >= 0 && percentage <= 100
}
