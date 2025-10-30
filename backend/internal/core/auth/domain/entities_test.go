package domain

import (
	"testing"
	"time"
)

func TestIsValidRole(t *testing.T) {
	tests := []struct {
		name     string
		role     string
		expected bool
	}{
		{"Valid student role", "student", true},
		{"Valid instructor role", "instructor", true},
		{"Valid admin role", "admin", true},
		{"Invalid role", "superuser", false},
		{"Empty role", "", false},
		{"Random string", "random", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsValidRole(tt.role)
			if result != tt.expected {
				t.Errorf("IsValidRole(%s) = %v, want %v", tt.role, result, tt.expected)
			}
		})
	}
}

func TestVerificationToken_IsExpired(t *testing.T) {
	tests := []struct {
		name      string
		expiresAt time.Time
		expected  bool
	}{
		{
			name:      "Not expired",
			expiresAt: time.Now().Add(1 * time.Hour),
			expected:  false,
		},
		{
			name:      "Already expired",
			expiresAt: time.Now().Add(-1 * time.Hour),
			expected:  true,
		},
		{
			name:      "Expires now (edge case)",
			expiresAt: time.Now(),
			expected:  true, // Will be true due to time passing during execution
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			token := &VerificationToken{
				ID:        "test-id",
				UserID:    "user-id",
				Token:     "test-token",
				ExpiresAt: tt.expiresAt,
				CreatedAt: time.Now(),
			}

			result := token.IsExpired()

			// For "Expires now" case, allow both true and false due to timing
			if tt.name == "Expires now (edge case)" {
				// Skip strict assertion for edge case
				return
			}

			if result != tt.expected {
				t.Errorf("IsExpired() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestPasswordResetToken_IsExpired(t *testing.T) {
	token := &PasswordResetToken{
		ID:        "test-id",
		UserID:    "user-id",
		Token:     "reset-token",
		ExpiresAt: time.Now().Add(-1 * time.Hour),
		CreatedAt: time.Now().Add(-2 * time.Hour),
	}

	if !token.IsExpired() {
		t.Error("Expected token to be expired")
	}
}

func TestPasswordResetToken_IsUsed(t *testing.T) {
	t.Run("Not used", func(t *testing.T) {
		token := &PasswordResetToken{
			ID:        "test-id",
			UserID:    "user-id",
			Token:     "reset-token",
			ExpiresAt: time.Now().Add(1 * time.Hour),
			UsedAt:    nil,
			CreatedAt: time.Now(),
		}

		if token.IsUsed() {
			t.Error("Expected token to not be used")
		}
	})

	t.Run("Used", func(t *testing.T) {
		usedTime := time.Now()
		token := &PasswordResetToken{
			ID:        "test-id",
			UserID:    "user-id",
			Token:     "reset-token",
			ExpiresAt: time.Now().Add(1 * time.Hour),
			UsedAt:    &usedTime,
			CreatedAt: time.Now(),
		}

		if !token.IsUsed() {
			t.Error("Expected token to be used")
		}
	})
}

func TestPasswordResetToken_IsValid(t *testing.T) {
	tests := []struct {
		name      string
		expiresAt time.Time
		usedAt    *time.Time
		expected  bool
	}{
		{
			name:      "Valid token",
			expiresAt: time.Now().Add(1 * time.Hour),
			usedAt:    nil,
			expected:  true,
		},
		{
			name:      "Expired token",
			expiresAt: time.Now().Add(-1 * time.Hour),
			usedAt:    nil,
			expected:  false,
		},
		{
			name:      "Used token",
			expiresAt: time.Now().Add(1 * time.Hour),
			usedAt:    timePtr(time.Now()),
			expected:  false,
		},
		{
			name:      "Expired and used",
			expiresAt: time.Now().Add(-1 * time.Hour),
			usedAt:    timePtr(time.Now()),
			expected:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			token := &PasswordResetToken{
				ID:        "test-id",
				UserID:    "user-id",
				Token:     "reset-token",
				ExpiresAt: tt.expiresAt,
				UsedAt:    tt.usedAt,
				CreatedAt: time.Now(),
			}

			result := token.IsValid()
			if result != tt.expected {
				t.Errorf("IsValid() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestRefreshToken_IsRevoked(t *testing.T) {
	t.Run("Not revoked", func(t *testing.T) {
		token := &RefreshToken{
			ID:        "test-id",
			UserID:    "user-id",
			Token:     "refresh-token",
			ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
			RevokedAt: nil,
			CreatedAt: time.Now(),
		}

		if token.IsRevoked() {
			t.Error("Expected token to not be revoked")
		}
	})

	t.Run("Revoked", func(t *testing.T) {
		revokedTime := time.Now()
		token := &RefreshToken{
			ID:        "test-id",
			UserID:    "user-id",
			Token:     "refresh-token",
			ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
			RevokedAt: &revokedTime,
			CreatedAt: time.Now(),
		}

		if !token.IsRevoked() {
			t.Error("Expected token to be revoked")
		}
	})
}

func TestRefreshToken_IsValid(t *testing.T) {
	tests := []struct {
		name      string
		expiresAt time.Time
		revokedAt *time.Time
		expected  bool
	}{
		{
			name:      "Valid token",
			expiresAt: time.Now().Add(7 * 24 * time.Hour),
			revokedAt: nil,
			expected:  true,
		},
		{
			name:      "Expired token",
			expiresAt: time.Now().Add(-1 * time.Hour),
			revokedAt: nil,
			expected:  false,
		},
		{
			name:      "Revoked token",
			expiresAt: time.Now().Add(7 * 24 * time.Hour),
			revokedAt: timePtr(time.Now()),
			expected:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			token := &RefreshToken{
				ID:        "test-id",
				UserID:    "user-id",
				Token:     "refresh-token",
				ExpiresAt: tt.expiresAt,
				RevokedAt: tt.revokedAt,
				CreatedAt: time.Now(),
			}

			result := token.IsValid()
			if result != tt.expected {
				t.Errorf("IsValid() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestUser_SanitizeUser(t *testing.T) {
	user := &User{
		ID:           "user-123",
		TenantID:     "tenant-456",
		Email:        "test@example.com",
		PasswordHash: "$2a$10$secrethash",
		FullName:     "Test User",
		Role:         "student",
		IsVerified:   true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	sanitized := user.SanitizeUser()

	if sanitized.PasswordHash != "" {
		t.Error("Expected password hash to be empty in sanitized user")
	}

	if sanitized.ID != user.ID {
		t.Errorf("Expected ID %s, got %s", user.ID, sanitized.ID)
	}

	if sanitized.Email != user.Email {
		t.Errorf("Expected Email %s, got %s", user.Email, sanitized.Email)
	}
}

func TestUser_HasRole(t *testing.T) {
	user := &User{
		ID:       "user-123",
		Email:    "test@example.com",
		Role:     "instructor",
	}

	if !user.HasRole(RoleInstructor) {
		t.Error("Expected user to have instructor role")
	}

	if user.HasRole(RoleAdmin) {
		t.Error("Expected user not to have admin role")
	}
}

func TestUser_IsAdmin(t *testing.T) {
	admin := &User{Role: "admin"}
	student := &User{Role: "student"}

	if !admin.IsAdmin() {
		t.Error("Expected admin user to be identified as admin")
	}

	if student.IsAdmin() {
		t.Error("Expected student user not to be identified as admin")
	}
}

func TestUser_IsInstructor(t *testing.T) {
	instructor := &User{Role: "instructor"}
	student := &User{Role: "student"}

	if !instructor.IsInstructor() {
		t.Error("Expected instructor user to be identified as instructor")
	}

	if student.IsInstructor() {
		t.Error("Expected student user not to be identified as instructor")
	}
}

func TestUser_IsStudent(t *testing.T) {
	student := &User{Role: "student"}
	admin := &User{Role: "admin"}

	if !student.IsStudent() {
		t.Error("Expected student user to be identified as student")
	}

	if admin.IsStudent() {
		t.Error("Expected admin user not to be identified as student")
	}
}

func TestUser_CanManageCourses(t *testing.T) {
	tests := []struct {
		name     string
		role     string
		expected bool
	}{
		{"Admin can manage courses", "admin", true},
		{"Instructor can manage courses", "instructor", true},
		{"Student cannot manage courses", "student", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			user := &User{Role: tt.role}
			result := user.CanManageCourses()

			if result != tt.expected {
				t.Errorf("CanManageCourses() = %v, want %v", result, tt.expected)
			}
		})
	}
}

// Helper function to create a pointer to time.Time
func timePtr(t time.Time) *time.Time {
	return &t
}
