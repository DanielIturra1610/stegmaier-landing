package ports

import (
	"context"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/analytics/domain"
	"github.com/google/uuid"
)

// AnalyticsRepository defines the interface for analytics data access
type AnalyticsRepository interface {
	// ========================================================================
	// Student Analytics
	// ========================================================================

	// GetStudentAnalytics retrieves comprehensive analytics for a student
	GetStudentAnalytics(ctx context.Context, tenantID, studentID uuid.UUID) (*domain.StudentAnalytics, error)

	// GetStudentCourseProgress retrieves student progress for a specific course
	GetStudentCourseProgress(ctx context.Context, tenantID, studentID, courseID uuid.UUID) (*domain.StudentCourseProgress, error)

	// GetStudentCourseProgressList retrieves student progress for all enrolled courses
	GetStudentCourseProgressList(ctx context.Context, tenantID, studentID uuid.UUID) ([]domain.StudentCourseProgress, error)

	// ========================================================================
	// Course Analytics
	// ========================================================================

	// GetCourseAnalytics retrieves comprehensive analytics for a course
	GetCourseAnalytics(ctx context.Context, tenantID, courseID uuid.UUID) (*domain.CourseAnalytics, error)

	// GetCourseEngagement retrieves engagement metrics for a course over time
	GetCourseEngagement(ctx context.Context, tenantID, courseID uuid.UUID, startDate, endDate time.Time) ([]domain.CourseEngagement, error)

	// GetLessonAnalytics retrieves analytics for a specific lesson
	GetLessonAnalytics(ctx context.Context, tenantID, lessonID uuid.UUID) (*domain.LessonAnalytics, error)

	// GetCourseLessonAnalytics retrieves analytics for all lessons in a course
	GetCourseLessonAnalytics(ctx context.Context, tenantID, courseID uuid.UUID) ([]domain.LessonAnalytics, error)

	// ========================================================================
	// Instructor Analytics
	// ========================================================================

	// GetInstructorAnalytics retrieves comprehensive analytics for an instructor
	GetInstructorAnalytics(ctx context.Context, tenantID, instructorID uuid.UUID) (*domain.InstructorAnalytics, error)

	// GetInstructorCourseAnalytics retrieves analytics for all courses by an instructor
	GetInstructorCourseAnalytics(ctx context.Context, tenantID, instructorID uuid.UUID) ([]domain.CourseAnalytics, error)

	// ========================================================================
	// Platform Analytics
	// ========================================================================

	// GetPlatformAnalytics retrieves overall platform analytics for a specific date
	GetPlatformAnalytics(ctx context.Context, tenantID uuid.UUID, date time.Time) (*domain.PlatformAnalytics, error)

	// GetPlatformAnalyticsRange retrieves platform analytics for a date range
	GetPlatformAnalyticsRange(ctx context.Context, tenantID uuid.UUID, startDate, endDate time.Time) ([]domain.PlatformAnalytics, error)

	// ========================================================================
	// Time Series Analytics
	// ========================================================================

	// GetTimeSeriesData retrieves time series data for a specific metric
	GetTimeSeriesData(ctx context.Context, tenantID uuid.UUID, metric string, startDate, endDate time.Time, period string) (*domain.TimeSeriesData, error)

	// GetCourseTimeSeriesData retrieves time series data for a course metric
	GetCourseTimeSeriesData(ctx context.Context, tenantID, courseID uuid.UUID, metric string, startDate, endDate time.Time, period string) (*domain.TimeSeriesData, error)

	// GetStudentTimeSeriesData retrieves time series data for a student metric
	GetStudentTimeSeriesData(ctx context.Context, tenantID, studentID uuid.UUID, metric string, startDate, endDate time.Time, period string) (*domain.TimeSeriesData, error)

	// ========================================================================
	// Leaderboard
	// ========================================================================

	// GetLeaderboard retrieves leaderboard data for a specific metric
	GetLeaderboard(ctx context.Context, tenantID uuid.UUID, metric string, limit int, period string) ([]domain.LeaderboardEntry, error)

	// GetCourseLeaderboard retrieves leaderboard data for a specific course
	GetCourseLeaderboard(ctx context.Context, tenantID, courseID uuid.UUID, metric string, limit int) ([]domain.LeaderboardEntry, error)

	// ========================================================================
	// Quiz Analytics
	// ========================================================================

	// GetQuizAnalytics retrieves analytics for a specific quiz
	GetQuizAnalytics(ctx context.Context, tenantID, quizID uuid.UUID) (*domain.QuizAnalytics, error)

	// GetQuestionAnalytics retrieves analytics for quiz questions
	GetQuestionAnalytics(ctx context.Context, tenantID, quizID uuid.UUID) ([]domain.QuestionAnalytics, error)

	// GetCourseQuizAnalytics retrieves analytics for all quizzes in a course
	GetCourseQuizAnalytics(ctx context.Context, tenantID, courseID uuid.UUID) ([]domain.QuizAnalytics, error)

	// ========================================================================
	// Assignment Analytics
	// ========================================================================

	// GetAssignmentAnalytics retrieves analytics for a specific assignment
	GetAssignmentAnalytics(ctx context.Context, tenantID, assignmentID uuid.UUID) (*domain.AssignmentAnalytics, error)

	// GetCourseAssignmentAnalytics retrieves analytics for all assignments in a course
	GetCourseAssignmentAnalytics(ctx context.Context, tenantID, courseID uuid.UUID) ([]domain.AssignmentAnalytics, error)

	// ========================================================================
	// Dashboard Data
	// ========================================================================

	// GetRecentActivity retrieves recent activity logs
	GetRecentActivity(ctx context.Context, tenantID uuid.UUID, limit int) ([]domain.ActivityLog, error)

	// GetUserRecentActivity retrieves recent activity logs for a specific user
	GetUserRecentActivity(ctx context.Context, tenantID, userID uuid.UUID, limit int) ([]domain.ActivityLog, error)

	// GetUpcomingDeadlines retrieves upcoming deadlines for a student
	GetUpcomingDeadlines(ctx context.Context, tenantID, studentID uuid.UUID, limit int) ([]domain.UpcomingDeadline, error)
}

// AnalyticsService defines the business logic interface for analytics
type AnalyticsService interface {
	// ========================================================================
	// Student Analytics
	// ========================================================================

	// GetStudentAnalytics retrieves comprehensive analytics for a student
	GetStudentAnalytics(ctx context.Context, tenantID, studentID uuid.UUID, req *domain.GetStudentAnalyticsRequest) (*domain.StudentAnalyticsResponse, error)

	// GetStudentDashboard retrieves dashboard data for a student
	GetStudentDashboard(ctx context.Context, tenantID, studentID uuid.UUID) (*domain.StudentDashboard, error)

	// ========================================================================
	// Course Analytics
	// ========================================================================

	// GetCourseAnalytics retrieves comprehensive analytics for a course
	GetCourseAnalytics(ctx context.Context, tenantID, courseID uuid.UUID, req *domain.GetCourseAnalyticsRequest) (*domain.CourseAnalyticsResponse, error)

	// GetCourseLessonAnalytics retrieves analytics for all lessons in a course
	GetCourseLessonAnalytics(ctx context.Context, tenantID, courseID uuid.UUID) ([]domain.LessonAnalytics, error)

	// GetCourseQuizAnalytics retrieves analytics for all quizzes in a course
	GetCourseQuizAnalytics(ctx context.Context, tenantID, courseID uuid.UUID) ([]domain.QuizAnalytics, error)

	// GetCourseAssignmentAnalytics retrieves analytics for all assignments in a course
	GetCourseAssignmentAnalytics(ctx context.Context, tenantID, courseID uuid.UUID) ([]domain.AssignmentAnalytics, error)

	// ========================================================================
	// Instructor Analytics
	// ========================================================================

	// GetInstructorAnalytics retrieves comprehensive analytics for an instructor
	GetInstructorAnalytics(ctx context.Context, tenantID, instructorID uuid.UUID, req *domain.GetInstructorAnalyticsRequest) (*domain.InstructorAnalyticsResponse, error)

	// GetInstructorDashboard retrieves dashboard data for an instructor
	GetInstructorDashboard(ctx context.Context, tenantID, instructorID uuid.UUID) (*domain.InstructorDashboard, error)

	// ========================================================================
	// Platform Analytics
	// ========================================================================

	// GetPlatformAnalytics retrieves overall platform analytics
	GetPlatformAnalytics(ctx context.Context, tenantID uuid.UUID, req *domain.GetAnalyticsRequest) (*domain.PlatformAnalyticsResponse, error)

	// GetAdminDashboard retrieves dashboard data for admins
	GetAdminDashboard(ctx context.Context, tenantID uuid.UUID) (*domain.AdminDashboard, error)

	// ========================================================================
	// Leaderboard
	// ========================================================================

	// GetLeaderboard retrieves leaderboard data
	GetLeaderboard(ctx context.Context, tenantID uuid.UUID, req *domain.GetLeaderboardRequest) (*domain.LeaderboardResponse, error)

	// ========================================================================
	// Specific Analytics
	// ========================================================================

	// GetQuizAnalytics retrieves detailed analytics for a quiz
	GetQuizAnalytics(ctx context.Context, tenantID, quizID uuid.UUID) (*domain.QuizAnalyticsResponse, error)

	// GetAssignmentAnalytics retrieves detailed analytics for an assignment
	GetAssignmentAnalytics(ctx context.Context, tenantID, assignmentID uuid.UUID) (*domain.AssignmentAnalyticsResponse, error)

	// GetLessonAnalytics retrieves analytics for a specific lesson
	GetLessonAnalytics(ctx context.Context, tenantID, lessonID uuid.UUID) (*domain.LessonAnalytics, error)

	// ========================================================================
	// Export
	// ========================================================================

	// ExportAnalytics exports analytics data in the requested format
	ExportAnalytics(ctx context.Context, tenantID uuid.UUID, req *domain.ExportRequest) (*domain.ExportResponse, error)
}
