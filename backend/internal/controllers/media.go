package controllers

import (
	"fmt"
	"io"
	"strconv"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/media/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/media/ports"
	"github.com/DanielIturra1610/stegmaier-landing/internal/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// MediaController maneja las peticiones HTTP relacionadas con media
type MediaController struct {
	service ports.MediaService
}

// NewMediaController crea una nueva instancia del controlador
func NewMediaController(service ports.MediaService) *MediaController {
	return &MediaController{
		service: service,
	}
}

// ============================================================
// Upload Operations
// ============================================================

// UploadMedia maneja POST /media/upload
func (c *MediaController) UploadMedia(ctx *fiber.Ctx) error {
	tenantID := ctx.Locals(middleware.TenantIDKey).(uuid.UUID)
	userID := ctx.Locals(middleware.UserIDKey).(uuid.UUID)

	// Obtener archivo del formulario
	file, err := ctx.FormFile("file")
	if err != nil {
		return ErrorResponse(ctx, fiber.StatusBadRequest, "No file provided", err)
	}

	// Abrir archivo
	fileReader, err := file.Open()
	if err != nil {
		return ErrorResponse(ctx, fiber.StatusInternalServerError, "Failed to open file", err)
	}
	defer fileReader.Close()

	// Obtener metadatos del formulario
	visibility := ctx.FormValue("visibility", string(domain.MediaVisibilityPrivate))
	context := ctx.FormValue("context", string(domain.MediaContextOther))
	contextIDStr := ctx.FormValue("context_id", "")

	var contextID *uuid.UUID
	if contextIDStr != "" {
		parsed, err := uuid.Parse(contextIDStr)
		if err == nil {
			contextID = &parsed
		}
	}

	// Crear request
	req := domain.UploadMediaRequest{
		TenantID:     tenantID,
		UserID:       userID,
		FileName:     file.Filename,
		OriginalName: file.Filename,
		MimeType:     file.Header.Get("Content-Type"),
		FileSize:     file.Size,
		Visibility:   domain.MediaVisibility(visibility),
		Context:      domain.MediaContext(context),
		ContextID:    contextID,
	}

	// Subir archivo
	response, err := c.service.UploadMedia(req, fileReader)
	if err != nil {
		return ErrorResponse(ctx, MapDomainError(err))
	}

	return SuccessResponse(ctx, fiber.StatusCreated, "Media uploaded successfully", response)
}

// UploadMultiple maneja POST /media/upload/multiple
func (c *MediaController) UploadMultiple(ctx *fiber.Ctx) error {
	tenantID := ctx.Locals(middleware.TenantIDKey).(uuid.UUID)
	userID := ctx.Locals(middleware.UserIDKey).(uuid.UUID)

	// Obtener todos los archivos del formulario
	form, err := ctx.MultipartForm()
	if err != nil {
		return ErrorResponse(ctx, fiber.StatusBadRequest, "No files provided", err)
	}

	files := form.File["files"]
	if len(files) == 0 {
		return ErrorResponse(ctx, fiber.StatusBadRequest, "No files provided", nil)
	}

	// Preparar requests y readers
	var requests []domain.UploadMediaRequest
	var readers []io.Reader

	visibility := ctx.FormValue("visibility", string(domain.MediaVisibilityPrivate))
	context := ctx.FormValue("context", string(domain.MediaContextOther))

	for _, file := range files {
		fileReader, err := file.Open()
		if err != nil {
			continue
		}
		defer fileReader.Close()

		req := domain.UploadMediaRequest{
			TenantID:     tenantID,
			UserID:       userID,
			FileName:     file.Filename,
			OriginalName: file.Filename,
			MimeType:     file.Header.Get("Content-Type"),
			FileSize:     file.Size,
			Visibility:   domain.MediaVisibility(visibility),
			Context:      domain.MediaContext(context),
		}

		requests = append(requests, req)
		readers = append(readers, fileReader)
	}

	// Subir archivos
	responses, err := c.service.UploadMultiple(requests, readers)
	if err != nil {
		return ErrorResponse(ctx, MapDomainError(err))
	}

	return SuccessResponse(ctx, fiber.StatusCreated, fmt.Sprintf("Uploaded %d files successfully", len(responses)), responses)
}

// ============================================================
// CRUD Operations
// ============================================================

// GetMedia maneja GET /media/:id
func (c *MediaController) GetMedia(ctx *fiber.Ctx) error {
	tenantID := ctx.Locals(middleware.TenantIDKey).(uuid.UUID)
	userID := ctx.Locals(middleware.UserIDKey).(uuid.UUID)

	mediaID, err := uuid.Parse(ctx.Params("id"))
	if err != nil {
		return ErrorResponse(ctx, fiber.StatusBadRequest, "Invalid media ID", err)
	}

	response, err := c.service.GetMedia(tenantID, userID, mediaID)
	if err != nil {
		return ErrorResponse(ctx, MapDomainError(err))
	}

	return SuccessResponse(ctx, fiber.StatusOK, "Media retrieved successfully", response)
}

// GetUserMedia maneja GET /media/user/:userId
func (c *MediaController) GetUserMedia(ctx *fiber.Ctx) error {
	tenantID := ctx.Locals(middleware.TenantIDKey).(uuid.UUID)
	userID := ctx.Locals(middleware.UserIDKey).(uuid.UUID)

	targetUserID, err := uuid.Parse(ctx.Params("userId", userID.String()))
	if err != nil {
		return ErrorResponse(ctx, fiber.StatusBadRequest, "Invalid user ID", err)
	}

	limit := ctx.QueryInt("limit", 20)
	offset := ctx.QueryInt("offset", 0)

	response, err := c.service.GetUserMedia(tenantID, targetUserID, limit, offset)
	if err != nil {
		return ErrorResponse(ctx, MapDomainError(err))
	}

	return SuccessResponse(ctx, fiber.StatusOK, "User media retrieved successfully", response)
}

// GetMyMedia maneja GET /media/my
func (c *MediaController) GetMyMedia(ctx *fiber.Ctx) error {
	tenantID := ctx.Locals(middleware.TenantIDKey).(uuid.UUID)
	userID := ctx.Locals(middleware.UserIDKey).(uuid.UUID)

	limit := ctx.QueryInt("limit", 20)
	offset := ctx.QueryInt("offset", 0)

	response, err := c.service.GetUserMedia(tenantID, userID, limit, offset)
	if err != nil {
		return ErrorResponse(ctx, MapDomainError(err))
	}

	return SuccessResponse(ctx, fiber.StatusOK, "My media retrieved successfully", response)
}

// ListMedia maneja GET /media
func (c *MediaController) ListMedia(ctx *fiber.Ctx) error {
	tenantID := ctx.Locals(middleware.TenantIDKey).(uuid.UUID)

	// Parse filters
	filters := domain.MediaFilters{
		TenantID:  tenantID,
		Limit:     ctx.QueryInt("limit", 20),
		Offset:    ctx.QueryInt("offset", 0),
		SortBy:    ctx.Query("sort_by", "created_at"),
		SortOrder: ctx.Query("sort_order", "desc"),
	}

	// Parse optional filters
	if mediaTypeStr := ctx.Query("media_type"); mediaTypeStr != "" {
		mediaType := domain.MediaType(mediaTypeStr)
		filters.MediaType = &mediaType
	}

	if statusStr := ctx.Query("status"); statusStr != "" {
		status := domain.MediaStatus(statusStr)
		filters.Status = &status
	}

	if visibilityStr := ctx.Query("visibility"); visibilityStr != "" {
		visibility := domain.MediaVisibility(visibilityStr)
		filters.Visibility = &visibility
	}

	if contextStr := ctx.Query("context"); contextStr != "" {
		context := domain.MediaContext(contextStr)
		filters.Context = &context
	}

	if contextIDStr := ctx.Query("context_id"); contextIDStr != "" {
		contextID, err := uuid.Parse(contextIDStr)
		if err == nil {
			filters.ContextID = &contextID
		}
	}

	if searchStr := ctx.Query("search"); searchStr != "" {
		filters.Search = &searchStr
	}

	response, err := c.service.ListMedia(filters)
	if err != nil {
		return ErrorResponse(ctx, MapDomainError(err))
	}

	return SuccessResponse(ctx, fiber.StatusOK, "Media list retrieved successfully", response)
}

// UpdateMedia maneja PATCH /media/:id
func (c *MediaController) UpdateMedia(ctx *fiber.Ctx) error {
	tenantID := ctx.Locals(middleware.TenantIDKey).(uuid.UUID)
	userID := ctx.Locals(middleware.UserIDKey).(uuid.UUID)

	mediaID, err := uuid.Parse(ctx.Params("id"))
	if err != nil {
		return ErrorResponse(ctx, fiber.StatusBadRequest, "Invalid media ID", err)
	}

	var req domain.UpdateMediaRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ErrorResponse(ctx, fiber.StatusBadRequest, "Invalid request body", err)
	}

	response, err := c.service.UpdateMedia(tenantID, userID, mediaID, req)
	if err != nil {
		return ErrorResponse(ctx, MapDomainError(err))
	}

	return SuccessResponse(ctx, fiber.StatusOK, "Media updated successfully", response)
}

// DeleteMedia maneja DELETE /media/:id
func (c *MediaController) DeleteMedia(ctx *fiber.Ctx) error {
	tenantID := ctx.Locals(middleware.TenantIDKey).(uuid.UUID)
	userID := ctx.Locals(middleware.UserIDKey).(uuid.UUID)

	mediaID, err := uuid.Parse(ctx.Params("id"))
	if err != nil {
		return ErrorResponse(ctx, fiber.StatusBadRequest, "Invalid media ID", err)
	}

	if err := c.service.DeleteMedia(tenantID, userID, mediaID); err != nil {
		return ErrorResponse(ctx, MapDomainError(err))
	}

	return SuccessResponse(ctx, fiber.StatusOK, "Media deleted successfully", nil)
}

// ============================================================
// Download Operations
// ============================================================

// GetDownloadURL maneja GET /media/:id/download-url
func (c *MediaController) GetDownloadURL(ctx *fiber.Ctx) error {
	tenantID := ctx.Locals(middleware.TenantIDKey).(uuid.UUID)
	userID := ctx.Locals(middleware.UserIDKey).(uuid.UUID)

	mediaID, err := uuid.Parse(ctx.Params("id"))
	if err != nil {
		return ErrorResponse(ctx, fiber.StatusBadRequest, "Invalid media ID", err)
	}

	expirySeconds := ctx.QueryInt("expiry", 3600) // Default 1 hour

	url, err := c.service.GetMediaDownloadURL(tenantID, userID, mediaID, expirySeconds)
	if err != nil {
		return ErrorResponse(ctx, MapDomainError(err))
	}

	return SuccessResponse(ctx, fiber.StatusOK, "Download URL generated successfully", fiber.Map{
		"url":            url,
		"expiry_seconds": expirySeconds,
	})
}

// DownloadMedia maneja GET /media/:id/download
func (c *MediaController) DownloadMedia(ctx *fiber.Ctx) error {
	tenantID := ctx.Locals(middleware.TenantIDKey).(uuid.UUID)
	userID := ctx.Locals(middleware.UserIDKey).(uuid.UUID)

	mediaID, err := uuid.Parse(ctx.Params("id"))
	if err != nil {
		return ErrorResponse(ctx, fiber.StatusBadRequest, "Invalid media ID", err)
	}

	reader, media, err := c.service.DownloadMedia(tenantID, userID, mediaID)
	if err != nil {
		return ErrorResponse(ctx, MapDomainError(err))
	}
	defer reader.Close()

	// Set headers para download
	ctx.Set("Content-Type", media.MimeType)
	ctx.Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, media.OriginalName))
	ctx.Set("Content-Length", strconv.FormatInt(media.FileSize, 10))

	// Stream el archivo
	return ctx.SendStream(reader)
}

// ============================================================
// Query Operations
// ============================================================

// SearchMedia maneja GET /media/search
func (c *MediaController) SearchMedia(ctx *fiber.Ctx) error {
	tenantID := ctx.Locals(middleware.TenantIDKey).(uuid.UUID)
	userID := ctx.Locals(middleware.UserIDKey).(uuid.UUID)

	query := ctx.Query("q", "")
	if query == "" {
		return ErrorResponse(ctx, fiber.StatusBadRequest, "Search query is required", nil)
	}

	limit := ctx.QueryInt("limit", 20)
	offset := ctx.QueryInt("offset", 0)

	response, err := c.service.SearchMedia(tenantID, userID, query, limit, offset)
	if err != nil {
		return ErrorResponse(ctx, MapDomainError(err))
	}

	return SuccessResponse(ctx, fiber.StatusOK, "Search completed successfully", response)
}

// GetMediaByContext maneja GET /media/context/:context/:contextId
func (c *MediaController) GetMediaByContext(ctx *fiber.Ctx) error {
	tenantID := ctx.Locals(middleware.TenantIDKey).(uuid.UUID)
	userID := ctx.Locals(middleware.UserIDKey).(uuid.UUID)

	context := domain.MediaContext(ctx.Params("context"))
	contextID, err := uuid.Parse(ctx.Params("contextId"))
	if err != nil {
		return ErrorResponse(ctx, fiber.StatusBadRequest, "Invalid context ID", err)
	}

	response, err := c.service.GetMediaByContext(tenantID, userID, context, contextID)
	if err != nil {
		return ErrorResponse(ctx, MapDomainError(err))
	}

	return SuccessResponse(ctx, fiber.StatusOK, "Context media retrieved successfully", response)
}

// ============================================================
// Statistics
// ============================================================

// GetStorageStats maneja GET /media/stats
func (c *MediaController) GetStorageStats(ctx *fiber.Ctx) error {
	tenantID := ctx.Locals(middleware.TenantIDKey).(uuid.UUID)

	stats, err := c.service.GetStorageStats(tenantID)
	if err != nil {
		return ErrorResponse(ctx, MapDomainError(err))
	}

	return SuccessResponse(ctx, fiber.StatusOK, "Storage stats retrieved successfully", stats)
}
