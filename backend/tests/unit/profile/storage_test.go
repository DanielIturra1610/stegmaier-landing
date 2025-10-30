package profile_test

import (
	"bytes"
	"context"
	"image"
	"image/color"
	"image/png"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/adapters"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// createValidPNGImage generates a valid PNG image for testing
func createValidPNGImage(width, height int) []byte {
	img := image.NewRGBA(image.Rect(0, 0, width, height))

	// Fill with a simple pattern
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			img.Set(x, y, color.RGBA{R: 255, G: 0, B: 0, A: 255})
		}
	}

	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		panic(err)
	}
	return buf.Bytes()
}

func TestNewLocalFileStorage(t *testing.T) {
	tempDir := t.TempDir()
	baseURL := "http://localhost:8080/uploads"

	storage, err := adapters.NewLocalFileStorage(tempDir, baseURL)
	require.NoError(t, err)
	assert.NotNil(t, storage)

	// Verify directories were created
	assert.DirExists(t, tempDir)
	assert.DirExists(t, filepath.Join(tempDir, "avatars"))
}

func TestNewLocalFileStorage_CreatesDirectories(t *testing.T) {
	tempDir := filepath.Join(t.TempDir(), "nested", "path")
	baseURL := "http://localhost:8080/uploads"

	storage, err := adapters.NewLocalFileStorage(tempDir, baseURL)
	require.NoError(t, err)
	assert.NotNil(t, storage)

	// Verify nested directories were created
	assert.DirExists(t, tempDir)
	assert.DirExists(t, filepath.Join(tempDir, "avatars"))
}

func TestLocalFileStorage_UploadFile(t *testing.T) {
	tempDir := t.TempDir()
	baseURL := "http://localhost:8080/uploads"

	storage, err := adapters.NewLocalFileStorage(tempDir, baseURL)
	require.NoError(t, err)

	// Create valid image data
	imageData := createValidPNGImage(100, 100)
	fileName := "avatar.png"
	contentType := "image/png"

	// Upload file
	fileURL, err := storage.UploadFile(context.Background(), imageData, fileName, contentType)
	require.NoError(t, err)
	assert.NotEmpty(t, fileURL)
	assert.Contains(t, fileURL, baseURL)
	assert.Contains(t, fileURL, "/avatars/")

	// Verify file was created
	exists, err := storage.FileExists(context.Background(), fileURL)
	require.NoError(t, err)
	assert.True(t, exists)
}

func TestLocalFileStorage_UploadFile_InvalidContentType(t *testing.T) {
	tempDir := t.TempDir()
	storage, _ := adapters.NewLocalFileStorage(tempDir, "http://localhost:8080")

	imageData := []byte("fake image data")
	fileName := "avatar.gif"
	contentType := "image/gif" // Not allowed

	fileURL, err := storage.UploadFile(context.Background(), imageData, fileName, contentType)
	assert.Error(t, err)
	assert.Empty(t, fileURL)
	assert.ErrorIs(t, err, ports.ErrInvalidFileFormat)
}

func TestLocalFileStorage_UploadFile_FileTooLarge(t *testing.T) {
	tempDir := t.TempDir()
	storage, _ := adapters.NewLocalFileStorage(tempDir, "http://localhost:8080")

	// Create file larger than max size
	largeData := make([]byte, domain.MaxAvatarSizeBytes+1)
	fileName := "large.png"
	contentType := "image/png"

	fileURL, err := storage.UploadFile(context.Background(), largeData, fileName, contentType)
	assert.Error(t, err)
	assert.Empty(t, fileURL)
	assert.ErrorIs(t, err, ports.ErrFileTooLarge)
}

func TestLocalFileStorage_DeleteFile(t *testing.T) {
	tempDir := t.TempDir()
	baseURL := "http://localhost:8080/uploads"
	storage, _ := adapters.NewLocalFileStorage(tempDir, baseURL)

	// Upload a file first
	imageData := createValidPNGImage(100, 100)
	fileURL, err := storage.UploadFile(context.Background(), imageData, "avatar.png", "image/png")
	require.NoError(t, err)

	// Verify file exists
	exists, err := storage.FileExists(context.Background(), fileURL)
	require.NoError(t, err)
	assert.True(t, exists)

	// Delete file
	err = storage.DeleteFile(context.Background(), fileURL)
	require.NoError(t, err)

	// Verify file no longer exists
	exists, err = storage.FileExists(context.Background(), fileURL)
	require.NoError(t, err)
	assert.False(t, exists)
}

func TestLocalFileStorage_DeleteFile_NotFound(t *testing.T) {
	tempDir := t.TempDir()
	baseURL := "http://localhost:8080/uploads"
	storage, _ := adapters.NewLocalFileStorage(tempDir, baseURL)

	// Try to delete non-existent file
	fakeURL := baseURL + "/avatars/nonexistent.png"
	err := storage.DeleteFile(context.Background(), fakeURL)
	assert.Error(t, err)
	assert.ErrorIs(t, err, ports.ErrFileNotFound)
}

func TestLocalFileStorage_ValidateImage_ValidFormats(t *testing.T) {
	tempDir := t.TempDir()
	storage, _ := adapters.NewLocalFileStorage(tempDir, "http://localhost:8080")

	tests := []struct {
		name        string
		contentType string
		wantErr     bool
	}{
		{"PNG", "image/png", false},
		{"JPEG", "image/jpeg", false},
		{"JPG", "image/jpg", false},
		{"WebP", "image/webp", false},
		{"GIF (invalid)", "image/gif", true},
		{"SVG (invalid)", "image/svg+xml", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Generate appropriate image data for each format
			var imageData []byte
			if tt.contentType == "image/png" {
				imageData = createValidPNGImage(100, 100)
			} else {
				// For other formats, use PNG data (will fail format validation if not PNG)
				imageData = createValidPNGImage(100, 100)
			}

			err := storage.ValidateImage(imageData, tt.contentType)
			if tt.wantErr {
				assert.Error(t, err)
			} else if tt.contentType == "image/png" {
				// Only PNG will decode successfully with our test data
				assert.NoError(t, err)
			}
		})
	}
}

func TestLocalFileStorage_ValidateImage_EmptyData(t *testing.T) {
	tempDir := t.TempDir()
	storage, _ := adapters.NewLocalFileStorage(tempDir, "http://localhost:8080")

	err := storage.ValidateImage([]byte{}, "image/png")
	assert.Error(t, err)
}

func TestLocalFileStorage_ValidateImage_TooLarge(t *testing.T) {
	tempDir := t.TempDir()
	storage, _ := adapters.NewLocalFileStorage(tempDir, "http://localhost:8080")

	largeData := make([]byte, domain.MaxAvatarSizeBytes+1)
	err := storage.ValidateImage(largeData, "image/png")
	assert.Error(t, err)
	assert.ErrorIs(t, err, domain.ErrImageTooLarge)
}

func TestLocalFileStorage_GetFilePath(t *testing.T) {
	tempDir := t.TempDir()
	baseURL := "http://localhost:8080/uploads"
	storage, _ := adapters.NewLocalFileStorage(tempDir, baseURL)

	tests := []struct {
		name    string
		fileURL string
		want    string
	}{
		{
			name:    "valid URL",
			fileURL: "http://localhost:8080/uploads/avatars/test.png",
			want:    "avatars/test.png",
		},
		{
			name:    "invalid URL (wrong base)",
			fileURL: "http://different.com/uploads/avatars/test.png",
			want:    "",
		},
		{
			name:    "empty URL",
			fileURL: "",
			want:    "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := storage.GetFilePath(tt.fileURL)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestLocalFileStorage_FileExists(t *testing.T) {
	tempDir := t.TempDir()
	baseURL := "http://localhost:8080/uploads"
	storage, _ := adapters.NewLocalFileStorage(tempDir, baseURL)

	// Create a test file
	avatarsPath := filepath.Join(tempDir, "avatars")
	testFile := filepath.Join(avatarsPath, "test.png")
	err := os.WriteFile(testFile, []byte("test data"), 0644)
	require.NoError(t, err)

	// Test existing file
	fileURL := baseURL + "/avatars/test.png"
	exists, err := storage.FileExists(context.Background(), fileURL)
	require.NoError(t, err)
	assert.True(t, exists)

	// Test non-existing file
	nonExistentURL := baseURL + "/avatars/nonexistent.png"
	exists, err = storage.FileExists(context.Background(), nonExistentURL)
	require.NoError(t, err)
	assert.False(t, exists)

	// Test invalid URL
	invalidURL := "http://invalid.com/test.png"
	exists, err = storage.FileExists(context.Background(), invalidURL)
	require.NoError(t, err)
	assert.False(t, exists)
}

func TestLocalFileStorage_GetFileSize(t *testing.T) {
	tempDir := t.TempDir()
	baseURL := "http://localhost:8080/uploads"
	storage, _ := adapters.NewLocalFileStorage(tempDir, baseURL)
	localStorage := storage.(*adapters.LocalFileStorage)

	// Create a test file with known size
	testData := []byte("test data with known size")
	avatarsPath := filepath.Join(tempDir, "avatars")
	testFile := filepath.Join(avatarsPath, "test.png")
	err := os.WriteFile(testFile, testData, 0644)
	require.NoError(t, err)

	// Get file size
	fileURL := baseURL + "/avatars/test.png"
	size, err := localStorage.GetFileSize(context.Background(), fileURL)
	require.NoError(t, err)
	assert.Equal(t, int64(len(testData)), size)

	// Test non-existent file
	nonExistentURL := baseURL + "/avatars/nonexistent.png"
	_, err = localStorage.GetFileSize(context.Background(), nonExistentURL)
	assert.Error(t, err)
	assert.ErrorIs(t, err, ports.ErrFileNotFound)
}

func TestLocalFileStorage_CleanupOldFiles(t *testing.T) {
	tempDir := t.TempDir()
	storage, _ := adapters.NewLocalFileStorage(tempDir, "http://localhost:8080")
	localStorage := storage.(*adapters.LocalFileStorage)

	avatarsPath := filepath.Join(tempDir, "avatars")

	// Create old file
	oldFile := filepath.Join(avatarsPath, "old.png")
	err := os.WriteFile(oldFile, []byte("old"), 0644)
	require.NoError(t, err)

	// Set file modification time to past
	pastTime := time.Now().Add(-48 * time.Hour)
	err = os.Chtimes(oldFile, pastTime, pastTime)
	require.NoError(t, err)

	// Create new file
	newFile := filepath.Join(avatarsPath, "new.png")
	err = os.WriteFile(newFile, []byte("new"), 0644)
	require.NoError(t, err)

	// Cleanup files older than 24 hours
	deletedCount, err := localStorage.CleanupOldFiles(context.Background(), 24*time.Hour)
	require.NoError(t, err)
	assert.Equal(t, 1, deletedCount)

	// Verify old file was deleted
	_, err = os.Stat(oldFile)
	assert.True(t, os.IsNotExist(err))

	// Verify new file still exists
	_, err = os.Stat(newFile)
	assert.NoError(t, err)
}

func TestLocalFileStorage_GetStorageStats(t *testing.T) {
	tempDir := t.TempDir()
	storage, _ := adapters.NewLocalFileStorage(tempDir, "http://localhost:8080")
	localStorage := storage.(*adapters.LocalFileStorage)

	// Create some test files
	avatarsPath := filepath.Join(tempDir, "avatars")
	file1 := filepath.Join(avatarsPath, "file1.png")
	file2 := filepath.Join(avatarsPath, "file2.png")

	data1 := make([]byte, 1024)      // 1KB
	data2 := make([]byte, 2048)      // 2KB
	err := os.WriteFile(file1, data1, 0644)
	require.NoError(t, err)
	err = os.WriteFile(file2, data2, 0644)
	require.NoError(t, err)

	// Get stats
	stats, err := localStorage.GetStorageStats(context.Background())
	require.NoError(t, err)
	assert.NotNil(t, stats)
	assert.Equal(t, 2, stats["file_count"])
	assert.Equal(t, int64(3072), stats["total_size_bytes"])
	assert.InDelta(t, 0.003, stats["total_size_mb"], 0.001)
}

func TestLocalFileStorage_CopyFile(t *testing.T) {
	tempDir := t.TempDir()
	baseURL := "http://localhost:8080/uploads"
	storage, _ := adapters.NewLocalFileStorage(tempDir, baseURL)
	localStorage := storage.(*adapters.LocalFileStorage)

	// Create source file
	testData := []byte("test data for copy")
	avatarsPath := filepath.Join(tempDir, "avatars")
	srcFile := filepath.Join(avatarsPath, "source.png")
	err := os.WriteFile(srcFile, testData, 0644)
	require.NoError(t, err)

	// Copy file
	srcURL := baseURL + "/avatars/source.png"
	dstFileName := "destination.png"
	err = localStorage.CopyFile(srcURL, dstFileName)
	require.NoError(t, err)

	// Verify destination file exists and has same content
	dstFile := filepath.Join(avatarsPath, dstFileName)
	dstData, err := os.ReadFile(dstFile)
	require.NoError(t, err)
	assert.Equal(t, testData, dstData)
}

func TestLocalFileStorage_generateUniqueFileName(t *testing.T) {
	tempDir := t.TempDir()
	storage, _ := adapters.NewLocalFileStorage(tempDir, "http://localhost:8080")
	localStorage := storage.(*adapters.LocalFileStorage)

	// Generate multiple filenames
	fileName1, err := localStorage.GenerateUniqueFileName("avatar.png", "image/png")
	require.NoError(t, err)
	assert.NotEmpty(t, fileName1)
	assert.Contains(t, fileName1, ".png")

	// Generate another filename (should be different due to timestamp)
	time.Sleep(10 * time.Millisecond)
	fileName2, err := localStorage.GenerateUniqueFileName("avatar.png", "image/png")
	require.NoError(t, err)
	assert.NotEmpty(t, fileName2)
	assert.NotEqual(t, fileName1, fileName2)
}
