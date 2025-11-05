package domain

import (
	"strings"

	"github.com/google/uuid"
)

// UploadMediaRequest representa una solicitud de carga de archivo
type UploadMediaRequest struct {
	TenantID     uuid.UUID       `json:"tenant_id"`
	UserID       uuid.UUID       `json:"user_id"`
	FileName     string          `json:"file_name"`
	OriginalName string          `json:"original_name"`
	MimeType     string          `json:"mime_type"`
	FileSize     int64           `json:"file_size"`
	Visibility   MediaVisibility `json:"visibility"`
	Context      MediaContext    `json:"context"`
	ContextID    *uuid.UUID      `json:"context_id,omitempty"`
	FolderID     *uuid.UUID      `json:"folder_id,omitempty"`
	Tags         []string        `json:"tags,omitempty"`
}

// Validate valida la solicitud de carga
func (r *UploadMediaRequest) Validate() error {
	if r.TenantID == uuid.Nil {
		return ErrMissingRequiredField
	}
	if r.UserID == uuid.Nil {
		return ErrMissingRequiredField
	}
	if strings.TrimSpace(r.FileName) == "" {
		return ErrInvalidFileName
	}
	if strings.TrimSpace(r.OriginalName) == "" {
		return ErrInvalidFileName
	}
	if r.FileSize <= 0 {
		return ErrInvalidFileSize
	}
	if strings.TrimSpace(r.MimeType) == "" {
		return ErrInvalidMimeType
	}

	// Validate max file size based on media type
	mediaType := GetMediaTypeFromMime(r.MimeType)
	maxSize := GetMaxFileSize(mediaType)
	if r.FileSize > maxSize {
		return ErrFileTooLarge
	}

	// Validate visibility
	if r.Visibility != MediaVisibilityPublic && r.Visibility != MediaVisibilityPrivate {
		return ErrInvalidVisibility
	}

	// Validate context
	validContexts := []MediaContext{
		MediaContextCourse,
		MediaContextLesson,
		MediaContextAssignment,
		MediaContextProfile,
		MediaContextCertificate,
		MediaContextOther,
	}
	isValidContext := false
	for _, ctx := range validContexts {
		if r.Context == ctx {
			isValidContext = true
			break
		}
	}
	if !isValidContext {
		return ErrInvalidContext
	}

	return nil
}

// GetMaxFileSize retorna el tamaño máximo permitido para un tipo de archivo
func GetMaxFileSize(mediaType MediaType) int64 {
	switch mediaType {
	case MediaTypeImage:
		return MaxImageSize
	case MediaTypeVideo:
		return MaxVideoSize
	case MediaTypeAudio:
		return MaxAudioSize
	case MediaTypeDocument:
		return MaxDocumentSize
	case MediaTypeArchive:
		return MaxArchiveSize
	default:
		return MaxDefaultSize
	}
}

// UpdateMediaRequest representa una solicitud de actualización de metadatos
type UpdateMediaRequest struct {
	FileName   *string          `json:"file_name,omitempty"`
	Visibility *MediaVisibility `json:"visibility,omitempty"`
	Context    *MediaContext    `json:"context,omitempty"`
	ContextID  *uuid.UUID       `json:"context_id,omitempty"`
	Metadata   map[string]any   `json:"metadata,omitempty"`
}

// Validate valida la solicitud de actualización
func (r *UpdateMediaRequest) Validate() error {
	if r.FileName != nil && strings.TrimSpace(*r.FileName) == "" {
		return ErrInvalidFileName
	}
	if r.Visibility != nil && *r.Visibility != MediaVisibilityPublic && *r.Visibility != MediaVisibilityPrivate {
		return ErrInvalidVisibility
	}
	return nil
}

// MediaFilters representa filtros para búsqueda de archivos
type MediaFilters struct {
	TenantID   uuid.UUID        `json:"tenant_id"`
	UserID     *uuid.UUID       `json:"user_id,omitempty"`
	MediaType  *MediaType       `json:"media_type,omitempty"`
	Status     *MediaStatus     `json:"status,omitempty"`
	Visibility *MediaVisibility `json:"visibility,omitempty"`
	Context    *MediaContext    `json:"context,omitempty"`
	ContextID  *uuid.UUID       `json:"context_id,omitempty"`
	FolderID   *uuid.UUID       `json:"folder_id,omitempty"`
	TagIDs     []uuid.UUID      `json:"tag_ids,omitempty"`
	Search     *string          `json:"search,omitempty"` // Search in file_name, original_name
	Limit      int              `json:"limit"`
	Offset     int              `json:"offset"`
	SortBy     string           `json:"sort_by"`  // created_at, file_size, file_name
	SortOrder  string           `json:"sort_order"` // asc, desc
}

// MediaResponse representa la respuesta de un archivo
type MediaResponse struct {
	ID           uuid.UUID       `json:"id"`
	TenantID     uuid.UUID       `json:"tenant_id"`
	UserID       uuid.UUID       `json:"user_id"`
	FileName     string          `json:"file_name"`
	OriginalName string          `json:"original_name"`
	MimeType     string          `json:"mime_type"`
	FileSize     int64           `json:"file_size"`
	MediaType    MediaType       `json:"media_type"`
	Status       MediaStatus     `json:"status"`
	Visibility   MediaVisibility `json:"visibility"`
	Context      MediaContext    `json:"context"`
	ContextID    *uuid.UUID      `json:"context_id,omitempty"`
	URL          string          `json:"url"`
	ThumbnailURL *string         `json:"thumbnail_url,omitempty"`
	Duration     *int            `json:"duration,omitempty"`
	Width        *int            `json:"width,omitempty"`
	Height       *int            `json:"height,omitempty"`
	Metadata     map[string]any  `json:"metadata,omitempty"`
	Tags         []TagResponse   `json:"tags,omitempty"`
	CreatedAt    string          `json:"created_at"`
	UpdatedAt    string          `json:"updated_at"`
}

// MediaListResponse representa una lista paginada de archivos
type MediaListResponse struct {
	Media      []MediaResponse `json:"media"`
	Total      int64           `json:"total"`
	Limit      int             `json:"limit"`
	Offset     int             `json:"offset"`
	HasMore    bool            `json:"has_more"`
}

// CreateFolderRequest representa una solicitud de creación de carpeta
type CreateFolderRequest struct {
	TenantID    uuid.UUID `json:"tenant_id"`
	ParentID    *uuid.UUID `json:"parent_id,omitempty"`
	Name        string    `json:"name"`
	Description *string   `json:"description,omitempty"`
}

// Validate valida la solicitud de creación de carpeta
func (r *CreateFolderRequest) Validate() error {
	if r.TenantID == uuid.Nil {
		return ErrMissingRequiredField
	}
	if strings.TrimSpace(r.Name) == "" {
		return ErrInvalidFolderName
	}
	if len(r.Name) > 100 {
		return ErrInvalidFolderName
	}
	return nil
}

// UpdateFolderRequest representa una solicitud de actualización de carpeta
type UpdateFolderRequest struct {
	Name        *string `json:"name,omitempty"`
	Description *string `json:"description,omitempty"`
}

// Validate valida la solicitud de actualización de carpeta
func (r *UpdateFolderRequest) Validate() error {
	if r.Name != nil && strings.TrimSpace(*r.Name) == "" {
		return ErrInvalidFolderName
	}
	if r.Name != nil && len(*r.Name) > 100 {
		return ErrInvalidFolderName
	}
	return nil
}

// FolderResponse representa la respuesta de una carpeta
type FolderResponse struct {
	ID          uuid.UUID  `json:"id"`
	TenantID    uuid.UUID  `json:"tenant_id"`
	ParentID    *uuid.UUID `json:"parent_id,omitempty"`
	Name        string     `json:"name"`
	Description *string    `json:"description,omitempty"`
	Path        string     `json:"path"`
	MediaCount  int        `json:"media_count"`
	CreatedBy   uuid.UUID  `json:"created_by"`
	CreatedAt   string     `json:"created_at"`
	UpdatedAt   string     `json:"updated_at"`
}

// CreateTagRequest representa una solicitud de creación de etiqueta
type CreateTagRequest struct {
	TenantID uuid.UUID `json:"tenant_id"`
	Name     string    `json:"name"`
	Color    *string   `json:"color,omitempty"`
}

// Validate valida la solicitud de creación de etiqueta
func (r *CreateTagRequest) Validate() error {
	if r.TenantID == uuid.Nil {
		return ErrMissingRequiredField
	}
	if strings.TrimSpace(r.Name) == "" {
		return ErrInvalidTagName
	}
	if len(r.Name) > 50 {
		return ErrInvalidTagName
	}
	return nil
}

// TagResponse representa la respuesta de una etiqueta
type TagResponse struct {
	ID        uuid.UUID `json:"id"`
	TenantID  uuid.UUID `json:"tenant_id"`
	Name      string    `json:"name"`
	Color     *string   `json:"color,omitempty"`
	CreatedAt string    `json:"created_at"`
}

// StorageStats representa estadísticas de almacenamiento
type StorageStats struct {
	TenantID         uuid.UUID `json:"tenant_id"`
	TotalFiles       int64     `json:"total_files"`
	TotalSize        int64     `json:"total_size"`
	ImageCount       int64     `json:"image_count"`
	VideoCount       int64     `json:"video_count"`
	AudioCount       int64     `json:"audio_count"`
	DocumentCount    int64     `json:"document_count"`
	OtherCount       int64     `json:"other_count"`
	ImageSize        int64     `json:"image_size"`
	VideoSize        int64     `json:"video_size"`
	AudioSize        int64     `json:"audio_size"`
	DocumentSize     int64     `json:"document_size"`
	OtherSize        int64     `json:"other_size"`
}
