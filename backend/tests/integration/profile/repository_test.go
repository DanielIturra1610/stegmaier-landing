package profile_test

import (
	"context"
	"testing"
	"time"

	authAdapters "github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/adapters"
	authDomain "github.com/DanielIturra1610/stegmaier-landing/internal/core/auth/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/adapters"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/ports"
	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/hasher"
	"github.com/DanielIturra1610/stegmaier-landing/tests/helpers"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestProfileRepository_CreateProfile(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	testDB := helpers.CreateTestControlDB(t)
	repo := adapters.NewPostgreSQLProfileRepository(testDB.DB)

	userID := uuid.New()
	tenantID := uuid.New()

	// Create user first (for foreign key)
	setupUser(t, testDB.DB, userID, tenantID, "test@example.com")

	// Create profile
	profile := domain.NewUserProfile(userID, tenantID, "John", "Doe")
	bio := "Software developer"
	profile.Bio = &bio

	err := repo.CreateProfile(context.Background(), profile)
	require.NoError(t, err)

	// Verify profile was created
	retrieved, err := repo.GetProfile(context.Background(), userID, tenantID)
	require.NoError(t, err)
	assert.Equal(t, userID, retrieved.UserID)
	assert.Equal(t, tenantID, retrieved.TenantID)
	assert.Equal(t, "John", retrieved.FirstName)
	assert.Equal(t, "Doe", retrieved.LastName)
	assert.NotNil(t, retrieved.Bio)
	assert.Equal(t, bio, *retrieved.Bio)
}

func TestProfileRepository_GetProfile(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	testDB := helpers.CreateTestControlDB(t)
	repo := adapters.NewPostgreSQLProfileRepository(testDB.DB)
	userID := uuid.New()
	tenantID := uuid.New()

	// Create user and profile
	setupUserAndProfile(t, testDB.DB, userID, tenantID, "test@example.com")

	// Get profile
	profile, err := repo.GetProfile(context.Background(), userID, tenantID)
	require.NoError(t, err)
	assert.NotNil(t, profile)
	assert.Equal(t, userID, profile.UserID)
	assert.Equal(t, tenantID, profile.TenantID)
}

func TestProfileRepository_GetProfile_NotFound(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	testDB := helpers.CreateTestControlDB(t)
	repo := adapters.NewPostgreSQLProfileRepository(testDB.DB)
	userID := uuid.New()
	tenantID := uuid.New()

	// Try to get non-existent profile
	profile, err := repo.GetProfile(context.Background(), userID, tenantID)
	assert.Error(t, err)
	assert.Nil(t, profile)
	assert.ErrorIs(t, err, ports.ErrProfileNotFound)
}

func TestProfileRepository_UpdateProfile(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	testDB := helpers.CreateTestControlDB(t)
	repo := adapters.NewPostgreSQLProfileRepository(testDB.DB)
	userID := uuid.New()
	tenantID := uuid.New()

	// Create user and profile
	setupUserAndProfile(t, testDB.DB, userID, tenantID, "test@example.com")

	// Get profile
	profile, err := repo.GetProfile(context.Background(), userID, tenantID)
	require.NoError(t, err)

	// Update profile
	profile.FirstName = "Jane"
	newBio := "Updated bio"
	profile.Bio = &newBio
	profile.Theme = domain.ThemeDark

	err = repo.UpdateProfile(context.Background(), profile)
	require.NoError(t, err)

	// Verify update
	updated, err := repo.GetProfile(context.Background(), userID, tenantID)
	require.NoError(t, err)
	assert.Equal(t, "Jane", updated.FirstName)
	assert.NotNil(t, updated.Bio)
	assert.Equal(t, newBio, *updated.Bio)
	assert.Equal(t, domain.ThemeDark, updated.Theme)
}

func TestProfileRepository_UpdateAvatar(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	testDB := helpers.CreateTestControlDB(t)
	repo := adapters.NewPostgreSQLProfileRepository(testDB.DB)
	userID := uuid.New()
	tenantID := uuid.New()

	// Create user and profile
	setupUserAndProfile(t, testDB.DB, userID, tenantID, "test@example.com")

	// Update avatar
	avatarURL := "https://example.com/avatar.jpg"
	err := repo.UpdateAvatar(context.Background(), userID, tenantID, avatarURL)
	require.NoError(t, err)

	// Verify update
	profile, err := repo.GetProfile(context.Background(), userID, tenantID)
	require.NoError(t, err)
	assert.NotNil(t, profile.AvatarURL)
	assert.Equal(t, avatarURL, *profile.AvatarURL)
}

func TestProfileRepository_DeleteAvatar(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	testDB := helpers.CreateTestControlDB(t)
	repo := adapters.NewPostgreSQLProfileRepository(testDB.DB)
	userID := uuid.New()
	tenantID := uuid.New()

	// Create user and profile with avatar
	setupUserAndProfile(t, testDB.DB, userID, tenantID, "test@example.com")
	avatarURL := "https://example.com/avatar.jpg"
	err := repo.UpdateAvatar(context.Background(), userID, tenantID, avatarURL)
	require.NoError(t, err)

	// Delete avatar
	err = repo.DeleteAvatar(context.Background(), userID, tenantID)
	require.NoError(t, err)

	// Verify deletion
	profile, err := repo.GetProfile(context.Background(), userID, tenantID)
	require.NoError(t, err)
	assert.Nil(t, profile.AvatarURL)
}

func TestProfileRepository_GetPreferences(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	testDB := helpers.CreateTestControlDB(t)
	repo := adapters.NewPostgreSQLProfileRepository(testDB.DB)
	userID := uuid.New()
	tenantID := uuid.New()

	// Create user and profile
	setupUserAndProfile(t, testDB.DB, userID, tenantID, "test@example.com")

	// Get preferences
	prefs, err := repo.GetPreferences(context.Background(), userID, tenantID)
	require.NoError(t, err)
	assert.NotNil(t, prefs)
	assert.True(t, prefs.EmailNotifications)
	assert.True(t, prefs.PushNotifications)
}

func TestProfileRepository_UpdatePreferences(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	testDB := helpers.CreateTestControlDB(t)
	repo := adapters.NewPostgreSQLProfileRepository(testDB.DB)
	userID := uuid.New()
	tenantID := uuid.New()

	// Create user and profile
	setupUserAndProfile(t, testDB.DB, userID, tenantID, "test@example.com")

	// Update preferences
	newPrefs := &domain.ProfilePreferences{
		EmailNotifications:   false,
		PushNotifications:    false,
		CourseReminders:      true,
		WeeklyDigest:         true,
		MarketingEmails:      false,
		PrivateProfile:       true,
		ShowProgressPublicly: false,
	}

	err := repo.UpdatePreferences(context.Background(), userID, tenantID, newPrefs)
	require.NoError(t, err)

	// Verify update
	updated, err := repo.GetPreferences(context.Background(), userID, tenantID)
	require.NoError(t, err)
	assert.False(t, updated.EmailNotifications)
	assert.False(t, updated.PushNotifications)
	assert.True(t, updated.WeeklyDigest)
	assert.True(t, updated.PrivateProfile)
	assert.False(t, updated.ShowProgressPublicly)
}

func TestProfileRepository_ProfileExists(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	testDB := helpers.CreateTestControlDB(t)
	repo := adapters.NewPostgreSQLProfileRepository(testDB.DB)
	userID := uuid.New()
	tenantID := uuid.New()

	// Check non-existent profile
	exists, err := repo.ProfileExists(context.Background(), userID, tenantID)
	require.NoError(t, err)
	assert.False(t, exists)

	// Create user and profile
	setupUserAndProfile(t, testDB.DB, userID, tenantID, "test@example.com")

	// Check existing profile
	exists, err = repo.ProfileExists(context.Background(), userID, tenantID)
	require.NoError(t, err)
	assert.True(t, exists)
}

func TestProfileRepository_DeleteProfile(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	testDB := helpers.CreateTestControlDB(t)
	repo := adapters.NewPostgreSQLProfileRepository(testDB.DB)
	userID := uuid.New()
	tenantID := uuid.New()

	// Create user and profile
	setupUserAndProfile(t, testDB.DB, userID, tenantID, "test@example.com")

	// Verify profile exists
	exists, err := repo.ProfileExists(context.Background(), userID, tenantID)
	require.NoError(t, err)
	assert.True(t, exists)

	// Delete profile
	err = repo.DeleteProfile(context.Background(), userID, tenantID)
	require.NoError(t, err)

	// Verify deletion
	exists, err = repo.ProfileExists(context.Background(), userID, tenantID)
	require.NoError(t, err)
	assert.False(t, exists)
}

func TestProfileRepository_TenantIsolation(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	testDB := helpers.CreateTestControlDB(t)
	repo := adapters.NewPostgreSQLProfileRepository(testDB.DB)
	userID1 := uuid.New()
	userID2 := uuid.New()
	tenant1 := uuid.New()
	tenant2 := uuid.New()

	// Create users and profiles for different tenants
	setupUserAndProfile(t, testDB.DB, userID1, tenant1, "user1@example.com")
	setupUserAndProfile(t, testDB.DB, userID2, tenant2, "user2@example.com")

	// Try to get tenant1 profile with tenant2 ID (should fail)
	profile, err := repo.GetProfile(context.Background(), userID1, tenant2)
	assert.Error(t, err)
	assert.Nil(t, profile)
	assert.ErrorIs(t, err, ports.ErrProfileNotFound)

	// Get tenant1 profile with correct tenant ID (should succeed)
	profile, err = repo.GetProfile(context.Background(), userID1, tenant1)
	require.NoError(t, err)
	assert.NotNil(t, profile)
	assert.Equal(t, tenant1, profile.TenantID)
}

// Helper function to setup just a user
func setupUser(t *testing.T, db *sqlx.DB, userID, tenantID uuid.UUID, email string) {
	t.Helper()
	authRepo := authAdapters.NewPostgreSQLAuthRepository(db)
	passwordHasher := hasher.NewPasswordHasher()
	hashedPassword, err := passwordHasher.HashPassword("password123")
	require.NoError(t, err)

	user := &authDomain.User{
		ID:          userID.String(),
		TenantID:    tenantID.String(),
		Email:       email,
		PasswordHash: hashedPassword,
		Role:        authDomain.RoleStudent,
		IsVerified:  true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	err = authRepo.CreateUser(context.Background(), user)
	require.NoError(t, err)
}

// Helper function to setup user and profile
func setupUserAndProfile(t *testing.T, db *sqlx.DB, userID, tenantID uuid.UUID, email string) {
	t.Helper()

	// Create user first
	setupUser(t, db, userID, tenantID, email)

	// Profile is auto-created by trigger, but we can verify it exists
	repo := adapters.NewPostgreSQLProfileRepository(db)
	time.Sleep(100 * time.Millisecond) // Give trigger time to execute

	exists, err := repo.ProfileExists(context.Background(), userID, tenantID)
	require.NoError(t, err)

	// If profile wasn't auto-created by trigger, create it manually
	if !exists {
		profile := domain.NewUserProfile(userID, tenantID, "John", "Doe")
		err = repo.CreateProfile(context.Background(), profile)
		require.NoError(t, err)
	}
}
