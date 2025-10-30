package tokens

import (
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestNewJWTService(t *testing.T) {
	t.Run("Valid service creation", func(t *testing.T) {
		service := NewJWTService("test-secret", 1*time.Hour, "test-issuer")

		if service.secretKey != "test-secret" {
			t.Errorf("expected secretKey 'test-secret', got '%s'", service.secretKey)
		}

		if service.expiration != 1*time.Hour {
			t.Errorf("expected expiration 1h, got %v", service.expiration)
		}

		if service.issuer != "test-issuer" {
			t.Errorf("expected issuer 'test-issuer', got '%s'", service.issuer)
		}
	})

	t.Run("Default values", func(t *testing.T) {
		service := NewJWTService("test-secret", 0, "")

		if service.expiration != 24*time.Hour {
			t.Errorf("expected default expiration 24h, got %v", service.expiration)
		}

		if service.issuer != "stegmaier-lms" {
			t.Errorf("expected default issuer 'stegmaier-lms', got '%s'", service.issuer)
		}
	})

	t.Run("Panic on empty secret", func(t *testing.T) {
		defer func() {
			if r := recover(); r == nil {
				t.Errorf("expected panic for empty secret key")
			}
		}()

		NewJWTService("", 1*time.Hour, "test-issuer")
	})
}

func TestGenerate(t *testing.T) {
	service := NewJWTService("test-secret", 1*time.Hour, "test-issuer")

	tests := []struct {
		name      string
		claims    *Claims
		wantError bool
	}{
		{
			name: "Valid claims",
			claims: &Claims{
				UserID:   "user-123",
				TenantID: "tenant-456",
				Email:    "user@test.com",
				Role:     "student",
			},
			wantError: false,
		},
		{
			name:      "Nil claims",
			claims:    nil,
			wantError: true,
		},
		{
			name: "Missing user_id",
			claims: &Claims{
				TenantID: "tenant-456",
				Email:    "user@test.com",
				Role:     "student",
			},
			wantError: true,
		},
		{
			name: "Missing tenant_id",
			claims: &Claims{
				UserID: "user-123",
				Email:  "user@test.com",
				Role:   "student",
			},
			wantError: true,
		},
		{
			name: "Admin role",
			claims: &Claims{
				UserID:   "admin-123",
				TenantID: "tenant-456",
				Email:    "admin@test.com",
				Role:     "admin",
			},
			wantError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			token, err := service.Generate(tt.claims)

			if tt.wantError {
				if err == nil {
					t.Errorf("expected error but got none")
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}

			if token == "" {
				t.Errorf("token should not be empty")
			}

			// Verify token has 3 parts (header.payload.signature)
			parts := strings.Split(token, ".")
			if len(parts) != 3 {
				t.Errorf("expected JWT with 3 parts, got %d", len(parts))
			}
		})
	}
}

func TestValidate(t *testing.T) {
	service := NewJWTService("test-secret", 1*time.Hour, "test-issuer")

	// Generate a valid token
	validClaims := &Claims{
		UserID:   "user-123",
		TenantID: "tenant-456",
		Email:    "user@test.com",
		Role:     "student",
	}
	validToken, err := service.Generate(validClaims)
	if err != nil {
		t.Fatalf("failed to generate valid token: %v", err)
	}

	// Generate a token with different secret
	wrongSecretService := NewJWTService("wrong-secret", 1*time.Hour, "test-issuer")
	wrongSecretToken, _ := wrongSecretService.Generate(validClaims)

	// Generate expired token
	expiredService := NewJWTService("test-secret", -1*time.Hour, "test-issuer")
	expiredToken, _ := expiredService.Generate(validClaims)

	tests := []struct {
		name      string
		token     string
		wantError bool
	}{
		{
			name:      "Valid token",
			token:     validToken,
			wantError: false,
		},
		{
			name:      "Empty token",
			token:     "",
			wantError: true,
		},
		{
			name:      "Invalid token format",
			token:     "invalid.token.format",
			wantError: true,
		},
		{
			name:      "Wrong secret",
			token:     wrongSecretToken,
			wantError: true,
		},
		{
			name:      "Expired token",
			token:     expiredToken,
			wantError: true,
		},
		{
			name:      "Malformed token",
			token:     "not-a-jwt-token",
			wantError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			claims, err := service.Validate(tt.token)

			if tt.wantError {
				if err == nil {
					t.Errorf("expected error but got none")
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}

			if claims == nil {
				t.Errorf("claims should not be nil")
				return
			}

			// Verify claims
			if claims.UserID != validClaims.UserID {
				t.Errorf("expected UserID %s, got %s", validClaims.UserID, claims.UserID)
			}

			if claims.TenantID != validClaims.TenantID {
				t.Errorf("expected TenantID %s, got %s", validClaims.TenantID, claims.TenantID)
			}

			if claims.Email != validClaims.Email {
				t.Errorf("expected Email %s, got %s", validClaims.Email, claims.Email)
			}

			if claims.Role != validClaims.Role {
				t.Errorf("expected Role %s, got %s", validClaims.Role, claims.Role)
			}

			if claims.Issuer != "test-issuer" {
				t.Errorf("expected Issuer 'test-issuer', got %s", claims.Issuer)
			}
		})
	}
}

func TestRefresh(t *testing.T) {
	service := NewJWTService("test-secret", 1*time.Hour, "test-issuer")

	// Generate original token
	originalClaims := &Claims{
		UserID:   "user-123",
		TenantID: "tenant-456",
		Email:    "user@test.com",
		Role:     "student",
	}
	originalToken, err := service.Generate(originalClaims)
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	// Wait a bit to ensure new token has different timestamp
	time.Sleep(10 * time.Millisecond)

	// Refresh token
	refreshedToken, err := service.Refresh(originalToken)
	if err != nil {
		t.Fatalf("failed to refresh token: %v", err)
	}

	if refreshedToken == "" {
		t.Errorf("refreshed token should not be empty")
	}

	if refreshedToken == originalToken {
		t.Errorf("refreshed token should be different from original")
	}

	// Validate refreshed token
	refreshedClaims, err := service.Validate(refreshedToken)
	if err != nil {
		t.Errorf("refreshed token should be valid: %v", err)
	}

	// Verify claims are the same
	if refreshedClaims.UserID != originalClaims.UserID {
		t.Errorf("expected same UserID")
	}

	if refreshedClaims.TenantID != originalClaims.TenantID {
		t.Errorf("expected same TenantID")
	}
}

func TestRefreshInvalidToken(t *testing.T) {
	service := NewJWTService("test-secret", 1*time.Hour, "test-issuer")

	_, err := service.Refresh("invalid-token")
	if err == nil {
		t.Errorf("expected error when refreshing invalid token")
	}
}

func TestExtractTokenFromHeader(t *testing.T) {
	tests := []struct {
		name      string
		header    string
		want      string
		wantError bool
	}{
		{
			name:      "Valid Bearer token",
			header:    "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
			want:      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
			wantError: false,
		},
		{
			name:      "Empty header",
			header:    "",
			want:      "",
			wantError: true,
		},
		{
			name:      "Missing Bearer prefix",
			header:    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
			want:      "",
			wantError: true,
		},
		{
			name:      "Bearer without token",
			header:    "Bearer ",
			want:      "",
			wantError: true,
		},
		{
			name:      "Wrong prefix",
			header:    "Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
			want:      "",
			wantError: true,
		},
		{
			name:      "Bearer with spaces",
			header:    "Bearer  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
			want:      " eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
			wantError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			token, err := ExtractTokenFromHeader(tt.header)

			if tt.wantError {
				if err == nil {
					t.Errorf("expected error but got none")
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}

			if token != tt.want {
				t.Errorf("expected token '%s', got '%s'", tt.want, token)
			}
		})
	}
}

func TestTokenExpiration(t *testing.T) {
	// Create service with very short expiration for testing
	service := NewJWTService("test-secret", 1*time.Millisecond, "test-issuer")

	claims := &Claims{
		UserID:   "user-123",
		TenantID: "tenant-456",
		Email:    "user@test.com",
		Role:     "student",
	}

	token, err := service.Generate(claims)
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	// Wait for token to expire
	time.Sleep(10 * time.Millisecond)

	// Try to validate expired token
	_, err = service.Validate(token)
	if err == nil {
		t.Errorf("expected error for expired token")
	}
}

func TestGetExpiration(t *testing.T) {
	expiration := 2 * time.Hour
	service := NewJWTService("test-secret", expiration, "test-issuer")

	if service.GetExpiration() != expiration {
		t.Errorf("expected expiration %v, got %v", expiration, service.GetExpiration())
	}
}

func TestClaimsInToken(t *testing.T) {
	service := NewJWTService("test-secret", 1*time.Hour, "test-issuer")

	claims := &Claims{
		UserID:   "user-123",
		TenantID: "tenant-456",
		Email:    "test@example.com",
		Role:     "instructor",
	}

	tokenString, err := service.Generate(claims)
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	// Parse without validation to inspect claims
	token, _, err := jwt.NewParser().ParseUnverified(tokenString, &Claims{})
	if err != nil {
		t.Fatalf("failed to parse token: %v", err)
	}

	parsedClaims, ok := token.Claims.(*Claims)
	if !ok {
		t.Fatalf("failed to get claims")
	}

	// Verify all custom claims are present
	if parsedClaims.UserID != claims.UserID {
		t.Errorf("UserID mismatch")
	}

	if parsedClaims.TenantID != claims.TenantID {
		t.Errorf("TenantID mismatch")
	}

	if parsedClaims.Email != claims.Email {
		t.Errorf("Email mismatch")
	}

	if parsedClaims.Role != claims.Role {
		t.Errorf("Role mismatch")
	}

	// Verify registered claims
	if parsedClaims.Issuer != "test-issuer" {
		t.Errorf("Issuer mismatch")
	}

	if parsedClaims.IssuedAt == nil {
		t.Errorf("IssuedAt should not be nil")
	}

	if parsedClaims.ExpiresAt == nil {
		t.Errorf("ExpiresAt should not be nil")
	}

	if parsedClaims.ID == "" {
		t.Errorf("JTI should not be empty")
	}
}
