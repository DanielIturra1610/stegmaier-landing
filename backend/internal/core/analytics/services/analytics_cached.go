package services

import (
	"context"
	"fmt"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/analytics/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/analytics/ports"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/cache"
	"github.com/google/uuid"
)

// CachedAnalyticsService wraps the analytics service with caching
type CachedAnalyticsService struct {
	service ports.AnalyticsService
	cache   *cache.CacheHelper
	ttl     CacheTTLConfig
}

// CacheTTLConfig defines TTL for different types of analytics data
type CacheTTLConfig struct {
	StudentAnalytics   time.Duration
	StudentDashboard   time.Duration
	CourseAnalytics    time.Duration
	InstructorAnalytics time.Duration
	InstructorDashboard time.Duration
	PlatformAnalytics  time.Duration
	AdminDashboard     time.Duration
	Leaderboard        time.Duration
	QuizAnalytics      time.Duration
	AssignmentAnalytics time.Duration
	LessonAnalytics    time.Duration
}

// DefaultCacheTTL returns default TTL configuration for analytics
func DefaultCacheTTL() CacheTTLConfig {
	return CacheTTLConfig{
		StudentAnalytics:    15 * time.Minute, // Student data changes moderately
		StudentDashboard:    5 * time.Minute,  // Dashboard needs to be relatively fresh
		CourseAnalytics:     30 * time.Minute, // Course data changes slowly
		InstructorAnalytics: 30 * time.Minute, // Instructor data changes slowly
		InstructorDashboard: 10 * time.Minute, // Instructor needs fresher data
		PlatformAnalytics:   1 * time.Hour,    // Platform-wide data changes very slowly
		AdminDashboard:      15 * time.Minute, // Admin dashboard moderately fresh
		Leaderboard:         10 * time.Minute, // Leaderboards need regular updates
		QuizAnalytics:       20 * time.Minute, // Quiz data moderately fresh
		AssignmentAnalytics: 20 * time.Minute, // Assignment data moderately fresh
		LessonAnalytics:     30 * time.Minute, // Lesson data changes slowly
	}
}

// NewCachedAnalyticsService creates a new cached analytics service
func NewCachedAnalyticsService(service ports.AnalyticsService, cacheInstance cache.Cache, ttl CacheTTLConfig) ports.AnalyticsService {
	return &CachedAnalyticsService{
		service: service,
		cache:   cache.NewCacheHelper(cacheInstance),
		ttl:     ttl,
	}
}

// ============================================================================
// Student Analytics
// ============================================================================

// GetStudentAnalytics retrieves comprehensive analytics for a student (with caching)
func (s *CachedAnalyticsService) GetStudentAnalytics(ctx context.Context, tenantID, studentID uuid.UUID, req *domain.GetStudentAnalyticsRequest) (*domain.StudentAnalyticsResponse, error) {
	kb := cache.NewKeyBuilder(tenantID)
	cacheKey := kb.StudentAnalytics(studentID)

	var response domain.StudentAnalyticsResponse

	err := s.cache.GetOrSetJSON(ctx, cacheKey, &response, s.ttl.StudentAnalytics, func() (interface{}, error) {
		return s.service.GetStudentAnalytics(ctx, tenantID, studentID, req)
	})

	return &response, err
}

// GetStudentDashboard retrieves dashboard data for a student (with caching)
func (s *CachedAnalyticsService) GetStudentDashboard(ctx context.Context, tenantID, studentID uuid.UUID) (*domain.StudentDashboard, error) {
	kb := cache.NewKeyBuilder(tenantID)
	cacheKey := kb.StudentDashboard(studentID)

	var dashboard domain.StudentDashboard

	err := s.cache.GetOrSetJSON(ctx, cacheKey, &dashboard, s.ttl.StudentDashboard, func() (interface{}, error) {
		return s.service.GetStudentDashboard(ctx, tenantID, studentID)
	})

	return &dashboard, err
}

// ============================================================================
// Course Analytics
// ============================================================================

// GetCourseAnalytics retrieves comprehensive analytics for a course (with caching)
func (s *CachedAnalyticsService) GetCourseAnalytics(ctx context.Context, tenantID, courseID uuid.UUID, req *domain.GetCourseAnalyticsRequest) (*domain.CourseAnalyticsResponse, error) {
	kb := cache.NewKeyBuilder(tenantID)
	cacheKey := kb.CourseAnalytics(courseID)

	var response domain.CourseAnalyticsResponse

	err := s.cache.GetOrSetJSON(ctx, cacheKey, &response, s.ttl.CourseAnalytics, func() (interface{}, error) {
		return s.service.GetCourseAnalytics(ctx, tenantID, courseID, req)
	})

	return &response, err
}

// GetCourseLessonAnalytics retrieves analytics for all lessons in a course (with caching)
func (s *CachedAnalyticsService) GetCourseLessonAnalytics(ctx context.Context, tenantID, courseID uuid.UUID) ([]domain.LessonAnalytics, error) {
	kb := cache.NewKeyBuilder(tenantID)
	cacheKey := fmt.Sprintf("%s:lessons", kb.CourseAnalytics(courseID))

	var lessons []domain.LessonAnalytics

	err := s.cache.GetOrSetJSON(ctx, cacheKey, &lessons, s.ttl.LessonAnalytics, func() (interface{}, error) {
		return s.service.GetCourseLessonAnalytics(ctx, tenantID, courseID)
	})

	return lessons, err
}

// GetCourseQuizAnalytics retrieves analytics for all quizzes in a course (with caching)
func (s *CachedAnalyticsService) GetCourseQuizAnalytics(ctx context.Context, tenantID, courseID uuid.UUID) ([]domain.QuizAnalytics, error) {
	kb := cache.NewKeyBuilder(tenantID)
	cacheKey := fmt.Sprintf("%s:quizzes", kb.CourseAnalytics(courseID))

	var quizzes []domain.QuizAnalytics

	err := s.cache.GetOrSetJSON(ctx, cacheKey, &quizzes, s.ttl.QuizAnalytics, func() (interface{}, error) {
		return s.service.GetCourseQuizAnalytics(ctx, tenantID, courseID)
	})

	return quizzes, err
}

// GetCourseAssignmentAnalytics retrieves analytics for all assignments in a course (with caching)
func (s *CachedAnalyticsService) GetCourseAssignmentAnalytics(ctx context.Context, tenantID, courseID uuid.UUID) ([]domain.AssignmentAnalytics, error) {
	kb := cache.NewKeyBuilder(tenantID)
	cacheKey := fmt.Sprintf("%s:assignments", kb.CourseAnalytics(courseID))

	var assignments []domain.AssignmentAnalytics

	err := s.cache.GetOrSetJSON(ctx, cacheKey, &assignments, s.ttl.AssignmentAnalytics, func() (interface{}, error) {
		return s.service.GetCourseAssignmentAnalytics(ctx, tenantID, courseID)
	})

	return assignments, err
}

// ============================================================================
// Instructor Analytics
// ============================================================================

// GetInstructorAnalytics retrieves comprehensive analytics for an instructor (with caching)
func (s *CachedAnalyticsService) GetInstructorAnalytics(ctx context.Context, tenantID, instructorID uuid.UUID, req *domain.GetInstructorAnalyticsRequest) (*domain.InstructorAnalyticsResponse, error) {
	kb := cache.NewKeyBuilder(tenantID)
	cacheKey := kb.InstructorAnalytics(instructorID)

	var response domain.InstructorAnalyticsResponse

	err := s.cache.GetOrSetJSON(ctx, cacheKey, &response, s.ttl.InstructorAnalytics, func() (interface{}, error) {
		return s.service.GetInstructorAnalytics(ctx, tenantID, instructorID, req)
	})

	return &response, err
}

// GetInstructorDashboard retrieves dashboard data for an instructor (with caching)
func (s *CachedAnalyticsService) GetInstructorDashboard(ctx context.Context, tenantID, instructorID uuid.UUID) (*domain.InstructorDashboard, error) {
	kb := cache.NewKeyBuilder(tenantID)
	cacheKey := kb.InstructorDashboard(instructorID)

	var dashboard domain.InstructorDashboard

	err := s.cache.GetOrSetJSON(ctx, cacheKey, &dashboard, s.ttl.InstructorDashboard, func() (interface{}, error) {
		return s.service.GetInstructorDashboard(ctx, tenantID, instructorID)
	})

	return &dashboard, err
}

// ============================================================================
// Platform Analytics
// ============================================================================

// GetPlatformAnalytics retrieves overall platform analytics (with caching)
func (s *CachedAnalyticsService) GetPlatformAnalytics(ctx context.Context, tenantID uuid.UUID, req *domain.GetAnalyticsRequest) (*domain.PlatformAnalyticsResponse, error) {
	kb := cache.NewKeyBuilder(tenantID)
	cacheKey := kb.PlatformAnalytics()

	var response domain.PlatformAnalyticsResponse

	err := s.cache.GetOrSetJSON(ctx, cacheKey, &response, s.ttl.PlatformAnalytics, func() (interface{}, error) {
		return s.service.GetPlatformAnalytics(ctx, tenantID, req)
	})

	return &response, err
}

// GetAdminDashboard retrieves dashboard data for admins (with caching)
func (s *CachedAnalyticsService) GetAdminDashboard(ctx context.Context, tenantID uuid.UUID) (*domain.AdminDashboard, error) {
	kb := cache.NewKeyBuilder(tenantID)
	cacheKey := kb.AdminDashboard()

	var dashboard domain.AdminDashboard

	err := s.cache.GetOrSetJSON(ctx, cacheKey, &dashboard, s.ttl.AdminDashboard, func() (interface{}, error) {
		return s.service.GetAdminDashboard(ctx, tenantID)
	})

	return &dashboard, err
}

// ============================================================================
// Leaderboard
// ============================================================================

// GetLeaderboard retrieves leaderboard data (with caching)
func (s *CachedAnalyticsService) GetLeaderboard(ctx context.Context, tenantID uuid.UUID, req *domain.GetLeaderboardRequest) (*domain.LeaderboardResponse, error) {
	kb := cache.NewKeyBuilder(tenantID)

	var cacheKey string
	if req.CourseID != nil {
		cacheKey = kb.CourseLeaderboard(*req.CourseID, req.Metric)
	} else {
		cacheKey = kb.Leaderboard(req.Metric, req.Period)
	}

	var response domain.LeaderboardResponse

	err := s.cache.GetOrSetJSON(ctx, cacheKey, &response, s.ttl.Leaderboard, func() (interface{}, error) {
		return s.service.GetLeaderboard(ctx, tenantID, req)
	})

	return &response, err
}

// ============================================================================
// Specific Analytics
// ============================================================================

// GetQuizAnalytics retrieves detailed analytics for a quiz (with caching)
func (s *CachedAnalyticsService) GetQuizAnalytics(ctx context.Context, tenantID, quizID uuid.UUID) (*domain.QuizAnalyticsResponse, error) {
	kb := cache.NewKeyBuilder(tenantID)
	cacheKey := kb.Quiz(quizID)

	var response domain.QuizAnalyticsResponse

	err := s.cache.GetOrSetJSON(ctx, cacheKey, &response, s.ttl.QuizAnalytics, func() (interface{}, error) {
		return s.service.GetQuizAnalytics(ctx, tenantID, quizID)
	})

	return &response, err
}

// GetAssignmentAnalytics retrieves detailed analytics for an assignment (with caching)
func (s *CachedAnalyticsService) GetAssignmentAnalytics(ctx context.Context, tenantID, assignmentID uuid.UUID) (*domain.AssignmentAnalyticsResponse, error) {
	kb := cache.NewKeyBuilder(tenantID)
	cacheKey := kb.Assignment(assignmentID)

	var response domain.AssignmentAnalyticsResponse

	err := s.cache.GetOrSetJSON(ctx, cacheKey, &response, s.ttl.AssignmentAnalytics, func() (interface{}, error) {
		return s.service.GetAssignmentAnalytics(ctx, tenantID, assignmentID)
	})

	return &response, err
}

// GetLessonAnalytics retrieves analytics for a specific lesson (with caching)
func (s *CachedAnalyticsService) GetLessonAnalytics(ctx context.Context, tenantID, lessonID uuid.UUID) (*domain.LessonAnalytics, error) {
	kb := cache.NewKeyBuilder(tenantID)
	cacheKey := kb.Lesson(lessonID)

	var lesson domain.LessonAnalytics

	err := s.cache.GetOrSetJSON(ctx, cacheKey, &lesson, s.ttl.LessonAnalytics, func() (interface{}, error) {
		return s.service.GetLessonAnalytics(ctx, tenantID, lessonID)
	})

	return &lesson, err
}

// ============================================================================
// Export
// ============================================================================

// ExportAnalytics exports analytics data in the requested format (no caching)
func (s *CachedAnalyticsService) ExportAnalytics(ctx context.Context, tenantID uuid.UUID, req *domain.ExportRequest) (*domain.ExportResponse, error) {
	// Export operations should not be cached
	return s.service.ExportAnalytics(ctx, tenantID, req)
}

// ============================================================================
// Cache Invalidation Helpers
// ============================================================================

// InvalidateStudentCache invalidates all cache for a student
func (s *CachedAnalyticsService) InvalidateStudentCache(ctx context.Context, tenantID, studentID uuid.UUID) error {
	kb := cache.NewKeyBuilder(tenantID)
	pattern := kb.UserPattern(studentID)
	return s.cache.InvalidatePattern(ctx, pattern)
}

// InvalidateCourseCache invalidates all cache for a course
func (s *CachedAnalyticsService) InvalidateCourseCache(ctx context.Context, tenantID, courseID uuid.UUID) error {
	kb := cache.NewKeyBuilder(tenantID)
	pattern := kb.CoursePattern(courseID)
	return s.cache.InvalidatePattern(ctx, pattern)
}

// InvalidateInstructorCache invalidates all cache for an instructor
func (s *CachedAnalyticsService) InvalidateInstructorCache(ctx context.Context, tenantID, instructorID uuid.UUID) error {
	kb := cache.NewKeyBuilder(tenantID)
	keys := []string{
		kb.InstructorAnalytics(instructorID),
		kb.InstructorDashboard(instructorID),
	}
	return s.cache.InvalidateMultiple(ctx, keys...)
}

// InvalidatePlatformCache invalidates platform-wide analytics cache
func (s *CachedAnalyticsService) InvalidatePlatformCache(ctx context.Context, tenantID uuid.UUID) error {
	kb := cache.NewKeyBuilder(tenantID)
	keys := []string{
		kb.PlatformAnalytics(),
		kb.AdminDashboard(),
	}
	return s.cache.InvalidateMultiple(ctx, keys...)
}

// InvalidateLeaderboardCache invalidates all leaderboard cache
func (s *CachedAnalyticsService) InvalidateLeaderboardCache(ctx context.Context, tenantID uuid.UUID) error {
	pattern := fmt.Sprintf("%s:leaderboard:*", tenantID)
	return s.cache.InvalidatePattern(ctx, pattern)
}

// InvalidateAllAnalyticsCache invalidates all analytics cache for a tenant
func (s *CachedAnalyticsService) InvalidateAllAnalyticsCache(ctx context.Context, tenantID uuid.UUID) error {
	kb := cache.NewKeyBuilder(tenantID)
	pattern := kb.AnalyticsPattern()
	return s.cache.InvalidatePattern(ctx, pattern)
}
