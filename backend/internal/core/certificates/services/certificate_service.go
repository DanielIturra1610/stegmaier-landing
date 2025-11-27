package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/certificates/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/certificates/ports"
	"github.com/google/uuid"
)

// CertificateService implements the CertificateService interface
type CertificateService struct {
	repo      ports.CertificateRepository
	generator ports.CertificateGenerator
	storage   ports.CertificateStorage
	baseURL   string
}

// NewCertificateService creates a new certificate service
func NewCertificateService(
	repo ports.CertificateRepository,
	generator ports.CertificateGenerator,
	storage ports.CertificateStorage,
	baseURL string,
) ports.CertificateService {
	return &CertificateService{
		repo:      repo,
		generator: generator,
		storage:   storage,
		baseURL:   baseURL,
	}
}

// ============================================================
// Student Certificate Operations
// ============================================================

// GetMyCertificate retrieves the certificate for the current user in a course
func (s *CertificateService) GetMyCertificate(ctx context.Context, courseID, userID, tenantID uuid.UUID) (*domain.CertificateDetailResponse, error) {
	log.Printf("[CertificateService] GetMyCertificate - userID: %s, courseID: %s", userID, courseID)

	// Get certificate
	cert, err := s.repo.GetCertificateByUserAndCourse(ctx, userID, courseID, tenantID)
	if err != nil {
		log.Printf("[CertificateService] Error getting certificate: %v", err)
		return nil, err
	}

	// Verify ownership
	if cert.UserID != userID {
		return nil, ports.ErrNotCertificateOwner
	}

	return domain.CertificateToDetailResponse(cert, s.baseURL), nil
}

// GetMyCertificates retrieves all certificates for the current user
func (s *CertificateService) GetMyCertificates(ctx context.Context, userID, tenantID uuid.UUID, page, pageSize int) (*domain.ListCertificatesResponse, error) {
	log.Printf("[CertificateService] GetMyCertificates - userID: %s", userID)

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Get certificates
	certificates, totalCount, err := s.repo.ListCertificatesByUser(ctx, userID, tenantID, page, pageSize)
	if err != nil {
		log.Printf("[CertificateService] Error listing certificates: %v", err)
		return nil, err
	}

	return domain.CertificatesToListResponse(certificates, totalCount, page, pageSize), nil
}

// DownloadCertificate downloads a certificate file for the current user
func (s *CertificateService) DownloadCertificate(ctx context.Context, certificateID, userID, tenantID uuid.UUID, format domain.CertificateFormat) ([]byte, string, error) {
	log.Printf("[CertificateService] DownloadCertificate - certificateID: %s, userID: %s, format: %s", certificateID, userID, format)

	// Validate format
	if !domain.ValidateCertificateFormat(format) {
		return nil, "", ports.ErrInvalidFormat
	}

	// Get certificate
	cert, err := s.repo.GetCertificate(ctx, certificateID, tenantID)
	if err != nil {
		log.Printf("[CertificateService] Error getting certificate: %v", err)
		return nil, "", err
	}

	// Verify ownership
	if cert.UserID != userID {
		return nil, "", ports.ErrNotCertificateOwner
	}

	// Check if certificate is valid
	if !cert.IsValid() {
		return nil, "", ports.ErrCertificateNotValid
	}

	// Check if file exists in storage
	exists, err := s.storage.Exists(ctx, certificateID, format)
	if err != nil {
		log.Printf("[CertificateService] Error checking file existence: %v", err)
		return nil, "", ports.ErrStorageFailed
	}

	var data []byte
	if exists {
		// Retrieve from storage
		data, err = s.storage.Retrieve(ctx, certificateID, format)
		if err != nil {
			log.Printf("[CertificateService] Error retrieving file: %v", err)
			return nil, "", ports.ErrFileDownloadFailed
		}
	} else if format == domain.CertificateFormatPDF {
		// Generate PDF if it doesn't exist
		template, err := s.getTemplateForCertificate(ctx, cert, tenantID)
		if err != nil {
			log.Printf("[CertificateService] Error getting template: %v", err)
			return nil, "", ports.ErrTemplateLoadFailed
		}

		data, err = s.generator.GeneratePDF(ctx, cert, template, s.buildTemplateData(cert))
		if err != nil {
			log.Printf("[CertificateService] Error generating PDF: %v", err)
			return nil, "", ports.ErrPDFGenerationFailed
		}

		// Store for future use
		_, err = s.storage.Store(ctx, certificateID, data, format)
		if err != nil {
			log.Printf("[CertificateService] Warning: Failed to store generated PDF: %v", err)
			// Don't fail the download if storage fails
		}
	} else {
		return nil, "", ports.ErrInvalidFormat
	}

	filename := fmt.Sprintf("certificate_%s.%s", cert.CertificateNumber, format)
	return data, filename, nil
}

// VerifyMyCertificate verifies a certificate for the current user
func (s *CertificateService) VerifyMyCertificate(ctx context.Context, certificateNumber, verificationCode string, tenantID uuid.UUID) (*domain.CertificateVerificationResponse, error) {
	log.Printf("[CertificateService] VerifyMyCertificate - certificateNumber: %s", certificateNumber)

	// Verify certificate
	cert, err := s.repo.VerifyCertificate(ctx, certificateNumber, verificationCode, tenantID)
	if err != nil {
		log.Printf("[CertificateService] Error verifying certificate: %v", err)
		return nil, err
	}

	return domain.CertificateToVerificationResponse(cert), nil
}

// ============================================================
// Instructor/Admin Certificate Management
// ============================================================

// GenerateCertificate generates a new certificate
func (s *CertificateService) GenerateCertificate(ctx context.Context, tenantID uuid.UUID, req *domain.GenerateCertificateRequest) (*domain.CertificateResponse, error) {
	log.Printf("[CertificateService] GenerateCertificate - userID: %s, courseID: %s", req.UserID, req.CourseID)

	// Validate request
	if err := req.Validate(); err != nil {
		return nil, err
	}

	// Check if certificate already exists
	exists, err := s.repo.CertificateExists(ctx, req.UserID, req.CourseID, tenantID)
	if err != nil {
		log.Printf("[CertificateService] Error checking certificate existence: %v", err)
		return nil, err
	}
	if exists {
		return nil, ports.ErrCertificateAlreadyExists
	}

	// Set default completion date if not provided
	completionDate := time.Now().UTC()
	if req.CompletionDate != nil {
		completionDate = *req.CompletionDate
	}

	// Create certificate
	cert := domain.NewCertificate(
		tenantID,
		req.UserID,
		req.CourseID,
		req.EnrollmentID,
		req.ProgressID,
		completionDate,
		0, // Total time spent - would come from progress
	)

	// Set optional fields
	if req.Grade != nil {
		cert.SetGrade(*req.Grade)
	}
	if req.TemplateID != nil {
		cert.SetTemplate(*req.TemplateID)
	}

	// Save to repository
	if err := s.repo.CreateCertificate(ctx, cert); err != nil {
		log.Printf("[CertificateService] Error creating certificate: %v", err)
		return nil, ports.ErrCertificateCreationFailed
	}

	// Generate PDF in background (don't wait for it)
	go func() {
		bgCtx := context.Background()
		template, err := s.getTemplateForCertificate(bgCtx, cert, tenantID)
		if err != nil {
			log.Printf("[CertificateService] Error getting template for PDF generation: %v", err)
			return
		}

		pdfData, err := s.generator.GeneratePDF(bgCtx, cert, template, s.buildTemplateData(cert))
		if err != nil {
			log.Printf("[CertificateService] Error generating PDF: %v", err)
			return
		}

		_, err = s.storage.Store(bgCtx, cert.ID, pdfData, domain.CertificateFormatPDF)
		if err != nil {
			log.Printf("[CertificateService] Error storing PDF: %v", err)
		}
	}()

	return domain.CertificateToResponse(cert), nil
}

// GetCertificate retrieves a certificate by ID (instructor/admin)
func (s *CertificateService) GetCertificate(ctx context.Context, certificateID, tenantID uuid.UUID) (*domain.CertificateDetailResponse, error) {
	log.Printf("[CertificateService] GetCertificate - certificateID: %s", certificateID)

	// Get certificate
	cert, err := s.repo.GetCertificate(ctx, certificateID, tenantID)
	if err != nil {
		log.Printf("[CertificateService] Error getting certificate: %v", err)
		return nil, err
	}

	return domain.CertificateToDetailResponse(cert, s.baseURL), nil
}

// ListCourseCertificates retrieves all certificates for a course (instructor/admin)
func (s *CertificateService) ListCourseCertificates(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) (*domain.ListCertificatesResponse, error) {
	log.Printf("[CertificateService] ListCourseCertificates - courseID: %s", courseID)

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Get certificates
	certificates, totalCount, err := s.repo.ListCertificatesByCourse(ctx, courseID, tenantID, page, pageSize)
	if err != nil {
		log.Printf("[CertificateService] Error listing certificates: %v", err)
		return nil, err
	}

	return domain.CertificatesToListResponse(certificates, totalCount, page, pageSize), nil
}

// ListUserCertificates retrieves all certificates for a user (instructor/admin)
func (s *CertificateService) ListUserCertificates(ctx context.Context, userID, tenantID uuid.UUID, page, pageSize int) (*domain.ListCertificatesResponse, error) {
	log.Printf("[CertificateService] ListUserCertificates - userID: %s", userID)

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Get certificates
	certificates, totalCount, err := s.repo.ListCertificatesByUser(ctx, userID, tenantID, page, pageSize)
	if err != nil {
		log.Printf("[CertificateService] Error listing certificates: %v", err)
		return nil, err
	}

	return domain.CertificatesToListResponse(certificates, totalCount, page, pageSize), nil
}

// RevokeCertificate revokes a certificate (instructor/admin)
func (s *CertificateService) RevokeCertificate(ctx context.Context, certificateID, tenantID, revokedBy uuid.UUID, req *domain.RevokeCertificateRequest) error {
	log.Printf("[CertificateService] RevokeCertificate - certificateID: %s", certificateID)

	// Validate request
	if err := req.Validate(); err != nil {
		return err
	}

	// Get certificate
	cert, err := s.repo.GetCertificate(ctx, certificateID, tenantID)
	if err != nil {
		log.Printf("[CertificateService] Error getting certificate: %v", err)
		return err
	}

	// Check if already revoked
	if cert.IsRevoked() {
		return ports.ErrCertificateAlreadyRevoked
	}

	// Revoke certificate using repository method
	if err := s.repo.RevokeCertificate(ctx, certificateID, tenantID, revokedBy, req.Reason); err != nil {
		log.Printf("[CertificateService] Error revoking certificate: %v", err)
		return ports.ErrCannotRevokeCertificate
	}

	return nil
}

// DeleteCertificate deletes a certificate (instructor/admin)
func (s *CertificateService) DeleteCertificate(ctx context.Context, certificateID, tenantID uuid.UUID) error {
	log.Printf("[CertificateService] DeleteCertificate - certificateID: %s", certificateID)

	// Delete from repository
	if err := s.repo.DeleteCertificate(ctx, certificateID, tenantID); err != nil {
		log.Printf("[CertificateService] Error deleting certificate: %v", err)
		return ports.ErrCertificateDeletionFailed
	}

	// Delete from storage (don't fail if this fails)
	for _, format := range []domain.CertificateFormat{domain.CertificateFormatPDF} {
		exists, err := s.storage.Exists(ctx, certificateID, format)
		if err == nil && exists {
			if err := s.storage.Delete(ctx, certificateID, format); err != nil {
				log.Printf("[CertificateService] Warning: Failed to delete certificate file: %v", err)
			}
		}
	}

	return nil
}

// ============================================================
// Certificate Verification (Public)
// ============================================================

// VerifyCertificate verifies a certificate (public endpoint)
func (s *CertificateService) VerifyCertificate(ctx context.Context, req *domain.VerifyCertificateRequest, tenantID uuid.UUID) (*domain.CertificateVerificationResponse, error) {
	log.Printf("[CertificateService] VerifyCertificate - certificateNumber: %s", req.CertificateNumber)

	// Validate request
	if err := req.Validate(); err != nil {
		return nil, err
	}

	// Verify certificate
	cert, err := s.repo.VerifyCertificate(ctx, req.CertificateNumber, req.VerificationCode, tenantID)
	if err != nil {
		log.Printf("[CertificateService] Error verifying certificate: %v", err)
		return nil, ports.ErrVerificationFailed
	}

	return domain.CertificateToVerificationResponse(cert), nil
}

// ============================================================
// Certificate Statistics
// ============================================================

// GetCertificateStatistics retrieves certificate statistics
func (s *CertificateService) GetCertificateStatistics(ctx context.Context, tenantID uuid.UUID) (*domain.CertificateStatisticsResponse, error) {
	log.Printf("[CertificateService] GetCertificateStatistics - tenantID: %s", tenantID)

	// Get statistics
	stats, err := s.repo.GetCertificateStatistics(ctx, tenantID)
	if err != nil {
		log.Printf("[CertificateService] Error getting statistics: %v", err)
		return nil, ports.ErrStatisticsFailed
	}

	return stats, nil
}

// GetCourseStatistics retrieves certificate statistics for a course
func (s *CertificateService) GetCourseStatistics(ctx context.Context, courseID, tenantID uuid.UUID) (*domain.CertificateStatisticsResponse, error) {
	log.Printf("[CertificateService] GetCourseStatistics - courseID: %s", courseID)

	// Get statistics
	stats, err := s.repo.GetCourseStatistics(ctx, courseID, tenantID)
	if err != nil {
		log.Printf("[CertificateService] Error getting course statistics: %v", err)
		return nil, ports.ErrStatisticsFailed
	}

	return stats, nil
}

// ============================================================
// Template Management
// ============================================================

// CreateTemplate creates a new certificate template
func (s *CertificateService) CreateTemplate(ctx context.Context, tenantID, createdBy uuid.UUID, req *domain.CreateTemplateRequest) (*domain.CertificateTemplateResponse, error) {
	log.Printf("[CertificateService] CreateTemplate - name: %s", req.Name)

	// Validate request
	if err := req.Validate(); err != nil {
		return nil, err
	}

	// Validate template file
	if err := s.generator.ValidateTemplate(ctx, req.TemplatePath); err != nil {
		log.Printf("[CertificateService] Invalid template: %v", err)
		return nil, ports.ErrInvalidTemplateData
	}

	// Create template
	template := domain.NewCertificateTemplate(tenantID, req.Name, req.TemplatePath, createdBy)

	// Set optional fields
	if req.Description != nil {
		template.Description = req.Description
	}
	if req.Configuration != nil {
		template.Configuration = *req.Configuration
	}

	// Save to repository
	if err := s.repo.CreateTemplate(ctx, template); err != nil {
		log.Printf("[CertificateService] Error creating template: %v", err)
		return nil, ports.ErrTemplateCreationFailed
	}

	return domain.CertificateTemplateToResponse(template), nil
}

// GetTemplate retrieves a template by ID
func (s *CertificateService) GetTemplate(ctx context.Context, templateID, tenantID uuid.UUID) (*domain.CertificateTemplateResponse, error) {
	log.Printf("[CertificateService] GetTemplate - templateID: %s", templateID)

	// Get template
	template, err := s.repo.GetTemplate(ctx, templateID, tenantID)
	if err != nil {
		log.Printf("[CertificateService] Error getting template: %v", err)
		return nil, err
	}

	return domain.CertificateTemplateToResponse(template), nil
}

// ListTemplates retrieves all templates
func (s *CertificateService) ListTemplates(ctx context.Context, tenantID uuid.UUID, page, pageSize int) ([]*domain.CertificateTemplateResponse, int, error) {
	log.Printf("[CertificateService] ListTemplates - tenantID: %s", tenantID)

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Get templates
	templates, totalCount, err := s.repo.ListTemplates(ctx, tenantID, page, pageSize)
	if err != nil {
		log.Printf("[CertificateService] Error listing templates: %v", err)
		return nil, 0, err
	}

	// Convert to responses
	responses := make([]*domain.CertificateTemplateResponse, len(templates))
	for i, template := range templates {
		responses[i] = domain.CertificateTemplateToResponse(template)
	}

	return responses, totalCount, nil
}

// UpdateTemplate updates a template
func (s *CertificateService) UpdateTemplate(ctx context.Context, templateID, tenantID uuid.UUID, req *domain.UpdateTemplateRequest) (*domain.CertificateTemplateResponse, error) {
	log.Printf("[CertificateService] UpdateTemplate - templateID: %s", templateID)

	// Validate request
	if err := req.Validate(); err != nil {
		return nil, err
	}

	// Check if there are any updates
	if !req.HasUpdates() {
		return nil, ports.ErrInvalidTemplateData
	}

	// Get template
	template, err := s.repo.GetTemplate(ctx, templateID, tenantID)
	if err != nil {
		log.Printf("[CertificateService] Error getting template: %v", err)
		return nil, err
	}

	// Update fields
	if req.Name != nil {
		template.Name = *req.Name
	}
	if req.Description != nil {
		template.Description = req.Description
	}
	if req.TemplatePath != nil {
		// Validate new template path
		if err := s.generator.ValidateTemplate(ctx, *req.TemplatePath); err != nil {
			log.Printf("[CertificateService] Invalid template path: %v", err)
			return nil, ports.ErrInvalidTemplateData
		}
		template.TemplatePath = *req.TemplatePath
	}
	if req.Configuration != nil {
		template.Configuration = *req.Configuration
	}

	template.UpdateTimestamp()

	// Save to repository
	if err := s.repo.UpdateTemplate(ctx, template); err != nil {
		log.Printf("[CertificateService] Error updating template: %v", err)
		return nil, ports.ErrTemplateUpdateFailed
	}

	return domain.CertificateTemplateToResponse(template), nil
}

// DeleteTemplate deletes a template
func (s *CertificateService) DeleteTemplate(ctx context.Context, templateID, tenantID uuid.UUID) error {
	log.Printf("[CertificateService] DeleteTemplate - templateID: %s", templateID)

	// Get template
	template, err := s.repo.GetTemplate(ctx, templateID, tenantID)
	if err != nil {
		log.Printf("[CertificateService] Error getting template: %v", err)
		return err
	}

	// Cannot delete default template
	if template.IsDefault {
		return ports.ErrCannotDeleteDefaultTemplate
	}

	// Delete from repository
	if err := s.repo.DeleteTemplate(ctx, templateID, tenantID); err != nil {
		log.Printf("[CertificateService] Error deleting template: %v", err)
		return ports.ErrTemplateDeletionFailed
	}

	return nil
}

// SetDefaultTemplate sets a template as the default
func (s *CertificateService) SetDefaultTemplate(ctx context.Context, templateID, tenantID uuid.UUID) error {
	log.Printf("[CertificateService] SetDefaultTemplate - templateID: %s", templateID)

	// Get template
	template, err := s.repo.GetTemplate(ctx, templateID, tenantID)
	if err != nil {
		log.Printf("[CertificateService] Error getting template: %v", err)
		return err
	}

	// Check if template is active
	if !template.IsActive {
		return ports.ErrTemplateNotActive
	}

	// Set as default
	if err := s.repo.SetDefaultTemplate(ctx, templateID, tenantID); err != nil {
		log.Printf("[CertificateService] Error setting default template: %v", err)
		return ports.ErrTemplateUpdateFailed
	}

	return nil
}

// ============================================================
// System Operations
// ============================================================

// RegenerateCertificate regenerates a certificate (re-creates PDF)
func (s *CertificateService) RegenerateCertificate(ctx context.Context, certificateID, tenantID uuid.UUID) (*domain.CertificateResponse, error) {
	log.Printf("[CertificateService] RegenerateCertificate - certificateID: %s", certificateID)

	// Get certificate
	cert, err := s.repo.GetCertificate(ctx, certificateID, tenantID)
	if err != nil {
		log.Printf("[CertificateService] Error getting certificate: %v", err)
		return nil, err
	}

	// Get template
	template, err := s.getTemplateForCertificate(ctx, cert, tenantID)
	if err != nil {
		log.Printf("[CertificateService] Error getting template: %v", err)
		return nil, ports.ErrTemplateLoadFailed
	}

	// Generate PDF
	pdfData, err := s.generator.GeneratePDF(ctx, cert, template, s.buildTemplateData(cert))
	if err != nil {
		log.Printf("[CertificateService] Error generating PDF: %v", err)
		return nil, ports.ErrPDFGenerationFailed
	}

	// Store PDF
	_, err = s.storage.Store(ctx, cert.ID, pdfData, domain.CertificateFormatPDF)
	if err != nil {
		log.Printf("[CertificateService] Error storing PDF: %v", err)
		return nil, ports.ErrFileUploadFailed
	}

	return domain.CertificateToResponse(cert), nil
}

// BulkGenerateCertificates generates certificates for all eligible students in a course
func (s *CertificateService) BulkGenerateCertificates(ctx context.Context, courseID, tenantID uuid.UUID) (int, error) {
	log.Printf("[CertificateService] BulkGenerateCertificates - courseID: %s", courseID)

	// This is a placeholder implementation
	// In a real system, this would:
	// 1. Get all enrollments for the course
	// 2. Check progress for each enrollment
	// 3. Generate certificates for completed enrollments that don't have one
	// 4. Return count of generated certificates

	// For now, return 0 as this requires integration with enrollment and progress modules
	log.Printf("[CertificateService] Bulk generation not yet implemented")
	return 0, nil
}

// ============================================================
// Helper Methods
// ============================================================

// getTemplateForCertificate gets the template to use for a certificate
func (s *CertificateService) getTemplateForCertificate(ctx context.Context, cert *domain.Certificate, tenantID uuid.UUID) (*domain.CertificateTemplate, error) {
	// If certificate has a specific template, use it
	if cert.TemplateID != nil {
		return s.repo.GetTemplate(ctx, *cert.TemplateID, tenantID)
	}

	// Otherwise, use the default template
	template, err := s.repo.GetDefaultTemplate(ctx, tenantID)
	if err != nil {
		return nil, ports.ErrNoDefaultTemplate
	}

	return template, nil
}

// buildTemplateData builds the data map for template rendering
func (s *CertificateService) buildTemplateData(cert *domain.Certificate) map[string]interface{} {
	data := map[string]interface{}{
		"certificateNumber": cert.CertificateNumber,
		"verificationCode":  cert.VerificationCode,
		"issuedAt":          cert.IssuedAt,
		"completionDate":    cert.CompletionDate,
		"userId":            cert.UserID.String(),
		"courseId":          cert.CourseID.String(),
	}

	if cert.Grade != nil {
		data["grade"] = *cert.Grade
	}

	if cert.ExpiresAt != nil {
		data["expiresAt"] = *cert.ExpiresAt
	}

	// Add metadata
	for key, value := range cert.Metadata {
		data[key] = value
	}

	return data
}
