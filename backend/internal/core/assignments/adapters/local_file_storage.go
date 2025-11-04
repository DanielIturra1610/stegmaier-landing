package adapters

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/assignments/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/assignments/ports"
	"github.com/google/uuid"
)

// LocalFileStorage implements the FileStorage interface for local filesystem storage
type LocalFileStorage struct {
	basePath string // Base directory for file storage (e.g., "./uploads/assignments")
	baseURL  string // Base URL for file access (e.g., "http://localhost:8080/uploads/assignments")
}

// NewLocalFileStorage creates a new local file storage service
func NewLocalFileStorage(basePath, baseURL string) (ports.FileStorage, error) {
	// Create base directory if it doesn't exist
	if err := os.MkdirAll(basePath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create base directory: %w", err)
	}

	// Create subdirectories for different file types
	subdirs := []string{"assignments", "submissions", "templates"}
	for _, subdir := range subdirs {
		dirPath := filepath.Join(basePath, subdir)
		if err := os.MkdirAll(dirPath, 0755); err != nil {
			return nil, fmt.Errorf("failed to create %s directory: %w", subdir, err)
		}
	}

	return &LocalFileStorage{
		basePath: basePath,
		baseURL:  strings.TrimSuffix(baseURL, "/"),
	}, nil
}

// Store stores a file and returns its URL
func (s *LocalFileStorage) Store(ctx context.Context, fileID uuid.UUID, data []byte, mimeType string) (string, error) {
	if len(data) == 0 {
		return "", ports.ErrFileUploadFailed
	}

	// Generate unique filename
	ext := getExtensionFromMimeType(mimeType)
	filename := fmt.Sprintf("%s%s", fileID.String(), ext)

	// Determine subdirectory based on file type
	subdir := "submissions" // Default to submissions

	// Determine file path
	filePath := filepath.Join(s.basePath, subdir, filename)

	// Write file to disk
	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return "", fmt.Errorf("%w: %v", ports.ErrFileUploadFailed, err)
	}

	// Generate public URL
	fileURL := fmt.Sprintf("%s/%s/%s", s.baseURL, subdir, filename)

	return fileURL, nil
}

// Retrieve retrieves a file by its ID
func (s *LocalFileStorage) Retrieve(ctx context.Context, fileID uuid.UUID) ([]byte, error) {
	// Try different subdirectories
	subdirs := []string{"assignments", "submissions", "templates"}

	for _, subdir := range subdirs {
		// Try different extensions
		exts := []string{".pdf", ".doc", ".docx", ".txt", ".jpg", ".png", ".zip", ".mp4", ".pptx", ".xlsx"}
		for _, ext := range exts {
			filename := fmt.Sprintf("%s%s", fileID.String(), ext)
			filePath := filepath.Join(s.basePath, subdir, filename)

			if data, err := os.ReadFile(filePath); err == nil {
				return data, nil
			}
		}
	}

	return nil, ports.ErrFileNotFound
}

// Delete deletes a file
func (s *LocalFileStorage) Delete(ctx context.Context, fileID uuid.UUID) error {
	// Try different subdirectories
	subdirs := []string{"assignments", "submissions", "templates"}
	deleted := false

	for _, subdir := range subdirs {
		// Try different extensions
		exts := []string{".pdf", ".doc", ".docx", ".txt", ".jpg", ".png", ".zip", ".mp4", ".pptx", ".xlsx"}
		for _, ext := range exts {
			filename := fmt.Sprintf("%s%s", fileID.String(), ext)
			filePath := filepath.Join(s.basePath, subdir, filename)

			if err := os.Remove(filePath); err == nil {
				deleted = true
				break
			}
		}
		if deleted {
			break
		}
	}

	if !deleted {
		return ports.ErrFileNotFound
	}

	return nil
}

// Exists checks if a file exists
func (s *LocalFileStorage) Exists(ctx context.Context, fileID uuid.UUID) (bool, error) {
	// Try different subdirectories
	subdirs := []string{"assignments", "submissions", "templates"}

	for _, subdir := range subdirs {
		// Try different extensions
		exts := []string{".pdf", ".doc", ".docx", ".txt", ".jpg", ".png", ".zip", ".mp4", ".pptx", ".xlsx"}
		for _, ext := range exts {
			filename := fmt.Sprintf("%s%s", fileID.String(), ext)
			filePath := filepath.Join(s.basePath, subdir, filename)

			if _, err := os.Stat(filePath); err == nil {
				return true, nil
			}
		}
	}

	return false, nil
}

// GetURL gets the public URL of a file
func (s *LocalFileStorage) GetURL(ctx context.Context, fileID uuid.UUID) (string, error) {
	// Try different subdirectories
	subdirs := []string{"assignments", "submissions", "templates"}

	for _, subdir := range subdirs {
		// Try different extensions
		exts := []string{".pdf", ".doc", ".docx", ".txt", ".jpg", ".png", ".zip", ".mp4", ".pptx", ".xlsx"}
		for _, ext := range exts {
			filename := fmt.Sprintf("%s%s", fileID.String(), ext)
			filePath := filepath.Join(s.basePath, subdir, filename)

			if _, err := os.Stat(filePath); err == nil {
				return fmt.Sprintf("%s/%s/%s", s.baseURL, subdir, filename), nil
			}
		}
	}

	return "", ports.ErrFileNotFound
}

// ValidateFile validates a file before uploading
func (s *LocalFileStorage) ValidateFile(filename string, fileSize int64, mimeType string, assignment *domain.Assignment) error {
	// Validate file size
	if fileSize > assignment.MaxFileSize {
		return ports.ErrFileTooLarge
	}

	if fileSize <= 0 {
		return fmt.Errorf("file size must be greater than 0")
	}

	// Validate file type
	if len(assignment.AllowedFileTypes) > 0 {
		fileType := domain.DetermineFileType(mimeType)
		allowed := false

		for _, allowedType := range assignment.AllowedFileTypes {
			if string(fileType) == allowedType || mimeType == allowedType {
				allowed = true
				break
			}
		}

		if !allowed {
			return ports.ErrFileTypeNotAllowed
		}
	}

	// Validate filename
	if filename == "" {
		return fmt.Errorf("filename cannot be empty")
	}

	// Check for malicious patterns
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") || strings.Contains(filename, "\\") {
		return ports.ErrInvalidFileType
	}

	return nil
}

// GetFilePath extracts the file path from a URL (for internal use)
func (s *LocalFileStorage) GetFilePath(fileURL string) string {
	// Remove base URL to get relative path
	if !strings.HasPrefix(fileURL, s.baseURL) {
		return ""
	}

	relativePath := strings.TrimPrefix(fileURL, s.baseURL+"/")
	return relativePath
}

// GetFileSize returns the size of a file in bytes
func (s *LocalFileStorage) GetFileSize(ctx context.Context, fileID uuid.UUID) (int64, error) {
	// Try different subdirectories
	subdirs := []string{"assignments", "submissions", "templates"}

	for _, subdir := range subdirs {
		// Try different extensions
		exts := []string{".pdf", ".doc", ".docx", ".txt", ".jpg", ".png", ".zip", ".mp4", ".pptx", ".xlsx"}
		for _, ext := range exts {
			filename := fmt.Sprintf("%s%s", fileID.String(), ext)
			filePath := filepath.Join(s.basePath, subdir, filename)

			if info, err := os.Stat(filePath); err == nil {
				return info.Size(), nil
			}
		}
	}

	return 0, ports.ErrFileNotFound
}

// GenerateUniqueFileName generates a unique filename using hash and timestamp
func (s *LocalFileStorage) GenerateUniqueFileName(originalName, mimeType string) (string, error) {
	// Get file extension from MIME type
	ext := getExtensionFromMimeType(mimeType)
	if ext == "" {
		// Fallback to original extension
		ext = filepath.Ext(originalName)
		if ext == "" {
			ext = ".bin" // Default extension
		}
	}

	// Generate hash from original name and current timestamp
	timestamp := time.Now().UnixNano()
	hashInput := fmt.Sprintf("%s_%d", originalName, timestamp)
	hash := sha256.Sum256([]byte(hashInput))
	hashStr := hex.EncodeToString(hash[:])

	// Take first 16 characters of hash for filename
	filename := fmt.Sprintf("%s%s", hashStr[:16], ext)

	return filename, nil
}

// CleanupOldFiles removes files older than the specified duration
func (s *LocalFileStorage) CleanupOldFiles(ctx context.Context, maxAge time.Duration) (int, error) {
	subdirs := []string{"assignments", "submissions", "templates"}

	var deletedCount int
	cutoffTime := time.Now().Add(-maxAge)

	for _, subdir := range subdirs {
		dirPath := filepath.Join(s.basePath, subdir)

		err := filepath.Walk(dirPath, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}

			// Skip directories
			if info.IsDir() {
				return nil
			}

			// Check if file is older than cutoff
			if info.ModTime().Before(cutoffTime) {
				if err := os.Remove(path); err != nil {
					return fmt.Errorf("failed to delete old file %s: %w", path, err)
				}
				deletedCount++
			}

			return nil
		})

		if err != nil {
			return deletedCount, fmt.Errorf("cleanup failed in %s: %w", subdir, err)
		}
	}

	return deletedCount, nil
}

// GetStorageStats returns storage statistics
func (s *LocalFileStorage) GetStorageStats(ctx context.Context) (map[string]interface{}, error) {
	subdirs := []string{"assignments", "submissions", "templates"}

	totalFileCount := 0
	totalSize := int64(0)
	stats := make(map[string]interface{})

	for _, subdir := range subdirs {
		dirPath := filepath.Join(s.basePath, subdir)
		var fileCount int
		var dirSize int64

		err := filepath.Walk(dirPath, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}

			if !info.IsDir() {
				fileCount++
				dirSize += info.Size()
			}

			return nil
		})

		if err != nil {
			return nil, fmt.Errorf("failed to get storage stats for %s: %w", subdir, err)
		}

		stats[subdir+"_files"] = fileCount
		stats[subdir+"_size_bytes"] = dirSize
		stats[subdir+"_size_mb"] = float64(dirSize) / (1024 * 1024)

		totalFileCount += fileCount
		totalSize += dirSize
	}

	stats["total_files"] = totalFileCount
	stats["total_size_bytes"] = totalSize
	stats["total_size_mb"] = float64(totalSize) / (1024 * 1024)
	stats["base_path"] = s.basePath

	return stats, nil
}

// CopyFile copies a file from source to destination (useful for backups or templates)
func (s *LocalFileStorage) CopyFile(ctx context.Context, sourceFileID, destFileID uuid.UUID) error {
	// Retrieve source file
	data, err := s.Retrieve(ctx, sourceFileID)
	if err != nil {
		return fmt.Errorf("failed to retrieve source file: %w", err)
	}

	// Store as destination file (using default MIME type)
	_, err = s.Store(ctx, destFileID, data, "application/octet-stream")
	if err != nil {
		return fmt.Errorf("failed to store destination file: %w", err)
	}

	return nil
}

// MoveFile moves a file from one location to another
func (s *LocalFileStorage) MoveFile(ctx context.Context, fileID uuid.UUID, fromSubdir, toSubdir string) error {
	// Find the file in the source subdirectory
	exts := []string{".pdf", ".doc", ".docx", ".txt", ".jpg", ".png", ".zip", ".mp4", ".pptx", ".xlsx"}
	var foundExt string
	var sourcePath string

	for _, ext := range exts {
		filename := fmt.Sprintf("%s%s", fileID.String(), ext)
		filePath := filepath.Join(s.basePath, fromSubdir, filename)

		if _, err := os.Stat(filePath); err == nil {
			foundExt = ext
			sourcePath = filePath
			break
		}
	}

	if sourcePath == "" {
		return ports.ErrFileNotFound
	}

	// Create destination path
	filename := fmt.Sprintf("%s%s", fileID.String(), foundExt)
	destPath := filepath.Join(s.basePath, toSubdir, filename)

	// Move the file
	if err := os.Rename(sourcePath, destPath); err != nil {
		return fmt.Errorf("failed to move file: %w", err)
	}

	return nil
}

// Helper functions

// getExtensionFromMimeType returns file extension for MIME type
func getExtensionFromMimeType(mimeType string) string {
	extensions := map[string]string{
		// Documents
		"application/pdf":        ".pdf",
		"application/msword":     ".doc",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
		"text/plain":             ".txt",
		"text/html":              ".html",
		"text/markdown":          ".md",

		// Images
		"image/jpeg":             ".jpg",
		"image/jpg":              ".jpg",
		"image/png":              ".png",
		"image/gif":              ".gif",
		"image/webp":             ".webp",
		"image/svg+xml":          ".svg",

		// Videos
		"video/mp4":              ".mp4",
		"video/mpeg":             ".mpeg",
		"video/quicktime":        ".mov",
		"video/x-msvideo":        ".avi",

		// Audio
		"audio/mpeg":             ".mp3",
		"audio/wav":              ".wav",
		"audio/ogg":              ".ogg",

		// Presentations
		"application/vnd.ms-powerpoint": ".ppt",
		"application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",

		// Spreadsheets
		"application/vnd.ms-excel": ".xls",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
		"text/csv":                ".csv",

		// Archives
		"application/zip":        ".zip",
		"application/x-tar":      ".tar",
		"application/gzip":       ".gz",
		"application/x-rar-compressed": ".rar",
		"application/x-7z-compressed":  ".7z",

		// Code
		"text/javascript":        ".js",
		"application/json":       ".json",
		"text/css":               ".css",
		"text/x-python":          ".py",
		"text/x-java-source":     ".java",
		"text/x-c":               ".c",
		"text/x-c++src":          ".cpp",
		"application/x-go":       ".go",
	}

	if ext, ok := extensions[mimeType]; ok {
		return ext
	}

	return ".bin" // Default binary extension
}

// isValidMimeType checks if the MIME type is valid for assignments
func isValidMimeType(mimeType string) bool {
	validTypes := []string{
		// Documents
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"text/plain",
		"text/html",
		"text/markdown",

		// Images
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/gif",
		"image/webp",
		"image/svg+xml",

		// Videos
		"video/mp4",
		"video/mpeg",
		"video/quicktime",
		"video/x-msvideo",

		// Audio
		"audio/mpeg",
		"audio/wav",
		"audio/ogg",

		// Presentations
		"application/vnd.ms-powerpoint",
		"application/vnd.openxmlformats-officedocument.presentationml.presentation",

		// Spreadsheets
		"application/vnd.ms-excel",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"text/csv",

		// Archives
		"application/zip",
		"application/x-tar",
		"application/gzip",
		"application/x-rar-compressed",
		"application/x-7z-compressed",

		// Code
		"text/javascript",
		"application/json",
		"text/css",
		"text/x-python",
		"text/x-java-source",
		"text/x-c",
		"text/x-c++src",
		"application/x-go",
	}

	for _, validType := range validTypes {
		if mimeType == validType {
			return true
		}
	}

	return false
}
