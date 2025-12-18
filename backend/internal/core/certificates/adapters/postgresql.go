package adapters

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/certificates/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/certificates/ports"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/database"
	"github.com/google/uuid"
)

// PostgreSQLCertificateRepository implements the CertificateRepository interface
type PostgreSQLCertificateRepository struct {
	dbManager *database.Manager
}

// NewPostgreSQLCertificateRepository creates a new PostgreSQL certificate repository
func NewPostgreSQLCertificateRepository(dbManager *database.Manager) ports.CertificateRepository {
	return &PostgreSQLCertificateRepository{
		dbManager: dbManager,
	}
}

// getTenantDB obtains the tenant database connection dynamically
func (r *PostgreSQLCertificateRepository) getTenantDB(tenantID uuid.UUID) (*sql.DB, error) {
	db, err := r.dbManager.GetTenantConnection(tenantID.String())
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant connection: %w", err)
	}
	return db.DB, nil
}

// ============================================================
// Certificate CRUD operations
// ============================================================

// CreateCertificate creates a new certificate
func (r *PostgreSQLCertificateRepository) CreateCertificate(ctx context.Context, certificate *domain.Certificate) error {
	db, err := r.getTenantDB(certificate.TenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant DB: %w", err)
	}

	// Marshal metadata to JSON
	metadataJSON, err := json.Marshal(certificate.Metadata)
	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error marshaling metadata: %v", err)
		return ports.ErrInvalidCertificateData
	}

	query := `
		INSERT INTO certificates (
			id, tenant_id, user_id, course_id, enrollment_id, progress_id,
			certificate_number, verification_code, status, issued_at, expires_at,
			revoked_at, revoked_by, revocation_reason, template_id,
			completion_date, grade, total_time_spent, metadata,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
	`

	_, err = db.ExecContext(ctx, query,
		certificate.ID,
		certificate.TenantID,
		certificate.UserID,
		certificate.CourseID,
		certificate.EnrollmentID,
		certificate.ProgressID,
		certificate.CertificateNumber,
		certificate.VerificationCode,
		certificate.Status,
		certificate.IssuedAt,
		certificate.ExpiresAt,
		certificate.RevokedAt,
		certificate.RevokedBy,
		certificate.RevocationReason,
		certificate.TemplateID,
		certificate.CompletionDate,
		certificate.Grade,
		certificate.TotalTimeSpent,
		metadataJSON,
		certificate.CreatedAt,
		certificate.UpdatedAt,
	)

	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error creating certificate: %v", err)
		return ports.ErrCertificateCreationFailed
	}

	return nil
}

// GetCertificate retrieves a certificate by ID
func (r *PostgreSQLCertificateRepository) GetCertificate(ctx context.Context, certificateID, tenantID uuid.UUID) (*domain.Certificate, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT id, tenant_id, user_id, course_id, enrollment_id, progress_id,
			   certificate_number, verification_code, status, issued_at, expires_at,
			   revoked_at, revoked_by, revocation_reason, template_id,
			   completion_date, grade, total_time_spent, metadata,
			   created_at, updated_at
		FROM certificates
		WHERE id = $1 AND tenant_id = $2
	`

	certificate := &domain.Certificate{}
	var metadataJSON []byte

	err = db.QueryRowContext(ctx, query, certificateID, tenantID).Scan(
		&certificate.ID,
		&certificate.TenantID,
		&certificate.UserID,
		&certificate.CourseID,
		&certificate.EnrollmentID,
		&certificate.ProgressID,
		&certificate.CertificateNumber,
		&certificate.VerificationCode,
		&certificate.Status,
		&certificate.IssuedAt,
		&certificate.ExpiresAt,
		&certificate.RevokedAt,
		&certificate.RevokedBy,
		&certificate.RevocationReason,
		&certificate.TemplateID,
		&certificate.CompletionDate,
		&certificate.Grade,
		&certificate.TotalTimeSpent,
		&metadataJSON,
		&certificate.CreatedAt,
		&certificate.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ports.ErrCertificateNotFound
	}
	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error getting certificate: %v", err)
		return nil, err
	}

	// Unmarshal metadata
	if err := json.Unmarshal(metadataJSON, &certificate.Metadata); err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error unmarshaling metadata: %v", err)
		certificate.Metadata = make(map[string]string)
	}

	return certificate, nil
}

// GetCertificateByNumber retrieves a certificate by certificate number
func (r *PostgreSQLCertificateRepository) GetCertificateByNumber(ctx context.Context, certificateNumber string, tenantID uuid.UUID) (*domain.Certificate, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT id, tenant_id, user_id, course_id, enrollment_id, progress_id,
			   certificate_number, verification_code, status, issued_at, expires_at,
			   revoked_at, revoked_by, revocation_reason, template_id,
			   completion_date, grade, total_time_spent, metadata,
			   created_at, updated_at
		FROM certificates
		WHERE certificate_number = $1 AND tenant_id = $2
	`

	certificate := &domain.Certificate{}
	var metadataJSON []byte

	err = db.QueryRowContext(ctx, query, certificateNumber, tenantID).Scan(
		&certificate.ID,
		&certificate.TenantID,
		&certificate.UserID,
		&certificate.CourseID,
		&certificate.EnrollmentID,
		&certificate.ProgressID,
		&certificate.CertificateNumber,
		&certificate.VerificationCode,
		&certificate.Status,
		&certificate.IssuedAt,
		&certificate.ExpiresAt,
		&certificate.RevokedAt,
		&certificate.RevokedBy,
		&certificate.RevocationReason,
		&certificate.TemplateID,
		&certificate.CompletionDate,
		&certificate.Grade,
		&certificate.TotalTimeSpent,
		&metadataJSON,
		&certificate.CreatedAt,
		&certificate.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ports.ErrCertificateNotFound
	}
	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error getting certificate by number: %v", err)
		return nil, err
	}

	// Unmarshal metadata
	if err := json.Unmarshal(metadataJSON, &certificate.Metadata); err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error unmarshaling metadata: %v", err)
		certificate.Metadata = make(map[string]string)
	}

	return certificate, nil
}

// GetCertificateByUserAndCourse retrieves a certificate by user and course
func (r *PostgreSQLCertificateRepository) GetCertificateByUserAndCourse(ctx context.Context, userID, courseID, tenantID uuid.UUID) (*domain.Certificate, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT id, tenant_id, user_id, course_id, enrollment_id, progress_id,
			   certificate_number, verification_code, status, issued_at, expires_at,
			   revoked_at, revoked_by, revocation_reason, template_id,
			   completion_date, grade, total_time_spent, metadata,
			   created_at, updated_at
		FROM certificates
		WHERE user_id = $1 AND course_id = $2 AND tenant_id = $3
		ORDER BY created_at DESC
		LIMIT 1
	`

	certificate := &domain.Certificate{}
	var metadataJSON []byte

	err = db.QueryRowContext(ctx, query, userID, courseID, tenantID).Scan(
		&certificate.ID,
		&certificate.TenantID,
		&certificate.UserID,
		&certificate.CourseID,
		&certificate.EnrollmentID,
		&certificate.ProgressID,
		&certificate.CertificateNumber,
		&certificate.VerificationCode,
		&certificate.Status,
		&certificate.IssuedAt,
		&certificate.ExpiresAt,
		&certificate.RevokedAt,
		&certificate.RevokedBy,
		&certificate.RevocationReason,
		&certificate.TemplateID,
		&certificate.CompletionDate,
		&certificate.Grade,
		&certificate.TotalTimeSpent,
		&metadataJSON,
		&certificate.CreatedAt,
		&certificate.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ports.ErrCertificateNotFound
	}
	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error getting certificate by user and course: %v", err)
		return nil, err
	}

	// Unmarshal metadata
	if err := json.Unmarshal(metadataJSON, &certificate.Metadata); err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error unmarshaling metadata: %v", err)
		certificate.Metadata = make(map[string]string)
	}

	return certificate, nil
}

// ListCertificates retrieves a paginated list of certificates with filters
func (r *PostgreSQLCertificateRepository) ListCertificates(ctx context.Context, tenantID uuid.UUID, req *domain.ListCertificatesRequest) ([]*domain.Certificate, int, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	// This is a complex query builder - simplified version
	query := `
		SELECT id, tenant_id, user_id, course_id, enrollment_id, progress_id,
			   certificate_number, verification_code, status, issued_at, expires_at,
			   revoked_at, revoked_by, revocation_reason, template_id,
			   completion_date, grade, total_time_spent, metadata,
			   created_at, updated_at
		FROM certificates
		WHERE tenant_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	offset := (req.Page - 1) * req.PageSize
	rows, err := db.QueryContext(ctx, query, tenantID, req.PageSize, offset)
	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error listing certificates: %v", err)
		return nil, 0, err
	}
	defer rows.Close()

	var certificates []*domain.Certificate
	for rows.Next() {
		certificate := &domain.Certificate{}
		var metadataJSON []byte

		err := rows.Scan(
			&certificate.ID,
			&certificate.TenantID,
			&certificate.UserID,
			&certificate.CourseID,
			&certificate.EnrollmentID,
			&certificate.ProgressID,
			&certificate.CertificateNumber,
			&certificate.VerificationCode,
			&certificate.Status,
			&certificate.IssuedAt,
			&certificate.ExpiresAt,
			&certificate.RevokedAt,
			&certificate.RevokedBy,
			&certificate.RevocationReason,
			&certificate.TemplateID,
			&certificate.CompletionDate,
			&certificate.Grade,
			&certificate.TotalTimeSpent,
			&metadataJSON,
			&certificate.CreatedAt,
			&certificate.UpdatedAt,
		)
		if err != nil {
			log.Printf("[PostgreSQLCertificateRepository] Error scanning certificate: %v", err)
			continue
		}

		// Unmarshal metadata
		if err := json.Unmarshal(metadataJSON, &certificate.Metadata); err != nil {
			certificate.Metadata = make(map[string]string)
		}

		certificates = append(certificates, certificate)
	}

	// Get total count
	countQuery := `SELECT COUNT(*) FROM certificates WHERE tenant_id = $1`
	var totalCount int
	err = db.QueryRowContext(ctx, countQuery, tenantID).Scan(&totalCount)
	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error counting certificates: %v", err)
		return certificates, 0, err
	}

	return certificates, totalCount, nil
}

// ListCertificatesByUser retrieves certificates for a user
func (r *PostgreSQLCertificateRepository) ListCertificatesByUser(ctx context.Context, userID, tenantID uuid.UUID, page, pageSize int) ([]*domain.Certificate, int, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT id, tenant_id, user_id, course_id, enrollment_id, progress_id,
			   certificate_number, verification_code, status, issued_at, expires_at,
			   revoked_at, revoked_by, revocation_reason, template_id,
			   completion_date, grade, total_time_spent, metadata,
			   created_at, updated_at
		FROM certificates
		WHERE user_id = $1 AND tenant_id = $2
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4
	`

	offset := (page - 1) * pageSize
	rows, err := db.QueryContext(ctx, query, userID, tenantID, pageSize, offset)
	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error listing certificates by user: %v", err)
		return nil, 0, err
	}
	defer rows.Close()

	var certificates []*domain.Certificate
	for rows.Next() {
		certificate := &domain.Certificate{}
		var metadataJSON []byte

		err := rows.Scan(
			&certificate.ID,
			&certificate.TenantID,
			&certificate.UserID,
			&certificate.CourseID,
			&certificate.EnrollmentID,
			&certificate.ProgressID,
			&certificate.CertificateNumber,
			&certificate.VerificationCode,
			&certificate.Status,
			&certificate.IssuedAt,
			&certificate.ExpiresAt,
			&certificate.RevokedAt,
			&certificate.RevokedBy,
			&certificate.RevocationReason,
			&certificate.TemplateID,
			&certificate.CompletionDate,
			&certificate.Grade,
			&certificate.TotalTimeSpent,
			&metadataJSON,
			&certificate.CreatedAt,
			&certificate.UpdatedAt,
		)
		if err != nil {
			log.Printf("[PostgreSQLCertificateRepository] Error scanning certificate: %v", err)
			continue
		}

		// Unmarshal metadata
		if err := json.Unmarshal(metadataJSON, &certificate.Metadata); err != nil {
			certificate.Metadata = make(map[string]string)
		}

		certificates = append(certificates, certificate)
	}

	// Get total count
	countQuery := `SELECT COUNT(*) FROM certificates WHERE user_id = $1 AND tenant_id = $2`
	var totalCount int
	err = db.QueryRowContext(ctx, countQuery, userID, tenantID).Scan(&totalCount)
	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error counting certificates by user: %v", err)
		return certificates, 0, err
	}

	return certificates, totalCount, nil
}

// ListCertificatesByCourse retrieves certificates for a course
func (r *PostgreSQLCertificateRepository) ListCertificatesByCourse(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) ([]*domain.Certificate, int, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT id, tenant_id, user_id, course_id, enrollment_id, progress_id,
			   certificate_number, verification_code, status, issued_at, expires_at,
			   revoked_at, revoked_by, revocation_reason, template_id,
			   completion_date, grade, total_time_spent, metadata,
			   created_at, updated_at
		FROM certificates
		WHERE course_id = $1 AND tenant_id = $2
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4
	`

	offset := (page - 1) * pageSize
	rows, err := db.QueryContext(ctx, query, courseID, tenantID, pageSize, offset)
	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error listing certificates by course: %v", err)
		return nil, 0, err
	}
	defer rows.Close()

	var certificates []*domain.Certificate
	for rows.Next() {
		certificate := &domain.Certificate{}
		var metadataJSON []byte

		err := rows.Scan(
			&certificate.ID,
			&certificate.TenantID,
			&certificate.UserID,
			&certificate.CourseID,
			&certificate.EnrollmentID,
			&certificate.ProgressID,
			&certificate.CertificateNumber,
			&certificate.VerificationCode,
			&certificate.Status,
			&certificate.IssuedAt,
			&certificate.ExpiresAt,
			&certificate.RevokedAt,
			&certificate.RevokedBy,
			&certificate.RevocationReason,
			&certificate.TemplateID,
			&certificate.CompletionDate,
			&certificate.Grade,
			&certificate.TotalTimeSpent,
			&metadataJSON,
			&certificate.CreatedAt,
			&certificate.UpdatedAt,
		)
		if err != nil {
			log.Printf("[PostgreSQLCertificateRepository] Error scanning certificate: %v", err)
			continue
		}

		// Unmarshal metadata
		if err := json.Unmarshal(metadataJSON, &certificate.Metadata); err != nil {
			certificate.Metadata = make(map[string]string)
		}

		certificates = append(certificates, certificate)
	}

	// Get total count
	countQuery := `SELECT COUNT(*) FROM certificates WHERE course_id = $1 AND tenant_id = $2`
	var totalCount int
	err = db.QueryRowContext(ctx, countQuery, courseID, tenantID).Scan(&totalCount)
	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error counting certificates by course: %v", err)
		return certificates, 0, err
	}

	return certificates, totalCount, nil
}

// UpdateCertificate updates a certificate
func (r *PostgreSQLCertificateRepository) UpdateCertificate(ctx context.Context, certificate *domain.Certificate) error {
	db, err := r.getTenantDB(certificate.TenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant DB: %w", err)
	}

	// Marshal metadata to JSON
	metadataJSON, err := json.Marshal(certificate.Metadata)
	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error marshaling metadata: %v", err)
		return ports.ErrInvalidCertificateData
	}

	query := `
		UPDATE certificates SET
			status = $1, expires_at = $2, revoked_at = $3, revoked_by = $4,
			revocation_reason = $5, template_id = $6, grade = $7,
			total_time_spent = $8, metadata = $9, updated_at = $10
		WHERE id = $11 AND tenant_id = $12
	`

	_, err = db.ExecContext(ctx, query,
		certificate.Status,
		certificate.ExpiresAt,
		certificate.RevokedAt,
		certificate.RevokedBy,
		certificate.RevocationReason,
		certificate.TemplateID,
		certificate.Grade,
		certificate.TotalTimeSpent,
		metadataJSON,
		certificate.UpdatedAt,
		certificate.ID,
		certificate.TenantID,
	)

	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error updating certificate: %v", err)
		return ports.ErrCertificateUpdateFailed
	}

	return nil
}

// DeleteCertificate deletes a certificate
func (r *PostgreSQLCertificateRepository) DeleteCertificate(ctx context.Context, certificateID, tenantID uuid.UUID) error {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `DELETE FROM certificates WHERE id = $1 AND tenant_id = $2`

	result, err := db.ExecContext(ctx, query, certificateID, tenantID)
	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error deleting certificate: %v", err)
		return ports.ErrCertificateDeletionFailed
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return ports.ErrCertificateDeletionFailed
	}
	if rowsAffected == 0 {
		return ports.ErrCertificateNotFound
	}

	return nil
}

// ============================================================
// Certificate operations
// ============================================================

// RevokeCertificate revokes a certificate
func (r *PostgreSQLCertificateRepository) RevokeCertificate(ctx context.Context, certificateID, tenantID, revokedBy uuid.UUID, reason string) error {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		UPDATE certificates SET
			status = $1, revoked_at = $2, revoked_by = $3,
			revocation_reason = $4, updated_at = $5
		WHERE id = $6 AND tenant_id = $7
	`

	now := time.Now().UTC()
	_, err = db.ExecContext(ctx, query,
		domain.CertificateStatusRevoked,
		now,
		revokedBy,
		reason,
		now,
		certificateID,
		tenantID,
	)

	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error revoking certificate: %v", err)
		return ports.ErrCannotRevokeCertificate
	}

	return nil
}

// SetCertificateExpiration sets an expiration date for a certificate
func (r *PostgreSQLCertificateRepository) SetCertificateExpiration(ctx context.Context, certificateID, tenantID uuid.UUID, expiresAt time.Time) error {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		UPDATE certificates SET
			expires_at = $1, updated_at = $2
		WHERE id = $3 AND tenant_id = $4
	`

	now := time.Now().UTC()
	_, err = db.ExecContext(ctx, query, expiresAt, now, certificateID, tenantID)

	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error setting expiration: %v", err)
		return ports.ErrCertificateUpdateFailed
	}

	return nil
}

// ============================================================
// Verification operations
// ============================================================

// VerifyCertificate verifies a certificate using certificate number and verification code
func (r *PostgreSQLCertificateRepository) VerifyCertificate(ctx context.Context, certificateNumber, verificationCode string, tenantID uuid.UUID) (*domain.Certificate, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT id, tenant_id, user_id, course_id, enrollment_id, progress_id,
			   certificate_number, verification_code, status, issued_at, expires_at,
			   revoked_at, revoked_by, revocation_reason, template_id,
			   completion_date, grade, total_time_spent, metadata,
			   created_at, updated_at
		FROM certificates
		WHERE certificate_number = $1 AND verification_code = $2 AND tenant_id = $3
	`

	certificate := &domain.Certificate{}
	var metadataJSON []byte

	err = db.QueryRowContext(ctx, query, certificateNumber, verificationCode, tenantID).Scan(
		&certificate.ID,
		&certificate.TenantID,
		&certificate.UserID,
		&certificate.CourseID,
		&certificate.EnrollmentID,
		&certificate.ProgressID,
		&certificate.CertificateNumber,
		&certificate.VerificationCode,
		&certificate.Status,
		&certificate.IssuedAt,
		&certificate.ExpiresAt,
		&certificate.RevokedAt,
		&certificate.RevokedBy,
		&certificate.RevocationReason,
		&certificate.TemplateID,
		&certificate.CompletionDate,
		&certificate.Grade,
		&certificate.TotalTimeSpent,
		&metadataJSON,
		&certificate.CreatedAt,
		&certificate.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ports.ErrVerificationFailed
	}
	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error verifying certificate: %v", err)
		return nil, ports.ErrVerificationFailed
	}

	// Unmarshal metadata
	if err := json.Unmarshal(metadataJSON, &certificate.Metadata); err != nil {
		certificate.Metadata = make(map[string]string)
	}

	return certificate, nil
}

// CertificateExists checks if a certificate exists for a user and course
func (r *PostgreSQLCertificateRepository) CertificateExists(ctx context.Context, userID, courseID, tenantID uuid.UUID) (bool, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return false, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `SELECT EXISTS(SELECT 1 FROM certificates WHERE user_id = $1 AND course_id = $2 AND tenant_id = $3)`

	var exists bool
	err = db.QueryRowContext(ctx, query, userID, courseID, tenantID).Scan(&exists)
	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error checking certificate existence: %v", err)
		return false, err
	}

	return exists, nil
}

// ============================================================
// Statistics operations
// ============================================================

// GetCertificateStatistics retrieves certificate statistics
func (r *PostgreSQLCertificateRepository) GetCertificateStatistics(ctx context.Context, tenantID uuid.UUID) (*domain.CertificateStatisticsResponse, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT
			COUNT(*) as total,
			COUNT(CASE WHEN status = 'issued' THEN 1 END) as issued,
			COUNT(CASE WHEN status = 'revoked' THEN 1 END) as revoked,
			COUNT(CASE WHEN status = 'expired' OR (expires_at IS NOT NULL AND expires_at < NOW()) THEN 1 END) as expired,
			COALESCE(AVG(grade), 0) as avg_grade,
			COALESCE(AVG(total_time_spent), 0) as avg_time
		FROM certificates
		WHERE tenant_id = $1
	`

	stats := &domain.CertificateStatisticsResponse{}
	err = db.QueryRowContext(ctx, query, tenantID).Scan(
		&stats.TotalCertificates,
		&stats.IssuedCertificates,
		&stats.RevokedCertificates,
		&stats.ExpiredCertificates,
		&stats.AverageGrade,
		&stats.AverageTimeSpent,
	)

	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error getting statistics: %v", err)
		return nil, ports.ErrStatisticsFailed
	}

	return stats, nil
}

// GetCourseStatistics retrieves certificate statistics for a course
func (r *PostgreSQLCertificateRepository) GetCourseStatistics(ctx context.Context, courseID, tenantID uuid.UUID) (*domain.CertificateStatisticsResponse, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT
			COUNT(*) as total,
			COUNT(CASE WHEN status = 'issued' THEN 1 END) as issued,
			COUNT(CASE WHEN status = 'revoked' THEN 1 END) as revoked,
			COUNT(CASE WHEN status = 'expired' OR (expires_at IS NOT NULL AND expires_at < NOW()) THEN 1 END) as expired,
			COALESCE(AVG(grade), 0) as avg_grade,
			COALESCE(AVG(total_time_spent), 0) as avg_time
		FROM certificates
		WHERE course_id = $1 AND tenant_id = $2
	`

	stats := &domain.CertificateStatisticsResponse{}
	err = db.QueryRowContext(ctx, query, courseID, tenantID).Scan(
		&stats.TotalCertificates,
		&stats.IssuedCertificates,
		&stats.RevokedCertificates,
		&stats.ExpiredCertificates,
		&stats.AverageGrade,
		&stats.AverageTimeSpent,
	)

	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error getting course statistics: %v", err)
		return nil, ports.ErrStatisticsFailed
	}

	return stats, nil
}

// CountCertificatesByStatus counts certificates by status
func (r *PostgreSQLCertificateRepository) CountCertificatesByStatus(ctx context.Context, tenantID uuid.UUID, status domain.CertificateStatus) (int, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return 0, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `SELECT COUNT(*) FROM certificates WHERE tenant_id = $1 AND status = $2`

	var count int
	err = db.QueryRowContext(ctx, query, tenantID, status).Scan(&count)
	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error counting certificates by status: %v", err)
		return 0, err
	}

	return count, nil
}

// ============================================================
// Template CRUD operations
// ============================================================

// CreateTemplate creates a new certificate template
func (r *PostgreSQLCertificateRepository) CreateTemplate(ctx context.Context, template *domain.CertificateTemplate) error {
	db, err := r.getTenantDB(template.TenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		INSERT INTO certificate_templates (
			id, tenant_id, name, description, template_path, is_default,
			is_active, configuration, created_by, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`

	_, err = db.ExecContext(ctx, query,
		template.ID,
		template.TenantID,
		template.Name,
		template.Description,
		template.TemplatePath,
		template.IsDefault,
		template.IsActive,
		template.Configuration,
		template.CreatedBy,
		template.CreatedAt,
		template.UpdatedAt,
	)

	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error creating template: %v", err)
		return ports.ErrTemplateCreationFailed
	}

	return nil
}

// GetTemplate retrieves a template by ID
func (r *PostgreSQLCertificateRepository) GetTemplate(ctx context.Context, templateID, tenantID uuid.UUID) (*domain.CertificateTemplate, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT id, tenant_id, name, description, template_path, is_default,
			   is_active, configuration, created_by, created_at, updated_at
		FROM certificate_templates
		WHERE id = $1 AND tenant_id = $2
	`

	template := &domain.CertificateTemplate{}
	err = db.QueryRowContext(ctx, query, templateID, tenantID).Scan(
		&template.ID,
		&template.TenantID,
		&template.Name,
		&template.Description,
		&template.TemplatePath,
		&template.IsDefault,
		&template.IsActive,
		&template.Configuration,
		&template.CreatedBy,
		&template.CreatedAt,
		&template.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ports.ErrTemplateNotFound
	}
	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error getting template: %v", err)
		return nil, err
	}

	return template, nil
}

// GetDefaultTemplate retrieves the default template for a tenant
func (r *PostgreSQLCertificateRepository) GetDefaultTemplate(ctx context.Context, tenantID uuid.UUID) (*domain.CertificateTemplate, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT id, tenant_id, name, description, template_path, is_default,
			   is_active, configuration, created_by, created_at, updated_at
		FROM certificate_templates
		WHERE tenant_id = $1 AND is_default = true AND is_active = true
		LIMIT 1
	`

	template := &domain.CertificateTemplate{}
	err = db.QueryRowContext(ctx, query, tenantID).Scan(
		&template.ID,
		&template.TenantID,
		&template.Name,
		&template.Description,
		&template.TemplatePath,
		&template.IsDefault,
		&template.IsActive,
		&template.Configuration,
		&template.CreatedBy,
		&template.CreatedAt,
		&template.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, ports.ErrNoDefaultTemplate
	}
	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error getting default template: %v", err)
		return nil, err
	}

	return template, nil
}

// ListTemplates retrieves a paginated list of templates
func (r *PostgreSQLCertificateRepository) ListTemplates(ctx context.Context, tenantID uuid.UUID, page, pageSize int) ([]*domain.CertificateTemplate, int, error) {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		SELECT id, tenant_id, name, description, template_path, is_default,
			   is_active, configuration, created_by, created_at, updated_at
		FROM certificate_templates
		WHERE tenant_id = $1
		ORDER BY is_default DESC, name ASC
		LIMIT $2 OFFSET $3
	`

	offset := (page - 1) * pageSize
	rows, err := db.QueryContext(ctx, query, tenantID, pageSize, offset)
	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error listing templates: %v", err)
		return nil, 0, err
	}
	defer rows.Close()

	var templates []*domain.CertificateTemplate
	for rows.Next() {
		template := &domain.CertificateTemplate{}
		err := rows.Scan(
			&template.ID,
			&template.TenantID,
			&template.Name,
			&template.Description,
			&template.TemplatePath,
			&template.IsDefault,
			&template.IsActive,
			&template.Configuration,
			&template.CreatedBy,
			&template.CreatedAt,
			&template.UpdatedAt,
		)
		if err != nil {
			log.Printf("[PostgreSQLCertificateRepository] Error scanning template: %v", err)
			continue
		}
		templates = append(templates, template)
	}

	// Get total count
	countQuery := `SELECT COUNT(*) FROM certificate_templates WHERE tenant_id = $1`
	var totalCount int
	err = db.QueryRowContext(ctx, countQuery, tenantID).Scan(&totalCount)
	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error counting templates: %v", err)
		return templates, 0, err
	}

	return templates, totalCount, nil
}

// UpdateTemplate updates a certificate template
func (r *PostgreSQLCertificateRepository) UpdateTemplate(ctx context.Context, template *domain.CertificateTemplate) error {
	db, err := r.getTenantDB(template.TenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `
		UPDATE certificate_templates SET
			name = $1, description = $2, template_path = $3,
			is_default = $4, is_active = $5, configuration = $6,
			updated_at = $7
		WHERE id = $8 AND tenant_id = $9
	`

	_, err = db.ExecContext(ctx, query,
		template.Name,
		template.Description,
		template.TemplatePath,
		template.IsDefault,
		template.IsActive,
		template.Configuration,
		template.UpdatedAt,
		template.ID,
		template.TenantID,
	)

	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error updating template: %v", err)
		return ports.ErrTemplateUpdateFailed
	}

	return nil
}

// DeleteTemplate deletes a certificate template
func (r *PostgreSQLCertificateRepository) DeleteTemplate(ctx context.Context, templateID, tenantID uuid.UUID) error {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant DB: %w", err)
	}

	query := `DELETE FROM certificate_templates WHERE id = $1 AND tenant_id = $2`

	result, err := db.ExecContext(ctx, query, templateID, tenantID)
	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error deleting template: %v", err)
		return ports.ErrTemplateDeletionFailed
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return ports.ErrTemplateDeletionFailed
	}
	if rowsAffected == 0 {
		return ports.ErrTemplateNotFound
	}

	return nil
}

// SetDefaultTemplate sets a template as the default (unsets others)
func (r *PostgreSQLCertificateRepository) SetDefaultTemplate(ctx context.Context, templateID, tenantID uuid.UUID) error {
	db, err := r.getTenantDB(tenantID)
	if err != nil {
		return fmt.Errorf("failed to get tenant DB: %w", err)
	}

	// Start transaction
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return ports.ErrTemplateUpdateFailed
	}
	defer tx.Rollback()

	// Unset all default templates for the tenant
	_, err = tx.ExecContext(ctx,
		`UPDATE certificate_templates SET is_default = false, updated_at = $1 WHERE tenant_id = $2`,
		time.Now().UTC(), tenantID,
	)
	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error unsetting default templates: %v", err)
		return ports.ErrTemplateUpdateFailed
	}

	// Set the new default template
	_, err = tx.ExecContext(ctx,
		`UPDATE certificate_templates SET is_default = true, updated_at = $1 WHERE id = $2 AND tenant_id = $3`,
		time.Now().UTC(), templateID, tenantID,
	)
	if err != nil {
		log.Printf("[PostgreSQLCertificateRepository] Error setting default template: %v", err)
		return ports.ErrTemplateUpdateFailed
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return ports.ErrTemplateUpdateFailed
	}

	return nil
}
