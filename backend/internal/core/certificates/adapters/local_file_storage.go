package adapters

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/certificates/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/certificates/ports"
	"github.com/google/uuid"
)

// LocalCertificateStorage implements the CertificateStorage interface for local filesystem storage
type LocalCertificateStorage struct {
	basePath string // Base directory for certificate storage (e.g., "./certificates")
	baseURL  string // Base URL for certificate access (e.g., "http://localhost:8080/certificates")
}

// NewLocalCertificateStorage creates a new local certificate storage service
func NewLocalCertificateStorage(basePath, baseURL string) (ports.CertificateStorage, error) {
	// Create base directory if it doesn't exist
	if err := os.MkdirAll(basePath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create base directory: %w", err)
	}

	// Create subdirectories for different formats
	pdfPath := filepath.Join(basePath, "pdf")
	if err := os.MkdirAll(pdfPath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create pdf directory: %w", err)
	}

	jsonPath := filepath.Join(basePath, "json")
	if err := os.MkdirAll(jsonPath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create json directory: %w", err)
	}

	return &LocalCertificateStorage{
		basePath: basePath,
		baseURL:  strings.TrimSuffix(baseURL, "/"),
	}, nil
}

// Store stores a certificate file
func (s *LocalCertificateStorage) Store(ctx context.Context, certificateID uuid.UUID, data []byte, format domain.CertificateFormat) (string, error) {
	// Validate format
	if !domain.ValidateCertificateFormat(format) {
		return "", ports.ErrInvalidFormat
	}

	// Validate data
	if len(data) == 0 {
		return "", ports.ErrInvalidCertificateData
	}

	// Determine file path based on format
	var subdir, ext string
	switch format {
	case domain.CertificateFormatPDF:
		subdir = "pdf"
		ext = ".pdf"
	case domain.CertificateFormatJSON:
		subdir = "json"
		ext = ".json"
	default:
		return "", ports.ErrInvalidFormat
	}

	// Generate filename
	filename := fmt.Sprintf("%s%s", certificateID.String(), ext)
	filePath := filepath.Join(s.basePath, subdir, filename)

	// Write file to disk
	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return "", ports.ErrFileUploadFailed
	}

	// Generate public URL
	fileURL := fmt.Sprintf("%s/%s/%s", s.baseURL, subdir, filename)

	return fileURL, nil
}

// Retrieve retrieves a certificate file
func (s *LocalCertificateStorage) Retrieve(ctx context.Context, certificateID uuid.UUID, format domain.CertificateFormat) ([]byte, error) {
	// Validate format
	if !domain.ValidateCertificateFormat(format) {
		return nil, ports.ErrInvalidFormat
	}

	// Determine file path based on format
	var subdir, ext string
	switch format {
	case domain.CertificateFormatPDF:
		subdir = "pdf"
		ext = ".pdf"
	case domain.CertificateFormatJSON:
		subdir = "json"
		ext = ".json"
	default:
		return nil, ports.ErrInvalidFormat
	}

	// Generate filename
	filename := fmt.Sprintf("%s%s", certificateID.String(), ext)
	filePath := filepath.Join(s.basePath, subdir, filename)

	// Read file from disk
	data, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, ports.ErrFileNotFound
		}
		return nil, ports.ErrFileDownloadFailed
	}

	return data, nil
}

// Delete deletes a certificate file
func (s *LocalCertificateStorage) Delete(ctx context.Context, certificateID uuid.UUID, format domain.CertificateFormat) error {
	// Validate format
	if !domain.ValidateCertificateFormat(format) {
		return ports.ErrInvalidFormat
	}

	// Determine file path based on format
	var subdir, ext string
	switch format {
	case domain.CertificateFormatPDF:
		subdir = "pdf"
		ext = ".pdf"
	case domain.CertificateFormatJSON:
		subdir = "json"
		ext = ".json"
	default:
		return ports.ErrInvalidFormat
	}

	// Generate filename
	filename := fmt.Sprintf("%s%s", certificateID.String(), ext)
	filePath := filepath.Join(s.basePath, subdir, filename)

	// Delete file
	if err := os.Remove(filePath); err != nil {
		if os.IsNotExist(err) {
			return ports.ErrFileNotFound
		}
		return ports.ErrStorageFailed
	}

	return nil
}

// Exists checks if a certificate file exists
func (s *LocalCertificateStorage) Exists(ctx context.Context, certificateID uuid.UUID, format domain.CertificateFormat) (bool, error) {
	// Validate format
	if !domain.ValidateCertificateFormat(format) {
		return false, ports.ErrInvalidFormat
	}

	// Determine file path based on format
	var subdir, ext string
	switch format {
	case domain.CertificateFormatPDF:
		subdir = "pdf"
		ext = ".pdf"
	case domain.CertificateFormatJSON:
		subdir = "json"
		ext = ".json"
	default:
		return false, ports.ErrInvalidFormat
	}

	// Generate filename
	filename := fmt.Sprintf("%s%s", certificateID.String(), ext)
	filePath := filepath.Join(s.basePath, subdir, filename)

	// Check if file exists
	_, err := os.Stat(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return false, nil
		}
		return false, fmt.Errorf("failed to check file existence: %w", err)
	}

	return true, nil
}

// GetURL gets the URL for a certificate file
func (s *LocalCertificateStorage) GetURL(ctx context.Context, certificateID uuid.UUID, format domain.CertificateFormat) (string, error) {
	// Validate format
	if !domain.ValidateCertificateFormat(format) {
		return "", ports.ErrInvalidFormat
	}

	// Check if file exists
	exists, err := s.Exists(ctx, certificateID, format)
	if err != nil {
		return "", err
	}
	if !exists {
		return "", ports.ErrFileNotFound
	}

	// Determine subdirectory and extension
	var subdir, ext string
	switch format {
	case domain.CertificateFormatPDF:
		subdir = "pdf"
		ext = ".pdf"
	case domain.CertificateFormatJSON:
		subdir = "json"
		ext = ".json"
	default:
		return "", ports.ErrInvalidFormat
	}

	// Generate filename and URL
	filename := fmt.Sprintf("%s%s", certificateID.String(), ext)
	fileURL := fmt.Sprintf("%s/%s/%s", s.baseURL, subdir, filename)

	return fileURL, nil
}
