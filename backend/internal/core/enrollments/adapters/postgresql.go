package adapters

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/enrollments/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/enrollments/ports"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/database"
	"github.com/google/uuid"
)

// PostgreSQLEnrollmentRepository implements the EnrollmentRepository interface
type PostgreSQLEnrollmentRepository struct {
	dbManager *database.Manager
}

// NewPostgreSQLEnrollmentRepository creates a new PostgreSQL enrollment repository
func NewPostgreSQLEnrollmentRepository(dbManager *database.Manager) ports.EnrollmentRepository {
	return &PostgreSQLEnrollmentRepository{
		dbManager: dbManager,
	}
}

// getTenantDB obtains the tenant database connection dynamically
func (r *PostgreSQLEnrollmentRepository) getTenantDB(tenantID uuid.UUID) (*sql.DB, error) {
	db, err := r.dbManager.GetTenantConnection(tenantID.String())
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant connection: %w", err)
	}
	return db.DB, nil
}

// ============================================================
// Enrollment CRUD operations
// ============================================================

// CreateEnrollment creates a new enrollment
func (r *PostgreSQLEnrollmentRepository) CreateEnrollment(ctx context.Context, enrollment *domain.Enrollment) error {
	db, err := r.getTenantDB(enrollment.TenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		INSERT INTO enrollments (
			id, tenant_id, user_id, course_id, status, progress_percentage,
			enrolled_at, started_at, completed_at, expires_at, last_accessed_at,
			certificate_id, cancellation_reason, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`

	_, err = db.ExecContext(ctx, query,
		enrollment.ID,
		enrollment.TenantID,
		enrollment.UserID,
		enrollment.CourseID,
		enrollment.Status,
		enrollment.ProgressPercentage,
		enrollment.EnrolledAt,
		enrollment.StartedAt,
		enrollment.CompletedAt,
		enrollment.ExpiresAt,
		enrollment.LastAccessedAt,
		enrollment.CertificateID,
		enrollment.CancellationReason,
		enrollment.CreatedAt,
		enrollment.UpdatedAt,
	)

	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error creating enrollment: %v", err)
		return ports.ErrEnrollmentCreationFailed
	}

	return nil
}

// GetEnrollment retrieves an enrollment by ID
func (r *PostgreSQLEnrollmentRepository) GetEnrollment(ctx context.Context, enrollmentID, tenantID uuid.UUID) (*domain.Enrollment, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT id, tenant_id, user_id, course_id, status, progress_percentage,
			   enrolled_at, started_at, completed_at, expires_at, last_accessed_at,
			   certificate_id, cancellation_reason, created_at, updated_at
		FROM enrollments
		WHERE id = $1 AND tenant_id = $2
	`

	enrollment := &domain.Enrollment{}
	err = db.QueryRowContext(ctx, query, enrollmentID, tenantID).Scan(
		&enrollment.ID,
		&enrollment.TenantID,
		&enrollment.UserID,
		&enrollment.CourseID,
		&enrollment.Status,
		&enrollment.ProgressPercentage,
		&enrollment.EnrolledAt,
		&enrollment.StartedAt,
		&enrollment.CompletedAt,
		&enrollment.ExpiresAt,
		&enrollment.LastAccessedAt,
		&enrollment.CertificateID,
		&enrollment.CancellationReason,
		&enrollment.CreatedAt,
		&enrollment.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ports.ErrEnrollmentNotFound
	}
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error getting enrollment: %v", err)
		return nil, err
	}

	return enrollment, nil
}

// GetEnrollmentByUserAndCourse retrieves an enrollment by user and course
func (r *PostgreSQLEnrollmentRepository) GetEnrollmentByUserAndCourse(ctx context.Context, userID, courseID, tenantID uuid.UUID) (*domain.Enrollment, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT id, tenant_id, user_id, course_id, status, progress_percentage,
			   enrolled_at, started_at, completed_at, expires_at, last_accessed_at,
			   certificate_id, cancellation_reason, created_at, updated_at
		FROM enrollments
		WHERE user_id = $1 AND course_id = $2 AND tenant_id = $3
		ORDER BY created_at DESC
		LIMIT 1
	`

	enrollment := &domain.Enrollment{}
	err = db.QueryRowContext(ctx, query, userID, courseID, tenantID).Scan(
		&enrollment.ID,
		&enrollment.TenantID,
		&enrollment.UserID,
		&enrollment.CourseID,
		&enrollment.Status,
		&enrollment.ProgressPercentage,
		&enrollment.EnrolledAt,
		&enrollment.StartedAt,
		&enrollment.CompletedAt,
		&enrollment.ExpiresAt,
		&enrollment.LastAccessedAt,
		&enrollment.CertificateID,
		&enrollment.CancellationReason,
		&enrollment.CreatedAt,
		&enrollment.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ports.ErrEnrollmentNotFound
	}
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error getting enrollment: %v", err)
		return nil, err
	}

	return enrollment, nil
}

// ListEnrollments retrieves enrollments with filters and pagination
func (r *PostgreSQLEnrollmentRepository) ListEnrollments(ctx context.Context, tenantID uuid.UUID, filters *domain.ListEnrollmentsRequest) ([]*domain.Enrollment, int, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	// Build query with filters
	query := `
		SELECT id, tenant_id, user_id, course_id, status, progress_percentage,
			   enrolled_at, started_at, completed_at, expires_at, last_accessed_at,
			   certificate_id, cancellation_reason, created_at, updated_at
		FROM enrollments
		WHERE tenant_id = $1
	`

	countQuery := `SELECT COUNT(*) FROM enrollments WHERE tenant_id = $1`

	args := []interface{}{tenantID}
	argPos := 2

	// Apply filters
	if filters.UserID != nil {
		query += fmt.Sprintf(" AND user_id = $%d", argPos)
		countQuery += fmt.Sprintf(" AND user_id = $%d", argPos)
		args = append(args, *filters.UserID)
		argPos++
	}

	if filters.CourseID != nil {
		query += fmt.Sprintf(" AND course_id = $%d", argPos)
		countQuery += fmt.Sprintf(" AND course_id = $%d", argPos)
		args = append(args, *filters.CourseID)
		argPos++
	}

	if filters.Status != nil {
		query += fmt.Sprintf(" AND status = $%d", argPos)
		countQuery += fmt.Sprintf(" AND status = $%d", argPos)
		args = append(args, *filters.Status)
		argPos++
	}

	// Get total count
	var totalCount int
	err = db.QueryRowContext(ctx, countQuery, args...).Scan(&totalCount)
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error counting enrollments: %v", err)
		return nil, 0, err
	}

	// Add sorting
	sortBy := "enrolled_at"
	if filters.SortBy != nil {
		sortBy = *filters.SortBy
	}

	sortOrder := "DESC"
	if filters.SortOrder != nil {
		sortOrder = *filters.SortOrder
	}

	query += fmt.Sprintf(" ORDER BY %s %s", sortBy, sortOrder)

	// Add pagination
	offset := (filters.Page - 1) * filters.PageSize
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argPos, argPos+1)
	args = append(args, filters.PageSize, offset)

	// Execute query
	rows, err := db.QueryContext(ctx, query, args...)
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error listing enrollments: %v", err)
		return nil, 0, err
	}
	defer rows.Close()

	var enrollments []*domain.Enrollment
	for rows.Next() {
		enrollment := &domain.Enrollment{}
		err := rows.Scan(
			&enrollment.ID,
			&enrollment.TenantID,
			&enrollment.UserID,
			&enrollment.CourseID,
			&enrollment.Status,
			&enrollment.ProgressPercentage,
			&enrollment.EnrolledAt,
			&enrollment.StartedAt,
			&enrollment.CompletedAt,
			&enrollment.ExpiresAt,
			&enrollment.LastAccessedAt,
			&enrollment.CertificateID,
			&enrollment.CancellationReason,
			&enrollment.CreatedAt,
			&enrollment.UpdatedAt,
		)
		if err != nil {
			log.Printf("[PostgreSQLEnrollmentRepository] Error scanning enrollment: %v", err)
			return nil, 0, err
		}
		enrollments = append(enrollments, enrollment)
	}

	return enrollments, totalCount, nil
}

// ListEnrollmentsByUser retrieves all enrollments for a user
func (r *PostgreSQLEnrollmentRepository) ListEnrollmentsByUser(ctx context.Context, userID, tenantID uuid.UUID, page, pageSize int) ([]*domain.Enrollment, int, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	// Get total count
	countQuery := `SELECT COUNT(*) FROM enrollments WHERE user_id = $1 AND tenant_id = $2`
	var totalCount int
	err = db.QueryRowContext(ctx, countQuery, userID, tenantID).Scan(&totalCount)
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error counting user enrollments: %v", err)
		return nil, 0, err
	}

	// Get enrollments
	query := `
		SELECT id, tenant_id, user_id, course_id, status, progress_percentage,
			   enrolled_at, started_at, completed_at, expires_at, last_accessed_at,
			   certificate_id, cancellation_reason, created_at, updated_at
		FROM enrollments
		WHERE user_id = $1 AND tenant_id = $2
		ORDER BY enrolled_at DESC
		LIMIT $3 OFFSET $4
	`

	offset := (page - 1) * pageSize
	rows, err := db.QueryContext(ctx, query, userID, tenantID, pageSize, offset)
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error listing user enrollments: %v", err)
		return nil, 0, err
	}
	defer rows.Close()

	var enrollments []*domain.Enrollment
	for rows.Next() {
		enrollment := &domain.Enrollment{}
		err := rows.Scan(
			&enrollment.ID,
			&enrollment.TenantID,
			&enrollment.UserID,
			&enrollment.CourseID,
			&enrollment.Status,
			&enrollment.ProgressPercentage,
			&enrollment.EnrolledAt,
			&enrollment.StartedAt,
			&enrollment.CompletedAt,
			&enrollment.ExpiresAt,
			&enrollment.LastAccessedAt,
			&enrollment.CertificateID,
			&enrollment.CancellationReason,
			&enrollment.CreatedAt,
			&enrollment.UpdatedAt,
		)
		if err != nil {
			log.Printf("[PostgreSQLEnrollmentRepository] Error scanning enrollment: %v", err)
			return nil, 0, err
		}
		enrollments = append(enrollments, enrollment)
	}

	return enrollments, totalCount, nil
}

// ListEnrollmentsByCourse retrieves all enrollments for a course
func (r *PostgreSQLEnrollmentRepository) ListEnrollmentsByCourse(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) ([]*domain.Enrollment, int, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	// Get total count
	countQuery := `SELECT COUNT(*) FROM enrollments WHERE course_id = $1 AND tenant_id = $2`
	var totalCount int
	err = db.QueryRowContext(ctx, countQuery, courseID, tenantID).Scan(&totalCount)
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error counting course enrollments: %v", err)
		return nil, 0, err
	}

	// Get enrollments
	query := `
		SELECT id, tenant_id, user_id, course_id, status, progress_percentage,
			   enrolled_at, started_at, completed_at, expires_at, last_accessed_at,
			   certificate_id, cancellation_reason, created_at, updated_at
		FROM enrollments
		WHERE course_id = $1 AND tenant_id = $2
		ORDER BY enrolled_at DESC
		LIMIT $3 OFFSET $4
	`

	offset := (page - 1) * pageSize
	rows, err := db.QueryContext(ctx, query, courseID, tenantID, pageSize, offset)
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error listing course enrollments: %v", err)
		return nil, 0, err
	}
	defer rows.Close()

	var enrollments []*domain.Enrollment
	for rows.Next() {
		enrollment := &domain.Enrollment{}
		err := rows.Scan(
			&enrollment.ID,
			&enrollment.TenantID,
			&enrollment.UserID,
			&enrollment.CourseID,
			&enrollment.Status,
			&enrollment.ProgressPercentage,
			&enrollment.EnrolledAt,
			&enrollment.StartedAt,
			&enrollment.CompletedAt,
			&enrollment.ExpiresAt,
			&enrollment.LastAccessedAt,
			&enrollment.CertificateID,
			&enrollment.CancellationReason,
			&enrollment.CreatedAt,
			&enrollment.UpdatedAt,
		)
		if err != nil {
			log.Printf("[PostgreSQLEnrollmentRepository] Error scanning enrollment: %v", err)
			return nil, 0, err
		}
		enrollments = append(enrollments, enrollment)
	}

	return enrollments, totalCount, nil
}

// UpdateEnrollment updates an enrollment
func (r *PostgreSQLEnrollmentRepository) UpdateEnrollment(ctx context.Context, enrollment *domain.Enrollment) error {
	db, err := r.getTenantDB(enrollment.TenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		UPDATE enrollments SET
			status = $1,
			progress_percentage = $2,
			started_at = $3,
			completed_at = $4,
			expires_at = $5,
			last_accessed_at = $6,
			certificate_id = $7,
			cancellation_reason = $8,
			updated_at = $9
		WHERE id = $10 AND tenant_id = $11
	`

	result, err := db.ExecContext(ctx, query,
		enrollment.Status,
		enrollment.ProgressPercentage,
		enrollment.StartedAt,
		enrollment.CompletedAt,
		enrollment.ExpiresAt,
		enrollment.LastAccessedAt,
		enrollment.CertificateID,
		enrollment.CancellationReason,
		time.Now().UTC(),
		enrollment.ID,
		enrollment.TenantID,
	)

	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error updating enrollment: %v", err)
		return ports.ErrEnrollmentUpdateFailed
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return ports.ErrEnrollmentUpdateFailed
	}

	if rowsAffected == 0 {
		return ports.ErrEnrollmentNotFound
	}

	return nil
}

// DeleteEnrollment deletes an enrollment
func (r *PostgreSQLEnrollmentRepository) DeleteEnrollment(ctx context.Context, enrollmentID, tenantID uuid.UUID) error {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `DELETE FROM enrollments WHERE id = $1 AND tenant_id = $2`

	result, err := db.ExecContext(ctx, query, enrollmentID, tenantID)
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error deleting enrollment: %v", err)
		return ports.ErrEnrollmentDeletionFailed
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return ports.ErrEnrollmentDeletionFailed
	}

	if rowsAffected == 0 {
		return ports.ErrEnrollmentNotFound
	}

	return nil
}

// UpdateEnrollmentStatus updates the status of an enrollment
func (r *PostgreSQLEnrollmentRepository) UpdateEnrollmentStatus(ctx context.Context, enrollmentID, tenantID uuid.UUID, status domain.EnrollmentStatus) error {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `UPDATE enrollments SET status = $1, updated_at = $2 WHERE id = $3 AND tenant_id = $4`

	result, err := db.ExecContext(ctx, query, status, time.Now().UTC(), enrollmentID, tenantID)
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error updating status: %v", err)
		return ports.ErrEnrollmentUpdateFailed
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return ports.ErrEnrollmentUpdateFailed
	}

	if rowsAffected == 0 {
		return ports.ErrEnrollmentNotFound
	}

	return nil
}

// UpdateProgress updates the progress percentage of an enrollment
func (r *PostgreSQLEnrollmentRepository) UpdateProgress(ctx context.Context, enrollmentID, tenantID uuid.UUID, progressPercentage int) error {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `UPDATE enrollments SET progress_percentage = $1, updated_at = $2 WHERE id = $3 AND tenant_id = $4`

	result, err := db.ExecContext(ctx, query, progressPercentage, time.Now().UTC(), enrollmentID, tenantID)
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error updating progress: %v", err)
		return ports.ErrEnrollmentUpdateFailed
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return ports.ErrEnrollmentUpdateFailed
	}

	if rowsAffected == 0 {
		return ports.ErrEnrollmentNotFound
	}

	return nil
}

// UpdateLastAccessed updates the last accessed timestamp
func (r *PostgreSQLEnrollmentRepository) UpdateLastAccessed(ctx context.Context, enrollmentID, tenantID uuid.UUID) error {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `UPDATE enrollments SET last_accessed_at = $1, updated_at = $2 WHERE id = $3 AND tenant_id = $4`

	now := time.Now().UTC()
	result, err := db.ExecContext(ctx, query, now, now, enrollmentID, tenantID)
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error updating last accessed: %v", err)
		return ports.ErrEnrollmentUpdateFailed
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return ports.ErrEnrollmentUpdateFailed
	}

	if rowsAffected == 0 {
		return ports.ErrEnrollmentNotFound
	}

	return nil
}

// MarkAsStarted marks an enrollment as started
func (r *PostgreSQLEnrollmentRepository) MarkAsStarted(ctx context.Context, enrollmentID, tenantID uuid.UUID) error {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `UPDATE enrollments SET started_at = $1, updated_at = $2 WHERE id = $3 AND tenant_id = $4 AND started_at IS NULL`

	now := time.Now().UTC()
	_, err = db.ExecContext(ctx, query, now, now, enrollmentID, tenantID)
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error marking as started: %v", err)
		return ports.ErrEnrollmentUpdateFailed
	}

	return nil
}

// MarkAsCompleted marks an enrollment as completed
func (r *PostgreSQLEnrollmentRepository) MarkAsCompleted(ctx context.Context, enrollmentID, tenantID uuid.UUID, certificateID *uuid.UUID) error {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		UPDATE enrollments SET
			status = $1,
			completed_at = $2,
			progress_percentage = 100,
			certificate_id = $3,
			updated_at = $4
		WHERE id = $5 AND tenant_id = $6
	`

	now := time.Now().UTC()
	result, err := db.ExecContext(ctx, query,
		domain.EnrollmentStatusCompleted,
		now,
		certificateID,
		now,
		enrollmentID,
		tenantID,
	)
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error marking as completed: %v", err)
		return ports.ErrEnrollmentUpdateFailed
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return ports.ErrEnrollmentUpdateFailed
	}

	if rowsAffected == 0 {
		return ports.ErrEnrollmentNotFound
	}

	return nil
}

// CancelEnrollment cancels an enrollment
func (r *PostgreSQLEnrollmentRepository) CancelEnrollment(ctx context.Context, enrollmentID, tenantID uuid.UUID, reason *string) error {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		UPDATE enrollments SET
			status = $1,
			cancellation_reason = $2,
			updated_at = $3
		WHERE id = $4 AND tenant_id = $5
	`

	result, err := db.ExecContext(ctx, query,
		domain.EnrollmentStatusCancelled,
		reason,
		time.Now().UTC(),
		enrollmentID,
		tenantID,
	)
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error cancelling enrollment: %v", err)
		return ports.ErrEnrollmentUpdateFailed
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return ports.ErrEnrollmentUpdateFailed
	}

	if rowsAffected == 0 {
		return ports.ErrEnrollmentNotFound
	}

	return nil
}

// ExtendEnrollment extends an enrollment's expiration date
func (r *PostgreSQLEnrollmentRepository) ExtendEnrollment(ctx context.Context, enrollmentID, tenantID uuid.UUID, newExpiresAt time.Time) error {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		UPDATE enrollments SET
			expires_at = $1,
			status = CASE
				WHEN status = 'expired' THEN 'active'::text
				ELSE status
			END,
			updated_at = $2
		WHERE id = $3 AND tenant_id = $4
	`

	result, err := db.ExecContext(ctx, query, newExpiresAt, time.Now().UTC(), enrollmentID, tenantID)
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error extending enrollment: %v", err)
		return ports.ErrEnrollmentUpdateFailed
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return ports.ErrEnrollmentUpdateFailed
	}

	if rowsAffected == 0 {
		return ports.ErrEnrollmentNotFound
	}

	return nil
}

// ============================================================
// Enrollment validation
// ============================================================

// IsUserEnrolled checks if a user is enrolled in a course
func (r *PostgreSQLEnrollmentRepository) IsUserEnrolled(ctx context.Context, userID, courseID, tenantID uuid.UUID) (bool, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return false, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `SELECT EXISTS(SELECT 1 FROM enrollments WHERE user_id = $1 AND course_id = $2 AND tenant_id = $3)`

	var exists bool
	err = db.QueryRowContext(ctx, query, userID, courseID, tenantID).Scan(&exists)
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error checking enrollment: %v", err)
		return false, err
	}

	return exists, nil
}

// CanUserAccessCourse checks if a user can access a course
func (r *PostgreSQLEnrollmentRepository) CanUserAccessCourse(ctx context.Context, userID, courseID, tenantID uuid.UUID) (bool, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return false, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT EXISTS(
			SELECT 1 FROM enrollments
			WHERE user_id = $1 AND course_id = $2 AND tenant_id = $3
			AND status IN ('active', 'completed')
			AND (expires_at IS NULL OR expires_at > NOW())
		)
	`

	var canAccess bool
	err = db.QueryRowContext(ctx, query, userID, courseID, tenantID).Scan(&canAccess)
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error checking access: %v", err)
		return false, err
	}

	return canAccess, nil
}

// GetActiveEnrollmentCount returns the count of active enrollments for a course
func (r *PostgreSQLEnrollmentRepository) GetActiveEnrollmentCount(ctx context.Context, courseID, tenantID uuid.UUID) (int, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return 0, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `SELECT COUNT(*) FROM enrollments WHERE course_id = $1 AND tenant_id = $2 AND status = 'active'`

	var count int
	err = db.QueryRowContext(ctx, query, courseID, tenantID).Scan(&count)
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error counting active enrollments: %v", err)
		return 0, err
	}

	return count, nil
}

// ============================================================
// Enrollment Request CRUD operations
// ============================================================

// CreateEnrollmentRequest creates a new enrollment request
func (r *PostgreSQLEnrollmentRepository) CreateEnrollmentRequest(ctx context.Context, request *domain.EnrollmentRequest) error {
	db, err := r.getTenantDB(request.TenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		INSERT INTO enrollment_requests (
			id, tenant_id, user_id, course_id, status, request_message,
			reviewed_by, rejection_reason, requested_at, reviewed_at,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`

	_, err = db.ExecContext(ctx, query,
		request.ID,
		request.TenantID,
		request.UserID,
		request.CourseID,
		request.Status,
		request.RequestMessage,
		request.ReviewedBy,
		request.RejectionReason,
		request.RequestedAt,
		request.ReviewedAt,
		request.CreatedAt,
		request.UpdatedAt,
	)

	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error creating enrollment request: %v", err)
		return ports.ErrEnrollmentRequestCreationFailed
	}

	return nil
}

// GetEnrollmentRequest retrieves an enrollment request by ID
func (r *PostgreSQLEnrollmentRepository) GetEnrollmentRequest(ctx context.Context, requestID, tenantID uuid.UUID) (*domain.EnrollmentRequest, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT id, tenant_id, user_id, course_id, status, request_message,
			   reviewed_by, rejection_reason, requested_at, reviewed_at,
			   created_at, updated_at
		FROM enrollment_requests
		WHERE id = $1 AND tenant_id = $2
	`

	request := &domain.EnrollmentRequest{}
	err = db.QueryRowContext(ctx, query, requestID, tenantID).Scan(
		&request.ID,
		&request.TenantID,
		&request.UserID,
		&request.CourseID,
		&request.Status,
		&request.RequestMessage,
		&request.ReviewedBy,
		&request.RejectionReason,
		&request.RequestedAt,
		&request.ReviewedAt,
		&request.CreatedAt,
		&request.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ports.ErrEnrollmentRequestNotFound
	}
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error getting enrollment request: %v", err)
		return nil, err
	}

	return request, nil
}

// GetEnrollmentRequestByUserAndCourse retrieves an enrollment request by user and course
func (r *PostgreSQLEnrollmentRepository) GetEnrollmentRequestByUserAndCourse(ctx context.Context, userID, courseID, tenantID uuid.UUID) (*domain.EnrollmentRequest, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT id, tenant_id, user_id, course_id, status, request_message,
			   reviewed_by, rejection_reason, requested_at, reviewed_at,
			   created_at, updated_at
		FROM enrollment_requests
		WHERE user_id = $1 AND course_id = $2 AND tenant_id = $3
		ORDER BY created_at DESC
		LIMIT 1
	`

	request := &domain.EnrollmentRequest{}
	err = db.QueryRowContext(ctx, query, userID, courseID, tenantID).Scan(
		&request.ID,
		&request.TenantID,
		&request.UserID,
		&request.CourseID,
		&request.Status,
		&request.RequestMessage,
		&request.ReviewedBy,
		&request.RejectionReason,
		&request.RequestedAt,
		&request.ReviewedAt,
		&request.CreatedAt,
		&request.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ports.ErrEnrollmentRequestNotFound
	}
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error getting enrollment request: %v", err)
		return nil, err
	}

	return request, nil
}

// ListEnrollmentRequests retrieves enrollment requests with filters and pagination
func (r *PostgreSQLEnrollmentRepository) ListEnrollmentRequests(ctx context.Context, tenantID uuid.UUID, filters *domain.ListEnrollmentRequestsRequest) ([]*domain.EnrollmentRequest, int, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	// Build query with filters
	query := `
		SELECT id, tenant_id, user_id, course_id, status, request_message,
			   reviewed_by, rejection_reason, requested_at, reviewed_at,
			   created_at, updated_at
		FROM enrollment_requests
		WHERE tenant_id = $1
	`

	countQuery := `SELECT COUNT(*) FROM enrollment_requests WHERE tenant_id = $1`

	args := []interface{}{tenantID}
	argPos := 2

	// Apply filters
	if filters.CourseID != nil {
		query += fmt.Sprintf(" AND course_id = $%d", argPos)
		countQuery += fmt.Sprintf(" AND course_id = $%d", argPos)
		args = append(args, *filters.CourseID)
		argPos++
	}

	if filters.Status != nil {
		query += fmt.Sprintf(" AND status = $%d", argPos)
		countQuery += fmt.Sprintf(" AND status = $%d", argPos)
		args = append(args, *filters.Status)
		argPos++
	}

	// Get total count
	var totalCount int
	err = db.QueryRowContext(ctx, countQuery, args...).Scan(&totalCount)
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error counting enrollment requests: %v", err)
		return nil, 0, err
	}

	// Add sorting
	sortBy := "requested_at"
	if filters.SortBy != nil {
		sortBy = *filters.SortBy
	}

	sortOrder := "DESC"
	if filters.SortOrder != nil {
		sortOrder = *filters.SortOrder
	}

	query += fmt.Sprintf(" ORDER BY %s %s", sortBy, sortOrder)

	// Add pagination
	offset := (filters.Page - 1) * filters.PageSize
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argPos, argPos+1)
	args = append(args, filters.PageSize, offset)

	// Execute query
	rows, err := db.QueryContext(ctx, query, args...)
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error listing enrollment requests: %v", err)
		return nil, 0, err
	}
	defer rows.Close()

	var requests []*domain.EnrollmentRequest
	for rows.Next() {
		request := &domain.EnrollmentRequest{}
		err := rows.Scan(
			&request.ID,
			&request.TenantID,
			&request.UserID,
			&request.CourseID,
			&request.Status,
			&request.RequestMessage,
			&request.ReviewedBy,
			&request.RejectionReason,
			&request.RequestedAt,
			&request.ReviewedAt,
			&request.CreatedAt,
			&request.UpdatedAt,
		)
		if err != nil {
			log.Printf("[PostgreSQLEnrollmentRepository] Error scanning enrollment request: %v", err)
			return nil, 0, err
		}
		requests = append(requests, request)
	}

	return requests, totalCount, nil
}

// ListPendingEnrollmentRequestsByCourse retrieves pending enrollment requests for a course
func (r *PostgreSQLEnrollmentRepository) ListPendingEnrollmentRequestsByCourse(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) ([]*domain.EnrollmentRequest, int, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	// Get total count
	countQuery := `SELECT COUNT(*) FROM enrollment_requests WHERE course_id = $1 AND tenant_id = $2 AND status = 'pending'`
	var totalCount int
	err = db.QueryRowContext(ctx, countQuery, courseID, tenantID).Scan(&totalCount)
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error counting pending requests: %v", err)
		return nil, 0, err
	}

	// Get requests
	query := `
		SELECT id, tenant_id, user_id, course_id, status, request_message,
			   reviewed_by, rejection_reason, requested_at, reviewed_at,
			   created_at, updated_at
		FROM enrollment_requests
		WHERE course_id = $1 AND tenant_id = $2 AND status = 'pending'
		ORDER BY requested_at ASC
		LIMIT $3 OFFSET $4
	`

	offset := (page - 1) * pageSize
	rows, err := db.QueryContext(ctx, query, courseID, tenantID, pageSize, offset)
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error listing pending requests: %v", err)
		return nil, 0, err
	}
	defer rows.Close()

	var requests []*domain.EnrollmentRequest
	for rows.Next() {
		request := &domain.EnrollmentRequest{}
		err := rows.Scan(
			&request.ID,
			&request.TenantID,
			&request.UserID,
			&request.CourseID,
			&request.Status,
			&request.RequestMessage,
			&request.ReviewedBy,
			&request.RejectionReason,
			&request.RequestedAt,
			&request.ReviewedAt,
			&request.CreatedAt,
			&request.UpdatedAt,
		)
		if err != nil {
			log.Printf("[PostgreSQLEnrollmentRepository] Error scanning enrollment request: %v", err)
			return nil, 0, err
		}
		requests = append(requests, request)
	}

	return requests, totalCount, nil
}

// UpdateEnrollmentRequest updates an enrollment request
func (r *PostgreSQLEnrollmentRepository) UpdateEnrollmentRequest(ctx context.Context, request *domain.EnrollmentRequest) error {
	db, err := r.getTenantDB(request.TenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		UPDATE enrollment_requests SET
			status = $1,
			reviewed_by = $2,
			rejection_reason = $3,
			reviewed_at = $4,
			updated_at = $5
		WHERE id = $6 AND tenant_id = $7
	`

	result, err := db.ExecContext(ctx, query,
		request.Status,
		request.ReviewedBy,
		request.RejectionReason,
		request.ReviewedAt,
		time.Now().UTC(),
		request.ID,
		request.TenantID,
	)

	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error updating enrollment request: %v", err)
		return ports.ErrEnrollmentRequestUpdateFailed
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return ports.ErrEnrollmentRequestUpdateFailed
	}

	if rowsAffected == 0 {
		return ports.ErrEnrollmentRequestNotFound
	}

	return nil
}

// DeleteEnrollmentRequest deletes an enrollment request
func (r *PostgreSQLEnrollmentRepository) DeleteEnrollmentRequest(ctx context.Context, requestID, tenantID uuid.UUID) error {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `DELETE FROM enrollment_requests WHERE id = $1 AND tenant_id = $2`

	result, err := db.ExecContext(ctx, query, requestID, tenantID)
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error deleting enrollment request: %v", err)
		return ports.ErrEnrollmentRequestUpdateFailed
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return ports.ErrEnrollmentRequestUpdateFailed
	}

	if rowsAffected == 0 {
		return ports.ErrEnrollmentRequestNotFound
	}

	return nil
}

// ============================================================
// Statistics
// ============================================================

// GetEnrollmentStats returns enrollment statistics for a course
func (r *PostgreSQLEnrollmentRepository) GetEnrollmentStats(ctx context.Context, courseID, tenantID uuid.UUID) (*domain.EnrollmentStatsResponse, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT
			COUNT(*) as total_enrollments,
			COUNT(*) FILTER (WHERE status = 'active') as active_enrollments,
			COUNT(*) FILTER (WHERE status = 'completed') as completed_enrollments,
			COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_enrollments,
			COALESCE(AVG(progress_percentage), 0) as average_progress
		FROM enrollments
		WHERE course_id = $1 AND tenant_id = $2
	`

	stats := &domain.EnrollmentStatsResponse{
		CourseID: courseID,
	}

	err = db.QueryRowContext(ctx, query, courseID, tenantID).Scan(
		&stats.TotalEnrollments,
		&stats.ActiveEnrollments,
		&stats.CompletedEnrollments,
		&stats.CancelledEnrollments,
		&stats.AverageProgress,
	)

	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error getting enrollment stats: %v", err)
		return nil, ports.ErrStatisticsFailed
	}

	// Calculate completion rate
	if stats.TotalEnrollments > 0 {
		stats.CompletionRate = (float64(stats.CompletedEnrollments) / float64(stats.TotalEnrollments)) * 100
	}

	return stats, nil
}

// CountEnrollmentsByStatus counts enrollments by status
func (r *PostgreSQLEnrollmentRepository) CountEnrollmentsByStatus(ctx context.Context, courseID, tenantID uuid.UUID, status domain.EnrollmentStatus) (int, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return 0, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `SELECT COUNT(*) FROM enrollments WHERE course_id = $1 AND tenant_id = $2 AND status = $3`

	var count int
	err = db.QueryRowContext(ctx, query, courseID, tenantID, status).Scan(&count)
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error counting enrollments by status: %v", err)
		return 0, err
	}

	return count, nil
}

// ============================================================
// Bulk operations
// ============================================================

// MarkExpiredEnrollments marks expired enrollments as expired
func (r *PostgreSQLEnrollmentRepository) MarkExpiredEnrollments(ctx context.Context, tenantID uuid.UUID) (int, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return 0, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		UPDATE enrollments SET
			status = 'expired',
			updated_at = $1
		WHERE tenant_id = $2
		AND status = 'active'
		AND expires_at IS NOT NULL
		AND expires_at < NOW()
	`

	result, err := db.ExecContext(ctx, query, time.Now().UTC(), tenantID)
	if err != nil {
		log.Printf("[PostgreSQLEnrollmentRepository] Error marking expired enrollments: %v", err)
		return 0, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, err
	}

	return int(rowsAffected), nil
}
