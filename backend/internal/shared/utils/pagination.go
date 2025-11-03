package utils

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
)

// PaginationParams represents pagination query parameters
type PaginationParams struct {
	Page     int
	PageSize int
	Offset   int
}

// DefaultPageSize is the default number of items per page
const DefaultPageSize = 20

// MaxPageSize is the maximum allowed page size
const MaxPageSize = 100

// ParsePaginationParams extracts and validates pagination parameters from request
func ParsePaginationParams(c *fiber.Ctx) *PaginationParams {
	page := parseIntQueryParam(c, "page", 1)
	pageSize := parseIntQueryParam(c, "page_size", DefaultPageSize)

	// Validate page number
	if page < 1 {
		page = 1
	}

	// Validate page size
	if pageSize < 1 {
		pageSize = DefaultPageSize
	}
	if pageSize > MaxPageSize {
		pageSize = MaxPageSize
	}

	// Calculate offset
	offset := (page - 1) * pageSize

	return &PaginationParams{
		Page:     page,
		PageSize: pageSize,
		Offset:   offset,
	}
}

// parseIntQueryParam parses an integer query parameter with a default value
func parseIntQueryParam(c *fiber.Ctx, param string, defaultValue int) int {
	valueStr := c.Query(param)
	if valueStr == "" {
		return defaultValue
	}

	value, err := strconv.Atoi(valueStr)
	if err != nil {
		return defaultValue
	}

	return value
}

// ApplyPagination applies pagination to a SQL query
// Returns the LIMIT and OFFSET values
func ApplyPagination(params *PaginationParams) (limit, offset int) {
	return params.PageSize, params.Offset
}

// GetSQLPagination returns SQL LIMIT and OFFSET clause
func GetSQLPagination(params *PaginationParams) string {
	return " LIMIT " + strconv.Itoa(params.PageSize) + " OFFSET " + strconv.Itoa(params.Offset)
}

// PaginatedResponse represents a paginated API response
type PaginatedResponse struct {
	Items interface{} `json:"items"`
	Meta  *Meta       `json:"meta"`
}

// NewPaginatedResponse creates a new paginated response
func NewPaginatedResponse(items interface{}, page, pageSize, totalItems int) *PaginatedResponse {
	return &PaginatedResponse{
		Items: items,
		Meta:  NewMeta(page, pageSize, totalItems),
	}
}
