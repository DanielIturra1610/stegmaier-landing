package auth_test

import (
	"testing"

	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/hasher"
	"github.com/DanielIturra1610/stegmaier-landing/tests/fixtures"
	"github.com/DanielIturra1610/stegmaier-landing/tests/helpers"
	"github.com/gofiber/fiber/v2"
)

// Helper to login and get token
func loginAndGetToken(t *testing.T, srv *helpers.TestServer, email, password, tenantID string) string {
	t.Helper()

	loginDTO := map[string]interface{}{
		"email":    email,
		"password": password,
	}

	headers := helpers.TenantHeaders(tenantID)
	resp := helpers.MakeRequest(t, srv.App, "POST", "/api/v1/auth/login", loginDTO, headers)

	if resp.Code != fiber.StatusOK {
		t.Fatalf("Login failed with status %d", resp.Code)
	}

	var authResp struct {
		Data struct {
			AccessToken string `json:"access_token"`
		} `json:"data"`
	}
	helpers.ParseJSONResponse(t, resp, &authResp)

	return authResp.Data.AccessToken
}

func TestProtectedRoutes_AuthenticationRequired(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping E2E test in short mode")
	}

	// Setup
	srv := helpers.CreateTestServer(t)
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, srv.ControlDB.DB, tenant)

	protectedEndpoints := []struct {
		method string
		path   string
	}{
		{"GET", "/api/v1/auth/me"},
		{"PUT", "/api/v1/auth/profile"},
		{"POST", "/api/v1/auth/change-password"},
		{"POST", "/api/v1/auth/logout"},
		{"POST", "/api/v1/auth/revoke-sessions"},
	}

	for _, endpoint := range protectedEndpoints {
		t.Run(endpoint.method+" "+endpoint.path, func(t *testing.T) {
			// Make request without authentication
			headers := helpers.TenantHeaders(tenant.ID)
			resp := helpers.MakeRequest(t, srv.App, endpoint.method, endpoint.path, nil, headers)

			// Should return 401 Unauthorized
			helpers.AssertStatusCode(t, resp, fiber.StatusUnauthorized)

			var errorResp struct {
				Success bool   `json:"success"`
				Error   string `json:"error"`
			}
			helpers.ParseJSONResponse(t, resp, &errorResp)

			if errorResp.Success {
				t.Error("Expected success=false for unauthenticated request")
			}
		})
	}
}

func TestRBAC_AdminRoutesAccess(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping E2E test in short mode")
	}

	// Setup
	srv := helpers.CreateTestServer(t)
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, srv.ControlDB.DB, tenant)

	passwordHasher := hasher.NewBcryptHasher(10)
	testPassword := "TestPassword123!"
	hashedPassword, _ := passwordHasher.Hash(testPassword)

	// Create users with different roles
	studentUser := fixtures.NewUserBuilder(tenant.ID).
		WithEmail("student@example.com").
		WithPasswordHash(hashedPassword).
		AsStudent().
		Verified().
		Build()
	fixtures.CreateUser(t, srv.ControlDB.DB, studentUser)

	instructorUser := fixtures.NewUserBuilder(tenant.ID).
		WithEmail("instructor@example.com").
		WithPasswordHash(hashedPassword).
		AsInstructor().
		Verified().
		Build()
	fixtures.CreateUser(t, srv.ControlDB.DB, instructorUser)

	adminUser := fixtures.NewUserBuilder(tenant.ID).
		WithEmail("admin@example.com").
		WithPasswordHash(hashedPassword).
		AsAdmin().
		Verified().
		Build()
	fixtures.CreateUser(t, srv.ControlDB.DB, adminUser)

	superAdminUser := fixtures.NewUserBuilder(tenant.ID).
		WithEmail("superadmin@example.com").
		WithPasswordHash(hashedPassword).
		AsSuperAdmin().
		Verified().
		Build()
	fixtures.CreateUser(t, srv.ControlDB.DB, superAdminUser)

	// Get tokens for each user
	studentToken := loginAndGetToken(t, srv, "student@example.com", testPassword, tenant.ID)
	instructorToken := loginAndGetToken(t, srv, "instructor@example.com", testPassword, tenant.ID)
	adminToken := loginAndGetToken(t, srv, "admin@example.com", testPassword, tenant.ID)
	superAdminToken := loginAndGetToken(t, srv, "superadmin@example.com", testPassword, tenant.ID)

	// Admin routes that require admin or higher
	adminEndpoints := []string{
		"/api/v1/admin/users",
		"/api/v1/admin/users/" + studentUser.ID,
	}

	for _, endpoint := range adminEndpoints {
		t.Run("Admin route: "+endpoint, func(t *testing.T) {
			// Student should be denied
			headers := helpers.AuthAndTenantHeaders(studentToken, tenant.ID)
			resp := helpers.MakeRequest(t, srv.App, "GET", endpoint, nil, headers)
			if resp.Code != fiber.StatusForbidden {
				t.Errorf("Student should be forbidden from admin route, got status %d", resp.Code)
			}

			// Instructor should be denied
			headers = helpers.AuthAndTenantHeaders(instructorToken, tenant.ID)
			resp = helpers.MakeRequest(t, srv.App, "GET", endpoint, nil, headers)
			if resp.Code != fiber.StatusForbidden {
				t.Errorf("Instructor should be forbidden from admin route, got status %d", resp.Code)
			}

			// Admin should be allowed
			headers = helpers.AuthAndTenantHeaders(adminToken, tenant.ID)
			resp = helpers.MakeRequest(t, srv.App, "GET", endpoint, nil, headers)
			if resp.Code == fiber.StatusForbidden {
				t.Error("Admin should be allowed to access admin route")
			}

			// SuperAdmin should be allowed
			headers = helpers.AuthAndTenantHeaders(superAdminToken, tenant.ID)
			resp = helpers.MakeRequest(t, srv.App, "GET", endpoint, nil, headers)
			if resp.Code == fiber.StatusForbidden {
				t.Error("SuperAdmin should be allowed to access admin route")
			}
		})
	}
}

func TestRBAC_SuperAdminOnlyRoutes(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping E2E test in short mode")
	}

	// Setup
	srv := helpers.CreateTestServer(t)
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, srv.ControlDB.DB, tenant)

	passwordHasher := hasher.NewBcryptHasher(10)
	testPassword := "TestPassword123!"
	hashedPassword, _ := passwordHasher.Hash(testPassword)

	// Create users
	adminUser := fixtures.NewUserBuilder(tenant.ID).
		WithEmail("admin@example.com").
		WithPasswordHash(hashedPassword).
		AsAdmin().
		Verified().
		Build()
	fixtures.CreateUser(t, srv.ControlDB.DB, adminUser)

	superAdminUser := fixtures.NewUserBuilder(tenant.ID).
		WithEmail("superadmin@example.com").
		WithPasswordHash(hashedPassword).
		AsSuperAdmin().
		Verified().
		Build()
	fixtures.CreateUser(t, srv.ControlDB.DB, superAdminUser)

	// Get tokens
	adminToken := loginAndGetToken(t, srv, "admin@example.com", testPassword, tenant.ID)
	superAdminToken := loginAndGetToken(t, srv, "superadmin@example.com", testPassword, tenant.ID)

	// SuperAdmin-only routes
	superAdminEndpoints := []string{
		"/api/v1/superadmin/tenants/" + tenant.ID + "/users",
		"/api/v1/superadmin/tenants/" + tenant.ID + "/users/count",
	}

	for _, endpoint := range superAdminEndpoints {
		t.Run("SuperAdmin route: "+endpoint, func(t *testing.T) {
			// Admin should be denied
			headers := helpers.AuthAndTenantHeaders(adminToken, tenant.ID)
			resp := helpers.MakeRequest(t, srv.App, "GET", endpoint, nil, headers)
			if resp.Code != fiber.StatusForbidden {
				t.Errorf("Admin should be forbidden from superadmin route, got status %d", resp.Code)
			}

			// SuperAdmin should be allowed
			headers = helpers.AuthAndTenantHeaders(superAdminToken, tenant.ID)
			resp = helpers.MakeRequest(t, srv.App, "GET", endpoint, nil, headers)
			if resp.Code == fiber.StatusForbidden {
				t.Error("SuperAdmin should be allowed to access superadmin route")
			}
		})
	}
}

func TestRBAC_RoleHierarchy(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping E2E test in short mode")
	}

	// Setup
	srv := helpers.CreateTestServer(t)
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, srv.ControlDB.DB, tenant)

	passwordHasher := hasher.NewBcryptHasher(10)
	testPassword := "TestPassword123!"
	hashedPassword, _ := passwordHasher.Hash(testPassword)

	// Create users with all roles
	roles := []struct {
		email string
		role  string
	}{
		{"student@test.com", "student"},
		{"instructor@test.com", "instructor"},
		{"admin@test.com", "admin"},
		{"superadmin@test.com", "superadmin"},
	}

	tokens := make(map[string]string)

	for _, r := range roles {
		user := fixtures.NewUserBuilder(tenant.ID).
			WithEmail(r.email).
			WithPasswordHash(hashedPassword).
			WithRole(r.role).
			Verified().
			Build()
		fixtures.CreateUser(t, srv.ControlDB.DB, user)

		tokens[r.role] = loginAndGetToken(t, srv, r.email, testPassword, tenant.ID)
	}

	// Test role hierarchy: SuperAdmin > Admin > Instructor > Student
	tests := []struct {
		route         string
		minRole       string
		allowedRoles  []string
		forbiddenRoles []string
	}{
		{
			route:          "/api/v1/admin/users",
			minRole:        "admin",
			allowedRoles:   []string{"admin", "superadmin"},
			forbiddenRoles: []string{"student", "instructor"},
		},
		{
			route:          "/api/v1/superadmin/tenants/" + tenant.ID + "/users",
			minRole:        "superadmin",
			allowedRoles:   []string{"superadmin"},
			forbiddenRoles: []string{"student", "instructor", "admin"},
		},
	}

	for _, tt := range tests {
		t.Run("Route "+tt.route+" requires "+tt.minRole, func(t *testing.T) {
			// Test allowed roles
			for _, role := range tt.allowedRoles {
				headers := helpers.AuthAndTenantHeaders(tokens[role], tenant.ID)
				resp := helpers.MakeRequest(t, srv.App, "GET", tt.route, nil, headers)

				if resp.Code == fiber.StatusForbidden {
					t.Errorf("Role %s should be allowed, got %d", role, resp.Code)
				}
			}

			// Test forbidden roles
			for _, role := range tt.forbiddenRoles {
				headers := helpers.AuthAndTenantHeaders(tokens[role], tenant.ID)
				resp := helpers.MakeRequest(t, srv.App, "GET", tt.route, nil, headers)

				if resp.Code != fiber.StatusForbidden {
					t.Errorf("Role %s should be forbidden, got %d", role, resp.Code)
				}
			}
		})
	}
}

func TestRBAC_TokenWithWrongRole(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping E2E test in short mode")
	}

	// Setup
	srv := helpers.CreateTestServer(t)
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, srv.ControlDB.DB, tenant)

	// Create student user
	passwordHasher := hasher.NewBcryptHasher(10)
	hashedPassword, _ := passwordHasher.Hash("TestPassword123!")

	studentUser := fixtures.NewUserBuilder(tenant.ID).
		WithEmail("student@test.com").
		WithPasswordHash(hashedPassword).
		AsStudent().
		Verified().
		Build()
	fixtures.CreateUser(t, srv.ControlDB.DB, studentUser)

	// Get student token
	studentToken := loginAndGetToken(t, srv, "student@test.com", "TestPassword123!", tenant.ID)

	// Try to access admin route
	headers := helpers.AuthAndTenantHeaders(studentToken, tenant.ID)
	resp := helpers.MakeRequest(t, srv.App, "GET", "/api/v1/admin/users", nil, headers)

	// Should be forbidden
	helpers.AssertStatusCode(t, resp, fiber.StatusForbidden)

	var errorResp struct {
		Success bool   `json:"success"`
		Error   string `json:"error"`
	}
	helpers.ParseJSONResponse(t, resp, &errorResp)

	if errorResp.Success {
		t.Error("Expected success=false for insufficient permissions")
	}

	if errorResp.Error == "" {
		t.Error("Expected error message for insufficient permissions")
	}
}

func TestRBAC_ExpiredToken(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping E2E test in short mode")
	}

	// Setup
	srv := helpers.CreateTestServer(t)
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, srv.ControlDB.DB, tenant)

	// Use an expired or invalid token
	expiredToken := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"

	headers := helpers.AuthAndTenantHeaders(expiredToken, tenant.ID)
	resp := helpers.MakeRequest(t, srv.App, "GET", "/api/v1/auth/me", nil, headers)

	// Should be unauthorized
	helpers.AssertStatusCode(t, resp, fiber.StatusUnauthorized)
}

func TestRBAC_NoRoleInToken(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping E2E test in short mode")
	}

	// This test verifies that if somehow a token without a role gets through,
	// RBAC middleware properly denies access

	// Setup
	srv := helpers.CreateTestServer(t)
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, srv.ControlDB.DB, tenant)

	// This would require creating a malformed token or modifying user role after token generation
	// For now, we'll skip this test as it requires more complex token manipulation
	t.Skip("Requires token manipulation utility - implement if needed")
}

func TestRBAC_CrossTenantAccess(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping E2E test in short mode")
	}

	// Setup
	srv := helpers.CreateTestServer(t)

	// Create two tenants
	tenant1 := fixtures.NewTenantBuilder().
		WithName("Tenant 1").
		WithSlug("tenant1").
		Build()
	fixtures.CreateTenant(t, srv.ControlDB.DB, tenant1)

	tenant2 := fixtures.NewTenantBuilder().
		WithName("Tenant 2").
		WithSlug("tenant2").
		Build()
	fixtures.CreateTenant(t, srv.ControlDB.DB, tenant2)

	// Create admin in tenant1
	passwordHasher := hasher.NewBcryptHasher(10)
	hashedPassword, _ := passwordHasher.Hash("TestPassword123!")

	admin1 := fixtures.NewUserBuilder(tenant1.ID).
		WithEmail("admin1@test.com").
		WithPasswordHash(hashedPassword).
		AsAdmin().
		Verified().
		Build()
	fixtures.CreateUser(t, srv.ControlDB.DB, admin1)

	// Get token for admin1
	admin1Token := loginAndGetToken(t, srv, "admin1@test.com", "TestPassword123!", tenant1.ID)

	// Try to access tenant2's resources with tenant1 admin token
	headers := helpers.AuthAndTenantHeaders(admin1Token, tenant2.ID)
	resp := helpers.MakeRequest(t, srv.App, "GET", "/api/v1/admin/users", nil, headers)

	// Should be denied (tenant mismatch)
	if resp.Code == fiber.StatusOK {
		t.Error("Should not allow cross-tenant access")
	}
}
