package adapters

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/notifications/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/notifications/ports"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

// PostgreSQLNotificationRepository implementa ports.NotificationRepository
type PostgreSQLNotificationRepository struct {
	db *sqlx.DB
}

// NewPostgreSQLNotificationRepository crea una nueva instancia del repositorio
func NewPostgreSQLNotificationRepository(db *sqlx.DB) ports.NotificationRepository {
	return &PostgreSQLNotificationRepository{db: db}
}

// Create crea una nueva notificación
func (r *PostgreSQLNotificationRepository) Create(ctx context.Context, notification *domain.Notification) error {
	metadataJSON, err := json.Marshal(notification.Metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	query := `
		INSERT INTO notifications (
			id, tenant_id, user_id, type, title, message, status, priority,
			metadata, action_url, action_label, expires_at, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
	`

	_, err = r.db.ExecContext(ctx, query,
		notification.ID,
		notification.TenantID,
		notification.UserID,
		notification.Type,
		notification.Title,
		notification.Message,
		notification.Status,
		notification.Priority,
		metadataJSON,
		notification.ActionURL,
		notification.ActionLabel,
		notification.ExpiresAt,
		notification.CreatedAt,
		notification.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create notification: %w", err)
	}

	return nil
}

// GetByID obtiene una notificación por ID
func (r *PostgreSQLNotificationRepository) GetByID(ctx context.Context, id, tenantID uuid.UUID) (*domain.Notification, error) {
	query := `
		SELECT id, tenant_id, user_id, type, title, message, status, priority,
		       metadata, action_url, action_label, read_at, archived_at, expires_at,
		       created_at, updated_at
		FROM notifications
		WHERE id = $1 AND tenant_id = $2
	`

	var notification domain.Notification
	var metadataJSON []byte

	err := r.db.QueryRowContext(ctx, query, id, tenantID).Scan(
		&notification.ID,
		&notification.TenantID,
		&notification.UserID,
		&notification.Type,
		&notification.Title,
		&notification.Message,
		&notification.Status,
		&notification.Priority,
		&metadataJSON,
		&notification.ActionURL,
		&notification.ActionLabel,
		&notification.ReadAt,
		&notification.ArchivedAt,
		&notification.ExpiresAt,
		&notification.CreatedAt,
		&notification.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, domain.ErrNotificationNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get notification: %w", err)
	}

	if len(metadataJSON) > 0 {
		if err := json.Unmarshal(metadataJSON, &notification.Metadata); err != nil {
			log.Printf("WARN: Failed to unmarshal metadata: %v", err)
			notification.Metadata = make(map[string]any)
		}
	}

	return &notification, nil
}

// GetByUserID obtiene notificaciones de un usuario con filtros
func (r *PostgreSQLNotificationRepository) GetByUserID(ctx context.Context, userID, tenantID uuid.UUID, filters *domain.NotificationFilters) ([]*domain.Notification, int64, error) {
	// Build WHERE clause
	where := "WHERE user_id = $1 AND tenant_id = $2"
	args := []interface{}{userID, tenantID}
	argCount := 2

	if filters.Type != nil {
		argCount++
		where += fmt.Sprintf(" AND type = $%d", argCount)
		args = append(args, *filters.Type)
	}

	if filters.Status != nil {
		argCount++
		where += fmt.Sprintf(" AND status = $%d", argCount)
		args = append(args, *filters.Status)
	}

	if filters.Priority != nil {
		argCount++
		where += fmt.Sprintf(" AND priority = $%d", argCount)
		args = append(args, *filters.Priority)
	}

	if filters.FromDate != nil {
		argCount++
		where += fmt.Sprintf(" AND created_at >= $%d", argCount)
		args = append(args, *filters.FromDate)
	}

	if filters.ToDate != nil {
		argCount++
		where += fmt.Sprintf(" AND created_at <= $%d", argCount)
		args = append(args, *filters.ToDate)
	}

	// Get total count
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM notifications %s", where)
	var total int64
	if err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count notifications: %w", err)
	}

	// Get paginated results
	offset := (filters.Page - 1) * filters.PageSize
	query := fmt.Sprintf(`
		SELECT id, tenant_id, user_id, type, title, message, status, priority,
		       metadata, action_url, action_label, read_at, archived_at, expires_at,
		       created_at, updated_at
		FROM notifications
		%s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, where, argCount+1, argCount+2)

	args = append(args, filters.PageSize, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query notifications: %w", err)
	}
	defer rows.Close()

	notifications := []*domain.Notification{}
	for rows.Next() {
		var notification domain.Notification
		var metadataJSON []byte

		err := rows.Scan(
			&notification.ID,
			&notification.TenantID,
			&notification.UserID,
			&notification.Type,
			&notification.Title,
			&notification.Message,
			&notification.Status,
			&notification.Priority,
			&metadataJSON,
			&notification.ActionURL,
			&notification.ActionLabel,
			&notification.ReadAt,
			&notification.ArchivedAt,
			&notification.ExpiresAt,
			&notification.CreatedAt,
			&notification.UpdatedAt,
		)

		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan notification: %w", err)
		}

		if len(metadataJSON) > 0 {
			if err := json.Unmarshal(metadataJSON, &notification.Metadata); err != nil {
				log.Printf("WARN: Failed to unmarshal metadata: %v", err)
				notification.Metadata = make(map[string]any)
			}
		}

		notifications = append(notifications, &notification)
	}

	return notifications, total, nil
}

// Update actualiza una notificación
func (r *PostgreSQLNotificationRepository) Update(ctx context.Context, notification *domain.Notification) error {
	metadataJSON, err := json.Marshal(notification.Metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	query := `
		UPDATE notifications
		SET status = $1, priority = $2, metadata = $3, read_at = $4,
		    archived_at = $5, updated_at = $6
		WHERE id = $7 AND tenant_id = $8
	`

	result, err := r.db.ExecContext(ctx, query,
		notification.Status,
		notification.Priority,
		metadataJSON,
		notification.ReadAt,
		notification.ArchivedAt,
		notification.UpdatedAt,
		notification.ID,
		notification.TenantID,
	)

	if err != nil {
		return fmt.Errorf("failed to update notification: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return domain.ErrNotificationNotFound
	}

	return nil
}

// Delete elimina una notificación
func (r *PostgreSQLNotificationRepository) Delete(ctx context.Context, id, tenantID uuid.UUID) error {
	query := "DELETE FROM notifications WHERE id = $1 AND tenant_id = $2"

	result, err := r.db.ExecContext(ctx, query, id, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete notification: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return domain.ErrNotificationNotFound
	}

	return nil
}

// CreateBulk crea múltiples notificaciones
func (r *PostgreSQLNotificationRepository) CreateBulk(ctx context.Context, notifications []*domain.Notification) error {
	if len(notifications) == 0 {
		return nil
	}

	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	query := `
		INSERT INTO notifications (
			id, tenant_id, user_id, type, title, message, status, priority,
			metadata, action_url, action_label, expires_at, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
	`

	stmt, err := tx.PrepareContext(ctx, query)
	if err != nil {
		return fmt.Errorf("failed to prepare statement: %w", err)
	}
	defer stmt.Close()

	for _, notification := range notifications {
		metadataJSON, err := json.Marshal(notification.Metadata)
		if err != nil {
			return fmt.Errorf("failed to marshal metadata: %w", err)
		}

		_, err = stmt.ExecContext(ctx,
			notification.ID,
			notification.TenantID,
			notification.UserID,
			notification.Type,
			notification.Title,
			notification.Message,
			notification.Status,
			notification.Priority,
			metadataJSON,
			notification.ActionURL,
			notification.ActionLabel,
			notification.ExpiresAt,
			notification.CreatedAt,
			notification.UpdatedAt,
		)

		if err != nil {
			return fmt.Errorf("failed to insert notification: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// MarkAllAsRead marca todas las notificaciones como leídas
func (r *PostgreSQLNotificationRepository) MarkAllAsRead(ctx context.Context, userID, tenantID uuid.UUID) error {
	now := time.Now()
	query := `
		UPDATE notifications
		SET status = $1, read_at = $2, updated_at = $3
		WHERE user_id = $4 AND tenant_id = $5 AND status = $6
	`

	_, err := r.db.ExecContext(ctx, query,
		domain.NotificationStatusRead,
		now,
		now,
		userID,
		tenantID,
		domain.NotificationStatusUnread,
	)

	if err != nil {
		return fmt.Errorf("failed to mark all as read: %w", err)
	}

	return nil
}

// DeleteAllRead elimina todas las notificaciones leídas
func (r *PostgreSQLNotificationRepository) DeleteAllRead(ctx context.Context, userID, tenantID uuid.UUID) error {
	query := "DELETE FROM notifications WHERE user_id = $1 AND tenant_id = $2 AND status = $3"

	_, err := r.db.ExecContext(ctx, query, userID, tenantID, domain.NotificationStatusRead)
	if err != nil {
		return fmt.Errorf("failed to delete all read: %w", err)
	}

	return nil
}

// CountUnread cuenta las notificaciones no leídas
func (r *PostgreSQLNotificationRepository) CountUnread(ctx context.Context, userID, tenantID uuid.UUID) (int64, error) {
	query := "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND tenant_id = $2 AND status = $3"

	var count int64
	err := r.db.QueryRowContext(ctx, query, userID, tenantID, domain.NotificationStatusUnread).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count unread: %w", err)
	}

	return count, nil
}

// GetExpired obtiene notificaciones expiradas
func (r *PostgreSQLNotificationRepository) GetExpired(ctx context.Context, tenantID uuid.UUID) ([]*domain.Notification, error) {
	query := `
		SELECT id, tenant_id, user_id, type, title, message, status, priority,
		       metadata, action_url, action_label, read_at, archived_at, expires_at,
		       created_at, updated_at
		FROM notifications
		WHERE tenant_id = $1 AND expires_at IS NOT NULL AND expires_at < $2
	`

	rows, err := r.db.QueryContext(ctx, query, tenantID, time.Now())
	if err != nil {
		return nil, fmt.Errorf("failed to get expired notifications: %w", err)
	}
	defer rows.Close()

	notifications := []*domain.Notification{}
	for rows.Next() {
		var notification domain.Notification
		var metadataJSON []byte

		err := rows.Scan(
			&notification.ID,
			&notification.TenantID,
			&notification.UserID,
			&notification.Type,
			&notification.Title,
			&notification.Message,
			&notification.Status,
			&notification.Priority,
			&metadataJSON,
			&notification.ActionURL,
			&notification.ActionLabel,
			&notification.ReadAt,
			&notification.ArchivedAt,
			&notification.ExpiresAt,
			&notification.CreatedAt,
			&notification.UpdatedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan notification: %w", err)
		}

		if len(metadataJSON) > 0 {
			if err := json.Unmarshal(metadataJSON, &notification.Metadata); err != nil {
				log.Printf("WARN: Failed to unmarshal metadata: %v", err)
				notification.Metadata = make(map[string]any)
			}
		}

		notifications = append(notifications, &notification)
	}

	return notifications, nil
}

// DeleteExpired elimina notificaciones expiradas
func (r *PostgreSQLNotificationRepository) DeleteExpired(ctx context.Context, tenantID uuid.UUID) error {
	query := "DELETE FROM notifications WHERE tenant_id = $1 AND expires_at IS NOT NULL AND expires_at < $2"

	_, err := r.db.ExecContext(ctx, query, tenantID, time.Now())
	if err != nil {
		return fmt.Errorf("failed to delete expired notifications: %w", err)
	}

	return nil
}

// GetPreferences obtiene las preferencias de un usuario
func (r *PostgreSQLNotificationRepository) GetPreferences(ctx context.Context, userID, tenantID uuid.UUID) (*domain.NotificationPreferences, error) {
	query := `
		SELECT id, tenant_id, user_id, email_enabled, push_enabled,
		       course_completion_enabled, progress_enabled, enrollment_enabled,
		       quiz_completion_enabled, announcement_enabled, system_update_enabled,
		       reminder_enabled, achievement_enabled, assignment_enabled, certificate_enabled,
		       digest_frequency, quiet_hours_start, quiet_hours_end,
		       created_at, updated_at
		FROM notification_preferences
		WHERE user_id = $1 AND tenant_id = $2
	`

	var prefs domain.NotificationPreferences
	err := r.db.QueryRowContext(ctx, query, userID, tenantID).Scan(
		&prefs.ID,
		&prefs.TenantID,
		&prefs.UserID,
		&prefs.EmailEnabled,
		&prefs.PushEnabled,
		&prefs.CourseCompletionEnabled,
		&prefs.ProgressEnabled,
		&prefs.EnrollmentEnabled,
		&prefs.QuizCompletionEnabled,
		&prefs.AnnouncementEnabled,
		&prefs.SystemUpdateEnabled,
		&prefs.ReminderEnabled,
		&prefs.AchievementEnabled,
		&prefs.AssignmentEnabled,
		&prefs.CertificateEnabled,
		&prefs.DigestFrequency,
		&prefs.QuietHoursStart,
		&prefs.QuietHoursEnd,
		&prefs.CreatedAt,
		&prefs.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, domain.ErrPreferencesNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get preferences: %w", err)
	}

	return &prefs, nil
}

// CreatePreferences crea las preferencias de un usuario
func (r *PostgreSQLNotificationRepository) CreatePreferences(ctx context.Context, prefs *domain.NotificationPreferences) error {
	query := `
		INSERT INTO notification_preferences (
			id, tenant_id, user_id, email_enabled, push_enabled,
			course_completion_enabled, progress_enabled, enrollment_enabled,
			quiz_completion_enabled, announcement_enabled, system_update_enabled,
			reminder_enabled, achievement_enabled, assignment_enabled, certificate_enabled,
			digest_frequency, quiet_hours_start, quiet_hours_end,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
	`

	_, err := r.db.ExecContext(ctx, query,
		prefs.ID,
		prefs.TenantID,
		prefs.UserID,
		prefs.EmailEnabled,
		prefs.PushEnabled,
		prefs.CourseCompletionEnabled,
		prefs.ProgressEnabled,
		prefs.EnrollmentEnabled,
		prefs.QuizCompletionEnabled,
		prefs.AnnouncementEnabled,
		prefs.SystemUpdateEnabled,
		prefs.ReminderEnabled,
		prefs.AchievementEnabled,
		prefs.AssignmentEnabled,
		prefs.CertificateEnabled,
		prefs.DigestFrequency,
		prefs.QuietHoursStart,
		prefs.QuietHoursEnd,
		prefs.CreatedAt,
		prefs.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create preferences: %w", err)
	}

	return nil
}

// UpdatePreferences actualiza las preferencias de un usuario
func (r *PostgreSQLNotificationRepository) UpdatePreferences(ctx context.Context, prefs *domain.NotificationPreferences) error {
	query := `
		UPDATE notification_preferences
		SET email_enabled = $1, push_enabled = $2,
		    course_completion_enabled = $3, progress_enabled = $4, enrollment_enabled = $5,
		    quiz_completion_enabled = $6, announcement_enabled = $7, system_update_enabled = $8,
		    reminder_enabled = $9, achievement_enabled = $10, assignment_enabled = $11,
		    certificate_enabled = $12, digest_frequency = $13,
		    quiet_hours_start = $14, quiet_hours_end = $15, updated_at = $16
		WHERE user_id = $17 AND tenant_id = $18
	`

	result, err := r.db.ExecContext(ctx, query,
		prefs.EmailEnabled,
		prefs.PushEnabled,
		prefs.CourseCompletionEnabled,
		prefs.ProgressEnabled,
		prefs.EnrollmentEnabled,
		prefs.QuizCompletionEnabled,
		prefs.AnnouncementEnabled,
		prefs.SystemUpdateEnabled,
		prefs.ReminderEnabled,
		prefs.AchievementEnabled,
		prefs.AssignmentEnabled,
		prefs.CertificateEnabled,
		prefs.DigestFrequency,
		prefs.QuietHoursStart,
		prefs.QuietHoursEnd,
		prefs.UpdatedAt,
		prefs.UserID,
		prefs.TenantID,
	)

	if err != nil {
		return fmt.Errorf("failed to update preferences: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return domain.ErrPreferencesNotFound
	}

	return nil
}

// CreateSubscription crea una suscripción push
func (r *PostgreSQLNotificationRepository) CreateSubscription(ctx context.Context, sub *domain.PushSubscription) error {
	query := `
		INSERT INTO push_subscriptions (
			id, tenant_id, user_id, endpoint, p256dh, auth,
			user_agent, device_type, is_active, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`

	_, err := r.db.ExecContext(ctx, query,
		sub.ID,
		sub.TenantID,
		sub.UserID,
		sub.Endpoint,
		sub.P256DH,
		sub.Auth,
		sub.UserAgent,
		sub.DeviceType,
		sub.IsActive,
		sub.CreatedAt,
		sub.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create subscription: %w", err)
	}

	return nil
}

// GetSubscription obtiene una suscripción por ID
func (r *PostgreSQLNotificationRepository) GetSubscription(ctx context.Context, id, tenantID uuid.UUID) (*domain.PushSubscription, error) {
	query := `
		SELECT id, tenant_id, user_id, endpoint, p256dh, auth,
		       user_agent, device_type, is_active, last_used_at, created_at, updated_at
		FROM push_subscriptions
		WHERE id = $1 AND tenant_id = $2
	`

	var sub domain.PushSubscription
	err := r.db.QueryRowContext(ctx, query, id, tenantID).Scan(
		&sub.ID,
		&sub.TenantID,
		&sub.UserID,
		&sub.Endpoint,
		&sub.P256DH,
		&sub.Auth,
		&sub.UserAgent,
		&sub.DeviceType,
		&sub.IsActive,
		&sub.LastUsedAt,
		&sub.CreatedAt,
		&sub.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, domain.ErrSubscriptionNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get subscription: %w", err)
	}

	return &sub, nil
}

// GetSubscriptionsByUser obtiene las suscripciones de un usuario
func (r *PostgreSQLNotificationRepository) GetSubscriptionsByUser(ctx context.Context, userID, tenantID uuid.UUID) ([]*domain.PushSubscription, error) {
	query := `
		SELECT id, tenant_id, user_id, endpoint, p256dh, auth,
		       user_agent, device_type, is_active, last_used_at, created_at, updated_at
		FROM push_subscriptions
		WHERE user_id = $1 AND tenant_id = $2 AND is_active = true
		ORDER BY created_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query, userID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to query subscriptions: %w", err)
	}
	defer rows.Close()

	subscriptions := []*domain.PushSubscription{}
	for rows.Next() {
		var sub domain.PushSubscription
		err := rows.Scan(
			&sub.ID,
			&sub.TenantID,
			&sub.UserID,
			&sub.Endpoint,
			&sub.P256DH,
			&sub.Auth,
			&sub.UserAgent,
			&sub.DeviceType,
			&sub.IsActive,
			&sub.LastUsedAt,
			&sub.CreatedAt,
			&sub.UpdatedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan subscription: %w", err)
		}

		subscriptions = append(subscriptions, &sub)
	}

	return subscriptions, nil
}

// GetSubscriptionByEndpoint obtiene una suscripción por endpoint
func (r *PostgreSQLNotificationRepository) GetSubscriptionByEndpoint(ctx context.Context, endpoint string, tenantID uuid.UUID) (*domain.PushSubscription, error) {
	query := `
		SELECT id, tenant_id, user_id, endpoint, p256dh, auth,
		       user_agent, device_type, is_active, last_used_at, created_at, updated_at
		FROM push_subscriptions
		WHERE endpoint = $1 AND tenant_id = $2
	`

	var sub domain.PushSubscription
	err := r.db.QueryRowContext(ctx, query, endpoint, tenantID).Scan(
		&sub.ID,
		&sub.TenantID,
		&sub.UserID,
		&sub.Endpoint,
		&sub.P256DH,
		&sub.Auth,
		&sub.UserAgent,
		&sub.DeviceType,
		&sub.IsActive,
		&sub.LastUsedAt,
		&sub.CreatedAt,
		&sub.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, domain.ErrSubscriptionNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get subscription: %w", err)
	}

	return &sub, nil
}

// UpdateSubscription actualiza una suscripción
func (r *PostgreSQLNotificationRepository) UpdateSubscription(ctx context.Context, sub *domain.PushSubscription) error {
	query := `
		UPDATE push_subscriptions
		SET p256dh = $1, auth = $2, user_agent = $3, device_type = $4,
		    is_active = $5, last_used_at = $6, updated_at = $7
		WHERE id = $8 AND tenant_id = $9
	`

	result, err := r.db.ExecContext(ctx, query,
		sub.P256DH,
		sub.Auth,
		sub.UserAgent,
		sub.DeviceType,
		sub.IsActive,
		sub.LastUsedAt,
		sub.UpdatedAt,
		sub.ID,
		sub.TenantID,
	)

	if err != nil {
		return fmt.Errorf("failed to update subscription: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return domain.ErrSubscriptionNotFound
	}

	return nil
}

// DeleteSubscription elimina una suscripción
func (r *PostgreSQLNotificationRepository) DeleteSubscription(ctx context.Context, id, tenantID uuid.UUID) error {
	query := "DELETE FROM push_subscriptions WHERE id = $1 AND tenant_id = $2"

	result, err := r.db.ExecContext(ctx, query, id, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete subscription: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return domain.ErrSubscriptionNotFound
	}

	return nil
}

// DeactivateSubscription desactiva una suscripción por endpoint
func (r *PostgreSQLNotificationRepository) DeactivateSubscription(ctx context.Context, endpoint string, tenantID uuid.UUID) error {
	query := `
		UPDATE push_subscriptions
		SET is_active = false, updated_at = $1
		WHERE endpoint = $2 AND tenant_id = $3
	`

	_, err := r.db.ExecContext(ctx, query, time.Now(), endpoint, tenantID)
	if err != nil {
		return fmt.Errorf("failed to deactivate subscription: %w", err)
	}

	return nil
}
