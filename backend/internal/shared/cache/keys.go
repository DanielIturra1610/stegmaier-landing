package cache

import (
	"fmt"

	"github.com/google/uuid"
)

// KeyBuilder provides methods to build consistent cache keys across the application
// All keys follow the pattern: {tenant}:{domain}:{entity}:{id}:{suffix}
type KeyBuilder struct {
	tenantID uuid.UUID
}

// NewKeyBuilder creates a new key builder for a tenant
func NewKeyBuilder(tenantID uuid.UUID) *KeyBuilder {
	return &KeyBuilder{
		tenantID: tenantID,
	}
}

// ============================================================================
// Analytics Keys
// ============================================================================

// StudentAnalytics returns key for student analytics data
func (kb *KeyBuilder) StudentAnalytics(studentID uuid.UUID) string {
	return fmt.Sprintf("%s:analytics:student:%s", kb.tenantID, studentID)
}

// StudentDashboard returns key for student dashboard
func (kb *KeyBuilder) StudentDashboard(studentID uuid.UUID) string {
	return fmt.Sprintf("%s:analytics:student:%s:dashboard", kb.tenantID, studentID)
}

// CourseAnalytics returns key for course analytics data
func (kb *KeyBuilder) CourseAnalytics(courseID uuid.UUID) string {
	return fmt.Sprintf("%s:analytics:course:%s", kb.tenantID, courseID)
}

// InstructorAnalytics returns key for instructor analytics data
func (kb *KeyBuilder) InstructorAnalytics(instructorID uuid.UUID) string {
	return fmt.Sprintf("%s:analytics:instructor:%s", kb.tenantID, instructorID)
}

// InstructorDashboard returns key for instructor dashboard
func (kb *KeyBuilder) InstructorDashboard(instructorID uuid.UUID) string {
	return fmt.Sprintf("%s:analytics:instructor:%s:dashboard", kb.tenantID, instructorID)
}

// PlatformAnalytics returns key for platform analytics
func (kb *KeyBuilder) PlatformAnalytics() string {
	return fmt.Sprintf("%s:analytics:platform", kb.tenantID)
}

// AdminDashboard returns key for admin dashboard
func (kb *KeyBuilder) AdminDashboard() string {
	return fmt.Sprintf("%s:analytics:admin:dashboard", kb.tenantID)
}

// Leaderboard returns key for leaderboard data
func (kb *KeyBuilder) Leaderboard(metric, period string) string {
	return fmt.Sprintf("%s:leaderboard:%s:%s", kb.tenantID, metric, period)
}

// CourseLeaderboard returns key for course-specific leaderboard
func (kb *KeyBuilder) CourseLeaderboard(courseID uuid.UUID, metric string) string {
	return fmt.Sprintf("%s:leaderboard:course:%s:%s", kb.tenantID, courseID, metric)
}

// ============================================================================
// Course Keys
// ============================================================================

// Course returns key for a course
func (kb *KeyBuilder) Course(courseID uuid.UUID) string {
	return fmt.Sprintf("%s:course:%s", kb.tenantID, courseID)
}

// CourseBySlug returns key for a course by slug
func (kb *KeyBuilder) CourseBySlug(slug string) string {
	return fmt.Sprintf("%s:course:slug:%s", kb.tenantID, slug)
}

// PublishedCourses returns key for list of published courses
func (kb *KeyBuilder) PublishedCourses(page, limit int) string {
	return fmt.Sprintf("%s:courses:published:%d:%d", kb.tenantID, page, limit)
}

// CoursesByCategory returns key for courses by category
func (kb *KeyBuilder) CoursesByCategory(categoryID uuid.UUID, page, limit int) string {
	return fmt.Sprintf("%s:courses:category:%s:%d:%d", kb.tenantID, categoryID, page, limit)
}

// CoursesByInstructor returns key for courses by instructor
func (kb *KeyBuilder) CoursesByInstructor(instructorID uuid.UUID) string {
	return fmt.Sprintf("%s:courses:instructor:%s", kb.tenantID, instructorID)
}

// CourseRating returns key for course rating aggregate
func (kb *KeyBuilder) CourseRating(courseID uuid.UUID) string {
	return fmt.Sprintf("%s:course:%s:rating", kb.tenantID, courseID)
}

// ============================================================================
// User Keys
// ============================================================================

// User returns key for a user
func (kb *KeyBuilder) User(userID uuid.UUID) string {
	return fmt.Sprintf("%s:user:%s", kb.tenantID, userID)
}

// UserByEmail returns key for a user by email
func (kb *KeyBuilder) UserByEmail(email string) string {
	return fmt.Sprintf("%s:user:email:%s", kb.tenantID, email)
}

// UserProfile returns key for user profile
func (kb *KeyBuilder) UserProfile(userID uuid.UUID) string {
	return fmt.Sprintf("%s:profile:%s", kb.tenantID, userID)
}

// UserSession returns key for user session
func (kb *KeyBuilder) UserSession(sessionToken string) string {
	return fmt.Sprintf("%s:session:%s", kb.tenantID, sessionToken)
}

// UserSessions returns key pattern for all user sessions
func (kb *KeyBuilder) UserSessions(userID uuid.UUID) string {
	return fmt.Sprintf("%s:session:user:%s:*", kb.tenantID, userID)
}

// ============================================================================
// Enrollment & Progress Keys
// ============================================================================

// UserEnrollments returns key for user's enrollments
func (kb *KeyBuilder) UserEnrollments(userID uuid.UUID) string {
	return fmt.Sprintf("%s:enrollments:user:%s", kb.tenantID, userID)
}

// CourseProgress returns key for course progress
func (kb *KeyBuilder) CourseProgress(enrollmentID uuid.UUID) string {
	return fmt.Sprintf("%s:progress:enrollment:%s", kb.tenantID, enrollmentID)
}

// LessonProgress returns key for lesson progress
func (kb *KeyBuilder) LessonProgress(userID, lessonID uuid.UUID) string {
	return fmt.Sprintf("%s:progress:user:%s:lesson:%s", kb.tenantID, userID, lessonID)
}

// ============================================================================
// Module & Lesson Keys
// ============================================================================

// Module returns key for a module
func (kb *KeyBuilder) Module(moduleID uuid.UUID) string {
	return fmt.Sprintf("%s:module:%s", kb.tenantID, moduleID)
}

// CourseModules returns key for course modules
func (kb *KeyBuilder) CourseModules(courseID uuid.UUID) string {
	return fmt.Sprintf("%s:modules:course:%s", kb.tenantID, courseID)
}

// Lesson returns key for a lesson
func (kb *KeyBuilder) Lesson(lessonID uuid.UUID) string {
	return fmt.Sprintf("%s:lesson:%s", kb.tenantID, lessonID)
}

// CourseLessons returns key for course lessons
func (kb *KeyBuilder) CourseLessons(courseID uuid.UUID) string {
	return fmt.Sprintf("%s:lessons:course:%s", kb.tenantID, courseID)
}

// ModuleLessons returns key for module lessons
func (kb *KeyBuilder) ModuleLessons(moduleID uuid.UUID) string {
	return fmt.Sprintf("%s:lessons:module:%s", kb.tenantID, moduleID)
}

// ============================================================================
// Quiz & Assignment Keys
// ============================================================================

// Quiz returns key for a quiz
func (kb *KeyBuilder) Quiz(quizID uuid.UUID) string {
	return fmt.Sprintf("%s:quiz:%s", kb.tenantID, quizID)
}

// QuizAttempt returns key for a quiz attempt
func (kb *KeyBuilder) QuizAttempt(attemptID uuid.UUID) string {
	return fmt.Sprintf("%s:quiz:attempt:%s", kb.tenantID, attemptID)
}

// Assignment returns key for an assignment
func (kb *KeyBuilder) Assignment(assignmentID uuid.UUID) string {
	return fmt.Sprintf("%s:assignment:%s", kb.tenantID, assignmentID)
}

// AssignmentSubmission returns key for an assignment submission
func (kb *KeyBuilder) AssignmentSubmission(submissionID uuid.UUID) string {
	return fmt.Sprintf("%s:assignment:submission:%s", kb.tenantID, submissionID)
}

// ============================================================================
// Review Keys
// ============================================================================

// CourseReviews returns key for course reviews list
func (kb *KeyBuilder) CourseReviews(courseID uuid.UUID, page, limit int) string {
	return fmt.Sprintf("%s:reviews:course:%s:%d:%d", kb.tenantID, courseID, page, limit)
}

// UserReview returns key for user's review of a course
func (kb *KeyBuilder) UserReview(userID, courseID uuid.UUID) string {
	return fmt.Sprintf("%s:review:user:%s:course:%s", kb.tenantID, userID, courseID)
}

// ============================================================================
// Notification Keys
// ============================================================================

// UserNotifications returns key for user notifications
func (kb *KeyBuilder) UserNotifications(userID uuid.UUID) string {
	return fmt.Sprintf("%s:notifications:user:%s", kb.tenantID, userID)
}

// UnreadNotificationCount returns key for unread notification count
func (kb *KeyBuilder) UnreadNotificationCount(userID uuid.UUID) string {
	return fmt.Sprintf("%s:notifications:user:%s:unread:count", kb.tenantID, userID)
}

// ============================================================================
// Media Keys
// ============================================================================

// MediaURL returns key for media URL (presigned URL)
func (kb *KeyBuilder) MediaURL(mediaID uuid.UUID) string {
	return fmt.Sprintf("%s:media:%s:url", kb.tenantID, mediaID)
}

// UserMedia returns key for user's media list
func (kb *KeyBuilder) UserMedia(userID uuid.UUID) string {
	return fmt.Sprintf("%s:media:user:%s", kb.tenantID, userID)
}

// ============================================================================
// Category Keys
// ============================================================================

// Category returns key for a category
func (kb *KeyBuilder) Category(categoryID uuid.UUID) string {
	return fmt.Sprintf("%s:category:%s", kb.tenantID, categoryID)
}

// CategoryBySlug returns key for a category by slug
func (kb *KeyBuilder) CategoryBySlug(slug string) string {
	return fmt.Sprintf("%s:category:slug:%s", kb.tenantID, slug)
}

// ActiveCategories returns key for active categories list
func (kb *KeyBuilder) ActiveCategories() string {
	return fmt.Sprintf("%s:categories:active", kb.tenantID)
}

// Subcategories returns key for subcategories
func (kb *KeyBuilder) Subcategories(parentID uuid.UUID) string {
	return fmt.Sprintf("%s:categories:parent:%s", kb.tenantID, parentID)
}

// ============================================================================
// Certificate Keys
// ============================================================================

// Certificate returns key for a certificate
func (kb *KeyBuilder) Certificate(certificateID uuid.UUID) string {
	return fmt.Sprintf("%s:certificate:%s", kb.tenantID, certificateID)
}

// UserCertificates returns key for user's certificates
func (kb *KeyBuilder) UserCertificates(userID uuid.UUID) string {
	return fmt.Sprintf("%s:certificates:user:%s", kb.tenantID, userID)
}

// ============================================================================
// Rate Limiting Keys
// ============================================================================

// RateLimit returns key for rate limiting
func (kb *KeyBuilder) RateLimit(identifier, action string) string {
	return fmt.Sprintf("%s:ratelimit:%s:%s", kb.tenantID, identifier, action)
}

// ============================================================================
// Lock Keys (for distributed locking)
// ============================================================================

// Lock returns key for a distributed lock
func (kb *KeyBuilder) Lock(resource string) string {
	return fmt.Sprintf("%s:lock:%s", kb.tenantID, resource)
}

// ============================================================================
// Pattern Keys (for bulk operations)
// ============================================================================

// UserPattern returns pattern for all user-related keys
func (kb *KeyBuilder) UserPattern(userID uuid.UUID) string {
	return fmt.Sprintf("%s:*:user:%s*", kb.tenantID, userID)
}

// CoursePattern returns pattern for all course-related keys
func (kb *KeyBuilder) CoursePattern(courseID uuid.UUID) string {
	return fmt.Sprintf("%s:*:course:%s*", kb.tenantID, courseID)
}

// AnalyticsPattern returns pattern for all analytics keys
func (kb *KeyBuilder) AnalyticsPattern() string {
	return fmt.Sprintf("%s:analytics:*", kb.tenantID)
}

// TenantPattern returns pattern for all tenant keys
func (kb *KeyBuilder) TenantPattern() string {
	return fmt.Sprintf("%s:*", kb.tenantID)
}
