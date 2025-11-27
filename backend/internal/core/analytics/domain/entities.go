package domain

import (
	"time"

	"github.com/google/uuid"
)

// ============================================================================
// Student Analytics
// ============================================================================

// StudentAnalytics represents comprehensive analytics for a student
type StudentAnalytics struct {
	TenantID           uuid.UUID `json:"tenant_id"`
	StudentID          uuid.UUID `json:"student_id"`
	StudentName        string    `json:"student_name"`
	StudentEmail       string    `json:"student_email"`
	TotalCourses       int       `json:"total_courses"`
	CompletedCourses   int       `json:"completed_courses"`
	InProgressCourses  int       `json:"in_progress_courses"`
	TotalLessons       int       `json:"total_lessons"`
	CompletedLessons   int       `json:"completed_lessons"`
	TotalQuizzes       int       `json:"total_quizzes"`
	CompletedQuizzes   int       `json:"completed_quizzes"`
	AverageQuizScore   float64   `json:"average_quiz_score"`
	TotalAssignments   int       `json:"total_assignments"`
	SubmittedAssignments int     `json:"submitted_assignments"`
	AverageAssignmentScore float64 `json:"average_assignment_score"`
	TotalTimeSpent     int       `json:"total_time_spent"` // in minutes
	CertificatesEarned int       `json:"certificates_earned"`
	LastActivityAt     time.Time `json:"last_activity_at"`
	EnrollmentDate     time.Time `json:"enrollment_date"`
}

// StudentCourseProgress represents student progress in a specific course
type StudentCourseProgress struct {
	TenantID              uuid.UUID `json:"tenant_id"`
	StudentID             uuid.UUID `json:"student_id"`
	CourseID              uuid.UUID `json:"course_id"`
	CourseName            string    `json:"course_name"`
	EnrolledAt            time.Time `json:"enrolled_at"`
	LastAccessedAt        *time.Time `json:"last_accessed_at,omitempty"`
	ProgressPercentage    float64   `json:"progress_percentage"`
	CompletedLessons      int       `json:"completed_lessons"`
	TotalLessons          int       `json:"total_lessons"`
	TimeSpent             int       `json:"time_spent"` // in minutes
	QuizzesCompleted      int       `json:"quizzes_completed"`
	QuizzesTotalCount     int       `json:"quizzes_total_count"`
	AverageQuizScore      float64   `json:"average_quiz_score"`
	AssignmentsSubmitted  int       `json:"assignments_submitted"`
	AssignmentsTotalCount int       `json:"assignments_total_count"`
	AverageAssignmentScore float64  `json:"average_assignment_score"`
	IsCompleted           bool      `json:"is_completed"`
	CompletedAt           *time.Time `json:"completed_at,omitempty"`
	CertificateIssued     bool      `json:"certificate_issued"`
}

// ============================================================================
// Course Analytics
// ============================================================================

// CourseAnalytics represents comprehensive analytics for a course
type CourseAnalytics struct {
	TenantID              uuid.UUID  `json:"tenant_id"`
	CourseID              uuid.UUID  `json:"course_id"`
	CourseName            string     `json:"course_name"`
	InstructorID          uuid.UUID  `json:"instructor_id"`
	InstructorName        string     `json:"instructor_name"`
	PublishedAt           *time.Time `json:"published_at,omitempty"`
	TotalEnrollments      int        `json:"total_enrollments"`
	ActiveEnrollments     int        `json:"active_enrollments"`
	CompletedEnrollments  int        `json:"completed_enrollments"`
	CompletionRate        float64    `json:"completion_rate"` // percentage
	AverageProgress       float64    `json:"average_progress"` // percentage
	TotalLessons          int        `json:"total_lessons"`
	TotalQuizzes          int        `json:"total_quizzes"`
	TotalAssignments      int        `json:"total_assignments"`
	AverageRating         float64    `json:"average_rating"`
	TotalReviews          int        `json:"total_reviews"`
	TotalTimeSpent        int        `json:"total_time_spent"` // in minutes
	AverageTimeSpent      int        `json:"average_time_spent"` // in minutes
	CertificatesIssued    int        `json:"certificates_issued"`
	LastEnrollmentAt      *time.Time `json:"last_enrollment_at,omitempty"`
}

// CourseEngagement represents engagement metrics for a course
type CourseEngagement struct {
	TenantID              uuid.UUID `json:"tenant_id"`
	CourseID              uuid.UUID `json:"course_id"`
	Date                  time.Time `json:"date"`
	ActiveStudents        int       `json:"active_students"`
	NewEnrollments        int       `json:"new_enrollments"`
	LessonsCompleted      int       `json:"lessons_completed"`
	QuizzesCompleted      int       `json:"quizzes_completed"`
	AssignmentsSubmitted  int       `json:"assignments_submitted"`
	TotalTimeSpent        int       `json:"total_time_spent"` // in minutes
	DropoffCount          int       `json:"dropoff_count"` // students who stopped
	RetentionRate         float64   `json:"retention_rate"` // percentage
}

// LessonAnalytics represents analytics for a specific lesson
type LessonAnalytics struct {
	TenantID           uuid.UUID `json:"tenant_id"`
	LessonID           uuid.UUID `json:"lesson_id"`
	LessonTitle        string    `json:"lesson_title"`
	CourseID           uuid.UUID `json:"course_id"`
	ViewCount          int       `json:"view_count"`
	UniqueViewers      int       `json:"unique_viewers"`
	CompletionCount    int       `json:"completion_count"`
	CompletionRate     float64   `json:"completion_rate"` // percentage
	AverageTimeSpent   int       `json:"average_time_spent"` // in seconds
	AverageWatchTime   int       `json:"average_watch_time"` // in seconds (for videos)
	DropoffRate        float64   `json:"dropoff_rate"` // percentage of users who started but didn't finish
	AverageProgress    float64   `json:"average_progress"` // percentage
}

// ============================================================================
// Instructor Analytics
// ============================================================================

// InstructorAnalytics represents comprehensive analytics for an instructor
type InstructorAnalytics struct {
	TenantID              uuid.UUID `json:"tenant_id"`
	InstructorID          uuid.UUID `json:"instructor_id"`
	InstructorName        string    `json:"instructor_name"`
	TotalCourses          int       `json:"total_courses"`
	PublishedCourses      int       `json:"published_courses"`
	DraftCourses          int       `json:"draft_courses"`
	TotalStudents         int       `json:"total_students"` // unique students across all courses
	TotalEnrollments      int       `json:"total_enrollments"` // total enrollments (can be > students)
	ActiveStudents        int       `json:"active_students"` // students active in last 30 days
	AverageRating         float64   `json:"average_rating"` // across all courses
	TotalReviews          int       `json:"total_reviews"`
	TotalLessons          int       `json:"total_lessons"`
	TotalQuizzes          int       `json:"total_quizzes"`
	TotalAssignments      int       `json:"total_assignments"`
	CertificatesIssued    int       `json:"certificates_issued"`
	AverageCourseCompletion float64 `json:"average_course_completion"` // percentage
}

// ============================================================================
// System/Platform Analytics
// ============================================================================

// PlatformAnalytics represents overall platform analytics
type PlatformAnalytics struct {
	TenantID              uuid.UUID  `json:"tenant_id"`
	Date                  time.Time  `json:"date"`
	TotalUsers            int        `json:"total_users"`
	ActiveUsers           int        `json:"active_users"` // active in last 30 days
	NewUsers              int        `json:"new_users"` // new in the date period
	TotalInstructors      int        `json:"total_instructors"`
	ActiveInstructors     int        `json:"active_instructors"`
	TotalStudents         int        `json:"total_students"`
	ActiveStudents        int        `json:"active_students"`
	TotalCourses          int        `json:"total_courses"`
	PublishedCourses      int        `json:"published_courses"`
	TotalEnrollments      int        `json:"total_enrollments"`
	NewEnrollments        int        `json:"new_enrollments"` // new in the date period
	CompletedCourses      int        `json:"completed_courses"`
	CertificatesIssued    int        `json:"certificates_issued"`
	TotalLessons          int        `json:"total_lessons"`
	CompletedLessons      int        `json:"completed_lessons"`
	TotalQuizzes          int        `json:"total_quizzes"`
	CompletedQuizzes      int        `json:"completed_quizzes"`
	TotalAssignments      int        `json:"total_assignments"`
	SubmittedAssignments  int        `json:"submitted_assignments"`
	AverageRating         float64    `json:"average_rating"`
	TotalReviews          int        `json:"total_reviews"`
}

// ============================================================================
// Time Series Data
// ============================================================================

// TimeSeriesDataPoint represents a single data point in a time series
type TimeSeriesDataPoint struct {
	Date  time.Time `json:"date"`
	Value float64   `json:"value"`
	Label string    `json:"label,omitempty"`
}

// TimeSeriesData represents time series analytics data
type TimeSeriesData struct {
	Metric     string                 `json:"metric"`
	StartDate  time.Time              `json:"start_date"`
	EndDate    time.Time              `json:"end_date"`
	DataPoints []TimeSeriesDataPoint  `json:"data_points"`
}

// ============================================================================
// Leaderboard
// ============================================================================

// LeaderboardEntry represents a single entry in a leaderboard
type LeaderboardEntry struct {
	Rank       int       `json:"rank"`
	UserID     uuid.UUID `json:"user_id"`
	UserName   string    `json:"user_name"`
	UserAvatar *string   `json:"user_avatar,omitempty"`
	Score      float64   `json:"score"`
	Metric     string    `json:"metric"` // e.g., "courses_completed", "quiz_score", "time_spent"
	Value      string    `json:"value"` // formatted value for display
}

// ============================================================================
// Quiz Analytics
// ============================================================================

// QuizAnalytics represents analytics for a quiz
type QuizAnalytics struct {
	TenantID           uuid.UUID `json:"tenant_id"`
	QuizID             uuid.UUID `json:"quiz_id"`
	QuizTitle          string    `json:"quiz_title"`
	CourseID           uuid.UUID `json:"course_id"`
	CourseName         string    `json:"course_name"`
	TotalAttempts      int       `json:"total_attempts"`
	UniqueStudents     int       `json:"unique_students"`
	AverageScore       float64   `json:"average_score"` // percentage
	PassRate           float64   `json:"pass_rate"` // percentage
	AverageAttempts    float64   `json:"average_attempts"` // average attempts per student
	AverageTimeSpent   int       `json:"average_time_spent"` // in seconds
	DifficultQuestions []uuid.UUID `json:"difficult_questions"` // question IDs with low success rate
}

// QuestionAnalytics represents analytics for a specific quiz question
type QuestionAnalytics struct {
	TenantID        uuid.UUID `json:"tenant_id"`
	QuestionID      uuid.UUID `json:"question_id"`
	QuizID          uuid.UUID `json:"quiz_id"`
	QuestionText    string    `json:"question_text"`
	QuestionType    string    `json:"question_type"`
	TotalAttempts   int       `json:"total_attempts"`
	CorrectAnswers  int       `json:"correct_answers"`
	IncorrectAnswers int      `json:"incorrect_answers"`
	SuccessRate     float64   `json:"success_rate"` // percentage
	AverageTimeSpent int      `json:"average_time_spent"` // in seconds
}

// ============================================================================
// Assignment Analytics
// ============================================================================

// AssignmentAnalytics represents analytics for an assignment
type AssignmentAnalytics struct {
	TenantID              uuid.UUID `json:"tenant_id"`
	AssignmentID          uuid.UUID `json:"assignment_id"`
	AssignmentTitle       string    `json:"assignment_title"`
	CourseID              uuid.UUID `json:"course_id"`
	CourseName            string    `json:"course_name"`
	TotalSubmissions      int       `json:"total_submissions"`
	UniqueStudents        int       `json:"unique_students"`
	SubmissionRate        float64   `json:"submission_rate"` // percentage
	AverageGrade          float64   `json:"average_grade"` // percentage
	PassRate              float64   `json:"pass_rate"` // percentage (grade >= passing_score)
	AverageTimeToSubmit   int       `json:"average_time_to_submit"` // in hours
	OnTimeSubmissions     int       `json:"on_time_submissions"`
	LateSubmissions       int       `json:"late_submissions"`
	PendingReviews        int       `json:"pending_reviews"`
}

// ============================================================================
// Helper Methods
// ============================================================================

// CalculateCompletionRate calculates completion rate percentage
func CalculateCompletionRate(completed, total int) float64 {
	if total == 0 {
		return 0.0
	}
	return (float64(completed) / float64(total)) * 100.0
}

// CalculateAverage calculates average from sum and count
func CalculateAverage(sum float64, count int) float64 {
	if count == 0 {
		return 0.0
	}
	return sum / float64(count)
}

// CalculatePercentage calculates percentage
func CalculatePercentage(part, total int) float64 {
	if total == 0 {
		return 0.0
	}
	return (float64(part) / float64(total)) * 100.0
}
