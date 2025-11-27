package domain

import "errors"

var (
	// Media errors
	ErrMediaNotFound         = errors.New("media not found")
	ErrUnauthorizedAccess    = errors.New("unauthorized access to media")
	ErrInvalidFileName       = errors.New("invalid file name")
	ErrInvalidFileSize       = errors.New("invalid file size")
	ErrFileTooLarge          = errors.New("file size exceeds maximum allowed")
	ErrInvalidMimeType       = errors.New("invalid or unsupported mime type")
	ErrInvalidMediaType      = errors.New("invalid media type")
	ErrInvalidStatus         = errors.New("invalid media status")
	ErrInvalidVisibility     = errors.New("invalid media visibility")
	ErrInvalidContext        = errors.New("invalid media context")
	ErrUploadFailed          = errors.New("file upload failed")
	ErrProcessingFailed      = errors.New("media processing failed")
	ErrDeleteFailed          = errors.New("media deletion failed")
	ErrStorageNotConfigured  = errors.New("storage service not configured")
	ErrInsufficientStorage   = errors.New("insufficient storage space")

	// Folder errors
	ErrFolderNotFound        = errors.New("folder not found")
	ErrFolderAlreadyExists   = errors.New("folder already exists")
	ErrInvalidFolderName     = errors.New("invalid folder name")
	ErrCannotDeleteFolder    = errors.New("cannot delete folder with contents")
	ErrCircularReference     = errors.New("circular folder reference detected")

	// Tag errors
	ErrTagNotFound           = errors.New("tag not found")
	ErrTagAlreadyExists      = errors.New("tag already exists")
	ErrInvalidTagName        = errors.New("invalid tag name")

	// Validation errors
	ErrMissingRequiredField  = errors.New("missing required field")
	ErrInvalidFileExtension  = errors.New("invalid or unsupported file extension")
)

// Allowed file extensions by type
var (
	AllowedImageExtensions    = []string{".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"}
	AllowedVideoExtensions    = []string{".mp4", ".webm", ".mov", ".avi", ".mkv", ".flv", ".wmv"}
	AllowedAudioExtensions    = []string{".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac"}
	AllowedDocumentExtensions = []string{".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv"}
	AllowedArchiveExtensions  = []string{".zip", ".rar", ".7z", ".tar", ".gz"}
)

// Max file sizes (in bytes)
const (
	MaxImageSize    = 10 * 1024 * 1024   // 10 MB
	MaxVideoSize    = 500 * 1024 * 1024  // 500 MB
	MaxAudioSize    = 50 * 1024 * 1024   // 50 MB
	MaxDocumentSize = 25 * 1024 * 1024   // 25 MB
	MaxArchiveSize  = 100 * 1024 * 1024  // 100 MB
	MaxDefaultSize  = 10 * 1024 * 1024   // 10 MB (for other types)
)
