package domain

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestUpdateProfileRequest_Validate(t *testing.T) {
	tests := []struct {
		name    string
		req     *UpdateProfileRequest
		wantErr bool
	}{
		{
			name: "valid request with all fields",
			req: &UpdateProfileRequest{
				FullName:    strPtr("John Doe"),
				Bio:         strPtr("Software developer"),
				PhoneNumber: strPtr("+1234567890"),
				DateOfBirth: strPtr("1990-01-15"),
				Country:     strPtr("USA"),
				City:        strPtr("New York"),
				Timezone:    strPtr("America/New_York"),
				Language:    strPtr("en"),
				Theme:       strPtr(ThemeLight),
			},
			wantErr: false,
		},
		{
			name: "valid request with partial fields",
			req: &UpdateProfileRequest{
				FullName: strPtr("John"),
				Theme:    strPtr(ThemeDark),
			},
			wantErr: false,
		},
		{
			name: "invalid full name",
			req: &UpdateProfileRequest{
				FullName: strPtr("J"),
			},
			wantErr: true,
		},
		{
			name: "invalid theme",
			req: &UpdateProfileRequest{
				Theme: strPtr("rainbow"),
			},
			wantErr: true,
		},
		{
			name: "invalid date format",
			req: &UpdateProfileRequest{
				DateOfBirth: strPtr("15-01-1990"),
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.req.Validate()
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestUpdateProfileRequest_HasUpdates(t *testing.T) {
	tests := []struct {
		name string
		req  *UpdateProfileRequest
		want bool
	}{
		{
			name: "no updates",
			req:  &UpdateProfileRequest{},
			want: false,
		},
		{
			name: "has full name update",
			req: &UpdateProfileRequest{
				FullName: strPtr("John"),
			},
			want: true,
		},
		{
			name: "has theme update",
			req: &UpdateProfileRequest{
				Theme: strPtr(ThemeDark),
			},
			want: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, tt.req.HasUpdates())
		})
	}
}

func TestUpdateProfileRequest_ApplyToProfile(t *testing.T) {
	tenantID := uuid.New()
	fullName := "Old Name"
	profile := NewUserProfile(uuid.New(), &tenantID, &fullName)
	oldUpdatedAt := profile.UpdatedAt

	req := &UpdateProfileRequest{
		FullName:    strPtr("John Doe"),
		Bio:         strPtr("New bio"),
		DateOfBirth: strPtr("1990-01-15"),
		Theme:       strPtr(ThemeDark),
	}

	time.Sleep(10 * time.Millisecond)
	err := req.ApplyToProfile(profile)
	require.NoError(t, err)

	assert.NotNil(t, profile.FullName)
	assert.Equal(t, "John Doe", *profile.FullName)
	assert.NotNil(t, profile.Bio)
	assert.Equal(t, "New bio", *profile.Bio)
	assert.NotNil(t, profile.DateOfBirth)
	assert.Equal(t, ThemeDark, profile.Theme)
	assert.True(t, profile.UpdatedAt.After(oldUpdatedAt))
}

func TestUpdatePreferencesRequest_HasUpdates(t *testing.T) {
	tests := []struct {
		name string
		req  *UpdatePreferencesRequest
		want bool
	}{
		{
			name: "no updates",
			req:  &UpdatePreferencesRequest{},
			want: false,
		},
		{
			name: "has email notifications update",
			req: &UpdatePreferencesRequest{
				EmailNotifications: boolPtr(false),
			},
			want: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, tt.req.HasUpdates())
		})
	}
}

func TestUpdatePreferencesRequest_ApplyToPreferences(t *testing.T) {
	prefs := &ProfilePreferences{
		EmailNotifications:   true,
		PushNotifications:    true,
		CourseReminders:      true,
		WeeklyDigest:         false,
		MarketingEmails:      false,
		PrivateProfile:       false,
		ShowProgressPublicly: true,
	}

	req := &UpdatePreferencesRequest{
		EmailNotifications: boolPtr(false),
		WeeklyDigest:       boolPtr(true),
		PrivateProfile:     boolPtr(true),
	}

	req.ApplyToPreferences(prefs)

	assert.False(t, prefs.EmailNotifications)
	assert.True(t, prefs.PushNotifications) // unchanged
	assert.True(t, prefs.WeeklyDigest)
	assert.True(t, prefs.PrivateProfile)
}

func TestChangePasswordRequestDTO_Validate(t *testing.T) {
	tests := []struct {
		name    string
		req     *ChangePasswordRequestDTO
		wantErr bool
		errMsg  string
	}{
		{
			name: "valid request",
			req: &ChangePasswordRequestDTO{
				CurrentPassword: "OldPass123!",
				NewPassword:     "NewPass456!",
				ConfirmPassword: "NewPass456!",
			},
			wantErr: false,
		},
		{
			name: "missing current password",
			req: &ChangePasswordRequestDTO{
				NewPassword:     "NewPass456!",
				ConfirmPassword: "NewPass456!",
			},
			wantErr: true,
			errMsg:  "current password is required",
		},
		{
			name: "passwords don't match",
			req: &ChangePasswordRequestDTO{
				CurrentPassword: "OldPass123!",
				NewPassword:     "NewPass456!",
				ConfirmPassword: "DifferentPass789!",
			},
			wantErr: true,
			errMsg:  "do not match",
		},
		{
			name: "new password same as current",
			req: &ChangePasswordRequestDTO{
				CurrentPassword: "SamePass123!",
				NewPassword:     "SamePass123!",
				ConfirmPassword: "SamePass123!",
			},
			wantErr: true,
			errMsg:  "must be different",
		},
		{
			name: "new password too short",
			req: &ChangePasswordRequestDTO{
				CurrentPassword: "OldPass123!",
				NewPassword:     "Short1",
				ConfirmPassword: "Short1",
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

func TestChangePasswordRequestDTO_ToDomainChangePasswordRequest(t *testing.T) {
	dto := &ChangePasswordRequestDTO{
		CurrentPassword: "OldPass123!",
		NewPassword:     "NewPass456!",
		ConfirmPassword: "NewPass456!",
	}

	domain := dto.ToDomainChangePasswordRequest()

	assert.Equal(t, dto.CurrentPassword, domain.CurrentPassword)
	assert.Equal(t, dto.NewPassword, domain.NewPassword)
}

func TestUploadAvatarRequest_Validate(t *testing.T) {
	validImage := make([]byte, 1024) // 1KB

	tests := []struct {
		name    string
		req     *UploadAvatarRequest
		wantErr bool
		errMsg  string
	}{
		{
			name: "valid JPEG",
			req: &UploadAvatarRequest{
				Image:       validImage,
				ContentType: "image/jpeg",
				FileName:    "avatar.jpg",
			},
			wantErr: false,
		},
		{
			name: "valid PNG",
			req: &UploadAvatarRequest{
				Image:       validImage,
				ContentType: "image/png",
				FileName:    "avatar.png",
			},
			wantErr: false,
		},
		{
			name: "valid WebP",
			req: &UploadAvatarRequest{
				Image:       validImage,
				ContentType: "image/webp",
				FileName:    "avatar.webp",
			},
			wantErr: false,
		},
		{
			name: "empty image",
			req: &UploadAvatarRequest{
				ContentType: "image/jpeg",
				FileName:    "avatar.jpg",
			},
			wantErr: true,
			errMsg:  "image data is required",
		},
		{
			name: "image too large",
			req: &UploadAvatarRequest{
				Image:       make([]byte, MaxAvatarSizeBytes+1),
				ContentType: "image/jpeg",
				FileName:    "avatar.jpg",
			},
			wantErr: true,
			errMsg:  "exceed",
		},
		{
			name: "invalid content type",
			req: &UploadAvatarRequest{
				Image:       validImage,
				ContentType: "image/gif",
				FileName:    "avatar.gif",
			},
			wantErr: true,
			errMsg:  "format",
		},
		{
			name: "missing content type",
			req: &UploadAvatarRequest{
				Image:    validImage,
				FileName: "avatar.jpg",
			},
			wantErr: true,
			errMsg:  "content type is required",
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

func TestFormatDateOfBirth(t *testing.T) {
	tests := []struct {
		name string
		dob  *time.Time
		want *string
	}{
		{
			name: "nil date",
			dob:  nil,
			want: nil,
		},
		{
			name: "valid date",
			dob: func() *time.Time {
				t := time.Date(1990, 1, 15, 0, 0, 0, 0, time.UTC)
				return &t
			}(),
			want: strPtr("1990-01-15"),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := FormatDateOfBirth(tt.dob)
			if tt.want == nil {
				assert.Nil(t, result)
			} else {
				require.NotNil(t, result)
				assert.Equal(t, *tt.want, *result)
			}
		})
	}
}

func TestProfileToResponse(t *testing.T) {
	userID := uuid.New()
	tenantID := uuid.New()
	avatarURL := "https://example.com/avatar.jpg"
	bio := "Software developer"
	dob := time.Date(1990, 1, 15, 0, 0, 0, 0, time.UTC)
	fullName := "John Doe"

	profile := &UserProfile{
		UserID:      userID,
		TenantID:    &tenantID,
		FullName:    &fullName,
		AvatarURL:   &avatarURL,
		Bio:         &bio,
		DateOfBirth: &dob,
		Timezone:    "America/New_York",
		Language:    "en",
		Theme:       ThemeDark,
		Preferences: ProfilePreferences{
			EmailNotifications: true,
			PushNotifications:  false,
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	response := ProfileToResponse(profile, "john@example.com", "student", true)

	assert.Equal(t, userID, response.UserID)
	assert.Equal(t, "john@example.com", response.Email)
	assert.NotNil(t, response.FullName)
	assert.Equal(t, "John Doe", *response.FullName)
	assert.NotNil(t, response.AvatarURL)
	assert.Equal(t, avatarURL, *response.AvatarURL)
	assert.NotNil(t, response.Bio)
	assert.Equal(t, bio, *response.Bio)
	assert.NotNil(t, response.DateOfBirth)
	assert.Equal(t, "1990-01-15", *response.DateOfBirth)
	assert.Equal(t, "America/New_York", response.Timezone)
	assert.Equal(t, "en", response.Language)
	assert.Equal(t, ThemeDark, response.Theme)
	assert.True(t, response.Preferences.EmailNotifications)
	assert.False(t, response.Preferences.PushNotifications)
	assert.Equal(t, "student", response.Role)
	assert.True(t, response.IsVerified)
}

// Helper functions
func strPtr(s string) *string {
	return &s
}

func boolPtr(b bool) *bool {
	return &b
}
