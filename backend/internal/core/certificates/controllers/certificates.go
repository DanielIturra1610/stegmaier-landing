package controllers

import (
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/certificates/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/certificates/ports"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// ============================================================
// Certificate Controller
// ============================================================

// CertificateController handles all HTTP requests for certificates
type CertificateController struct {
	service ports.CertificateService
}

// NewCertificateController creates a new CertificateController instance
func NewCertificateController(service ports.CertificateService) *CertificateController {
	return &CertificateController{
		service: service,
	}
}

// ============================================================
// Student Certificate Endpoints
// ============================================================

// GetMyCertificate godoc
// @Summary Get my certificate for a specific course
// @Description Get the completion certificate for a student's course enrollment
// @Tags Certificates (Student)
// @Accept json
// @Produce json
// @Param courseId path string true "Course ID" format(uuid)
// @Security BearerAuth
// @Success 200 {object} domain.CertificateDetailResponse
// @Failure 400 {object} map[string]string "Invalid course ID"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "Certificate not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /certificates/my/courses/{courseId} [get]
func (c *CertificateController) GetMyCertificate(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Extract user ID from context
	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: user ID not found",
		})
	}

	// Parse course ID from URL parameter
	courseIDStr := ctx.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid course ID format",
		})
	}

	// Get certificate from service
	certificate, err := c.service.GetMyCertificate(ctx.Context(), courseID, userID, tenantID)
	if err != nil {
		switch err {
		case ports.ErrCertificateNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "certificate not found for this course",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to get certificate",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(certificate)
}

// GetMyCertificates godoc
// @Summary Get all my certificates
// @Description Get a paginated list of all certificates earned by the student
// @Tags Certificates (Student)
// @Accept json
// @Produce json
// @Param page query int false "Page number (default: 1)" minimum(1)
// @Param pageSize query int false "Page size (default: 20, max: 100)" minimum(1) maximum(100)
// @Security BearerAuth
// @Success 200 {object} domain.ListCertificatesResponse
// @Failure 400 {object} map[string]string "Invalid pagination parameters"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /certificates/my [get]
func (c *CertificateController) GetMyCertificates(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Extract user ID from context
	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: user ID not found",
		})
	}

	// Parse pagination parameters
	page := ctx.QueryInt("page", 1)
	pageSize := ctx.QueryInt("pageSize", 20)

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Get certificates from service
	certificates, err := c.service.GetMyCertificates(ctx.Context(), userID, tenantID, page, pageSize)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get certificates",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(certificates)
}

// DownloadCertificate godoc
// @Summary Download certificate
// @Description Download a certificate in PDF or JSON format
// @Tags Certificates (Student)
// @Accept json
// @Produce application/pdf,application/json
// @Param certificateId path string true "Certificate ID" format(uuid)
// @Param format query string false "Download format (pdf, json)" default(pdf)
// @Security BearerAuth
// @Success 200 {file} file "Certificate file"
// @Failure 400 {object} map[string]string "Invalid request"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "Certificate not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /certificates/{certificateId}/download [get]
func (c *CertificateController) DownloadCertificate(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Extract user ID from context
	userID, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: user ID not found",
		})
	}

	// Parse certificate ID from URL parameter
	certificateIDStr := ctx.Params("certificateID")
	certificateID, err := uuid.Parse(certificateIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid certificate ID format",
		})
	}

	// Parse format from query parameter
	formatStr := ctx.Query("format", "pdf")
	format := domain.CertificateFormat(formatStr)

	// Validate format
	if format != domain.CertificateFormatPDF && format != domain.CertificateFormatJSON {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid format (must be 'pdf' or 'json')",
		})
	}

	// Download certificate from service
	data, filename, err := c.service.DownloadCertificate(ctx.Context(), certificateID, userID, tenantID, format)
	if err != nil {
		switch err {
		case ports.ErrCertificateNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "certificate not found",
			})
		case ports.ErrUnauthorizedAccess:
			return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "you do not have permission to download this certificate",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to download certificate",
			})
		}
	}

	// Set appropriate content type
	if format == domain.CertificateFormatPDF {
		ctx.Set("Content-Type", "application/pdf")
	} else {
		ctx.Set("Content-Type", "application/json")
	}

	// Set content disposition header
	ctx.Set("Content-Disposition", "attachment; filename=\""+filename+"\"")

	return ctx.Send(data)
}

// ============================================================
// Instructor/Admin Certificate Management Endpoints
// ============================================================

// GenerateCertificate godoc
// @Summary Generate a certificate
// @Description Generate a completion certificate for a student (Admin/Instructor)
// @Tags Certificates (Admin/Instructor)
// @Accept json
// @Produce json
// @Param request body domain.GenerateCertificateRequest true "Certificate generation data"
// @Security BearerAuth
// @Success 201 {object} domain.CertificateResponse
// @Failure 400 {object} map[string]string "Invalid request"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 409 {object} map[string]string "Certificate already exists"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /certificates [post]
func (c *CertificateController) GenerateCertificate(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Parse request body
	var req domain.GenerateCertificateRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Generate certificate via service
	certificate, err := c.service.GenerateCertificate(ctx.Context(), tenantID, &req)
	if err != nil {
		switch err {
		case ports.ErrCertificateAlreadyExists:
			return ctx.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "certificate already exists for this user and course",
			})
		case ports.ErrProgressNotCompleted:
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "course progress must be completed before generating certificate",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to generate certificate",
			})
		}
	}

	return ctx.Status(fiber.StatusCreated).JSON(certificate)
}

// GetCertificate godoc
// @Summary Get certificate details
// @Description Get detailed information about a specific certificate (Admin/Instructor)
// @Tags Certificates (Admin/Instructor)
// @Accept json
// @Produce json
// @Param certificateId path string true "Certificate ID" format(uuid)
// @Security BearerAuth
// @Success 200 {object} domain.CertificateDetailResponse
// @Failure 400 {object} map[string]string "Invalid certificate ID"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "Certificate not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /certificates/{certificateId} [get]
func (c *CertificateController) GetCertificate(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Parse certificate ID from URL parameter
	certificateIDStr := ctx.Params("certificateID")
	certificateID, err := uuid.Parse(certificateIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid certificate ID format",
		})
	}

	// Get certificate from service
	certificate, err := c.service.GetCertificate(ctx.Context(), certificateID, tenantID)
	if err != nil {
		switch err {
		case ports.ErrCertificateNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "certificate not found",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to get certificate",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(certificate)
}

// ListCourseCertificates godoc
// @Summary List certificates for a course
// @Description Get all certificates issued for a specific course (Admin/Instructor)
// @Tags Certificates (Admin/Instructor)
// @Accept json
// @Produce json
// @Param courseId path string true "Course ID" format(uuid)
// @Param page query int false "Page number (default: 1)" minimum(1)
// @Param pageSize query int false "Page size (default: 20, max: 100)" minimum(1) maximum(100)
// @Security BearerAuth
// @Success 200 {object} domain.ListCertificatesResponse
// @Failure 400 {object} map[string]string "Invalid request"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /certificates/courses/{courseId} [get]
func (c *CertificateController) ListCourseCertificates(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Parse course ID from URL parameter
	courseIDStr := ctx.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid course ID format",
		})
	}

	// Parse pagination parameters
	page := ctx.QueryInt("page", 1)
	pageSize := ctx.QueryInt("pageSize", 20)

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Get certificates from service
	certificates, err := c.service.ListCourseCertificates(ctx.Context(), courseID, tenantID, page, pageSize)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get course certificates",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(certificates)
}

// ListUserCertificates godoc
// @Summary List certificates for a user
// @Description Get all certificates issued to a specific user (Admin/Instructor)
// @Tags Certificates (Admin/Instructor)
// @Accept json
// @Produce json
// @Param userId path string true "User ID" format(uuid)
// @Param page query int false "Page number (default: 1)" minimum(1)
// @Param pageSize query int false "Page size (default: 20, max: 100)" minimum(1) maximum(100)
// @Security BearerAuth
// @Success 200 {object} domain.ListCertificatesResponse
// @Failure 400 {object} map[string]string "Invalid request"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /certificates/users/{userId} [get]
func (c *CertificateController) ListUserCertificates(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Parse user ID from URL parameter
	userIDStr := ctx.Params("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid user ID format",
		})
	}

	// Parse pagination parameters
	page := ctx.QueryInt("page", 1)
	pageSize := ctx.QueryInt("pageSize", 20)

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Get certificates from service
	certificates, err := c.service.ListUserCertificates(ctx.Context(), userID, tenantID, page, pageSize)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get user certificates",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(certificates)
}

// RevokeCertificate godoc
// @Summary Revoke a certificate
// @Description Revoke a previously issued certificate (Admin/Instructor)
// @Tags Certificates (Admin/Instructor)
// @Accept json
// @Produce json
// @Param certificateId path string true "Certificate ID" format(uuid)
// @Param request body domain.RevokeCertificateRequest true "Revocation data"
// @Security BearerAuth
// @Success 200 {object} map[string]string "Certificate revoked successfully"
// @Failure 400 {object} map[string]string "Invalid request"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "Certificate not found"
// @Failure 409 {object} map[string]string "Certificate already revoked"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /certificates/{certificateId}/revoke [post]
func (c *CertificateController) RevokeCertificate(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Extract user ID (who is revoking)
	revokedBy, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: user ID not found",
		})
	}

	// Parse certificate ID from URL parameter
	certificateIDStr := ctx.Params("certificateID")
	certificateID, err := uuid.Parse(certificateIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid certificate ID format",
		})
	}

	// Parse request body
	var req domain.RevokeCertificateRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Revoke certificate via service
	err = c.service.RevokeCertificate(ctx.Context(), certificateID, tenantID, revokedBy, &req)
	if err != nil {
		switch err {
		case ports.ErrCertificateNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "certificate not found",
			})
		case ports.ErrCertificateAlreadyRevoked:
			return ctx.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "certificate is already revoked",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to revoke certificate",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "certificate revoked successfully",
	})
}

// DeleteCertificate godoc
// @Summary Delete a certificate
// @Description Permanently delete a certificate (Admin only)
// @Tags Certificates (Admin/Instructor)
// @Accept json
// @Produce json
// @Param certificateId path string true "Certificate ID" format(uuid)
// @Security BearerAuth
// @Success 200 {object} map[string]string "Certificate deleted successfully"
// @Failure 400 {object} map[string]string "Invalid certificate ID"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "Certificate not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /certificates/{certificateId} [delete]
func (c *CertificateController) DeleteCertificate(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Parse certificate ID from URL parameter
	certificateIDStr := ctx.Params("certificateID")
	certificateID, err := uuid.Parse(certificateIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid certificate ID format",
		})
	}

	// Delete certificate via service
	err = c.service.DeleteCertificate(ctx.Context(), certificateID, tenantID)
	if err != nil {
		switch err {
		case ports.ErrCertificateNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "certificate not found",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to delete certificate",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "certificate deleted successfully",
	})
}

// ============================================================
// Certificate Verification Endpoints (Public)
// ============================================================

// VerifyCertificate godoc
// @Summary Verify a certificate
// @Description Verify the authenticity of a certificate using certificate number and verification code (Public endpoint)
// @Tags Certificates (Public)
// @Accept json
// @Produce json
// @Param request body domain.VerifyCertificateRequest true "Verification data"
// @Success 200 {object} domain.CertificateVerificationResponse
// @Failure 400 {object} map[string]string "Invalid request"
// @Failure 404 {object} map[string]string "Certificate not found or invalid"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /certificates/verify [post]
func (c *CertificateController) VerifyCertificate(ctx *fiber.Ctx) error {
	// Extract tenant ID from context (even for public endpoints, we need tenant context)
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		// For public verification, we might need to extract tenant from subdomain or header
		// For now, return error
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "tenant context required for verification",
		})
	}

	// Parse request body
	var req domain.VerifyCertificateRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Verify certificate via service
	verification, err := c.service.VerifyCertificate(ctx.Context(), &req, tenantID)
	if err != nil {
		switch err {
		case ports.ErrCertificateNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "certificate not found or verification code is invalid",
			})
		case ports.ErrInvalidVerificationCode:
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid verification code",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to verify certificate",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(verification)
}

// ============================================================
// Certificate Statistics Endpoints
// ============================================================

// GetCertificateStatistics godoc
// @Summary Get certificate statistics
// @Description Get overall certificate statistics for the tenant (Admin)
// @Tags Certificates (Statistics)
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} domain.CertificateStatisticsResponse
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /certificates/statistics [get]
func (c *CertificateController) GetCertificateStatistics(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Get statistics from service
	stats, err := c.service.GetCertificateStatistics(ctx.Context(), tenantID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get certificate statistics",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(stats)
}

// GetCourseStatistics godoc
// @Summary Get course certificate statistics
// @Description Get certificate statistics for a specific course (Admin/Instructor)
// @Tags Certificates (Statistics)
// @Accept json
// @Produce json
// @Param courseId path string true "Course ID" format(uuid)
// @Security BearerAuth
// @Success 200 {object} domain.CertificateStatisticsResponse
// @Failure 400 {object} map[string]string "Invalid course ID"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /certificates/courses/{courseId}/statistics [get]
func (c *CertificateController) GetCourseStatistics(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Parse course ID from URL parameter
	courseIDStr := ctx.Params("courseID")
	courseID, err := uuid.Parse(courseIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid course ID format",
		})
	}

	// Get statistics from service
	stats, err := c.service.GetCourseStatistics(ctx.Context(), courseID, tenantID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get course certificate statistics",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(stats)
}

// ============================================================
// Certificate Template Endpoints (Admin)
// ============================================================

// CreateTemplate godoc
// @Summary Create certificate template
// @Description Create a new certificate template (Admin only)
// @Tags Certificates (Templates)
// @Accept json
// @Produce json
// @Param request body domain.CreateTemplateRequest true "Template data"
// @Security BearerAuth
// @Success 201 {object} domain.CertificateTemplateResponse
// @Failure 400 {object} map[string]string "Invalid request"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /certificates/templates [post]
func (c *CertificateController) CreateTemplate(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Extract user ID (creator)
	createdBy, ok := ctx.Locals("userID").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: user ID not found",
		})
	}

	// Parse request body
	var req domain.CreateTemplateRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Create template via service
	template, err := c.service.CreateTemplate(ctx.Context(), tenantID, createdBy, &req)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to create template",
		})
	}

	return ctx.Status(fiber.StatusCreated).JSON(template)
}

// GetTemplate godoc
// @Summary Get certificate template
// @Description Get details of a specific certificate template (Admin)
// @Tags Certificates (Templates)
// @Accept json
// @Produce json
// @Param templateId path string true "Template ID" format(uuid)
// @Security BearerAuth
// @Success 200 {object} domain.CertificateTemplateResponse
// @Failure 400 {object} map[string]string "Invalid template ID"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "Template not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /certificates/templates/{templateId} [get]
func (c *CertificateController) GetTemplate(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Parse template ID from URL parameter
	templateIDStr := ctx.Params("templateID")
	templateID, err := uuid.Parse(templateIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid template ID format",
		})
	}

	// Get template from service
	template, err := c.service.GetTemplate(ctx.Context(), templateID, tenantID)
	if err != nil {
		switch err {
		case ports.ErrTemplateNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "template not found",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to get template",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(template)
}

// ListTemplates godoc
// @Summary List certificate templates
// @Description Get a paginated list of all certificate templates (Admin)
// @Tags Certificates (Templates)
// @Accept json
// @Produce json
// @Param page query int false "Page number (default: 1)" minimum(1)
// @Param pageSize query int false "Page size (default: 20, max: 100)" minimum(1) maximum(100)
// @Security BearerAuth
// @Success 200 {object} map[string]interface{} "List of templates with pagination"
// @Failure 400 {object} map[string]string "Invalid pagination parameters"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /certificates/templates [get]
func (c *CertificateController) ListTemplates(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Parse pagination parameters
	page := ctx.QueryInt("page", 1)
	pageSize := ctx.QueryInt("pageSize", 20)

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Get templates from service
	templates, totalCount, err := c.service.ListTemplates(ctx.Context(), tenantID, page, pageSize)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get templates",
		})
	}

	// Calculate total pages
	totalPages := (totalCount + pageSize - 1) / pageSize

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"templates":  templates,
		"totalCount": totalCount,
		"page":       page,
		"pageSize":   pageSize,
		"totalPages": totalPages,
	})
}

// UpdateTemplate godoc
// @Summary Update certificate template
// @Description Update an existing certificate template (Admin only)
// @Tags Certificates (Templates)
// @Accept json
// @Produce json
// @Param templateId path string true "Template ID" format(uuid)
// @Param request body domain.UpdateTemplateRequest true "Template update data"
// @Security BearerAuth
// @Success 200 {object} domain.CertificateTemplateResponse
// @Failure 400 {object} map[string]string "Invalid request"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "Template not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /certificates/templates/{templateId} [put]
func (c *CertificateController) UpdateTemplate(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Parse template ID from URL parameter
	templateIDStr := ctx.Params("templateID")
	templateID, err := uuid.Parse(templateIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid template ID format",
		})
	}

	// Parse request body
	var req domain.UpdateTemplateRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Check if there are any updates
	if !req.HasUpdates() {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "no updates provided",
		})
	}

	// Update template via service
	template, err := c.service.UpdateTemplate(ctx.Context(), templateID, tenantID, &req)
	if err != nil {
		switch err {
		case ports.ErrTemplateNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "template not found",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to update template",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(template)
}

// DeleteTemplate godoc
// @Summary Delete certificate template
// @Description Delete a certificate template (Admin only)
// @Tags Certificates (Templates)
// @Accept json
// @Produce json
// @Param templateId path string true "Template ID" format(uuid)
// @Security BearerAuth
// @Success 200 {object} map[string]string "Template deleted successfully"
// @Failure 400 {object} map[string]string "Invalid template ID"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "Template not found"
// @Failure 409 {object} map[string]string "Cannot delete default template"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /certificates/templates/{templateId} [delete]
func (c *CertificateController) DeleteTemplate(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Parse template ID from URL parameter
	templateIDStr := ctx.Params("templateID")
	templateID, err := uuid.Parse(templateIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid template ID format",
		})
	}

	// Delete template via service
	err = c.service.DeleteTemplate(ctx.Context(), templateID, tenantID)
	if err != nil {
		switch err {
		case ports.ErrTemplateNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "template not found",
			})
		case ports.ErrCannotDeleteDefaultTemplate:
			return ctx.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "cannot delete default template",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to delete template",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "template deleted successfully",
	})
}

// SetDefaultTemplate godoc
// @Summary Set default certificate template
// @Description Set a template as the default for certificate generation (Admin only)
// @Tags Certificates (Templates)
// @Accept json
// @Produce json
// @Param templateId path string true "Template ID" format(uuid)
// @Security BearerAuth
// @Success 200 {object} map[string]string "Default template set successfully"
// @Failure 400 {object} map[string]string "Invalid template ID"
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 404 {object} map[string]string "Template not found"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /certificates/templates/{templateId}/set-default [post]
func (c *CertificateController) SetDefaultTemplate(ctx *fiber.Ctx) error {
	// Extract tenant ID from context
	tenantID, ok := ctx.Locals("tenant_id").(uuid.UUID)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized: tenant ID not found",
		})
	}

	// Parse template ID from URL parameter
	templateIDStr := ctx.Params("templateID")
	templateID, err := uuid.Parse(templateIDStr)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid template ID format",
		})
	}

	// Set default template via service
	err = c.service.SetDefaultTemplate(ctx.Context(), templateID, tenantID)
	if err != nil {
		switch err {
		case ports.ErrTemplateNotFound:
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "template not found",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "failed to set default template",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "default template set successfully",
	})
}

// ============================================================
// Route Registration
// ============================================================

// RegisterRoutes registers all certificate routes
func (c *CertificateController) RegisterRoutes(router fiber.Router) {
	// ============================================================
	// Student Certificate Routes
	// ============================================================
	studentCerts := router.Group("/certificates/my")
	{
		// Get all my certificates
		studentCerts.Get("", c.GetMyCertificates)

		// Get certificate for specific course
		studentCerts.Get("/courses/:courseID", c.GetMyCertificate)
	}

	// ============================================================
	// Certificate Management Routes (Admin/Instructor)
	// ============================================================
	certificates := router.Group("/certificates")
	{
		// Certificate CRUD
		certificates.Post("", c.GenerateCertificate)
		certificates.Get("/:certificateID", c.GetCertificate)
		certificates.Delete("/:certificateID", c.DeleteCertificate)

		// Certificate operations
		certificates.Get("/:certificateID/download", c.DownloadCertificate)
		certificates.Post("/:certificateID/revoke", c.RevokeCertificate)

		// List certificates by course or user
		certificates.Get("/courses/:courseID", c.ListCourseCertificates)
		certificates.Get("/users/:userID", c.ListUserCertificates)

		// Statistics
		certificates.Get("/statistics", c.GetCertificateStatistics)
		certificates.Get("/courses/:courseID/statistics", c.GetCourseStatistics)

		// Public verification endpoint
		certificates.Post("/verify", c.VerifyCertificate)
	}

	// ============================================================
	// Certificate Template Routes (Admin only)
	// ============================================================
	templates := router.Group("/certificates/templates")
	{
		templates.Post("", c.CreateTemplate)
		templates.Get("", c.ListTemplates)
		templates.Get("/:templateID", c.GetTemplate)
		templates.Put("/:templateID", c.UpdateTemplate)
		templates.Delete("/:templateID", c.DeleteTemplate)
		templates.Post("/:templateID/set-default", c.SetDefaultTemplate)
	}
}
