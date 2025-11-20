package domain

import (
	"time"

	"github.com/google/uuid"
)

// ============================================================================
// Request DTOs
// ============================================================================

// GetAnalyticsRequest represents a request for analytics with date range
type GetAnalyticsRequest struct {
	StartDate *time.Time `json:"start_date,omitempty"`
	EndDate   *time.Time `json:"end_date,omitempty"`
	Period    string     `json:"period,omitempty"` // "day", "week", "month", "year"
}

// Validate validates the analytics request
func (r *GetAnalyticsRequest) Validate() error {
	if r.StartDate != nil && r.EndDate != nil {
		if r.StartDate.After(*r.EndDate) {
			return ErrInvalidDateRange
		}
	}

	if r.Period != "" {
		validPeriods := map[string]bool{
			"day":   true,
			"week":  true,
			"month": true,
			"year":  true,
		}
		if !validPeriods[r.Period] {
			return ErrInvalidPeriod
		}
	}

	return nil
}

// SetDefaults sets default values for the request
func (r *GetAnalyticsRequest) SetDefaults() {
	now := time.Now()
	if r.StartDate == nil {
		// Default to 30 days ago
		startDate := now.AddDate(0, 0, -30)
		r.StartDate = &startDate
	}
	if r.EndDate == nil {
		r.EndDate = &now
	}
	if r.Period == "" {
		r.Period = "day"
	}
}

// GetCourseAnalyticsRequest represents request for course analytics
type GetCourseAnalyticsRequest struct {
	CourseID  uuid.UUID  `json:"course_id"`
	StartDate *time.Time `json:"start_date,omitempty"`
	EndDate   *time.Time `json:"end_date,omitempty"`
}

// Validate validates the course analytics request
func (r *GetCourseAnalyticsRequest) Validate() error {
	if r.CourseID == uuid.Nil {
		return ErrInvalidCourseID
	}
	if r.StartDate != nil && r.EndDate != nil {
		if r.StartDate.After(*r.EndDate) {
			return ErrInvalidDateRange
		}
	}
	return nil
}

// GetStudentAnalyticsRequest represents request for student analytics
type GetStudentAnalyticsRequest struct {
	StudentID uuid.UUID  `json:"student_id"`
	CourseID  *uuid.UUID `json:"course_id,omitempty"` // optional, for course-specific analytics
	StartDate *time.Time `json:"start_date,omitempty"`
	EndDate   *time.Time `json:"end_date,omitempty"`
}

// Validate validates the student analytics request
func (r *GetStudentAnalyticsRequest) Validate() error {
	if r.StudentID == uuid.Nil {
		return ErrInvalidStudentID
	}
	if r.StartDate != nil && r.EndDate != nil {
		if r.StartDate.After(*r.EndDate) {
			return ErrInvalidDateRange
		}
	}
	return nil
}

// GetInstructorAnalyticsRequest represents request for instructor analytics
type GetInstructorAnalyticsRequest struct {
	InstructorID uuid.UUID  `json:"instructor_id"`
	StartDate    *time.Time `json:"start_date,omitempty"`
	EndDate      *time.Time `json:"end_date,omitempty"`
}

// Validate validates the instructor analytics request
func (r *GetInstructorAnalyticsRequest) Validate() error {
	if r.InstructorID == uuid.Nil {
		return ErrInvalidInstructorID
	}
	if r.StartDate != nil && r.EndDate != nil {
		if r.StartDate.After(*r.EndDate) {
			return ErrInvalidDateRange
		}
	}
	return nil
}

// GetLeaderboardRequest represents request for leaderboard data
type GetLeaderboardRequest struct {
	Metric   string     `json:"metric"` // "courses_completed", "quiz_score", "time_spent", etc.
	CourseID *uuid.UUID `json:"course_id,omitempty"` // optional, for course-specific leaderboard
	Limit    int        `json:"limit,omitempty"` // default 10
	Period   string     `json:"period,omitempty"` // "week", "month", "all-time"
}

// Validate validates the leaderboard request
func (r *GetLeaderboardRequest) Validate() error {
	if r.Metric == "" {
		return ErrInvalidMetric
	}

	validMetrics := map[string]bool{
		"courses_completed": true,
		"quiz_score":        true,
		"time_spent":        true,
		"certificates":      true,
	}
	if !validMetrics[r.Metric] {
		return ErrInvalidMetric
	}

	if r.Limit <= 0 {
		r.Limit = 10
	}
	if r.Limit > 100 {
		r.Limit = 100
	}

	if r.Period == "" {
		r.Period = "all-time"
	}

	validPeriods := map[string]bool{
		"week":     true,
		"month":    true,
		"all-time": true,
	}
	if !validPeriods[r.Period] {
		return ErrInvalidPeriod
	}

	return nil
}

// ============================================================================
// Response DTOs
// ============================================================================

// StudentAnalyticsResponse represents the response for student analytics
type StudentAnalyticsResponse struct {
	Overview       *StudentAnalytics         `json:"overview"`
	CourseProgress []StudentCourseProgress   `json:"course_progress"`
	TimeSeriesData []TimeSeriesData          `json:"time_series_data,omitempty"`
}

// CourseAnalyticsResponse represents the response for course analytics
type CourseAnalyticsResponse struct {
	Overview        *CourseAnalytics      `json:"overview"`
	Engagement      []CourseEngagement    `json:"engagement,omitempty"`
	LessonAnalytics []LessonAnalytics     `json:"lesson_analytics,omitempty"`
	QuizAnalytics   []QuizAnalytics       `json:"quiz_analytics,omitempty"`
	TopStudents     []LeaderboardEntry    `json:"top_students,omitempty"`
	TimeSeriesData  []TimeSeriesData      `json:"time_series_data,omitempty"`
}

// InstructorAnalyticsResponse represents the response for instructor analytics
type InstructorAnalyticsResponse struct {
	Overview       *InstructorAnalytics  `json:"overview"`
	CourseAnalytics []CourseAnalytics    `json:"course_analytics"`
	TimeSeriesData []TimeSeriesData      `json:"time_series_data,omitempty"`
}

// PlatformAnalyticsResponse represents the response for platform analytics
type PlatformAnalyticsResponse struct {
	Overview        *PlatformAnalytics    `json:"overview"`
	TimeSeriesData  []TimeSeriesData      `json:"time_series_data,omitempty"`
	TopCourses      []LeaderboardEntry    `json:"top_courses,omitempty"`
	TopInstructors  []LeaderboardEntry    `json:"top_instructors,omitempty"`
	TopStudents     []LeaderboardEntry    `json:"top_students,omitempty"`
}

// LeaderboardResponse represents the response for leaderboard
type LeaderboardResponse struct {
	Metric  string             `json:"metric"`
	Period  string             `json:"period"`
	Entries []LeaderboardEntry `json:"entries"`
}

// QuizAnalyticsResponse represents detailed quiz analytics response
type QuizAnalyticsResponse struct {
	Overview           *QuizAnalytics      `json:"overview"`
	QuestionAnalytics  []QuestionAnalytics `json:"question_analytics"`
}

// AssignmentAnalyticsResponse represents detailed assignment analytics response
type AssignmentAnalyticsResponse struct {
	Overview *AssignmentAnalytics `json:"overview"`
}

// ============================================================================
// Dashboard DTOs
// ============================================================================

// StudentDashboard represents student dashboard data
type StudentDashboard struct {
	Overview         *StudentAnalytics       `json:"overview"`
	RecentCourses    []StudentCourseProgress `json:"recent_courses"`
	Achievements     []Achievement           `json:"achievements"`
	UpcomingDeadlines []UpcomingDeadline     `json:"upcoming_deadlines"`
}

// InstructorDashboard represents instructor dashboard data
type InstructorDashboard struct {
	Overview           *InstructorAnalytics  `json:"overview"`
	RecentActivity     []ActivityLog         `json:"recent_activity"`
	TopCourses         []CourseAnalytics     `json:"top_courses"`
	PendingReviews     int                   `json:"pending_reviews"`
	UnreadNotifications int                  `json:"unread_notifications"`
}

// AdminDashboard represents admin dashboard data
type AdminDashboard struct {
	Overview           *PlatformAnalytics    `json:"overview"`
	RecentActivity     []ActivityLog         `json:"recent_activity"`
	UserGrowth         TimeSeriesData        `json:"user_growth"`
	EnrollmentGrowth   TimeSeriesData        `json:"enrollment_growth"`
	RevenueGrowth      *TimeSeriesData       `json:"revenue_growth,omitempty"`
	SystemHealth       SystemHealth          `json:"system_health"`
}

// Achievement represents a student achievement/badge
type Achievement struct {
	ID          uuid.UUID  `json:"id"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	Icon        string     `json:"icon"`
	EarnedAt    time.Time  `json:"earned_at"`
}

// UpcomingDeadline represents an upcoming assignment/quiz deadline
type UpcomingDeadline struct {
	ID          uuid.UUID  `json:"id"`
	Type        string     `json:"type"` // "assignment", "quiz"
	Title       string     `json:"title"`
	CourseName  string     `json:"course_name"`
	DueDate     time.Time  `json:"due_date"`
	IsOverdue   bool       `json:"is_overdue"`
}

// ActivityLog represents a recent activity entry
type ActivityLog struct {
	ID          uuid.UUID  `json:"id"`
	Type        string     `json:"type"` // "enrollment", "completion", "submission", etc.
	Description string     `json:"description"`
	UserID      uuid.UUID  `json:"user_id"`
	UserName    string     `json:"user_name"`
	Timestamp   time.Time  `json:"timestamp"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// SystemHealth represents system health metrics
type SystemHealth struct {
	Status           string  `json:"status"` // "healthy", "degraded", "down"
	DatabaseStatus   string  `json:"database_status"`
	CacheStatus      string  `json:"cache_status"`
	StorageStatus    string  `json:"storage_status"`
	ResponseTime     int     `json:"response_time"` // in ms
	ErrorRate        float64 `json:"error_rate"` // percentage
	Uptime           string  `json:"uptime"`
}

// ============================================================================
// Export DTOs
// ============================================================================

// ExportRequest represents a request to export analytics data
type ExportRequest struct {
	Type      string     `json:"type"` // "csv", "excel", "pdf"
	Metric    string     `json:"metric"`
	StartDate *time.Time `json:"start_date,omitempty"`
	EndDate   *time.Time `json:"end_date,omitempty"`
}

// Validate validates the export request
func (r *ExportRequest) Validate() error {
	validTypes := map[string]bool{
		"csv":   true,
		"excel": true,
		"pdf":   true,
	}
	if !validTypes[r.Type] {
		return ErrInvalidExportType
	}

	if r.Metric == "" {
		return ErrInvalidMetric
	}

	if r.StartDate != nil && r.EndDate != nil {
		if r.StartDate.After(*r.EndDate) {
			return ErrInvalidDateRange
		}
	}

	return nil
}

// ExportResponse represents the response for export request
type ExportResponse struct {
	FileName string `json:"file_name"`
	FileURL  string `json:"file_url"`
	FileSize int64  `json:"file_size"`
}
