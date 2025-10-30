package middleware

import (
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/domain"
	"github.com/gofiber/fiber/v2"
)

func TestRBACMiddleware(t *testing.T) {
	tests := []struct {
		name           string
		userRole       string
		allowedRoles   []string
		expectStatus   int
		expectSuccess  bool
		expectError    string
		setUserRole    bool // whether to set user role in context
	}{
		{
			name:          "Admin user accessing admin route",
			userRole:      string(domain.RoleAdmin),
			allowedRoles:  []string{"admin", "superadmin"},
			expectStatus:  fiber.StatusOK,
			expectSuccess: true,
			setUserRole:   true,
		},
		{
			name:          "SuperAdmin user accessing admin route",
			userRole:      string(domain.RoleSuperAdmin),
			allowedRoles:  []string{"admin", "superadmin"},
			expectStatus:  fiber.StatusOK,
			expectSuccess: true,
			setUserRole:   true,
		},
		{
			name:          "Student user accessing admin route",
			userRole:      string(domain.RoleStudent),
			allowedRoles:  []string{"admin", "superadmin"},
			expectStatus:  fiber.StatusForbidden,
			expectSuccess: false,
			setUserRole:   true,
		},
		{
			name:          "Instructor user accessing admin route",
			userRole:      string(domain.RoleInstructor),
			allowedRoles:  []string{"admin", "superadmin"},
			expectStatus:  fiber.StatusForbidden,
			expectSuccess: false,
			setUserRole:   true,
		},
		{
			name:          "No user role set (unauthenticated)",
			allowedRoles:  []string{"admin"},
			expectStatus:  fiber.StatusUnauthorized,
			expectSuccess: false,
			setUserRole:   false,
		},
		{
			name:          "SuperAdmin accessing superadmin-only route",
			userRole:      string(domain.RoleSuperAdmin),
			allowedRoles:  []string{"superadmin"},
			expectStatus:  fiber.StatusOK,
			expectSuccess: true,
			setUserRole:   true,
		},
		{
			name:          "Admin accessing superadmin-only route",
			userRole:      string(domain.RoleAdmin),
			allowedRoles:  []string{"superadmin"},
			expectStatus:  fiber.StatusForbidden,
			expectSuccess: false,
			setUserRole:   true,
		},
		{
			name:          "Instructor accessing instructor route",
			userRole:      string(domain.RoleInstructor),
			allowedRoles:  []string{"instructor"},
			expectStatus:  fiber.StatusOK,
			expectSuccess: true,
			setUserRole:   true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			app := fiber.New()

			// Setup test route with RBAC middleware
			app.Get("/test", RBACMiddleware(tt.allowedRoles...), func(c *fiber.Ctx) error {
				return c.JSON(fiber.Map{
					"success": true,
					"message": "Access granted",
				})
			})

			// Create request
			req := httptest.NewRequest("GET", "/test", nil)

			// Setup context with user role if needed
			resp, err := app.Test(req, -1)
			if err != nil {
				t.Fatalf("Failed to test request: %v", err)
			}

			// For requests that need authentication context, we need to manually set it
			if tt.setUserRole {
				app = fiber.New()
				app.Use(func(c *fiber.Ctx) error {
					c.Locals(UserRoleKey, tt.userRole)
					c.Locals(UserIDKey, "test-user-id")
					c.Locals(UserEmailKey, "test@example.com")
					return c.Next()
				})
				app.Get("/test", RBACMiddleware(tt.allowedRoles...), func(c *fiber.Ctx) error {
					return c.JSON(fiber.Map{
						"success": true,
						"message": "Access granted",
					})
				})

				req = httptest.NewRequest("GET", "/test", nil)
				resp, err = app.Test(req, -1)
				if err != nil {
					t.Fatalf("Failed to test request: %v", err)
				}
			}

			// Check status code
			if resp.StatusCode != tt.expectStatus {
				t.Errorf("Expected status %d, got %d", tt.expectStatus, resp.StatusCode)
			}

			// Parse response body
			body, err := io.ReadAll(resp.Body)
			if err != nil {
				t.Fatalf("Failed to read response body: %v", err)
			}

			var response map[string]interface{}
			if err := json.Unmarshal(body, &response); err != nil {
				t.Fatalf("Failed to parse JSON response: %v", err)
			}

			// Check success field
			if success, ok := response["success"].(bool); ok {
				if success != tt.expectSuccess {
					t.Errorf("Expected success=%v, got success=%v", tt.expectSuccess, success)
				}
			}
		})
	}
}

func TestRBACHierarchyMiddleware(t *testing.T) {
	tests := []struct {
		name          string
		userRole      string
		minRole       string
		expectStatus  int
		expectSuccess bool
		setUserRole   bool
	}{
		{
			name:          "SuperAdmin accessing admin-level route",
			userRole:      string(domain.RoleSuperAdmin),
			minRole:       string(domain.RoleAdmin),
			expectStatus:  fiber.StatusOK,
			expectSuccess: true,
			setUserRole:   true,
		},
		{
			name:          "Admin accessing admin-level route",
			userRole:      string(domain.RoleAdmin),
			minRole:       string(domain.RoleAdmin),
			expectStatus:  fiber.StatusOK,
			expectSuccess: true,
			setUserRole:   true,
		},
		{
			name:          "Instructor accessing admin-level route",
			userRole:      string(domain.RoleInstructor),
			minRole:       string(domain.RoleAdmin),
			expectStatus:  fiber.StatusForbidden,
			expectSuccess: false,
			setUserRole:   true,
		},
		{
			name:          "Admin accessing instructor-level route",
			userRole:      string(domain.RoleAdmin),
			minRole:       string(domain.RoleInstructor),
			expectStatus:  fiber.StatusOK,
			expectSuccess: true,
			setUserRole:   true,
		},
		{
			name:          "Instructor accessing instructor-level route",
			userRole:      string(domain.RoleInstructor),
			minRole:       string(domain.RoleInstructor),
			expectStatus:  fiber.StatusOK,
			expectSuccess: true,
			setUserRole:   true,
		},
		{
			name:          "Student accessing instructor-level route",
			userRole:      string(domain.RoleStudent),
			minRole:       string(domain.RoleInstructor),
			expectStatus:  fiber.StatusForbidden,
			expectSuccess: false,
			setUserRole:   true,
		},
		{
			name:          "No authentication",
			minRole:       string(domain.RoleAdmin),
			expectStatus:  fiber.StatusUnauthorized,
			expectSuccess: false,
			setUserRole:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			app := fiber.New()

			if tt.setUserRole {
				app.Use(func(c *fiber.Ctx) error {
					c.Locals(UserRoleKey, tt.userRole)
					c.Locals(UserIDKey, "test-user-id")
					return c.Next()
				})
			}

			app.Get("/test", RBACHierarchyMiddleware(tt.minRole), func(c *fiber.Ctx) error {
				return c.JSON(fiber.Map{
					"success": true,
					"message": "Access granted",
				})
			})

			req := httptest.NewRequest("GET", "/test", nil)
			resp, err := app.Test(req, -1)
			if err != nil {
				t.Fatalf("Failed to test request: %v", err)
			}

			if resp.StatusCode != tt.expectStatus {
				t.Errorf("Expected status %d, got %d", tt.expectStatus, resp.StatusCode)
			}

			body, err := io.ReadAll(resp.Body)
			if err != nil {
				t.Fatalf("Failed to read response body: %v", err)
			}

			var response map[string]interface{}
			if err := json.Unmarshal(body, &response); err != nil {
				t.Fatalf("Failed to parse JSON response: %v", err)
			}

			if success, ok := response["success"].(bool); ok {
				if success != tt.expectSuccess {
					t.Errorf("Expected success=%v, got success=%v", tt.expectSuccess, success)
				}
			}
		})
	}
}

func TestRequireRole(t *testing.T) {
	app := fiber.New()

	app.Use(func(c *fiber.Ctx) error {
		c.Locals(UserRoleKey, string(domain.RoleAdmin))
		c.Locals(UserIDKey, "test-user-id")
		return c.Next()
	})

	app.Get("/admin", RequireRole("admin"), func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"success": true})
	})

	req := httptest.NewRequest("GET", "/admin", nil)
	resp, err := app.Test(req, -1)
	if err != nil {
		t.Fatalf("Failed to test request: %v", err)
	}

	if resp.StatusCode != fiber.StatusOK {
		t.Errorf("Expected status 200, got %d", resp.StatusCode)
	}
}

func TestRequireAdmin(t *testing.T) {
	tests := []struct {
		name         string
		userRole     string
		expectStatus int
	}{
		{
			name:         "SuperAdmin can access",
			userRole:     string(domain.RoleSuperAdmin),
			expectStatus: fiber.StatusOK,
		},
		{
			name:         "Admin can access",
			userRole:     string(domain.RoleAdmin),
			expectStatus: fiber.StatusOK,
		},
		{
			name:         "Instructor cannot access",
			userRole:     string(domain.RoleInstructor),
			expectStatus: fiber.StatusForbidden,
		},
		{
			name:         "Student cannot access",
			userRole:     string(domain.RoleStudent),
			expectStatus: fiber.StatusForbidden,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			app := fiber.New()

			app.Use(func(c *fiber.Ctx) error {
				c.Locals(UserRoleKey, tt.userRole)
				c.Locals(UserIDKey, "test-user-id")
				return c.Next()
			})

			app.Get("/admin", RequireAdmin(), func(c *fiber.Ctx) error {
				return c.JSON(fiber.Map{"success": true})
			})

			req := httptest.NewRequest("GET", "/admin", nil)
			resp, err := app.Test(req, -1)
			if err != nil {
				t.Fatalf("Failed to test request: %v", err)
			}

			if resp.StatusCode != tt.expectStatus {
				t.Errorf("Expected status %d, got %d", tt.expectStatus, resp.StatusCode)
			}
		})
	}
}

func TestRequireSuperAdmin(t *testing.T) {
	tests := []struct {
		name         string
		userRole     string
		expectStatus int
	}{
		{
			name:         "SuperAdmin can access",
			userRole:     string(domain.RoleSuperAdmin),
			expectStatus: fiber.StatusOK,
		},
		{
			name:         "Admin cannot access",
			userRole:     string(domain.RoleAdmin),
			expectStatus: fiber.StatusForbidden,
		},
		{
			name:         "Instructor cannot access",
			userRole:     string(domain.RoleInstructor),
			expectStatus: fiber.StatusForbidden,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			app := fiber.New()

			app.Use(func(c *fiber.Ctx) error {
				c.Locals(UserRoleKey, tt.userRole)
				c.Locals(UserIDKey, "test-user-id")
				return c.Next()
			})

			app.Get("/superadmin", RequireSuperAdmin(), func(c *fiber.Ctx) error {
				return c.JSON(fiber.Map{"success": true})
			})

			req := httptest.NewRequest("GET", "/superadmin", nil)
			resp, err := app.Test(req, -1)
			if err != nil {
				t.Fatalf("Failed to test request: %v", err)
			}

			if resp.StatusCode != tt.expectStatus {
				t.Errorf("Expected status %d, got %d", tt.expectStatus, resp.StatusCode)
			}
		})
	}
}

func TestRequireInstructor(t *testing.T) {
	tests := []struct {
		name         string
		userRole     string
		expectStatus int
	}{
		{
			name:         "SuperAdmin can access",
			userRole:     string(domain.RoleSuperAdmin),
			expectStatus: fiber.StatusOK,
		},
		{
			name:         "Admin can access",
			userRole:     string(domain.RoleAdmin),
			expectStatus: fiber.StatusOK,
		},
		{
			name:         "Instructor can access",
			userRole:     string(domain.RoleInstructor),
			expectStatus: fiber.StatusOK,
		},
		{
			name:         "Student cannot access",
			userRole:     string(domain.RoleStudent),
			expectStatus: fiber.StatusForbidden,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			app := fiber.New()

			app.Use(func(c *fiber.Ctx) error {
				c.Locals(UserRoleKey, tt.userRole)
				c.Locals(UserIDKey, "test-user-id")
				return c.Next()
			})

			app.Get("/instructor", RequireInstructor(), func(c *fiber.Ctx) error {
				return c.JSON(fiber.Map{"success": true})
			})

			req := httptest.NewRequest("GET", "/instructor", nil)
			resp, err := app.Test(req, -1)
			if err != nil {
				t.Fatalf("Failed to test request: %v", err)
			}

			if resp.StatusCode != tt.expectStatus {
				t.Errorf("Expected status %d, got %d", tt.expectStatus, resp.StatusCode)
			}
		})
	}
}

func TestHasAnyRole(t *testing.T) {
	tests := []struct {
		name         string
		userRole     string
		checkRoles   []string
		expectResult bool
		setUserRole  bool
	}{
		{
			name:         "User has one of the roles",
			userRole:     string(domain.RoleAdmin),
			checkRoles:   []string{"admin", "superadmin"},
			expectResult: true,
			setUserRole:  true,
		},
		{
			name:         "User doesn't have any of the roles",
			userRole:     string(domain.RoleStudent),
			checkRoles:   []string{"admin", "superadmin"},
			expectResult: false,
			setUserRole:  true,
		},
		{
			name:         "No user role set",
			checkRoles:   []string{"admin"},
			expectResult: false,
			setUserRole:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			app := fiber.New()

			var result bool
			app.Get("/test", func(c *fiber.Ctx) error {
				if tt.setUserRole {
					c.Locals(UserRoleKey, tt.userRole)
				}
				result = HasAnyRole(c, tt.checkRoles...)
				return c.SendStatus(fiber.StatusOK)
			})

			req := httptest.NewRequest("GET", "/test", nil)
			_, err := app.Test(req, -1)
			if err != nil {
				t.Fatalf("Failed to test request: %v", err)
			}

			if result != tt.expectResult {
				t.Errorf("Expected result=%v, got result=%v", tt.expectResult, result)
			}
		})
	}
}

func TestHasMinimumRole(t *testing.T) {
	tests := []struct {
		name         string
		userRole     string
		minRole      string
		expectResult bool
		setUserRole  bool
	}{
		{
			name:         "SuperAdmin meets admin requirement",
			userRole:     string(domain.RoleSuperAdmin),
			minRole:      string(domain.RoleAdmin),
			expectResult: true,
			setUserRole:  true,
		},
		{
			name:         "Admin meets admin requirement",
			userRole:     string(domain.RoleAdmin),
			minRole:      string(domain.RoleAdmin),
			expectResult: true,
			setUserRole:  true,
		},
		{
			name:         "Instructor doesn't meet admin requirement",
			userRole:     string(domain.RoleInstructor),
			minRole:      string(domain.RoleAdmin),
			expectResult: false,
			setUserRole:  true,
		},
		{
			name:         "Admin meets instructor requirement",
			userRole:     string(domain.RoleAdmin),
			minRole:      string(domain.RoleInstructor),
			expectResult: true,
			setUserRole:  true,
		},
		{
			name:         "No user role set",
			minRole:      string(domain.RoleAdmin),
			expectResult: false,
			setUserRole:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			app := fiber.New()

			var result bool
			app.Get("/test", func(c *fiber.Ctx) error {
				if tt.setUserRole {
					c.Locals(UserRoleKey, tt.userRole)
				}
				result = HasMinimumRole(c, tt.minRole)
				return c.SendStatus(fiber.StatusOK)
			})

			req := httptest.NewRequest("GET", "/test", nil)
			_, err := app.Test(req, -1)
			if err != nil {
				t.Fatalf("Failed to test request: %v", err)
			}

			if result != tt.expectResult {
				t.Errorf("Expected result=%v, got result=%v", tt.expectResult, result)
			}
		})
	}
}

func BenchmarkRBACMiddleware(b *testing.B) {
	app := fiber.New()

	app.Use(func(c *fiber.Ctx) error {
		c.Locals(UserRoleKey, string(domain.RoleAdmin))
		c.Locals(UserIDKey, "test-user-id")
		return c.Next()
	})

	app.Get("/test", RBACMiddleware("admin", "superadmin"), func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	req := httptest.NewRequest("GET", "/test", nil)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = app.Test(req, -1)
	}
}

func BenchmarkRBACHierarchyMiddleware(b *testing.B) {
	app := fiber.New()

	app.Use(func(c *fiber.Ctx) error {
		c.Locals(UserRoleKey, string(domain.RoleAdmin))
		c.Locals(UserIDKey, "test-user-id")
		return c.Next()
	})

	app.Get("/test", RBACHierarchyMiddleware(string(domain.RoleInstructor)), func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusOK)
	})

	req := httptest.NewRequest("GET", "/test", nil)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = app.Test(req, -1)
	}
}
