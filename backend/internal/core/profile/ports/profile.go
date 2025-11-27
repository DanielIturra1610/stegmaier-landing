package ports

import (
	"context"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/domain"
	"github.com/google/uuid"
)

// ProfileRepository defines the interface for profile data access
type ProfileRepository interface {
	// GetProfile retrieves a user's profile by user ID and tenant ID
	GetProfile(ctx context.Context, userID, tenantID uuid.UUID) (*domain.UserProfile, error)

	// CreateProfile creates a new user profile
	CreateProfile(ctx context.Context, profile *domain.UserProfile) error

	// UpdateProfile updates an existing user profile
	UpdateProfile(ctx context.Context, profile *domain.UserProfile) error

	// UpdateAvatar updates the user's avatar URL
	UpdateAvatar(ctx context.Context, userID, tenantID uuid.UUID, avatarURL string) error

	// DeleteAvatar removes the user's avatar URL
	DeleteAvatar(ctx context.Context, userID, tenantID uuid.UUID) error

	// GetPreferences retrieves user preferences
	GetPreferences(ctx context.Context, userID, tenantID uuid.UUID) (*domain.ProfilePreferences, error)

	// UpdatePreferences updates user preferences
	UpdatePreferences(ctx context.Context, userID, tenantID uuid.UUID, prefs *domain.ProfilePreferences) error

	// ProfileExists checks if a profile exists for a user
	ProfileExists(ctx context.Context, userID, tenantID uuid.UUID) (bool, error)

	// DeleteProfile deletes a user's profile (for account deletion)
	DeleteProfile(ctx context.Context, userID, tenantID uuid.UUID) error
}

// ProfileService defines the business logic interface for profile management
type ProfileService interface {
	// GetMyProfile retrieves the authenticated user's profile
	GetMyProfile(ctx context.Context, userID, tenantID uuid.UUID) (*domain.GetProfileResponse, error)

	// UpdateMyProfile updates the authenticated user's profile
	UpdateMyProfile(ctx context.Context, userID, tenantID uuid.UUID, req *domain.UpdateProfileRequest) error

	// ChangePassword changes the user's password
	ChangePassword(ctx context.Context, userID, tenantID uuid.UUID, req *domain.ChangePasswordRequestDTO) error

	// UploadAvatar uploads and sets a new avatar for the user
	UploadAvatar(ctx context.Context, userID, tenantID uuid.UUID, req *domain.UploadAvatarRequest) (*domain.UploadAvatarResponse, error)

	// DeleteAvatar removes the user's avatar
	DeleteAvatar(ctx context.Context, userID, tenantID uuid.UUID) (*domain.DeleteAvatarResponse, error)

	// UpdatePreferences updates the user's preferences
	UpdatePreferences(ctx context.Context, userID, tenantID uuid.UUID, req *domain.UpdatePreferencesRequest) error

	// GetProfile retrieves any user's profile (admin only)
	GetProfile(ctx context.Context, targetUserID, tenantID uuid.UUID) (*domain.GetProfileResponse, error)

	// UpdateProfile updates any user's profile (admin only)
	UpdateProfile(ctx context.Context, targetUserID, tenantID uuid.UUID, req *domain.UpdateProfileRequest) error
}

// FileStorageService defines the interface for file storage operations
type FileStorageService interface {
	// UploadFile uploads a file and returns its URL
	UploadFile(ctx context.Context, file []byte, fileName, contentType string) (string, error)

	// DeleteFile deletes a file by its URL
	DeleteFile(ctx context.Context, fileURL string) error

	// ValidateImage validates an image file (format, size, dimensions)
	ValidateImage(file []byte, contentType string) error

	// GetFilePath extracts the file path from a URL
	GetFilePath(fileURL string) string

	// FileExists checks if a file exists
	FileExists(ctx context.Context, fileURL string) (bool, error)
}
