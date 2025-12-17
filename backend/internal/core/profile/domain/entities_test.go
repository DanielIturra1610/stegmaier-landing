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
	fullName := "John Doe"

	profile := NewUserProfile(userID, &tenantID, &fullName)

	assert.Equal(t, userID, profile.UserID)
	assert.NotNil(t, profile.TenantID)
	assert.Equal(t, tenantID, *profile.TenantID)
	assert.NotNil(t, profile.FullName)
	assert.Equal(t, fullName, *profile.FullName)
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
			profile: func() *UserProfile {
				tenantID := uuid.New()
				fullName := "John Doe"
				return &UserProfile{
					UserID:   uuid.New(),
					TenantID: &tenantID,
					FullName: &fullName,
					Timezone: "UTC",
					Language: "en",
					Theme:    ThemeLight,
				}
			}(),
			wantErr: false,
		},
		{
			name: "missing user ID",
			profile: func() *UserProfile {
				tenantID := uuid.New()
				fullName := "John Doe"
				return &UserProfile{
					UserID:   uuid.Nil,
					TenantID: &tenantID,
					FullName: &fullName,
					Timezone: "UTC",
					Language: "en",
					Theme:    ThemeLight,
				}
			}(),
			wantErr: true,
			errMsg:  "user ID is required",
		},
		{
			name: "full name too short",
			profile: func() *UserProfile {
				tenantID := uuid.New()
				fullName := "J"
				return &UserProfile{
					UserID:   uuid.New(),
					TenantID: &tenantID,
					FullName: &fullName,
					Timezone: "UTC",
					Language: "en",
					Theme:    ThemeLight,
				}
			}(),
			wantErr: true,
		},
		{
			name: "full name too long",
			profile: func() *UserProfile {
				tenantID := uuid.New()
				fullName := string(make([]byte, 256))
				return &UserProfile{
					UserID:   uuid.New(),
					TenantID: &tenantID,
					FullName: &fullName,
					Timezone: "UTC",
					Language: "en",
					Theme:    ThemeLight,
				}
			}(),
			wantErr: true,
		},
		{
			name: "invalid theme",
			profile: func() *UserProfile {
				tenantID := uuid.New()
				fullName := "John Doe"
				return &UserProfile{
					UserID:   uuid.New(),
					TenantID: &tenantID,
					FullName: &fullName,
					Timezone: "UTC",
					Language: "en",
					Theme:    "invalid",
				}
			}(),
			wantErr: true,
		},
		{
			name: "invalid language",
			profile: func() *UserProfile {
				tenantID := uuid.New()
				fullName := "John Doe"
				return &UserProfile{
					UserID:   uuid.New(),
					TenantID: &tenantID,
					FullName: &fullName,
					Timezone: "UTC",
					Language: "english",
					Theme:    ThemeLight,
				}
			}(),
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
	fullName := "John Doe"
	profile := &UserProfile{
		FullName: &fullName,
	}

	assert.Equal(t, "John Doe", profile.GetFullName())

	// Test with nil FullName
	profileNil := &UserProfile{}
	assert.Equal(t, "", profileNil.GetFullName())
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

func TestValidateFullName(t *testing.T) {
	tests := []struct {
		name     string
		fullName *string
		wantErr  bool
	}{
		{"valid", func() *string { s := "John Doe"; return &s }(), false},
		{"too short", func() *string { s := "J"; return &s }(), true},
		{"too long", func() *string { s := string(make([]byte, 256)); return &s }(), true},
		{"min length", func() *string { s := "Jo"; return &s }(), false},
		{"nil", nil, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateFullName(tt.fullName)
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
