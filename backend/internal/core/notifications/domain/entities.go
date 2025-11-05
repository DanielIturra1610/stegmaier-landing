package domain

import (
	"time"

	"github.com/google/uuid"
)

// NotificationType representa los diferentes tipos de notificaciones
type NotificationType string

const (
	NotificationTypeCourseCompletion NotificationType = "course_completion"
	NotificationTypeProgress         NotificationType = "progress"
	NotificationTypeEnrollment       NotificationType = "enrollment"
	NotificationTypeQuizCompletion   NotificationType = "quiz_completion"
	NotificationTypeAnnouncement     NotificationType = "announcement"
	NotificationTypeSystemUpdate     NotificationType = "system_update"
	NotificationTypeReminder         NotificationType = "reminder"
	NotificationTypeAchievement      NotificationType = "achievement"
	NotificationTypeAssignment       NotificationType = "assignment"
	NotificationTypeCertificate      NotificationType = "certificate"
)

// NotificationStatus representa el estado de una notificación
type NotificationStatus string

const (
	NotificationStatusUnread   NotificationStatus = "unread"
	NotificationStatusRead     NotificationStatus = "read"
	NotificationStatusArchived NotificationStatus = "archived"
)

// NotificationPriority representa la prioridad de una notificación
type NotificationPriority string

const (
	NotificationPriorityLow    NotificationPriority = "low"
	NotificationPriorityNormal NotificationPriority = "normal"
	NotificationPriorityHigh   NotificationPriority = "high"
	NotificationPriorityUrgent NotificationPriority = "urgent"
)

// Notification representa una notificación en el sistema
type Notification struct {
	ID          uuid.UUID            `json:"id"`
	TenantID    uuid.UUID            `json:"tenantId"`
	UserID      uuid.UUID            `json:"userId"`
	Type        NotificationType     `json:"type"`
	Title       string               `json:"title"`
	Message     string               `json:"message"`
	Status      NotificationStatus   `json:"status"`
	Priority    NotificationPriority `json:"priority"`
	Metadata    map[string]any       `json:"metadata,omitempty"`
	ActionURL   *string              `json:"actionUrl,omitempty"`
	ActionLabel *string              `json:"actionLabel,omitempty"`
	ReadAt      *time.Time           `json:"readAt,omitempty"`
	ArchivedAt  *time.Time           `json:"archivedAt,omitempty"`
	ExpiresAt   *time.Time           `json:"expiresAt,omitempty"`
	CreatedAt   time.Time            `json:"createdAt"`
	UpdatedAt   time.Time            `json:"updatedAt"`
}

// NotificationPreferences representa las preferencias de notificación de un usuario
type NotificationPreferences struct {
	ID                         uuid.UUID `json:"id"`
	TenantID                   uuid.UUID `json:"tenantId"`
	UserID                     uuid.UUID `json:"userId"`
	EmailEnabled               bool      `json:"emailEnabled"`
	PushEnabled                bool      `json:"pushEnabled"`
	CourseCompletionEnabled    bool      `json:"courseCompletionEnabled"`
	ProgressEnabled            bool      `json:"progressEnabled"`
	EnrollmentEnabled          bool      `json:"enrollmentEnabled"`
	QuizCompletionEnabled      bool      `json:"quizCompletionEnabled"`
	AnnouncementEnabled        bool      `json:"announcementEnabled"`
	SystemUpdateEnabled        bool      `json:"systemUpdateEnabled"`
	ReminderEnabled            bool      `json:"reminderEnabled"`
	AchievementEnabled         bool      `json:"achievementEnabled"`
	AssignmentEnabled          bool      `json:"assignmentEnabled"`
	CertificateEnabled         bool      `json:"certificateEnabled"`
	DigestFrequency            string    `json:"digestFrequency"` // immediate, hourly, daily, weekly
	QuietHoursStart            *string   `json:"quietHoursStart,omitempty"`
	QuietHoursEnd              *string   `json:"quietHoursEnd,omitempty"`
	CreatedAt                  time.Time `json:"createdAt"`
	UpdatedAt                  time.Time `json:"updatedAt"`
}

// PushSubscription representa una suscripción de push notification
type PushSubscription struct {
	ID         uuid.UUID `json:"id"`
	TenantID   uuid.UUID `json:"tenantId"`
	UserID     uuid.UUID `json:"userId"`
	Endpoint   string    `json:"endpoint"`
	P256DH     string    `json:"p256dh"`
	Auth       string    `json:"auth"`
	UserAgent  *string   `json:"userAgent,omitempty"`
	DeviceType *string   `json:"deviceType,omitempty"`
	IsActive   bool      `json:"isActive"`
	LastUsedAt *time.Time `json:"lastUsedAt,omitempty"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

// IsRead verifica si la notificación está leída
func (n *Notification) IsRead() bool {
	return n.Status == NotificationStatusRead
}

// IsArchived verifica si la notificación está archivada
func (n *Notification) IsArchived() bool {
	return n.Status == NotificationStatusArchived
}

// IsExpired verifica si la notificación está expirada
func (n *Notification) IsExpired() bool {
	if n.ExpiresAt == nil {
		return false
	}
	return time.Now().After(*n.ExpiresAt)
}

// MarkAsRead marca la notificación como leída
func (n *Notification) MarkAsRead() {
	now := time.Now()
	n.Status = NotificationStatusRead
	n.ReadAt = &now
	n.UpdatedAt = now
}

// MarkAsUnread marca la notificación como no leída
func (n *Notification) MarkAsUnread() {
	n.Status = NotificationStatusUnread
	n.ReadAt = nil
	n.UpdatedAt = time.Now()
}

// Archive archiva la notificación
func (n *Notification) Archive() {
	now := time.Now()
	n.Status = NotificationStatusArchived
	n.ArchivedAt = &now
	n.UpdatedAt = now
}
