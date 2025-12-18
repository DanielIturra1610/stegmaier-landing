package adapters

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/analytics/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/analytics/ports"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/database"
	"github.com/google/uuid"
)

// PostgreSQLAnalyticsRepository implements the AnalyticsRepository interface
type PostgreSQLAnalyticsRepository struct {
	dbManager *database.Manager
}

// NewPostgreSQLAnalyticsRepository creates a new PostgreSQL analytics repository
func NewPostgreSQLAnalyticsRepository(dbManager *database.Manager) ports.AnalyticsRepository {
	return &PostgreSQLAnalyticsRepository{
		dbManager: dbManager,
	}
}

// getTenantDB obtains the tenant database connection dynamically
func (r *PostgreSQLAnalyticsRepository) getTenantDB(tenantID uuid.UUID) (*sql.DB, error) {
	db, err := r.dbManager.GetTenantConnection(tenantID.String())
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant connection: %w", err)
	}
	return db.DB, nil
}

// ============================================================================
// Student Analytics
// ============================================================================

// GetStudentAnalytics retrieves comprehensive analytics for a student
func (r *PostgreSQLAnalyticsRepository) GetStudentAnalytics(ctx context.Context, tenantID, studentID uuid.UUID) (*domain.StudentAnalytics, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT
			$1 as tenant_id,
			$2 as student_id,
			u.name as student_name,
			u.email as student_email,
			COUNT(DISTINCT e.course_id) as total_courses,
			COUNT(DISTINCT CASE WHEN cp.completion_percentage = 100 THEN e.course_id END) as completed_courses,
			COUNT(DISTINCT CASE WHEN cp.completion_percentage > 0 AND cp.completion_percentage < 100 THEN e.course_id END) as in_progress_courses,
			COALESCE(SUM(course_lessons.total_lessons), 0) as total_lessons,
			COALESCE(SUM(course_lessons.completed_lessons), 0) as completed_lessons,
			COALESCE(SUM(course_quizzes.total_quizzes), 0) as total_quizzes,
			COALESCE(SUM(course_quizzes.completed_quizzes), 0) as completed_quizzes,
			COALESCE(AVG(course_quizzes.avg_score), 0) as average_quiz_score,
			COALESCE(SUM(course_assignments.total_assignments), 0) as total_assignments,
			COALESCE(SUM(course_assignments.submitted_assignments), 0) as submitted_assignments,
			COALESCE(AVG(course_assignments.avg_grade), 0) as average_assignment_score,
			COALESCE(SUM(cp.total_time_spent), 0) as total_time_spent,
			COUNT(DISTINCT cert.id) as certificates_earned,
			MAX(cp.last_accessed_at) as last_activity_at,
			MIN(e.enrolled_at) as enrollment_date
		FROM users u
		LEFT JOIN enrollments e ON e.user_id = u.id AND e.tenant_id = $1
		LEFT JOIN course_progress cp ON cp.enrollment_id = e.id AND cp.tenant_id = $1
		LEFT JOIN certificates cert ON cert.user_id = u.id AND cert.tenant_id = $1
		LEFT JOIN LATERAL (
			SELECT
				e.course_id,
				COUNT(l.id) as total_lessons,
				COUNT(CASE WHEN lp.is_completed THEN 1 END) as completed_lessons
			FROM lessons l
			LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $2 AND lp.tenant_id = $1
			WHERE l.course_id = e.course_id AND l.tenant_id = $1
			GROUP BY e.course_id
		) course_lessons ON true
		LEFT JOIN LATERAL (
			SELECT
				e.course_id,
				COUNT(q.id) as total_quizzes,
				COUNT(DISTINCT qa.quiz_id) as completed_quizzes,
				AVG(qa.score) as avg_score
			FROM quizzes q
			LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id AND qa.user_id = $2 AND qa.tenant_id = $1
			WHERE q.course_id = e.course_id AND q.tenant_id = $1
			GROUP BY e.course_id
		) course_quizzes ON true
		LEFT JOIN LATERAL (
			SELECT
				e.course_id,
				COUNT(a.id) as total_assignments,
				COUNT(asub.id) as submitted_assignments,
				AVG(asub.grade) as avg_grade
			FROM assignments a
			LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id AND asub.student_id = $2 AND asub.tenant_id = $1
			WHERE a.course_id = e.course_id AND a.tenant_id = $1
			GROUP BY e.course_id
		) course_assignments ON true
		WHERE u.id = $2 AND u.tenant_id = $1
		GROUP BY u.id, u.name, u.email
	`

	analytics := &domain.StudentAnalytics{}
	err = db.QueryRowContext(ctx, query, tenantID, studentID).Scan(
		&analytics.TenantID,
		&analytics.StudentID,
		&analytics.StudentName,
		&analytics.StudentEmail,
		&analytics.TotalCourses,
		&analytics.CompletedCourses,
		&analytics.InProgressCourses,
		&analytics.TotalLessons,
		&analytics.CompletedLessons,
		&analytics.TotalQuizzes,
		&analytics.CompletedQuizzes,
		&analytics.AverageQuizScore,
		&analytics.TotalAssignments,
		&analytics.SubmittedAssignments,
		&analytics.AverageAssignmentScore,
		&analytics.TotalTimeSpent,
		&analytics.CertificatesEarned,
		&analytics.LastActivityAt,
		&analytics.EnrollmentDate,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, domain.ErrDataNotFound
		}
		return nil, fmt.Errorf("failed to get student analytics: %w", err)
	}

	return analytics, nil
}

// GetStudentCourseProgress retrieves student progress for a specific course
func (r *PostgreSQLAnalyticsRepository) GetStudentCourseProgress(ctx context.Context, tenantID, studentID, courseID uuid.UUID) (*domain.StudentCourseProgress, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT
			e.tenant_id,
			e.user_id as student_id,
			c.id as course_id,
			c.title as course_name,
			e.enrolled_at,
			cp.last_accessed_at,
			COALESCE(cp.completion_percentage, 0) as progress_percentage,
			COALESCE(completed_lessons.count, 0) as completed_lessons,
			COALESCE(total_lessons.count, 0) as total_lessons,
			COALESCE(cp.total_time_spent, 0) as time_spent,
			COALESCE(completed_quizzes.count, 0) as quizzes_completed,
			COALESCE(total_quizzes.count, 0) as quizzes_total_count,
			COALESCE(quiz_scores.avg_score, 0) as average_quiz_score,
			COALESCE(submitted_assignments.count, 0) as assignments_submitted,
			COALESCE(total_assignments.count, 0) as assignments_total_count,
			COALESCE(assignment_grades.avg_grade, 0) as average_assignment_score,
			CASE WHEN cp.completion_percentage = 100 THEN true ELSE false END as is_completed,
			cp.completed_at,
			CASE WHEN cert.id IS NOT NULL THEN true ELSE false END as certificate_issued
		FROM enrollments e
		INNER JOIN courses c ON c.id = e.course_id AND c.tenant_id = e.tenant_id
		LEFT JOIN course_progress cp ON cp.enrollment_id = e.id AND cp.tenant_id = e.tenant_id
		LEFT JOIN (
			SELECT course_id, COUNT(*) as count
			FROM lessons
			WHERE tenant_id = $1 AND deleted_at IS NULL
			GROUP BY course_id
		) total_lessons ON total_lessons.course_id = c.id
		LEFT JOIN (
			SELECT l.course_id, COUNT(*) as count
			FROM lessons l
			INNER JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.tenant_id = l.tenant_id
			WHERE l.tenant_id = $1 AND lp.user_id = $2 AND lp.is_completed = true
			GROUP BY l.course_id
		) completed_lessons ON completed_lessons.course_id = c.id
		LEFT JOIN (
			SELECT course_id, COUNT(*) as count
			FROM quizzes
			WHERE tenant_id = $1 AND deleted_at IS NULL
			GROUP BY course_id
		) total_quizzes ON total_quizzes.course_id = c.id
		LEFT JOIN (
			SELECT q.course_id, COUNT(DISTINCT qa.quiz_id) as count
			FROM quizzes q
			INNER JOIN quiz_attempts qa ON qa.quiz_id = q.id AND qa.tenant_id = q.tenant_id
			WHERE q.tenant_id = $1 AND qa.user_id = $2 AND qa.status = 'completed'
			GROUP BY q.course_id
		) completed_quizzes ON completed_quizzes.course_id = c.id
		LEFT JOIN (
			SELECT q.course_id, AVG(qa.score) as avg_score
			FROM quizzes q
			INNER JOIN quiz_attempts qa ON qa.quiz_id = q.id AND qa.tenant_id = q.tenant_id
			WHERE q.tenant_id = $1 AND qa.user_id = $2 AND qa.status = 'completed'
			GROUP BY q.course_id
		) quiz_scores ON quiz_scores.course_id = c.id
		LEFT JOIN (
			SELECT course_id, COUNT(*) as count
			FROM assignments
			WHERE tenant_id = $1 AND deleted_at IS NULL
			GROUP BY course_id
		) total_assignments ON total_assignments.course_id = c.id
		LEFT JOIN (
			SELECT a.course_id, COUNT(*) as count
			FROM assignments a
			INNER JOIN assignment_submissions asub ON asub.assignment_id = a.id AND asub.tenant_id = a.tenant_id
			WHERE a.tenant_id = $1 AND asub.student_id = $2 AND asub.status IN ('submitted', 'graded', 'returned')
			GROUP BY a.course_id
		) submitted_assignments ON submitted_assignments.course_id = c.id
		LEFT JOIN (
			SELECT a.course_id, AVG(asub.grade) as avg_grade
			FROM assignments a
			INNER JOIN assignment_submissions asub ON asub.assignment_id = a.id AND asub.tenant_id = a.tenant_id
			WHERE a.tenant_id = $1 AND asub.student_id = $2 AND asub.status = 'graded' AND asub.grade IS NOT NULL
			GROUP BY a.course_id
		) assignment_grades ON assignment_grades.course_id = c.id
		LEFT JOIN certificates cert ON cert.course_id = c.id AND cert.user_id = e.user_id AND cert.tenant_id = e.tenant_id
		WHERE e.tenant_id = $1 AND e.user_id = $2 AND e.course_id = $3
	`

	progress := &domain.StudentCourseProgress{}
	err = db.QueryRowContext(ctx, query, tenantID, studentID, courseID).Scan(
		&progress.TenantID,
		&progress.StudentID,
		&progress.CourseID,
		&progress.CourseName,
		&progress.EnrolledAt,
		&progress.LastAccessedAt,
		&progress.ProgressPercentage,
		&progress.CompletedLessons,
		&progress.TotalLessons,
		&progress.TimeSpent,
		&progress.QuizzesCompleted,
		&progress.QuizzesTotalCount,
		&progress.AverageQuizScore,
		&progress.AssignmentsSubmitted,
		&progress.AssignmentsTotalCount,
		&progress.AverageAssignmentScore,
		&progress.IsCompleted,
		&progress.CompletedAt,
		&progress.CertificateIssued,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, domain.ErrDataNotFound
		}
		return nil, fmt.Errorf("failed to get student course progress: %w", err)
	}

	return progress, nil
}

// GetStudentCourseProgressList retrieves student progress for all enrolled courses
func (r *PostgreSQLAnalyticsRepository) GetStudentCourseProgressList(ctx context.Context, tenantID, studentID uuid.UUID) ([]domain.StudentCourseProgress, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT
			e.tenant_id,
			e.user_id as student_id,
			c.id as course_id,
			c.title as course_name,
			e.enrolled_at,
			cp.last_accessed_at,
			COALESCE(cp.completion_percentage, 0) as progress_percentage,
			COALESCE(completed_lessons.count, 0) as completed_lessons,
			COALESCE(total_lessons.count, 0) as total_lessons,
			COALESCE(cp.total_time_spent, 0) as time_spent,
			COALESCE(completed_quizzes.count, 0) as quizzes_completed,
			COALESCE(total_quizzes.count, 0) as quizzes_total_count,
			COALESCE(quiz_scores.avg_score, 0) as average_quiz_score,
			COALESCE(submitted_assignments.count, 0) as assignments_submitted,
			COALESCE(total_assignments.count, 0) as assignments_total_count,
			COALESCE(assignment_grades.avg_grade, 0) as average_assignment_score,
			CASE WHEN cp.completion_percentage = 100 THEN true ELSE false END as is_completed,
			cp.completed_at,
			CASE WHEN cert.id IS NOT NULL THEN true ELSE false END as certificate_issued
		FROM enrollments e
		INNER JOIN courses c ON c.id = e.course_id AND c.tenant_id = e.tenant_id
		LEFT JOIN course_progress cp ON cp.enrollment_id = e.id AND cp.tenant_id = e.tenant_id
		LEFT JOIN (
			SELECT course_id, COUNT(*) as count
			FROM lessons
			WHERE tenant_id = $1 AND deleted_at IS NULL
			GROUP BY course_id
		) total_lessons ON total_lessons.course_id = c.id
		LEFT JOIN (
			SELECT l.course_id, COUNT(*) as count
			FROM lessons l
			INNER JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.tenant_id = l.tenant_id
			WHERE l.tenant_id = $1 AND lp.user_id = $2 AND lp.is_completed = true
			GROUP BY l.course_id
		) completed_lessons ON completed_lessons.course_id = c.id
		LEFT JOIN (
			SELECT course_id, COUNT(*) as count
			FROM quizzes
			WHERE tenant_id = $1 AND deleted_at IS NULL
			GROUP BY course_id
		) total_quizzes ON total_quizzes.course_id = c.id
		LEFT JOIN (
			SELECT q.course_id, COUNT(DISTINCT qa.quiz_id) as count
			FROM quizzes q
			INNER JOIN quiz_attempts qa ON qa.quiz_id = q.id AND qa.tenant_id = q.tenant_id
			WHERE q.tenant_id = $1 AND qa.user_id = $2 AND qa.status = 'completed'
			GROUP BY q.course_id
		) completed_quizzes ON completed_quizzes.course_id = c.id
		LEFT JOIN (
			SELECT q.course_id, AVG(qa.score) as avg_score
			FROM quizzes q
			INNER JOIN quiz_attempts qa ON qa.quiz_id = q.id AND qa.tenant_id = q.tenant_id
			WHERE q.tenant_id = $1 AND qa.user_id = $2 AND qa.status = 'completed'
			GROUP BY q.course_id
		) quiz_scores ON quiz_scores.course_id = c.id
		LEFT JOIN (
			SELECT course_id, COUNT(*) as count
			FROM assignments
			WHERE tenant_id = $1 AND deleted_at IS NULL
			GROUP BY course_id
		) total_assignments ON total_assignments.course_id = c.id
		LEFT JOIN (
			SELECT a.course_id, COUNT(*) as count
			FROM assignments a
			INNER JOIN assignment_submissions asub ON asub.assignment_id = a.id AND asub.tenant_id = a.tenant_id
			WHERE a.tenant_id = $1 AND asub.student_id = $2 AND asub.status IN ('submitted', 'graded', 'returned')
			GROUP BY a.course_id
		) submitted_assignments ON submitted_assignments.course_id = c.id
		LEFT JOIN (
			SELECT a.course_id, AVG(asub.grade) as avg_grade
			FROM assignments a
			INNER JOIN assignment_submissions asub ON asub.assignment_id = a.id AND asub.tenant_id = a.tenant_id
			WHERE a.tenant_id = $1 AND asub.student_id = $2 AND asub.status = 'graded' AND asub.grade IS NOT NULL
			GROUP BY a.course_id
		) assignment_grades ON assignment_grades.course_id = c.id
		LEFT JOIN certificates cert ON cert.course_id = c.id AND cert.user_id = e.user_id AND cert.tenant_id = e.tenant_id
		WHERE e.tenant_id = $1 AND e.user_id = $2
		ORDER BY e.enrolled_at DESC
	`

	rows, err := db.QueryContext(ctx, query, tenantID, studentID)
	if err != nil {
		return nil, fmt.Errorf("failed to get student course progress list: %w", err)
	}
	defer rows.Close()

	progressList := make([]domain.StudentCourseProgress, 0)
	for rows.Next() {
		progress := domain.StudentCourseProgress{}
		err := rows.Scan(
			&progress.TenantID,
			&progress.StudentID,
			&progress.CourseID,
			&progress.CourseName,
			&progress.EnrolledAt,
			&progress.LastAccessedAt,
			&progress.ProgressPercentage,
			&progress.CompletedLessons,
			&progress.TotalLessons,
			&progress.TimeSpent,
			&progress.QuizzesCompleted,
			&progress.QuizzesTotalCount,
			&progress.AverageQuizScore,
			&progress.AssignmentsSubmitted,
			&progress.AssignmentsTotalCount,
			&progress.AverageAssignmentScore,
			&progress.IsCompleted,
			&progress.CompletedAt,
			&progress.CertificateIssued,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan student course progress: %w", err)
		}
		progressList = append(progressList, progress)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating student course progress rows: %w", err)
	}

	return progressList, nil
}

// ============================================================================
// Course Analytics
// ============================================================================

// GetCourseAnalytics retrieves comprehensive analytics for a course
func (r *PostgreSQLAnalyticsRepository) GetCourseAnalytics(ctx context.Context, tenantID, courseID uuid.UUID) (*domain.CourseAnalytics, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT
			c.tenant_id,
			c.id as course_id,
			c.title as course_name,
			c.instructor_id,
			u.name as instructor_name,
			c.published_at,
			COUNT(DISTINCT e.id) as total_enrollments,
			COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.id END) as active_enrollments,
			COUNT(DISTINCT CASE WHEN cp.completion_percentage = 100 THEN e.id END) as completed_enrollments,
			COALESCE(AVG(CASE WHEN cp.completion_percentage = 100 THEN 100 ELSE 0 END), 0) as completion_rate,
			COALESCE(AVG(cp.completion_percentage), 0) as average_progress,
			(SELECT COUNT(*) FROM lessons WHERE course_id = c.id AND tenant_id = c.tenant_id AND deleted_at IS NULL) as total_lessons,
			(SELECT COUNT(*) FROM quizzes WHERE course_id = c.id AND tenant_id = c.tenant_id AND deleted_at IS NULL) as total_quizzes,
			(SELECT COUNT(*) FROM assignments WHERE course_id = c.id AND tenant_id = c.tenant_id AND deleted_at IS NULL) as total_assignments,
			COALESCE(cr.average_rating, 0) as average_rating,
			COALESCE(cr.total_reviews, 0) as total_reviews,
			COALESCE(SUM(cp.total_time_spent), 0) as total_time_spent,
			COALESCE(AVG(cp.total_time_spent), 0) as average_time_spent,
			COUNT(DISTINCT cert.id) as certificates_issued,
			MAX(e.enrolled_at) as last_enrollment_at
		FROM courses c
		INNER JOIN users u ON u.id = c.instructor_id AND u.tenant_id = c.tenant_id
		LEFT JOIN enrollments e ON e.course_id = c.id AND e.tenant_id = c.tenant_id
		LEFT JOIN course_progress cp ON cp.enrollment_id = e.id AND cp.tenant_id = e.tenant_id
		LEFT JOIN certificates cert ON cert.course_id = c.id AND cert.tenant_id = c.tenant_id
		LEFT JOIN course_ratings cr ON cr.course_id = c.id AND cr.tenant_id = c.tenant_id
		WHERE c.id = $2 AND c.tenant_id = $1 AND c.deleted_at IS NULL
		GROUP BY c.id, c.tenant_id, c.title, c.instructor_id, u.name, c.published_at, cr.average_rating, cr.total_reviews
	`

	analytics := &domain.CourseAnalytics{}
	err = db.QueryRowContext(ctx, query, tenantID, courseID).Scan(
		&analytics.TenantID,
		&analytics.CourseID,
		&analytics.CourseName,
		&analytics.InstructorID,
		&analytics.InstructorName,
		&analytics.PublishedAt,
		&analytics.TotalEnrollments,
		&analytics.ActiveEnrollments,
		&analytics.CompletedEnrollments,
		&analytics.CompletionRate,
		&analytics.AverageProgress,
		&analytics.TotalLessons,
		&analytics.TotalQuizzes,
		&analytics.TotalAssignments,
		&analytics.AverageRating,
		&analytics.TotalReviews,
		&analytics.TotalTimeSpent,
		&analytics.AverageTimeSpent,
		&analytics.CertificatesIssued,
		&analytics.LastEnrollmentAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, domain.ErrDataNotFound
		}
		return nil, fmt.Errorf("failed to get course analytics: %w", err)
	}

	return analytics, nil
}

// GetCourseEngagement retrieves engagement metrics for a course over time
func (r *PostgreSQLAnalyticsRepository) GetCourseEngagement(ctx context.Context, tenantID, courseID uuid.UUID, startDate, endDate time.Time) ([]domain.CourseEngagement, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	// This is a simplified version - in production, you'd aggregate daily/weekly data
	// For now, we'll return a single engagement record for the period
	query := `
		SELECT
			$1 as tenant_id,
			$2 as course_id,
			$3 as date,
			COUNT(DISTINCT CASE WHEN cp.last_accessed_at >= $3 AND cp.last_accessed_at <= $4 THEN e.user_id END) as active_students,
			COUNT(DISTINCT CASE WHEN e.enrolled_at >= $3 AND e.enrolled_at <= $4 THEN e.id END) as new_enrollments,
			(SELECT COUNT(*) FROM lesson_progress lp
				INNER JOIN lessons l ON l.id = lp.lesson_id
				WHERE l.course_id = $2 AND l.tenant_id = $1
				AND lp.completed_at >= $3 AND lp.completed_at <= $4) as lessons_completed,
			(SELECT COUNT(*) FROM quiz_attempts qa
				INNER JOIN quizzes q ON q.id = qa.quiz_id
				WHERE q.course_id = $2 AND q.tenant_id = $1
				AND qa.completed_at >= $3 AND qa.completed_at <= $4) as quizzes_completed,
			(SELECT COUNT(*) FROM assignment_submissions asub
				INNER JOIN assignments a ON a.id = asub.assignment_id
				WHERE a.course_id = $2 AND a.tenant_id = $1
				AND asub.submitted_at >= $3 AND asub.submitted_at <= $4) as assignments_submitted,
			COALESCE(SUM(cp.total_time_spent), 0) as total_time_spent,
			0 as dropoff_count,
			0 as retention_rate
		FROM enrollments e
		LEFT JOIN course_progress cp ON cp.enrollment_id = e.id AND cp.tenant_id = e.tenant_id
		WHERE e.course_id = $2 AND e.tenant_id = $1
		GROUP BY e.course_id
	`

	engagement := domain.CourseEngagement{}
	err = db.QueryRowContext(ctx, query, tenantID, courseID, startDate, endDate).Scan(
		&engagement.TenantID,
		&engagement.CourseID,
		&engagement.Date,
		&engagement.ActiveStudents,
		&engagement.NewEnrollments,
		&engagement.LessonsCompleted,
		&engagement.QuizzesCompleted,
		&engagement.AssignmentsSubmitted,
		&engagement.TotalTimeSpent,
		&engagement.DropoffCount,
		&engagement.RetentionRate,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return []domain.CourseEngagement{}, nil
		}
		return nil, fmt.Errorf("failed to get course engagement: %w", err)
	}

	return []domain.CourseEngagement{engagement}, nil
}

// GetLessonAnalytics retrieves analytics for a specific lesson
func (r *PostgreSQLAnalyticsRepository) GetLessonAnalytics(ctx context.Context, tenantID, lessonID uuid.UUID) (*domain.LessonAnalytics, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT
			l.tenant_id,
			l.id as lesson_id,
			l.title as lesson_title,
			l.course_id,
			COUNT(DISTINCT lp.id) as view_count,
			COUNT(DISTINCT lp.user_id) as unique_viewers,
			COUNT(DISTINCT CASE WHEN lp.is_completed THEN lp.user_id END) as completion_count,
			COALESCE(
				CAST(COUNT(DISTINCT CASE WHEN lp.is_completed THEN lp.user_id END) AS FLOAT) /
				NULLIF(COUNT(DISTINCT lp.user_id), 0) * 100,
				0
			) as completion_rate,
			COALESCE(AVG(lp.time_spent), 0) as average_time_spent,
			COALESCE(AVG(CASE WHEN l.content_type = 'video' THEN lp.video_progress ELSE NULL END), 0) as average_watch_time,
			COALESCE(
				CAST(COUNT(DISTINCT CASE WHEN NOT lp.is_completed THEN lp.user_id END) AS FLOAT) /
				NULLIF(COUNT(DISTINCT lp.user_id), 0) * 100,
				0
			) as dropoff_rate,
			COALESCE(AVG(lp.progress_percentage), 0) as average_progress
		FROM lessons l
		LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.tenant_id = l.tenant_id
		WHERE l.id = $2 AND l.tenant_id = $1 AND l.deleted_at IS NULL
		GROUP BY l.id, l.tenant_id, l.title, l.course_id, l.content_type
	`

	analytics := &domain.LessonAnalytics{}
	err = db.QueryRowContext(ctx, query, tenantID, lessonID).Scan(
		&analytics.TenantID,
		&analytics.LessonID,
		&analytics.LessonTitle,
		&analytics.CourseID,
		&analytics.ViewCount,
		&analytics.UniqueViewers,
		&analytics.CompletionCount,
		&analytics.CompletionRate,
		&analytics.AverageTimeSpent,
		&analytics.AverageWatchTime,
		&analytics.DropoffRate,
		&analytics.AverageProgress,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, domain.ErrDataNotFound
		}
		return nil, fmt.Errorf("failed to get lesson analytics: %w", err)
	}

	return analytics, nil
}

// GetCourseLessonAnalytics retrieves analytics for all lessons in a course
func (r *PostgreSQLAnalyticsRepository) GetCourseLessonAnalytics(ctx context.Context, tenantID, courseID uuid.UUID) ([]domain.LessonAnalytics, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT
			l.tenant_id,
			l.id as lesson_id,
			l.title as lesson_title,
			l.course_id,
			COUNT(DISTINCT lp.id) as view_count,
			COUNT(DISTINCT lp.user_id) as unique_viewers,
			COUNT(DISTINCT CASE WHEN lp.is_completed THEN lp.user_id END) as completion_count,
			COALESCE(
				CAST(COUNT(DISTINCT CASE WHEN lp.is_completed THEN lp.user_id END) AS FLOAT) /
				NULLIF(COUNT(DISTINCT lp.user_id), 0) * 100,
				0
			) as completion_rate,
			COALESCE(AVG(lp.time_spent), 0) as average_time_spent,
			COALESCE(AVG(CASE WHEN l.content_type = 'video' THEN lp.video_progress ELSE NULL END), 0) as average_watch_time,
			COALESCE(
				CAST(COUNT(DISTINCT CASE WHEN NOT lp.is_completed THEN lp.user_id END) AS FLOAT) /
				NULLIF(COUNT(DISTINCT lp.user_id), 0) * 100,
				0
			) as dropoff_rate,
			COALESCE(AVG(lp.progress_percentage), 0) as average_progress
		FROM lessons l
		LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.tenant_id = l.tenant_id
		WHERE l.course_id = $2 AND l.tenant_id = $1 AND l.deleted_at IS NULL
		GROUP BY l.id, l.tenant_id, l.title, l.course_id, l.content_type
		ORDER BY l.order_index
	`

	rows, err := db.QueryContext(ctx, query, tenantID, courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get course lesson analytics: %w", err)
	}
	defer rows.Close()

	analyticsList := make([]domain.LessonAnalytics, 0)
	for rows.Next() {
		analytics := domain.LessonAnalytics{}
		err := rows.Scan(
			&analytics.TenantID,
			&analytics.LessonID,
			&analytics.LessonTitle,
			&analytics.CourseID,
			&analytics.ViewCount,
			&analytics.UniqueViewers,
			&analytics.CompletionCount,
			&analytics.CompletionRate,
			&analytics.AverageTimeSpent,
			&analytics.AverageWatchTime,
			&analytics.DropoffRate,
			&analytics.AverageProgress,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan lesson analytics: %w", err)
		}
		analyticsList = append(analyticsList, analytics)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating lesson analytics rows: %w", err)
	}

	return analyticsList, nil
}

// ============================================================================
// Instructor Analytics
// ============================================================================

// GetInstructorAnalytics retrieves comprehensive analytics for an instructor
func (r *PostgreSQLAnalyticsRepository) GetInstructorAnalytics(ctx context.Context, tenantID, instructorID uuid.UUID) (*domain.InstructorAnalytics, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT
			$1 as tenant_id,
			$2 as instructor_id,
			u.name as instructor_name,
			COUNT(DISTINCT c.id) as total_courses,
			COUNT(DISTINCT CASE WHEN c.status = 'published' THEN c.id END) as published_courses,
			COUNT(DISTINCT CASE WHEN c.status = 'draft' THEN c.id END) as draft_courses,
			COUNT(DISTINCT e.user_id) as total_students,
			COUNT(DISTINCT e.id) as total_enrollments,
			COUNT(DISTINCT CASE WHEN cp.last_accessed_at >= NOW() - INTERVAL '30 days' THEN e.user_id END) as active_students,
			COALESCE(AVG(cr.average_rating), 0) as average_rating,
			COALESCE(SUM(cr.total_reviews), 0) as total_reviews,
			(SELECT COUNT(*) FROM lessons l INNER JOIN courses c2 ON c2.id = l.course_id WHERE c2.instructor_id = $2 AND c2.tenant_id = $1 AND l.deleted_at IS NULL) as total_lessons,
			(SELECT COUNT(*) FROM quizzes q INNER JOIN courses c2 ON c2.id = q.course_id WHERE c2.instructor_id = $2 AND c2.tenant_id = $1 AND q.deleted_at IS NULL) as total_quizzes,
			(SELECT COUNT(*) FROM assignments a INNER JOIN courses c2 ON c2.id = a.course_id WHERE c2.instructor_id = $2 AND c2.tenant_id = $1 AND a.deleted_at IS NULL) as total_assignments,
			COUNT(DISTINCT cert.id) as certificates_issued,
			COALESCE(AVG(CASE WHEN cp.completion_percentage = 100 THEN 100 ELSE 0 END), 0) as average_course_completion
		FROM users u
		LEFT JOIN courses c ON c.instructor_id = u.id AND c.tenant_id = u.tenant_id AND c.deleted_at IS NULL
		LEFT JOIN enrollments e ON e.course_id = c.id AND e.tenant_id = c.tenant_id
		LEFT JOIN course_progress cp ON cp.enrollment_id = e.id AND cp.tenant_id = e.tenant_id
		LEFT JOIN course_ratings cr ON cr.course_id = c.id AND cr.tenant_id = c.tenant_id
		LEFT JOIN certificates cert ON cert.course_id = c.id AND cert.tenant_id = c.tenant_id
		WHERE u.id = $2 AND u.tenant_id = $1
		GROUP BY u.id, u.name
	`

	analytics := &domain.InstructorAnalytics{}
	err = db.QueryRowContext(ctx, query, tenantID, instructorID).Scan(
		&analytics.TenantID,
		&analytics.InstructorID,
		&analytics.InstructorName,
		&analytics.TotalCourses,
		&analytics.PublishedCourses,
		&analytics.DraftCourses,
		&analytics.TotalStudents,
		&analytics.TotalEnrollments,
		&analytics.ActiveStudents,
		&analytics.AverageRating,
		&analytics.TotalReviews,
		&analytics.TotalLessons,
		&analytics.TotalQuizzes,
		&analytics.TotalAssignments,
		&analytics.CertificatesIssued,
		&analytics.AverageCourseCompletion,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, domain.ErrDataNotFound
		}
		return nil, fmt.Errorf("failed to get instructor analytics: %w", err)
	}

	return analytics, nil
}

// GetInstructorCourseAnalytics retrieves analytics for all courses by an instructor
func (r *PostgreSQLAnalyticsRepository) GetInstructorCourseAnalytics(ctx context.Context, tenantID, instructorID uuid.UUID) ([]domain.CourseAnalytics, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT
			c.tenant_id,
			c.id as course_id,
			c.title as course_name,
			c.instructor_id,
			u.name as instructor_name,
			c.published_at,
			COUNT(DISTINCT e.id) as total_enrollments,
			COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.id END) as active_enrollments,
			COUNT(DISTINCT CASE WHEN cp.completion_percentage = 100 THEN e.id END) as completed_enrollments,
			COALESCE(AVG(CASE WHEN cp.completion_percentage = 100 THEN 100 ELSE 0 END), 0) as completion_rate,
			COALESCE(AVG(cp.completion_percentage), 0) as average_progress,
			(SELECT COUNT(*) FROM lessons WHERE course_id = c.id AND tenant_id = c.tenant_id AND deleted_at IS NULL) as total_lessons,
			(SELECT COUNT(*) FROM quizzes WHERE course_id = c.id AND tenant_id = c.tenant_id AND deleted_at IS NULL) as total_quizzes,
			(SELECT COUNT(*) FROM assignments WHERE course_id = c.id AND tenant_id = c.tenant_id AND deleted_at IS NULL) as total_assignments,
			COALESCE(cr.average_rating, 0) as average_rating,
			COALESCE(cr.total_reviews, 0) as total_reviews,
			COALESCE(SUM(cp.total_time_spent), 0) as total_time_spent,
			COALESCE(AVG(cp.total_time_spent), 0) as average_time_spent,
			COUNT(DISTINCT cert.id) as certificates_issued,
			MAX(e.enrolled_at) as last_enrollment_at
		FROM courses c
		INNER JOIN users u ON u.id = c.instructor_id AND u.tenant_id = c.tenant_id
		LEFT JOIN enrollments e ON e.course_id = c.id AND e.tenant_id = c.tenant_id
		LEFT JOIN course_progress cp ON cp.enrollment_id = e.id AND cp.tenant_id = e.tenant_id
		LEFT JOIN certificates cert ON cert.course_id = c.id AND cert.tenant_id = c.tenant_id
		LEFT JOIN course_ratings cr ON cr.course_id = c.id AND cr.tenant_id = c.tenant_id
		WHERE c.instructor_id = $2 AND c.tenant_id = $1 AND c.deleted_at IS NULL
		GROUP BY c.id, c.tenant_id, c.title, c.instructor_id, u.name, c.published_at, cr.average_rating, cr.total_reviews
		ORDER BY c.created_at DESC
	`

	rows, err := db.QueryContext(ctx, query, tenantID, instructorID)
	if err != nil {
		return nil, fmt.Errorf("failed to get instructor course analytics: %w", err)
	}
	defer rows.Close()

	analyticsList := make([]domain.CourseAnalytics, 0)
	for rows.Next() {
		analytics := domain.CourseAnalytics{}
		err := rows.Scan(
			&analytics.TenantID,
			&analytics.CourseID,
			&analytics.CourseName,
			&analytics.InstructorID,
			&analytics.InstructorName,
			&analytics.PublishedAt,
			&analytics.TotalEnrollments,
			&analytics.ActiveEnrollments,
			&analytics.CompletedEnrollments,
			&analytics.CompletionRate,
			&analytics.AverageProgress,
			&analytics.TotalLessons,
			&analytics.TotalQuizzes,
			&analytics.TotalAssignments,
			&analytics.AverageRating,
			&analytics.TotalReviews,
			&analytics.TotalTimeSpent,
			&analytics.AverageTimeSpent,
			&analytics.CertificatesIssued,
			&analytics.LastEnrollmentAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan course analytics: %w", err)
		}
		analyticsList = append(analyticsList, analytics)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating course analytics rows: %w", err)
	}

	return analyticsList, nil
}

// ============================================================================
// Platform Analytics
// ============================================================================

// GetPlatformAnalytics retrieves overall platform analytics for a specific date
func (r *PostgreSQLAnalyticsRepository) GetPlatformAnalytics(ctx context.Context, tenantID uuid.UUID, date time.Time) (*domain.PlatformAnalytics, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT
			$1 as tenant_id,
			$2 as date,
			COUNT(DISTINCT u.id) as total_users,
			COUNT(DISTINCT CASE WHEN u.last_login_at >= NOW() - INTERVAL '30 days' THEN u.id END) as active_users,
			COUNT(DISTINCT CASE WHEN u.created_at::date = $2::date THEN u.id END) as new_users,
			COUNT(DISTINCT CASE WHEN u.role = 'instructor' THEN u.id END) as total_instructors,
			COUNT(DISTINCT CASE WHEN u.role = 'instructor' AND u.last_login_at >= NOW() - INTERVAL '30 days' THEN u.id END) as active_instructors,
			COUNT(DISTINCT CASE WHEN u.role = 'student' THEN u.id END) as total_students,
			COUNT(DISTINCT CASE WHEN u.role = 'student' AND u.last_login_at >= NOW() - INTERVAL '30 days' THEN u.id END) as active_students,
			(SELECT COUNT(*) FROM courses WHERE tenant_id = $1 AND deleted_at IS NULL) as total_courses,
			(SELECT COUNT(*) FROM courses WHERE tenant_id = $1 AND status = 'published' AND deleted_at IS NULL) as published_courses,
			(SELECT COUNT(*) FROM enrollments WHERE tenant_id = $1) as total_enrollments,
			(SELECT COUNT(*) FROM enrollments WHERE tenant_id = $1 AND enrolled_at::date = $2::date) as new_enrollments,
			(SELECT COUNT(*) FROM course_progress WHERE tenant_id = $1 AND completion_percentage = 100) as completed_courses,
			(SELECT COUNT(*) FROM certificates WHERE tenant_id = $1) as certificates_issued,
			(SELECT COUNT(*) FROM lessons WHERE tenant_id = $1 AND deleted_at IS NULL) as total_lessons,
			(SELECT COUNT(*) FROM lesson_progress WHERE tenant_id = $1 AND is_completed = true) as completed_lessons,
			(SELECT COUNT(*) FROM quizzes WHERE tenant_id = $1 AND deleted_at IS NULL) as total_quizzes,
			(SELECT COUNT(*) FROM quiz_attempts WHERE tenant_id = $1 AND status = 'completed') as completed_quizzes,
			(SELECT COUNT(*) FROM assignments WHERE tenant_id = $1 AND deleted_at IS NULL) as total_assignments,
			(SELECT COUNT(*) FROM assignment_submissions WHERE tenant_id = $1 AND status IN ('submitted', 'graded', 'returned')) as submitted_assignments,
			COALESCE((SELECT AVG(average_rating) FROM course_ratings WHERE tenant_id = $1), 0) as average_rating,
			(SELECT COUNT(*) FROM reviews WHERE tenant_id = $1 AND deleted_at IS NULL) as total_reviews
		FROM users u
		WHERE u.tenant_id = $1
	`

	analytics := &domain.PlatformAnalytics{}
	err = db.QueryRowContext(ctx, query, tenantID, date).Scan(
		&analytics.TenantID,
		&analytics.Date,
		&analytics.TotalUsers,
		&analytics.ActiveUsers,
		&analytics.NewUsers,
		&analytics.TotalInstructors,
		&analytics.ActiveInstructors,
		&analytics.TotalStudents,
		&analytics.ActiveStudents,
		&analytics.TotalCourses,
		&analytics.PublishedCourses,
		&analytics.TotalEnrollments,
		&analytics.NewEnrollments,
		&analytics.CompletedCourses,
		&analytics.CertificatesIssued,
		&analytics.TotalLessons,
		&analytics.CompletedLessons,
		&analytics.TotalQuizzes,
		&analytics.CompletedQuizzes,
		&analytics.TotalAssignments,
		&analytics.SubmittedAssignments,
		&analytics.AverageRating,
		&analytics.TotalReviews,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, domain.ErrDataNotFound
		}
		return nil, fmt.Errorf("failed to get platform analytics: %w", err)
	}

	return analytics, nil
}

// GetPlatformAnalyticsRange retrieves platform analytics for a date range
func (r *PostgreSQLAnalyticsRepository) GetPlatformAnalyticsRange(ctx context.Context, tenantID uuid.UUID, startDate, endDate time.Time) ([]domain.PlatformAnalytics, error) {
	// For simplicity, we'll return daily aggregates
	analyticsList := make([]domain.PlatformAnalytics, 0)

	// Iterate through each day in the range
	currentDate := startDate
	for currentDate.Before(endDate) || currentDate.Equal(endDate) {
		analytics, err := r.GetPlatformAnalytics(ctx, tenantID, currentDate)
		if err != nil && err != domain.ErrDataNotFound {
			return nil, err
		}
		if analytics != nil {
			analyticsList = append(analyticsList, *analytics)
		}
		currentDate = currentDate.AddDate(0, 0, 1) // Add one day
	}

	return analyticsList, nil
}

// ============================================================================
// Time Series Analytics
// ============================================================================

// GetTimeSeriesData retrieves time series data for a specific metric
func (r *PostgreSQLAnalyticsRepository) GetTimeSeriesData(ctx context.Context, tenantID uuid.UUID, metric string, startDate, endDate time.Time, period string) (*domain.TimeSeriesData, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	// This is a simplified implementation
	// In production, you'd have a more sophisticated time series aggregation

	timeSeriesData := &domain.TimeSeriesData{
		Metric:     metric,
		StartDate:  startDate,
		EndDate:    endDate,
		DataPoints: make([]domain.TimeSeriesDataPoint, 0),
	}

	var query string
	switch metric {
	case "enrollments":
		query = `
			SELECT
				DATE_TRUNC($4, enrolled_at) as date,
				COUNT(*) as value
			FROM enrollments
			WHERE tenant_id = $1 AND enrolled_at >= $2 AND enrolled_at <= $3
			GROUP BY DATE_TRUNC($4, enrolled_at)
			ORDER BY date
		`
	case "completions":
		query = `
			SELECT
				DATE_TRUNC($4, completed_at) as date,
				COUNT(*) as value
			FROM course_progress
			WHERE tenant_id = $1 AND completed_at >= $2 AND completed_at <= $3 AND completion_percentage = 100
			GROUP BY DATE_TRUNC($4, completed_at)
			ORDER BY date
		`
	case "new_users":
		query = `
			SELECT
				DATE_TRUNC($4, created_at) as date,
				COUNT(*) as value
			FROM users
			WHERE tenant_id = $1 AND created_at >= $2 AND created_at <= $3
			GROUP BY DATE_TRUNC($4, created_at)
			ORDER BY date
		`
	default:
		return nil, domain.ErrInvalidMetric
	}

	rows, err := db.QueryContext(ctx, query, tenantID, startDate, endDate, period)
	if err != nil {
		return nil, fmt.Errorf("failed to get time series data: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var dataPoint domain.TimeSeriesDataPoint
		err := rows.Scan(&dataPoint.Date, &dataPoint.Value)
		if err != nil {
			return nil, fmt.Errorf("failed to scan time series data point: %w", err)
		}
		timeSeriesData.DataPoints = append(timeSeriesData.DataPoints, dataPoint)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating time series rows: %w", err)
	}

	return timeSeriesData, nil
}

// GetCourseTimeSeriesData retrieves time series data for a course metric
func (r *PostgreSQLAnalyticsRepository) GetCourseTimeSeriesData(ctx context.Context, tenantID, courseID uuid.UUID, metric string, startDate, endDate time.Time, period string) (*domain.TimeSeriesData, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	timeSeriesData := &domain.TimeSeriesData{
		Metric:     metric,
		StartDate:  startDate,
		EndDate:    endDate,
		DataPoints: make([]domain.TimeSeriesDataPoint, 0),
	}

	var query string
	switch metric {
	case "enrollments":
		query = `
			SELECT
				DATE_TRUNC($5, enrolled_at) as date,
				COUNT(*) as value
			FROM enrollments
			WHERE tenant_id = $1 AND course_id = $2 AND enrolled_at >= $3 AND enrolled_at <= $4
			GROUP BY DATE_TRUNC($5, enrolled_at)
			ORDER BY date
		`
	case "completions":
		query = `
			SELECT
				DATE_TRUNC($5, cp.completed_at) as date,
				COUNT(*) as value
			FROM course_progress cp
			INNER JOIN enrollments e ON e.id = cp.enrollment_id
			WHERE cp.tenant_id = $1 AND e.course_id = $2 AND cp.completed_at >= $3 AND cp.completed_at <= $4 AND cp.completion_percentage = 100
			GROUP BY DATE_TRUNC($5, cp.completed_at)
			ORDER BY date
		`
	default:
		return nil, domain.ErrInvalidMetric
	}

	rows, err := db.QueryContext(ctx, query, tenantID, courseID, startDate, endDate, period)
	if err != nil {
		return nil, fmt.Errorf("failed to get course time series data: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var dataPoint domain.TimeSeriesDataPoint
		err := rows.Scan(&dataPoint.Date, &dataPoint.Value)
		if err != nil {
			return nil, fmt.Errorf("failed to scan time series data point: %w", err)
		}
		timeSeriesData.DataPoints = append(timeSeriesData.DataPoints, dataPoint)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating time series rows: %w", err)
	}

	return timeSeriesData, nil
}

// GetStudentTimeSeriesData retrieves time series data for a student metric
func (r *PostgreSQLAnalyticsRepository) GetStudentTimeSeriesData(ctx context.Context, tenantID, studentID uuid.UUID, metric string, startDate, endDate time.Time, period string) (*domain.TimeSeriesData, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	timeSeriesData := &domain.TimeSeriesData{
		Metric:     metric,
		StartDate:  startDate,
		EndDate:    endDate,
		DataPoints: make([]domain.TimeSeriesDataPoint, 0),
	}

	var query string
	switch metric {
	case "progress":
		query = `
			SELECT
				DATE_TRUNC($5, cp.updated_at) as date,
				AVG(cp.completion_percentage) as value
			FROM course_progress cp
			INNER JOIN enrollments e ON e.id = cp.enrollment_id
			WHERE cp.tenant_id = $1 AND e.user_id = $2 AND cp.updated_at >= $3 AND cp.updated_at <= $4
			GROUP BY DATE_TRUNC($5, cp.updated_at)
			ORDER BY date
		`
	case "time_spent":
		query = `
			SELECT
				DATE_TRUNC($5, lp.updated_at) as date,
				SUM(lp.time_spent) as value
			FROM lesson_progress lp
			WHERE lp.tenant_id = $1 AND lp.user_id = $2 AND lp.updated_at >= $3 AND lp.updated_at <= $4
			GROUP BY DATE_TRUNC($5, lp.updated_at)
			ORDER BY date
		`
	default:
		return nil, domain.ErrInvalidMetric
	}

	rows, err := db.QueryContext(ctx, query, tenantID, studentID, startDate, endDate, period)
	if err != nil {
		return nil, fmt.Errorf("failed to get student time series data: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var dataPoint domain.TimeSeriesDataPoint
		err := rows.Scan(&dataPoint.Date, &dataPoint.Value)
		if err != nil {
			return nil, fmt.Errorf("failed to scan time series data point: %w", err)
		}
		timeSeriesData.DataPoints = append(timeSeriesData.DataPoints, dataPoint)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating time series rows: %w", err)
	}

	return timeSeriesData, nil
}

// ============================================================================
// Leaderboard
// ============================================================================

// GetLeaderboard retrieves leaderboard data for a specific metric
func (r *PostgreSQLAnalyticsRepository) GetLeaderboard(ctx context.Context, tenantID uuid.UUID, metric string, limit int, period string) ([]domain.LeaderboardEntry, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	var query string
	var whereClause string

	// Add time filter based on period
	switch period {
	case "week":
		whereClause = "AND e.enrolled_at >= NOW() - INTERVAL '7 days'"
	case "month":
		whereClause = "AND e.enrolled_at >= NOW() - INTERVAL '30 days'"
	case "all-time":
		whereClause = ""
	}

	switch metric {
	case "courses_completed":
		query = fmt.Sprintf(`
			SELECT
				ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank,
				u.id as user_id,
				u.name as user_name,
				u.avatar as user_avatar,
				COUNT(*) as score,
				COUNT(*)::text || ' courses' as value
			FROM users u
			INNER JOIN enrollments e ON e.user_id = u.id AND e.tenant_id = u.tenant_id
			INNER JOIN course_progress cp ON cp.enrollment_id = e.id AND cp.tenant_id = e.tenant_id
			WHERE u.tenant_id = $1 AND cp.completion_percentage = 100 %s
			GROUP BY u.id, u.name, u.avatar
			ORDER BY score DESC
			LIMIT $2
		`, whereClause)
	case "quiz_score":
		query = fmt.Sprintf(`
			SELECT
				ROW_NUMBER() OVER (ORDER BY AVG(qa.score) DESC) as rank,
				u.id as user_id,
				u.name as user_name,
				u.avatar as user_avatar,
				AVG(qa.score) as score,
				ROUND(AVG(qa.score), 1)::text || '%%' as value
			FROM users u
			INNER JOIN quiz_attempts qa ON qa.user_id = u.id AND qa.tenant_id = u.tenant_id
			WHERE u.tenant_id = $1 AND qa.status = 'completed' %s
			GROUP BY u.id, u.name, u.avatar
			HAVING COUNT(qa.id) >= 3
			ORDER BY score DESC
			LIMIT $2
		`, whereClause)
	case "time_spent":
		query = fmt.Sprintf(`
			SELECT
				ROW_NUMBER() OVER (ORDER BY SUM(cp.total_time_spent) DESC) as rank,
				u.id as user_id,
				u.name as user_name,
				u.avatar as user_avatar,
				SUM(cp.total_time_spent) as score,
				ROUND(SUM(cp.total_time_spent) / 60.0, 1)::text || ' hours' as value
			FROM users u
			INNER JOIN enrollments e ON e.user_id = u.id AND e.tenant_id = u.tenant_id
			INNER JOIN course_progress cp ON cp.enrollment_id = e.id AND cp.tenant_id = e.tenant_id
			WHERE u.tenant_id = $1 %s
			GROUP BY u.id, u.name, u.avatar
			ORDER BY score DESC
			LIMIT $2
		`, whereClause)
	case "certificates":
		query = fmt.Sprintf(`
			SELECT
				ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank,
				u.id as user_id,
				u.name as user_name,
				u.avatar as user_avatar,
				COUNT(*) as score,
				COUNT(*)::text || ' certificates' as value
			FROM users u
			INNER JOIN certificates cert ON cert.user_id = u.id AND cert.tenant_id = u.tenant_id
			WHERE u.tenant_id = $1 %s
			GROUP BY u.id, u.name, u.avatar
			ORDER BY score DESC
			LIMIT $2
		`, whereClause)
	default:
		return nil, domain.ErrInvalidMetric
	}

	rows, err := db.QueryContext(ctx, query, tenantID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get leaderboard: %w", err)
	}
	defer rows.Close()

	entries := make([]domain.LeaderboardEntry, 0)
	for rows.Next() {
		var entry domain.LeaderboardEntry
		entry.Metric = metric
		err := rows.Scan(
			&entry.Rank,
			&entry.UserID,
			&entry.UserName,
			&entry.UserAvatar,
			&entry.Score,
			&entry.Value,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan leaderboard entry: %w", err)
		}
		entries = append(entries, entry)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating leaderboard rows: %w", err)
	}

	return entries, nil
}

// GetCourseLeaderboard retrieves leaderboard data for a specific course
func (r *PostgreSQLAnalyticsRepository) GetCourseLeaderboard(ctx context.Context, tenantID, courseID uuid.UUID, metric string, limit int) ([]domain.LeaderboardEntry, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	var query string

	switch metric {
	case "progress":
		query = `
			SELECT
				ROW_NUMBER() OVER (ORDER BY cp.completion_percentage DESC) as rank,
				u.id as user_id,
				u.name as user_name,
				u.avatar as user_avatar,
				cp.completion_percentage as score,
				ROUND(cp.completion_percentage, 1)::text || '%' as value
			FROM users u
			INNER JOIN enrollments e ON e.user_id = u.id AND e.tenant_id = u.tenant_id
			INNER JOIN course_progress cp ON cp.enrollment_id = e.id AND cp.tenant_id = e.tenant_id
			WHERE u.tenant_id = $1 AND e.course_id = $2
			ORDER BY score DESC
			LIMIT $3
		`
	case "quiz_score":
		query = `
			SELECT
				ROW_NUMBER() OVER (ORDER BY AVG(qa.score) DESC) as rank,
				u.id as user_id,
				u.name as user_name,
				u.avatar as user_avatar,
				AVG(qa.score) as score,
				ROUND(AVG(qa.score), 1)::text || '%' as value
			FROM users u
			INNER JOIN quiz_attempts qa ON qa.user_id = u.id AND qa.tenant_id = u.tenant_id
			INNER JOIN quizzes q ON q.id = qa.quiz_id AND q.tenant_id = qa.tenant_id
			WHERE u.tenant_id = $1 AND q.course_id = $2 AND qa.status = 'completed'
			GROUP BY u.id, u.name, u.avatar
			ORDER BY score DESC
			LIMIT $3
		`
	default:
		return nil, domain.ErrInvalidMetric
	}

	rows, err := db.QueryContext(ctx, query, tenantID, courseID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get course leaderboard: %w", err)
	}
	defer rows.Close()

	entries := make([]domain.LeaderboardEntry, 0)
	for rows.Next() {
		var entry domain.LeaderboardEntry
		entry.Metric = metric
		err := rows.Scan(
			&entry.Rank,
			&entry.UserID,
			&entry.UserName,
			&entry.UserAvatar,
			&entry.Score,
			&entry.Value,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan course leaderboard entry: %w", err)
		}
		entries = append(entries, entry)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating course leaderboard rows: %w", err)
	}

	return entries, nil
}

// ============================================================================
// Quiz Analytics
// ============================================================================

// GetQuizAnalytics retrieves analytics for a specific quiz
func (r *PostgreSQLAnalyticsRepository) GetQuizAnalytics(ctx context.Context, tenantID, quizID uuid.UUID) (*domain.QuizAnalytics, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT
			q.tenant_id,
			q.id as quiz_id,
			q.title as quiz_title,
			q.course_id,
			c.title as course_name,
			COUNT(qa.id) as total_attempts,
			COUNT(DISTINCT qa.user_id) as unique_students,
			COALESCE(AVG(qa.score), 0) as average_score,
			COALESCE(AVG(CASE WHEN qa.score >= q.passing_score THEN 100 ELSE 0 END), 0) as pass_rate,
			COALESCE(AVG(attempt_count.count), 0) as average_attempts,
			COALESCE(AVG(EXTRACT(EPOCH FROM (qa.completed_at - qa.started_at))), 0) as average_time_spent
		FROM quizzes q
		INNER JOIN courses c ON c.id = q.course_id AND c.tenant_id = q.tenant_id
		LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id AND qa.tenant_id = q.tenant_id AND qa.status = 'completed'
		LEFT JOIN (
			SELECT user_id, quiz_id, COUNT(*) as count
			FROM quiz_attempts
			WHERE tenant_id = $1 AND quiz_id = $2
			GROUP BY user_id, quiz_id
		) attempt_count ON attempt_count.user_id = qa.user_id AND attempt_count.quiz_id = qa.quiz_id
		WHERE q.id = $2 AND q.tenant_id = $1 AND q.deleted_at IS NULL
		GROUP BY q.id, q.tenant_id, q.title, q.course_id, c.title, q.passing_score
	`

	analytics := &domain.QuizAnalytics{}
	var avgTimeSeconds float64
	err = db.QueryRowContext(ctx, query, tenantID, quizID).Scan(
		&analytics.TenantID,
		&analytics.QuizID,
		&analytics.QuizTitle,
		&analytics.CourseID,
		&analytics.CourseName,
		&analytics.TotalAttempts,
		&analytics.UniqueStudents,
		&analytics.AverageScore,
		&analytics.PassRate,
		&analytics.AverageAttempts,
		&avgTimeSeconds,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, domain.ErrDataNotFound
		}
		return nil, fmt.Errorf("failed to get quiz analytics: %w", err)
	}

	analytics.AverageTimeSpent = int(avgTimeSeconds)
	analytics.DifficultQuestions = make([]uuid.UUID, 0) // Will be populated by GetQuestionAnalytics

	return analytics, nil
}

// GetQuestionAnalytics retrieves analytics for quiz questions
func (r *PostgreSQLAnalyticsRepository) GetQuestionAnalytics(ctx context.Context, tenantID, quizID uuid.UUID) ([]domain.QuestionAnalytics, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT
			qq.tenant_id,
			qq.id as question_id,
			qq.quiz_id,
			qq.question_text,
			qq.question_type,
			COUNT(qaa.id) as total_attempts,
			COUNT(CASE WHEN qaa.is_correct THEN 1 END) as correct_answers,
			COUNT(CASE WHEN NOT qaa.is_correct THEN 1 END) as incorrect_answers,
			COALESCE(AVG(CASE WHEN qaa.is_correct THEN 100 ELSE 0 END), 0) as success_rate,
			COALESCE(AVG(qaa.time_spent), 0) as average_time_spent
		FROM quiz_questions qq
		LEFT JOIN quiz_attempt_answers qaa ON qaa.question_id = qq.id AND qaa.tenant_id = qq.tenant_id
		WHERE qq.quiz_id = $2 AND qq.tenant_id = $1
		GROUP BY qq.id, qq.tenant_id, qq.quiz_id, qq.question_text, qq.question_type
		ORDER BY success_rate ASC
	`

	rows, err := db.QueryContext(ctx, query, tenantID, quizID)
	if err != nil {
		return nil, fmt.Errorf("failed to get question analytics: %w", err)
	}
	defer rows.Close()

	analyticsList := make([]domain.QuestionAnalytics, 0)
	for rows.Next() {
		analytics := domain.QuestionAnalytics{}
		err := rows.Scan(
			&analytics.TenantID,
			&analytics.QuestionID,
			&analytics.QuizID,
			&analytics.QuestionText,
			&analytics.QuestionType,
			&analytics.TotalAttempts,
			&analytics.CorrectAnswers,
			&analytics.IncorrectAnswers,
			&analytics.SuccessRate,
			&analytics.AverageTimeSpent,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan question analytics: %w", err)
		}
		analyticsList = append(analyticsList, analytics)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating question analytics rows: %w", err)
	}

	return analyticsList, nil
}

// GetCourseQuizAnalytics retrieves analytics for all quizzes in a course
func (r *PostgreSQLAnalyticsRepository) GetCourseQuizAnalytics(ctx context.Context, tenantID, courseID uuid.UUID) ([]domain.QuizAnalytics, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT
			q.tenant_id,
			q.id as quiz_id,
			q.title as quiz_title,
			q.course_id,
			c.title as course_name,
			COUNT(qa.id) as total_attempts,
			COUNT(DISTINCT qa.user_id) as unique_students,
			COALESCE(AVG(qa.score), 0) as average_score,
			COALESCE(AVG(CASE WHEN qa.score >= q.passing_score THEN 100 ELSE 0 END), 0) as pass_rate,
			0 as average_attempts,
			COALESCE(AVG(EXTRACT(EPOCH FROM (qa.completed_at - qa.started_at))), 0) as average_time_spent
		FROM quizzes q
		INNER JOIN courses c ON c.id = q.course_id AND c.tenant_id = q.tenant_id
		LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id AND qa.tenant_id = q.tenant_id AND qa.status = 'completed'
		WHERE q.course_id = $2 AND q.tenant_id = $1 AND q.deleted_at IS NULL
		GROUP BY q.id, q.tenant_id, q.title, q.course_id, c.title, q.passing_score
		ORDER BY q.created_at
	`

	rows, err := db.QueryContext(ctx, query, tenantID, courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get course quiz analytics: %w", err)
	}
	defer rows.Close()

	analyticsList := make([]domain.QuizAnalytics, 0)
	for rows.Next() {
		analytics := domain.QuizAnalytics{}
		var avgTimeSeconds float64
		err := rows.Scan(
			&analytics.TenantID,
			&analytics.QuizID,
			&analytics.QuizTitle,
			&analytics.CourseID,
			&analytics.CourseName,
			&analytics.TotalAttempts,
			&analytics.UniqueStudents,
			&analytics.AverageScore,
			&analytics.PassRate,
			&analytics.AverageAttempts,
			&avgTimeSeconds,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan quiz analytics: %w", err)
		}
		analytics.AverageTimeSpent = int(avgTimeSeconds)
		analytics.DifficultQuestions = make([]uuid.UUID, 0)
		analyticsList = append(analyticsList, analytics)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating quiz analytics rows: %w", err)
	}

	return analyticsList, nil
}

// ============================================================================
// Assignment Analytics
// ============================================================================

// GetAssignmentAnalytics retrieves analytics for a specific assignment
func (r *PostgreSQLAnalyticsRepository) GetAssignmentAnalytics(ctx context.Context, tenantID, assignmentID uuid.UUID) (*domain.AssignmentAnalytics, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT
			a.tenant_id,
			a.id as assignment_id,
			a.title as assignment_title,
			a.course_id,
			c.title as course_name,
			COUNT(asub.id) as total_submissions,
			COUNT(DISTINCT asub.student_id) as unique_students,
			COALESCE(
				CAST(COUNT(asub.id) AS FLOAT) / NULLIF((SELECT COUNT(DISTINCT e.user_id) FROM enrollments e WHERE e.course_id = a.course_id AND e.tenant_id = a.tenant_id), 0) * 100,
				0
			) as submission_rate,
			COALESCE(AVG(asub.grade), 0) as average_grade,
			COALESCE(AVG(CASE WHEN asub.grade >= a.passing_score THEN 100 ELSE 0 END), 0) as pass_rate,
			COALESCE(AVG(EXTRACT(EPOCH FROM (asub.submitted_at - e.enrolled_at)) / 3600), 0) as average_time_to_submit,
			COUNT(CASE WHEN asub.submitted_at <= a.due_date THEN 1 END) as on_time_submissions,
			COUNT(CASE WHEN asub.submitted_at > a.due_date THEN 1 END) as late_submissions,
			COUNT(CASE WHEN asub.status = 'submitted' THEN 1 END) as pending_reviews
		FROM assignments a
		INNER JOIN courses c ON c.id = a.course_id AND c.tenant_id = a.tenant_id
		LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id AND asub.tenant_id = a.tenant_id AND asub.status IN ('submitted', 'graded', 'returned')
		LEFT JOIN enrollments e ON e.user_id = asub.student_id AND e.course_id = a.course_id AND e.tenant_id = a.tenant_id
		WHERE a.id = $2 AND a.tenant_id = $1 AND a.deleted_at IS NULL
		GROUP BY a.id, a.tenant_id, a.title, a.course_id, c.title, a.passing_score, a.due_date
	`

	analytics := &domain.AssignmentAnalytics{}
	var avgTimeHours float64
	err = db.QueryRowContext(ctx, query, tenantID, assignmentID).Scan(
		&analytics.TenantID,
		&analytics.AssignmentID,
		&analytics.AssignmentTitle,
		&analytics.CourseID,
		&analytics.CourseName,
		&analytics.TotalSubmissions,
		&analytics.UniqueStudents,
		&analytics.SubmissionRate,
		&analytics.AverageGrade,
		&analytics.PassRate,
		&avgTimeHours,
		&analytics.OnTimeSubmissions,
		&analytics.LateSubmissions,
		&analytics.PendingReviews,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, domain.ErrDataNotFound
		}
		return nil, fmt.Errorf("failed to get assignment analytics: %w", err)
	}

	analytics.AverageTimeToSubmit = int(avgTimeHours)

	return analytics, nil
}

// GetCourseAssignmentAnalytics retrieves analytics for all assignments in a course
func (r *PostgreSQLAnalyticsRepository) GetCourseAssignmentAnalytics(ctx context.Context, tenantID, courseID uuid.UUID) ([]domain.AssignmentAnalytics, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT
			a.tenant_id,
			a.id as assignment_id,
			a.title as assignment_title,
			a.course_id,
			c.title as course_name,
			COUNT(asub.id) as total_submissions,
			COUNT(DISTINCT asub.student_id) as unique_students,
			COALESCE(
				CAST(COUNT(asub.id) AS FLOAT) / NULLIF((SELECT COUNT(DISTINCT e.user_id) FROM enrollments e WHERE e.course_id = a.course_id AND e.tenant_id = a.tenant_id), 0) * 100,
				0
			) as submission_rate,
			COALESCE(AVG(asub.grade), 0) as average_grade,
			COALESCE(AVG(CASE WHEN asub.grade >= a.passing_score THEN 100 ELSE 0 END), 0) as pass_rate,
			0 as average_time_to_submit,
			COUNT(CASE WHEN asub.submitted_at <= a.due_date THEN 1 END) as on_time_submissions,
			COUNT(CASE WHEN asub.submitted_at > a.due_date THEN 1 END) as late_submissions,
			COUNT(CASE WHEN asub.status = 'submitted' THEN 1 END) as pending_reviews
		FROM assignments a
		INNER JOIN courses c ON c.id = a.course_id AND c.tenant_id = a.tenant_id
		LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id AND asub.tenant_id = a.tenant_id AND asub.status IN ('submitted', 'graded', 'returned')
		WHERE a.course_id = $2 AND a.tenant_id = $1 AND a.deleted_at IS NULL
		GROUP BY a.id, a.tenant_id, a.title, a.course_id, c.title, a.passing_score, a.due_date
		ORDER BY a.created_at
	`

	rows, err := db.QueryContext(ctx, query, tenantID, courseID)
	if err != nil {
		return nil, fmt.Errorf("failed to get course assignment analytics: %w", err)
	}
	defer rows.Close()

	analyticsList := make([]domain.AssignmentAnalytics, 0)
	for rows.Next() {
		analytics := domain.AssignmentAnalytics{}
		err := rows.Scan(
			&analytics.TenantID,
			&analytics.AssignmentID,
			&analytics.AssignmentTitle,
			&analytics.CourseID,
			&analytics.CourseName,
			&analytics.TotalSubmissions,
			&analytics.UniqueStudents,
			&analytics.SubmissionRate,
			&analytics.AverageGrade,
			&analytics.PassRate,
			&analytics.AverageTimeToSubmit,
			&analytics.OnTimeSubmissions,
			&analytics.LateSubmissions,
			&analytics.PendingReviews,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan assignment analytics: %w", err)
		}
		analyticsList = append(analyticsList, analytics)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating assignment analytics rows: %w", err)
	}

	return analyticsList, nil
}

// ============================================================================
// Dashboard Data
// ============================================================================

// GetRecentActivity retrieves recent activity logs
func (r *PostgreSQLAnalyticsRepository) GetRecentActivity(ctx context.Context, tenantID uuid.UUID, limit int) ([]domain.ActivityLog, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT
			id,
			'enrollment' as type,
			'Student enrolled in ' || c.title as description,
			u.id as user_id,
			u.name as user_name,
			enrolled_at as timestamp
		FROM enrollments e
		INNER JOIN courses c ON c.id = e.course_id AND c.tenant_id = e.tenant_id
		INNER JOIN users u ON u.id = e.user_id AND u.tenant_id = e.tenant_id
		WHERE e.tenant_id = $1
		UNION ALL
		SELECT
			cp.id,
			'completion' as type,
			'Student completed ' || c.title as description,
			u.id as user_id,
			u.name as user_name,
			cp.completed_at as timestamp
		FROM course_progress cp
		INNER JOIN enrollments e ON e.id = cp.enrollment_id AND e.tenant_id = cp.tenant_id
		INNER JOIN courses c ON c.id = e.course_id AND c.tenant_id = e.tenant_id
		INNER JOIN users u ON u.id = e.user_id AND u.tenant_id = e.tenant_id
		WHERE cp.tenant_id = $1 AND cp.completion_percentage = 100 AND cp.completed_at IS NOT NULL
		ORDER BY timestamp DESC
		LIMIT $2
	`

	rows, err := db.QueryContext(ctx, query, tenantID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get recent activity: %w", err)
	}
	defer rows.Close()

	activityList := make([]domain.ActivityLog, 0)
	for rows.Next() {
		activity := domain.ActivityLog{}
		err := rows.Scan(
			&activity.ID,
			&activity.Type,
			&activity.Description,
			&activity.UserID,
			&activity.UserName,
			&activity.Timestamp,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan activity log: %w", err)
		}
		activityList = append(activityList, activity)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating activity log rows: %w", err)
	}

	return activityList, nil
}

// GetUserRecentActivity retrieves recent activity logs for a specific user
func (r *PostgreSQLAnalyticsRepository) GetUserRecentActivity(ctx context.Context, tenantID, userID uuid.UUID, limit int) ([]domain.ActivityLog, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT
			id,
			'enrollment' as type,
			'Enrolled in ' || c.title as description,
			user_id,
			'' as user_name,
			enrolled_at as timestamp
		FROM enrollments e
		INNER JOIN courses c ON c.id = e.course_id AND c.tenant_id = e.tenant_id
		WHERE e.tenant_id = $1 AND e.user_id = $2
		UNION ALL
		SELECT
			lp.id,
			'lesson_completion' as type,
			'Completed lesson: ' || l.title as description,
			lp.user_id,
			'' as user_name,
			lp.completed_at as timestamp
		FROM lesson_progress lp
		INNER JOIN lessons l ON l.id = lp.lesson_id AND l.tenant_id = lp.tenant_id
		WHERE lp.tenant_id = $1 AND lp.user_id = $2 AND lp.is_completed = true
		ORDER BY timestamp DESC
		LIMIT $3
	`

	rows, err := db.QueryContext(ctx, query, tenantID, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get user recent activity: %w", err)
	}
	defer rows.Close()

	activityList := make([]domain.ActivityLog, 0)
	for rows.Next() {
		activity := domain.ActivityLog{}
		err := rows.Scan(
			&activity.ID,
			&activity.Type,
			&activity.Description,
			&activity.UserID,
			&activity.UserName,
			&activity.Timestamp,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan user activity log: %w", err)
		}
		activityList = append(activityList, activity)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating user activity log rows: %w", err)
	}

	return activityList, nil
}

// GetUpcomingDeadlines retrieves upcoming deadlines for a student
func (r *PostgreSQLAnalyticsRepository) GetUpcomingDeadlines(ctx context.Context, tenantID, studentID uuid.UUID, limit int) ([]domain.UpcomingDeadline, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT
			a.id,
			'assignment' as type,
			a.title,
			c.title as course_name,
			a.due_date,
			CASE WHEN a.due_date < NOW() THEN true ELSE false END as is_overdue
		FROM assignments a
		INNER JOIN courses c ON c.id = a.course_id AND c.tenant_id = a.tenant_id
		INNER JOIN enrollments e ON e.course_id = c.id AND e.tenant_id = c.tenant_id
		LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id AND asub.student_id = e.user_id AND asub.tenant_id = a.tenant_id
		WHERE a.tenant_id = $1 AND e.user_id = $2 AND a.due_date IS NOT NULL
		  AND asub.id IS NULL
		  AND a.deleted_at IS NULL
		ORDER BY a.due_date
		LIMIT $3
	`

	rows, err := db.QueryContext(ctx, query, tenantID, studentID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get upcoming deadlines: %w", err)
	}
	defer rows.Close()

	deadlines := make([]domain.UpcomingDeadline, 0)
	for rows.Next() {
		deadline := domain.UpcomingDeadline{}
		err := rows.Scan(
			&deadline.ID,
			&deadline.Type,
			&deadline.Title,
			&deadline.CourseName,
			&deadline.DueDate,
			&deadline.IsOverdue,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan upcoming deadline: %w", err)
		}
		deadlines = append(deadlines, deadline)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating upcoming deadlines rows: %w", err)
	}

	return deadlines, nil
}
