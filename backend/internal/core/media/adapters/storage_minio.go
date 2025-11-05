package adapters

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/media/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/media/ports"
	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

// MinioStorageService implementa StorageService usando MinIO
type MinioStorageService struct {
	client       *minio.Client
	endpoint     string
	accessKey    string
	secretKey    string
	useSSL       bool
	region       string
	bucketPrefix string
}

// NewMinioStorageService crea una nueva instancia de MinioStorageService
func NewMinioStorageService(endpoint, accessKey, secretKey, region, bucketPrefix string, useSSL bool) (ports.StorageService, error) {
	// Inicializar cliente de MinIO
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
		Region: region,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to initialize minio client: %w", err)
	}

	return &MinioStorageService{
		client:       client,
		endpoint:     endpoint,
		accessKey:    accessKey,
		secretKey:    secretKey,
		useSSL:       useSSL,
		region:       region,
		bucketPrefix: bucketPrefix,
	}, nil
}

// getBucketName genera el nombre del bucket para un tenant
func (s *MinioStorageService) getBucketName(tenantID uuid.UUID) string {
	return fmt.Sprintf("%s-%s", s.bucketPrefix, tenantID.String())
}

// Upload sube un archivo al almacenamiento
func (s *MinioStorageService) Upload(tenantID uuid.UUID, fileName string, fileReader io.Reader, contentType string, fileSize int64) (string, error) {
	ctx := context.Background()
	bucketName := s.getBucketName(tenantID)

	// Asegurar que el bucket existe
	exists, err := s.client.BucketExists(ctx, bucketName)
	if err != nil {
		return "", fmt.Errorf("failed to check bucket existence: %w", err)
	}
	if !exists {
		if err := s.CreateBucket(tenantID); err != nil {
			return "", fmt.Errorf("failed to create bucket: %w", err)
		}
	}

	// Subir archivo
	opts := minio.PutObjectOptions{
		ContentType: contentType,
	}

	_, err = s.client.PutObject(ctx, bucketName, fileName, fileReader, fileSize, opts)
	if err != nil {
		return "", fmt.Errorf("failed to upload file: %w", err)
	}

	// Generar URL del archivo
	url := s.GetPublicURL(tenantID, fileName)
	return url, nil
}

// UploadWithProgress sube un archivo con callback de progreso
func (s *MinioStorageService) UploadWithProgress(tenantID uuid.UUID, fileName string, fileReader io.Reader, contentType string, fileSize int64, progressCallback func(bytesUploaded int64)) (string, error) {
	// Por ahora, implementación simple sin progreso real
	// En producción, se podría usar un io.Reader wrapper para trackear progreso
	return s.Upload(tenantID, fileName, fileReader, contentType, fileSize)
}

// Download descarga un archivo del almacenamiento
func (s *MinioStorageService) Download(tenantID uuid.UUID, fileName string) (io.ReadCloser, error) {
	ctx := context.Background()
	bucketName := s.getBucketName(tenantID)

	object, err := s.client.GetObject(ctx, bucketName, fileName, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to download file: %w", err)
	}

	return object, nil
}

// GetPresignedURL genera una URL pre-firmada para acceso temporal
func (s *MinioStorageService) GetPresignedURL(tenantID uuid.UUID, fileName string, expirySeconds int) (string, error) {
	ctx := context.Background()
	bucketName := s.getBucketName(tenantID)

	expiry := time.Duration(expirySeconds) * time.Second
	presignedURL, err := s.client.PresignedGetObject(ctx, bucketName, fileName, expiry, nil)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return presignedURL.String(), nil
}

// GetPublicURL genera la URL pública del archivo
func (s *MinioStorageService) GetPublicURL(tenantID uuid.UUID, fileName string) string {
	bucketName := s.getBucketName(tenantID)
	protocol := "http"
	if s.useSSL {
		protocol = "https"
	}
	return fmt.Sprintf("%s://%s/%s/%s", protocol, s.endpoint, bucketName, fileName)
}

// Delete elimina un archivo del almacenamiento
func (s *MinioStorageService) Delete(tenantID uuid.UUID, fileName string) error {
	ctx := context.Background()
	bucketName := s.getBucketName(tenantID)

	err := s.client.RemoveObject(ctx, bucketName, fileName, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	return nil
}

// DeleteMultiple elimina múltiples archivos
func (s *MinioStorageService) DeleteMultiple(tenantID uuid.UUID, fileNames []string) error {
	ctx := context.Background()
	bucketName := s.getBucketName(tenantID)

	objectsCh := make(chan minio.ObjectInfo)

	go func() {
		defer close(objectsCh)
		for _, fileName := range fileNames {
			objectsCh <- minio.ObjectInfo{Key: fileName}
		}
	}()

	errorCh := s.client.RemoveObjects(ctx, bucketName, objectsCh, minio.RemoveObjectsOptions{})

	// Verificar errores
	for e := range errorCh {
		if e.Err != nil {
			return fmt.Errorf("failed to delete file %s: %w", e.ObjectName, e.Err)
		}
	}

	return nil
}

// FileExists verifica si un archivo existe
func (s *MinioStorageService) FileExists(tenantID uuid.UUID, fileName string) (bool, error) {
	ctx := context.Background()
	bucketName := s.getBucketName(tenantID)

	_, err := s.client.StatObject(ctx, bucketName, fileName, minio.StatObjectOptions{})
	if err != nil {
		errResponse := minio.ToErrorResponse(err)
		if errResponse.Code == "NoSuchKey" {
			return false, nil
		}
		return false, fmt.Errorf("failed to check file existence: %w", err)
	}

	return true, nil
}

// GetFileSize obtiene el tamaño de un archivo
func (s *MinioStorageService) GetFileSize(tenantID uuid.UUID, fileName string) (int64, error) {
	ctx := context.Background()
	bucketName := s.getBucketName(tenantID)

	stat, err := s.client.StatObject(ctx, bucketName, fileName, minio.StatObjectOptions{})
	if err != nil {
		return 0, fmt.Errorf("failed to get file size: %w", err)
	}

	return stat.Size, nil
}

// GetFileMetadata obtiene los metadatos de un archivo
func (s *MinioStorageService) GetFileMetadata(tenantID uuid.UUID, fileName string) (map[string]string, error) {
	ctx := context.Background()
	bucketName := s.getBucketName(tenantID)

	stat, err := s.client.StatObject(ctx, bucketName, fileName, minio.StatObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get file metadata: %w", err)
	}

	metadata := make(map[string]string)
	metadata["content-type"] = stat.ContentType
	metadata["size"] = fmt.Sprintf("%d", stat.Size)
	metadata["last-modified"] = stat.LastModified.Format(time.RFC3339)

	// Agregar metadatos adicionales si existen
	for key, values := range stat.UserMetadata {
		if len(values) > 0 {
			metadata[key] = values[0]
		}
	}

	return metadata, nil
}

// CreateBucket crea un bucket para un tenant
func (s *MinioStorageService) CreateBucket(tenantID uuid.UUID) error {
	ctx := context.Background()
	bucketName := s.getBucketName(tenantID)

	err := s.client.MakeBucket(ctx, bucketName, minio.MakeBucketOptions{
		Region: s.region,
	})
	if err != nil {
		return fmt.Errorf("failed to create bucket: %w", err)
	}

	// Configurar política de acceso público para archivos públicos (opcional)
	// Se puede implementar políticas más granulares según necesidad

	return nil
}

// BucketExists verifica si un bucket existe
func (s *MinioStorageService) BucketExists(tenantID uuid.UUID) (bool, error) {
	ctx := context.Background()
	bucketName := s.getBucketName(tenantID)

	exists, err := s.client.BucketExists(ctx, bucketName)
	if err != nil {
		return false, fmt.Errorf("failed to check bucket existence: %w", err)
	}

	return exists, nil
}

// GenerateFileName genera un nombre único para un archivo
func (s *MinioStorageService) GenerateFileName(originalName string) string {
	ext := filepath.Ext(originalName)
	nameWithoutExt := strings.TrimSuffix(originalName, ext)

	// Sanitizar nombre de archivo
	nameWithoutExt = strings.ReplaceAll(nameWithoutExt, " ", "_")
	nameWithoutExt = strings.ToLower(nameWithoutExt)

	// Generar nombre único con timestamp y UUID
	timestamp := time.Now().Unix()
	uniqueID := uuid.New().String()[:8]

	return fmt.Sprintf("%s_%d_%s%s", nameWithoutExt, timestamp, uniqueID, ext)
}

// ValidateMimeType valida si un tipo MIME es permitido
func (s *MinioStorageService) ValidateMimeType(mimeType string) bool {
	// Lista de tipos MIME permitidos
	allowedMimeTypes := map[string]bool{
		// Images
		"image/jpeg":    true,
		"image/jpg":     true,
		"image/png":     true,
		"image/gif":     true,
		"image/webp":    true,
		"image/svg+xml": true,
		"image/bmp":     true,

		// Videos
		"video/mp4":        true,
		"video/webm":       true,
		"video/quicktime":  true,
		"video/x-msvideo":  true,
		"video/x-matroska": true,
		"video/x-flv":      true,
		"video/x-ms-wmv":   true,

		// Audio
		"audio/mpeg":      true,
		"audio/wav":       true,
		"audio/ogg":       true,
		"audio/mp4":       true,
		"audio/flac":      true,
		"audio/aac":       true,

		// Documents
		"application/pdf": true,
		"application/msword": true,
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
		"application/vnd.ms-excel": true,
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": true,
		"application/vnd.ms-powerpoint": true,
		"application/vnd.openxmlformats-officedocument.presentationml.presentation": true,
		"text/plain": true,
		"text/csv":   true,

		// Archives
		"application/zip":              true,
		"application/x-rar-compressed": true,
		"application/x-7z-compressed":  true,
		"application/x-tar":            true,
		"application/gzip":             true,
	}

	return allowedMimeTypes[mimeType]
}
