package ports

import (
	"io"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/media/domain"
	"github.com/google/uuid"
)

// MediaRepository define las operaciones de persistencia para Media
type MediaRepository interface {
	// CRUD operations
	Create(media *domain.Media) error
	GetByID(tenantID, mediaID uuid.UUID) (*domain.Media, error)
	GetByUserID(tenantID, userID uuid.UUID, limit, offset int) ([]domain.Media, int64, error)
	Update(media *domain.Media) error
	Delete(tenantID, mediaID uuid.UUID) error
	SoftDelete(tenantID, mediaID uuid.UUID) error

	// Queries with filters
	List(filters domain.MediaFilters) ([]domain.Media, int64, error)
	GetByContext(tenantID uuid.UUID, context domain.MediaContext, contextID uuid.UUID) ([]domain.Media, error)
	GetByFolder(tenantID, folderID uuid.UUID, limit, offset int) ([]domain.Media, int64, error)
	Search(tenantID uuid.UUID, query string, limit, offset int) ([]domain.Media, int64, error)

	// Status management
	UpdateStatus(tenantID, mediaID uuid.UUID, status domain.MediaStatus) error
	GetByStatus(tenantID uuid.UUID, status domain.MediaStatus) ([]domain.Media, error)

	// Statistics
	GetStorageStats(tenantID uuid.UUID) (*domain.StorageStats, error)
	CountByType(tenantID uuid.UUID, mediaType domain.MediaType) (int64, error)
	GetTotalSize(tenantID uuid.UUID) (int64, error)

	// Folder operations
	CreateFolder(folder *domain.MediaFolder) error
	GetFolderByID(tenantID, folderID uuid.UUID) (*domain.MediaFolder, error)
	GetFoldersByParent(tenantID uuid.UUID, parentID *uuid.UUID) ([]domain.MediaFolder, error)
	GetFolderByPath(tenantID uuid.UUID, path string) (*domain.MediaFolder, error)
	UpdateFolder(folder *domain.MediaFolder) error
	DeleteFolder(tenantID, folderID uuid.UUID) error
	CountMediaInFolder(tenantID, folderID uuid.UUID) (int, error)

	// Tag operations
	CreateTag(tag *domain.MediaTag) error
	GetTagByID(tenantID, tagID uuid.UUID) (*domain.MediaTag, error)
	GetTagByName(tenantID uuid.UUID, name string) (*domain.MediaTag, error)
	GetAllTags(tenantID uuid.UUID) ([]domain.MediaTag, error)
	DeleteTag(tenantID, tagID uuid.UUID) error

	// Tag associations
	AddTagToMedia(tenantID, mediaID, tagID uuid.UUID) error
	RemoveTagFromMedia(tenantID, mediaID, tagID uuid.UUID) error
	GetMediaTags(tenantID, mediaID uuid.UUID) ([]domain.MediaTag, error)
	GetMediaByTag(tenantID, tagID uuid.UUID) ([]domain.Media, error)
}

// StorageService define las operaciones de almacenamiento en S3/MinIO
type StorageService interface {
	// Upload operations
	Upload(tenantID uuid.UUID, fileName string, fileReader io.Reader, contentType string, fileSize int64) (string, error)
	UploadWithProgress(tenantID uuid.UUID, fileName string, fileReader io.Reader, contentType string, fileSize int64, progressCallback func(bytesUploaded int64)) (string, error)

	// Download operations
	Download(tenantID uuid.UUID, fileName string) (io.ReadCloser, error)
	GetPresignedURL(tenantID uuid.UUID, fileName string, expirySeconds int) (string, error)
	GetPublicURL(tenantID uuid.UUID, fileName string) string

	// Delete operations
	Delete(tenantID uuid.UUID, fileName string) error
	DeleteMultiple(tenantID uuid.UUID, fileNames []string) error

	// File operations
	FileExists(tenantID uuid.UUID, fileName string) (bool, error)
	GetFileSize(tenantID uuid.UUID, fileName string) (int64, error)
	GetFileMetadata(tenantID uuid.UUID, fileName string) (map[string]string, error)

	// Bucket operations
	CreateBucket(tenantID uuid.UUID) error
	BucketExists(tenantID uuid.UUID) (bool, error)

	// Utilities
	GenerateFileName(originalName string) string
	ValidateMimeType(mimeType string) bool
}

// MediaService define la lógica de negocio para Media
type MediaService interface {
	// Upload operations
	UploadMedia(req domain.UploadMediaRequest, fileReader io.Reader) (*domain.MediaResponse, error)
	UploadMultiple(requests []domain.UploadMediaRequest, fileReaders []io.Reader) ([]domain.MediaResponse, error)

	// CRUD operations
	GetMedia(tenantID, userID, mediaID uuid.UUID) (*domain.MediaResponse, error)
	GetUserMedia(tenantID, userID uuid.UUID, limit, offset int) (*domain.MediaListResponse, error)
	UpdateMedia(tenantID, userID, mediaID uuid.UUID, req domain.UpdateMediaRequest) (*domain.MediaResponse, error)
	DeleteMedia(tenantID, userID, mediaID uuid.UUID) error

	// Query operations
	ListMedia(filters domain.MediaFilters) (*domain.MediaListResponse, error)
	SearchMedia(tenantID, userID uuid.UUID, query string, limit, offset int) (*domain.MediaListResponse, error)
	GetMediaByContext(tenantID, userID uuid.UUID, context domain.MediaContext, contextID uuid.UUID) ([]domain.MediaResponse, error)

	// Download operations
	GetMediaDownloadURL(tenantID, userID, mediaID uuid.UUID, expirySeconds int) (string, error)
	DownloadMedia(tenantID, userID, mediaID uuid.UUID) (io.ReadCloser, *domain.Media, error)

	// Processing operations
	ProcessMedia(tenantID, mediaID uuid.UUID) error
	GenerateThumbnail(tenantID, mediaID uuid.UUID) error
	ExtractMetadata(tenantID, mediaID uuid.UUID) error

	// Statistics
	GetStorageStats(tenantID uuid.UUID) (*domain.StorageStats, error)

	// Folder operations
	CreateFolder(req domain.CreateFolderRequest, createdBy uuid.UUID) (*domain.FolderResponse, error)
	GetFolder(tenantID, folderID uuid.UUID) (*domain.FolderResponse, error)
	GetFolderContents(tenantID, folderID uuid.UUID) (*domain.FolderResponse, error)
	GetRootFolders(tenantID uuid.UUID) ([]domain.FolderResponse, error)
	UpdateFolder(tenantID, folderID uuid.UUID, req domain.UpdateFolderRequest) (*domain.FolderResponse, error)
	DeleteFolder(tenantID, folderID uuid.UUID, force bool) error

	// Tag operations
	CreateTag(req domain.CreateTagRequest) (*domain.TagResponse, error)
	GetTag(tenantID, tagID uuid.UUID) (*domain.TagResponse, error)
	GetAllTags(tenantID uuid.UUID) ([]domain.TagResponse, error)
	DeleteTag(tenantID, tagID uuid.UUID) error
	AddTagToMedia(tenantID, mediaID, tagID uuid.UUID) error
	RemoveTagFromMedia(tenantID, mediaID, tagID uuid.UUID) error
}

// ImageProcessor define operaciones de procesamiento de imágenes
type ImageProcessor interface {
	// Resize operations
	Resize(reader io.Reader, width, height int) (io.Reader, error)
	ResizeToFit(reader io.Reader, maxWidth, maxHeight int) (io.Reader, error)

	// Thumbnail generation
	GenerateThumbnail(reader io.Reader, size int) (io.Reader, error)

	// Format conversion
	ConvertToFormat(reader io.Reader, format string) (io.Reader, error)

	// Optimization
	Optimize(reader io.Reader, quality int) (io.Reader, error)

	// Metadata extraction
	ExtractImageMetadata(reader io.Reader) (width, height int, err error)
}

// VideoProcessor define operaciones de procesamiento de videos
type VideoProcessor interface {
	// Thumbnail generation
	GenerateVideoThumbnail(videoPath string, timestamp int) (io.Reader, error)

	// Format conversion
	ConvertVideo(videoPath, outputFormat string) (string, error)

	// Compression
	CompressVideo(videoPath string, quality int) (string, error)

	// Metadata extraction
	ExtractVideoMetadata(videoPath string) (duration, width, height int, err error)

	// HLS streaming
	GenerateHLSPlaylist(videoPath string) (string, error)
}
