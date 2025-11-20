package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// UserProfile represents a user's profile information
type UserProfile struct {
	UserID      uuid.UUID
	TenantID    *uuid.UUID // Can be NULL for users not yet assigned to a tenant
	FullName    *string    // Optional - can be set after registration
	AvatarURL   *string
	Bio         *string
	PhoneNumber *string
	DateOfBirth *time.Time
	Country     *string
	City        *string
	Timezone    string
	Language    string
	Theme       string
	Preferences ProfilePreferences
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// ProfilePreferences represents user's notification and privacy preferences
type ProfilePreferences struct {
	EmailNotifications   bool
	PushNotifications    bool
	CourseReminders      bool
	WeeklyDigest         bool
	MarketingEmails      bool
	PrivateProfile       bool
	ShowProgressPublicly bool
}

// ChangePasswordRequest represents a password change request
type ChangePasswordRequest struct {
	CurrentPassword string
	NewPassword     string
}

// Theme constants
const (
	ThemeLight  = "light"
	ThemeDark   = "dark"
	ThemeSystem = "system"
)

// Language constants
const (
	LanguageEnglish = "en"
	LanguageSpanish = "es"
)

// Validation constants
const (
	MinNameLength        = 2
	MaxNameLength        = 100
	MaxBioLength         = 500
	MaxPhoneLength       = 20
	MinPasswordLength    = 8
	MaxPasswordLength    = 100
	MaxAvatarSizeBytes   = 5 * 1024 * 1024 // 5MB
	AllowedImageFormats  = "image/jpeg,image/png,image/webp"
)

// Validation errors
var (
	ErrInvalidFullName    = errors.New("full name must be between 2 and 255 characters")
	ErrInvalidBio         = errors.New("bio must not exceed 500 characters")
	ErrInvalidPhone       = errors.New("phone number must not exceed 20 characters")
	ErrInvalidTheme       = errors.New("theme must be 'light', 'dark', or 'system'")
	ErrInvalidLanguage    = errors.New("language must be a valid ISO 639-1 code")
	ErrInvalidTimezone    = errors.New("timezone must be a valid IANA timezone")
	ErrPasswordTooShort   = errors.New("password must be at least 8 characters")
	ErrPasswordTooLong    = errors.New("password must not exceed 100 characters")
	ErrPasswordsNotMatch  = errors.New("passwords do not match")
	ErrInvalidImageFormat = errors.New("image format must be JPEG, PNG, or WebP")
	ErrImageTooLarge      = errors.New("image size must not exceed 5MB")
)

// ValidateFullName validates the full name
func ValidateFullName(fullName *string) error {
	if fullName != nil {
		if len(*fullName) < MinNameLength || len(*fullName) > 255 {
			return ErrInvalidFullName
		}
	}
	return nil
}

// ValidateBio validates the bio field
func ValidateBio(bio *string) error {
	if bio != nil && len(*bio) > MaxBioLength {
		return ErrInvalidBio
	}
	return nil
}

// ValidatePhone validates the phone number
func ValidatePhone(phone *string) error {
	if phone != nil && len(*phone) > MaxPhoneLength {
		return ErrInvalidPhone
	}
	return nil
}

// ValidateTheme validates the theme value
func ValidateTheme(theme string) error {
	switch theme {
	case ThemeLight, ThemeDark, ThemeSystem:
		return nil
	default:
		return ErrInvalidTheme
	}
}

// ValidateLanguage validates the language code
func ValidateLanguage(language string) error {
	// Basic validation - should be 2-letter ISO 639-1 code
	if len(language) != 2 {
		return ErrInvalidLanguage
	}
	return nil
}

// ValidatePassword validates password requirements
func ValidatePassword(password string) error {
	if len(password) < MinPasswordLength {
		return ErrPasswordTooShort
	}
	if len(password) > MaxPasswordLength {
		return ErrPasswordTooLong
	}
	return nil
}

// ValidateChangePasswordRequest validates a password change request
func (r *ChangePasswordRequest) Validate() error {
	if r.CurrentPassword == "" {
		return errors.New("current password is required")
	}
	if r.NewPassword == "" {
		return errors.New("new password is required")
	}
	if r.CurrentPassword == r.NewPassword {
		return errors.New("new password must be different from current password")
	}
	return ValidatePassword(r.NewPassword)
}

// Validate validates the UserProfile entity
func (p *UserProfile) Validate() error {
	if p.UserID == uuid.Nil {
		return errors.New("user ID is required")
	}
	// TenantID can be NULL for users not yet assigned to a tenant
	if err := ValidateFullName(p.FullName); err != nil {
		return err
	}
	if err := ValidateBio(p.Bio); err != nil {
		return err
	}
	if err := ValidatePhone(p.PhoneNumber); err != nil {
		return err
	}
	if err := ValidateTheme(p.Theme); err != nil {
		return err
	}
	if err := ValidateLanguage(p.Language); err != nil {
		return err
	}
	return nil
}

// NewUserProfile creates a new UserProfile with default values
func NewUserProfile(userID uuid.UUID, tenantID *uuid.UUID, fullName *string) *UserProfile {
	now := time.Now()
	return &UserProfile{
		UserID:   userID,
		TenantID: tenantID,
		FullName: fullName,
		Timezone: "UTC",
		Language: LanguageEnglish,
		Theme:    ThemeLight,
		Preferences: ProfilePreferences{
			EmailNotifications:   true,
			PushNotifications:    true,
			CourseReminders:      true,
			WeeklyDigest:         false,
			MarketingEmails:      false,
			PrivateProfile:       false,
			ShowProgressPublicly: true,
		},
		CreatedAt: now,
		UpdatedAt: now,
	}
}

// GetFullName returns the user's full name or empty string if not set
func (p *UserProfile) GetFullName() string {
	if p.FullName != nil {
		return *p.FullName
	}
	return ""
}

// HasAvatar returns whether the user has an avatar
func (p *UserProfile) HasAvatar() bool {
	return p.AvatarURL != nil && *p.AvatarURL != ""
}

// UpdateTimestamp updates the UpdatedAt timestamp
func (p *UserProfile) UpdateTimestamp() {
	p.UpdatedAt = time.Now()
}
