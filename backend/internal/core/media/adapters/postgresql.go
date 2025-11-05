package adapters

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/media/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/media/ports"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

// PostgreSQLMediaRepository implementa MediaRepository usando PostgreSQL
type PostgreSQLMediaRepository struct {
	db *sqlx.DB
}

// NewPostgreSQLMediaRepository crea una nueva instancia del repositorio
func NewPostgreSQLMediaRepository(db *sqlx.DB) ports.MediaRepository {
	return &PostgreSQLMediaRepository{
		db: db,
	}
}

// ============================================================
// CRUD Operations
// ============================================================

// Create crea un nuevo registro de media
func (r *PostgreSQLMediaRepository) Create(media *domain.Media) error {
	// Serializar metadata a JSON
	metadataJSON, err := json.Marshal(media.Metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	query := `
		INSERT INTO media (
			id, tenant_id, user_id, file_name, original_name, mime_type,
			file_size, media_type, status, visibility, context, context_id,
			storage_path, url, thumbnail_url, duration, width, height,
			metadata, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
			$15, $16, $17, $18, $19, $20, $21
		)`

	now := time.Now()
	media.CreatedAt = now
	media.UpdatedAt = now

	if media.ID == uuid.Nil {
		media.ID = uuid.New()
	}

	_, err = r.db.Exec(query,
		media.ID, media.TenantID, media.UserID, media.FileName, media.OriginalName,
		media.MimeType, media.FileSize, media.MediaType, media.Status, media.Visibility,
		media.Context, media.ContextID, media.StoragePath, media.URL, media.ThumbnailURL,
		media.Duration, media.Width, media.Height, metadataJSON, media.CreatedAt, media.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create media: %w", err)
	}

	return nil
}

// GetByID obtiene un registro de media por ID
func (r *PostgreSQLMediaRepository) GetByID(tenantID, mediaID uuid.UUID) (*domain.Media, error) {
	query := `
		SELECT id, tenant_id, user_id, file_name, original_name, mime_type,
			   file_size, media_type, status, visibility, context, context_id,
			   storage_path, url, thumbnail_url, duration, width, height,
			   metadata, created_at, updated_at, deleted_at
		FROM media
		WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`

	var media domain.Media
	var metadataJSON []byte

	err := r.db.QueryRow(query, mediaID, tenantID).Scan(
		&media.ID, &media.TenantID, &media.UserID, &media.FileName, &media.OriginalName,
		&media.MimeType, &media.FileSize, &media.MediaType, &media.Status, &media.Visibility,
		&media.Context, &media.ContextID, &media.StoragePath, &media.URL, &media.ThumbnailURL,
		&media.Duration, &media.Width, &media.Height, &metadataJSON, &media.CreatedAt,
		&media.UpdatedAt, &media.DeletedAt,
	)

	if err == sql.ErrNoRows {
		return nil, domain.ErrMediaNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get media: %w", err)
	}

	// Deserializar metadata
	if len(metadataJSON) > 0 {
		if err := json.Unmarshal(metadataJSON, &media.Metadata); err != nil {
			return nil, fmt.Errorf("failed to unmarshal metadata: %w", err)
		}
	}

	return &media, nil
}

// GetByUserID obtiene todos los archivos de un usuario
func (r *PostgreSQLMediaRepository) GetByUserID(tenantID, userID uuid.UUID, limit, offset int) ([]domain.Media, int64, error) {
	// Query para contar total
	countQuery := `
		SELECT COUNT(*)
		FROM media
		WHERE tenant_id = $1 AND user_id = $2 AND deleted_at IS NULL`

	var total int64
	err := r.db.QueryRow(countQuery, tenantID, userID).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count media: %w", err)
	}

	// Query para obtener registros
	query := `
		SELECT id, tenant_id, user_id, file_name, original_name, mime_type,
			   file_size, media_type, status, visibility, context, context_id,
			   storage_path, url, thumbnail_url, duration, width, height,
			   metadata, created_at, updated_at, deleted_at
		FROM media
		WHERE tenant_id = $1 AND user_id = $2 AND deleted_at IS NULL
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4`

	rows, err := r.db.Query(query, tenantID, userID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get user media: %w", err)
	}
	defer rows.Close()

	var mediaList []domain.Media
	for rows.Next() {
		var media domain.Media
		var metadataJSON []byte

		err := rows.Scan(
			&media.ID, &media.TenantID, &media.UserID, &media.FileName, &media.OriginalName,
			&media.MimeType, &media.FileSize, &media.MediaType, &media.Status, &media.Visibility,
			&media.Context, &media.ContextID, &media.StoragePath, &media.URL, &media.ThumbnailURL,
			&media.Duration, &media.Width, &media.Height, &metadataJSON, &media.CreatedAt,
			&media.UpdatedAt, &media.DeletedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan media: %w", err)
		}

		// Deserializar metadata
		if len(metadataJSON) > 0 {
			if err := json.Unmarshal(metadataJSON, &media.Metadata); err != nil {
				return nil, 0, fmt.Errorf("failed to unmarshal metadata: %w", err)
			}
		}

		mediaList = append(mediaList, media)
	}

	if mediaList == nil {
		mediaList = []domain.Media{}
	}

	return mediaList, total, nil
}

// Update actualiza un registro de media
func (r *PostgreSQLMediaRepository) Update(media *domain.Media) error {
	metadataJSON, err := json.Marshal(media.Metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	query := `
		UPDATE media SET
			file_name = $1, original_name = $2, mime_type = $3, file_size = $4,
			media_type = $5, status = $6, visibility = $7, context = $8,
			context_id = $9, storage_path = $10, url = $11, thumbnail_url = $12,
			duration = $13, width = $14, height = $15, metadata = $16, updated_at = $17
		WHERE id = $18 AND tenant_id = $19 AND deleted_at IS NULL`

	media.UpdatedAt = time.Now()

	result, err := r.db.Exec(query,
		media.FileName, media.OriginalName, media.MimeType, media.FileSize,
		media.MediaType, media.Status, media.Visibility, media.Context,
		media.ContextID, media.StoragePath, media.URL, media.ThumbnailURL,
		media.Duration, media.Width, media.Height, metadataJSON, media.UpdatedAt,
		media.ID, media.TenantID,
	)

	if err != nil {
		return fmt.Errorf("failed to update media: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return domain.ErrMediaNotFound
	}

	return nil
}

// Delete elimina físicamente un registro de media
func (r *PostgreSQLMediaRepository) Delete(tenantID, mediaID uuid.UUID) error {
	query := `DELETE FROM media WHERE id = $1 AND tenant_id = $2`

	result, err := r.db.Exec(query, mediaID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete media: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return domain.ErrMediaNotFound
	}

	return nil
}

// SoftDelete realiza un borrado lógico
func (r *PostgreSQLMediaRepository) SoftDelete(tenantID, mediaID uuid.UUID) error {
	query := `
		UPDATE media SET
			deleted_at = $1,
			status = $2,
			updated_at = $1
		WHERE id = $3 AND tenant_id = $4 AND deleted_at IS NULL`

	now := time.Now()
	result, err := r.db.Exec(query, now, domain.MediaStatusDeleted, mediaID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to soft delete media: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return domain.ErrMediaNotFound
	}

	return nil
}

// ============================================================
// Query Operations
// ============================================================

// List obtiene una lista de media con filtros
func (r *PostgreSQLMediaRepository) List(filters domain.MediaFilters) ([]domain.Media, int64, error) {
	// Construir WHERE clause dinámicamente
	whereClauses := []string{"m.tenant_id = $1", "m.deleted_at IS NULL"}
	args := []interface{}{filters.TenantID}
	argCounter := 2

	if filters.UserID != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("m.user_id = $%d", argCounter))
		args = append(args, *filters.UserID)
		argCounter++
	}

	if filters.MediaType != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("m.media_type = $%d", argCounter))
		args = append(args, *filters.MediaType)
		argCounter++
	}

	if filters.Status != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("m.status = $%d", argCounter))
		args = append(args, *filters.Status)
		argCounter++
	}

	if filters.Visibility != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("m.visibility = $%d", argCounter))
		args = append(args, *filters.Visibility)
		argCounter++
	}

	if filters.Context != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("m.context = $%d", argCounter))
		args = append(args, *filters.Context)
		argCounter++
	}

	if filters.ContextID != nil {
		whereClauses = append(whereClauses, fmt.Sprintf("m.context_id = $%d", argCounter))
		args = append(args, *filters.ContextID)
		argCounter++
	}

	if filters.Search != nil && *filters.Search != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("(m.file_name ILIKE $%d OR m.original_name ILIKE $%d)", argCounter, argCounter))
		searchTerm := "%" + *filters.Search + "%"
		args = append(args, searchTerm)
		argCounter++
	}

	whereClause := strings.Join(whereClauses, " AND ")

	// Count query
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM media m WHERE %s", whereClause)
	var total int64
	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count media: %w", err)
	}

	// Sort
	sortBy := "m.created_at"
	if filters.SortBy != "" {
		switch filters.SortBy {
		case "file_size":
			sortBy = "m.file_size"
		case "file_name":
			sortBy = "m.file_name"
		}
	}

	sortOrder := "DESC"
	if filters.SortOrder == "asc" {
		sortOrder = "ASC"
	}

	// Main query
	query := fmt.Sprintf(`
		SELECT m.id, m.tenant_id, m.user_id, m.file_name, m.original_name, m.mime_type,
			   m.file_size, m.media_type, m.status, m.visibility, m.context, m.context_id,
			   m.storage_path, m.url, m.thumbnail_url, m.duration, m.width, m.height,
			   m.metadata, m.created_at, m.updated_at, m.deleted_at
		FROM media m
		WHERE %s
		ORDER BY %s %s
		LIMIT $%d OFFSET $%d`, whereClause, sortBy, sortOrder, argCounter, argCounter+1)

	args = append(args, filters.Limit, filters.Offset)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list media: %w", err)
	}
	defer rows.Close()

	var mediaList []domain.Media
	for rows.Next() {
		var media domain.Media
		var metadataJSON []byte

		err := rows.Scan(
			&media.ID, &media.TenantID, &media.UserID, &media.FileName, &media.OriginalName,
			&media.MimeType, &media.FileSize, &media.MediaType, &media.Status, &media.Visibility,
			&media.Context, &media.ContextID, &media.StoragePath, &media.URL, &media.ThumbnailURL,
			&media.Duration, &media.Width, &media.Height, &metadataJSON, &media.CreatedAt,
			&media.UpdatedAt, &media.DeletedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan media: %w", err)
		}

		if len(metadataJSON) > 0 {
			if err := json.Unmarshal(metadataJSON, &media.Metadata); err != nil {
				return nil, 0, fmt.Errorf("failed to unmarshal metadata: %w", err)
			}
		}

		mediaList = append(mediaList, media)
	}

	if mediaList == nil {
		mediaList = []domain.Media{}
	}

	return mediaList, total, nil
}

// GetByContext obtiene archivos por contexto
func (r *PostgreSQLMediaRepository) GetByContext(tenantID uuid.UUID, context domain.MediaContext, contextID uuid.UUID) ([]domain.Media, error) {
	query := `
		SELECT id, tenant_id, user_id, file_name, original_name, mime_type,
			   file_size, media_type, status, visibility, context, context_id,
			   storage_path, url, thumbnail_url, duration, width, height,
			   metadata, created_at, updated_at, deleted_at
		FROM media
		WHERE tenant_id = $1 AND context = $2 AND context_id = $3 AND deleted_at IS NULL
		ORDER BY created_at DESC`

	rows, err := r.db.Query(query, tenantID, context, contextID)
	if err != nil {
		return nil, fmt.Errorf("failed to get media by context: %w", err)
	}
	defer rows.Close()

	var mediaList []domain.Media
	for rows.Next() {
		var media domain.Media
		var metadataJSON []byte

		err := rows.Scan(
			&media.ID, &media.TenantID, &media.UserID, &media.FileName, &media.OriginalName,
			&media.MimeType, &media.FileSize, &media.MediaType, &media.Status, &media.Visibility,
			&media.Context, &media.ContextID, &media.StoragePath, &media.URL, &media.ThumbnailURL,
			&media.Duration, &media.Width, &media.Height, &metadataJSON, &media.CreatedAt,
			&media.UpdatedAt, &media.DeletedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan media: %w", err)
		}

		if len(metadataJSON) > 0 {
			if err := json.Unmarshal(metadataJSON, &media.Metadata); err != nil {
				return nil, fmt.Errorf("failed to unmarshal metadata: %w", err)
			}
		}

		mediaList = append(mediaList, media)
	}

	if mediaList == nil {
		mediaList = []domain.Media{}
	}

	return mediaList, nil
}

// GetByFolder obtiene archivos por carpeta (continuará en siguiente mensaje por límite de longitud)
func (r *PostgreSQLMediaRepository) GetByFolder(tenantID, folderID uuid.UUID, limit, offset int) ([]domain.Media, int64, error) {
	// Por ahora retorna implementación vacía, se completará cuando se implementen carpetas
	return []domain.Media{}, 0, nil
}

// Search busca archivos por término
func (r *PostgreSQLMediaRepository) Search(tenantID uuid.UUID, query string, limit, offset int) ([]domain.Media, int64, error) {
	filters := domain.MediaFilters{
		TenantID: tenantID,
		Search:   &query,
		Limit:    limit,
		Offset:   offset,
	}
	return r.List(filters)
}

// ============================================================
// Status Management
// ============================================================

// UpdateStatus actualiza el estado de un archivo
func (r *PostgreSQLMediaRepository) UpdateStatus(tenantID, mediaID uuid.UUID, status domain.MediaStatus) error {
	query := `
		UPDATE media SET
			status = $1,
			updated_at = $2
		WHERE id = $3 AND tenant_id = $4 AND deleted_at IS NULL`

	result, err := r.db.Exec(query, status, time.Now(), mediaID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to update status: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return domain.ErrMediaNotFound
	}

	return nil
}

// GetByStatus obtiene archivos por estado
func (r *PostgreSQLMediaRepository) GetByStatus(tenantID uuid.UUID, status domain.MediaStatus) ([]domain.Media, error) {
	query := `
		SELECT id, tenant_id, user_id, file_name, original_name, mime_type,
			   file_size, media_type, status, visibility, context, context_id,
			   storage_path, url, thumbnail_url, duration, width, height,
			   metadata, created_at, updated_at, deleted_at
		FROM media
		WHERE tenant_id = $1 AND status = $2 AND deleted_at IS NULL
		ORDER BY created_at DESC`

	rows, err := r.db.Query(query, tenantID, status)
	if err != nil {
		return nil, fmt.Errorf("failed to get media by status: %w", err)
	}
	defer rows.Close()

	var mediaList []domain.Media
	for rows.Next() {
		var media domain.Media
		var metadataJSON []byte

		err := rows.Scan(
			&media.ID, &media.TenantID, &media.UserID, &media.FileName, &media.OriginalName,
			&media.MimeType, &media.FileSize, &media.MediaType, &media.Status, &media.Visibility,
			&media.Context, &media.ContextID, &media.StoragePath, &media.URL, &media.ThumbnailURL,
			&media.Duration, &media.Width, &media.Height, &metadataJSON, &media.CreatedAt,
			&media.UpdatedAt, &media.DeletedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan media: %w", err)
		}

		if len(metadataJSON) > 0 {
			if err := json.Unmarshal(metadataJSON, &media.Metadata); err != nil {
				return nil, fmt.Errorf("failed to unmarshal metadata: %w", err)
			}
		}

		mediaList = append(mediaList, media)
	}

	if mediaList == nil {
		mediaList = []domain.Media{}
	}

	return mediaList, nil
}

// ============================================================
// Statistics
// ============================================================

// GetStorageStats obtiene estadísticas de almacenamiento
func (r *PostgreSQLMediaRepository) GetStorageStats(tenantID uuid.UUID) (*domain.StorageStats, error) {
	query := `
		SELECT
			COUNT(*) as total_files,
			COALESCE(SUM(file_size), 0) as total_size,
			COALESCE(SUM(CASE WHEN media_type = 'image' THEN 1 ELSE 0 END), 0) as image_count,
			COALESCE(SUM(CASE WHEN media_type = 'video' THEN 1 ELSE 0 END), 0) as video_count,
			COALESCE(SUM(CASE WHEN media_type = 'audio' THEN 1 ELSE 0 END), 0) as audio_count,
			COALESCE(SUM(CASE WHEN media_type = 'document' THEN 1 ELSE 0 END), 0) as document_count,
			COALESCE(SUM(CASE WHEN media_type = 'other' THEN 1 ELSE 0 END), 0) as other_count,
			COALESCE(SUM(CASE WHEN media_type = 'image' THEN file_size ELSE 0 END), 0) as image_size,
			COALESCE(SUM(CASE WHEN media_type = 'video' THEN file_size ELSE 0 END), 0) as video_size,
			COALESCE(SUM(CASE WHEN media_type = 'audio' THEN file_size ELSE 0 END), 0) as audio_size,
			COALESCE(SUM(CASE WHEN media_type = 'document' THEN file_size ELSE 0 END), 0) as document_size,
			COALESCE(SUM(CASE WHEN media_type = 'other' THEN file_size ELSE 0 END), 0) as other_size
		FROM media
		WHERE tenant_id = $1 AND deleted_at IS NULL`

	stats := &domain.StorageStats{TenantID: tenantID}

	err := r.db.QueryRow(query, tenantID).Scan(
		&stats.TotalFiles, &stats.TotalSize,
		&stats.ImageCount, &stats.VideoCount, &stats.AudioCount, &stats.DocumentCount, &stats.OtherCount,
		&stats.ImageSize, &stats.VideoSize, &stats.AudioSize, &stats.DocumentSize, &stats.OtherSize,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get storage stats: %w", err)
	}

	return stats, nil
}

// CountByType cuenta archivos por tipo
func (r *PostgreSQLMediaRepository) CountByType(tenantID uuid.UUID, mediaType domain.MediaType) (int64, error) {
	query := `SELECT COUNT(*) FROM media WHERE tenant_id = $1 AND media_type = $2 AND deleted_at IS NULL`

	var count int64
	err := r.db.QueryRow(query, tenantID, mediaType).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count by type: %w", err)
	}

	return count, nil
}

// GetTotalSize obtiene el tamaño total de almacenamiento
func (r *PostgreSQLMediaRepository) GetTotalSize(tenantID uuid.UUID) (int64, error) {
	query := `SELECT COALESCE(SUM(file_size), 0) FROM media WHERE tenant_id = $1 AND deleted_at IS NULL`

	var totalSize int64
	err := r.db.QueryRow(query, tenantID).Scan(&totalSize)
	if err != nil {
		return 0, fmt.Errorf("failed to get total size: %w", err)
	}

	return totalSize, nil
}

// ============================================================
// Folder Operations (stubs - to be implemented)
// ============================================================

func (r *PostgreSQLMediaRepository) CreateFolder(folder *domain.MediaFolder) error {
	// TODO: Implement when folders are needed
	return nil
}

func (r *PostgreSQLMediaRepository) GetFolderByID(tenantID, folderID uuid.UUID) (*domain.MediaFolder, error) {
	return nil, domain.ErrFolderNotFound
}

func (r *PostgreSQLMediaRepository) GetFoldersByParent(tenantID uuid.UUID, parentID *uuid.UUID) ([]domain.MediaFolder, error) {
	return []domain.MediaFolder{}, nil
}

func (r *PostgreSQLMediaRepository) GetFolderByPath(tenantID uuid.UUID, path string) (*domain.MediaFolder, error) {
	return nil, domain.ErrFolderNotFound
}

func (r *PostgreSQLMediaRepository) UpdateFolder(folder *domain.MediaFolder) error {
	return domain.ErrFolderNotFound
}

func (r *PostgreSQLMediaRepository) DeleteFolder(tenantID, folderID uuid.UUID) error {
	return domain.ErrFolderNotFound
}

func (r *PostgreSQLMediaRepository) CountMediaInFolder(tenantID, folderID uuid.UUID) (int, error) {
	return 0, nil
}

// ============================================================
// Tag Operations (stubs - to be implemented)
// ============================================================

func (r *PostgreSQLMediaRepository) CreateTag(tag *domain.MediaTag) error {
	// TODO: Implement when tags are needed
	return nil
}

func (r *PostgreSQLMediaRepository) GetTagByID(tenantID, tagID uuid.UUID) (*domain.MediaTag, error) {
	return nil, domain.ErrTagNotFound
}

func (r *PostgreSQLMediaRepository) GetTagByName(tenantID uuid.UUID, name string) (*domain.MediaTag, error) {
	return nil, domain.ErrTagNotFound
}

func (r *PostgreSQLMediaRepository) GetAllTags(tenantID uuid.UUID) ([]domain.MediaTag, error) {
	return []domain.MediaTag{}, nil
}

func (r *PostgreSQLMediaRepository) DeleteTag(tenantID, tagID uuid.UUID) error {
	return domain.ErrTagNotFound
}

func (r *PostgreSQLMediaRepository) AddTagToMedia(tenantID, mediaID, tagID uuid.UUID) error {
	return nil
}

func (r *PostgreSQLMediaRepository) RemoveTagFromMedia(tenantID, mediaID, tagID uuid.UUID) error {
	return nil
}

func (r *PostgreSQLMediaRepository) GetMediaTags(tenantID, mediaID uuid.UUID) ([]domain.MediaTag, error) {
	return []domain.MediaTag{}, nil
}

func (r *PostgreSQLMediaRepository) GetMediaByTag(tenantID, tagID uuid.UUID) ([]domain.Media, error) {
	return []domain.Media{}, nil
}
