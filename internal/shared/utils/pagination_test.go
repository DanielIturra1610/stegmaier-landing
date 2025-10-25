package utils

import (
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestParsePaginationParams(t *testing.T) {
	tests := []struct {
		name         string
		queryParams  string
		expectedPage int
		expectedSize int
	}{
		{
			name:         "Default values",
			queryParams:  "",
			expectedPage: 1,
			expectedSize: DefaultPageSize,
		},
		{
			name:         "Custom page and size",
			queryParams:  "?page=3&page_size=50",
			expectedPage: 3,
			expectedSize: 50,
		},
		{
			name:         "Page too low",
			queryParams:  "?page=0",
			expectedPage: 1,
			expectedSize: DefaultPageSize,
		},
		{
			name:         "Negative page",
			queryParams:  "?page=-5",
			expectedPage: 1,
			expectedSize: DefaultPageSize,
		},
		{
			name:         "Page size too large",
			queryParams:  "?page_size=200",
			expectedPage: 1,
			expectedSize: MaxPageSize,
		},
		{
			name:         "Page size too small",
			queryParams:  "?page_size=0",
			expectedPage: 1,
			expectedSize: DefaultPageSize,
		},
		{
			name:         "Invalid page value",
			queryParams:  "?page=abc",
			expectedPage: 1,
			expectedSize: DefaultPageSize,
		},
		{
			name:         "Invalid page_size value",
			queryParams:  "?page_size=xyz",
			expectedPage: 1,
			expectedSize: DefaultPageSize,
		},
		{
			name:         "Only page specified",
			queryParams:  "?page=5",
			expectedPage: 5,
			expectedSize: DefaultPageSize,
		},
		{
			name:         "Only page_size specified",
			queryParams:  "?page_size=30",
			expectedPage: 1,
			expectedSize: 30,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			app := fiber.New()

			app.Get("/test", func(c *fiber.Ctx) error {
				params := ParsePaginationParams(c)

				if params.Page != tt.expectedPage {
					t.Errorf("expected page %d, got %d", tt.expectedPage, params.Page)
				}

				if params.PageSize != tt.expectedSize {
					t.Errorf("expected page_size %d, got %d", tt.expectedSize, params.PageSize)
				}

				// Verify offset calculation
				expectedOffset := (tt.expectedPage - 1) * tt.expectedSize
				if params.Offset != expectedOffset {
					t.Errorf("expected offset %d, got %d", expectedOffset, params.Offset)
				}

				return nil
			})

			req := httptest.NewRequest("GET", "/test"+tt.queryParams, nil)
			_, err := app.Test(req)
			if err != nil {
				t.Fatalf("request failed: %v", err)
			}
		})
	}
}

func TestApplyPagination(t *testing.T) {
	params := &PaginationParams{
		Page:     3,
		PageSize: 25,
		Offset:   50,
	}

	limit, offset := ApplyPagination(params)

	if limit != 25 {
		t.Errorf("expected limit 25, got %d", limit)
	}

	if offset != 50 {
		t.Errorf("expected offset 50, got %d", offset)
	}
}

func TestGetSQLPagination(t *testing.T) {
	tests := []struct {
		name     string
		params   *PaginationParams
		expected string
	}{
		{
			name: "Page 1",
			params: &PaginationParams{
				Page:     1,
				PageSize: 20,
				Offset:   0,
			},
			expected: " LIMIT 20 OFFSET 0",
		},
		{
			name: "Page 3",
			params: &PaginationParams{
				Page:     3,
				PageSize: 10,
				Offset:   20,
			},
			expected: " LIMIT 10 OFFSET 20",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := GetSQLPagination(tt.params)
			if result != tt.expected {
				t.Errorf("expected '%s', got '%s'", tt.expected, result)
			}
		})
	}
}

func TestNewMeta(t *testing.T) {
	tests := []struct {
		name           string
		page           int
		pageSize       int
		totalItems     int
		expectedPages  int
	}{
		{
			name:          "Exact division",
			page:          1,
			pageSize:      20,
			totalItems:    100,
			expectedPages: 5,
		},
		{
			name:          "With remainder",
			page:          1,
			pageSize:      20,
			totalItems:    105,
			expectedPages: 6,
		},
		{
			name:          "Single page",
			page:          1,
			pageSize:      50,
			totalItems:    30,
			expectedPages: 1,
		},
		{
			name:          "Empty result",
			page:          1,
			pageSize:      20,
			totalItems:    0,
			expectedPages: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			meta := NewMeta(tt.page, tt.pageSize, tt.totalItems)

			if meta.Page != tt.page {
				t.Errorf("expected page %d, got %d", tt.page, meta.Page)
			}

			if meta.PageSize != tt.pageSize {
				t.Errorf("expected page_size %d, got %d", tt.pageSize, meta.PageSize)
			}

			if meta.TotalItems != tt.totalItems {
				t.Errorf("expected total_items %d, got %d", tt.totalItems, meta.TotalItems)
			}

			if meta.TotalPages != tt.expectedPages {
				t.Errorf("expected total_pages %d, got %d", tt.expectedPages, meta.TotalPages)
			}
		})
	}
}

func TestNewPaginatedResponse(t *testing.T) {
	items := []string{"item1", "item2", "item3"}
	page := 2
	pageSize := 10
	totalItems := 25

	response := NewPaginatedResponse(items, page, pageSize, totalItems)

	if response.Items == nil {
		t.Errorf("items should not be nil")
	}

	if response.Meta == nil {
		t.Errorf("meta should not be nil")
	}

	if response.Meta.Page != page {
		t.Errorf("expected page %d, got %d", page, response.Meta.Page)
	}

	if response.Meta.PageSize != pageSize {
		t.Errorf("expected page_size %d, got %d", pageSize, response.Meta.PageSize)
	}

	if response.Meta.TotalItems != totalItems {
		t.Errorf("expected total_items %d, got %d", totalItems, response.Meta.TotalItems)
	}

	expectedPages := 3 // 25 / 10 = 2.5 -> 3
	if response.Meta.TotalPages != expectedPages {
		t.Errorf("expected total_pages %d, got %d", expectedPages, response.Meta.TotalPages)
	}
}

func TestPaginationOffsetCalculation(t *testing.T) {
	tests := []struct {
		page           int
		pageSize       int
		expectedOffset int
	}{
		{page: 1, pageSize: 20, expectedOffset: 0},
		{page: 2, pageSize: 20, expectedOffset: 20},
		{page: 3, pageSize: 20, expectedOffset: 40},
		{page: 1, pageSize: 50, expectedOffset: 0},
		{page: 5, pageSize: 10, expectedOffset: 40},
	}

	for _, tt := range tests {
		app := fiber.New()

		app.Get("/test", func(c *fiber.Ctx) error {
			params := ParsePaginationParams(c)
			if params.Offset != tt.expectedOffset {
				t.Errorf("page=%d, pageSize=%d: expected offset %d, got %d",
					tt.page, tt.pageSize, tt.expectedOffset, params.Offset)
			}
			return nil
		})

		req := httptest.NewRequest("GET", "/test?page="+
			string(rune(tt.page+'0'))+"&page_size="+
			string(rune(tt.pageSize/10+'0'))+string(rune(tt.pageSize%10+'0')), nil)

		_, _ = app.Test(req)
	}
}

func TestParseIntQueryParam(t *testing.T) {
	app := fiber.New()

	app.Get("/test", func(c *fiber.Ctx) error {
		// Test default value
		result := parseIntQueryParam(c, "missing", 42)
		if result != 42 {
			t.Errorf("expected default value 42, got %d", result)
		}

		// Test valid value
		result = parseIntQueryParam(c, "valid", 10)
		if result != 100 {
			t.Errorf("expected value 100, got %d", result)
		}

		// Test invalid value
		result = parseIntQueryParam(c, "invalid", 10)
		if result != 10 {
			t.Errorf("expected default value 10 for invalid input, got %d", result)
		}

		return c.SendStatus(200)
	})

	req := httptest.NewRequest("GET", "/test?valid=100&invalid=abc", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()
	io.ReadAll(resp.Body)
}
