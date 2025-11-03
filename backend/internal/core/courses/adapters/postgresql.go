package adapters

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/courses/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/courses/ports"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

// PostgreSQLCourseRepository implements the CourseRepository interface using PostgreSQL
type PostgreSQLCourseRepository struct {
	db *sqlx.DB
}

// NewPostgreSQLCourseRepository creates a new PostgreSQL course repository
func NewPostgreSQLCourseRepository(db *sqlx.DB) ports.CourseRepository {
	return &PostgreSQLCourseRepository{
		db: db,
	}
}

// courseRow represents a course row from the database
type courseRow struct {
	ID                uuid.UUID  `db:"id"`
	TenantID          uuid.UUID  `db:"tenant_id"`
	Title             string     `db:"title"`
	Slug              string     `db:"slug"`
	Description       string     `db:"description"`
	InstructorID      uuid.UUID  `db:"instructor_id"`
	CategoryID        *uuid.UUID `db:"category_id"`
	Status            string     `db:"status"`
	Level             string     `db:"level"`
	Duration          int        `db:"duration"`
	Price             float64    `db:"price"`
	Thumbnail         *string    `db:"thumbnail"`
	PreviewVideo      *string    `db:"preview_video"`
	Requirements      []byte     `db:"requirements"`
	WhatYouWillLearn  []byte     `db:"what_you_will_learn"`
	TargetAudience    []byte     `db:"target_audience"`
	EnrollmentCount   int        `db:"enrollment_count"`
	Rating            float64    `db:"rating"`
	RatingCount       int        `db:"rating_count"`
	IsPublished       bool       `db:"is_published"`
	PublishedAt       *time.Time `db:"published_at"`
	CreatedAt         time.Time  `db:"created_at"`
	UpdatedAt         time.Time  `db:"updated_at"`
	DeletedAt         *time.Time `db:"deleted_at"`
}

// courseToDomain converts a courseRow to a domain.Course
func courseToDomain(row *courseRow) (*domain.Course, error) {
	var requirements []string
	if len(row.Requirements) > 0 {
		if err := json.Unmarshal(row.Requirements, &requirements); err != nil {
			return nil, fmt.Errorf("failed to unmarshal requirements: %w", err)
		}
	}

	var whatYouWillLearn []string
	if len(row.WhatYouWillLearn) > 0 {
		if err := json.Unmarshal(row.WhatYouWillLearn, &whatYouWillLearn); err != nil {
			return nil, fmt.Errorf("failed to unmarshal what_you_will_learn: %w", err)
		}
	}

	var targetAudience []string
	if len(row.TargetAudience) > 0 {
		if err := json.Unmarshal(row.TargetAudience, &targetAudience); err != nil {
			return nil, fmt.Errorf("failed to unmarshal target_audience: %w", err)
		}
	}

	return &domain.Course{
		ID:               row.ID,
		TenantID:         row.TenantID,
		Title:            row.Title,
		Slug:             row.Slug,
		Description:      row.Description,
		InstructorID:     row.InstructorID,
		CategoryID:       row.CategoryID,
		Status:           domain.CourseStatus(row.Status),
		Level:            domain.CourseLevel(row.Level),
		Duration:         row.Duration,
		Price:            row.Price,
		Thumbnail:        row.Thumbnail,
		PreviewVideo:     row.PreviewVideo,
		Requirements:     requirements,
		WhatYouWillLearn: whatYouWillLearn,
		TargetAudience:   targetAudience,
		EnrollmentCount:  row.EnrollmentCount,
		Rating:           row.Rating,
		RatingCount:      row.RatingCount,
		IsPublished:      row.IsPublished,
		PublishedAt:      row.PublishedAt,
		CreatedAt:        row.CreatedAt,
		UpdatedAt:        row.UpdatedAt,
		DeletedAt:        row.DeletedAt,
	}, nil
}

// GetCourse retrieves a course by ID
func (r *PostgreSQLCourseRepository) GetCourse(ctx context.Context, courseID, tenantID uuid.UUID) (*domain.Course, error) {
	query := `
		SELECT
			id, tenant_id, title, slug, description, instructor_id, category_id,
			status, level, duration, price, thumbnail, preview_video,
			requirements, what_you_will_learn, target_audience,
			enrollment_count, rating, rating_count,
			is_published, published_at, created_at, updated_at, deleted_at
		FROM courses
		WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
	`

	var row courseRow
	err := r.db.GetContext(ctx, &row, query, courseID, tenantID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ports.ErrCourseNotFound
		}
		return nil, fmt.Errorf("failed to get course: %w", err)
	}

	return courseToDomain(&row)
}

// GetCourseBySlug retrieves a course by its slug
func (r *PostgreSQLCourseRepository) GetCourseBySlug(ctx context.Context, slug string, tenantID uuid.UUID) (*domain.Course, error) {
	query := `
		SELECT
			id, tenant_id, title, slug, description, instructor_id, category_id,
			status, level, duration, price, thumbnail, preview_video,
			requirements, what_you_will_learn, target_audience,
			enrollment_count, rating, rating_count,
			is_published, published_at, created_at, updated_at, deleted_at
		FROM courses
		WHERE slug = $1 AND tenant_id = $2 AND deleted_at IS NULL
	`

	var row courseRow
	err := r.db.GetContext(ctx, &row, query, slug, tenantID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ports.ErrCourseNotFound
		}
		return nil, fmt.Errorf("failed to get course by slug: %w", err)
	}

	return courseToDomain(&row)
}

// ListCourses retrieves a paginated list of courses with filters
func (r *PostgreSQLCourseRepository) ListCourses(ctx context.Context, tenantID uuid.UUID, req *domain.ListCoursesRequest) ([]*domain.Course, int, error) {
	// Build WHERE clause
	whereClauses := []string{"tenant_id = $1", "deleted_at IS NULL"}
	args := []interface{}{tenantID}
	argPos := 2

	if req.Search != nil && *req.Search != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("(title ILIKE $%d OR description ILIKE $%d)", argPos, argPos))
		searchPattern := "%" + *req.Search + "%"
		args = append(args, searchPattern)
		argPos++
	}

	if req.InstructorID != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("instructor_id = $%d", argPos))
		args = append(args, *req.InstructorID)
		argPos++
	}

	if req.CategoryID != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("category_id = $%d", argPos))
		args = append(args, *req.CategoryID)
		argPos++
	}

	if req.Level != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("level = $%d", argPos))
		args = append(args, string(*req.Level))
		argPos++
	}

	if req.Status != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("status = $%d", argPos))
		args = append(args, string(*req.Status))
		argPos++
	}

	if req.IsFree != nil && *req.IsFree {
		whereClauses = append(whereClauses, "price = 0")
	}

	if req.MinPrice != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("price >= $%d", argPos))
		args = append(args, *req.MinPrice)
		argPos++
	}

	if req.MaxPrice != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("price <= $%d", argPos))
		args = append(args, *req.MaxPrice)
		argPos++
	}

	whereClause := "WHERE " + whereClauses[0]
	for _, clause := range whereClauses[1:] {
		whereClause += " AND " + clause
	}

	// Count total
	countQuery := "SELECT COUNT(*) FROM courses " + whereClause
	var totalCount int
	err := r.db.GetContext(ctx, &totalCount, countQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count courses: %w", err)
	}

	// Build ORDER BY clause
	orderBy := "created_at DESC"
	if req.SortBy != nil {
		column := *req.SortBy
		order := "ASC"
		if req.SortOrder != nil && *req.SortOrder == "desc" {
			order = "DESC"
		}
		orderBy = fmt.Sprintf("%s %s", column, order)
	}

	// Build query
	query := fmt.Sprintf(`
		SELECT
			id, tenant_id, title, slug, description, instructor_id, category_id,
			status, level, duration, price, thumbnail, preview_video,
			requirements, what_you_will_learn, target_audience,
			enrollment_count, rating, rating_count,
			is_published, published_at, created_at, updated_at, deleted_at
		FROM courses
		%s
		ORDER BY %s
		LIMIT $%d OFFSET $%d
	`, whereClause, orderBy, argPos, argPos+1)

	offset := (req.Page - 1) * req.PageSize
	args = append(args, req.PageSize, offset)

	var rows []courseRow
	err = r.db.SelectContext(ctx, &rows, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list courses: %w", err)
	}

	courses := make([]*domain.Course, len(rows))
	for i, row := range rows {
		course, err := courseToDomain(&row)
		if err != nil {
			return nil, 0, err
		}
		courses[i] = course
	}

	return courses, totalCount, nil
}

// CreateCourse creates a new course
func (r *PostgreSQLCourseRepository) CreateCourse(ctx context.Context, course *domain.Course) error {
	requirementsJSON, err := json.Marshal(course.Requirements)
	if err != nil {
		return fmt.Errorf("failed to marshal requirements: %w", err)
	}

	whatYouWillLearnJSON, err := json.Marshal(course.WhatYouWillLearn)
	if err != nil {
		return fmt.Errorf("failed to marshal what_you_will_learn: %w", err)
	}

	targetAudienceJSON, err := json.Marshal(course.TargetAudience)
	if err != nil {
		return fmt.Errorf("failed to marshal target_audience: %w", err)
	}

	query := `
		INSERT INTO courses (
			id, tenant_id, title, slug, description, instructor_id, category_id,
			status, level, duration, price, thumbnail, preview_video,
			requirements, what_you_will_learn, target_audience,
			enrollment_count, rating, rating_count,
			is_published, published_at, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
			$14, $15, $16, $17, $18, $19, $20, $21, $22, $23
		)
	`

	_, err = r.db.ExecContext(ctx, query,
		course.ID, course.TenantID, course.Title, course.Slug, course.Description,
		course.InstructorID, course.CategoryID, string(course.Status), string(course.Level),
		course.Duration, course.Price, course.Thumbnail, course.PreviewVideo,
		requirementsJSON, whatYouWillLearnJSON, targetAudienceJSON,
		course.EnrollmentCount, course.Rating, course.RatingCount,
		course.IsPublished, course.PublishedAt, course.CreatedAt, course.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create course: %w", err)
	}

	return nil
}

// UpdateCourse updates an existing course
func (r *PostgreSQLCourseRepository) UpdateCourse(ctx context.Context, course *domain.Course) error {
	requirementsJSON, err := json.Marshal(course.Requirements)
	if err != nil {
		return fmt.Errorf("failed to marshal requirements: %w", err)
	}

	whatYouWillLearnJSON, err := json.Marshal(course.WhatYouWillLearn)
	if err != nil {
		return fmt.Errorf("failed to marshal what_you_will_learn: %w", err)
	}

	targetAudienceJSON, err := json.Marshal(course.TargetAudience)
	if err != nil {
		return fmt.Errorf("failed to marshal target_audience: %w", err)
	}

	query := `
		UPDATE courses SET
			title = $1, slug = $2, description = $3, category_id = $4,
			level = $5, duration = $6, price = $7, thumbnail = $8, preview_video = $9,
			requirements = $10, what_you_will_learn = $11, target_audience = $12,
			enrollment_count = $13, rating = $14, rating_count = $15,
			status = $16, is_published = $17, published_at = $18, updated_at = $19
		WHERE id = $20 AND tenant_id = $21 AND deleted_at IS NULL
	`

	result, err := r.db.ExecContext(ctx, query,
		course.Title, course.Slug, course.Description, course.CategoryID,
		string(course.Level), course.Duration, course.Price, course.Thumbnail, course.PreviewVideo,
		requirementsJSON, whatYouWillLearnJSON, targetAudienceJSON,
		course.EnrollmentCount, course.Rating, course.RatingCount,
		string(course.Status), course.IsPublished, course.PublishedAt, course.UpdatedAt,
		course.ID, course.TenantID,
	)
	if err != nil {
		return fmt.Errorf("failed to update course: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ports.ErrCourseNotFound
	}

	return nil
}

// DeleteCourse soft deletes a course
func (r *PostgreSQLCourseRepository) DeleteCourse(ctx context.Context, courseID, tenantID uuid.UUID) error {
	query := `
		UPDATE courses SET
			deleted_at = $1,
			status = $2,
			is_published = false,
			updated_at = $1
		WHERE id = $3 AND tenant_id = $4 AND deleted_at IS NULL
	`

	now := time.Now()
	result, err := r.db.ExecContext(ctx, query, now, string(domain.CourseStatusDeleted), courseID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete course: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ports.ErrCourseNotFound
	}

	return nil
}

// PublishCourse publishes a course
func (r *PostgreSQLCourseRepository) PublishCourse(ctx context.Context, courseID, tenantID uuid.UUID) error {
	query := `
		UPDATE courses SET
			status = $1,
			is_published = true,
			published_at = $2,
			updated_at = $2
		WHERE id = $3 AND tenant_id = $4 AND deleted_at IS NULL
	`

	now := time.Now()
	result, err := r.db.ExecContext(ctx, query, string(domain.CourseStatusPublished), now, courseID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to publish course: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ports.ErrCourseNotFound
	}

	return nil
}

// UnpublishCourse unpublishes a course
func (r *PostgreSQLCourseRepository) UnpublishCourse(ctx context.Context, courseID, tenantID uuid.UUID) error {
	query := `
		UPDATE courses SET
			status = $1,
			is_published = false,
			updated_at = $2
		WHERE id = $3 AND tenant_id = $4 AND deleted_at IS NULL
	`

	now := time.Now()
	result, err := r.db.ExecContext(ctx, query, string(domain.CourseStatusDraft), now, courseID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to unpublish course: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ports.ErrCourseNotFound
	}

	return nil
}

// ArchiveCourse archives a course
func (r *PostgreSQLCourseRepository) ArchiveCourse(ctx context.Context, courseID, tenantID uuid.UUID) error {
	query := `
		UPDATE courses SET
			status = $1,
			is_published = false,
			updated_at = $2
		WHERE id = $3 AND tenant_id = $4 AND deleted_at IS NULL
	`

	now := time.Now()
	result, err := r.db.ExecContext(ctx, query, string(domain.CourseStatusArchived), now, courseID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to archive course: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ports.ErrCourseNotFound
	}

	return nil
}

// CourseExists checks if a course exists
func (r *PostgreSQLCourseRepository) CourseExists(ctx context.Context, courseID, tenantID uuid.UUID) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM courses WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL)`

	var exists bool
	err := r.db.GetContext(ctx, &exists, query, courseID, tenantID)
	if err != nil {
		return false, fmt.Errorf("failed to check course existence: %w", err)
	}

	return exists, nil
}

// SlugExists checks if a slug is already in use
func (r *PostgreSQLCourseRepository) SlugExists(ctx context.Context, slug string, tenantID uuid.UUID, excludeCourseID *uuid.UUID) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM courses WHERE slug = $1 AND tenant_id = $2 AND deleted_at IS NULL`
	args := []interface{}{slug, tenantID}

	if excludeCourseID != nil {
		query += ` AND id != $3`
		args = append(args, *excludeCourseID)
	}
	query += `)`

	var exists bool
	err := r.db.GetContext(ctx, &exists, query, args...)
	if err != nil {
		return false, fmt.Errorf("failed to check slug existence: %w", err)
	}

	return exists, nil
}

// GetCoursesByInstructor retrieves all courses by an instructor
func (r *PostgreSQLCourseRepository) GetCoursesByInstructor(ctx context.Context, instructorID, tenantID uuid.UUID, page, pageSize int) ([]*domain.Course, int, error) {
	// Count total
	countQuery := `
		SELECT COUNT(*)
		FROM courses
		WHERE instructor_id = $1 AND tenant_id = $2 AND deleted_at IS NULL
	`

	var totalCount int
	err := r.db.GetContext(ctx, &totalCount, countQuery, instructorID, tenantID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count courses: %w", err)
	}

	// Get courses
	query := `
		SELECT
			id, tenant_id, title, slug, description, instructor_id, category_id,
			status, level, duration, price, thumbnail, preview_video,
			requirements, what_you_will_learn, target_audience,
			enrollment_count, rating, rating_count,
			is_published, published_at, created_at, updated_at, deleted_at
		FROM courses
		WHERE instructor_id = $1 AND tenant_id = $2 AND deleted_at IS NULL
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4
	`

	offset := (page - 1) * pageSize
	var rows []courseRow
	err = r.db.SelectContext(ctx, &rows, query, instructorID, tenantID, pageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get courses by instructor: %w", err)
	}

	courses := make([]*domain.Course, len(rows))
	for i, row := range rows {
		course, err := courseToDomain(&row)
		if err != nil {
			return nil, 0, err
		}
		courses[i] = course
	}

	return courses, totalCount, nil
}

// GetCoursesByCategory retrieves all courses in a category
func (r *PostgreSQLCourseRepository) GetCoursesByCategory(ctx context.Context, categoryID, tenantID uuid.UUID, page, pageSize int) ([]*domain.Course, int, error) {
	// Count total
	countQuery := `
		SELECT COUNT(*)
		FROM courses
		WHERE category_id = $1 AND tenant_id = $2 AND deleted_at IS NULL
	`

	var totalCount int
	err := r.db.GetContext(ctx, &totalCount, countQuery, categoryID, tenantID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count courses: %w", err)
	}

	// Get courses
	query := `
		SELECT
			id, tenant_id, title, slug, description, instructor_id, category_id,
			status, level, duration, price, thumbnail, preview_video,
			requirements, what_you_will_learn, target_audience,
			enrollment_count, rating, rating_count,
			is_published, published_at, created_at, updated_at, deleted_at
		FROM courses
		WHERE category_id = $1 AND tenant_id = $2 AND deleted_at IS NULL
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4
	`

	offset := (page - 1) * pageSize
	var rows []courseRow
	err = r.db.SelectContext(ctx, &rows, query, categoryID, tenantID, pageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get courses by category: %w", err)
	}

	courses := make([]*domain.Course, len(rows))
	for i, row := range rows {
		course, err := courseToDomain(&row)
		if err != nil {
			return nil, 0, err
		}
		courses[i] = course
	}

	return courses, totalCount, nil
}

// UpdateEnrollmentCount updates the enrollment count for a course
func (r *PostgreSQLCourseRepository) UpdateEnrollmentCount(ctx context.Context, courseID, tenantID uuid.UUID, count int) error {
	query := `
		UPDATE courses SET
			enrollment_count = $1,
			updated_at = $2
		WHERE id = $3 AND tenant_id = $4 AND deleted_at IS NULL
	`

	now := time.Now()
	result, err := r.db.ExecContext(ctx, query, count, now, courseID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to update enrollment count: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ports.ErrCourseNotFound
	}

	return nil
}

// UpdateRating updates the rating statistics for a course
func (r *PostgreSQLCourseRepository) UpdateRating(ctx context.Context, courseID, tenantID uuid.UUID, rating float64, count int) error {
	query := `
		UPDATE courses SET
			rating = $1,
			rating_count = $2,
			updated_at = $3
		WHERE id = $4 AND tenant_id = $5 AND deleted_at IS NULL
	`

	now := time.Now()
	result, err := r.db.ExecContext(ctx, query, rating, count, now, courseID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to update rating: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ports.ErrCourseNotFound
	}

	return nil
}

// GetPublishedCourses retrieves all published courses
func (r *PostgreSQLCourseRepository) GetPublishedCourses(ctx context.Context, tenantID uuid.UUID, page, pageSize int) ([]*domain.Course, int, error) {
	// Count total
	countQuery := `
		SELECT COUNT(*)
		FROM courses
		WHERE tenant_id = $1 AND is_published = true AND status = $2 AND deleted_at IS NULL
	`

	var totalCount int
	err := r.db.GetContext(ctx, &totalCount, countQuery, tenantID, string(domain.CourseStatusPublished))
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count published courses: %w", err)
	}

	// Get courses
	query := `
		SELECT
			id, tenant_id, title, slug, description, instructor_id, category_id,
			status, level, duration, price, thumbnail, preview_video,
			requirements, what_you_will_learn, target_audience,
			enrollment_count, rating, rating_count,
			is_published, published_at, created_at, updated_at, deleted_at
		FROM courses
		WHERE tenant_id = $1 AND is_published = true AND status = $2 AND deleted_at IS NULL
		ORDER BY published_at DESC
		LIMIT $3 OFFSET $4
	`

	offset := (page - 1) * pageSize
	var rows []courseRow
	err = r.db.SelectContext(ctx, &rows, query, tenantID, string(domain.CourseStatusPublished), pageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get published courses: %w", err)
	}

	courses := make([]*domain.Course, len(rows))
	for i, row := range rows {
		course, err := courseToDomain(&row)
		if err != nil {
			return nil, 0, err
		}
		courses[i] = course
	}

	return courses, totalCount, nil
}

// PostgreSQLCourseCategoryRepository is a PostgreSQL implementation of CourseCategoryRepository
type PostgreSQLCourseCategoryRepository struct {
	db *sqlx.DB
}

// NewPostgreSQLCourseCategoryRepository creates a new PostgreSQL category repository
func NewPostgreSQLCourseCategoryRepository(db *sqlx.DB) ports.CourseCategoryRepository {
	return &PostgreSQLCourseCategoryRepository{db: db}
}

// courseCategoryRow represents a course category row in the database
type courseCategoryRow struct {
	ID           uuid.UUID  `db:"id"`
	TenantID     uuid.UUID  `db:"tenant_id"`
	Name         string     `db:"name"`
	Slug         string     `db:"slug"`
	Description  *string    `db:"description"`
	ParentID     *uuid.UUID `db:"parent_id"`
	Icon         *string    `db:"icon"`
	DisplayOrder int        `db:"display_order"`
	IsActive     bool       `db:"is_active"`
	CourseCount  int        `db:"course_count"`
	CreatedAt    time.Time  `db:"created_at"`
	UpdatedAt    time.Time  `db:"updated_at"`
}

// categoryToDomain converts a database row to a domain category
func categoryToDomain(row *courseCategoryRow) *domain.CourseCategory {
	return &domain.CourseCategory{
		ID:           row.ID,
		TenantID:     row.TenantID,
		Name:         row.Name,
		Slug:         row.Slug,
		Description:  row.Description,
		ParentID:     row.ParentID,
		Icon:         row.Icon,
		DisplayOrder: row.DisplayOrder,
		IsActive:     row.IsActive,
		CourseCount:  row.CourseCount,
		CreatedAt:    row.CreatedAt,
		UpdatedAt:    row.UpdatedAt,
	}
}

// GetCategory retrieves a category by ID
func (r *PostgreSQLCourseCategoryRepository) GetCategory(ctx context.Context, categoryID, tenantID uuid.UUID) (*domain.CourseCategory, error) {
	query := `
		SELECT id, tenant_id, name, slug, description, parent_id, icon,
		       display_order, is_active, course_count, created_at, updated_at
		FROM course_categories
		WHERE id = $1 AND tenant_id = $2
	`

	var row courseCategoryRow
	err := r.db.GetContext(ctx, &row, query, categoryID, tenantID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ports.ErrCategoryNotFound
		}
		return nil, fmt.Errorf("failed to get category: %w", err)
	}

	return categoryToDomain(&row), nil
}

// GetCategoryBySlug retrieves a category by its slug
func (r *PostgreSQLCourseCategoryRepository) GetCategoryBySlug(ctx context.Context, slug string, tenantID uuid.UUID) (*domain.CourseCategory, error) {
	query := `
		SELECT id, tenant_id, name, slug, description, parent_id, icon,
		       display_order, is_active, course_count, created_at, updated_at
		FROM course_categories
		WHERE slug = $1 AND tenant_id = $2
	`

	var row courseCategoryRow
	err := r.db.GetContext(ctx, &row, query, slug, tenantID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ports.ErrCategoryNotFound
		}
		return nil, fmt.Errorf("failed to get category by slug: %w", err)
	}

	return categoryToDomain(&row), nil
}

// ListCategories retrieves all categories for a tenant
func (r *PostgreSQLCourseCategoryRepository) ListCategories(ctx context.Context, tenantID uuid.UUID, page, pageSize int) ([]*domain.CourseCategory, int, error) {
	// Get total count
	var totalCount int
	countQuery := `SELECT COUNT(*) FROM course_categories WHERE tenant_id = $1`
	err := r.db.GetContext(ctx, &totalCount, countQuery, tenantID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count categories: %w", err)
	}

	// Get paginated results
	offset := (page - 1) * pageSize
	query := `
		SELECT id, tenant_id, name, slug, description, parent_id, icon,
		       display_order, is_active, course_count, created_at, updated_at
		FROM course_categories
		WHERE tenant_id = $1
		ORDER BY display_order ASC, name ASC
		LIMIT $2 OFFSET $3
	`

	var rows []courseCategoryRow
	err = r.db.SelectContext(ctx, &rows, query, tenantID, pageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list categories: %w", err)
	}

	categories := make([]*domain.CourseCategory, len(rows))
	for i, row := range rows {
		categories[i] = categoryToDomain(&row)
	}

	return categories, totalCount, nil
}

// ListActiveCategories retrieves all active categories
func (r *PostgreSQLCourseCategoryRepository) ListActiveCategories(ctx context.Context, tenantID uuid.UUID) ([]*domain.CourseCategory, error) {
	query := `
		SELECT id, tenant_id, name, slug, description, parent_id, icon,
		       display_order, is_active, course_count, created_at, updated_at
		FROM course_categories
		WHERE tenant_id = $1 AND is_active = true
		ORDER BY display_order ASC, name ASC
	`

	var rows []courseCategoryRow
	err := r.db.SelectContext(ctx, &rows, query, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to list active categories: %w", err)
	}

	categories := make([]*domain.CourseCategory, len(rows))
	for i, row := range rows {
		categories[i] = categoryToDomain(&row)
	}

	return categories, nil
}

// CreateCategory creates a new category
func (r *PostgreSQLCourseCategoryRepository) CreateCategory(ctx context.Context, category *domain.CourseCategory) error {
	query := `
		INSERT INTO course_categories (
			id, tenant_id, name, slug, description, parent_id, icon,
			display_order, is_active, course_count, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`

	_, err := r.db.ExecContext(ctx, query,
		category.ID,
		category.TenantID,
		category.Name,
		category.Slug,
		category.Description,
		category.ParentID,
		category.Icon,
		category.DisplayOrder,
		category.IsActive,
		category.CourseCount,
		category.CreatedAt,
		category.UpdatedAt,
	)

	if err != nil {
		// Check for unique constraint violation on slug
		if strings.Contains(err.Error(), "course_categories_slug_unique") {
			return ports.ErrCategorySlugExists
		}
		return fmt.Errorf("failed to create category: %w", err)
	}

	return nil
}

// UpdateCategory updates an existing category
func (r *PostgreSQLCourseCategoryRepository) UpdateCategory(ctx context.Context, category *domain.CourseCategory) error {
	query := `
		UPDATE course_categories
		SET name = $1, slug = $2, description = $3, parent_id = $4, icon = $5,
		    display_order = $6, is_active = $7, updated_at = $8
		WHERE id = $9 AND tenant_id = $10
	`

	result, err := r.db.ExecContext(ctx, query,
		category.Name,
		category.Slug,
		category.Description,
		category.ParentID,
		category.Icon,
		category.DisplayOrder,
		category.IsActive,
		category.UpdatedAt,
		category.ID,
		category.TenantID,
	)

	if err != nil {
		// Check for unique constraint violation on slug
		if strings.Contains(err.Error(), "course_categories_slug_unique") {
			return ports.ErrCategorySlugExists
		}
		return fmt.Errorf("failed to update category: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ports.ErrCategoryNotFound
	}

	return nil
}

// DeleteCategory deletes a category (only if no courses are associated)
func (r *PostgreSQLCourseCategoryRepository) DeleteCategory(ctx context.Context, categoryID, tenantID uuid.UUID) error {
	// First check if category has courses
	var courseCount int
	countQuery := `SELECT course_count FROM course_categories WHERE id = $1 AND tenant_id = $2`
	err := r.db.GetContext(ctx, &courseCount, countQuery, categoryID, tenantID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ports.ErrCategoryNotFound
		}
		return fmt.Errorf("failed to check category course count: %w", err)
	}

	if courseCount > 0 {
		return ports.ErrCategoryHasCourses
	}

	// Delete the category
	query := `DELETE FROM course_categories WHERE id = $1 AND tenant_id = $2`
	result, err := r.db.ExecContext(ctx, query, categoryID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete category: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ports.ErrCategoryNotFound
	}

	return nil
}

// CategoryExists checks if a category exists
func (r *PostgreSQLCourseCategoryRepository) CategoryExists(ctx context.Context, categoryID, tenantID uuid.UUID) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM course_categories WHERE id = $1 AND tenant_id = $2)`

	var exists bool
	err := r.db.GetContext(ctx, &exists, query, categoryID, tenantID)
	if err != nil {
		return false, fmt.Errorf("failed to check category existence: %w", err)
	}

	return exists, nil
}

// CategorySlugExists checks if a category slug is already in use
func (r *PostgreSQLCourseCategoryRepository) CategorySlugExists(ctx context.Context, slug string, tenantID uuid.UUID, excludeCategoryID *uuid.UUID) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM course_categories WHERE slug = $1 AND tenant_id = $2`
	args := []interface{}{slug, tenantID}

	if excludeCategoryID != nil {
		query += ` AND id != $3`
		args = append(args, *excludeCategoryID)
	}

	query += `)`

	var exists bool
	err := r.db.GetContext(ctx, &exists, query, args...)
	if err != nil {
		return false, fmt.Errorf("failed to check category slug existence: %w", err)
	}

	return exists, nil
}

// GetSubcategories retrieves all subcategories of a parent category
func (r *PostgreSQLCourseCategoryRepository) GetSubcategories(ctx context.Context, parentID, tenantID uuid.UUID) ([]*domain.CourseCategory, error) {
	query := `
		SELECT id, tenant_id, name, slug, description, parent_id, icon,
		       display_order, is_active, course_count, created_at, updated_at
		FROM course_categories
		WHERE parent_id = $1 AND tenant_id = $2
		ORDER BY display_order ASC, name ASC
	`

	var rows []courseCategoryRow
	err := r.db.SelectContext(ctx, &rows, query, parentID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get subcategories: %w", err)
	}

	categories := make([]*domain.CourseCategory, len(rows))
	for i, row := range rows {
		categories[i] = categoryToDomain(&row)
	}

	return categories, nil
}

// IncrementCourseCount increments the course count for a category
func (r *PostgreSQLCourseCategoryRepository) IncrementCourseCount(ctx context.Context, categoryID, tenantID uuid.UUID) error {
	query := `
		UPDATE course_categories
		SET course_count = course_count + 1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1 AND tenant_id = $2
	`

	result, err := r.db.ExecContext(ctx, query, categoryID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to increment course count: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ports.ErrCategoryNotFound
	}

	return nil
}

// DecrementCourseCount decrements the course count for a category
func (r *PostgreSQLCourseCategoryRepository) DecrementCourseCount(ctx context.Context, categoryID, tenantID uuid.UUID) error {
	query := `
		UPDATE course_categories
		SET course_count = GREATEST(course_count - 1, 0), updated_at = CURRENT_TIMESTAMP
		WHERE id = $1 AND tenant_id = $2
	`

	result, err := r.db.ExecContext(ctx, query, categoryID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to decrement course count: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ports.ErrCategoryNotFound
	}

	return nil
}

// UpdateCourseCount updates the course count for a category
func (r *PostgreSQLCourseCategoryRepository) UpdateCourseCount(ctx context.Context, categoryID, tenantID uuid.UUID, count int) error {
	query := `
		UPDATE course_categories
		SET course_count = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2 AND tenant_id = $3
	`

	result, err := r.db.ExecContext(ctx, query, count, categoryID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to update course count: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ports.ErrCategoryNotFound
	}

	return nil
}
