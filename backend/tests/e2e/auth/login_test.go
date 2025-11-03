package auth_test

import (
	"testing"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/hasher"
	"github.com/DanielIturra1610/stegmaier-landing/tests/fixtures"
	"github.com/DanielIturra1610/stegmaier-landing/tests/helpers"
	"github.com/gofiber/fiber/v2"
)

func TestLogin_Success(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping E2E test in short mode")
	}

	// Setup
	srv := helpers.CreateTestServer(t)
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, srv.ControlDB.DB, tenant)

	// Create test user with known password
	passwordHasher := hasher.NewBcryptHasher(10)
	hashedPassword, err := passwordHasher.Hash("TestPassword123!")
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	testUser := fixtures.NewUserBuilder(tenant.ID).
		WithEmail("testuser@example.com").
		WithPasswordHash(hashedPassword).
		AsStudent().
		Verified().
		Build()
	fixtures.CreateUser(t, srv.ControlDB.DB, testUser)

	// Prepare login request
	loginDTO := map[string]interface{}{
		"email":    "testuser@example.com",
		"password": "TestPassword123!",
	}

	// Make login request
	headers := helpers.TenantHeaders(tenant.ID)
	resp := helpers.MakeRequest(t, srv.App, "POST", "/api/v1/auth/login", loginDTO, headers)

	// Assert response
	helpers.AssertStatusCode(t, resp, fiber.StatusOK)

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

	if authResp.Data.User.Email != "testuser@example.com" {
		t.Errorf("Expected email 'testuser@example.com', got '%s'", authResp.Data.User.Email)
	}

	if authResp.Data.User.Role != "student" {
		t.Errorf("Expected role 'student', got '%s'", authResp.Data.User.Role)
	}

	// Verify password hash is not exposed
	if authResp.Data.User.PasswordHash != "" {
		t.Error("Password hash should not be exposed in response")
	}
}

func TestLogin_InvalidCredentials(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping E2E test in short mode")
	}

	// Setup
	srv := helpers.CreateTestServer(t)
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, srv.ControlDB.DB, tenant)

	// Create test user
	passwordHasher := hasher.NewBcryptHasher(10)
	hashedPassword, _ := passwordHasher.Hash("CorrectPassword123!")

	testUser := fixtures.NewUserBuilder(tenant.ID).
		WithEmail("user@example.com").
		WithPasswordHash(hashedPassword).
		Verified().
		Build()
	fixtures.CreateUser(t, srv.ControlDB.DB, testUser)

	headers := helpers.TenantHeaders(tenant.ID)

	tests := []struct {
		name        string
		loginDTO    map[string]interface{}
		expectedMsg string
	}{
		{
			name: "Wrong password",
			loginDTO: map[string]interface{}{
				"email":    "user@example.com",
				"password": "WrongPassword123!",
			},
			expectedMsg: "credentials",
		},
		{
			name: "Non-existent email",
			loginDTO: map[string]interface{}{
				"email":    "nonexistent@example.com",
				"password": "SomePassword123!",
			},
			expectedMsg: "credentials",
		},
		{
			name: "Empty password",
			loginDTO: map[string]interface{}{
				"email":    "user@example.com",
				"password": "",
			},
			expectedMsg: "",
		},
		{
			name: "Empty email",
			loginDTO: map[string]interface{}{
				"email":    "",
				"password": "SomePassword123!",
			},
			expectedMsg: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp := helpers.MakeRequest(t, srv.App, "POST", "/api/v1/auth/login", tt.loginDTO, headers)

			if resp.Code == fiber.StatusOK {
				t.Error("Expected login to fail with invalid credentials")
			}

			var errorResp struct {
				Success bool   `json:"success"`
				Error   string `json:"error"`
			}
			helpers.ParseJSONResponse(t, resp, &errorResp)

			if errorResp.Success {
				t.Error("Expected success=false for invalid credentials")
			}
		})
	}
}

func TestLogin_UnverifiedUser(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping E2E test in short mode")
	}

	// Setup
	srv := helpers.CreateTestServer(t)
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, srv.ControlDB.DB, tenant)

	// Create unverified user
	passwordHasher := hasher.NewBcryptHasher(10)
	hashedPassword, _ := passwordHasher.Hash("TestPassword123!")

	unverifiedUser := fixtures.NewUserBuilder(tenant.ID).
		WithEmail("unverified@example.com").
		WithPasswordHash(hashedPassword).
		Unverified().
		Build()
	fixtures.CreateUser(t, srv.ControlDB.DB, unverifiedUser)

	// Try to login
	loginDTO := map[string]interface{}{
		"email":    "unverified@example.com",
		"password": "TestPassword123!",
	}

	headers := helpers.TenantHeaders(tenant.ID)
	resp := helpers.MakeRequest(t, srv.App, "POST", "/api/v1/auth/login", loginDTO, headers)

	// Behavior depends on business requirements:
	// Option 1: Allow login but warn about unverified status
	// Option 2: Block login entirely for unverified users
	// Adjust this test based on your actual implementation

	if resp.Code != fiber.StatusOK && resp.Code != fiber.StatusForbidden {
		t.Errorf("Expected 200 (allow) or 403 (block), got %d", resp.Code)
	}
}

func TestLogin_DifferentRoles(t *testing.T) {
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

	roles := []struct {
		role  string
		email string
	}{
		{"student", "student@example.com"},
		{"instructor", "instructor@example.com"},
		{"admin", "admin@example.com"},
		{"superadmin", "superadmin@example.com"},
	}

	// Create users with different roles
	for _, r := range roles {
		user := fixtures.NewUserBuilder(tenant.ID).
			WithEmail(r.email).
			WithPasswordHash(hashedPassword).
			WithRole(r.role).
			Verified().
			Build()
		fixtures.CreateUser(t, srv.ControlDB.DB, user)
	}

	headers := helpers.TenantHeaders(tenant.ID)

	// Test login for each role
	for _, r := range roles {
		t.Run("Login as "+r.role, func(t *testing.T) {
			loginDTO := map[string]interface{}{
				"email":    r.email,
				"password": testPassword,
			}

			resp := helpers.MakeRequest(t, srv.App, "POST", "/api/v1/auth/login", loginDTO, headers)
			helpers.AssertStatusCode(t, resp, fiber.StatusOK)

			var authResp struct {
				Success bool `json:"success"`
				Data    struct {
					User domain.User `json:"user"`
				} `json:"data"`
			}
			helpers.ParseJSONResponse(t, resp, &authResp)

			if authResp.Data.User.Role != r.role {
				t.Errorf("Expected role %s, got %s", r.role, authResp.Data.User.Role)
			}
		})
	}
}

func TestLogin_WithoutTenantHeader(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping E2E test in short mode")
	}

	// Setup
	srv := helpers.CreateTestServer(t)

	loginDTO := map[string]interface{}{
		"email":    "test@example.com",
		"password": "TestPassword123!",
	}

	// Make request without tenant header
	resp := helpers.MakeRequest(t, srv.App, "POST", "/api/v1/auth/login", loginDTO, nil)

	// Should fail due to missing tenant
	helpers.AssertStatusCode(t, resp, fiber.StatusBadRequest)
}

func TestLogin_TenantIsolation(t *testing.T) {
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

	// Create user in tenant1
	passwordHasher := hasher.NewBcryptHasher(10)
	hashedPassword, _ := passwordHasher.Hash("TestPassword123!")

	user1 := fixtures.NewUserBuilder(tenant1.ID).
		WithEmail("user@example.com").
		WithPasswordHash(hashedPassword).
		Verified().
		Build()
	fixtures.CreateUser(t, srv.ControlDB.DB, user1)

	loginDTO := map[string]interface{}{
		"email":    "user@example.com",
		"password": "TestPassword123!",
	}

	// Login with correct tenant should succeed
	headers1 := helpers.TenantHeaders(tenant1.ID)
	resp1 := helpers.MakeRequest(t, srv.App, "POST", "/api/v1/auth/login", loginDTO, headers1)
	helpers.AssertStatusCode(t, resp1, fiber.StatusOK)

	// Login with wrong tenant should fail
	headers2 := helpers.TenantHeaders(tenant2.ID)
	resp2 := helpers.MakeRequest(t, srv.App, "POST", "/api/v1/auth/login", loginDTO, headers2)

	if resp2.Code == fiber.StatusOK {
		t.Error("Should not allow login with wrong tenant")
	}
}

func TestLogin_ReturnsValidJWT(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping E2E test in short mode")
	}

	// Setup
	srv := helpers.CreateTestServer(t)
	tenant := fixtures.DefaultTenant()
	fixtures.CreateTenant(t, srv.ControlDB.DB, tenant)

	// Create test user
	passwordHasher := hasher.NewBcryptHasher(10)
	hashedPassword, _ := passwordHasher.Hash("TestPassword123!")

	testUser := fixtures.NewUserBuilder(tenant.ID).
		WithEmail("jwt@example.com").
		WithPasswordHash(hashedPassword).
		AsAdmin().
		Verified().
		Build()
	fixtures.CreateUser(t, srv.ControlDB.DB, testUser)

	// Login
	loginDTO := map[string]interface{}{
		"email":    "jwt@example.com",
		"password": "TestPassword123!",
	}

	headers := helpers.TenantHeaders(tenant.ID)
	resp := helpers.MakeRequest(t, srv.App, "POST", "/api/v1/auth/login", loginDTO, headers)

	var authResp struct {
		Data struct {
			AccessToken string `json:"access_token"`
		} `json:"data"`
	}
	helpers.ParseJSONResponse(t, resp, &authResp)

	// Verify JWT can be used for authenticated requests
	authHeaders := helpers.AuthAndTenantHeaders(authResp.Data.AccessToken, tenant.ID)
	meResp := helpers.MakeRequest(t, srv.App, "GET", "/api/v1/auth/me", nil, authHeaders)

	helpers.AssertStatusCode(t, meResp, fiber.StatusOK)

	var meData struct {
		Success bool `json:"success"`
		Data    struct {
			User domain.User `json:"user"`
		} `json:"data"`
	}
	helpers.ParseJSONResponse(t, meResp, &meData)

	if meData.Data.User.Email != "jwt@example.com" {
		t.Errorf("JWT didn't authenticate correctly, expected 'jwt@example.com', got '%s'", meData.Data.User.Email)
	}

	if meData.Data.User.Role != "admin" {
		t.Errorf("JWT didn't preserve role, expected 'admin', got '%s'", meData.Data.User.Role)
	}
}
