package utils

import (
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
)

func TestGetTenantIDWithContext(t *testing.T) {
	app := fiber.New()

	app.Get("/test", func(c *fiber.Ctx) error {
		// Test with no tenant ID
		result := GetTenantID(c)
		if result != "" {
			t.Errorf("Expected empty string, got '%s'", result)
		}

		// Test with tenant ID set
		c.Locals(TenantIDKey, "test-tenant-123")
		result = GetTenantID(c)
		if result != "test-tenant-123" {
			t.Errorf("Expected 'test-tenant-123', got '%s'", result)
		}

		// Test with wrong type
		c.Locals(TenantIDKey, 123)
		result = GetTenantID(c)
		if result != "" {
			t.Errorf("Expected empty string for wrong type, got '%s'", result)
		}

		return c.SendString("ok")
	})

	req := httptest.NewRequest("GET", "http://localhost/test", nil)
	_, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}
}

func TestGetTenantSlug(t *testing.T) {
	app := fiber.New()

	app.Get("/test", func(c *fiber.Ctx) error {
		// Test with no slug
		result := GetTenantSlug(c)
		if result != "" {
			t.Errorf("Expected empty string, got '%s'", result)
		}

		// Test with slug set
		c.Locals(TenantSlugKey, "my-tenant")
		result = GetTenantSlug(c)
		if result != "my-tenant" {
			t.Errorf("Expected 'my-tenant', got '%s'", result)
		}

		return c.SendString("ok")
	})

	req := httptest.NewRequest("GET", "http://localhost/test", nil)
	_, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}
}

func TestGetTenantName(t *testing.T) {
	app := fiber.New()

	app.Get("/test", func(c *fiber.Ctx) error {
		// Test with no name
		result := GetTenantName(c)
		if result != "" {
			t.Errorf("Expected empty string, got '%s'", result)
		}

		// Test with name set
		c.Locals(TenantNameKey, "My Tenant Organization")
		result = GetTenantName(c)
		if result != "My Tenant Organization" {
			t.Errorf("Expected 'My Tenant Organization', got '%s'", result)
		}

		return c.SendString("ok")
	})

	req := httptest.NewRequest("GET", "http://localhost/test", nil)
	_, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}
}

func TestGetTenantDBName(t *testing.T) {
	app := fiber.New()

	app.Get("/test", func(c *fiber.Ctx) error {
		// Test with no DB name
		result := GetTenantDBName(c)
		if result != "" {
			t.Errorf("Expected empty string, got '%s'", result)
		}

		// Test with DB name set
		c.Locals(TenantDBNameKey, "tenant_db_123")
		result = GetTenantDBName(c)
		if result != "tenant_db_123" {
			t.Errorf("Expected 'tenant_db_123', got '%s'", result)
		}

		return c.SendString("ok")
	})

	req := httptest.NewRequest("GET", "http://localhost/test", nil)
	_, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}
}

func TestGetTenantInfo(t *testing.T) {
	app := fiber.New()

	app.Get("/test", func(c *fiber.Ctx) error {
		// Set all tenant context
		c.Locals(TenantIDKey, "info-test-id")
		c.Locals(TenantSlugKey, "info-test-slug")
		c.Locals(TenantNameKey, "Info Test Name")
		c.Locals(TenantDBNameKey, "tenant_info_test")

		info := GetTenantInfo(c)

		if info["id"] != "info-test-id" {
			t.Errorf("Expected ID 'info-test-id', got '%s'", info["id"])
		}

		if info["slug"] != "info-test-slug" {
			t.Errorf("Expected slug 'info-test-slug', got '%s'", info["slug"])
		}

		if info["name"] != "Info Test Name" {
			t.Errorf("Expected name 'Info Test Name', got '%s'", info["name"])
		}

		if info["database_name"] != "tenant_info_test" {
			t.Errorf("Expected DB name 'tenant_info_test', got '%s'", info["database_name"])
		}

		return c.SendString("ok")
	})

	req := httptest.NewRequest("GET", "http://localhost/test", nil)
	_, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}
}

func TestValidateTenantAccessWithEmptyParams(t *testing.T) {
	// Test with empty user ID
	result := ValidateTenantAccess("", "tenant-123")
	if result {
		t.Error("Expected false for empty user ID")
	}

	// Test with empty tenant ID
	result = ValidateTenantAccess("user-123", "")
	if result {
		t.Error("Expected false for empty tenant ID")
	}

	// Test with both empty
	result = ValidateTenantAccess("", "")
	if result {
		t.Error("Expected false for both empty")
	}
}

func TestEnsureTenantContext(t *testing.T) {
	app := fiber.New()

	tests := []struct {
		name         string
		hasTenantID  bool
		expectError  bool
	}{
		{
			name:         "With tenant context",
			hasTenantID:  true,
			expectError:  false,
		},
		{
			name:         "Without tenant context",
			hasTenantID:  false,
			expectError:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			app.Get("/test", func(c *fiber.Ctx) error {
				if tt.hasTenantID {
					c.Locals(TenantIDKey, "test-tenant")
				}

				err := EnsureTenantContext(c)

				if tt.expectError && err == nil {
					t.Error("Expected error but got none")
				}

				if !tt.expectError && err != nil {
					t.Errorf("Expected no error but got: %v", err)
				}

				return c.SendString("ok")
			})

			req := httptest.NewRequest("GET", "http://localhost/test", nil)
			_, _ = app.Test(req, -1)
		})
	}
}

func TestGetTenantDBWithoutContext(t *testing.T) {
	app := fiber.New()

	app.Get("/test", func(c *fiber.Ctx) error {
		// Without tenant ID in context
		_, err := GetTenantDB(c)
		if err == nil {
			t.Error("Expected error when tenant ID not in context")
		}

		if err != nil && err.Error() != "tenant ID not found in context" {
			t.Errorf("Expected specific error message, got: %v", err)
		}

		return c.SendString("ok")
	})

	req := httptest.NewRequest("GET", "http://localhost/test", nil)
	_, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}
}

func TestGetTenantInfoStructure(t *testing.T) {
	app := fiber.New()

	app.Get("/test", func(c *fiber.Ctx) error {
		// Test with empty context
		info := GetTenantInfo(c)

		// Should return map with empty values
		if info["id"] != "" {
			t.Error("Expected empty ID")
		}

		if info["slug"] != "" {
			t.Error("Expected empty slug")
		}

		if info["name"] != "" {
			t.Error("Expected empty name")
		}

		if info["database_name"] != "" {
			t.Error("Expected empty database_name")
		}

		// Verify all expected keys exist
		expectedKeys := []string{"id", "slug", "name", "database_name"}
		for _, key := range expectedKeys {
			if _, exists := info[key]; !exists {
				t.Errorf("Expected key '%s' to exist in info map", key)
			}
		}

		return c.SendString("ok")
	})

	req := httptest.NewRequest("GET", "http://localhost/test", nil)
	_, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}
}
