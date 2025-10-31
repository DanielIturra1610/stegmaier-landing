package profile_test

import (
	"context"
	"errors"
	"testing"

	authDomain "github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/ports"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/services"
	"github.com/DanielIturra1610/stegmaier-landing/tests/mocks"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Mock ProfileRepository
type mockProfileRepository struct {
	getProfileFunc       func(ctx context.Context, userID, tenantID uuid.UUID) (*domain.UserProfile, error)
	updateProfileFunc    func(ctx context.Context, profile *domain.UserProfile) error
	updateAvatarFunc     func(ctx context.Context, userID, tenantID uuid.UUID, avatarURL string) error
	deleteAvatarFunc     func(ctx context.Context, userID, tenantID uuid.UUID) error
	getPreferencesFunc   func(ctx context.Context, userID, tenantID uuid.UUID) (*domain.ProfilePreferences, error)
	updatePreferencesFunc func(ctx context.Context, userID, tenantID uuid.UUID, prefs *domain.ProfilePreferences) error
}

func (m *mockProfileRepository) GetProfile(ctx context.Context, userID, tenantID uuid.UUID) (*domain.UserProfile, error) {
	if m.getProfileFunc != nil {
		return m.getProfileFunc(ctx, userID, tenantID)
	}
	return nil, errors.New("not implemented")
}

func (m *mockProfileRepository) CreateProfile(ctx context.Context, profile *domain.UserProfile) error {
	return errors.New("not implemented")
}

func (m *mockProfileRepository) UpdateProfile(ctx context.Context, profile *domain.UserProfile) error {
	if m.updateProfileFunc != nil {
		return m.updateProfileFunc(ctx, profile)
	}
	return errors.New("not implemented")
}

func (m *mockProfileRepository) UpdateAvatar(ctx context.Context, userID, tenantID uuid.UUID, avatarURL string) error {
	if m.updateAvatarFunc != nil {
		return m.updateAvatarFunc(ctx, userID, tenantID, avatarURL)
	}
	return errors.New("not implemented")
}

func (m *mockProfileRepository) DeleteAvatar(ctx context.Context, userID, tenantID uuid.UUID) error {
	if m.deleteAvatarFunc != nil {
		return m.deleteAvatarFunc(ctx, userID, tenantID)
	}
	return errors.New("not implemented")
}

func (m *mockProfileRepository) GetPreferences(ctx context.Context, userID, tenantID uuid.UUID) (*domain.ProfilePreferences, error) {
	if m.getPreferencesFunc != nil {
		return m.getPreferencesFunc(ctx, userID, tenantID)
	}
	return nil, errors.New("not implemented")
}

func (m *mockProfileRepository) UpdatePreferences(ctx context.Context, userID, tenantID uuid.UUID, prefs *domain.ProfilePreferences) error {
	if m.updatePreferencesFunc != nil {
		return m.updatePreferencesFunc(ctx, userID, tenantID, prefs)
	}
	return errors.New("not implemented")
}

func (m *mockProfileRepository) ProfileExists(ctx context.Context, userID, tenantID uuid.UUID) (bool, error) {
	return false, errors.New("not implemented")
}

func (m *mockProfileRepository) DeleteProfile(ctx context.Context, userID, tenantID uuid.UUID) error {
	return errors.New("not implemented")
}

// Mock UserRepository
type mockUserRepository struct {
	getUserByIDFunc     func(ctx context.Context, userID string) (*authDomain.User, error)
	changePasswordFunc  func(ctx context.Context, userID string, newPasswordHash string) error
}

func (m *mockUserRepository) GetUserByID(ctx context.Context, userID string) (*authDomain.User, error) {
	if m.getUserByIDFunc != nil {
		return m.getUserByIDFunc(ctx, userID)
	}
	return nil, errors.New("not implemented")
}

func (m *mockUserRepository) ChangePassword(ctx context.Context, userID string, newPasswordHash string) error {
	if m.changePasswordFunc != nil {
		return m.changePasswordFunc(ctx, userID, newPasswordHash)
	}
	return errors.New("not implemented")
}

func (m *mockUserRepository) CreateUser(ctx context.Context, user *authDomain.User) error {
	return errors.New("not implemented")
}

func (m *mockUserRepository) UpdateProfile(ctx context.Context, userID string, updates *authDomain.UpdateProfileDTO) error {
	return errors.New("not implemented")
}

func (m *mockUserRepository) GetUsersByTenant(ctx context.Context, tenantID string, page, pageSize int) ([]*authDomain.User, int, error) {
	return nil, 0, errors.New("not implemented")
}

func (m *mockUserRepository) GetUsersByRole(ctx context.Context, tenantID string, role authDomain.UserRole, page, pageSize int) ([]*authDomain.User, int, error) {
	return nil, 0, errors.New("not implemented")
}

func (m *mockUserRepository) CountUsersByTenant(ctx context.Context, tenantID string) (int, error) {
	return 0, errors.New("not implemented")
}

func (m *mockUserRepository) CountUsersByRole(ctx context.Context, tenantID string, role authDomain.UserRole) (int, error) {
	return 0, errors.New("not implemented")
}

func (m *mockUserRepository) GetUsersByIDs(ctx context.Context, userIDs []string) ([]*authDomain.User, error) {
	return nil, errors.New("not implemented")
}

func (m *mockUserRepository) DeactivateUser(ctx context.Context, userID string) error {
	return errors.New("not implemented")
}

func (m *mockUserRepository) ActivateUser(ctx context.Context, userID string) error {
	return errors.New("not implemented")
}

func (m *mockUserRepository) VerifyEmail(ctx context.Context, userID string) error {
	return errors.New("not implemented")
}

func (m *mockUserRepository) UpdateLastLogin(ctx context.Context, userID string) error {
	return errors.New("not implemented")
}

func (m *mockUserRepository) GetActiveUsersByTenant(ctx context.Context, tenantID string) ([]*authDomain.User, error) {
	return nil, errors.New("not implemented")
}

// AuthRepository methods (stub implementations for interface compatibility)
func (m *mockUserRepository) GetUserByEmail(ctx context.Context, email string) (*authDomain.User, error) {
	return nil, errors.New("not implemented")
}

func (m *mockUserRepository) UpdateUser(ctx context.Context, user *authDomain.User) error {
	return errors.New("not implemented")
}

func (m *mockUserRepository) DeleteUser(ctx context.Context, userID string) error {
	return errors.New("not implemented")
}

func (m *mockUserRepository) ListUsers(ctx context.Context, filters *authDomain.UserListFilters, page, pageSize int) ([]*authDomain.User, int, error) {
	return nil, 0, errors.New("not implemented")
}

func (m *mockUserRepository) CreateVerificationToken(ctx context.Context, token *authDomain.VerificationToken) error {
	return errors.New("not implemented")
}

func (m *mockUserRepository) GetVerificationToken(ctx context.Context, token string) (*authDomain.VerificationToken, error) {
	return nil, errors.New("not implemented")
}

func (m *mockUserRepository) DeleteVerificationToken(ctx context.Context, tokenID string) error {
	return errors.New("not implemented")
}

func (m *mockUserRepository) DeleteVerificationTokensByUserID(ctx context.Context, userID string) error {
	return errors.New("not implemented")
}

func (m *mockUserRepository) CreatePasswordResetToken(ctx context.Context, token *authDomain.PasswordResetToken) error {
	return errors.New("not implemented")
}

func (m *mockUserRepository) GetPasswordResetToken(ctx context.Context, token string) (*authDomain.PasswordResetToken, error) {
	return nil, errors.New("not implemented")
}

func (m *mockUserRepository) MarkPasswordResetTokenAsUsed(ctx context.Context, tokenID string) error {
	return errors.New("not implemented")
}

func (m *mockUserRepository) DeletePasswordResetToken(ctx context.Context, tokenID string) error {
	return errors.New("not implemented")
}

func (m *mockUserRepository) DeletePasswordResetTokensByUserID(ctx context.Context, userID string) error {
	return errors.New("not implemented")
}

func (m *mockUserRepository) CreateRefreshToken(ctx context.Context, token *authDomain.RefreshToken) error {
	return errors.New("not implemented")
}

func (m *mockUserRepository) GetRefreshToken(ctx context.Context, token string) (*authDomain.RefreshToken, error) {
	return nil, errors.New("not implemented")
}

func (m *mockUserRepository) RevokeRefreshToken(ctx context.Context, tokenID string) error {
	return errors.New("not implemented")
}

func (m *mockUserRepository) RevokeAllUserRefreshTokens(ctx context.Context, userID string) error {
	return errors.New("not implemented")
}

func (m *mockUserRepository) DeleteExpiredRefreshTokens(ctx context.Context) error {
	return errors.New("not implemented")
}

func (m *mockUserRepository) EmailExists(ctx context.Context, email string) (bool, error) {
	return false, errors.New("not implemented")
}

func (m *mockUserRepository) EmailExistsExcludingUser(ctx context.Context, email string, userID string) (bool, error) {
	return false, errors.New("not implemented")
}

// Mock FileStorageService
type mockFileStorageService struct {
	uploadFileFunc    func(ctx context.Context, file []byte, fileName, contentType string) (string, error)
	deleteFileFunc    func(ctx context.Context, fileURL string) error
	validateImageFunc func(file []byte, contentType string) error
}

func (m *mockFileStorageService) UploadFile(ctx context.Context, file []byte, fileName, contentType string) (string, error) {
	if m.uploadFileFunc != nil {
		return m.uploadFileFunc(ctx, file, fileName, contentType)
	}
	return "", errors.New("not implemented")
}

func (m *mockFileStorageService) DeleteFile(ctx context.Context, fileURL string) error {
	if m.deleteFileFunc != nil {
		return m.deleteFileFunc(ctx, fileURL)
	}
	return errors.New("not implemented")
}

func (m *mockFileStorageService) ValidateImage(file []byte, contentType string) error {
	if m.validateImageFunc != nil {
		return m.validateImageFunc(file, contentType)
	}
	return nil // Default: validation passes
}

func (m *mockFileStorageService) GetFilePath(fileURL string) string {
	return ""
}

func (m *mockFileStorageService) FileExists(ctx context.Context, fileURL string) (bool, error) {
	return false, errors.New("not implemented")
}

func TestProfileService_GetMyProfile(t *testing.T) {
	userID := uuid.New()
	tenantID := uuid.New()

	t.Run("success", func(t *testing.T) {
		mockProfileRepo := &mockProfileRepository{
			getProfileFunc: func(ctx context.Context, uid, tid uuid.UUID) (*domain.UserProfile, error) {
				assert.Equal(t, userID, uid)
				assert.Equal(t, tenantID, tid)
				return domain.NewUserProfile(userID, tenantID, "John", "Doe"), nil
			},
		}

		mockAuthRepo := &mockUserRepository{
			getUserByIDFunc: func(ctx context.Context, uid string) (*authDomain.User, error) {
				assert.Equal(t, userID.String(), uid)
				return &authDomain.User{
					ID:         userID.String(),
					Email:      "john.doe@example.com",
					Role:       string(authDomain.RoleStudent),
					IsVerified: true,
				}, nil
			},
		}

		service := services.NewProfileService(mockProfileRepo, mockAuthRepo, nil, nil, nil)

		profile, err := service.GetMyProfile(context.Background(), userID, tenantID)
		require.NoError(t, err)
		assert.NotNil(t, profile)
		assert.Equal(t, "John", profile.FirstName)
		assert.Equal(t, "Doe", profile.LastName)
		assert.Equal(t, "john.doe@example.com", profile.Email)
	})

	t.Run("profile not found", func(t *testing.T) {
		mockRepo := &mockProfileRepository{
			getProfileFunc: func(ctx context.Context, uid, tid uuid.UUID) (*domain.UserProfile, error) {
				return nil, errors.New("not found")
			},
		}

		service := services.NewProfileService(mockRepo, nil, nil, nil, nil)

		profile, err := service.GetMyProfile(context.Background(), userID, tenantID)
		assert.Error(t, err)
		assert.Nil(t, profile)
	})
}

func TestProfileService_UpdateMyProfile(t *testing.T) {
	userID := uuid.New()
	tenantID := uuid.New()

	t.Run("success", func(t *testing.T) {
		existingProfile := domain.NewUserProfile(userID, tenantID, "John", "Doe")

		mockRepo := &mockProfileRepository{
			getProfileFunc: func(ctx context.Context, uid, tid uuid.UUID) (*domain.UserProfile, error) {
				return existingProfile, nil
			},
			updateProfileFunc: func(ctx context.Context, profile *domain.UserProfile) error {
				assert.Equal(t, "Jane", profile.FirstName)
				return nil
			},
		}

		service := services.NewProfileService(mockRepo, nil, nil, nil, nil)

		req := &domain.UpdateProfileRequest{
			FirstName: stringPtr("Jane"),
		}

		err := service.UpdateMyProfile(context.Background(), userID, tenantID, req)
		require.NoError(t, err)
	})

	t.Run("invalid request", func(t *testing.T) {
		mockRepo := &mockProfileRepository{}
		service := services.NewProfileService(mockRepo, nil, nil, nil, nil)

		req := &domain.UpdateProfileRequest{
			FirstName: stringPtr("J"), // Too short
		}

		err := service.UpdateMyProfile(context.Background(), userID, tenantID, req)
		assert.Error(t, err)
	})

	t.Run("profile not found", func(t *testing.T) {
		mockRepo := &mockProfileRepository{
			getProfileFunc: func(ctx context.Context, uid, tid uuid.UUID) (*domain.UserProfile, error) {
				return nil, errors.New("not found")
			},
		}

		service := services.NewProfileService(mockRepo, nil, nil, nil, nil)

		req := &domain.UpdateProfileRequest{
			FirstName: stringPtr("Jane"),
		}

		err := service.UpdateMyProfile(context.Background(), userID, tenantID, req)
		assert.Error(t, err)
	})
}

func TestProfileService_ChangePassword(t *testing.T) {
	userID := uuid.New()
	tenantID := uuid.New()

	t.Run("success", func(t *testing.T) {
		mockUserRepo := &mockUserRepository{
			getUserByIDFunc: func(ctx context.Context, uid string) (*authDomain.User, error) {
				return &authDomain.User{
					ID:           userID.String(),
					TenantID:     tenantID.String(),
					Email:        "test@example.com",
					PasswordHash: "mock$hashed$oldpassword",
					Role:         string(authDomain.RoleStudent),
				}, nil
			},
			changePasswordFunc: func(ctx context.Context, uid string, newHash string) error {
				assert.Equal(t, userID.String(), uid)
				assert.Contains(t, newHash, "newpassword")
				return nil
			},
		}

		mockHasher := mocks.NewMockPasswordHasher()
		service := services.NewProfileService(nil, mockUserRepo, mockUserRepo, nil, mockHasher)

		req := &domain.ChangePasswordRequestDTO{
			CurrentPassword: "oldpassword",
			NewPassword:     "newpassword123",
			ConfirmPassword: "newpassword123",
		}

		err := service.ChangePassword(context.Background(), userID, tenantID, req)
		require.NoError(t, err)
	})

	t.Run("invalid current password", func(t *testing.T) {
		mockUserRepo := &mockUserRepository{
			getUserByIDFunc: func(ctx context.Context, uid string) (*authDomain.User, error) {
				return &authDomain.User{
					ID:           userID.String(),
					TenantID:     tenantID.String(),
					Email:        "test@example.com",
					PasswordHash: "mock$hashed$oldpassword",
					Role:         string(authDomain.RoleStudent),
				}, nil
			},
		}

		mockHasher := mocks.NewMockPasswordHasher()
		service := services.NewProfileService(nil, mockUserRepo, mockUserRepo, nil, mockHasher)

		req := &domain.ChangePasswordRequestDTO{
			CurrentPassword: "wrongpassword",
			NewPassword:     "newpassword123",
			ConfirmPassword: "newpassword123",
		}

		err := service.ChangePassword(context.Background(), userID, tenantID, req)
		assert.Error(t, err)
		assert.ErrorIs(t, err, ports.ErrInvalidPassword)
	})

	t.Run("tenant mismatch", func(t *testing.T) {
		differentTenantID := uuid.New()

		mockUserRepo := &mockUserRepository{
			getUserByIDFunc: func(ctx context.Context, uid string) (*authDomain.User, error) {
				return &authDomain.User{
					ID:           userID.String(),
					TenantID:     tenantID.String(),
					Email:        "test@example.com",
					PasswordHash: "mock$hashed$oldpassword",
					Role:         string(authDomain.RoleStudent),
				}, nil
			},
		}

		mockHasher := mocks.NewMockPasswordHasher()
		service := services.NewProfileService(nil, mockUserRepo, mockUserRepo, nil, mockHasher)

		req := &domain.ChangePasswordRequestDTO{
			CurrentPassword: "oldpassword",
			NewPassword:     "newpassword123",
			ConfirmPassword: "newpassword123",
		}

		err := service.ChangePassword(context.Background(), userID, differentTenantID, req)
		assert.Error(t, err)
		assert.ErrorIs(t, err, ports.ErrUnauthorized)
	})
}

func TestProfileService_UploadAvatar(t *testing.T) {
	userID := uuid.New()
	tenantID := uuid.New()

	t.Run("success", func(t *testing.T) {
		mockProfileRepo := &mockProfileRepository{
			getProfileFunc: func(ctx context.Context, uid, tid uuid.UUID) (*domain.UserProfile, error) {
				profile := domain.NewUserProfile(userID, tenantID, "John", "Doe")
				return profile, nil
			},
			updateAvatarFunc: func(ctx context.Context, uid, tid uuid.UUID, avatarURL string) error {
				assert.Equal(t, "http://localhost/uploads/avatar.png", avatarURL)
				return nil
			},
		}

		mockFileStorage := &mockFileStorageService{
			validateImageFunc: func(file []byte, contentType string) error {
				return nil
			},
			uploadFileFunc: func(ctx context.Context, file []byte, fileName, contentType string) (string, error) {
				return "http://localhost/uploads/avatar.png", nil
			},
		}

		service := services.NewProfileService(mockProfileRepo, nil, nil, mockFileStorage, nil)

		req := &domain.UploadAvatarRequest{
			Image:       []byte("fake image data"),
			FileName:    "avatar.png",
			ContentType: "image/png",
		}

		resp, err := service.UploadAvatar(context.Background(), userID, tenantID, req)
		require.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, "http://localhost/uploads/avatar.png", resp.AvatarURL)
	})

	t.Run("replaces old avatar", func(t *testing.T) {
		oldAvatarURL := "http://localhost/uploads/old_avatar.png"
		var deleteCalled bool

		mockProfileRepo := &mockProfileRepository{
			getProfileFunc: func(ctx context.Context, uid, tid uuid.UUID) (*domain.UserProfile, error) {
				profile := domain.NewUserProfile(userID, tenantID, "John", "Doe")
				profile.AvatarURL = &oldAvatarURL
				return profile, nil
			},
			updateAvatarFunc: func(ctx context.Context, uid, tid uuid.UUID, avatarURL string) error {
				return nil
			},
		}

		mockFileStorage := &mockFileStorageService{
			validateImageFunc: func(file []byte, contentType string) error {
				return nil
			},
			uploadFileFunc: func(ctx context.Context, file []byte, fileName, contentType string) (string, error) {
				return "http://localhost/uploads/new_avatar.png", nil
			},
			deleteFileFunc: func(ctx context.Context, fileURL string) error {
				assert.Equal(t, oldAvatarURL, fileURL)
				deleteCalled = true
				return nil
			},
		}

		service := services.NewProfileService(mockProfileRepo, nil, nil, mockFileStorage, nil)

		req := &domain.UploadAvatarRequest{
			Image:       []byte("fake image data"),
			FileName:    "avatar.png",
			ContentType: "image/png",
		}

		resp, err := service.UploadAvatar(context.Background(), userID, tenantID, req)
		require.NoError(t, err)
		assert.NotNil(t, resp)
		assert.True(t, deleteCalled)
	})

	t.Run("invalid image", func(t *testing.T) {
		mockProfileRepo := &mockProfileRepository{}
		mockFileStorage := &mockFileStorageService{
			validateImageFunc: func(file []byte, contentType string) error {
				return errors.New("invalid image")
			},
		}

		service := services.NewProfileService(mockProfileRepo, nil, nil, mockFileStorage, nil)

		req := &domain.UploadAvatarRequest{
			Image:   []byte("invalid data"),
			FileName:    "avatar.gif",
			ContentType: "image/gif",
		}

		resp, err := service.UploadAvatar(context.Background(), userID, tenantID, req)
		assert.Error(t, err)
		assert.Nil(t, resp)
	})
}

func TestProfileService_DeleteAvatar(t *testing.T) {
	userID := uuid.New()
	tenantID := uuid.New()

	t.Run("success", func(t *testing.T) {
		avatarURL := "http://localhost/uploads/avatar.png"

		mockProfileRepo := &mockProfileRepository{
			getProfileFunc: func(ctx context.Context, uid, tid uuid.UUID) (*domain.UserProfile, error) {
				profile := domain.NewUserProfile(userID, tenantID, "John", "Doe")
				profile.AvatarURL = &avatarURL
				return profile, nil
			},
			deleteAvatarFunc: func(ctx context.Context, uid, tid uuid.UUID) error {
				return nil
			},
		}

		mockFileStorage := &mockFileStorageService{
			deleteFileFunc: func(ctx context.Context, fileURL string) error {
				assert.Equal(t, avatarURL, fileURL)
				return nil
			},
		}

		service := services.NewProfileService(mockProfileRepo, nil, nil, mockFileStorage, nil)

		resp, err := service.DeleteAvatar(context.Background(), userID, tenantID)
		require.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, "Avatar deleted successfully", resp.Message)
	})

	t.Run("no avatar to delete", func(t *testing.T) {
		mockProfileRepo := &mockProfileRepository{
			getProfileFunc: func(ctx context.Context, uid, tid uuid.UUID) (*domain.UserProfile, error) {
				profile := domain.NewUserProfile(userID, tenantID, "John", "Doe")
				return profile, nil
			},
		}

		service := services.NewProfileService(mockProfileRepo, nil, nil, nil, nil)

		resp, err := service.DeleteAvatar(context.Background(), userID, tenantID)
		require.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, "No avatar to delete", resp.Message)
	})
}

func TestProfileService_UpdatePreferences(t *testing.T) {
	userID := uuid.New()
	tenantID := uuid.New()

	t.Run("success", func(t *testing.T) {
		mockProfileRepo := &mockProfileRepository{
			getPreferencesFunc: func(ctx context.Context, uid, tid uuid.UUID) (*domain.ProfilePreferences, error) {
				return &domain.ProfilePreferences{
					EmailNotifications: true,
					PushNotifications:  true,
				}, nil
			},
			updatePreferencesFunc: func(ctx context.Context, uid, tid uuid.UUID, prefs *domain.ProfilePreferences) error {
				assert.False(t, prefs.EmailNotifications)
				return nil
			},
		}

		service := services.NewProfileService(mockProfileRepo, nil, nil, nil, nil)

		req := &domain.UpdatePreferencesRequest{
			EmailNotifications: boolPtr(false),
		}

		err := service.UpdatePreferences(context.Background(), userID, tenantID, req)
		require.NoError(t, err)
	})
}

// Helper functions
func stringPtr(s string) *string {
	return &s
}

func boolPtr(b bool) *bool {
	return &b
}
