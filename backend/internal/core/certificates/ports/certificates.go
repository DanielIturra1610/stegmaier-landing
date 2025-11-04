package ports

import (
	"context"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/certificates/domain"
	"github.com/google/uuid"
)

// ============================================================
// Repository Interface
// ============================================================

// CertificateRepository defines the interface for certificate data operations
type CertificateRepository interface {
	// Certificate CRUD operations
	CreateCertificate(ctx context.Context, certificate *domain.Certificate) error
	GetCertificate(ctx context.Context, certificateID, tenantID uuid.UUID) (*domain.Certificate, error)
	GetCertificateByNumber(ctx context.Context, certificateNumber string, tenantID uuid.UUID) (*domain.Certificate, error)
	GetCertificateByUserAndCourse(ctx context.Context, userID, courseID, tenantID uuid.UUID) (*domain.Certificate, error)
	ListCertificates(ctx context.Context, tenantID uuid.UUID, req *domain.ListCertificatesRequest) ([]*domain.Certificate, int, error)
	ListCertificatesByUser(ctx context.Context, userID, tenantID uuid.UUID, page, pageSize int) ([]*domain.Certificate, int, error)
	ListCertificatesByCourse(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) ([]*domain.Certificate, int, error)
	UpdateCertificate(ctx context.Context, certificate *domain.Certificate) error
	DeleteCertificate(ctx context.Context, certificateID, tenantID uuid.UUID) error

	// Certificate operations
	RevokeCertificate(ctx context.Context, certificateID, tenantID, revokedBy uuid.UUID, reason string) error
	SetCertificateExpiration(ctx context.Context, certificateID, tenantID uuid.UUID, expiresAt time.Time) error

	// Verification operations
	VerifyCertificate(ctx context.Context, certificateNumber, verificationCode string, tenantID uuid.UUID) (*domain.Certificate, error)
	CertificateExists(ctx context.Context, userID, courseID, tenantID uuid.UUID) (bool, error)

	// Statistics operations
	GetCertificateStatistics(ctx context.Context, tenantID uuid.UUID) (*domain.CertificateStatisticsResponse, error)
	GetCourseStatistics(ctx context.Context, courseID, tenantID uuid.UUID) (*domain.CertificateStatisticsResponse, error)
	CountCertificatesByStatus(ctx context.Context, tenantID uuid.UUID, status domain.CertificateStatus) (int, error)

	// Template CRUD operations
	CreateTemplate(ctx context.Context, template *domain.CertificateTemplate) error
	GetTemplate(ctx context.Context, templateID, tenantID uuid.UUID) (*domain.CertificateTemplate, error)
	GetDefaultTemplate(ctx context.Context, tenantID uuid.UUID) (*domain.CertificateTemplate, error)
	ListTemplates(ctx context.Context, tenantID uuid.UUID, page, pageSize int) ([]*domain.CertificateTemplate, int, error)
	UpdateTemplate(ctx context.Context, template *domain.CertificateTemplate) error
	DeleteTemplate(ctx context.Context, templateID, tenantID uuid.UUID) error
	SetDefaultTemplate(ctx context.Context, templateID, tenantID uuid.UUID) error
}

// ============================================================
// Service Interface
// ============================================================

// CertificateService defines the interface for certificate business logic
type CertificateService interface {
	// Student Certificate Operations
	GetMyCertificate(ctx context.Context, courseID, userID, tenantID uuid.UUID) (*domain.CertificateDetailResponse, error)
	GetMyCertificates(ctx context.Context, userID, tenantID uuid.UUID, page, pageSize int) (*domain.ListCertificatesResponse, error)
	DownloadCertificate(ctx context.Context, certificateID, userID, tenantID uuid.UUID, format domain.CertificateFormat) ([]byte, string, error)
	VerifyMyCertificate(ctx context.Context, certificateNumber, verificationCode string, tenantID uuid.UUID) (*domain.CertificateVerificationResponse, error)

	// Instructor/Admin Certificate Management
	GenerateCertificate(ctx context.Context, tenantID uuid.UUID, req *domain.GenerateCertificateRequest) (*domain.CertificateResponse, error)
	GetCertificate(ctx context.Context, certificateID, tenantID uuid.UUID) (*domain.CertificateDetailResponse, error)
	ListCourseCertificates(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) (*domain.ListCertificatesResponse, error)
	ListUserCertificates(ctx context.Context, userID, tenantID uuid.UUID, page, pageSize int) (*domain.ListCertificatesResponse, error)
	RevokeCertificate(ctx context.Context, certificateID, tenantID, revokedBy uuid.UUID, req *domain.RevokeCertificateRequest) error
	DeleteCertificate(ctx context.Context, certificateID, tenantID uuid.UUID) error

	// Certificate Verification (Public)
	VerifyCertificate(ctx context.Context, req *domain.VerifyCertificateRequest, tenantID uuid.UUID) (*domain.CertificateVerificationResponse, error)

	// Certificate Statistics
	GetCertificateStatistics(ctx context.Context, tenantID uuid.UUID) (*domain.CertificateStatisticsResponse, error)
	GetCourseStatistics(ctx context.Context, courseID, tenantID uuid.UUID) (*domain.CertificateStatisticsResponse, error)

	// Template Management
	CreateTemplate(ctx context.Context, tenantID, createdBy uuid.UUID, req *domain.CreateTemplateRequest) (*domain.CertificateTemplateResponse, error)
	GetTemplate(ctx context.Context, templateID, tenantID uuid.UUID) (*domain.CertificateTemplateResponse, error)
	ListTemplates(ctx context.Context, tenantID uuid.UUID, page, pageSize int) ([]*domain.CertificateTemplateResponse, int, error)
	UpdateTemplate(ctx context.Context, templateID, tenantID uuid.UUID, req *domain.UpdateTemplateRequest) (*domain.CertificateTemplateResponse, error)
	DeleteTemplate(ctx context.Context, templateID, tenantID uuid.UUID) error
	SetDefaultTemplate(ctx context.Context, templateID, tenantID uuid.UUID) error

	// System Operations
	RegenerateCertificate(ctx context.Context, certificateID, tenantID uuid.UUID) (*domain.CertificateResponse, error)
	BulkGenerateCertificates(ctx context.Context, courseID, tenantID uuid.UUID) (int, error)
}

// ============================================================
// Generator Interface
// ============================================================

// CertificateGenerator defines the interface for certificate PDF generation
type CertificateGenerator interface {
	// GeneratePDF generates a PDF certificate
	GeneratePDF(ctx context.Context, certificate *domain.Certificate, template *domain.CertificateTemplate, data map[string]interface{}) ([]byte, error)

	// GeneratePreview generates a preview of the certificate
	GeneratePreview(ctx context.Context, template *domain.CertificateTemplate, data map[string]interface{}) ([]byte, error)

	// ValidateTemplate validates a certificate template
	ValidateTemplate(ctx context.Context, templatePath string) error
}

// ============================================================
// Storage Interface
// ============================================================

// CertificateStorage defines the interface for certificate file storage
type CertificateStorage interface {
	// Store stores a certificate file
	Store(ctx context.Context, certificateID uuid.UUID, data []byte, format domain.CertificateFormat) (string, error)

	// Retrieve retrieves a certificate file
	Retrieve(ctx context.Context, certificateID uuid.UUID, format domain.CertificateFormat) ([]byte, error)

	// Delete deletes a certificate file
	Delete(ctx context.Context, certificateID uuid.UUID, format domain.CertificateFormat) error

	// Exists checks if a certificate file exists
	Exists(ctx context.Context, certificateID uuid.UUID, format domain.CertificateFormat) (bool, error)

	// GetURL gets the URL for a certificate file
	GetURL(ctx context.Context, certificateID uuid.UUID, format domain.CertificateFormat) (string, error)
}
