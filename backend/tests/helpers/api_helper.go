package helpers

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/DanielIturra1610/stegmaier-landing/internal/server"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/config"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/database"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/tokens"
	"github.com/gofiber/fiber/v2"
)

// TestServer represents a test Fiber server instance
type TestServer struct {
	App       *fiber.App
	Config    *config.Config
	DBManager *database.Manager
	ControlDB *TestDatabase
}

// CreateTestServer creates a Fiber server instance for testing
func CreateTestServer(t *testing.T) *TestServer {
	t.Helper()

	// Create test database manager and control DB
	manager, controlDB := CreateTestDatabaseManager(t)

	// Create test config
	cfg := &config.Config{
		Server: config.ServerConfig{
			Port:        "8080",
			Environment: "test",
			CORSOrigins: []string{"http://localhost:3000"},
		},
		Database: config.DatabaseConfig{
			Control: config.DatabaseConnection{
				Name:     controlDB.Name,
				Host:     "localhost",
				Port:     5432,
				User:     "postgres",
				Password: "postgres",
				SSLMode:  "disable",
			},
		},
	}

	// Create server
	srv := server.New(cfg, manager)

	return &TestServer{
		App:       srv.GetApp(),
		Config:    cfg,
		DBManager: manager,
		ControlDB: controlDB,
	}
}

// MakeRequest makes an HTTP request to the test server
func MakeRequest(t *testing.T, app *fiber.App, method, path string, body interface{}, headers map[string]string) *httptest.ResponseRecorder {
	t.Helper()

	// Prepare request body
	var bodyReader io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("Failed to marshal request body: %v", err)
		}
		bodyReader = bytes.NewReader(jsonBody)
	}

	// Create request
	req := httptest.NewRequest(method, path, bodyReader)

	// Set default Content-Type if body is present
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	// Add custom headers
	for key, value := range headers {
		req.Header.Set(key, value)
	}

	// Execute request
	resp, err := app.Test(req, -1) // -1 means no timeout
	if err != nil {
		t.Fatalf("Request failed: %v", err)
	}

	// Convert to ResponseRecorder for easier testing
	recorder := httptest.NewRecorder()
	recorder.Code = resp.StatusCode

	// Copy headers
	for key, values := range resp.Header {
		for _, value := range values {
			recorder.Header().Add(key, value)
		}
	}

	// Copy response body
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("Failed to read response body: %v", err)
	}
	recorder.Body = bytes.NewBuffer(bodyBytes)

	return recorder
}

// ParseJSONResponse parses a JSON response into a target struct
func ParseJSONResponse(t *testing.T, resp *httptest.ResponseRecorder, target interface{}) {
	t.Helper()

	body := resp.Body.Bytes()
	if len(body) == 0 {
		t.Fatal("Response body is empty")
	}

	err := json.Unmarshal(body, target)
	if err != nil {
		t.Fatalf("Failed to parse JSON response: %v\nBody: %s", err, string(body))
	}
}

// AssertStatusCode asserts that the response has the expected status code
func AssertStatusCode(t *testing.T, resp *httptest.ResponseRecorder, expectedStatus int) {
	t.Helper()

	if resp.Code != expectedStatus {
		body := resp.Body.String()
		t.Fatalf("Expected status %d, got %d\nBody: %s", expectedStatus, resp.Code, body)
	}
}

// AssertJSONResponse asserts status code and parses JSON response
func AssertJSONResponse(t *testing.T, resp *httptest.ResponseRecorder, expectedStatus int, target interface{}) {
	t.Helper()

	AssertStatusCode(t, resp, expectedStatus)
	ParseJSONResponse(t, resp, target)
}

// GetResponseBody returns the response body as string
func GetResponseBody(resp *httptest.ResponseRecorder) string {
	return resp.Body.String()
}

// RequestOptions represents options for making requests
type RequestOptions struct {
	Method      string
	Path        string
	Body        interface{}
	Headers     map[string]string
	QueryParams map[string]string
}

// MakeRequestWithOptions makes a request with detailed options
func MakeRequestWithOptions(t *testing.T, app *fiber.App, opts RequestOptions) *httptest.ResponseRecorder {
	t.Helper()

	// Build path with query params
	path := opts.Path
	if len(opts.QueryParams) > 0 {
		first := true
		for key, value := range opts.QueryParams {
			if first {
				path += "?"
				first = false
			} else {
				path += "&"
			}
			path += key + "=" + value
		}
	}

	return MakeRequest(t, app, opts.Method, path, opts.Body, opts.Headers)
}

// AuthHeaders creates headers with authentication token
func AuthHeaders(token string) map[string]string {
	return map[string]string{
		"Authorization": "Bearer " + token,
	}
}

// TenantHeaders creates headers with tenant ID
func TenantHeaders(tenantID string) map[string]string {
	return map[string]string{
		"X-Tenant-ID": tenantID,
	}
}

// AuthAndTenantHeaders creates headers with both auth and tenant
func AuthAndTenantHeaders(token, tenantID string) map[string]string {
	return map[string]string{
		"Authorization": "Bearer " + token,
		"X-Tenant-ID":   tenantID,
	}
}

// TestAPIResponse represents a standard test API response
type TestAPIResponse struct {
	Success bool                   `json:"success"`
	Data    map[string]interface{} `json:"data,omitempty"`
	Error   *TestErrorData         `json:"error,omitempty"`
	Meta    *TestMeta              `json:"meta,omitempty"`
}

// TestErrorData represents error data in test responses
type TestErrorData struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// TestMeta represents metadata in test responses
type TestMeta struct {
	Page       int `json:"page"`
	PageSize   int `json:"page_size"`
	TotalPages int `json:"total_pages"`
	TotalItems int `json:"total_items"`
}

// AssertSuccessResponse asserts that the response is successful
func AssertSuccessResponse(t *testing.T, resp *httptest.ResponseRecorder) *TestAPIResponse {
	t.Helper()

	var apiResp TestAPIResponse
	AssertJSONResponse(t, resp, fiber.StatusOK, &apiResp)

	if !apiResp.Success {
		t.Fatalf("Expected success=true, got success=false. Error: %+v", apiResp.Error)
	}

	return &apiResp
}

// AssertErrorResponse asserts that the response is an error with expected code
func AssertErrorResponse(t *testing.T, resp *httptest.ResponseRecorder, expectedStatus int, expectedErrorCode string) *TestAPIResponse {
	t.Helper()

	var apiResp TestAPIResponse
	AssertJSONResponse(t, resp, expectedStatus, &apiResp)

	if apiResp.Success {
		t.Fatal("Expected success=false, got success=true")
	}

	if apiResp.Error == nil {
		t.Fatal("Expected error data, got nil")
	}

	if apiResp.Error.Code != expectedErrorCode {
		t.Fatalf("Expected error code '%s', got '%s'", expectedErrorCode, apiResp.Error.Code)
	}

	return &apiResp
}

// CreateTestContext creates a Fiber test context (simplified version)
// Note: For complex context testing, use MakeRequest instead
func CreateTestContext(app *fiber.App, method, path string) (*fiber.Ctx, error) {
	req := httptest.NewRequest(method, path, nil)
	resp, err := app.Test(req, -1)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	return nil, nil // Fiber doesn't expose context directly in test mode
}

// Note: Fiber's context is not directly accessible in test mode.
// Use MakeRequest for testing HTTP handlers instead.

// GenerateTestToken generates a JWT token for testing
func GenerateTestToken(t *testing.T, userID, email, role, tenantID string) string {
	t.Helper()

	// Get test config to get JWT secret
	cfg := getTestConfig()

	// Create JWT service
	jwtService := tokens.NewJWTService(cfg.JWT.Secret, cfg.JWT.Expiration, "stegmaier-lms-test")

	// Create claims
	claims := &tokens.Claims{
		UserID:   userID,
		Email:    email,
		Role:     role,
		TenantID: tenantID,
	}

	// Generate token
	token, err := jwtService.Generate(claims)
	if err != nil {
		t.Fatalf("Failed to generate test token: %v", err)
	}

	return token
}

// SetupTestServer is an alias for CreateTestServer for backwards compatibility
func SetupTestServer(t *testing.T) *TestServer {
	return CreateTestServer(t)
}
