package adapters

import (
	"context"
	"database/sql"
	"log"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/progress/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/progress/ports"
	"github.com/google/uuid"
)

// PostgreSQLProgressRepository implements the ProgressRepository interface
type PostgreSQLProgressRepository struct {
	db *sql.DB
}

// NewPostgreSQLProgressRepository creates a new PostgreSQL progress repository
func NewPostgreSQLProgressRepository(db *sql.DB) ports.ProgressRepository {
	return &PostgreSQLProgressRepository{
		db: db,
	}
}

// ============================================================
// Course Progress CRUD operations
// ============================================================

// CreateProgress creates a new course progress
func (r *PostgreSQLProgressRepository) CreateProgress(ctx context.Context, progress *domain.CourseProgress) error {
	query := `
		INSERT INTO course_progress (
			id, tenant_id, user_id, course_id, enrollment_id, status,
			progress_percentage, completed_lessons, total_lessons,
			completed_quizzes, total_quizzes, total_time_spent,
			started_at, completed_at, last_accessed_at, certificate_id,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
	`

	_, err := r.db.ExecContext(ctx, query,
		progress.ID,
		progress.TenantID,
		progress.UserID,
		progress.CourseID,
		progress.EnrollmentID,
		progress.Status,
		progress.ProgressPercentage,
		progress.CompletedLessons,
		progress.TotalLessons,
		progress.CompletedQuizzes,
		progress.TotalQuizzes,
		progress.TotalTimeSpent,
		progress.StartedAt,
		progress.CompletedAt,
		progress.LastAccessedAt,
		progress.CertificateID,
		progress.CreatedAt,
		progress.UpdatedAt,
	)

	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error creating progress: %v", err)
		return ports.ErrProgressCreationFailed
	}

	return nil
}

// GetProgress retrieves a progress by ID
func (r *PostgreSQLProgressRepository) GetProgress(ctx context.Context, progressID, tenantID uuid.UUID) (*domain.CourseProgress, error) {
	query := `
		SELECT id, tenant_id, user_id, course_id, enrollment_id, status,
			   progress_percentage, completed_lessons, total_lessons,
			   completed_quizzes, total_quizzes, total_time_spent,
			   started_at, completed_at, last_accessed_at, certificate_id,
			   created_at, updated_at
		FROM course_progress
		WHERE id = $1 AND tenant_id = $2
	`

	progress := &domain.CourseProgress{}
	err := r.db.QueryRowContext(ctx, query, progressID, tenantID).Scan(
		&progress.ID,
		&progress.TenantID,
		&progress.UserID,
		&progress.CourseID,
		&progress.EnrollmentID,
		&progress.Status,
		&progress.ProgressPercentage,
		&progress.CompletedLessons,
		&progress.TotalLessons,
		&progress.CompletedQuizzes,
		&progress.TotalQuizzes,
		&progress.TotalTimeSpent,
		&progress.StartedAt,
		&progress.CompletedAt,
		&progress.LastAccessedAt,
		&progress.CertificateID,
		&progress.CreatedAt,
		&progress.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ports.ErrProgressNotFound
	}
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error getting progress: %v", err)
		return nil, err
	}

	return progress, nil
}

// GetProgressByUserAndCourse retrieves progress by user and course
func (r *PostgreSQLProgressRepository) GetProgressByUserAndCourse(ctx context.Context, userID, courseID, tenantID uuid.UUID) (*domain.CourseProgress, error) {
	query := `
		SELECT id, tenant_id, user_id, course_id, enrollment_id, status,
			   progress_percentage, completed_lessons, total_lessons,
			   completed_quizzes, total_quizzes, total_time_spent,
			   started_at, completed_at, last_accessed_at, certificate_id,
			   created_at, updated_at
		FROM course_progress
		WHERE user_id = $1 AND course_id = $2 AND tenant_id = $3
	`

	progress := &domain.CourseProgress{}
	err := r.db.QueryRowContext(ctx, query, userID, courseID, tenantID).Scan(
		&progress.ID,
		&progress.TenantID,
		&progress.UserID,
		&progress.CourseID,
		&progress.EnrollmentID,
		&progress.Status,
		&progress.ProgressPercentage,
		&progress.CompletedLessons,
		&progress.TotalLessons,
		&progress.CompletedQuizzes,
		&progress.TotalQuizzes,
		&progress.TotalTimeSpent,
		&progress.StartedAt,
		&progress.CompletedAt,
		&progress.LastAccessedAt,
		&progress.CertificateID,
		&progress.CreatedAt,
		&progress.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ports.ErrProgressNotFound
	}
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error getting progress by user and course: %v", err)
		return nil, err
	}

	return progress, nil
}

// GetProgressByEnrollment retrieves progress by enrollment ID
func (r *PostgreSQLProgressRepository) GetProgressByEnrollment(ctx context.Context, enrollmentID, tenantID uuid.UUID) (*domain.CourseProgress, error) {
	query := `
		SELECT id, tenant_id, user_id, course_id, enrollment_id, status,
			   progress_percentage, completed_lessons, total_lessons,
			   completed_quizzes, total_quizzes, total_time_spent,
			   started_at, completed_at, last_accessed_at, certificate_id,
			   created_at, updated_at
		FROM course_progress
		WHERE enrollment_id = $1 AND tenant_id = $2
	`

	progress := &domain.CourseProgress{}
	err := r.db.QueryRowContext(ctx, query, enrollmentID, tenantID).Scan(
		&progress.ID,
		&progress.TenantID,
		&progress.UserID,
		&progress.CourseID,
		&progress.EnrollmentID,
		&progress.Status,
		&progress.ProgressPercentage,
		&progress.CompletedLessons,
		&progress.TotalLessons,
		&progress.CompletedQuizzes,
		&progress.TotalQuizzes,
		&progress.TotalTimeSpent,
		&progress.StartedAt,
		&progress.CompletedAt,
		&progress.LastAccessedAt,
		&progress.CertificateID,
		&progress.CreatedAt,
		&progress.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ports.ErrProgressNotFound
	}
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error getting progress by enrollment: %v", err)
		return nil, err
	}

	return progress, nil
}

// ListProgressByUser lists all progress for a user with pagination
func (r *PostgreSQLProgressRepository) ListProgressByUser(ctx context.Context, userID, tenantID uuid.UUID, page, pageSize int) ([]*domain.CourseProgress, int, error) {
	// Get total count
	var totalCount int
	countQuery := `SELECT COUNT(*) FROM course_progress WHERE user_id = $1 AND tenant_id = $2`
	err := r.db.QueryRowContext(ctx, countQuery, userID, tenantID).Scan(&totalCount)
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error counting progress by user: %v", err)
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	query := `
		SELECT id, tenant_id, user_id, course_id, enrollment_id, status,
			   progress_percentage, completed_lessons, total_lessons,
			   completed_quizzes, total_quizzes, total_time_spent,
			   started_at, completed_at, last_accessed_at, certificate_id,
			   created_at, updated_at
		FROM course_progress
		WHERE user_id = $1 AND tenant_id = $2
		ORDER BY updated_at DESC
		LIMIT $3 OFFSET $4
	`

	rows, err := r.db.QueryContext(ctx, query, userID, tenantID, pageSize, offset)
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error listing progress by user: %v", err)
		return nil, 0, err
	}
	defer rows.Close()

	var progressList []*domain.CourseProgress
	for rows.Next() {
		progress := &domain.CourseProgress{}
		err := rows.Scan(
			&progress.ID,
			&progress.TenantID,
			&progress.UserID,
			&progress.CourseID,
			&progress.EnrollmentID,
			&progress.Status,
			&progress.ProgressPercentage,
			&progress.CompletedLessons,
			&progress.TotalLessons,
			&progress.CompletedQuizzes,
			&progress.TotalQuizzes,
			&progress.TotalTimeSpent,
			&progress.StartedAt,
			&progress.CompletedAt,
			&progress.LastAccessedAt,
			&progress.CertificateID,
			&progress.CreatedAt,
			&progress.UpdatedAt,
		)
		if err != nil {
			log.Printf("[PostgreSQLProgressRepository] Error scanning progress: %v", err)
			return nil, 0, err
		}
		progressList = append(progressList, progress)
	}

	if err = rows.Err(); err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error iterating progress rows: %v", err)
		return nil, 0, err
	}

	return progressList, totalCount, nil
}

// ListProgressByCourse lists all progress for a course with pagination
func (r *PostgreSQLProgressRepository) ListProgressByCourse(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) ([]*domain.CourseProgress, int, error) {
	// Get total count
	var totalCount int
	countQuery := `SELECT COUNT(*) FROM course_progress WHERE course_id = $1 AND tenant_id = $2`
	err := r.db.QueryRowContext(ctx, countQuery, courseID, tenantID).Scan(&totalCount)
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error counting progress by course: %v", err)
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	query := `
		SELECT id, tenant_id, user_id, course_id, enrollment_id, status,
			   progress_percentage, completed_lessons, total_lessons,
			   completed_quizzes, total_quizzes, total_time_spent,
			   started_at, completed_at, last_accessed_at, certificate_id,
			   created_at, updated_at
		FROM course_progress
		WHERE course_id = $1 AND tenant_id = $2
		ORDER BY updated_at DESC
		LIMIT $3 OFFSET $4
	`

	rows, err := r.db.QueryContext(ctx, query, courseID, tenantID, pageSize, offset)
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error listing progress by course: %v", err)
		return nil, 0, err
	}
	defer rows.Close()

	var progressList []*domain.CourseProgress
	for rows.Next() {
		progress := &domain.CourseProgress{}
		err := rows.Scan(
			&progress.ID,
			&progress.TenantID,
			&progress.UserID,
			&progress.CourseID,
			&progress.EnrollmentID,
			&progress.Status,
			&progress.ProgressPercentage,
			&progress.CompletedLessons,
			&progress.TotalLessons,
			&progress.CompletedQuizzes,
			&progress.TotalQuizzes,
			&progress.TotalTimeSpent,
			&progress.StartedAt,
			&progress.CompletedAt,
			&progress.LastAccessedAt,
			&progress.CertificateID,
			&progress.CreatedAt,
			&progress.UpdatedAt,
		)
		if err != nil {
			log.Printf("[PostgreSQLProgressRepository] Error scanning progress: %v", err)
			return nil, 0, err
		}
		progressList = append(progressList, progress)
	}

	if err = rows.Err(); err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error iterating progress rows: %v", err)
		return nil, 0, err
	}

	return progressList, totalCount, nil
}

// UpdateProgress updates a course progress
func (r *PostgreSQLProgressRepository) UpdateProgress(ctx context.Context, progress *domain.CourseProgress) error {
	query := `
		UPDATE course_progress
		SET status = $1, progress_percentage = $2,
			completed_lessons = $3, total_lessons = $4,
			completed_quizzes = $5, total_quizzes = $6,
			total_time_spent = $7, started_at = $8,
			completed_at = $9, last_accessed_at = $10,
			certificate_id = $11, updated_at = $12
		WHERE id = $13 AND tenant_id = $14
	`

	result, err := r.db.ExecContext(ctx, query,
		progress.Status,
		progress.ProgressPercentage,
		progress.CompletedLessons,
		progress.TotalLessons,
		progress.CompletedQuizzes,
		progress.TotalQuizzes,
		progress.TotalTimeSpent,
		progress.StartedAt,
		progress.CompletedAt,
		progress.LastAccessedAt,
		progress.CertificateID,
		progress.UpdatedAt,
		progress.ID,
		progress.TenantID,
	)

	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error updating progress: %v", err)
		return ports.ErrProgressUpdateFailed
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error checking rows affected: %v", err)
		return err
	}

	if rowsAffected == 0 {
		return ports.ErrProgressNotFound
	}

	return nil
}

// DeleteProgress deletes a course progress
func (r *PostgreSQLProgressRepository) DeleteProgress(ctx context.Context, progressID, tenantID uuid.UUID) error {
	query := `DELETE FROM course_progress WHERE id = $1 AND tenant_id = $2`

	result, err := r.db.ExecContext(ctx, query, progressID, tenantID)
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error deleting progress: %v", err)
		return ports.ErrProgressDeletionFailed
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error checking rows affected: %v", err)
		return err
	}

	if rowsAffected == 0 {
		return ports.ErrProgressNotFound
	}

	return nil
}

// ============================================================
// Progress status operations
// ============================================================

// MarkProgressAsStarted marks progress as started
func (r *PostgreSQLProgressRepository) MarkProgressAsStarted(ctx context.Context, progressID, tenantID uuid.UUID) error {
	now := time.Now().UTC()
	query := `
		UPDATE course_progress
		SET status = $1, started_at = $2, last_accessed_at = $3, updated_at = $4
		WHERE id = $5 AND tenant_id = $6 AND status = $7
	`

	result, err := r.db.ExecContext(ctx, query,
		domain.ProgressStatusInProgress,
		now,
		now,
		now,
		progressID,
		tenantID,
		domain.ProgressStatusNotStarted,
	)

	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error marking progress as started: %v", err)
		return ports.ErrProgressUpdateFailed
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error checking rows affected: %v", err)
		return err
	}

	if rowsAffected == 0 {
		return ports.ErrProgressNotFound
	}

	return nil
}

// MarkProgressAsCompleted marks progress as completed
func (r *PostgreSQLProgressRepository) MarkProgressAsCompleted(ctx context.Context, progressID, tenantID uuid.UUID, certificateID *uuid.UUID) error {
	now := time.Now().UTC()
	query := `
		UPDATE course_progress
		SET status = $1, progress_percentage = $2, completed_at = $3,
			last_accessed_at = $4, certificate_id = $5, updated_at = $6
		WHERE id = $7 AND tenant_id = $8
	`

	result, err := r.db.ExecContext(ctx, query,
		domain.ProgressStatusCompleted,
		100,
		now,
		now,
		certificateID,
		now,
		progressID,
		tenantID,
	)

	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error marking progress as completed: %v", err)
		return ports.ErrProgressUpdateFailed
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error checking rows affected: %v", err)
		return err
	}

	if rowsAffected == 0 {
		return ports.ErrProgressNotFound
	}

	return nil
}

// UpdateLastAccessed updates the last accessed timestamp
func (r *PostgreSQLProgressRepository) UpdateLastAccessed(ctx context.Context, progressID, tenantID uuid.UUID) error {
	now := time.Now().UTC()
	query := `
		UPDATE course_progress
		SET last_accessed_at = $1, updated_at = $2
		WHERE id = $3 AND tenant_id = $4
	`

	result, err := r.db.ExecContext(ctx, query, now, now, progressID, tenantID)
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error updating last accessed: %v", err)
		return ports.ErrProgressUpdateFailed
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error checking rows affected: %v", err)
		return err
	}

	if rowsAffected == 0 {
		return ports.ErrProgressNotFound
	}

	return nil
}

// UpdateProgressData updates progress completion data
func (r *PostgreSQLProgressRepository) UpdateProgressData(ctx context.Context, progressID, tenantID uuid.UUID, completedLessons, completedQuizzes, timeSpent int) error {
	now := time.Now().UTC()
	query := `
		UPDATE course_progress
		SET completed_lessons = $1, completed_quizzes = $2,
			total_time_spent = $3, last_accessed_at = $4, updated_at = $5
		WHERE id = $6 AND tenant_id = $7
	`

	result, err := r.db.ExecContext(ctx, query,
		completedLessons,
		completedQuizzes,
		timeSpent,
		now,
		now,
		progressID,
		tenantID,
	)

	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error updating progress data: %v", err)
		return ports.ErrProgressUpdateFailed
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error checking rows affected: %v", err)
		return err
	}

	if rowsAffected == 0 {
		return ports.ErrProgressNotFound
	}

	return nil
}

// ============================================================
// Progress Snapshot operations
// ============================================================

// CreateSnapshot creates a new progress snapshot
func (r *PostgreSQLProgressRepository) CreateSnapshot(ctx context.Context, snapshot *domain.ProgressSnapshot) error {
	query := `
		INSERT INTO progress_snapshots (
			id, tenant_id, user_id, course_id, enrollment_id,
			progress_percentage, completed_lessons, completed_quizzes,
			total_time_spent, milestone_type, milestone_data,
			snapshot_date, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`

	_, err := r.db.ExecContext(ctx, query,
		snapshot.ID,
		snapshot.TenantID,
		snapshot.UserID,
		snapshot.CourseID,
		snapshot.EnrollmentID,
		snapshot.ProgressPercentage,
		snapshot.CompletedLessons,
		snapshot.CompletedQuizzes,
		snapshot.TotalTimeSpent,
		snapshot.MilestoneType,
		snapshot.MilestoneData,
		snapshot.SnapshotDate,
		snapshot.CreatedAt,
	)

	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error creating snapshot: %v", err)
		return ports.ErrSnapshotCreationFailed
	}

	return nil
}

// GetSnapshot retrieves a snapshot by ID
func (r *PostgreSQLProgressRepository) GetSnapshot(ctx context.Context, snapshotID, tenantID uuid.UUID) (*domain.ProgressSnapshot, error) {
	query := `
		SELECT id, tenant_id, user_id, course_id, enrollment_id,
			   progress_percentage, completed_lessons, completed_quizzes,
			   total_time_spent, milestone_type, milestone_data,
			   snapshot_date, created_at
		FROM progress_snapshots
		WHERE id = $1 AND tenant_id = $2
	`

	snapshot := &domain.ProgressSnapshot{}
	err := r.db.QueryRowContext(ctx, query, snapshotID, tenantID).Scan(
		&snapshot.ID,
		&snapshot.TenantID,
		&snapshot.UserID,
		&snapshot.CourseID,
		&snapshot.EnrollmentID,
		&snapshot.ProgressPercentage,
		&snapshot.CompletedLessons,
		&snapshot.CompletedQuizzes,
		&snapshot.TotalTimeSpent,
		&snapshot.MilestoneType,
		&snapshot.MilestoneData,
		&snapshot.SnapshotDate,
		&snapshot.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ports.ErrSnapshotNotFound
	}
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error getting snapshot: %v", err)
		return nil, err
	}

	return snapshot, nil
}

// ListSnapshotsByProgress lists snapshots for a user's progress in a course
func (r *PostgreSQLProgressRepository) ListSnapshotsByProgress(ctx context.Context, userID, courseID, tenantID uuid.UUID, page, pageSize int) ([]*domain.ProgressSnapshot, int, error) {
	// Get total count
	var totalCount int
	countQuery := `SELECT COUNT(*) FROM progress_snapshots WHERE user_id = $1 AND course_id = $2 AND tenant_id = $3`
	err := r.db.QueryRowContext(ctx, countQuery, userID, courseID, tenantID).Scan(&totalCount)
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error counting snapshots: %v", err)
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	query := `
		SELECT id, tenant_id, user_id, course_id, enrollment_id,
			   progress_percentage, completed_lessons, completed_quizzes,
			   total_time_spent, milestone_type, milestone_data,
			   snapshot_date, created_at
		FROM progress_snapshots
		WHERE user_id = $1 AND course_id = $2 AND tenant_id = $3
		ORDER BY snapshot_date DESC
		LIMIT $4 OFFSET $5
	`

	rows, err := r.db.QueryContext(ctx, query, userID, courseID, tenantID, pageSize, offset)
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error listing snapshots: %v", err)
		return nil, 0, err
	}
	defer rows.Close()

	var snapshots []*domain.ProgressSnapshot
	for rows.Next() {
		snapshot := &domain.ProgressSnapshot{}
		err := rows.Scan(
			&snapshot.ID,
			&snapshot.TenantID,
			&snapshot.UserID,
			&snapshot.CourseID,
			&snapshot.EnrollmentID,
			&snapshot.ProgressPercentage,
			&snapshot.CompletedLessons,
			&snapshot.CompletedQuizzes,
			&snapshot.TotalTimeSpent,
			&snapshot.MilestoneType,
			&snapshot.MilestoneData,
			&snapshot.SnapshotDate,
			&snapshot.CreatedAt,
		)
		if err != nil {
			log.Printf("[PostgreSQLProgressRepository] Error scanning snapshot: %v", err)
			return nil, 0, err
		}
		snapshots = append(snapshots, snapshot)
	}

	if err = rows.Err(); err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error iterating snapshot rows: %v", err)
		return nil, 0, err
	}

	return snapshots, totalCount, nil
}

// ListSnapshotsByMilestone lists snapshots for a specific milestone type
func (r *PostgreSQLProgressRepository) ListSnapshotsByMilestone(ctx context.Context, userID, courseID, tenantID uuid.UUID, milestoneType domain.MilestoneType) ([]*domain.ProgressSnapshot, error) {
	query := `
		SELECT id, tenant_id, user_id, course_id, enrollment_id,
			   progress_percentage, completed_lessons, completed_quizzes,
			   total_time_spent, milestone_type, milestone_data,
			   snapshot_date, created_at
		FROM progress_snapshots
		WHERE user_id = $1 AND course_id = $2 AND tenant_id = $3 AND milestone_type = $4
		ORDER BY snapshot_date DESC
	`

	rows, err := r.db.QueryContext(ctx, query, userID, courseID, tenantID, milestoneType)
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error listing snapshots by milestone: %v", err)
		return nil, err
	}
	defer rows.Close()

	var snapshots []*domain.ProgressSnapshot
	for rows.Next() {
		snapshot := &domain.ProgressSnapshot{}
		err := rows.Scan(
			&snapshot.ID,
			&snapshot.TenantID,
			&snapshot.UserID,
			&snapshot.CourseID,
			&snapshot.EnrollmentID,
			&snapshot.ProgressPercentage,
			&snapshot.CompletedLessons,
			&snapshot.CompletedQuizzes,
			&snapshot.TotalTimeSpent,
			&snapshot.MilestoneType,
			&snapshot.MilestoneData,
			&snapshot.SnapshotDate,
			&snapshot.CreatedAt,
		)
		if err != nil {
			log.Printf("[PostgreSQLProgressRepository] Error scanning snapshot: %v", err)
			return nil, err
		}
		snapshots = append(snapshots, snapshot)
	}

	if err = rows.Err(); err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error iterating snapshot rows: %v", err)
		return nil, err
	}

	return snapshots, nil
}

// ListSnapshotsByDateRange lists snapshots within a date range
func (r *PostgreSQLProgressRepository) ListSnapshotsByDateRange(ctx context.Context, userID, courseID, tenantID uuid.UUID, startDate, endDate time.Time, page, pageSize int) ([]*domain.ProgressSnapshot, int, error) {
	// Get total count
	var totalCount int
	countQuery := `
		SELECT COUNT(*) FROM progress_snapshots
		WHERE user_id = $1 AND course_id = $2 AND tenant_id = $3
		AND snapshot_date >= $4 AND snapshot_date <= $5
	`
	err := r.db.QueryRowContext(ctx, countQuery, userID, courseID, tenantID, startDate, endDate).Scan(&totalCount)
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error counting snapshots by date range: %v", err)
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	query := `
		SELECT id, tenant_id, user_id, course_id, enrollment_id,
			   progress_percentage, completed_lessons, completed_quizzes,
			   total_time_spent, milestone_type, milestone_data,
			   snapshot_date, created_at
		FROM progress_snapshots
		WHERE user_id = $1 AND course_id = $2 AND tenant_id = $3
		AND snapshot_date >= $4 AND snapshot_date <= $5
		ORDER BY snapshot_date DESC
		LIMIT $6 OFFSET $7
	`

	rows, err := r.db.QueryContext(ctx, query, userID, courseID, tenantID, startDate, endDate, pageSize, offset)
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error listing snapshots by date range: %v", err)
		return nil, 0, err
	}
	defer rows.Close()

	var snapshots []*domain.ProgressSnapshot
	for rows.Next() {
		snapshot := &domain.ProgressSnapshot{}
		err := rows.Scan(
			&snapshot.ID,
			&snapshot.TenantID,
			&snapshot.UserID,
			&snapshot.CourseID,
			&snapshot.EnrollmentID,
			&snapshot.ProgressPercentage,
			&snapshot.CompletedLessons,
			&snapshot.CompletedQuizzes,
			&snapshot.TotalTimeSpent,
			&snapshot.MilestoneType,
			&snapshot.MilestoneData,
			&snapshot.SnapshotDate,
			&snapshot.CreatedAt,
		)
		if err != nil {
			log.Printf("[PostgreSQLProgressRepository] Error scanning snapshot: %v", err)
			return nil, 0, err
		}
		snapshots = append(snapshots, snapshot)
	}

	if err = rows.Err(); err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error iterating snapshot rows: %v", err)
		return nil, 0, err
	}

	return snapshots, totalCount, nil
}

// DeleteSnapshot deletes a progress snapshot
func (r *PostgreSQLProgressRepository) DeleteSnapshot(ctx context.Context, snapshotID, tenantID uuid.UUID) error {
	query := `DELETE FROM progress_snapshots WHERE id = $1 AND tenant_id = $2`

	result, err := r.db.ExecContext(ctx, query, snapshotID, tenantID)
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error deleting snapshot: %v", err)
		return ports.ErrSnapshotDeletionFailed
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error checking rows affected: %v", err)
		return err
	}

	if rowsAffected == 0 {
		return ports.ErrSnapshotNotFound
	}

	return nil
}

// ============================================================
// Statistics operations
// ============================================================

// GetCourseStatistics retrieves statistics for a course
func (r *PostgreSQLProgressRepository) GetCourseStatistics(ctx context.Context, courseID, tenantID uuid.UUID) (*domain.ProgressStatistics, error) {
	query := `
		SELECT
			COUNT(*) as total_students,
			COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active_students,
			COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_students,
			COALESCE(AVG(progress_percentage), 0) as average_progress,
			COALESCE(AVG(total_time_spent), 0) as average_time_spent,
			COALESCE(AVG(completed_lessons), 0) as average_lessons,
			COALESCE(AVG(completed_quizzes), 0) as average_quizzes
		FROM course_progress
		WHERE course_id = $1 AND tenant_id = $2
	`

	stats := &domain.ProgressStatistics{}
	var avgProgress float64

	err := r.db.QueryRowContext(ctx, query, courseID, tenantID).Scan(
		&stats.TotalStudents,
		&stats.ActiveStudents,
		&stats.CompletedStudents,
		&avgProgress,
		&stats.AverageTimeSpent,
		&stats.AverageLessonsPerUser,
		&stats.AverageQuizzesPerUser,
	)

	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error getting course statistics: %v", err)
		return nil, ports.ErrStatisticsFailed
	}

	stats.AverageProgress = avgProgress
	if stats.TotalStudents > 0 {
		stats.CompletionRate = (float64(stats.CompletedStudents) / float64(stats.TotalStudents)) * 100
	}

	return stats, nil
}

// GetUserProgressSummary retrieves progress summary for a user across all courses
func (r *PostgreSQLProgressRepository) GetUserProgressSummary(ctx context.Context, userID, tenantID uuid.UUID) (*domain.ProgressSummaryResponse, error) {
	query := `
		SELECT
			COUNT(*) as total_courses,
			COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_courses,
			COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_courses,
			COALESCE(AVG(progress_percentage), 0) as average_progress,
			COALESCE(SUM(total_time_spent), 0) as total_time_spent,
			COUNT(CASE WHEN certificate_id IS NOT NULL THEN 1 END) as total_certificates
		FROM course_progress
		WHERE user_id = $1 AND tenant_id = $2
	`

	summary := &domain.ProgressSummaryResponse{}

	err := r.db.QueryRowContext(ctx, query, userID, tenantID).Scan(
		&summary.TotalCourses,
		&summary.InProgressCourses,
		&summary.CompletedCourses,
		&summary.AverageProgress,
		&summary.TotalTimeSpent,
		&summary.TotalCertificates,
	)

	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error getting user progress summary: %v", err)
		return nil, ports.ErrStatisticsFailed
	}

	return summary, nil
}

// CountProgressByStatus counts progress entries by status for a course
func (r *PostgreSQLProgressRepository) CountProgressByStatus(ctx context.Context, courseID, tenantID uuid.UUID, status domain.ProgressStatus) (int, error) {
	query := `
		SELECT COUNT(*) FROM course_progress
		WHERE course_id = $1 AND tenant_id = $2 AND status = $3
	`

	var count int
	err := r.db.QueryRowContext(ctx, query, courseID, tenantID, status).Scan(&count)
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error counting progress by status: %v", err)
		return 0, err
	}

	return count, nil
}

// GetAverageProgressPercentage gets the average progress percentage for a course
func (r *PostgreSQLProgressRepository) GetAverageProgressPercentage(ctx context.Context, courseID, tenantID uuid.UUID) (float64, error) {
	query := `
		SELECT COALESCE(AVG(progress_percentage), 0)
		FROM course_progress
		WHERE course_id = $1 AND tenant_id = $2
	`

	var avgProgress float64
	err := r.db.QueryRowContext(ctx, query, courseID, tenantID).Scan(&avgProgress)
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error getting average progress percentage: %v", err)
		return 0, err
	}

	return avgProgress, nil
}

// GetAverageTimeSpent gets the average time spent for a course
func (r *PostgreSQLProgressRepository) GetAverageTimeSpent(ctx context.Context, courseID, tenantID uuid.UUID) (float64, error) {
	query := `
		SELECT COALESCE(AVG(total_time_spent), 0)
		FROM course_progress
		WHERE course_id = $1 AND tenant_id = $2
	`

	var avgTimeSpent float64
	err := r.db.QueryRowContext(ctx, query, courseID, tenantID).Scan(&avgTimeSpent)
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error getting average time spent: %v", err)
		return 0, err
	}

	return avgTimeSpent, nil
}

// ============================================================
// Validation operations
// ============================================================

// ProgressExists checks if progress exists for a user and course
func (r *PostgreSQLProgressRepository) ProgressExists(ctx context.Context, userID, courseID, tenantID uuid.UUID) (bool, error) {
	query := `
		SELECT EXISTS(
			SELECT 1 FROM course_progress
			WHERE user_id = $1 AND course_id = $2 AND tenant_id = $3
		)
	`

	var exists bool
	err := r.db.QueryRowContext(ctx, query, userID, courseID, tenantID).Scan(&exists)
	if err != nil {
		log.Printf("[PostgreSQLProgressRepository] Error checking progress exists: %v", err)
		return false, err
	}

	return exists, nil
}
