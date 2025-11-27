package domain

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// CertificateStatus represents the status of a certificate
type CertificateStatus string

const (
	CertificateStatusIssued  CertificateStatus = "issued"
	CertificateStatusRevoked CertificateStatus = "revoked"
	CertificateStatusExpired CertificateStatus = "expired"
)

// CertificateFormat represents the format of a certificate
type CertificateFormat string

const (
	CertificateFormatPDF  CertificateFormat = "pdf"
	CertificateFormatJSON CertificateFormat = "json"
)

// ============================================================
// Certificate Entity
// ============================================================

// Certificate represents a course completion certificate
type Certificate struct {
	ID                 uuid.UUID         `json:"id"`
	TenantID           uuid.UUID         `json:"tenantId"`
	UserID             uuid.UUID         `json:"userId"`
	CourseID           uuid.UUID         `json:"courseId"`
	EnrollmentID       uuid.UUID         `json:"enrollmentId"`
	ProgressID         uuid.UUID         `json:"progressId"`
	CertificateNumber  string            `json:"certificateNumber"`  // Unique certificate number
	VerificationCode   string            `json:"verificationCode"`   // Hash for verification
	Status             CertificateStatus `json:"status"`
	IssuedAt           time.Time         `json:"issuedAt"`
	ExpiresAt          *time.Time        `json:"expiresAt,omitempty"`   // Optional expiration
	RevokedAt          *time.Time        `json:"revokedAt,omitempty"`   // When revoked
	RevokedBy          *uuid.UUID        `json:"revokedBy,omitempty"`   // Who revoked it
	RevocationReason   *string           `json:"revocationReason,omitempty"`
	TemplateID         *uuid.UUID        `json:"templateId,omitempty"`  // Certificate template used
	CompletionDate     time.Time         `json:"completionDate"`        // Course completion date
	Grade              *float64          `json:"grade,omitempty"`       // Final grade (optional)
	TotalTimeSpent     int               `json:"totalTimeSpent"`        // Time in minutes
	Metadata           map[string]string `json:"metadata,omitempty"`    // Additional data
	CreatedAt          time.Time         `json:"createdAt"`
	UpdatedAt          time.Time         `json:"updatedAt"`
}

// NewCertificate creates a new certificate
func NewCertificate(
	tenantID, userID, courseID, enrollmentID, progressID uuid.UUID,
	completionDate time.Time,
	totalTimeSpent int,
) *Certificate {
	now := time.Now().UTC()
	id := uuid.New()

	cert := &Certificate{
		ID:                id,
		TenantID:          tenantID,
		UserID:            userID,
		CourseID:          courseID,
		EnrollmentID:      enrollmentID,
		ProgressID:        progressID,
		CertificateNumber: generateCertificateNumber(tenantID, userID, courseID),
		Status:            CertificateStatusIssued,
		IssuedAt:          now,
		CompletionDate:    completionDate,
		TotalTimeSpent:    totalTimeSpent,
		Metadata:          make(map[string]string),
		CreatedAt:         now,
		UpdatedAt:         now,
	}

	// Generate verification code
	cert.VerificationCode = cert.GenerateVerificationCode()

	return cert
}

// GenerateVerificationCode generates a verification code for the certificate
func (c *Certificate) GenerateVerificationCode() string {
	data := fmt.Sprintf("%s:%s:%s:%s:%s",
		c.ID.String(),
		c.UserID.String(),
		c.CourseID.String(),
		c.CertificateNumber,
		c.IssuedAt.Format(time.RFC3339),
	)
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

// VerifyCode verifies if the provided code matches the certificate's verification code
func (c *Certificate) VerifyCode(code string) bool {
	return c.VerificationCode == code
}

// UpdateTimestamp updates the UpdatedAt field
func (c *Certificate) UpdateTimestamp() {
	c.UpdatedAt = time.Now().UTC()
}

// Revoke revokes the certificate
func (c *Certificate) Revoke(revokedBy uuid.UUID, reason string) {
	if c.Status != CertificateStatusRevoked {
		now := time.Now().UTC()
		c.Status = CertificateStatusRevoked
		c.RevokedAt = &now
		c.RevokedBy = &revokedBy
		c.RevocationReason = &reason
		c.UpdateTimestamp()
	}
}

// SetExpiration sets an expiration date for the certificate
func (c *Certificate) SetExpiration(expiresAt time.Time) {
	c.ExpiresAt = &expiresAt
	c.UpdateTimestamp()
}

// IsValid returns true if the certificate is valid (issued and not expired)
func (c *Certificate) IsValid() bool {
	if c.Status != CertificateStatusIssued {
		return false
	}
	if c.ExpiresAt != nil && time.Now().UTC().After(*c.ExpiresAt) {
		return false
	}
	return true
}

// IsRevoked returns true if the certificate has been revoked
func (c *Certificate) IsRevoked() bool {
	return c.Status == CertificateStatusRevoked
}

// IsExpired returns true if the certificate has expired
func (c *Certificate) IsExpired() bool {
	if c.ExpiresAt == nil {
		return false
	}
	return time.Now().UTC().After(*c.ExpiresAt)
}

// SetGrade sets the final grade for the certificate
func (c *Certificate) SetGrade(grade float64) {
	c.Grade = &grade
	c.UpdateTimestamp()
}

// SetTemplate sets the template ID for the certificate
func (c *Certificate) SetTemplate(templateID uuid.UUID) {
	c.TemplateID = &templateID
	c.UpdateTimestamp()
}

// AddMetadata adds metadata to the certificate
func (c *Certificate) AddMetadata(key, value string) {
	if c.Metadata == nil {
		c.Metadata = make(map[string]string)
	}
	c.Metadata[key] = value
	c.UpdateTimestamp()
}

// ============================================================
// Certificate Template Entity
// ============================================================

// CertificateTemplate represents a template for certificate generation
type CertificateTemplate struct {
	ID             uuid.UUID `json:"id"`
	TenantID       uuid.UUID `json:"tenantId"`
	Name           string    `json:"name"`
	Description    *string   `json:"description,omitempty"`
	TemplatePath   string    `json:"templatePath"`   // Path to template file
	IsDefault      bool      `json:"isDefault"`
	IsActive       bool      `json:"isActive"`
	Configuration  string    `json:"configuration"`  // JSON configuration
	CreatedBy      uuid.UUID `json:"createdBy"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// NewCertificateTemplate creates a new certificate template
func NewCertificateTemplate(
	tenantID uuid.UUID,
	name string,
	templatePath string,
	createdBy uuid.UUID,
) *CertificateTemplate {
	now := time.Now().UTC()
	return &CertificateTemplate{
		ID:           uuid.New(),
		TenantID:     tenantID,
		Name:         name,
		TemplatePath: templatePath,
		IsDefault:    false,
		IsActive:     true,
		Configuration: "{}",
		CreatedBy:    createdBy,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
}

// UpdateTimestamp updates the UpdatedAt field
func (ct *CertificateTemplate) UpdateTimestamp() {
	ct.UpdatedAt = time.Now().UTC()
}

// Activate activates the template
func (ct *CertificateTemplate) Activate() {
	ct.IsActive = true
	ct.UpdateTimestamp()
}

// Deactivate deactivates the template
func (ct *CertificateTemplate) Deactivate() {
	ct.IsActive = false
	ct.UpdateTimestamp()
}

// SetAsDefault sets this template as the default
func (ct *CertificateTemplate) SetAsDefault() {
	ct.IsDefault = true
	ct.UpdateTimestamp()
}

// UnsetAsDefault unsets this template as the default
func (ct *CertificateTemplate) UnsetAsDefault() {
	ct.IsDefault = false
	ct.UpdateTimestamp()
}

// ============================================================
// Helper Functions
// ============================================================

// generateCertificateNumber generates a unique certificate number
func generateCertificateNumber(tenantID, userID, courseID uuid.UUID) string {
	timestamp := time.Now().UTC().Unix()
	data := fmt.Sprintf("%s-%s-%s-%d",
		tenantID.String()[:8],
		userID.String()[:8],
		courseID.String()[:8],
		timestamp,
	)
	hash := sha256.Sum256([]byte(data))
	return fmt.Sprintf("CERT-%s", hex.EncodeToString(hash[:])[:16])
}

// ValidateCertificateStatus checks if the certificate status is valid
func ValidateCertificateStatus(status CertificateStatus) bool {
	switch status {
	case CertificateStatusIssued, CertificateStatusRevoked, CertificateStatusExpired:
		return true
	default:
		return false
	}
}

// ValidateCertificateFormat checks if the certificate format is valid
func ValidateCertificateFormat(format CertificateFormat) bool {
	switch format {
	case CertificateFormatPDF, CertificateFormatJSON:
		return true
	default:
		return false
	}
}
