package adapters

import (
	"database/sql"
	"fmt"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/reviews/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/reviews/ports"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

// PostgreSQLReviewRepository implementa ReviewRepository para PostgreSQL
type PostgreSQLReviewRepository struct {
	db *sqlx.DB
}

// NewPostgreSQLReviewRepository crea una nueva instancia del repositorio
func NewPostgreSQLReviewRepository(db *sqlx.DB) ports.ReviewRepository {
	return &PostgreSQLReviewRepository{
		db: db,
	}
}

// ============================================================================
// CRUD Operations
// ============================================================================

// Create crea una nueva review
func (r *PostgreSQLReviewRepository) Create(review *domain.Review) error {
	query := `
		INSERT INTO reviews (
			id, tenant_id, course_id, user_id, rating, title, comment,
			is_public, is_edited, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
		)
	`

	_, err := r.db.Exec(
		query,
		review.ID,
		review.TenantID,
		review.CourseID,
		review.UserID,
		review.Rating,
		review.Title,
		review.Comment,
		review.IsPublic,
		review.IsEdited,
		review.CreatedAt,
		review.UpdatedAt,
	)

	return err
}

// GetByID obtiene una review por ID
func (r *PostgreSQLReviewRepository) GetByID(tenantID, reviewID uuid.UUID) (*domain.Review, error) {
	query := `
		SELECT * FROM reviews
		WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL
	`

	var review domain.Review
	err := r.db.Get(&review, query, tenantID, reviewID)
	if err == sql.ErrNoRows {
		return nil, domain.ErrReviewNotFound
	}

	return &review, err
}

// GetByUserAndCourse obtiene la review de un usuario para un curso
func (r *PostgreSQLReviewRepository) GetByUserAndCourse(tenantID, userID, courseID uuid.UUID) (*domain.Review, error) {
	query := `
		SELECT * FROM reviews
		WHERE tenant_id = $1 AND user_id = $2 AND course_id = $3 AND deleted_at IS NULL
	`

	var review domain.Review
	err := r.db.Get(&review, query, tenantID, userID, courseID)
	if err == sql.ErrNoRows {
		return nil, domain.ErrReviewNotFound
	}

	return &review, err
}

// Update actualiza una review existente
func (r *PostgreSQLReviewRepository) Update(review *domain.Review) error {
	query := `
		UPDATE reviews
		SET rating = $1, title = $2, comment = $3, is_public = $4,
		    is_edited = $5, updated_at = $6
		WHERE tenant_id = $7 AND id = $8 AND deleted_at IS NULL
	`

	result, err := r.db.Exec(
		query,
		review.Rating,
		review.Title,
		review.Comment,
		review.IsPublic,
		review.IsEdited,
		review.UpdatedAt,
		review.TenantID,
		review.ID,
	)

	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return domain.ErrReviewNotFound
	}

	return nil
}

// Delete elimina permanentemente una review
func (r *PostgreSQLReviewRepository) Delete(tenantID, reviewID uuid.UUID) error {
	query := `DELETE FROM reviews WHERE tenant_id = $1 AND id = $2`

	result, err := r.db.Exec(query, tenantID, reviewID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return domain.ErrReviewNotFound
	}

	return nil
}

// SoftDelete marca una review como eliminada
func (r *PostgreSQLReviewRepository) SoftDelete(tenantID, reviewID uuid.UUID) error {
	query := `
		UPDATE reviews
		SET deleted_at = NOW()
		WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL
	`

	result, err := r.db.Exec(query, tenantID, reviewID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return domain.ErrReviewNotFound
	}

	return nil
}

// ============================================================================
// Query Operations
// ============================================================================

// GetReviews obtiene reviews con filtros
func (r *PostgreSQLReviewRepository) GetReviews(tenantID uuid.UUID, filter domain.GetReviewsFilter) ([]domain.Review, int, error) {
	// Build WHERE clause
	where := "WHERE r.tenant_id = $1 AND r.deleted_at IS NULL"
	args := []interface{}{tenantID}
	argCount := 1

	if filter.CourseID != nil {
		argCount++
		where += fmt.Sprintf(" AND r.course_id = $%d", argCount)
		args = append(args, *filter.CourseID)
	}

	if filter.UserID != nil {
		argCount++
		where += fmt.Sprintf(" AND r.user_id = $%d", argCount)
		args = append(args, *filter.UserID)
	}

	if filter.Rating != nil {
		argCount++
		where += fmt.Sprintf(" AND r.rating = $%d", argCount)
		args = append(args, *filter.Rating)
	}

	if filter.IsPublic != nil {
		argCount++
		where += fmt.Sprintf(" AND r.is_public = $%d", argCount)
		args = append(args, *filter.IsPublic)
	}

	// Build ORDER BY clause
	orderBy := "ORDER BY r.created_at DESC"
	switch filter.SortBy {
	case "helpful":
		orderBy = "ORDER BY helpful_count DESC, r.created_at DESC"
	case "rating_high":
		orderBy = "ORDER BY r.rating DESC, r.created_at DESC"
	case "rating_low":
		orderBy = "ORDER BY r.rating ASC, r.created_at DESC"
	}

	// Count total
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*) FROM reviews r %s
	`, where)

	var total int
	err := r.db.Get(&total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (filter.Page - 1) * filter.PageSize
	argCount++
	limit := fmt.Sprintf("LIMIT $%d", argCount)
	args = append(args, filter.PageSize)

	argCount++
	offsetClause := fmt.Sprintf("OFFSET $%d", argCount)
	args = append(args, offset)

	query := fmt.Sprintf(`
		SELECT r.*,
		       COALESCE(SUM(CASE WHEN rh.is_helpful = true THEN 1 ELSE 0 END), 0) as helpful_count
		FROM reviews r
		LEFT JOIN review_helpful rh ON rh.review_id = r.id AND rh.tenant_id = r.tenant_id
		%s
		GROUP BY r.id
		%s
		%s %s
	`, where, orderBy, limit, offsetClause)

	var reviews []domain.Review
	err = r.db.Select(&reviews, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return reviews, total, nil
}

// GetCourseReviews obtiene las reviews de un curso
func (r *PostgreSQLReviewRepository) GetCourseReviews(tenantID, courseID uuid.UUID, page, pageSize int, sortBy string) ([]domain.Review, int, error) {
	filter := domain.GetReviewsFilter{
		CourseID: &courseID,
		Page:     page,
		PageSize: pageSize,
		SortBy:   sortBy,
	}
	isPublic := true
	filter.IsPublic = &isPublic

	return r.GetReviews(tenantID, filter)
}

// GetUserReviews obtiene las reviews de un usuario
func (r *PostgreSQLReviewRepository) GetUserReviews(tenantID, userID uuid.UUID, page, pageSize int) ([]domain.Review, int, error) {
	filter := domain.GetReviewsFilter{
		UserID:   &userID,
		Page:     page,
		PageSize: pageSize,
		SortBy:   "recent",
	}

	return r.GetReviews(tenantID, filter)
}

// CountByCourse cuenta las reviews de un curso
func (r *PostgreSQLReviewRepository) CountByCourse(tenantID, courseID uuid.UUID) (int, error) {
	query := `
		SELECT COUNT(*) FROM reviews
		WHERE tenant_id = $1 AND course_id = $2 AND deleted_at IS NULL
	`

	var count int
	err := r.db.Get(&count, query, tenantID, courseID)
	return count, err
}

// CountByUser cuenta las reviews de un usuario
func (r *PostgreSQLReviewRepository) CountByUser(tenantID, userID uuid.UUID) (int, error) {
	query := `
		SELECT COUNT(*) FROM reviews
		WHERE tenant_id = $1 AND user_id = $2 AND deleted_at IS NULL
	`

	var count int
	err := r.db.Get(&count, query, tenantID, userID)
	return count, err
}

// ============================================================================
// Rating Operations
// ============================================================================

// GetCourseRating obtiene el rating agregado de un curso
func (r *PostgreSQLReviewRepository) GetCourseRating(tenantID, courseID uuid.UUID) (*domain.CourseRating, error) {
	query := `
		SELECT * FROM course_ratings
		WHERE tenant_id = $1 AND course_id = $2
	`

	var rating domain.CourseRating
	err := r.db.Get(&rating, query, tenantID, courseID)
	if err == sql.ErrNoRows {
		// Si no existe, crear uno nuevo con valores por defecto
		return &domain.CourseRating{
			CourseID:      courseID,
			TenantID:      tenantID,
			AverageRating: 0,
			TotalReviews:  0,
			Rating5Stars:  0,
			Rating4Stars:  0,
			Rating3Stars:  0,
			Rating2Stars:  0,
			Rating1Star:   0,
		}, nil
	}

	return &rating, err
}

// UpdateCourseRating actualiza el rating de un curso
func (r *PostgreSQLReviewRepository) UpdateCourseRating(rating *domain.CourseRating) error {
	query := `
		INSERT INTO course_ratings (
			course_id, tenant_id, average_rating, total_reviews,
			rating_5_stars, rating_4_stars, rating_3_stars,
			rating_2_stars, rating_1_star, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (tenant_id, course_id)
		DO UPDATE SET
			average_rating = EXCLUDED.average_rating,
			total_reviews = EXCLUDED.total_reviews,
			rating_5_stars = EXCLUDED.rating_5_stars,
			rating_4_stars = EXCLUDED.rating_4_stars,
			rating_3_stars = EXCLUDED.rating_3_stars,
			rating_2_stars = EXCLUDED.rating_2_stars,
			rating_1_star = EXCLUDED.rating_1_star,
			updated_at = EXCLUDED.updated_at
	`

	_, err := r.db.Exec(
		query,
		rating.CourseID,
		rating.TenantID,
		rating.AverageRating,
		rating.TotalReviews,
		rating.Rating5Stars,
		rating.Rating4Stars,
		rating.Rating3Stars,
		rating.Rating2Stars,
		rating.Rating1Star,
		rating.UpdatedAt,
	)

	return err
}

// RecalculateCourseRating recalcula el rating de un curso
func (r *PostgreSQLReviewRepository) RecalculateCourseRating(tenantID, courseID uuid.UUID) error {
	query := `
		WITH stats AS (
			SELECT
				COUNT(*) as total,
				AVG(rating) as avg_rating,
				SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as stars_5,
				SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as stars_4,
				SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as stars_3,
				SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as stars_2,
				SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as stars_1
			FROM reviews
			WHERE tenant_id = $1 AND course_id = $2
			  AND is_public = true AND deleted_at IS NULL
		)
		INSERT INTO course_ratings (
			course_id, tenant_id, average_rating, total_reviews,
			rating_5_stars, rating_4_stars, rating_3_stars,
			rating_2_stars, rating_1_star, updated_at
		)
		SELECT $2, $1,
		       COALESCE(avg_rating, 0),
		       COALESCE(total, 0),
		       COALESCE(stars_5, 0),
		       COALESCE(stars_4, 0),
		       COALESCE(stars_3, 0),
		       COALESCE(stars_2, 0),
		       COALESCE(stars_1, 0),
		       NOW()
		FROM stats
		ON CONFLICT (tenant_id, course_id)
		DO UPDATE SET
			average_rating = EXCLUDED.average_rating,
			total_reviews = EXCLUDED.total_reviews,
			rating_5_stars = EXCLUDED.rating_5_stars,
			rating_4_stars = EXCLUDED.rating_4_stars,
			rating_3_stars = EXCLUDED.rating_3_stars,
			rating_2_stars = EXCLUDED.rating_2_stars,
			rating_1_star = EXCLUDED.rating_1_star,
			updated_at = EXCLUDED.updated_at
	`

	_, err := r.db.Exec(query, tenantID, courseID)
	return err
}

// ============================================================================
// Helpful Votes Operations
// ============================================================================

// CreateHelpfulVote crea un voto de utilidad
func (r *PostgreSQLReviewRepository) CreateHelpfulVote(vote *domain.ReviewHelpful) error {
	query := `
		INSERT INTO review_helpful (id, tenant_id, review_id, user_id, is_helpful, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`

	_, err := r.db.Exec(
		query,
		vote.ID,
		vote.TenantID,
		vote.ReviewID,
		vote.UserID,
		vote.IsHelpful,
		vote.CreatedAt,
	)

	return err
}

// GetUserVote obtiene el voto de un usuario para una review
func (r *PostgreSQLReviewRepository) GetUserVote(tenantID, reviewID, userID uuid.UUID) (*domain.ReviewHelpful, error) {
	query := `
		SELECT * FROM review_helpful
		WHERE tenant_id = $1 AND review_id = $2 AND user_id = $3
	`

	var vote domain.ReviewHelpful
	err := r.db.Get(&vote, query, tenantID, reviewID, userID)
	if err == sql.ErrNoRows {
		return nil, nil
	}

	return &vote, err
}

// UpdateHelpfulVote actualiza un voto de utilidad
func (r *PostgreSQLReviewRepository) UpdateHelpfulVote(vote *domain.ReviewHelpful) error {
	query := `
		UPDATE review_helpful
		SET is_helpful = $1
		WHERE tenant_id = $2 AND review_id = $3 AND user_id = $4
	`

	result, err := r.db.Exec(query, vote.IsHelpful, vote.TenantID, vote.ReviewID, vote.UserID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return domain.ErrReviewNotFound
	}

	return nil
}

// DeleteHelpfulVote elimina un voto de utilidad
func (r *PostgreSQLReviewRepository) DeleteHelpfulVote(tenantID, reviewID, userID uuid.UUID) error {
	query := `
		DELETE FROM review_helpful
		WHERE tenant_id = $1 AND review_id = $2 AND user_id = $3
	`

	_, err := r.db.Exec(query, tenantID, reviewID, userID)
	return err
}

// GetHelpfulCounts obtiene los conteos de votos de utilidad
func (r *PostgreSQLReviewRepository) GetHelpfulCounts(tenantID, reviewID uuid.UUID) (helpful int, unhelpful int, error error) {
	query := `
		SELECT
			SUM(CASE WHEN is_helpful = true THEN 1 ELSE 0 END) as helpful,
			SUM(CASE WHEN is_helpful = false THEN 1 ELSE 0 END) as unhelpful
		FROM review_helpful
		WHERE tenant_id = $1 AND review_id = $2
	`

	var counts struct {
		Helpful   sql.NullInt64 `db:"helpful"`
		Unhelpful sql.NullInt64 `db:"unhelpful"`
	}

	err := r.db.Get(&counts, query, tenantID, reviewID)
	if err != nil {
		return 0, 0, err
	}

	return int(counts.Helpful.Int64), int(counts.Unhelpful.Int64), nil
}

// ============================================================================
// Report Operations
// ============================================================================

// CreateReport crea un reporte de review
func (r *PostgreSQLReviewRepository) CreateReport(report *domain.ReviewReport) error {
	query := `
		INSERT INTO review_reports (id, tenant_id, review_id, reporter_id, reason, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`

	_, err := r.db.Exec(
		query,
		report.ID,
		report.TenantID,
		report.ReviewID,
		report.ReporterID,
		report.Reason,
		report.Status,
		report.CreatedAt,
		report.UpdatedAt,
	)

	return err
}

// GetReportByID obtiene un reporte por ID
func (r *PostgreSQLReviewRepository) GetReportByID(tenantID, reportID uuid.UUID) (*domain.ReviewReport, error) {
	query := `
		SELECT * FROM review_reports
		WHERE tenant_id = $1 AND id = $2
	`

	var report domain.ReviewReport
	err := r.db.Get(&report, query, tenantID, reportID)
	if err == sql.ErrNoRows {
		return nil, domain.ErrReportNotFound
	}

	return &report, err
}

// GetReportsByReview obtiene todos los reportes de una review
func (r *PostgreSQLReviewRepository) GetReportsByReview(tenantID, reviewID uuid.UUID) ([]domain.ReviewReport, error) {
	query := `
		SELECT * FROM review_reports
		WHERE tenant_id = $1 AND review_id = $2
		ORDER BY created_at DESC
	`

	var reports []domain.ReviewReport
	err := r.db.Select(&reports, query, tenantID, reviewID)
	if err != nil {
		return nil, err
	}

	return reports, nil
}

// GetPendingReports obtiene los reportes pendientes
func (r *PostgreSQLReviewRepository) GetPendingReports(tenantID uuid.UUID, page, pageSize int) ([]domain.ReviewReport, int, error) {
	// Count total
	countQuery := `
		SELECT COUNT(*) FROM review_reports
		WHERE tenant_id = $1 AND status = $2
	`

	var total int
	err := r.db.Get(&total, countQuery, tenantID, domain.ReportStatusPending)
	if err != nil {
		return nil, 0, err
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	query := `
		SELECT * FROM review_reports
		WHERE tenant_id = $1 AND status = $2
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4
	`

	var reports []domain.ReviewReport
	err = r.db.Select(&reports, query, tenantID, domain.ReportStatusPending, pageSize, offset)
	if err != nil {
		return nil, 0, err
	}

	return reports, total, nil
}

// UpdateReportStatus actualiza el estado de un reporte
func (r *PostgreSQLReviewRepository) UpdateReportStatus(tenantID, reportID uuid.UUID, status domain.ReportStatus) error {
	query := `
		UPDATE review_reports
		SET status = $1, updated_at = NOW()
		WHERE tenant_id = $2 AND id = $3
	`

	result, err := r.db.Exec(query, status, tenantID, reportID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return domain.ErrReportNotFound
	}

	return nil
}

// UserHasReported verifica si un usuario ya reportó una review
func (r *PostgreSQLReviewRepository) UserHasReported(tenantID, reviewID, userID uuid.UUID) (bool, error) {
	query := `
		SELECT EXISTS(
			SELECT 1 FROM review_reports
			WHERE tenant_id = $1 AND review_id = $2 AND reporter_id = $3
		)
	`

	var exists bool
	err := r.db.Get(&exists, query, tenantID, reviewID, userID)
	return exists, err
}
