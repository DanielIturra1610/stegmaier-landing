package ports

import (
	"context"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/assignments/domain"
	"github.com/google/uuid"
)

// FileStorage define las operaciones de almacenamiento de archivos
type FileStorage interface {
	// Store almacena un archivo y devuelve la URL
	Store(ctx context.Context, fileID uuid.UUID, data []byte, mimeType string) (string, error)

	// Retrieve recupera un archivo por su ID
	Retrieve(ctx context.Context, fileID uuid.UUID) ([]byte, error)

	// Delete elimina un archivo
	Delete(ctx context.Context, fileID uuid.UUID) error

	// Exists verifica si un archivo existe
	Exists(ctx context.Context, fileID uuid.UUID) (bool, error)

	// GetURL obtiene la URL pública de un archivo
	GetURL(ctx context.Context, fileID uuid.UUID) (string, error)

	// ValidateFile valida un archivo antes de subirlo
	ValidateFile(filename string, fileSize int64, mimeType string, assignment *domain.Assignment) error
}
