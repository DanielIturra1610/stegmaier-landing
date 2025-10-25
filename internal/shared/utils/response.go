package utils

import (
	"github.com/gofiber/fiber/v2"
)

// APIResponse represents a standard API response structure
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *ErrorData  `json:"error,omitempty"`
	Meta    *Meta       `json:"meta,omitempty"`
}

// ErrorData represents error information in API response
type ErrorData struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// Meta represents metadata in API response (pagination, etc.)
type Meta struct {
	Page       int `json:"page,omitempty"`
	PageSize   int `json:"page_size,omitempty"`
	TotalPages int `json:"total_pages,omitempty"`
	TotalItems int `json:"total_items,omitempty"`
}

// Success sends a successful response
func Success(c *fiber.Ctx, data interface{}) error {
	return c.JSON(APIResponse{
		Success: true,
		Data:    data,
	})
}

// SuccessWithMeta sends a successful response with metadata
func SuccessWithMeta(c *fiber.Ctx, data interface{}, meta *Meta) error {
	return c.JSON(APIResponse{
		Success: true,
		Data:    data,
		Meta:    meta,
	})
}

// Created sends a 201 Created response
func Created(c *fiber.Ctx, data interface{}) error {
	return c.Status(fiber.StatusCreated).JSON(APIResponse{
		Success: true,
		Data:    data,
	})
}

// NoContent sends a 204 No Content response
func NoContent(c *fiber.Ctx) error {
	return c.SendStatus(fiber.StatusNoContent)
}

// Error sends an error response
func Error(c *fiber.Ctx, statusCode int, code, message string) error {
	return c.Status(statusCode).JSON(APIResponse{
		Success: false,
		Error: &ErrorData{
			Code:    code,
			Message: message,
		},
	})
}

// ErrorFromAppError sends an error response from an AppError
func ErrorFromAppError(c *fiber.Ctx, appErr *AppError) error {
	statusCode := getHTTPStatusFromErrorCode(appErr.Code)
	return c.Status(statusCode).JSON(APIResponse{
		Success: false,
		Error: &ErrorData{
			Code:    appErr.Code,
			Message: appErr.Message,
		},
	})
}

// BadRequest sends a 400 Bad Request response
func BadRequest(c *fiber.Ctx, message string) error {
	return Error(c, fiber.StatusBadRequest, ErrCodeBadRequest, message)
}

// Unauthorized sends a 401 Unauthorized response
func Unauthorized(c *fiber.Ctx, message string) error {
	return Error(c, fiber.StatusUnauthorized, ErrCodeUnauthorized, message)
}

// Forbidden sends a 403 Forbidden response
func Forbidden(c *fiber.Ctx, message string) error {
	return Error(c, fiber.StatusForbidden, ErrCodeForbidden, message)
}

// NotFound sends a 404 Not Found response
func NotFound(c *fiber.Ctx, message string) error {
	return Error(c, fiber.StatusNotFound, ErrCodeNotFound, message)
}

// Conflict sends a 409 Conflict response
func Conflict(c *fiber.Ctx, message string) error {
	return Error(c, fiber.StatusConflict, ErrCodeConflict, message)
}

// InternalError sends a 500 Internal Server Error response
func InternalError(c *fiber.Ctx, message string) error {
	return Error(c, fiber.StatusInternalServerError, ErrCodeInternalError, message)
}

// ValidationError sends a 422 Unprocessable Entity response
func ValidationError(c *fiber.Ctx, message string) error {
	return Error(c, fiber.StatusUnprocessableEntity, ErrCodeValidationError, message)
}

// getHTTPStatusFromErrorCode maps error codes to HTTP status codes
func getHTTPStatusFromErrorCode(code string) int {
	switch code {
	case ErrCodeNotFound, ErrCodeUserNotFound, ErrCodeTenantNotFound, ErrCodeCourseNotFound, ErrCodeLessonNotFound:
		return fiber.StatusNotFound
	case ErrCodeUnauthorized, ErrCodeTokenExpired, ErrCodeInvalidToken, ErrCodeInvalidCredentials:
		return fiber.StatusUnauthorized
	case ErrCodeForbidden, ErrCodeEmailNotVerified, ErrCodeNotEnrolled:
		return fiber.StatusForbidden
	case ErrCodeBadRequest:
		return fiber.StatusBadRequest
	case ErrCodeConflict, ErrCodeUserAlreadyExists:
		return fiber.StatusConflict
	case ErrCodeValidationError:
		return fiber.StatusUnprocessableEntity
	case ErrCodeDatabaseError, ErrCodeInternalError:
		return fiber.StatusInternalServerError
	default:
		return fiber.StatusInternalServerError
	}
}

// NewMeta creates a new Meta struct with pagination info
func NewMeta(page, pageSize, totalItems int) *Meta {
	totalPages := totalItems / pageSize
	if totalItems%pageSize > 0 {
		totalPages++
	}

	return &Meta{
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
		TotalItems: totalItems,
	}
}
