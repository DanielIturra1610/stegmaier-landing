package mocks

import (
	"fmt"

	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/tokens"
)

// MockTokenService implements tokens.TokenService for testing
type MockTokenService struct {
	GenerateFunc  func(claims *tokens.Claims) (string, error)
	ValidateFunc  func(tokenString string) (*tokens.Claims, error)
	RefreshFunc   func(tokenString string) (string, error)
	GenerateCalls int
	ValidateCalls int
	RefreshCalls  int
}

// NewMockTokenService creates a new mock token service
func NewMockTokenService() *MockTokenService {
	return &MockTokenService{
		GenerateFunc: defaultGenerate,
		ValidateFunc: defaultValidate,
		RefreshFunc:  defaultRefresh,
	}
}

// Generate mocks the token generation
func (m *MockTokenService) Generate(claims *tokens.Claims) (string, error) {
	m.GenerateCalls++
	return m.GenerateFunc(claims)
}

// Validate mocks the token validation
func (m *MockTokenService) Validate(tokenString string) (*tokens.Claims, error) {
	m.ValidateCalls++
	return m.ValidateFunc(tokenString)
}

// Refresh mocks the token refresh
func (m *MockTokenService) Refresh(tokenString string) (string, error) {
	m.RefreshCalls++
	return m.RefreshFunc(tokenString)
}

// Default implementations
func defaultGenerate(claims *tokens.Claims) (string, error) {
	if claims == nil {
		return "", fmt.Errorf("claims cannot be nil")
	}
	if claims.UserID == "" {
		return "", fmt.Errorf("user_id is required")
	}
	if claims.TenantID == "" {
		return "", fmt.Errorf("tenant_id is required")
	}

	// Return a fake token
	return "mock.jwt.token", nil
}

func defaultValidate(tokenString string) (*tokens.Claims, error) {
	if tokenString == "" {
		return nil, fmt.Errorf("token is empty")
	}

	if tokenString == "invalid.token" {
		return nil, fmt.Errorf("invalid token")
	}

	if tokenString == "expired.token" {
		return nil, fmt.Errorf("token expired")
	}

	// Return mock claims
	return &tokens.Claims{
		UserID:   "mock-user-id",
		TenantID: "mock-tenant-id",
		Email:    "mock@example.com",
		Role:     "student",
	}, nil
}

func defaultRefresh(tokenString string) (string, error) {
	if tokenString == "" {
		return "", fmt.Errorf("token is empty")
	}

	// Return a new fake token
	return "refreshed.jwt.token", nil
}

// WithGenerateFunc sets a custom generate function
func (m *MockTokenService) WithGenerateFunc(fn func(*tokens.Claims) (string, error)) *MockTokenService {
	m.GenerateFunc = fn
	return m
}

// WithValidateFunc sets a custom validate function
func (m *MockTokenService) WithValidateFunc(fn func(string) (*tokens.Claims, error)) *MockTokenService {
	m.ValidateFunc = fn
	return m
}

// WithRefreshFunc sets a custom refresh function
func (m *MockTokenService) WithRefreshFunc(fn func(string) (string, error)) *MockTokenService {
	m.RefreshFunc = fn
	return m
}

// WithAlwaysValid makes the mock always return valid claims
func (m *MockTokenService) WithAlwaysValid(userID, tenantID, email, role string) *MockTokenService {
	m.ValidateFunc = func(tokenString string) (*tokens.Claims, error) {
		return &tokens.Claims{
			UserID:   userID,
			TenantID: tenantID,
			Email:    email,
			Role:     role,
		}, nil
	}
	return m
}

// WithAlwaysInvalid makes the mock always return invalid token error
func (m *MockTokenService) WithAlwaysInvalid() *MockTokenService {
	m.ValidateFunc = func(tokenString string) (*tokens.Claims, error) {
		return nil, fmt.Errorf("invalid token")
	}
	return m
}

// WithGenerateError makes the mock return an error when generating
func (m *MockTokenService) WithGenerateError(err error) *MockTokenService {
	m.GenerateFunc = func(claims *tokens.Claims) (string, error) {
		return "", err
	}
	return m
}

// Reset resets the call counters
func (m *MockTokenService) Reset() {
	m.GenerateCalls = 0
	m.ValidateCalls = 0
	m.RefreshCalls = 0
}

// GetCalls returns the number of calls for each method
func (m *MockTokenService) GetCalls() (generate, validate, refresh int) {
	return m.GenerateCalls, m.ValidateCalls, m.RefreshCalls
}
