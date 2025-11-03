package adapters

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/lessons/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/lessons/ports"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

// PostgreSQLLessonRepository implements the LessonRepository interface using PostgreSQL
type PostgreSQLLessonRepository struct {
	db *sqlx.DB
}

// NewPostgreSQLLessonRepository creates a new PostgreSQL lesson repository
func NewPostgreSQLLessonRepository(db *sqlx.DB) ports.LessonRepository {
	return &PostgreSQLLessonRepository{
		db: db,
	}
}

// lessonRow represents a lesson row from the database
type lessonRow struct {
	ID          uuid.UUID  `db:"id"`
	TenantID    uuid.UUID  `db:"tenant_id"`
	CourseID    uuid.UUID  `db:"course_id"`
	Title       string     `db:"title"`
	Description *string    `db:"description"`
	ContentType string     `db:"content_type"`
	ContentURL  *string    `db:"content_url"`
	Content     *string    `db:"content"`
	Duration    *int       `db:"duration"`
	OrderIndex  int        `db:"order_index"`
	IsPublished bool       `db:"is_published"`
	IsFree      bool       `db:"is_free"`
	QuizID      *uuid.UUID `db:"quiz_id"`
	CreatedAt   time.Time  `db:"created_at"`
	UpdatedAt   time.Time  `db:"updated_at"`
	DeletedAt   *time.Time `db:"deleted_at"`
}

// lessonToDomain converts a lessonRow to a domain.Lesson
func lessonToDomain(row *lessonRow) *domain.Lesson {
	return &domain.Lesson{
		ID:          row.ID,
		TenantID:    row.TenantID,
		CourseID:    row.CourseID,
		Title:       row.Title,
		Description: row.Description,
		ContentType: domain.ContentType(row.ContentType),
		ContentURL:  row.ContentURL,
		Content:     row.Content,
		Duration:    row.Duration,
		OrderIndex:  row.OrderIndex,
		IsPublished: row.IsPublished,
		IsFree:      row.IsFree,
		QuizID:      row.QuizID,
		CreatedAt:   row.CreatedAt,
		UpdatedAt:   row.UpdatedAt,
		DeletedAt:   row.DeletedAt,
	}
}

// completionRow represents a lesson completion row from the database
type completionRow struct {
	ID                uuid.UUID  `db:"id"`
	TenantID          uuid.UUID  `db:"tenant_id"`
	LessonID          uuid.UUID  `db:"lesson_id"`
	UserID            uuid.UUID  `db:"user_id"`
	IsCompleted       bool       `db:"is_completed"`
	TimeSpent         *int       `db:"time_spent"`
	CompletionPercent int        `db:"completion_percent"`
	LastAccessedAt    *time.Time `db:"last_accessed_at"`
	CompletedAt       *time.Time `db:"completed_at"`
	CreatedAt         time.Time  `db:"created_at"`
	UpdatedAt         time.Time  `db:"updated_at"`
}

// completionToDomain converts a completionRow to a domain.LessonCompletion
func completionToDomain(row *completionRow) *domain.LessonCompletion {
	return &domain.LessonCompletion{
		ID:                row.ID,
		TenantID:          row.TenantID,
		LessonID:          row.LessonID,
		UserID:            row.UserID,
		IsCompleted:       row.IsCompleted,
		TimeSpent:         row.TimeSpent,
		CompletionPercent: row.CompletionPercent,
		LastAccessedAt:    row.LastAccessedAt,
		CompletedAt:       row.CompletedAt,
		CreatedAt:         row.CreatedAt,
		UpdatedAt:         row.UpdatedAt,
	}
}

// Create creates a new lesson
func (r *PostgreSQLLessonRepository) Create(ctx context.Context, lesson *domain.Lesson) error {
	query := `
		INSERT INTO lessons (
			id, tenant_id, course_id, title, description, content_type,
			content_url, content, duration, order_index, is_published,
			is_free, quiz_id, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
		)
	`

	_, err := r.db.ExecContext(ctx, query,
		lesson.ID, lesson.TenantID, lesson.CourseID, lesson.Title, lesson.Description,
		lesson.ContentType, lesson.ContentURL, lesson.Content, lesson.Duration,
		lesson.OrderIndex, lesson.IsPublished, lesson.IsFree, lesson.QuizID,
		lesson.CreatedAt, lesson.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create lesson: %w", err)
	}

	return nil
}

// Update updates an existing lesson
func (r *PostgreSQLLessonRepository) Update(ctx context.Context, lesson *domain.Lesson) error {
	query := `
		UPDATE lessons SET
			title = $1, description = $2, content_type = $3,
			content_url = $4, content = $5, duration = $6,
			order_index = $7, is_published = $8, is_free = $9,
			quiz_id = $10, updated_at = $11
		WHERE id = $12 AND tenant_id = $13 AND deleted_at IS NULL
	`

	result, err := r.db.ExecContext(ctx, query,
		lesson.Title, lesson.Description, lesson.ContentType, lesson.ContentURL,
		lesson.Content, lesson.Duration, lesson.OrderIndex, lesson.IsPublished,
		lesson.IsFree, lesson.QuizID, lesson.UpdatedAt, lesson.ID, lesson.TenantID,
	)
	if err != nil {
		return fmt.Errorf("failed to update lesson: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return ports.ErrLessonNotFound
	}

	return nil
}

// Delete soft deletes a lesson
func (r *PostgreSQLLessonRepository) Delete(ctx context.Context, lessonID, tenantID uuid.UUID) error {
	query := `
		UPDATE lessons SET deleted_at = $1
		WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL
	`

	result, err := r.db.ExecContext(ctx, query, time.Now(), lessonID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete lesson: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return ports.ErrLessonNotFound
	}

	return nil
}

// GetByID retrieves a lesson by ID
func (r *PostgreSQLLessonRepository) GetByID(ctx context.Context, lessonID, tenantID uuid.UUID) (*domain.Lesson, error) {
	query := `
		SELECT
			id, tenant_id, course_id, title, description, content_type,
			content_url, content, duration, order_index, is_published,
			is_free, quiz_id, created_at, updated_at, deleted_at
		FROM lessons
		WHERE id = $1 AND tenant_id = $2
	`

	var row lessonRow
	err := r.db.GetContext(ctx, &row, query, lessonID, tenantID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ports.ErrLessonNotFound
		}
		return nil, fmt.Errorf("failed to get lesson: %w", err)
	}

	return lessonToDomain(&row), nil
}

// GetByCourseID retrieves lessons for a course with pagination
func (r *PostgreSQLLessonRepository) GetByCourseID(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) ([]domain.Lesson, int, error) {
	// Get total count
	countQuery := `
		SELECT COUNT(*) FROM lessons
		WHERE course_id = $1 AND tenant_id = $2 AND deleted_at IS NULL
	`
	var total int
	if err := r.db.GetContext(ctx, &total, countQuery, courseID, tenantID); err != nil {
		return nil, 0, fmt.Errorf("failed to count lessons: %w", err)
	}

	// Get lessons
	query := `
		SELECT
			id, tenant_id, course_id, title, description, content_type,
			content_url, content, duration, order_index, is_published,
			is_free, quiz_id, created_at, updated_at, deleted_at
		FROM lessons
		WHERE course_id = $1 AND tenant_id = $2 AND deleted_at IS NULL
		ORDER BY order_index ASC
		LIMIT $3 OFFSET $4
	`

	offset := (page - 1) * pageSize
	var rows []lessonRow
	if err := r.db.SelectContext(ctx, &rows, query, courseID, tenantID, pageSize, offset); err != nil {
		return nil, 0, fmt.Errorf("failed to get lessons: %w", err)
	}

	lessons := make([]domain.Lesson, 0, len(rows))
	for _, row := range rows {
		lessons = append(lessons, *lessonToDomain(&row))
	}

	return lessons, total, nil
}

// GetPublishedByCourseID retrieves all published lessons for a course
func (r *PostgreSQLLessonRepository) GetPublishedByCourseID(ctx context.Context, courseID, tenantID uuid.UUID) ([]domain.Lesson, error) {
	query := `
		SELECT
			id, tenant_id, course_id, title, description, content_type,
			content_url, content, duration, order_index, is_published,
			is_free, quiz_id, created_at, updated_at, deleted_at
		FROM lessons
		WHERE course_id = $1 AND tenant_id = $2 AND is_published = true AND deleted_at IS NULL
		ORDER BY order_index ASC
	`

	var rows []lessonRow
	if err := r.db.SelectContext(ctx, &rows, query, courseID, tenantID); err != nil {
		return nil, fmt.Errorf("failed to get published lessons: %w", err)
	}

	lessons := make([]domain.Lesson, 0, len(rows))
	for _, row := range rows {
		lessons = append(lessons, *lessonToDomain(&row))
	}

	return lessons, nil
}

// Exists checks if a lesson exists
func (r *PostgreSQLLessonRepository) Exists(ctx context.Context, lessonID, tenantID uuid.UUID) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM lessons WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL)`
	var exists bool
	if err := r.db.GetContext(ctx, &exists, query, lessonID, tenantID); err != nil {
		return false, fmt.Errorf("failed to check lesson existence: %w", err)
	}
	return exists, nil
}

// IsPublished checks if a lesson is published
func (r *PostgreSQLLessonRepository) IsPublished(ctx context.Context, lessonID, tenantID uuid.UUID) (bool, error) {
	query := `SELECT is_published FROM lessons WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`
	var isPublished bool
	err := r.db.GetContext(ctx, &isPublished, query, lessonID, tenantID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, ports.ErrLessonNotFound
		}
		return false, fmt.Errorf("failed to check if lesson is published: %w", err)
	}
	return isPublished, nil
}

// GetMaxOrderIndex retrieves the maximum order index for lessons in a course
func (r *PostgreSQLLessonRepository) GetMaxOrderIndex(ctx context.Context, courseID, tenantID uuid.UUID) (int, error) {
	query := `SELECT COALESCE(MAX(order_index), -1) FROM lessons WHERE course_id = $1 AND tenant_id = $2 AND deleted_at IS NULL`
	var maxOrder int
	if err := r.db.GetContext(ctx, &maxOrder, query, courseID, tenantID); err != nil {
		return 0, fmt.Errorf("failed to get max order index: %w", err)
	}
	return maxOrder, nil
}

// ReorderLessons updates the order of lessons
func (r *PostgreSQLLessonRepository) ReorderLessons(ctx context.Context, courseID, tenantID uuid.UUID, orders []domain.LessonOrder) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	query := `UPDATE lessons SET order_index = $1, updated_at = $2 WHERE id = $3 AND course_id = $4 AND tenant_id = $5 AND deleted_at IS NULL`

	for _, order := range orders {
		result, err := tx.ExecContext(ctx, query, order.OrderIndex, time.Now(), order.LessonID, courseID, tenantID)
		if err != nil {
			return fmt.Errorf("failed to update lesson order: %w", err)
		}

		rows, err := result.RowsAffected()
		if err != nil {
			return fmt.Errorf("failed to get rows affected: %w", err)
		}
		if rows == 0 {
			return ports.ErrLessonNotFound
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// DeleteByCourseID deletes all lessons for a course
func (r *PostgreSQLLessonRepository) DeleteByCourseID(ctx context.Context, courseID, tenantID uuid.UUID) error {
	query := `UPDATE lessons SET deleted_at = $1 WHERE course_id = $2 AND tenant_id = $3 AND deleted_at IS NULL`
	_, err := r.db.ExecContext(ctx, query, time.Now(), courseID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete lessons by course: %w", err)
	}
	return nil
}

// CreateCompletion creates a new lesson completion record
func (r *PostgreSQLLessonRepository) CreateCompletion(ctx context.Context, completion *domain.LessonCompletion) error {
	query := `
		INSERT INTO lesson_completions (
			id, tenant_id, lesson_id, user_id, is_completed, time_spent,
			completion_percent, last_accessed_at, completed_at, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
		)
	`

	_, err := r.db.ExecContext(ctx, query,
		completion.ID, completion.TenantID, completion.LessonID, completion.UserID,
		completion.IsCompleted, completion.TimeSpent, completion.CompletionPercent,
		completion.LastAccessedAt, completion.CompletedAt, completion.CreatedAt, completion.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create lesson completion: %w", err)
	}

	return nil
}

// UpdateCompletion updates a lesson completion record
func (r *PostgreSQLLessonRepository) UpdateCompletion(ctx context.Context, completion *domain.LessonCompletion) error {
	query := `
		UPDATE lesson_completions SET
			is_completed = $1, time_spent = $2, completion_percent = $3,
			last_accessed_at = $4, completed_at = $5, updated_at = $6
		WHERE id = $7 AND tenant_id = $8
	`

	result, err := r.db.ExecContext(ctx, query,
		completion.IsCompleted, completion.TimeSpent, completion.CompletionPercent,
		completion.LastAccessedAt, completion.CompletedAt, completion.UpdatedAt,
		completion.ID, completion.TenantID,
	)
	if err != nil {
		return fmt.Errorf("failed to update lesson completion: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return ports.ErrLessonCompletionNotFound
	}

	return nil
}

// GetCompletion retrieves a lesson completion record
func (r *PostgreSQLLessonRepository) GetCompletion(ctx context.Context, lessonID, userID, tenantID uuid.UUID) (*domain.LessonCompletion, error) {
	query := `
		SELECT
			id, tenant_id, lesson_id, user_id, is_completed, time_spent,
			completion_percent, last_accessed_at, completed_at, created_at, updated_at
		FROM lesson_completions
		WHERE lesson_id = $1 AND user_id = $2 AND tenant_id = $3
	`

	var row completionRow
	err := r.db.GetContext(ctx, &row, query, lessonID, userID, tenantID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ports.ErrLessonCompletionNotFound
		}
		return nil, fmt.Errorf("failed to get lesson completion: %w", err)
	}

	return completionToDomain(&row), nil
}

// GetCompletionsByUser retrieves all lesson completions for a user
func (r *PostgreSQLLessonRepository) GetCompletionsByUser(ctx context.Context, userID, tenantID uuid.UUID, courseID *uuid.UUID) ([]domain.LessonCompletion, error) {
	query := `
		SELECT
			lc.id, lc.tenant_id, lc.lesson_id, lc.user_id, lc.is_completed,
			lc.time_spent, lc.completion_percent, lc.last_accessed_at,
			lc.completed_at, lc.created_at, lc.updated_at
		FROM lesson_completions lc
		JOIN lessons l ON lc.lesson_id = l.id
		WHERE lc.user_id = $1 AND lc.tenant_id = $2
	`

	args := []interface{}{userID, tenantID}
	if courseID != nil {
		query += ` AND l.course_id = $3`
		args = append(args, *courseID)
	}

	var rows []completionRow
	if err := r.db.SelectContext(ctx, &rows, query, args...); err != nil {
		return nil, fmt.Errorf("failed to get lesson completions: %w", err)
	}

	completions := make([]domain.LessonCompletion, 0, len(rows))
	for _, row := range rows {
		completions = append(completions, *completionToDomain(&row))
	}

	return completions, nil
}

// GetCompletionsByCourse retrieves all lesson completions for a course
func (r *PostgreSQLLessonRepository) GetCompletionsByCourse(ctx context.Context, courseID, userID, tenantID uuid.UUID) ([]domain.LessonCompletion, error) {
	query := `
		SELECT
			lc.id, lc.tenant_id, lc.lesson_id, lc.user_id, lc.is_completed,
			lc.time_spent, lc.completion_percent, lc.last_accessed_at,
			lc.completed_at, lc.created_at, lc.updated_at
		FROM lesson_completions lc
		JOIN lessons l ON lc.lesson_id = l.id
		WHERE l.course_id = $1 AND lc.user_id = $2 AND lc.tenant_id = $3
		ORDER BY l.order_index ASC
	`

	var rows []completionRow
	if err := r.db.SelectContext(ctx, &rows, query, courseID, userID, tenantID); err != nil {
		return nil, fmt.Errorf("failed to get course completions: %w", err)
	}

	completions := make([]domain.LessonCompletion, 0, len(rows))
	for _, row := range rows {
		completions = append(completions, *completionToDomain(&row))
	}

	return completions, nil
}

// CompletionExists checks if a lesson completion exists
func (r *PostgreSQLLessonRepository) CompletionExists(ctx context.Context, lessonID, userID, tenantID uuid.UUID) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM lesson_completions WHERE lesson_id = $1 AND user_id = $2 AND tenant_id = $3)`
	var exists bool
	if err := r.db.GetContext(ctx, &exists, query, lessonID, userID, tenantID); err != nil {
		return false, fmt.Errorf("failed to check completion existence: %w", err)
	}
	return exists, nil
}

// GetCourseCompletionStats retrieves completion statistics for a course
func (r *PostgreSQLLessonRepository) GetCourseCompletionStats(ctx context.Context, courseID, userID, tenantID uuid.UUID) (completed int, total int, err error) {
	// Get total lessons
	totalQuery := `
		SELECT COUNT(*) FROM lessons
		WHERE course_id = $1 AND tenant_id = $2 AND is_published = true AND deleted_at IS NULL
	`
	if err := r.db.GetContext(ctx, &total, totalQuery, courseID, tenantID); err != nil {
		return 0, 0, fmt.Errorf("failed to get total lessons: %w", err)
	}

	// Get completed lessons
	completedQuery := `
		SELECT COUNT(*) FROM lesson_completions lc
		JOIN lessons l ON lc.lesson_id = l.id
		WHERE l.course_id = $1 AND lc.user_id = $2 AND lc.tenant_id = $3 AND lc.is_completed = true AND l.deleted_at IS NULL
	`
	if err := r.db.GetContext(ctx, &completed, completedQuery, courseID, userID, tenantID); err != nil {
		return 0, 0, fmt.Errorf("failed to get completed lessons: %w", err)
	}

	return completed, total, nil
}

// GetUserCompletionPercentage retrieves the average completion percentage for a user in a course
func (r *PostgreSQLLessonRepository) GetUserCompletionPercentage(ctx context.Context, courseID, userID, tenantID uuid.UUID) (int, error) {
	query := `
		SELECT COALESCE(AVG(lc.completion_percent), 0)::int
		FROM lesson_completions lc
		JOIN lessons l ON lc.lesson_id = l.id
		WHERE l.course_id = $1 AND lc.user_id = $2 AND lc.tenant_id = $3 AND l.deleted_at IS NULL
	`

	var percentage int
	if err := r.db.GetContext(ctx, &percentage, query, courseID, userID, tenantID); err != nil {
		return 0, fmt.Errorf("failed to get completion percentage: %w", err)
	}

	return percentage, nil
}
