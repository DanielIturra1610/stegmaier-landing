package adapters

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/profile/ports"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

// PostgreSQLProfileRepository implements the ProfileRepository interface using PostgreSQL
type PostgreSQLProfileRepository struct {
	controlDB *sqlx.DB
}

// NewPostgreSQLProfileRepository creates a new PostgreSQL profile repository
func NewPostgreSQLProfileRepository(controlDB *sqlx.DB) ports.ProfileRepository {
	return &PostgreSQLProfileRepository{
		controlDB: controlDB,
	}
}

// profileRow represents a profile row from the database
type profileRow struct {
	UserID      uuid.UUID  `db:"user_id"`
	TenantID    uuid.UUID  `db:"tenant_id"`
	FirstName   string     `db:"first_name"`
	LastName    string     `db:"last_name"`
	AvatarURL   *string    `db:"avatar_url"`
	Bio         *string    `db:"bio"`
	PhoneNumber *string    `db:"phone_number"`
	DateOfBirth *time.Time `db:"date_of_birth"`
	Country     *string    `db:"country"`
	City        *string    `db:"city"`
	Timezone    string     `db:"timezone"`
	Language    string     `db:"language"`
	Theme       string     `db:"theme"`
	CreatedAt   time.Time  `db:"created_at"`
	UpdatedAt   time.Time  `db:"updated_at"`
}

// preferencesRow represents a preferences row from the database
type preferencesRow struct {
	UserID               uuid.UUID `db:"user_id"`
	TenantID             uuid.UUID `db:"tenant_id"`
	EmailNotifications   bool      `db:"email_notifications"`
	PushNotifications    bool      `db:"push_notifications"`
	CourseReminders      bool      `db:"course_reminders"`
	WeeklyDigest         bool      `db:"weekly_digest"`
	MarketingEmails      bool      `db:"marketing_emails"`
	PrivateProfile       bool      `db:"private_profile"`
	ShowProgressPublicly bool      `db:"show_progress_publicly"`
	CreatedAt            time.Time `db:"created_at"`
	UpdatedAt            time.Time `db:"updated_at"`
}

// GetProfile retrieves a user's profile by user ID and tenant ID
func (r *PostgreSQLProfileRepository) GetProfile(ctx context.Context, userID, tenantID uuid.UUID) (*domain.UserProfile, error) {
	query := `
		SELECT
			user_id, tenant_id, first_name, last_name, avatar_url, bio,
			phone_number, date_of_birth, country, city, timezone, language,
			theme, created_at, updated_at
		FROM profiles
		WHERE user_id = $1 AND tenant_id = $2
	`

	var row profileRow
	err := r.controlDB.GetContext(ctx, &row, query, userID, tenantID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ports.ErrProfileNotFound
		}
		return nil, fmt.Errorf("failed to get profile: %w", err)
	}

	// Get preferences
	prefs, err := r.GetPreferences(ctx, userID, tenantID)
	if err != nil && !errors.Is(err, ports.ErrPreferencesNotFound) {
		return nil, fmt.Errorf("failed to get preferences: %w", err)
	}

	// If preferences not found, use defaults
	if prefs == nil {
		prefs = &domain.ProfilePreferences{
			EmailNotifications:   true,
			PushNotifications:    true,
			CourseReminders:      true,
			WeeklyDigest:         false,
			MarketingEmails:      false,
			PrivateProfile:       false,
			ShowProgressPublicly: true,
		}
	}

	profile := &domain.UserProfile{
		UserID:      row.UserID,
		TenantID:    row.TenantID,
		FirstName:   row.FirstName,
		LastName:    row.LastName,
		AvatarURL:   row.AvatarURL,
		Bio:         row.Bio,
		PhoneNumber: row.PhoneNumber,
		DateOfBirth: row.DateOfBirth,
		Country:     row.Country,
		City:        row.City,
		Timezone:    row.Timezone,
		Language:    row.Language,
		Theme:       row.Theme,
		Preferences: *prefs,
		CreatedAt:   row.CreatedAt,
		UpdatedAt:   row.UpdatedAt,
	}

	return profile, nil
}

// CreateProfile creates a new user profile
func (r *PostgreSQLProfileRepository) CreateProfile(ctx context.Context, profile *domain.UserProfile) error {
	if err := profile.Validate(); err != nil {
		return fmt.Errorf("invalid profile data: %w", err)
	}

	// Start transaction
	tx, err := r.controlDB.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Insert profile
	profileQuery := `
		INSERT INTO profiles (
			user_id, tenant_id, first_name, last_name, avatar_url, bio,
			phone_number, date_of_birth, country, city, timezone, language,
			theme, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
		)
	`

	_, err = tx.ExecContext(ctx, profileQuery,
		profile.UserID, profile.TenantID, profile.FirstName, profile.LastName,
		profile.AvatarURL, profile.Bio, profile.PhoneNumber, profile.DateOfBirth,
		profile.Country, profile.City, profile.Timezone, profile.Language,
		profile.Theme, profile.CreatedAt, profile.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to insert profile: %w", err)
	}

	// Insert preferences
	prefsQuery := `
		INSERT INTO profile_preferences (
			user_id, tenant_id, email_notifications, push_notifications,
			course_reminders, weekly_digest, marketing_emails,
			private_profile, show_progress_publicly, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
		)
	`

	_, err = tx.ExecContext(ctx, prefsQuery,
		profile.UserID, profile.TenantID,
		profile.Preferences.EmailNotifications,
		profile.Preferences.PushNotifications,
		profile.Preferences.CourseReminders,
		profile.Preferences.WeeklyDigest,
		profile.Preferences.MarketingEmails,
		profile.Preferences.PrivateProfile,
		profile.Preferences.ShowProgressPublicly,
		time.Now(), time.Now(),
	)
	if err != nil {
		return fmt.Errorf("failed to insert preferences: %w", err)
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// UpdateProfile updates an existing user profile
func (r *PostgreSQLProfileRepository) UpdateProfile(ctx context.Context, profile *domain.UserProfile) error {
	if err := profile.Validate(); err != nil {
		return fmt.Errorf("invalid profile data: %w", err)
	}

	query := `
		UPDATE profiles
		SET
			first_name = $1,
			last_name = $2,
			bio = $3,
			phone_number = $4,
			date_of_birth = $5,
			country = $6,
			city = $7,
			timezone = $8,
			language = $9,
			theme = $10,
			updated_at = $11
		WHERE user_id = $12 AND tenant_id = $13
	`

	result, err := r.controlDB.ExecContext(ctx, query,
		profile.FirstName, profile.LastName, profile.Bio, profile.PhoneNumber,
		profile.DateOfBirth, profile.Country, profile.City, profile.Timezone,
		profile.Language, profile.Theme, time.Now(), profile.UserID, profile.TenantID,
	)
	if err != nil {
		return fmt.Errorf("failed to update profile: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ports.ErrProfileNotFound
	}

	return nil
}

// UpdateAvatar updates the user's avatar URL
func (r *PostgreSQLProfileRepository) UpdateAvatar(ctx context.Context, userID, tenantID uuid.UUID, avatarURL string) error {
	query := `
		UPDATE profiles
		SET avatar_url = $1, updated_at = $2
		WHERE user_id = $3 AND tenant_id = $4
	`

	result, err := r.controlDB.ExecContext(ctx, query, avatarURL, time.Now(), userID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to update avatar: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ports.ErrProfileNotFound
	}

	return nil
}

// DeleteAvatar removes the user's avatar URL
func (r *PostgreSQLProfileRepository) DeleteAvatar(ctx context.Context, userID, tenantID uuid.UUID) error {
	query := `
		UPDATE profiles
		SET avatar_url = NULL, updated_at = $1
		WHERE user_id = $2 AND tenant_id = $3
	`

	result, err := r.controlDB.ExecContext(ctx, query, time.Now(), userID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete avatar: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ports.ErrProfileNotFound
	}

	return nil
}

// GetPreferences retrieves user preferences
func (r *PostgreSQLProfileRepository) GetPreferences(ctx context.Context, userID, tenantID uuid.UUID) (*domain.ProfilePreferences, error) {
	query := `
		SELECT
			email_notifications, push_notifications, course_reminders,
			weekly_digest, marketing_emails, private_profile, show_progress_publicly
		FROM profile_preferences
		WHERE user_id = $1 AND tenant_id = $2
	`

	var row preferencesRow
	err := r.controlDB.GetContext(ctx, &row, query, userID, tenantID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ports.ErrPreferencesNotFound
		}
		return nil, fmt.Errorf("failed to get preferences: %w", err)
	}

	prefs := &domain.ProfilePreferences{
		EmailNotifications:   row.EmailNotifications,
		PushNotifications:    row.PushNotifications,
		CourseReminders:      row.CourseReminders,
		WeeklyDigest:         row.WeeklyDigest,
		MarketingEmails:      row.MarketingEmails,
		PrivateProfile:       row.PrivateProfile,
		ShowProgressPublicly: row.ShowProgressPublicly,
	}

	return prefs, nil
}

// UpdatePreferences updates user preferences
func (r *PostgreSQLProfileRepository) UpdatePreferences(ctx context.Context, userID, tenantID uuid.UUID, prefs *domain.ProfilePreferences) error {
	query := `
		UPDATE profile_preferences
		SET
			email_notifications = $1,
			push_notifications = $2,
			course_reminders = $3,
			weekly_digest = $4,
			marketing_emails = $5,
			private_profile = $6,
			show_progress_publicly = $7,
			updated_at = $8
		WHERE user_id = $9 AND tenant_id = $10
	`

	result, err := r.controlDB.ExecContext(ctx, query,
		prefs.EmailNotifications, prefs.PushNotifications, prefs.CourseReminders,
		prefs.WeeklyDigest, prefs.MarketingEmails, prefs.PrivateProfile,
		prefs.ShowProgressPublicly, time.Now(), userID, tenantID,
	)
	if err != nil {
		return fmt.Errorf("failed to update preferences: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ports.ErrPreferencesNotFound
	}

	return nil
}

// ProfileExists checks if a profile exists for a user
func (r *PostgreSQLProfileRepository) ProfileExists(ctx context.Context, userID, tenantID uuid.UUID) (bool, error) {
	query := `
		SELECT EXISTS(
			SELECT 1 FROM profiles
			WHERE user_id = $1 AND tenant_id = $2
		)
	`

	var exists bool
	err := r.controlDB.GetContext(ctx, &exists, query, userID, tenantID)
	if err != nil {
		return false, fmt.Errorf("failed to check profile existence: %w", err)
	}

	return exists, nil
}

// DeleteProfile deletes a user's profile (for account deletion)
func (r *PostgreSQLProfileRepository) DeleteProfile(ctx context.Context, userID, tenantID uuid.UUID) error {
	// Start transaction
	tx, err := r.controlDB.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Delete preferences first (foreign key constraint)
	prefsQuery := `DELETE FROM profile_preferences WHERE user_id = $1 AND tenant_id = $2`
	_, err = tx.ExecContext(ctx, prefsQuery, userID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete preferences: %w", err)
	}

	// Delete profile
	profileQuery := `DELETE FROM profiles WHERE user_id = $1 AND tenant_id = $2`
	result, err := tx.ExecContext(ctx, profileQuery, userID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete profile: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return ports.ErrProfileNotFound
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// Helper function to convert preferences to JSON (for potential future use)
func preferencesToJSON(prefs *domain.ProfilePreferences) ([]byte, error) {
	return json.Marshal(prefs)
}

// Helper function to convert JSON to preferences (for potential future use)
func jsonToPreferences(data []byte) (*domain.ProfilePreferences, error) {
	var prefs domain.ProfilePreferences
	if err := json.Unmarshal(data, &prefs); err != nil {
		return nil, err
	}
	return &prefs, nil
}
