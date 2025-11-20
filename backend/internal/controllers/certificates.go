package controllers

import (
	"strconv"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/certificates/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/certificates/ports"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// CertificateController handles certificate-related HTTP requests
type CertificateController struct {
	certificateService ports.CertificateService
}

// NewCertificateController creates a new CertificateController
func NewCertificateController(certificateService ports.CertificateService) *CertificateController {
	return &CertificateController{
		certificateService: certificateService,
	}
}

// ============================================================================
// Student Certificate Operations
// ============================================================================

// GetMyCertificate retrieves the certificate for the current user in a course
// GET /api/v1/courses/:courseId/certificates/me
func (ctrl *CertificateController) GetMyCertificate(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("courseId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	certificate, err := ctrl.certificateService.GetMyCertificate(c.Context(), courseID, userID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Certificate retrieved successfully", certificate)
}

// GetMyCertificates retrieves all certificates for the current user
// GET /api/v1/certificates/me
func (ctrl *CertificateController) GetMyCertificates(c *fiber.Ctx) error {
	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Call service
	response, err := ctrl.certificateService.GetMyCertificates(c.Context(), userID, tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Certificates retrieved successfully", response)
}

// DownloadMyCertificate downloads a certificate file for the current user
// GET /api/v1/certificates/:certificateId/download
func (ctrl *CertificateController) DownloadMyCertificate(c *fiber.Ctx) error {
	// Get certificate ID from params
	certificateID, err := uuid.Parse(c.Params("certificateId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid certificate ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Get format from query (default: pdf)
	formatStr := c.Query("format", "pdf")
	format := domain.CertificateFormat(formatStr)

	// Validate format
	if !domain.ValidateCertificateFormat(format) {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid certificate format. Use 'pdf' or 'json'")
	}

	// Call service
	data, filename, err := ctrl.certificateService.DownloadCertificate(c.Context(), certificateID, userID, tenantID, format)
	if err != nil {
		return HandleError(c, err)
	}

	// Set content type based on format
	var contentType string
	switch format {
	case domain.CertificateFormatPDF:
		contentType = "application/pdf"
	case domain.CertificateFormatJSON:
		contentType = "application/json"
	default:
		contentType = "application/octet-stream"
	}

	// Set headers
	c.Set("Content-Type", contentType)
	c.Set("Content-Disposition", "attachment; filename=\""+filename+"\"")
	c.Set("Content-Length", strconv.Itoa(len(data)))

	return c.Send(data)
}

// VerifyMyCertificate verifies a certificate for the current user
// POST /api/v1/certificates/verify/me
func (ctrl *CertificateController) VerifyMyCertificate(c *fiber.Ctx) error {
	// Parse request body
	var req domain.VerifyCertificateRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	response, err := ctrl.certificateService.VerifyMyCertificate(c.Context(), req.CertificateNumber, req.VerificationCode, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Certificate verified successfully", response)
}

// ============================================================================
// Instructor/Admin Certificate Management
// ============================================================================

// GenerateCertificate generates a new certificate
// POST /api/v1/certificates
func (ctrl *CertificateController) GenerateCertificate(c *fiber.Ctx) error {
	// Parse request body
	var req domain.GenerateCertificateRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	certificate, err := ctrl.certificateService.GenerateCertificate(c.Context(), tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Certificate generated successfully", certificate)
}

// GetCertificate retrieves a certificate by ID (instructor/admin)
// GET /api/v1/certificates/:certificateId
func (ctrl *CertificateController) GetCertificate(c *fiber.Ctx) error {
	// Get certificate ID from params
	certificateID, err := uuid.Parse(c.Params("certificateId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid certificate ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	certificate, err := ctrl.certificateService.GetCertificate(c.Context(), certificateID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Certificate retrieved successfully", certificate)
}

// ListCourseCertificates retrieves all certificates for a course (instructor/admin)
// GET /api/v1/courses/:courseId/certificates
func (ctrl *CertificateController) ListCourseCertificates(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("courseId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Call service
	response, err := ctrl.certificateService.ListCourseCertificates(c.Context(), courseID, tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course certificates retrieved successfully", response)
}

// ListUserCertificates retrieves all certificates for a user (instructor/admin)
// GET /api/v1/users/:userId/certificates
func (ctrl *CertificateController) ListUserCertificates(c *fiber.Ctx) error {
	// Get user ID from params
	userID, err := uuid.Parse(c.Params("userId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Call service
	response, err := ctrl.certificateService.ListUserCertificates(c.Context(), userID, tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "User certificates retrieved successfully", response)
}

// RevokeCertificate revokes a certificate (instructor/admin)
// POST /api/v1/certificates/:certificateId/revoke
func (ctrl *CertificateController) RevokeCertificate(c *fiber.Ctx) error {
	// Get certificate ID from params
	certificateID, err := uuid.Parse(c.Params("certificateId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid certificate ID")
	}

	// Parse request body
	var req domain.RevokeCertificateRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get user ID from context (who is revoking)
	revokedBy, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	err = ctrl.certificateService.RevokeCertificate(c.Context(), certificateID, tenantID, revokedBy, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Certificate revoked successfully", nil)
}

// DeleteCertificate deletes a certificate (instructor/admin)
// DELETE /api/v1/certificates/:certificateId
func (ctrl *CertificateController) DeleteCertificate(c *fiber.Ctx) error {
	// Get certificate ID from params
	certificateID, err := uuid.Parse(c.Params("certificateId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid certificate ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	err = ctrl.certificateService.DeleteCertificate(c.Context(), certificateID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Certificate deleted successfully", nil)
}

// ============================================================================
// Certificate Verification (Public)
// ============================================================================

// VerifyCertificate verifies a certificate (public endpoint)
// POST /api/v1/public/certificates/verify
func (ctrl *CertificateController) VerifyCertificate(c *fiber.Ctx) error {
	// Parse request body
	var req domain.VerifyCertificateRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get tenant ID from context (or from request if public)
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	response, err := ctrl.certificateService.VerifyCertificate(c.Context(), &req, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Certificate verification completed", response)
}

// ============================================================================
// Certificate Statistics
// ============================================================================

// GetCertificateStatistics retrieves certificate statistics
// GET /api/v1/certificates/statistics
func (ctrl *CertificateController) GetCertificateStatistics(c *fiber.Ctx) error {
	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	statistics, err := ctrl.certificateService.GetCertificateStatistics(c.Context(), tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Certificate statistics retrieved successfully", statistics)
}

// GetCourseStatistics retrieves certificate statistics for a course
// GET /api/v1/courses/:courseId/certificates/statistics
func (ctrl *CertificateController) GetCourseStatistics(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("courseId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	statistics, err := ctrl.certificateService.GetCourseStatistics(c.Context(), courseID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course certificate statistics retrieved successfully", statistics)
}

// ============================================================================
// Template Management
// ============================================================================

// CreateTemplate creates a new certificate template
// POST /api/v1/certificates/templates
func (ctrl *CertificateController) CreateTemplate(c *fiber.Ctx) error {
	// Parse request body
	var req domain.CreateTemplateRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get user ID from context (creator)
	createdBy, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	template, err := ctrl.certificateService.CreateTemplate(c.Context(), tenantID, createdBy, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Template created successfully", template)
}

// GetTemplate retrieves a template by ID
// GET /api/v1/certificates/templates/:templateId
func (ctrl *CertificateController) GetTemplate(c *fiber.Ctx) error {
	// Get template ID from params
	templateID, err := uuid.Parse(c.Params("templateId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid template ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	template, err := ctrl.certificateService.GetTemplate(c.Context(), templateID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Template retrieved successfully", template)
}

// ListTemplates retrieves all templates
// GET /api/v1/certificates/templates
func (ctrl *CertificateController) ListTemplates(c *fiber.Ctx) error {
	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Call service
	templates, totalCount, err := ctrl.certificateService.ListTemplates(c.Context(), tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	// Calculate total pages
	totalPages := (totalCount + pageSize - 1) / pageSize

	// Build paginated response
	response := map[string]interface{}{
		"items":      templates,
		"page":       page,
		"pageSize":   pageSize,
		"totalCount": totalCount,
		"totalPages": totalPages,
	}

	return SuccessResponse(c, fiber.StatusOK, "Templates retrieved successfully", response)
}

// UpdateTemplate updates a template
// PUT /api/v1/certificates/templates/:templateId
func (ctrl *CertificateController) UpdateTemplate(c *fiber.Ctx) error {
	// Get template ID from params
	templateID, err := uuid.Parse(c.Params("templateId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid template ID")
	}

	// Parse request body
	var req domain.UpdateTemplateRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	template, err := ctrl.certificateService.UpdateTemplate(c.Context(), templateID, tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Template updated successfully", template)
}

// DeleteTemplate deletes a template
// DELETE /api/v1/certificates/templates/:templateId
func (ctrl *CertificateController) DeleteTemplate(c *fiber.Ctx) error {
	// Get template ID from params
	templateID, err := uuid.Parse(c.Params("templateId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid template ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	err = ctrl.certificateService.DeleteTemplate(c.Context(), templateID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Template deleted successfully", nil)
}

// SetDefaultTemplate sets a template as the default
// POST /api/v1/certificates/templates/:templateId/set-default
func (ctrl *CertificateController) SetDefaultTemplate(c *fiber.Ctx) error {
	// Get template ID from params
	templateID, err := uuid.Parse(c.Params("templateId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid template ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	err = ctrl.certificateService.SetDefaultTemplate(c.Context(), templateID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Default template set successfully", nil)
}

// ============================================================================
// System Operations
// ============================================================================

// RegenerateCertificate regenerates a certificate (re-creates PDF)
// POST /api/v1/certificates/:certificateId/regenerate
func (ctrl *CertificateController) RegenerateCertificate(c *fiber.Ctx) error {
	// Get certificate ID from params
	certificateID, err := uuid.Parse(c.Params("certificateId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid certificate ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	certificate, err := ctrl.certificateService.RegenerateCertificate(c.Context(), certificateID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Certificate regenerated successfully", certificate)
}

// BulkGenerateCertificates generates certificates for all eligible students in a course
// POST /api/v1/courses/:courseId/certificates/bulk-generate
func (ctrl *CertificateController) BulkGenerateCertificates(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("courseId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	count, err := ctrl.certificateService.BulkGenerateCertificates(c.Context(), courseID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	response := map[string]interface{}{
		"generated": count,
		"courseId":  courseID,
	}

	return SuccessResponse(c, fiber.StatusOK, "Bulk certificate generation completed", response)
}
