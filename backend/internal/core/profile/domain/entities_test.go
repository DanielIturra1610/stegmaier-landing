package domain

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewUserProfile(t *testing.T) {
	userID := uuid.New()
	tenantID := uuid.New()
	firstName := "John"
	lastName := "Doe"

	profile := NewUserProfile(userID, tenantID, firstName, lastName)

	assert.Equal(t, userID, profile.UserID)
	assert.Equal(t, tenantID, profile.TenantID)
	assert.Equal(t, firstName, profile.FirstName)
	assert.Equal(t, lastName, profile.LastName)
	assert.Equal(t, "UTC", profile.Timezone)
	assert.Equal(t, LanguageEnglish, profile.Language)
	assert.Equal(t, ThemeLight, profile.Theme)
	assert.True(t, profile.Preferences.EmailNotifications)
	assert.True(t, profile.Preferences.PushNotifications)
	assert.True(t, profile.Preferences.CourseReminders)
	assert.False(t, profile.Preferences.WeeklyDigest)
	assert.False(t, profile.Preferences.MarketingEmails)
	assert.False(t, profile.Preferences.PrivateProfile)
	assert.True(t, profile.Preferences.ShowProgressPublicly)
	assert.NotZero(t, profile.CreatedAt)
	assert.NotZero(t, profile.UpdatedAt)
}

func TestUserProfile_Validate(t *testing.T) {
	tests := []struct {
		name    string
		profile *UserProfile
		wantErr bool
		errMsg  string
	}{
		{
			name: "valid profile",
			profile: &UserProfile{
				UserID:    uuid.New(),
				TenantID:  uuid.New(),
				FirstName: "John",
				LastName:  "Doe",
				Timezone:  "UTC",
				Language:  "en",
				Theme:     ThemeLight,
			},
			wantErr: false,
		},
		{
			name: "missing user ID",
			profile: &UserProfile{
				TenantID:  uuid.New(),
				FirstName: "John",
				LastName:  "Doe",
				Timezone:  "UTC",
				Language:  "en",
				Theme:     ThemeLight,
			},
			wantErr: true,
			errMsg:  "user ID is required",
		},
		{
			name: "missing tenant ID",
			profile: &UserProfile{
				UserID:    uuid.New(),
				FirstName: "John",
				LastName:  "Doe",
				Timezone:  "UTC",
				Language:  "en",
				Theme:     ThemeLight,
			},
			wantErr: true,
			errMsg:  "tenant ID is required",
		},
		{
			name: "first name too short",
			profile: &UserProfile{
				UserID:    uuid.New(),
				TenantID:  uuid.New(),
				FirstName: "J",
				LastName:  "Doe",
				Timezone:  "UTC",
				Language:  "en",
				Theme:     ThemeLight,
			},
			wantErr: true,
		},
		{
			name: "last name too long",
			profile: &UserProfile{
				UserID:    uuid.New(),
				TenantID:  uuid.New(),
				FirstName: "John",
				LastName:  string(make([]byte, 101)),
				Timezone:  "UTC",
				Language:  "en",
				Theme:     ThemeLight,
			},
			wantErr: true,
		},
		{
			name: "invalid theme",
			profile: &UserProfile{
				UserID:    uuid.New(),
				TenantID:  uuid.New(),
				FirstName: "John",
				LastName:  "Doe",
				Timezone:  "UTC",
				Language:  "en",
				Theme:     "invalid",
			},
			wantErr: true,
		},
		{
			name: "invalid language",
			profile: &UserProfile{
				UserID:    uuid.New(),
				TenantID:  uuid.New(),
				FirstName: "John",
				LastName:  "Doe",
				Timezone:  "UTC",
				Language:  "english",
				Theme:     ThemeLight,
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.profile.Validate()
			if tt.wantErr {
				require.Error(t, err)
				if tt.errMsg != "" {
					assert.Contains(t, err.Error(), tt.errMsg)
				}
			} else {
				require.NoError(t, err)
			}
		})
	}
}

func TestUserProfile_GetFullName(t *testing.T) {
	profile := &UserProfile{
		FirstName: "John",
		LastName:  "Doe",
	}

	assert.Equal(t, "John Doe", profile.GetFullName())
}

func TestUserProfile_HasAvatar(t *testing.T) {
	tests := []struct {
		name      string
		avatarURL *string
		want      bool
	}{
		{
			name:      "no avatar",
			avatarURL: nil,
			want:      false,
		},
		{
			name:      "empty avatar",
			avatarURL: func() *string { s := ""; return &s }(),
			want:      false,
		},
		{
			name:      "has avatar",
			avatarURL: func() *string { s := "https://example.com/avatar.jpg"; return &s }(),
			want:      true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			profile := &UserProfile{
				AvatarURL: tt.avatarURL,
			}
			assert.Equal(t, tt.want, profile.HasAvatar())
		})
	}
}

func TestUserProfile_UpdateTimestamp(t *testing.T) {
	profile := &UserProfile{
		UpdatedAt: time.Now().Add(-1 * time.Hour),
	}

	oldTime := profile.UpdatedAt
	time.Sleep(10 * time.Millisecond)
	profile.UpdateTimestamp()

	assert.True(t, profile.UpdatedAt.After(oldTime))
}

func TestValidateFirstName(t *testing.T) {
	tests := []struct {
		name      string
		firstName string
		wantErr   bool
	}{
		{"valid", "John", false},
		{"too short", "J", true},
		{"too long", string(make([]byte, 101)), true},
		{"min length", "Jo", false},
		{"max length", string(make([]byte, 100)), false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateFirstName(tt.firstName)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestValidateLastName(t *testing.T) {
	tests := []struct {
		name     string
		lastName string
		wantErr  bool
	}{
		{"valid", "Doe", false},
		{"too short", "D", true},
		{"too long", string(make([]byte, 101)), true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateLastName(tt.lastName)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestValidateBio(t *testing.T) {
	tests := []struct {
		name    string
		bio     *string
		wantErr bool
	}{
		{"nil bio", nil, false},
		{"valid bio", func() *string { s := "This is my bio"; return &s }(), false},
		{"empty bio", func() *string { s := ""; return &s }(), false},
		{"max length bio", func() *string { s := string(make([]byte, 500)); return &s }(), false},
		{"too long bio", func() *string { s := string(make([]byte, 501)); return &s }(), true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateBio(tt.bio)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestValidatePhone(t *testing.T) {
	tests := []struct {
		name    string
		phone   *string
		wantErr bool
	}{
		{"nil phone", nil, false},
		{"valid phone", func() *string { s := "+1234567890"; return &s }(), false},
		{"max length", func() *string { s := string(make([]byte, 20)); return &s }(), false},
		{"too long", func() *string { s := string(make([]byte, 21)); return &s }(), true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePhone(tt.phone)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestValidateTheme(t *testing.T) {
	tests := []struct {
		name    string
		theme   string
		wantErr bool
	}{
		{"light theme", ThemeLight, false},
		{"dark theme", ThemeDark, false},
		{"system theme", ThemeSystem, false},
		{"invalid theme", "rainbow", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateTheme(tt.theme)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestValidateLanguage(t *testing.T) {
	tests := []struct {
		name     string
		language string
		wantErr  bool
	}{
		{"english", "en", false},
		{"spanish", "es", false},
		{"too short", "e", true},
		{"too long", "eng", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateLanguage(tt.language)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestValidatePassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{"valid password", "SecureP@ss123", false},
		{"min length", "Pass123!", false},
		{"too short", "Pass12", true},
		{"max length", string(make([]byte, 100)), false},
		{"too long", string(make([]byte, 101)), true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePassword(tt.password)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestChangePasswordRequest_Validate(t *testing.T) {
	tests := []struct {
		name    string
		req     *ChangePasswordRequest
		wantErr bool
		errMsg  string
	}{
		{
			name: "valid request",
			req: &ChangePasswordRequest{
				CurrentPassword: "OldPass123!",
				NewPassword:     "NewPass456!",
			},
			wantErr: false,
		},
		{
			name: "missing current password",
			req: &ChangePasswordRequest{
				NewPassword: "NewPass456!",
			},
			wantErr: true,
			errMsg:  "current password is required",
		},
		{
			name: "missing new password",
			req: &ChangePasswordRequest{
				CurrentPassword: "OldPass123!",
			},
			wantErr: true,
			errMsg:  "new password is required",
		},
		{
			name: "passwords are the same",
			req: &ChangePasswordRequest{
				CurrentPassword: "SamePass123!",
				NewPassword:     "SamePass123!",
			},
			wantErr: true,
			errMsg:  "must be different",
		},
		{
			name: "new password too short",
			req: &ChangePasswordRequest{
				CurrentPassword: "OldPass123!",
				NewPassword:     "Short1",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.req.Validate()
			if tt.wantErr {
				require.Error(t, err)
				if tt.errMsg != "" {
					assert.Contains(t, err.Error(), tt.errMsg)
				}
			} else {
				require.NoError(t, err)
			}
		})
	}
}
