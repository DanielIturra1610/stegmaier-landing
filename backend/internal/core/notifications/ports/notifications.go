package ports

import (
	"context"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/notifications/domain"
	"github.com/google/uuid"
)

// NotificationRepository define las operaciones de persistencia para notificaciones
type NotificationRepository interface {
	// Notification CRUD
	Create(ctx context.Context, notification *domain.Notification) error
	GetByID(ctx context.Context, id, tenantID uuid.UUID) (*domain.Notification, error)
	GetByUserID(ctx context.Context, userID, tenantID uuid.UUID, filters *domain.NotificationFilters) ([]*domain.Notification, int64, error)
	Update(ctx context.Context, notification *domain.Notification) error
	Delete(ctx context.Context, id, tenantID uuid.UUID) error

	// Bulk operations
	CreateBulk(ctx context.Context, notifications []*domain.Notification) error
	MarkAllAsRead(ctx context.Context, userID, tenantID uuid.UUID) error
	DeleteAllRead(ctx context.Context, userID, tenantID uuid.UUID) error

	// Queries
	CountUnread(ctx context.Context, userID, tenantID uuid.UUID) (int64, error)
	GetExpired(ctx context.Context, tenantID uuid.UUID) ([]*domain.Notification, error)
	DeleteExpired(ctx context.Context, tenantID uuid.UUID) error

	// Preferences
	GetPreferences(ctx context.Context, userID, tenantID uuid.UUID) (*domain.NotificationPreferences, error)
	CreatePreferences(ctx context.Context, prefs *domain.NotificationPreferences) error
	UpdatePreferences(ctx context.Context, prefs *domain.NotificationPreferences) error

	// Push Subscriptions
	CreateSubscription(ctx context.Context, sub *domain.PushSubscription) error
	GetSubscription(ctx context.Context, id, tenantID uuid.UUID) (*domain.PushSubscription, error)
	GetSubscriptionsByUser(ctx context.Context, userID, tenantID uuid.UUID) ([]*domain.PushSubscription, error)
	GetSubscriptionByEndpoint(ctx context.Context, endpoint string, tenantID uuid.UUID) (*domain.PushSubscription, error)
	UpdateSubscription(ctx context.Context, sub *domain.PushSubscription) error
	DeleteSubscription(ctx context.Context, id, tenantID uuid.UUID) error
	DeactivateSubscription(ctx context.Context, endpoint string, tenantID uuid.UUID) error
}

// NotificationService define la lógica de negocio para notificaciones
type NotificationService interface {
	// Notification CRUD
	CreateNotification(ctx context.Context, tenantID uuid.UUID, req *domain.CreateNotificationRequest) (*domain.NotificationResponse, error)
	CreateBulkNotifications(ctx context.Context, tenantID uuid.UUID, req *domain.BulkCreateNotificationRequest) ([]domain.NotificationResponse, error)
	GetNotification(ctx context.Context, id, tenantID, userID uuid.UUID) (*domain.NotificationResponse, error)
	GetUserNotifications(ctx context.Context, userID, tenantID uuid.UUID, filters *domain.NotificationFilters) (*domain.NotificationListResponse, error)
	UpdateNotificationStatus(ctx context.Context, id, tenantID, userID uuid.UUID, status domain.NotificationStatus) error
	DeleteNotification(ctx context.Context, id, tenantID, userID uuid.UUID) error

	// Bulk operations
	MarkAllAsRead(ctx context.Context, userID, tenantID uuid.UUID) error
	DeleteAllRead(ctx context.Context, userID, tenantID uuid.UUID) error

	// Queries
	GetUnreadCount(ctx context.Context, userID, tenantID uuid.UUID) (int64, error)

	// Specific notification types
	SendCourseCompletionNotification(ctx context.Context, tenantID uuid.UUID, req *domain.SendCourseCompletionNotificationRequest) error
	SendProgressNotification(ctx context.Context, tenantID uuid.UUID, req *domain.SendProgressNotificationRequest) error
	SendEnrollmentNotification(ctx context.Context, tenantID uuid.UUID, req *domain.SendEnrollmentNotificationRequest) error
	SendQuizCompletionNotification(ctx context.Context, tenantID uuid.UUID, req *domain.SendQuizCompletionNotificationRequest) error
	SendAnnouncement(ctx context.Context, tenantID uuid.UUID, req *domain.SendAnnouncementRequest) error

	// Preferences
	GetUserPreferences(ctx context.Context, userID, tenantID uuid.UUID) (*domain.PreferencesResponse, error)
	UpdateUserPreferences(ctx context.Context, userID, tenantID uuid.UUID, req *domain.UpdatePreferencesRequest) (*domain.PreferencesResponse, error)

	// Push Subscriptions
	CreatePushSubscription(ctx context.Context, userID, tenantID uuid.UUID, req *domain.CreatePushSubscriptionRequest) (*domain.PushSubscriptionResponse, error)
	GetUserPushSubscriptions(ctx context.Context, userID, tenantID uuid.UUID) ([]domain.PushSubscriptionResponse, error)
	DeletePushSubscription(ctx context.Context, id, userID, tenantID uuid.UUID) error

	// Background jobs
	CleanupExpiredNotifications(ctx context.Context, tenantID uuid.UUID) error
}

// EmailService define el servicio de envío de emails
type EmailService interface {
	SendNotificationEmail(ctx context.Context, to, subject, body string) error
	SendCourseCompletionEmail(ctx context.Context, to, userName, courseTitle string) error
	SendProgressEmail(ctx context.Context, to, userName, courseTitle string, progress int) error
	SendEnrollmentEmail(ctx context.Context, to, userName, courseTitle string) error
}

// PushNotificationService define el servicio de push notifications
type PushNotificationService interface {
	SendPushNotification(ctx context.Context, subscription *domain.PushSubscription, title, body string, data map[string]any) error
	SendBulkPushNotification(ctx context.Context, subscriptions []*domain.PushSubscription, title, body string, data map[string]any) error
}
