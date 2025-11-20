package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// GetProfileResponse represents the profile data returned to clients
type GetProfileResponse struct {
	UserID      uuid.UUID          `json:"userId"`
	Email       string             `json:"email"`
	FullName    *string            `json:"fullName,omitempty"`
	AvatarURL   *string            `json:"avatarUrl,omitempty"`
	Bio         *string            `json:"bio,omitempty"`
	PhoneNumber *string            `json:"phoneNumber,omitempty"`
	DateOfBirth *string            `json:"dateOfBirth,omitempty"` // ISO 8601 format
	Country     *string            `json:"country,omitempty"`
	City        *string            `json:"city,omitempty"`
	Timezone    string             `json:"timezone"`
	Language    string             `json:"language"`
	Theme       string             `json:"theme"`
	Preferences ProfilePreferences `json:"preferences"`
	Role        string             `json:"role"`
	IsVerified  bool               `json:"isVerified"`
	CreatedAt   time.Time          `json:"createdAt"`
	UpdatedAt   time.Time          `json:"updatedAt"`
}

// UpdateProfileRequest represents a request to update profile information
type UpdateProfileRequest struct {
	FullName    *string `json:"fullName,omitempty"`
	Bio         *string `json:"bio,omitempty"`
	PhoneNumber *string `json:"phoneNumber,omitempty"`
	DateOfBirth *string `json:"dateOfBirth,omitempty"` // ISO 8601 format (YYYY-MM-DD)
	Country     *string `json:"country,omitempty"`
	City        *string `json:"city,omitempty"`
	Timezone    *string `json:"timezone,omitempty"`
	Language    *string `json:"language,omitempty"`
	Theme       *string `json:"theme,omitempty"`
}

// UpdatePreferencesRequest represents a request to update user preferences
type UpdatePreferencesRequest struct {
	EmailNotifications   *bool `json:"emailNotifications,omitempty"`
	PushNotifications    *bool `json:"pushNotifications,omitempty"`
	CourseReminders      *bool `json:"courseReminders,omitempty"`
	WeeklyDigest         *bool `json:"weeklyDigest,omitempty"`
	MarketingEmails      *bool `json:"marketingEmails,omitempty"`
	PrivateProfile       *bool `json:"privateProfile,omitempty"`
	ShowProgressPublicly *bool `json:"showProgressPublicly,omitempty"`
}

// ChangePasswordRequestDTO represents a password change request from client
type ChangePasswordRequestDTO struct {
	CurrentPassword string `json:"currentPassword" validate:"required"`
	NewPassword     string `json:"newPassword" validate:"required,min=8,max=100"`
	ConfirmPassword string `json:"confirmPassword" validate:"required"`
}

// UploadAvatarRequest represents an avatar upload request
type UploadAvatarRequest struct {
	Image       []byte
	ContentType string
	FileName    string
}

// UploadAvatarResponse represents the response after uploading an avatar
type UploadAvatarResponse struct {
	AvatarURL string `json:"avatarUrl"`
	Message   string `json:"message"`
}

// DeleteAvatarResponse represents the response after deleting an avatar
type DeleteAvatarResponse struct {
	Message string `json:"message"`
}

// Validate validates the UpdateProfileRequest
func (r *UpdateProfileRequest) Validate() error {
	if r.FullName != nil {
		if err := ValidateFullName(r.FullName); err != nil {
			return err
		}
	}
	if r.Bio != nil {
		if err := ValidateBio(r.Bio); err != nil {
			return err
		}
	}
	if r.PhoneNumber != nil {
		if err := ValidatePhone(r.PhoneNumber); err != nil {
			return err
		}
	}
	if r.Theme != nil {
		if err := ValidateTheme(*r.Theme); err != nil {
			return err
		}
	}
	if r.Language != nil {
		if err := ValidateLanguage(*r.Language); err != nil {
			return err
		}
	}
	if r.DateOfBirth != nil {
		// Validate date format (YYYY-MM-DD)
		_, err := time.Parse("2006-01-02", *r.DateOfBirth)
		if err != nil {
			return errors.New("date of birth must be in YYYY-MM-DD format")
		}
	}
	return nil
}

// Validate validates the ChangePasswordRequestDTO
func (r *ChangePasswordRequestDTO) Validate() error {
	if r.CurrentPassword == "" {
		return errors.New("current password is required")
	}
	if r.NewPassword == "" {
		return errors.New("new password is required")
	}
	if r.ConfirmPassword == "" {
		return errors.New("confirm password is required")
	}
	if r.NewPassword != r.ConfirmPassword {
		return ErrPasswordsNotMatch
	}
	if r.CurrentPassword == r.NewPassword {
		return errors.New("new password must be different from current password")
	}
	return ValidatePassword(r.NewPassword)
}

// ToDomainChangePasswordRequest converts DTO to domain model
func (r *ChangePasswordRequestDTO) ToDomainChangePasswordRequest() *ChangePasswordRequest {
	return &ChangePasswordRequest{
		CurrentPassword: r.CurrentPassword,
		NewPassword:     r.NewPassword,
	}
}

// Validate validates the UploadAvatarRequest
func (r *UploadAvatarRequest) Validate() error {
	if len(r.Image) == 0 {
		return errors.New("image data is required")
	}
	if len(r.Image) > MaxAvatarSizeBytes {
		return ErrImageTooLarge
	}
	if r.ContentType == "" {
		return errors.New("content type is required")
	}
	// Validate content type
	switch r.ContentType {
	case "image/jpeg", "image/png", "image/webp":
		return nil
	default:
		return ErrInvalidImageFormat
	}
}

// HasUpdates checks if the UpdateProfileRequest has any updates
func (r *UpdateProfileRequest) HasUpdates() bool {
	return r.FullName != nil ||
		r.Bio != nil ||
		r.PhoneNumber != nil ||
		r.DateOfBirth != nil ||
		r.Country != nil ||
		r.City != nil ||
		r.Timezone != nil ||
		r.Language != nil ||
		r.Theme != nil
}

// HasUpdates checks if the UpdatePreferencesRequest has any updates
func (r *UpdatePreferencesRequest) HasUpdates() bool {
	return r.EmailNotifications != nil ||
		r.PushNotifications != nil ||
		r.CourseReminders != nil ||
		r.WeeklyDigest != nil ||
		r.MarketingEmails != nil ||
		r.PrivateProfile != nil ||
		r.ShowProgressPublicly != nil
}

// ApplyToProfile applies the update request to a UserProfile
func (r *UpdateProfileRequest) ApplyToProfile(profile *UserProfile) error {
	if err := r.Validate(); err != nil {
		return err
	}

	if r.FullName != nil {
		profile.FullName = r.FullName
	}
	if r.Bio != nil {
		profile.Bio = r.Bio
	}
	if r.PhoneNumber != nil {
		profile.PhoneNumber = r.PhoneNumber
	}
	if r.DateOfBirth != nil {
		parsedDate, err := time.Parse("2006-01-02", *r.DateOfBirth)
		if err != nil {
			return errors.New("invalid date of birth format")
		}
		profile.DateOfBirth = &parsedDate
	}
	if r.Country != nil {
		profile.Country = r.Country
	}
	if r.City != nil {
		profile.City = r.City
	}
	if r.Timezone != nil {
		profile.Timezone = *r.Timezone
	}
	if r.Language != nil {
		profile.Language = *r.Language
	}
	if r.Theme != nil {
		profile.Theme = *r.Theme
	}

	profile.UpdateTimestamp()
	return nil
}

// ApplyToPreferences applies the update request to ProfilePreferences
func (r *UpdatePreferencesRequest) ApplyToPreferences(prefs *ProfilePreferences) {
	if r.EmailNotifications != nil {
		prefs.EmailNotifications = *r.EmailNotifications
	}
	if r.PushNotifications != nil {
		prefs.PushNotifications = *r.PushNotifications
	}
	if r.CourseReminders != nil {
		prefs.CourseReminders = *r.CourseReminders
	}
	if r.WeeklyDigest != nil {
		prefs.WeeklyDigest = *r.WeeklyDigest
	}
	if r.MarketingEmails != nil {
		prefs.MarketingEmails = *r.MarketingEmails
	}
	if r.PrivateProfile != nil {
		prefs.PrivateProfile = *r.PrivateProfile
	}
	if r.ShowProgressPublicly != nil {
		prefs.ShowProgressPublicly = *r.ShowProgressPublicly
	}
}

// FormatDateOfBirth formats a time.Time to ISO 8601 date string
func FormatDateOfBirth(dob *time.Time) *string {
	if dob == nil {
		return nil
	}
	formatted := dob.Format("2006-01-02")
	return &formatted
}

// ProfileToResponse converts a UserProfile to GetProfileResponse
func ProfileToResponse(profile *UserProfile, email, role string, isVerified bool) *GetProfileResponse {
	return &GetProfileResponse{
		UserID:      profile.UserID,
		Email:       email,
		FullName:    profile.FullName,
		AvatarURL:   profile.AvatarURL,
		Bio:         profile.Bio,
		PhoneNumber: profile.PhoneNumber,
		DateOfBirth: FormatDateOfBirth(profile.DateOfBirth),
		Country:     profile.Country,
		City:        profile.City,
		Timezone:    profile.Timezone,
		Language:    profile.Language,
		Theme:       profile.Theme,
		Preferences: profile.Preferences,
		Role:        role,
		IsVerified:  isVerified,
		CreatedAt:   profile.CreatedAt,
		UpdatedAt:   profile.UpdatedAt,
	}
}
