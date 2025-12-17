package domain

import (
	"testing"
	"time"
)

func TestToUserDTO(t *testing.T) {
	t.Run("Convert User to UserDTO", func(t *testing.T) {
		tenantID := "tenant-456"
		user := &User{
			ID:           "user-123",
			TenantID:     &tenantID,
			Email:        "test@example.com",
			PasswordHash: "$2a$10$secrethash", // Should not be in DTO
			FullName:     "Test User",
			Role:         "student",
			IsVerified:   true,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}

		dto := ToUserDTO(user)

		if dto == nil {
			t.Fatal("Expected UserDTO, got nil")
		}

		if dto.ID != user.ID {
			t.Errorf("Expected ID %s, got %s", user.ID, dto.ID)
		}

		if dto.Email != user.Email {
			t.Errorf("Expected Email %s, got %s", user.Email, dto.Email)
		}

		if dto.FullName != user.FullName {
			t.Errorf("Expected FullName %s, got %s", user.FullName, dto.FullName)
		}

		if dto.Role != user.Role {
			t.Errorf("Expected Role %s, got %s", user.Role, dto.Role)
		}

		if dto.IsVerified != user.IsVerified {
			t.Errorf("Expected IsVerified %v, got %v", user.IsVerified, dto.IsVerified)
		}
	})

	t.Run("Nil user returns nil DTO", func(t *testing.T) {
		dto := ToUserDTO(nil)
		if dto != nil {
			t.Error("Expected nil UserDTO for nil user")
		}
	})
}

func TestRegisterDTO_Validate(t *testing.T) {
	tests := []struct {
		name         string
		dto          *RegisterDTO
		expectError  bool
		expectedRole string
	}{
		{
			name: "Valid DTO with student role",
			dto: &RegisterDTO{
				Email:    "test@example.com",
				Password: "password123",
				FullName: "Test User",
				Role:     "student",
			},
			expectError:  false,
			expectedRole: "student",
		},
		{
			name: "Valid DTO with instructor role",
			dto: &RegisterDTO{
				Email:    "instructor@example.com",
				Password: "password123",
				FullName: "Instructor User",
				Role:     "instructor",
			},
			expectError:  false,
			expectedRole: "instructor",
		},
		{
			name: "Empty role defaults to student",
			dto: &RegisterDTO{
				Email:    "test@example.com",
				Password: "password123",
				FullName: "Test User",
				Role:     "",
			},
			expectError:  false,
			expectedRole: "student",
		},
		{
			name: "Invalid role defaults to student",
			dto: &RegisterDTO{
				Email:    "test@example.com",
				Password: "password123",
				FullName: "Test User",
				Role:     "superuser",
			},
			expectError:  false,
			expectedRole: "student",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.dto.Validate()

			if tt.expectError && err == nil {
				t.Error("Expected error but got none")
			}

			if !tt.expectError && err != nil {
				t.Errorf("Unexpected error: %v", err)
			}

			if tt.dto.Role != tt.expectedRole {
				t.Errorf("Expected role %s, got %s", tt.expectedRole, tt.dto.Role)
			}
		})
	}
}

func TestCreateUserDTO_Validate(t *testing.T) {
	tests := []struct {
		name        string
		dto         *CreateUserDTO
		expectError bool
	}{
		{
			name: "Valid DTO with student role",
			dto: &CreateUserDTO{
				Email:    "test@example.com",
				Password: "password123",
				FullName: "Test User",
				Role:     "student",
			},
			expectError: false,
		},
		{
			name: "Valid DTO with admin role",
			dto: &CreateUserDTO{
				Email:      "admin@example.com",
				Password:   "password123",
				FullName:   "Admin User",
				Role:       "admin",
				IsVerified: true,
			},
			expectError: false,
		},
		{
			name: "Invalid role",
			dto: &CreateUserDTO{
				Email:    "test@example.com",
				Password: "password123",
				FullName: "Test User",
				Role:     "superuser",
			},
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.dto.Validate()

			if tt.expectError && err == nil {
				t.Error("Expected error but got none")
			}

			if !tt.expectError && err != nil {
				t.Errorf("Unexpected error: %v", err)
			}
		})
	}
}

func TestAuthError(t *testing.T) {
	err := &AuthError{
		Code:    "TEST_ERROR",
		Message: "This is a test error",
	}

	if err.Error() != "This is a test error" {
		t.Errorf("Expected error message 'This is a test error', got '%s'", err.Error())
	}
}

func TestErrInvalidRole(t *testing.T) {
	if ErrInvalidRole == nil {
		t.Fatal("Expected ErrInvalidRole to be defined")
	}

	if ErrInvalidRole.Code != "INVALID_ROLE" {
		t.Errorf("Expected code 'INVALID_ROLE', got '%s'", ErrInvalidRole.Code)
	}

	if ErrInvalidRole.Message == "" {
		t.Error("Expected error message to be set")
	}
}

func TestLoginDTO(t *testing.T) {
	dto := &LoginDTO{
		Email:    "test@example.com",
		Password: "password123",
	}

	if dto.Email != "test@example.com" {
		t.Errorf("Expected email 'test@example.com', got '%s'", dto.Email)
	}

	if dto.Password != "password123" {
		t.Errorf("Expected password 'password123', got '%s'", dto.Password)
	}
}

func TestAuthResponse(t *testing.T) {
	tenantID := "tenant-456"
	user := &User{
		ID:         "user-123",
		TenantID:   &tenantID,
		Email:      "test@example.com",
		FullName:   "Test User",
		Role:       "student",
		IsVerified: true,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	response := &AuthResponse{
		AccessToken:  "access.token.here",
		TokenType:    "Bearer",
		ExpiresIn:    3600,
		RefreshToken: "refresh.token.here",
		User:         ToUserDTO(user),
	}

	if response.AccessToken != "access.token.here" {
		t.Errorf("Expected access token 'access.token.here', got '%s'", response.AccessToken)
	}

	if response.TokenType != "Bearer" {
		t.Errorf("Expected token type 'Bearer', got '%s'", response.TokenType)
	}

	if response.ExpiresIn != 3600 {
		t.Errorf("Expected expires_in 3600, got %d", response.ExpiresIn)
	}

	if response.User == nil {
		t.Error("Expected user to be set")
	}

	if response.User.ID != user.ID {
		t.Errorf("Expected user ID %s, got %s", user.ID, response.User.ID)
	}
}

func TestVerifyEmailDTO(t *testing.T) {
	dto := &VerifyEmailDTO{
		Token: "verification-token-123",
	}

	if dto.Token != "verification-token-123" {
		t.Errorf("Expected token 'verification-token-123', got '%s'", dto.Token)
	}
}

func TestResendVerificationDTO(t *testing.T) {
	dto := &ResendVerificationDTO{
		Email: "test@example.com",
	}

	if dto.Email != "test@example.com" {
		t.Errorf("Expected email 'test@example.com', got '%s'", dto.Email)
	}
}

func TestForgotPasswordDTO(t *testing.T) {
	dto := &ForgotPasswordDTO{
		Email: "test@example.com",
	}

	if dto.Email != "test@example.com" {
		t.Errorf("Expected email 'test@example.com', got '%s'", dto.Email)
	}
}

func TestResetPasswordDTO(t *testing.T) {
	dto := &ResetPasswordDTO{
		Token:       "reset-token-123",
		NewPassword: "newpassword123",
	}

	if dto.Token != "reset-token-123" {
		t.Errorf("Expected token 'reset-token-123', got '%s'", dto.Token)
	}

	if dto.NewPassword != "newpassword123" {
		t.Errorf("Expected new password 'newpassword123', got '%s'", dto.NewPassword)
	}
}

func TestChangePasswordDTO(t *testing.T) {
	dto := &ChangePasswordDTO{
		CurrentPassword: "oldpassword123",
		NewPassword:     "newpassword123",
	}

	if dto.CurrentPassword != "oldpassword123" {
		t.Errorf("Expected current password 'oldpassword123', got '%s'", dto.CurrentPassword)
	}

	if dto.NewPassword != "newpassword123" {
		t.Errorf("Expected new password 'newpassword123', got '%s'", dto.NewPassword)
	}
}

func TestRefreshTokenDTO(t *testing.T) {
	dto := &RefreshTokenDTO{
		RefreshToken: "refresh.token.here",
	}

	if dto.RefreshToken != "refresh.token.here" {
		t.Errorf("Expected refresh token 'refresh.token.here', got '%s'", dto.RefreshToken)
	}
}

func TestUpdateProfileDTO(t *testing.T) {
	dto := &UpdateProfileDTO{
		FullName: "Updated Name",
		Email:    "updated@example.com",
	}

	if dto.FullName != "Updated Name" {
		t.Errorf("Expected full name 'Updated Name', got '%s'", dto.FullName)
	}

	if dto.Email != "updated@example.com" {
		t.Errorf("Expected email 'updated@example.com', got '%s'", dto.Email)
	}
}

func TestUpdateUserDTO(t *testing.T) {
	isVerified := true
	dto := &UpdateUserDTO{
		FullName:   "Updated Name",
		Email:      "updated@example.com",
		Role:       "instructor",
		IsVerified: &isVerified,
	}

	if dto.FullName != "Updated Name" {
		t.Errorf("Expected full name 'Updated Name', got '%s'", dto.FullName)
	}

	if dto.Email != "updated@example.com" {
		t.Errorf("Expected email 'updated@example.com', got '%s'", dto.Email)
	}

	if dto.Role != "instructor" {
		t.Errorf("Expected role 'instructor', got '%s'", dto.Role)
	}

	if dto.IsVerified == nil || *dto.IsVerified != true {
		t.Error("Expected is_verified to be true")
	}
}

func TestUserListFilters(t *testing.T) {
	isVerified := true
	filters := &UserListFilters{
		Role:       "student",
		IsVerified: &isVerified,
		Search:     "test",
	}

	if filters.Role != "student" {
		t.Errorf("Expected role 'student', got '%s'", filters.Role)
	}

	if filters.IsVerified == nil || *filters.IsVerified != true {
		t.Error("Expected is_verified to be true")
	}

	if filters.Search != "test" {
		t.Errorf("Expected search 'test', got '%s'", filters.Search)
	}
}
