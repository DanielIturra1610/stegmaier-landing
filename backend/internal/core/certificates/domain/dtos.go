package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// ============================================================
// Request DTOs
// ============================================================

// GenerateCertificateRequest represents a request to generate a certificate
type GenerateCertificateRequest struct {
	UserID         uuid.UUID  `json:"userId"`
	CourseID       uuid.UUID  `json:"courseId"`
	EnrollmentID   uuid.UUID  `json:"enrollmentId"`
	ProgressID     uuid.UUID  `json:"progressId"`
	CompletionDate *time.Time `json:"completionDate,omitempty"` // Optional, defaults to now
	Grade          *float64   `json:"grade,omitempty"`
	TemplateID     *uuid.UUID `json:"templateId,omitempty"`
}

// VerifyCertificateRequest represents a request to verify a certificate
type VerifyCertificateRequest struct {
	CertificateNumber string `json:"certificateNumber"`
	VerificationCode  string `json:"verificationCode"`
}

// RevokeCertificateRequest represents a request to revoke a certificate
type RevokeCertificateRequest struct {
	Reason string `json:"reason"`
}

// ListCertificatesRequest represents a request to list certificates
type ListCertificatesRequest struct {
	Page         int                `json:"page"`
	PageSize     int                `json:"pageSize"`
	UserID       *uuid.UUID         `json:"userId,omitempty"`
	CourseID     *uuid.UUID         `json:"courseId,omitempty"`
	Status       *CertificateStatus `json:"status,omitempty"`
	IssuedAfter  *time.Time         `json:"issuedAfter,omitempty"`
	IssuedBefore *time.Time         `json:"issuedBefore,omitempty"`
	SortBy       *string            `json:"sortBy,omitempty"`    // issued_at, certificate_number
	SortOrder    *string            `json:"sortOrder,omitempty"` // asc, desc
}

// CreateTemplateRequest represents a request to create a certificate template
type CreateTemplateRequest struct {
	Name          string  `json:"name"`
	Description   *string `json:"description,omitempty"`
	TemplatePath  string  `json:"templatePath"`
	Configuration *string `json:"configuration,omitempty"`
}

// UpdateTemplateRequest represents a request to update a certificate template
type UpdateTemplateRequest struct {
	Name          *string `json:"name,omitempty"`
	Description   *string `json:"description,omitempty"`
	TemplatePath  *string `json:"templatePath,omitempty"`
	Configuration *string `json:"configuration,omitempty"`
}

// ============================================================
// Response DTOs
// ============================================================

// CertificateResponse represents a certificate in responses
type CertificateResponse struct {
	ID                uuid.UUID         `json:"id"`
	TenantID          uuid.UUID         `json:"tenantId"`
	UserID            uuid.UUID         `json:"userId"`
	UserName          *string           `json:"userName,omitempty"`          // Populated from user service
	CourseID          uuid.UUID         `json:"courseId"`
	CourseName        *string           `json:"courseName,omitempty"`        // Populated from course
	EnrollmentID      uuid.UUID         `json:"enrollmentId"`
	ProgressID        uuid.UUID         `json:"progressId"`
	CertificateNumber string            `json:"certificateNumber"`
	Status            CertificateStatus `json:"status"`
	IssuedAt          time.Time         `json:"issuedAt"`
	ExpiresAt         *time.Time        `json:"expiresAt,omitempty"`
	RevokedAt         *time.Time        `json:"revokedAt,omitempty"`
	RevokedBy         *uuid.UUID        `json:"revokedBy,omitempty"`
	RevocationReason  *string           `json:"revocationReason,omitempty"`
	TemplateID        *uuid.UUID        `json:"templateId,omitempty"`
	CompletionDate    time.Time         `json:"completionDate"`
	Grade             *float64          `json:"grade,omitempty"`
	TotalTimeSpent    int               `json:"totalTimeSpent"`
	IsValid           bool              `json:"isValid"`
	IsExpired         bool              `json:"isExpired"`
	IsRevoked         bool              `json:"isRevoked"`
	CreatedAt         time.Time         `json:"createdAt"`
	UpdatedAt         time.Time         `json:"updatedAt"`
}

// CertificateDetailResponse represents detailed certificate information
type CertificateDetailResponse struct {
	*CertificateResponse
	VerificationCode string            `json:"verificationCode"`
	Metadata         map[string]string `json:"metadata,omitempty"`
	DownloadURL      string            `json:"downloadUrl"`
	VerificationURL  string            `json:"verificationUrl"`
}

// CertificateVerificationResponse represents certificate verification result
type CertificateVerificationResponse struct {
	IsValid           bool              `json:"isValid"`
	CertificateNumber string            `json:"certificateNumber"`
	Status            CertificateStatus `json:"status"`
	UserName          *string           `json:"userName,omitempty"`
	CourseName        *string           `json:"courseName,omitempty"`
	IssuedAt          time.Time         `json:"issuedAt"`
	CompletionDate    time.Time         `json:"completionDate"`
	ExpiresAt         *time.Time        `json:"expiresAt,omitempty"`
	RevokedAt         *time.Time        `json:"revokedAt,omitempty"`
	RevocationReason  *string           `json:"revocationReason,omitempty"`
}

// CertificateTemplateResponse represents a certificate template in responses
type CertificateTemplateResponse struct {
	ID            uuid.UUID  `json:"id"`
	TenantID      uuid.UUID  `json:"tenantId"`
	Name          string     `json:"name"`
	Description   *string    `json:"description,omitempty"`
	TemplatePath  string     `json:"templatePath"`
	IsDefault     bool       `json:"isDefault"`
	IsActive      bool       `json:"isActive"`
	Configuration string     `json:"configuration"`
	CreatedBy     uuid.UUID  `json:"createdBy"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
}

// ListCertificatesResponse represents paginated certificates list
type ListCertificatesResponse struct {
	Certificates []*CertificateResponse `json:"certificates"`
	TotalCount   int                    `json:"totalCount"`
	Page         int                    `json:"page"`
	PageSize     int                    `json:"pageSize"`
	TotalPages   int                    `json:"totalPages"`
}

// CertificateStatisticsResponse represents certificate statistics
type CertificateStatisticsResponse struct {
	TotalCertificates  int     `json:"totalCertificates"`
	IssuedCertificates int     `json:"issuedCertificates"`
	RevokedCertificates int    `json:"revokedCertificates"`
	ExpiredCertificates int    `json:"expiredCertificates"`
	AverageGrade       float64 `json:"averageGrade"`
	AverageTimeSpent   float64 `json:"averageTimeSpent"` // In minutes
}

// ============================================================
// Validation Methods
// ============================================================

// Validate validates the GenerateCertificateRequest
func (r *GenerateCertificateRequest) Validate() error {
	if r.UserID == uuid.Nil {
		return errors.New("user ID is required")
	}
	if r.CourseID == uuid.Nil {
		return errors.New("course ID is required")
	}
	if r.EnrollmentID == uuid.Nil {
		return errors.New("enrollment ID is required")
	}
	if r.ProgressID == uuid.Nil {
		return errors.New("progress ID is required")
	}
	if r.Grade != nil {
		if *r.Grade < 0 || *r.Grade > 100 {
			return errors.New("grade must be between 0 and 100")
		}
	}
	return nil
}

// Validate validates the VerifyCertificateRequest
func (r *VerifyCertificateRequest) Validate() error {
	if r.CertificateNumber == "" {
		return errors.New("certificate number is required")
	}
	if r.VerificationCode == "" {
		return errors.New("verification code is required")
	}
	return nil
}

// Validate validates the RevokeCertificateRequest
func (r *RevokeCertificateRequest) Validate() error {
	if r.Reason == "" {
		return errors.New("revocation reason is required")
	}
	if len(r.Reason) < 10 {
		return errors.New("revocation reason must be at least 10 characters")
	}
	if len(r.Reason) > 500 {
		return errors.New("revocation reason cannot exceed 500 characters")
	}
	return nil
}

// Validate validates the ListCertificatesRequest
func (r *ListCertificatesRequest) Validate() error {
	if r.Page < 1 {
		r.Page = 1
	}
	if r.PageSize < 1 {
		r.PageSize = 20
	}
	if r.PageSize > 100 {
		r.PageSize = 100
	}
	if r.IssuedAfter != nil && r.IssuedBefore != nil {
		if r.IssuedAfter.After(*r.IssuedBefore) {
			return errors.New("issued after date cannot be after issued before date")
		}
	}
	if r.Status != nil && !ValidateCertificateStatus(*r.Status) {
		return errors.New("invalid certificate status")
	}
	if r.SortBy != nil {
		validSortBy := map[string]bool{
			"issued_at":          true,
			"certificate_number": true,
			"completion_date":    true,
		}
		if !validSortBy[*r.SortBy] {
			return errors.New("invalid sort by field")
		}
	}
	if r.SortOrder != nil {
		if *r.SortOrder != "asc" && *r.SortOrder != "desc" {
			return errors.New("sort order must be 'asc' or 'desc'")
		}
	}
	return nil
}

// Validate validates the CreateTemplateRequest
func (r *CreateTemplateRequest) Validate() error {
	if r.Name == "" {
		return errors.New("template name is required")
	}
	if len(r.Name) < 3 {
		return errors.New("template name must be at least 3 characters")
	}
	if r.TemplatePath == "" {
		return errors.New("template path is required")
	}
	return nil
}

// Validate validates the UpdateTemplateRequest
func (r *UpdateTemplateRequest) Validate() error {
	if r.Name != nil && len(*r.Name) < 3 {
		return errors.New("template name must be at least 3 characters")
	}
	return nil
}

// HasUpdates checks if the update request has any updates
func (r *UpdateTemplateRequest) HasUpdates() bool {
	return r.Name != nil || r.Description != nil || r.TemplatePath != nil || r.Configuration != nil
}

// ============================================================
// Conversion Functions
// ============================================================

// CertificateToResponse converts a Certificate entity to CertificateResponse
func CertificateToResponse(cert *Certificate) *CertificateResponse {
	return &CertificateResponse{
		ID:                cert.ID,
		TenantID:          cert.TenantID,
		UserID:            cert.UserID,
		CourseID:          cert.CourseID,
		EnrollmentID:      cert.EnrollmentID,
		ProgressID:        cert.ProgressID,
		CertificateNumber: cert.CertificateNumber,
		Status:            cert.Status,
		IssuedAt:          cert.IssuedAt,
		ExpiresAt:         cert.ExpiresAt,
		RevokedAt:         cert.RevokedAt,
		RevokedBy:         cert.RevokedBy,
		RevocationReason:  cert.RevocationReason,
		TemplateID:        cert.TemplateID,
		CompletionDate:    cert.CompletionDate,
		Grade:             cert.Grade,
		TotalTimeSpent:    cert.TotalTimeSpent,
		IsValid:           cert.IsValid(),
		IsExpired:         cert.IsExpired(),
		IsRevoked:         cert.IsRevoked(),
		CreatedAt:         cert.CreatedAt,
		UpdatedAt:         cert.UpdatedAt,
	}
}

// CertificateToDetailResponse converts a Certificate entity to CertificateDetailResponse
func CertificateToDetailResponse(cert *Certificate, baseURL string) *CertificateDetailResponse {
	return &CertificateDetailResponse{
		CertificateResponse: CertificateToResponse(cert),
		VerificationCode:    cert.VerificationCode,
		Metadata:            cert.Metadata,
		DownloadURL:         baseURL + "/api/v1/certificates/" + cert.ID.String() + "/download",
		VerificationURL:     baseURL + "/api/v1/certificates/verify",
	}
}

// CertificateToVerificationResponse converts a Certificate to verification response
func CertificateToVerificationResponse(cert *Certificate) *CertificateVerificationResponse {
	return &CertificateVerificationResponse{
		IsValid:           cert.IsValid(),
		CertificateNumber: cert.CertificateNumber,
		Status:            cert.Status,
		IssuedAt:          cert.IssuedAt,
		CompletionDate:    cert.CompletionDate,
		ExpiresAt:         cert.ExpiresAt,
		RevokedAt:         cert.RevokedAt,
		RevocationReason:  cert.RevocationReason,
	}
}

// CertificateTemplateToResponse converts a CertificateTemplate to response
func CertificateTemplateToResponse(template *CertificateTemplate) *CertificateTemplateResponse {
	return &CertificateTemplateResponse{
		ID:            template.ID,
		TenantID:      template.TenantID,
		Name:          template.Name,
		Description:   template.Description,
		TemplatePath:  template.TemplatePath,
		IsDefault:     template.IsDefault,
		IsActive:      template.IsActive,
		Configuration: template.Configuration,
		CreatedBy:     template.CreatedBy,
		CreatedAt:     template.CreatedAt,
		UpdatedAt:     template.UpdatedAt,
	}
}

// CertificatesToListResponse converts a slice of certificates to list response
func CertificatesToListResponse(certificates []*Certificate, totalCount, page, pageSize int) *ListCertificatesResponse {
	certResponses := make([]*CertificateResponse, len(certificates))
	for i, cert := range certificates {
		certResponses[i] = CertificateToResponse(cert)
	}

	totalPages := (totalCount + pageSize - 1) / pageSize

	return &ListCertificatesResponse{
		Certificates: certResponses,
		TotalCount:   totalCount,
		Page:         page,
		PageSize:     pageSize,
		TotalPages:   totalPages,
	}
}
