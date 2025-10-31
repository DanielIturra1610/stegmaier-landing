package services

import (
	"context"

	authPorts "github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/ports"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/ports"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/hasher"
	"github.com/google/uuid"
)

// ProfileServiceImpl implements the ProfileService interface
type ProfileServiceImpl struct {
	profileRepo  ports.ProfileRepository
	authRepo     authPorts.AuthRepository
	userRepo     authPorts.UserRepository
	fileStorage  ports.FileStorageService
	passwordHash hasher.PasswordHasher
}

// NewProfileService creates a new profile service instance
func NewProfileService(
	profileRepo ports.ProfileRepository,
	authRepo authPorts.AuthRepository,
	userRepo authPorts.UserRepository,
	fileStorage ports.FileStorageService,
	passwordHash hasher.PasswordHasher,
) ports.ProfileService {
	return &ProfileServiceImpl{
		profileRepo:  profileRepo,
		authRepo:     authRepo,
		userRepo:     userRepo,
		fileStorage:  fileStorage,
		passwordHash: passwordHash,
	}
}

// GetMyProfile retrieves the authenticated user's profile
func (s *ProfileServiceImpl) GetMyProfile(ctx context.Context, userID, tenantID uuid.UUID) (*domain.GetProfileResponse, error) {
	// Get profile from repository
	profile, err := s.profileRepo.GetProfile(ctx, userID, tenantID)
	if err != nil {
		return nil, ports.NewProfileError("GetMyProfile", ports.ErrProfileNotFound, err.Error())
	}

	// Get user info for response
	user, err := s.authRepo.GetUserByID(ctx, userID.String())
	if err != nil {
		return nil, ports.NewProfileError("GetMyProfile", ports.ErrProfileNotFound, "user not found")
	}

	// Convert to response DTO
	response := domain.ProfileToResponse(profile, user.Email, string(user.Role), user.IsVerified)
	return response, nil
}

// UpdateMyProfile updates the authenticated user's profile
func (s *ProfileServiceImpl) UpdateMyProfile(ctx context.Context, userID, tenantID uuid.UUID, req *domain.UpdateProfileRequest) error {
	// Validate request
	if err := req.Validate(); err != nil {
		return ports.NewProfileError("UpdateMyProfile", ports.ErrInvalidInput, err.Error())
	}

	// Get existing profile
	profile, err := s.profileRepo.GetProfile(ctx, userID, tenantID)
	if err != nil {
		return ports.NewProfileError("UpdateMyProfile", ports.ErrProfileNotFound, err.Error())
	}

	// Apply updates
	req.ApplyToProfile(profile)

	// Update in repository
	if err := s.profileRepo.UpdateProfile(ctx, profile); err != nil {
		return ports.NewProfileError("UpdateMyProfile", ports.ErrUpdateFailed, err.Error())
	}

	return nil
}

// ChangePassword changes the user's password
func (s *ProfileServiceImpl) ChangePassword(ctx context.Context, userID, tenantID uuid.UUID, req *domain.ChangePasswordRequestDTO) error {
	// Validate request
	if err := req.Validate(); err != nil {
		return ports.NewProfileError("ChangePassword", ports.ErrInvalidInput, err.Error())
	}

	// Get user to verify current password
	user, err := s.authRepo.GetUserByID(ctx, userID.String())
	if err != nil {
		return ports.NewProfileError("ChangePassword", ports.ErrProfileNotFound, "user not found")
	}

	// Verify tenant isolation
	if user.TenantID != tenantID.String() {
		return ports.NewProfileError("ChangePassword", ports.ErrUnauthorized, "tenant mismatch")
	}

	// Verify current password
	if err := s.passwordHash.Compare(user.PasswordHash, req.CurrentPassword); err != nil {
		return ports.NewProfileError("ChangePassword", ports.ErrInvalidPassword, "current password is incorrect")
	}

	// Hash new password
	newPasswordHash, err := s.passwordHash.Hash(req.NewPassword)
	if err != nil {
		return ports.NewProfileError("ChangePassword", ports.ErrUpdateFailed, "failed to hash new password")
	}

	// Update password in repository
	if err := s.userRepo.ChangePassword(ctx, userID.String(), newPasswordHash); err != nil {
		return ports.NewProfileError("ChangePassword", ports.ErrUpdateFailed, err.Error())
	}

	return nil
}

// UploadAvatar uploads and sets a new avatar for the user
func (s *ProfileServiceImpl) UploadAvatar(ctx context.Context, userID, tenantID uuid.UUID, req *domain.UploadAvatarRequest) (*domain.UploadAvatarResponse, error) {
	// Validate request
	if err := req.Validate(); err != nil {
		return nil, ports.NewProfileError("UploadAvatar", ports.ErrInvalidInput, err.Error())
	}

	// Validate image
	if err := s.fileStorage.ValidateImage(req.Image, req.ContentType); err != nil {
		return nil, ports.NewProfileError("UploadAvatar", ports.ErrInvalidFileFormat, err.Error())
	}

	// Get existing profile to check for old avatar
	profile, err := s.profileRepo.GetProfile(ctx, userID, tenantID)
	if err != nil {
		return nil, ports.NewProfileError("UploadAvatar", ports.ErrProfileNotFound, err.Error())
	}

	// Delete old avatar if it exists
	if profile.AvatarURL != nil && *profile.AvatarURL != "" {
		// Ignore error if old avatar doesn't exist
		_ = s.fileStorage.DeleteFile(ctx, *profile.AvatarURL)
	}

	// Upload new avatar
	avatarURL, err := s.fileStorage.UploadFile(ctx, req.Image, req.FileName, req.ContentType)
	if err != nil {
		return nil, ports.NewProfileError("UploadAvatar", ports.ErrFileUploadFailed, err.Error())
	}

	// Update avatar URL in repository
	if err := s.profileRepo.UpdateAvatar(ctx, userID, tenantID, avatarURL); err != nil {
		// Rollback: delete uploaded file
		_ = s.fileStorage.DeleteFile(ctx, avatarURL)
		return nil, ports.NewProfileError("UploadAvatar", ports.ErrUpdateFailed, err.Error())
	}

	return &domain.UploadAvatarResponse{
		AvatarURL: avatarURL,
		Message:   "Avatar uploaded successfully",
	}, nil
}

// DeleteAvatar removes the user's avatar
func (s *ProfileServiceImpl) DeleteAvatar(ctx context.Context, userID, tenantID uuid.UUID) (*domain.DeleteAvatarResponse, error) {
	// Get existing profile to check for avatar
	profile, err := s.profileRepo.GetProfile(ctx, userID, tenantID)
	if err != nil {
		return nil, ports.NewProfileError("DeleteAvatar", ports.ErrProfileNotFound, err.Error())
	}

	// Check if avatar exists
	if profile.AvatarURL == nil || *profile.AvatarURL == "" {
		return &domain.DeleteAvatarResponse{
			Message: "No avatar to delete",
		}, nil
	}

	avatarURL := *profile.AvatarURL

	// Delete avatar from storage
	if err := s.fileStorage.DeleteFile(ctx, avatarURL); err != nil {
		// Log error but continue to remove from database
		// File might have been deleted manually
	}

	// Remove avatar URL from repository
	if err := s.profileRepo.DeleteAvatar(ctx, userID, tenantID); err != nil {
		return nil, ports.NewProfileError("DeleteAvatar", ports.ErrUpdateFailed, err.Error())
	}

	return &domain.DeleteAvatarResponse{
		Message: "Avatar deleted successfully",
	}, nil
}

// UpdatePreferences updates the user's preferences
func (s *ProfileServiceImpl) UpdatePreferences(ctx context.Context, userID, tenantID uuid.UUID, req *domain.UpdatePreferencesRequest) error {
	// Check if request has any updates
	if !req.HasUpdates() {
		return ports.NewProfileError("UpdatePreferences", ports.ErrInvalidInput, "no preferences to update")
	}

	// Get existing preferences
	prefs, err := s.profileRepo.GetPreferences(ctx, userID, tenantID)
	if err != nil {
		return ports.NewProfileError("UpdatePreferences", ports.ErrProfileNotFound, err.Error())
	}

	// Apply updates
	req.ApplyToPreferences(prefs)

	// Update in repository
	if err := s.profileRepo.UpdatePreferences(ctx, userID, tenantID, prefs); err != nil {
		return ports.NewProfileError("UpdatePreferences", ports.ErrUpdateFailed, err.Error())
	}

	return nil
}

// GetProfile retrieves any user's profile (admin only)
func (s *ProfileServiceImpl) GetProfile(ctx context.Context, targetUserID, tenantID uuid.UUID) (*domain.GetProfileResponse, error) {
	// Get profile from repository
	profile, err := s.profileRepo.GetProfile(ctx, targetUserID, tenantID)
	if err != nil {
		return nil, ports.NewProfileError("GetProfile", ports.ErrProfileNotFound, err.Error())
	}

	// Get user info for response
	user, err := s.authRepo.GetUserByID(ctx, targetUserID.String())
	if err != nil {
		return nil, ports.NewProfileError("GetProfile", ports.ErrProfileNotFound, "user not found")
	}

	// Convert to response DTO
	response := domain.ProfileToResponse(profile, user.Email, string(user.Role), user.IsVerified)
	return response, nil
}

// UpdateProfile updates any user's profile (admin only)
func (s *ProfileServiceImpl) UpdateProfile(ctx context.Context, targetUserID, tenantID uuid.UUID, req *domain.UpdateProfileRequest) error {
	// Validate request
	if err := req.Validate(); err != nil {
		return ports.NewProfileError("UpdateProfile", ports.ErrInvalidInput, err.Error())
	}

	// Get existing profile
	profile, err := s.profileRepo.GetProfile(ctx, targetUserID, tenantID)
	if err != nil {
		return ports.NewProfileError("UpdateProfile", ports.ErrProfileNotFound, err.Error())
	}

	// Apply updates
	req.ApplyToProfile(profile)

	// Update in repository
	if err := s.profileRepo.UpdateProfile(ctx, profile); err != nil {
		return ports.NewProfileError("UpdateProfile", ports.ErrUpdateFailed, err.Error())
	}

	return nil
}
