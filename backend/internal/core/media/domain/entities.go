package domain

import (
	"time"

	"github.com/google/uuid"
)

// MediaType representa el tipo de archivo multimedia
type MediaType string

const (
	MediaTypeImage    MediaType = "image"
	MediaTypeVideo    MediaType = "video"
	MediaTypeAudio    MediaType = "audio"
	MediaTypeDocument MediaType = "document"
	MediaTypeArchive  MediaType = "archive"
	MediaTypeOther    MediaType = "other"
)

// MediaStatus representa el estado del archivo multimedia
type MediaStatus string

const (
	MediaStatusUploading  MediaStatus = "uploading"
	MediaStatusProcessing MediaStatus = "processing"
	MediaStatusReady      MediaStatus = "ready"
	MediaStatusFailed     MediaStatus = "failed"
	MediaStatusDeleted    MediaStatus = "deleted"
)

// MediaVisibility representa la visibilidad del archivo
type MediaVisibility string

const (
	MediaVisibilityPublic  MediaVisibility = "public"
	MediaVisibilityPrivate MediaVisibility = "private"
)

// MediaContext representa el contexto de uso del archivo
type MediaContext string

const (
	MediaContextCourse     MediaContext = "course"
	MediaContextLesson     MediaContext = "lesson"
	MediaContextAssignment MediaContext = "assignment"
	MediaContextProfile    MediaContext = "profile"
	MediaContextCertificate MediaContext = "certificate"
	MediaContextOther      MediaContext = "other"
)

// Media representa un archivo multimedia en el sistema
type Media struct {
	ID          uuid.UUID       `json:"id" db:"id"`
	TenantID    uuid.UUID       `json:"tenant_id" db:"tenant_id"`
	UserID      uuid.UUID       `json:"user_id" db:"user_id"`
	FileName    string          `json:"file_name" db:"file_name"`
	OriginalName string         `json:"original_name" db:"original_name"`
	MimeType    string          `json:"mime_type" db:"mime_type"`
	FileSize    int64           `json:"file_size" db:"file_size"`
	MediaType   MediaType       `json:"media_type" db:"media_type"`
	Status      MediaStatus     `json:"status" db:"status"`
	Visibility  MediaVisibility `json:"visibility" db:"visibility"`
	Context     MediaContext    `json:"context" db:"context"`
	ContextID   *uuid.UUID      `json:"context_id,omitempty" db:"context_id"`
	StoragePath string          `json:"storage_path" db:"storage_path"`
	URL         string          `json:"url" db:"url"`
	ThumbnailURL *string        `json:"thumbnail_url,omitempty" db:"thumbnail_url"`
	Duration    *int            `json:"duration,omitempty" db:"duration"` // For video/audio in seconds
	Width       *int            `json:"width,omitempty" db:"width"`       // For images/videos
	Height      *int            `json:"height,omitempty" db:"height"`     // For images/videos
	Metadata    map[string]any  `json:"metadata,omitempty" db:"metadata"`
	CreatedAt   time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at" db:"updated_at"`
	DeletedAt   *time.Time      `json:"deleted_at,omitempty" db:"deleted_at"`
}

// MediaFolder representa una carpeta para organizar archivos
type MediaFolder struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	TenantID    uuid.UUID  `json:"tenant_id" db:"tenant_id"`
	ParentID    *uuid.UUID `json:"parent_id,omitempty" db:"parent_id"`
	Name        string     `json:"name" db:"name"`
	Description *string    `json:"description,omitempty" db:"description"`
	Path        string     `json:"path" db:"path"` // Full path like /folder1/folder2
	CreatedBy   uuid.UUID  `json:"created_by" db:"created_by"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
}

// MediaTag representa una etiqueta para clasificar archivos
type MediaTag struct {
	ID        uuid.UUID `json:"id" db:"id"`
	TenantID  uuid.UUID `json:"tenant_id" db:"tenant_id"`
	Name      string    `json:"name" db:"name"`
	Color     *string   `json:"color,omitempty" db:"color"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// MediaTagAssociation representa la relación entre un archivo y una etiqueta
type MediaTagAssociation struct {
	MediaID uuid.UUID `json:"media_id" db:"media_id"`
	TagID   uuid.UUID `json:"tag_id" db:"tag_id"`
}

// GetMediaTypeFromMime determina el tipo de media basado en el MIME type
func GetMediaTypeFromMime(mimeType string) MediaType {
	switch {
	case len(mimeType) >= 6 && mimeType[:6] == "image/":
		return MediaTypeImage
	case len(mimeType) >= 6 && mimeType[:6] == "video/":
		return MediaTypeVideo
	case len(mimeType) >= 6 && mimeType[:6] == "audio/":
		return MediaTypeAudio
	case mimeType == "application/pdf" ||
		mimeType == "application/msword" ||
		mimeType == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
		mimeType == "application/vnd.ms-excel" ||
		mimeType == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
		mimeType == "application/vnd.ms-powerpoint" ||
		mimeType == "application/vnd.openxmlformats-officedocument.presentationml.presentation":
		return MediaTypeDocument
	case mimeType == "application/zip" ||
		mimeType == "application/x-rar-compressed" ||
		mimeType == "application/x-7z-compressed" ||
		mimeType == "application/x-tar" ||
		mimeType == "application/gzip":
		return MediaTypeArchive
	default:
		return MediaTypeOther
	}
}

// IsImageType verifica si el tipo de media es una imagen
func (m *Media) IsImageType() bool {
	return m.MediaType == MediaTypeImage
}

// IsVideoType verifica si el tipo de media es un video
func (m *Media) IsVideoType() bool {
	return m.MediaType == MediaTypeVideo
}

// IsAudioType verifica si el tipo de media es audio
func (m *Media) IsAudioType() bool {
	return m.MediaType == MediaTypeAudio
}

// IsDocumentType verifica si el tipo de media es un documento
func (m *Media) IsDocumentType() bool {
	return m.MediaType == MediaTypeDocument
}

// IsReady verifica si el archivo está listo para usar
func (m *Media) IsReady() bool {
	return m.Status == MediaStatusReady
}

// IsPublic verifica si el archivo es público
func (m *Media) IsPublic() bool {
	return m.Visibility == MediaVisibilityPublic
}
