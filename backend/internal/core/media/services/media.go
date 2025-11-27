package services

import (
	"fmt"
	"io"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/media/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/media/ports"
	"github.com/google/uuid"
)

// MediaService implementa la lógica de negocio para Media
type MediaService struct {
	repo    ports.MediaRepository
	storage ports.StorageService
}

// NewMediaService crea una nueva instancia del servicio
func NewMediaService(repo ports.MediaRepository, storage ports.StorageService) ports.MediaService {
	return &MediaService{
		repo:    repo,
		storage: storage,
	}
}

// UploadMedia sube un archivo al almacenamiento
func (s *MediaService) UploadMedia(req domain.UploadMediaRequest, fileReader io.Reader) (*domain.MediaResponse, error) {
	// Validar request
	if err := req.Validate(); err != nil {
		return nil, err
	}

	// Validar MIME type
	if !s.storage.ValidateMimeType(req.MimeType) {
		return nil, domain.ErrInvalidMimeType
	}

	// Generar nombre único de archivo
	fileName := s.storage.GenerateFileName(req.OriginalName)

	// Subir archivo al almacenamiento
	url, err := s.storage.Upload(req.TenantID, fileName, fileReader, req.MimeType, req.FileSize)
	if err != nil {
		return nil, fmt.Errorf("failed to upload file: %w", err)
	}

	// Crear registro en base de datos
	media := &domain.Media{
		ID:           uuid.New(),
		TenantID:     req.TenantID,
		UserID:       req.UserID,
		FileName:     fileName,
		OriginalName: req.OriginalName,
		MimeType:     req.MimeType,
		FileSize:     req.FileSize,
		MediaType:    domain.GetMediaTypeFromMime(req.MimeType),
		Status:       domain.MediaStatusReady,
		Visibility:   req.Visibility,
		Context:      req.Context,
		ContextID:    req.ContextID,
		StoragePath:  fileName,
		URL:          url,
		Metadata:     make(map[string]any),
	}

	if err := s.repo.Create(media); err != nil {
		// Si falla la creación del registro, intentar eliminar el archivo
		_ = s.storage.Delete(req.TenantID, fileName)
		return nil, fmt.Errorf("failed to create media record: %w", err)
	}

	return s.toResponse(media), nil
}

// UploadMultiple sube múltiples archivos
func (s *MediaService) UploadMultiple(requests []domain.UploadMediaRequest, fileReaders []io.Reader) ([]domain.MediaResponse, error) {
	if len(requests) != len(fileReaders) {
		return nil, fmt.Errorf("mismatch between requests and file readers")
	}

	var responses []domain.MediaResponse
	for i, req := range requests {
		response, err := s.UploadMedia(req, fileReaders[i])
		if err != nil {
			// Por ahora, si falla uno, continuamos con los demás
			continue
		}
		responses = append(responses, *response)
	}

	return responses, nil
}

// GetMedia obtiene un archivo por ID
func (s *MediaService) GetMedia(tenantID, userID, mediaID uuid.UUID) (*domain.MediaResponse, error) {
	media, err := s.repo.GetByID(tenantID, mediaID)
	if err != nil {
		return nil, err
	}

	// Verificar permisos: el usuario debe ser el propietario o el archivo debe ser público
	if media.UserID != userID && media.Visibility != domain.MediaVisibilityPublic {
		return nil, domain.ErrUnauthorizedAccess
	}

	return s.toResponse(media), nil
}

// GetUserMedia obtiene todos los archivos de un usuario
func (s *MediaService) GetUserMedia(tenantID, userID uuid.UUID, limit, offset int) (*domain.MediaListResponse, error) {
	mediaList, total, err := s.repo.GetByUserID(tenantID, userID, limit, offset)
	if err != nil {
		return nil, err
	}

	responses := make([]domain.MediaResponse, len(mediaList))
	for i, media := range mediaList {
		responses[i] = *s.toResponse(&media)
	}

	return &domain.MediaListResponse{
		Media:   responses,
		Total:   total,
		Limit:   limit,
		Offset:  offset,
		HasMore: int64(offset+limit) < total,
	}, nil
}

// UpdateMedia actualiza metadatos de un archivo
func (s *MediaService) UpdateMedia(tenantID, userID, mediaID uuid.UUID, req domain.UpdateMediaRequest) (*domain.MediaResponse, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	media, err := s.repo.GetByID(tenantID, mediaID)
	if err != nil {
		return nil, err
	}

	// Verificar permisos
	if media.UserID != userID {
		return nil, domain.ErrUnauthorizedAccess
	}

	// Actualizar campos
	if req.FileName != nil {
		media.FileName = *req.FileName
	}
	if req.Visibility != nil {
		media.Visibility = *req.Visibility
	}
	if req.Context != nil {
		media.Context = *req.Context
	}
	if req.ContextID != nil {
		media.ContextID = req.ContextID
	}
	if req.Metadata != nil {
		media.Metadata = req.Metadata
	}

	if err := s.repo.Update(media); err != nil {
		return nil, err
	}

	return s.toResponse(media), nil
}

// DeleteMedia elimina un archivo
func (s *MediaService) DeleteMedia(tenantID, userID, mediaID uuid.UUID) error {
	media, err := s.repo.GetByID(tenantID, mediaID)
	if err != nil {
		return err
	}

	// Verificar permisos
	if media.UserID != userID {
		return domain.ErrUnauthorizedAccess
	}

	// Eliminar del almacenamiento
	if err := s.storage.Delete(tenantID, media.FileName); err != nil {
		return fmt.Errorf("failed to delete file from storage: %w", err)
	}

	// Soft delete en base de datos
	if err := s.repo.SoftDelete(tenantID, mediaID); err != nil {
		return err
	}

	return nil
}

// ListMedia lista archivos con filtros
func (s *MediaService) ListMedia(filters domain.MediaFilters) (*domain.MediaListResponse, error) {
	mediaList, total, err := s.repo.List(filters)
	if err != nil {
		return nil, err
	}

	responses := make([]domain.MediaResponse, len(mediaList))
	for i, media := range mediaList {
		responses[i] = *s.toResponse(&media)
	}

	return &domain.MediaListResponse{
		Media:   responses,
		Total:   total,
		Limit:   filters.Limit,
		Offset:  filters.Offset,
		HasMore: int64(filters.Offset+filters.Limit) < total,
	}, nil
}

// SearchMedia busca archivos por término
func (s *MediaService) SearchMedia(tenantID, userID uuid.UUID, query string, limit, offset int) (*domain.MediaListResponse, error) {
	mediaList, total, err := s.repo.Search(tenantID, query, limit, offset)
	if err != nil {
		return nil, err
	}

	responses := make([]domain.MediaResponse, len(mediaList))
	for i, media := range mediaList {
		// Filtrar archivos privados que no pertenecen al usuario
		if media.UserID == userID || media.Visibility == domain.MediaVisibilityPublic {
			responses[i] = *s.toResponse(&media)
		}
	}

	return &domain.MediaListResponse{
		Media:   responses,
		Total:   total,
		Limit:   limit,
		Offset:  offset,
		HasMore: int64(offset+limit) < total,
	}, nil
}

// GetMediaByContext obtiene archivos por contexto
func (s *MediaService) GetMediaByContext(tenantID, userID uuid.UUID, context domain.MediaContext, contextID uuid.UUID) ([]domain.MediaResponse, error) {
	mediaList, err := s.repo.GetByContext(tenantID, context, contextID)
	if err != nil {
		return nil, err
	}

	var responses []domain.MediaResponse
	for _, media := range mediaList {
		// Filtrar archivos privados que no pertenecen al usuario
		if media.UserID == userID || media.Visibility == domain.MediaVisibilityPublic {
			responses = append(responses, *s.toResponse(&media))
		}
	}

	return responses, nil
}

// GetMediaDownloadURL genera una URL de descarga
func (s *MediaService) GetMediaDownloadURL(tenantID, userID, mediaID uuid.UUID, expirySeconds int) (string, error) {
	media, err := s.repo.GetByID(tenantID, mediaID)
	if err != nil {
		return "", err
	}

	// Verificar permisos
	if media.UserID != userID && media.Visibility != domain.MediaVisibilityPublic {
		return "", domain.ErrUnauthorizedAccess
	}

	url, err := s.storage.GetPresignedURL(tenantID, media.FileName, expirySeconds)
	if err != nil {
		return "", err
	}

	return url, nil
}

// DownloadMedia descarga un archivo
func (s *MediaService) DownloadMedia(tenantID, userID, mediaID uuid.UUID) (io.ReadCloser, *domain.Media, error) {
	media, err := s.repo.GetByID(tenantID, mediaID)
	if err != nil {
		return nil, nil, err
	}

	// Verificar permisos
	if media.UserID != userID && media.Visibility != domain.MediaVisibilityPublic {
		return nil, nil, domain.ErrUnauthorizedAccess
	}

	reader, err := s.storage.Download(tenantID, media.FileName)
	if err != nil {
		return nil, nil, err
	}

	return reader, media, nil
}

// ProcessMedia procesa un archivo (placeholder para futuras implementaciones)
func (s *MediaService) ProcessMedia(tenantID, mediaID uuid.UUID) error {
	// TODO: Implementar procesamiento de archivos (thumbnails, conversiones, etc.)
	return nil
}

// GenerateThumbnail genera thumbnail para imágenes/videos
func (s *MediaService) GenerateThumbnail(tenantID, mediaID uuid.UUID) error {
	// TODO: Implementar generación de thumbnails
	return nil
}

// ExtractMetadata extrae metadatos de archivos multimedia
func (s *MediaService) ExtractMetadata(tenantID, mediaID uuid.UUID) error {
	// TODO: Implementar extracción de metadatos
	return nil
}

// GetStorageStats obtiene estadísticas de almacenamiento
func (s *MediaService) GetStorageStats(tenantID uuid.UUID) (*domain.StorageStats, error) {
	return s.repo.GetStorageStats(tenantID)
}

// ============================================================
// Folder Operations (stubs)
// ============================================================

func (s *MediaService) CreateFolder(req domain.CreateFolderRequest, createdBy uuid.UUID) (*domain.FolderResponse, error) {
	return nil, fmt.Errorf("folder operations not yet implemented")
}

func (s *MediaService) GetFolder(tenantID, folderID uuid.UUID) (*domain.FolderResponse, error) {
	return nil, fmt.Errorf("folder operations not yet implemented")
}

func (s *MediaService) GetFolderContents(tenantID, folderID uuid.UUID) (*domain.FolderResponse, error) {
	return nil, fmt.Errorf("folder operations not yet implemented")
}

func (s *MediaService) GetRootFolders(tenantID uuid.UUID) ([]domain.FolderResponse, error) {
	return nil, fmt.Errorf("folder operations not yet implemented")
}

func (s *MediaService) UpdateFolder(tenantID, folderID uuid.UUID, req domain.UpdateFolderRequest) (*domain.FolderResponse, error) {
	return nil, fmt.Errorf("folder operations not yet implemented")
}

func (s *MediaService) DeleteFolder(tenantID, folderID uuid.UUID, force bool) error {
	return fmt.Errorf("folder operations not yet implemented")
}

// ============================================================
// Tag Operations (stubs)
// ============================================================

func (s *MediaService) CreateTag(req domain.CreateTagRequest) (*domain.TagResponse, error) {
	return nil, fmt.Errorf("tag operations not yet implemented")
}

func (s *MediaService) GetTag(tenantID, tagID uuid.UUID) (*domain.TagResponse, error) {
	return nil, fmt.Errorf("tag operations not yet implemented")
}

func (s *MediaService) GetAllTags(tenantID uuid.UUID) ([]domain.TagResponse, error) {
	return nil, fmt.Errorf("tag operations not yet implemented")
}

func (s *MediaService) DeleteTag(tenantID, tagID uuid.UUID) error {
	return fmt.Errorf("tag operations not yet implemented")
}

func (s *MediaService) AddTagToMedia(tenantID, mediaID, tagID uuid.UUID) error {
	return fmt.Errorf("tag operations not yet implemented")
}

func (s *MediaService) RemoveTagFromMedia(tenantID, mediaID, tagID uuid.UUID) error {
	return fmt.Errorf("tag operations not yet implemented")
}

// ============================================================
// Helper Methods
// ============================================================

// toResponse convierte una entidad Media a MediaResponse
func (s *MediaService) toResponse(media *domain.Media) *domain.MediaResponse {
	return &domain.MediaResponse{
		ID:           media.ID,
		TenantID:     media.TenantID,
		UserID:       media.UserID,
		FileName:     media.FileName,
		OriginalName: media.OriginalName,
		MimeType:     media.MimeType,
		FileSize:     media.FileSize,
		MediaType:    media.MediaType,
		Status:       media.Status,
		Visibility:   media.Visibility,
		Context:      media.Context,
		ContextID:    media.ContextID,
		URL:          media.URL,
		ThumbnailURL: media.ThumbnailURL,
		Duration:     media.Duration,
		Width:        media.Width,
		Height:       media.Height,
		Metadata:     media.Metadata,
		Tags:         []domain.TagResponse{}, // Tags por implementar
		CreatedAt:    media.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:    media.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}
