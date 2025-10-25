package mocks

import (
	"fmt"
	"testing"

	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/tokens"
)

func TestMockTokenService(t *testing.T) {
	mock := NewMockTokenService()

	t.Run("Generate", func(t *testing.T) {
		claims := &tokens.Claims{
			UserID:   "user-123",
			TenantID: "tenant-456",
			Email:    "test@example.com",
			Role:     "student",
		}

		token, err := mock.Generate(claims)
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		if token == "" {
			t.Error("Expected token to be generated")
		}

		if mock.GenerateCalls != 1 {
			t.Errorf("Expected 1 Generate call, got %d", mock.GenerateCalls)
		}
	})

	t.Run("Validate", func(t *testing.T) {
		mock.Reset()

		claims, err := mock.Validate("valid.token")
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		if claims == nil {
			t.Fatal("Expected claims to be returned")
		}

		if claims.UserID == "" {
			t.Error("Expected user_id to be set")
		}

		if mock.ValidateCalls != 1 {
			t.Errorf("Expected 1 Validate call, got %d", mock.ValidateCalls)
		}
	})

	t.Run("Refresh", func(t *testing.T) {
		mock.Reset()

		newToken, err := mock.Refresh("existing.token")
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		if newToken == "" {
			t.Error("Expected new token to be generated")
		}

		if mock.RefreshCalls != 1 {
			t.Errorf("Expected 1 Refresh call, got %d", mock.RefreshCalls)
		}
	})

	t.Run("WithAlwaysValid", func(t *testing.T) {
		mock := NewMockTokenService().
			WithAlwaysValid("user-123", "tenant-456", "test@example.com", "admin")

		claims, err := mock.Validate("any.token")
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		if claims.UserID != "user-123" {
			t.Errorf("Expected user_id 'user-123', got '%s'", claims.UserID)
		}

		if claims.Role != "admin" {
			t.Errorf("Expected role 'admin', got '%s'", claims.Role)
		}
	})

	t.Run("WithAlwaysInvalid", func(t *testing.T) {
		mock := NewMockTokenService().WithAlwaysInvalid()

		_, err := mock.Validate("any.token")
		if err == nil {
			t.Error("Expected error for invalid token")
		}
	})

	t.Run("WithGenerateError", func(t *testing.T) {
		customErr := fmt.Errorf("custom generate error")
		mock := NewMockTokenService().WithGenerateError(customErr)

		claims := &tokens.Claims{
			UserID:   "user-123",
			TenantID: "tenant-456",
		}

		_, err := mock.Generate(claims)
		if err == nil {
			t.Error("Expected error when generating")
		}

		if err.Error() != customErr.Error() {
			t.Errorf("Expected error '%v', got '%v'", customErr, err)
		}
	})
}

func TestMockPasswordHasher(t *testing.T) {
	mock := NewMockPasswordHasher()

	t.Run("Hash", func(t *testing.T) {
		hash, err := mock.Hash("password123")
		if err != nil {
			t.Fatalf("Expected no error, got %v", err)
		}

		if hash == "" {
			t.Error("Expected hash to be generated")
		}

		if hash == "password123" {
			t.Error("Hash should not equal plain password")
		}

		if mock.HashCalls != 1 {
			t.Errorf("Expected 1 Hash call, got %d", mock.HashCalls)
		}
	})

	t.Run("Compare matching passwords", func(t *testing.T) {
		mock.Reset()

		password := "password123"
		hash, _ := mock.Hash(password)

		err := mock.Compare(hash, password)
		if err != nil {
			t.Errorf("Expected passwords to match, got error: %v", err)
		}

		if mock.CompareCalls != 1 {
			t.Errorf("Expected 1 Compare call, got %d", mock.CompareCalls)
		}
	})

	t.Run("Compare non-matching passwords", func(t *testing.T) {
		mock.Reset()

		hash, _ := mock.Hash("password123")

		err := mock.Compare(hash, "wrongpassword")
		if err == nil {
			t.Error("Expected error for non-matching passwords")
		}
	})

	t.Run("WithAlwaysMatch", func(t *testing.T) {
		mock := NewMockPasswordHasher().WithAlwaysMatch()

		err := mock.Compare("anyhash", "anypassword")
		if err != nil {
			t.Errorf("Expected passwords to always match, got error: %v", err)
		}
	})

	t.Run("WithNeverMatch", func(t *testing.T) {
		mock := NewMockPasswordHasher().WithNeverMatch()

		err := mock.Compare("correcthash", "correctpassword")
		if err == nil {
			t.Error("Expected passwords to never match")
		}
	})

	t.Run("WithHashError", func(t *testing.T) {
		customErr := fmt.Errorf("custom hash error")
		mock := NewMockPasswordHasher().WithHashError(customErr)

		_, err := mock.Hash("password123")
		if err == nil {
			t.Error("Expected error when hashing")
		}

		if err.Error() != customErr.Error() {
			t.Errorf("Expected error '%v', got '%v'", customErr, err)
		}
	})

	t.Run("GetCalls", func(t *testing.T) {
		mock := NewMockPasswordHasher()

		mock.Hash("pass1")
		mock.Hash("pass2")
		hash, _ := mock.Hash("pass3")
		mock.Compare(hash, "pass3")
		mock.Compare(hash, "pass3")

		hashCalls, compareCalls := mock.GetCalls()

		if hashCalls != 3 {
			t.Errorf("Expected 3 hash calls, got %d", hashCalls)
		}

		if compareCalls != 2 {
			t.Errorf("Expected 2 compare calls, got %d", compareCalls)
		}
	})

	t.Run("Reset", func(t *testing.T) {
		mock := NewMockPasswordHasher()

		mock.Hash("pass1")
		mock.Hash("pass2")

		mock.Reset()

		hashCalls, compareCalls := mock.GetCalls()

		if hashCalls != 0 {
			t.Errorf("Expected 0 hash calls after reset, got %d", hashCalls)
		}

		if compareCalls != 0 {
			t.Errorf("Expected 0 compare calls after reset, got %d", compareCalls)
		}
	})
}
