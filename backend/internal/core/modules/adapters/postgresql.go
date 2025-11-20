package adapters

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/modules/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/modules/ports"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

// PostgreSQLModuleRepository implementa ModuleRepository usando PostgreSQL
type PostgreSQLModuleRepository struct {
	db *sqlx.DB
}

// NewPostgreSQLModuleRepository crea una nueva instancia del repositorio
func NewPostgreSQLModuleRepository(db *sqlx.DB) ports.ModuleRepository {
	return &PostgreSQLModuleRepository{
		db: db,
	}
}

// ============================================================
// CRUD Operations
// ============================================================

// Create crea un nuevo módulo
func (r *PostgreSQLModuleRepository) Create(module *domain.Module) error {
	query := `
		INSERT INTO modules (
			id, tenant_id, course_id, title, description, "order",
			is_published, duration, created_by, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`

	now := time.Now()
	module.CreatedAt = now
	module.UpdatedAt = now

	if module.ID == uuid.Nil {
		module.ID = uuid.New()
	}

	_, err := r.db.Exec(query,
		module.ID, module.TenantID, module.CourseID, module.Title, module.Description,
		module.Order, module.IsPublished, module.Duration, module.CreatedBy,
		module.CreatedAt, module.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create module: %w", err)
	}

	return nil
}

// GetByID obtiene un módulo por ID
func (r *PostgreSQLModuleRepository) GetByID(tenantID, moduleID uuid.UUID) (*domain.Module, error) {
	query := `
		SELECT id, tenant_id, course_id, title, description, "order",
			   is_published, duration, created_by, created_at, updated_at, deleted_at
		FROM modules
		WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`

	var module domain.Module
	err := r.db.QueryRow(query, moduleID, tenantID).Scan(
		&module.ID, &module.TenantID, &module.CourseID, &module.Title, &module.Description,
		&module.Order, &module.IsPublished, &module.Duration, &module.CreatedBy,
		&module.CreatedAt, &module.UpdatedAt, &module.DeletedAt,
	)

	if err == sql.ErrNoRows {
		return nil, domain.ErrModuleNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get module: %w", err)
	}

	return &module, nil
}

// GetByCourseID obtiene todos los módulos de un curso
func (r *PostgreSQLModuleRepository) GetByCourseID(tenantID, courseID uuid.UUID) ([]domain.Module, error) {
	query := `
		SELECT id, tenant_id, course_id, title, description, "order",
			   is_published, duration, created_by, created_at, updated_at, deleted_at
		FROM modules
		WHERE course_id = $1 AND tenant_id = $2 AND deleted_at IS NULL
		ORDER BY "order" ASC, created_at ASC`

	rows, err := r.db.Query(query, courseID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get course modules: %w", err)
	}
	defer rows.Close()

	var modules []domain.Module
	for rows.Next() {
		var module domain.Module
		err := rows.Scan(
			&module.ID, &module.TenantID, &module.CourseID, &module.Title, &module.Description,
			&module.Order, &module.IsPublished, &module.Duration, &module.CreatedBy,
			&module.CreatedAt, &module.UpdatedAt, &module.DeletedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan module: %w", err)
		}
		modules = append(modules, module)
	}

	if modules == nil {
		modules = []domain.Module{}
	}

	return modules, nil
}

// Update actualiza un módulo
func (r *PostgreSQLModuleRepository) Update(module *domain.Module) error {
	query := `
		UPDATE modules SET
			title = $1, description = $2, "order" = $3, is_published = $4,
			duration = $5, updated_at = $6
		WHERE id = $7 AND tenant_id = $8 AND deleted_at IS NULL`

	module.UpdatedAt = time.Now()

	result, err := r.db.Exec(query,
		module.Title, module.Description, module.Order, module.IsPublished,
		module.Duration, module.UpdatedAt, module.ID, module.TenantID,
	)

	if err != nil {
		return fmt.Errorf("failed to update module: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return domain.ErrModuleNotFound
	}

	return nil
}

// Delete elimina físicamente un módulo
func (r *PostgreSQLModuleRepository) Delete(tenantID, moduleID uuid.UUID) error {
	query := `DELETE FROM modules WHERE id = $1 AND tenant_id = $2`

	result, err := r.db.Exec(query, moduleID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete module: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return domain.ErrModuleNotFound
	}

	return nil
}

// SoftDelete realiza un borrado lógico
func (r *PostgreSQLModuleRepository) SoftDelete(tenantID, moduleID uuid.UUID) error {
	query := `
		UPDATE modules SET
			deleted_at = $1,
			updated_at = $1
		WHERE id = $2 AND tenant_id = $3 AND deleted_at IS NULL`

	now := time.Now()
	result, err := r.db.Exec(query, now, moduleID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to soft delete module: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return domain.ErrModuleNotFound
	}

	return nil
}

// ============================================================
// Query Operations
// ============================================================

// GetPublishedByCourseID obtiene los módulos publicados de un curso
func (r *PostgreSQLModuleRepository) GetPublishedByCourseID(tenantID, courseID uuid.UUID) ([]domain.Module, error) {
	query := `
		SELECT id, tenant_id, course_id, title, description, "order",
			   is_published, duration, created_by, created_at, updated_at, deleted_at
		FROM modules
		WHERE course_id = $1 AND tenant_id = $2 AND is_published = true AND deleted_at IS NULL
		ORDER BY "order" ASC, created_at ASC`

	rows, err := r.db.Query(query, courseID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get published modules: %w", err)
	}
	defer rows.Close()

	var modules []domain.Module
	for rows.Next() {
		var module domain.Module
		err := rows.Scan(
			&module.ID, &module.TenantID, &module.CourseID, &module.Title, &module.Description,
			&module.Order, &module.IsPublished, &module.Duration, &module.CreatedBy,
			&module.CreatedAt, &module.UpdatedAt, &module.DeletedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan module: %w", err)
		}
		modules = append(modules, module)
	}

	if modules == nil {
		modules = []domain.Module{}
	}

	return modules, nil
}

// CountByCourseID cuenta los módulos de un curso
func (r *PostgreSQLModuleRepository) CountByCourseID(tenantID, courseID uuid.UUID) (int, error) {
	query := `SELECT COUNT(*) FROM modules WHERE course_id = $1 AND tenant_id = $2 AND deleted_at IS NULL`

	var count int
	err := r.db.QueryRow(query, courseID, tenantID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count modules: %w", err)
	}

	return count, nil
}

// CountLessonsByModuleID cuenta las lecciones de un módulo
func (r *PostgreSQLModuleRepository) CountLessonsByModuleID(tenantID, moduleID uuid.UUID) (int, error) {
	query := `SELECT COUNT(*) FROM lessons WHERE module_id = $1 AND tenant_id = $2 AND deleted_at IS NULL`

	var count int
	err := r.db.QueryRow(query, moduleID, tenantID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count lessons: %w", err)
	}

	return count, nil
}

// ============================================================
// Ordering Operations
// ============================================================

// GetMaxOrder obtiene el orden máximo en un curso
func (r *PostgreSQLModuleRepository) GetMaxOrder(tenantID, courseID uuid.UUID) (int, error) {
	query := `SELECT COALESCE(MAX("order"), 0) FROM modules WHERE course_id = $1 AND tenant_id = $2 AND deleted_at IS NULL`

	var maxOrder int
	err := r.db.QueryRow(query, courseID, tenantID).Scan(&maxOrder)
	if err != nil {
		return 0, fmt.Errorf("failed to get max order: %w", err)
	}

	return maxOrder, nil
}

// UpdateOrder actualiza el orden de un módulo
func (r *PostgreSQLModuleRepository) UpdateOrder(tenantID, moduleID uuid.UUID, order int) error {
	query := `UPDATE modules SET "order" = $1, updated_at = $2 WHERE id = $3 AND tenant_id = $4 AND deleted_at IS NULL`

	result, err := r.db.Exec(query, order, time.Now(), moduleID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to update order: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return domain.ErrModuleNotFound
	}

	return nil
}

// ReorderModules reordena múltiples módulos
func (r *PostgreSQLModuleRepository) ReorderModules(tenantID, courseID uuid.UUID, moduleOrders []domain.ModuleOrder) error {
	tx, err := r.db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	query := `UPDATE modules SET "order" = $1, updated_at = $2 WHERE id = $3 AND tenant_id = $4 AND course_id = $5 AND deleted_at IS NULL`
	now := time.Now()

	for _, mo := range moduleOrders {
		_, err := tx.Exec(query, mo.Order, now, mo.ModuleID, tenantID, courseID)
		if err != nil {
			return fmt.Errorf("failed to update module order: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// ============================================================
// Progress Operations
// ============================================================

// CreateProgress crea un registro de progreso
func (r *PostgreSQLModuleRepository) CreateProgress(progress *domain.ModuleProgress) error {
	query := `
		INSERT INTO module_progress (
			id, tenant_id, module_id, user_id, completed_lessons, total_lessons,
			progress_percent, started_at, last_accessed_at, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`

	now := time.Now()
	progress.CreatedAt = now
	progress.UpdatedAt = now
	progress.StartedAt = now
	progress.LastAccessedAt = now

	if progress.ID == uuid.Nil {
		progress.ID = uuid.New()
	}

	progress.CalculateProgress()

	_, err := r.db.Exec(query,
		progress.ID, progress.TenantID, progress.ModuleID, progress.UserID,
		progress.CompletedLessons, progress.TotalLessons, progress.ProgressPercent,
		progress.StartedAt, progress.LastAccessedAt, progress.CreatedAt, progress.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create progress: %w", err)
	}

	return nil
}

// GetProgress obtiene el progreso de un usuario en un módulo
func (r *PostgreSQLModuleRepository) GetProgress(tenantID, moduleID, userID uuid.UUID) (*domain.ModuleProgress, error) {
	query := `
		SELECT id, tenant_id, module_id, user_id, completed_lessons, total_lessons,
			   progress_percent, started_at, completed_at, last_accessed_at,
			   created_at, updated_at
		FROM module_progress
		WHERE module_id = $1 AND user_id = $2 AND tenant_id = $3`

	var progress domain.ModuleProgress
	err := r.db.QueryRow(query, moduleID, userID, tenantID).Scan(
		&progress.ID, &progress.TenantID, &progress.ModuleID, &progress.UserID,
		&progress.CompletedLessons, &progress.TotalLessons, &progress.ProgressPercent,
		&progress.StartedAt, &progress.CompletedAt, &progress.LastAccessedAt,
		&progress.CreatedAt, &progress.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, domain.ErrProgressNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get progress: %w", err)
	}

	return &progress, nil
}

// GetUserProgressByCourse obtiene el progreso de un usuario en todos los módulos de un curso
func (r *PostgreSQLModuleRepository) GetUserProgressByCourse(tenantID, courseID, userID uuid.UUID) ([]domain.ModuleProgress, error) {
	query := `
		SELECT mp.id, mp.tenant_id, mp.module_id, mp.user_id, mp.completed_lessons,
			   mp.total_lessons, mp.progress_percent, mp.started_at, mp.completed_at,
			   mp.last_accessed_at, mp.created_at, mp.updated_at
		FROM module_progress mp
		INNER JOIN modules m ON mp.module_id = m.id
		WHERE m.course_id = $1 AND mp.user_id = $2 AND mp.tenant_id = $3
		ORDER BY m."order" ASC`

	rows, err := r.db.Query(query, courseID, userID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user progress: %w", err)
	}
	defer rows.Close()

	var progressList []domain.ModuleProgress
	for rows.Next() {
		var progress domain.ModuleProgress
		err := rows.Scan(
			&progress.ID, &progress.TenantID, &progress.ModuleID, &progress.UserID,
			&progress.CompletedLessons, &progress.TotalLessons, &progress.ProgressPercent,
			&progress.StartedAt, &progress.CompletedAt, &progress.LastAccessedAt,
			&progress.CreatedAt, &progress.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan progress: %w", err)
		}
		progressList = append(progressList, progress)
	}

	if progressList == nil {
		progressList = []domain.ModuleProgress{}
	}

	return progressList, nil
}

// UpdateProgress actualiza el progreso
func (r *PostgreSQLModuleRepository) UpdateProgress(progress *domain.ModuleProgress) error {
	query := `
		UPDATE module_progress SET
			completed_lessons = $1, total_lessons = $2, progress_percent = $3,
			completed_at = $4, last_accessed_at = $5, updated_at = $6
		WHERE id = $7 AND tenant_id = $8`

	progress.UpdatedAt = time.Now()
	progress.LastAccessedAt = time.Now()
	progress.CalculateProgress()

	// Si está completado y no tiene fecha de completado, establecerla
	if progress.ProgressPercent >= 100.0 && progress.CompletedAt == nil {
		now := time.Now()
		progress.CompletedAt = &now
	}

	result, err := r.db.Exec(query,
		progress.CompletedLessons, progress.TotalLessons, progress.ProgressPercent,
		progress.CompletedAt, progress.LastAccessedAt, progress.UpdatedAt,
		progress.ID, progress.TenantID,
	)

	if err != nil {
		return fmt.Errorf("failed to update progress: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return domain.ErrProgressNotFound
	}

	return nil
}

// RecalculateProgress recalcula el progreso basado en las lecciones completadas
func (r *PostgreSQLModuleRepository) RecalculateProgress(tenantID, moduleID, userID uuid.UUID) error {
	// Contar lecciones totales en el módulo
	totalQuery := `SELECT COUNT(*) FROM lessons WHERE module_id = $1 AND tenant_id = $2 AND deleted_at IS NULL`
	var totalLessons int
	err := r.db.QueryRow(totalQuery, moduleID, tenantID).Scan(&totalLessons)
	if err != nil {
		return fmt.Errorf("failed to count total lessons: %w", err)
	}

	// Contar lecciones completadas por el usuario
	completedQuery := `
		SELECT COUNT(DISTINCT lp.lesson_id)
		FROM lesson_progress lp
		INNER JOIN lessons l ON lp.lesson_id = l.id
		WHERE l.module_id = $1 AND lp.user_id = $2 AND lp.tenant_id = $3 AND lp.is_completed = true`

	var completedLessons int
	err = r.db.QueryRow(completedQuery, moduleID, userID, tenantID).Scan(&completedLessons)
	if err != nil {
		return fmt.Errorf("failed to count completed lessons: %w", err)
	}

	// Actualizar progreso
	progress, err := r.GetProgress(tenantID, moduleID, userID)
	if err != nil {
		// Si no existe, crear nuevo progreso
		if err == domain.ErrProgressNotFound {
			progress = &domain.ModuleProgress{
				TenantID:         tenantID,
				ModuleID:         moduleID,
				UserID:           userID,
				CompletedLessons: completedLessons,
				TotalLessons:     totalLessons,
			}
			return r.CreateProgress(progress)
		}
		return err
	}

	progress.CompletedLessons = completedLessons
	progress.TotalLessons = totalLessons
	return r.UpdateProgress(progress)
}
