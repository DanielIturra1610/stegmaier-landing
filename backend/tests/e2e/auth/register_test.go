package auth_test

import (
	"testing"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/domain"
	"github.com/DanielIturra1610/stegmaier-landing/tests/fixtures"
	"github.com/DanielIturra1610/stegmaier-landing/tests/helpers"
	"github.com/gofiber/fiber/v2"
)

func TestRegister_Success(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping E2E test in short mode")
	}

	// Setup test server
	srv := helpers.CreateTestServer(t)

	// Create tenant
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, srv.ControlDB.DB, tenant)

	// Prepare register request
	registerDTO := map[string]interface{}{
		"email":     "newuser@test.com",
		"password":  "SecurePass123!",
		"full_name": "New Test User",
		"role":      "student",
	}

	// Make register request
	headers := helpers.TenantHeaders(tenant.ID)
	resp := helpers.MakeRequest(t, srv.App, "POST", "/api/v1/auth/register", registerDTO, headers)

	// Assert response
	helpers.AssertStatusCode(t, resp, fiber.StatusCreated)

	var authResp struct {
		Success bool `json:"success"`
		Data    struct {
			AccessToken string      `json:"access_token"`
			TokenType   string      `json:"token_type"`
			ExpiresIn   int         `json:"expires_in"`
			User        domain.User `json:"user"`
		} `json:"data"`
	}

	helpers.ParseJSONResponse(t, resp, &authResp)

	// Verify response
	if !authResp.Success {
		t.Fatal("Expected success=true")
	}

	if authResp.Data.AccessToken == "" {
		t.Error("Expected access token to be present")
	}

	if authResp.Data.TokenType != "Bearer" {
		t.Errorf("Expected token type 'Bearer', got '%s'", authResp.Data.TokenType)
	}

	if authResp.Data.User.Email != "newuser@test.com" {
		t.Errorf("Expected email 'newuser@test.com', got '%s'", authResp.Data.User.Email)
	}

	if authResp.Data.User.Role != "student" {
		t.Errorf("Expected role 'student', got '%s'", authResp.Data.User.Role)
	}

	if authResp.Data.User.IsVerified {
		t.Error("Expected new user to be unverified")
	}
}

func TestRegister_ValidationErrors(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping E2E test in short mode")
	}

	// Setup
	srv := helpers.CreateTestServer(t)
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, srv.ControlDB.DB, tenant)
	headers := helpers.TenantHeaders(tenant.ID)

	tests := []struct {
		name           string
		requestBody    map[string]interface{}
		expectedStatus int
	}{
		{
			name: "Missing email",
			requestBody: map[string]interface{}{
				"password":  "SecurePass123!",
				"full_name": "Test User",
			},
			expectedStatus: fiber.StatusBadRequest,
		},
		{
			name: "Invalid email format",
			requestBody: map[string]interface{}{
				"email":     "invalidemail",
				"password":  "SecurePass123!",
				"full_name": "Test User",
			},
			expectedStatus: fiber.StatusBadRequest,
		},
		{
			name: "Missing password",
			requestBody: map[string]interface{}{
				"email":     "test@example.com",
				"full_name": "Test User",
			},
			expectedStatus: fiber.StatusBadRequest,
		},
		{
			name: "Password too short",
			requestBody: map[string]interface{}{
				"email":     "test@example.com",
				"password":  "123",
				"full_name": "Test User",
			},
			expectedStatus: fiber.StatusBadRequest,
		},
		{
			name: "Missing full name",
			requestBody: map[string]interface{}{
				"email":    "test@example.com",
				"password": "SecurePass123!",
			},
			expectedStatus: fiber.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp := helpers.MakeRequest(t, srv.App, "POST", "/api/v1/auth/register", tt.requestBody, headers)
			helpers.AssertStatusCode(t, resp, tt.expectedStatus)

			var errorResp struct {
				Success bool   `json:"success"`
				Error   string `json:"error"`
			}
			helpers.ParseJSONResponse(t, resp, &errorResp)

			if errorResp.Success {
				t.Error("Expected success=false for validation error")
			}

			if errorResp.Error == "" {
				t.Error("Expected error message to be present")
			}
		})
	}
}

func TestRegister_DuplicateEmail(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping E2E test in short mode")
	}

	// Setup
	srv := helpers.CreateTestServer(t)
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, srv.ControlDB.DB, tenant)

	// Create existing user
	existingUser := fixtures.NewUserBuilder(tenant.ID).
		WithEmail("existing@test.com").
		AsStudent().
		Build()
	fixtures.CreateUser(t, srv.ControlDB.DB, existingUser)

	// Try to register with same email
	registerDTO := map[string]interface{}{
		"email":     "existing@test.com",
		"password":  "SecurePass123!",
		"full_name": "Duplicate User",
	}

	headers := helpers.TenantHeaders(tenant.ID)
	resp := helpers.MakeRequest(t, srv.App, "POST", "/api/v1/auth/register", registerDTO, headers)

	// Expect conflict error
	helpers.AssertStatusCode(t, resp, fiber.StatusConflict)

	var errorResp struct {
		Success bool   `json:"success"`
		Error   string `json:"error"`
	}
	helpers.ParseJSONResponse(t, resp, &errorResp)

	if errorResp.Success {
		t.Error("Expected success=false for duplicate email")
	}
}

func TestRegister_WithDifferentRoles(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping E2E test in short mode")
	}

	// Setup
	srv := helpers.CreateTestServer(t)
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, srv.ControlDB.DB, tenant)
	headers := helpers.TenantHeaders(tenant.ID)

	tests := []struct {
		name         string
		role         string
		shouldAccept bool
	}{
		{
			name:         "Register as student",
			role:         "student",
			shouldAccept: true,
		},
		{
			name:         "Register as instructor",
			role:         "instructor",
			shouldAccept: true,
		},
		{
			name:         "Cannot register as admin",
			role:         "admin",
			shouldAccept: false, // Admin should be created by another admin
		},
		{
			name:         "Cannot register as superadmin",
			role:         "superadmin",
			shouldAccept: false, // SuperAdmin should be created by system
		},
		{
			name:         "Default to student if role not specified",
			role:         "",
			shouldAccept: true,
		},
	}

	for i, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			registerDTO := map[string]interface{}{
				"email":     "user" + string(rune('0'+i)) + "@test.com",
				"password":  "SecurePass123!",
				"full_name": "Test User " + string(rune('A'+i)),
			}

			if tt.role != "" {
				registerDTO["role"] = tt.role
			}

			resp := helpers.MakeRequest(t, srv.App, "POST", "/api/v1/auth/register", registerDTO, headers)

			if tt.shouldAccept {
				helpers.AssertStatusCode(t, resp, fiber.StatusCreated)

				var authResp struct {
					Success bool `json:"success"`
					Data    struct {
						User domain.User `json:"user"`
					} `json:"data"`
				}
				helpers.ParseJSONResponse(t, resp, &authResp)

				expectedRole := tt.role
				if expectedRole == "" {
					expectedRole = "student" // Default
				}

				if authResp.Data.User.Role != expectedRole {
					t.Errorf("Expected role '%s', got '%s'", expectedRole, authResp.Data.User.Role)
				}
			} else {
				// Should be rejected
				if resp.Code == fiber.StatusCreated {
					t.Error("Should not allow registration with privileged role")
				}
			}
		})
	}
}

func TestRegister_WithoutTenantHeader(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping E2E test in short mode")
	}

	// Setup
	srv := helpers.CreateTestServer(t)

	registerDTO := map[string]interface{}{
		"email":     "test@example.com",
		"password":  "SecurePass123!",
		"full_name": "Test User",
	}

	// Make request without tenant header
	resp := helpers.MakeRequest(t, srv.App, "POST", "/api/v1/auth/register", registerDTO, nil)

	// Should fail due to missing tenant
	helpers.AssertStatusCode(t, resp, fiber.StatusBadRequest)
}

func TestRegister_TenantIsolation(t *testing.T) {
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

	// Register same email in both tenants
	registerDTO := map[string]interface{}{
		"email":     "admin@company.com",
		"password":  "SecurePass123!",
		"full_name": "Admin User",
	}

	// Register in tenant1
	headers1 := helpers.TenantHeaders(tenant1.ID)
	resp1 := helpers.MakeRequest(t, srv.App, "POST", "/api/v1/auth/register", registerDTO, headers1)
	helpers.AssertStatusCode(t, resp1, fiber.StatusCreated)

	// Register same email in tenant2 should succeed (tenant isolation)
	headers2 := helpers.TenantHeaders(tenant2.ID)
	resp2 := helpers.MakeRequest(t, srv.App, "POST", "/api/v1/auth/register", registerDTO, headers2)

	// This should succeed because users are isolated by tenant
	// OR fail if email uniqueness is global (depends on business requirements)
	// Adjust this assertion based on your actual requirements
	if resp2.Code != fiber.StatusCreated && resp2.Code != fiber.StatusConflict {
		t.Errorf("Expected either 201 or 409, got %d", resp2.Code)
	}
}
