package adapters

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/ports"
	_ "golang.org/x/image/webp"
)

// LocalFileStorage implements the FileStorageService interface for local filesystem storage
type LocalFileStorage struct {
	basePath string // Base directory for file storage (e.g., "./uploads")
	baseURL  string // Base URL for file access (e.g., "http://localhost:8080/uploads")
}

// NewLocalFileStorage creates a new local file storage service
func NewLocalFileStorage(basePath, baseURL string) (ports.FileStorageService, error) {
	// Create base directory if it doesn't exist
	if err := os.MkdirAll(basePath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create base directory: %w", err)
	}

	// Create avatars subdirectory
	avatarsPath := filepath.Join(basePath, "avatars")
	if err := os.MkdirAll(avatarsPath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create avatars directory: %w", err)
	}

	return &LocalFileStorage{
		basePath: basePath,
		baseURL:  strings.TrimSuffix(baseURL, "/"),
	}, nil
}

// UploadFile uploads a file to local storage and returns its URL
func (s *LocalFileStorage) UploadFile(ctx context.Context, file []byte, fileName, contentType string) (string, error) {
	// Validate content type
	if !isValidImageContentType(contentType) {
		return "", ports.ErrInvalidFileFormat
	}

	// Validate file size
	if len(file) > domain.MaxAvatarSizeBytes {
		return "", ports.ErrFileTooLarge
	}

	// Validate image
	if err := s.ValidateImage(file, contentType); err != nil {
		return "", err
	}

	// Generate unique filename
	uniqueFileName, err := s.GenerateUniqueFileName(fileName, contentType)
	if err != nil {
		return "", fmt.Errorf("failed to generate unique filename: %w", err)
	}

	// Determine file path
	filePath := filepath.Join(s.basePath, "avatars", uniqueFileName)

	// Write file to disk
	if err := os.WriteFile(filePath, file, 0644); err != nil {
		return "", ports.NewProfileError("UploadFile", ports.ErrFileUploadFailed, err.Error())
	}

	// Generate public URL
	fileURL := fmt.Sprintf("%s/avatars/%s", s.baseURL, uniqueFileName)

	return fileURL, nil
}

// DeleteFile deletes a file from local storage
func (s *LocalFileStorage) DeleteFile(ctx context.Context, fileURL string) error {
	// Extract file path from URL
	filePath := s.GetFilePath(fileURL)
	if filePath == "" {
		return ports.ErrFileNotFound
	}

	// Check if file exists
	exists, err := s.FileExists(ctx, fileURL)
	if err != nil {
		return err
	}
	if !exists {
		return ports.ErrFileNotFound
	}

	// Delete file
	fullPath := filepath.Join(s.basePath, filePath)
	if err := os.Remove(fullPath); err != nil {
		if os.IsNotExist(err) {
			return ports.ErrFileNotFound
		}
		return ports.NewProfileError("DeleteFile", ports.ErrFileDeleteFailed, err.Error())
	}

	return nil
}

// ValidateImage validates an image file (format, size, dimensions)
func (s *LocalFileStorage) ValidateImage(file []byte, contentType string) error {
	// Validate content type
	if !isValidImageContentType(contentType) {
		return domain.ErrInvalidImageFormat
	}

	// Validate size
	if len(file) == 0 {
		return errors.New("image data is empty")
	}
	if len(file) > domain.MaxAvatarSizeBytes {
		return domain.ErrImageTooLarge
	}

	// Decode image to validate format and get dimensions
	img, format, err := image.Decode(strings.NewReader(string(file)))
	if err != nil {
		return fmt.Errorf("invalid image format: %w", err)
	}

	// Validate format matches content type
	if !validateImageFormat(format, contentType) {
		return domain.ErrInvalidImageFormat
	}

	// Validate dimensions (optional constraints)
	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	// Minimum dimensions
	const minDimension = 50
	if width < minDimension || height < minDimension {
		return errors.New("image dimensions too small (minimum 50x50 pixels)")
	}

	// Maximum dimensions
	const maxDimension = 4096
	if width > maxDimension || height > maxDimension {
		return errors.New("image dimensions too large (maximum 4096x4096 pixels)")
	}

	return nil
}

// GetFilePath extracts the file path from a URL (exported for testing)
func (s *LocalFileStorage) GetFilePath(fileURL string) string {
	// Remove base URL to get relative path
	if !strings.HasPrefix(fileURL, s.baseURL) {
		return ""
	}

	relativePath := strings.TrimPrefix(fileURL, s.baseURL+"/")
	return relativePath
}

// FileExists checks if a file exists
func (s *LocalFileStorage) FileExists(ctx context.Context, fileURL string) (bool, error) {
	filePath := s.GetFilePath(fileURL)
	if filePath == "" {
		return false, nil
	}

	fullPath := filepath.Join(s.basePath, filePath)
	_, err := os.Stat(fullPath)
	if err != nil {
		if os.IsNotExist(err) {
			return false, nil
		}
		return false, fmt.Errorf("failed to check file existence: %w", err)
	}

	return true, nil
}

// GenerateUniqueFileName generates a unique filename using hash and timestamp (exported for testing)
func (s *LocalFileStorage) GenerateUniqueFileName(originalName, contentType string) (string, error) {
	// Get file extension from content type
	ext := getExtensionFromContentType(contentType)
	if ext == "" {
		// Fallback to original extension
		ext = filepath.Ext(originalName)
		if ext == "" {
			ext = ".jpg" // Default extension
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

// Helper functions

// isValidImageContentType checks if content type is a valid image format
func isValidImageContentType(contentType string) bool {
	validTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/webp": true,
	}
	return validTypes[contentType]
}

// validateImageFormat validates that decoded format matches content type
func validateImageFormat(format, contentType string) bool {
	formatMap := map[string]string{
		"jpeg": "image/jpeg",
		"jpg":  "image/jpeg",
		"png":  "image/png",
		"webp": "image/webp",
	}

	expectedContentType, ok := formatMap[format]
	if !ok {
		return false
	}

	return expectedContentType == contentType ||
		(contentType == "image/jpg" && expectedContentType == "image/jpeg")
}

// getExtensionFromContentType returns file extension for content type
func getExtensionFromContentType(contentType string) string {
	extensions := map[string]string{
		"image/jpeg": ".jpg",
		"image/jpg":  ".jpg",
		"image/png":  ".png",
		"image/webp": ".webp",
	}
	return extensions[contentType]
}

// GetFileSize returns the size of a file in bytes
func (s *LocalFileStorage) GetFileSize(ctx context.Context, fileURL string) (int64, error) {
	filePath := s.GetFilePath(fileURL)
	if filePath == "" {
		return 0, ports.ErrFileNotFound
	}

	fullPath := filepath.Join(s.basePath, filePath)
	info, err := os.Stat(fullPath)
	if err != nil {
		if os.IsNotExist(err) {
			return 0, ports.ErrFileNotFound
		}
		return 0, fmt.Errorf("failed to get file size: %w", err)
	}

	return info.Size(), nil
}

// CleanupOldFiles removes files older than the specified duration
func (s *LocalFileStorage) CleanupOldFiles(ctx context.Context, maxAge time.Duration) (int, error) {
	avatarsPath := filepath.Join(s.basePath, "avatars")

	var deletedCount int
	cutoffTime := time.Now().Add(-maxAge)

	err := filepath.Walk(avatarsPath, func(path string, info os.FileInfo, err error) error {
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
		return deletedCount, fmt.Errorf("cleanup failed: %w", err)
	}

	return deletedCount, nil
}

// GetStorageStats returns storage statistics
func (s *LocalFileStorage) GetStorageStats(ctx context.Context) (map[string]interface{}, error) {
	avatarsPath := filepath.Join(s.basePath, "avatars")

	var fileCount int
	var totalSize int64

	err := filepath.Walk(avatarsPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if !info.IsDir() {
			fileCount++
			totalSize += info.Size()
		}

		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to get storage stats: %w", err)
	}

	stats := map[string]interface{}{
		"file_count":       fileCount,
		"total_size_bytes": totalSize,
		"total_size_mb":    float64(totalSize) / (1024 * 1024),
		"base_path":        s.basePath,
	}

	return stats, nil
}

// CopyFile copies a file from source to destination (useful for backups)
func (s *LocalFileStorage) CopyFile(srcURL, dstFileName string) error {
	srcPath := s.GetFilePath(srcURL)
	if srcPath == "" {
		return ports.ErrFileNotFound
	}

	srcFullPath := filepath.Join(s.basePath, srcPath)
	dstFullPath := filepath.Join(s.basePath, "avatars", dstFileName)

	// Open source file
	srcFile, err := os.Open(srcFullPath)
	if err != nil {
		if os.IsNotExist(err) {
			return ports.ErrFileNotFound
		}
		return fmt.Errorf("failed to open source file: %w", err)
	}
	defer srcFile.Close()

	// Create destination file
	dstFile, err := os.Create(dstFullPath)
	if err != nil {
		return fmt.Errorf("failed to create destination file: %w", err)
	}
	defer dstFile.Close()

	// Copy data
	if _, err := io.Copy(dstFile, srcFile); err != nil {
		return fmt.Errorf("failed to copy file: %w", err)
	}

	return nil
}
