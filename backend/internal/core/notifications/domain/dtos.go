package domain

import (
	"time"

	"github.com/google/uuid"
)

// CreateNotificationRequest representa la solicitud para crear una notificación
type CreateNotificationRequest struct {
	UserID      uuid.UUID            `json:"userId" validate:"required"`
	Type        NotificationType     `json:"type" validate:"required,oneof=course_completion progress enrollment quiz_completion announcement system_update reminder achievement assignment certificate"`
	Title       string               `json:"title" validate:"required,min=3,max=200"`
	Message     string               `json:"message" validate:"required,min=10,max=1000"`
	Priority    NotificationPriority `json:"priority" validate:"omitempty,oneof=low normal high urgent"`
	Metadata    map[string]any       `json:"metadata,omitempty"`
	ActionURL   *string              `json:"actionUrl,omitempty" validate:"omitempty,url"`
	ActionLabel *string              `json:"actionLabel,omitempty" validate:"omitempty,min=3,max=50"`
	ExpiresAt   *time.Time           `json:"expiresAt,omitempty"`
}

// BulkCreateNotificationRequest representa la solicitud para crear múltiples notificaciones
type BulkCreateNotificationRequest struct {
	UserIDs     []uuid.UUID          `json:"userIds" validate:"required,min=1,dive,required"`
	Type        NotificationType     `json:"type" validate:"required"`
	Title       string               `json:"title" validate:"required,min=3,max=200"`
	Message     string               `json:"message" validate:"required,min=10,max=1000"`
	Priority    NotificationPriority `json:"priority" validate:"omitempty,oneof=low normal high urgent"`
	Metadata    map[string]any       `json:"metadata,omitempty"`
	ActionURL   *string              `json:"actionUrl,omitempty" validate:"omitempty,url"`
	ActionLabel *string              `json:"actionLabel,omitempty" validate:"omitempty,min=3,max=50"`
	ExpiresAt   *time.Time           `json:"expiresAt,omitempty"`
}

// UpdateNotificationRequest representa la solicitud para actualizar una notificación
type UpdateNotificationRequest struct {
	Status NotificationStatus `json:"status" validate:"required,oneof=unread read archived"`
}

// NotificationFilters representa los filtros para buscar notificaciones
type NotificationFilters struct {
	UserID   *uuid.UUID          `json:"userId,omitempty"`
	Type     *NotificationType   `json:"type,omitempty"`
	Status   *NotificationStatus `json:"status,omitempty"`
	Priority *NotificationPriority `json:"priority,omitempty"`
	FromDate *time.Time          `json:"fromDate,omitempty"`
	ToDate   *time.Time          `json:"toDate,omitempty"`
	Page     int                 `json:"page" validate:"min=1"`
	PageSize int                 `json:"pageSize" validate:"min=1,max=100"`
}

// NotificationResponse representa la respuesta de una notificación
type NotificationResponse struct {
	ID          uuid.UUID            `json:"id"`
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
}

// NotificationListResponse representa una lista paginada de notificaciones
type NotificationListResponse struct {
	Notifications []NotificationResponse `json:"notifications"`
	Total         int64                  `json:"total"`
	Page          int                    `json:"page"`
	PageSize      int                    `json:"pageSize"`
	TotalPages    int                    `json:"totalPages"`
}

// UnreadCountResponse representa el conteo de notificaciones no leídas
type UnreadCountResponse struct {
	Count int64 `json:"count"`
}

// UpdatePreferencesRequest representa la solicitud para actualizar preferencias
type UpdatePreferencesRequest struct {
	EmailEnabled               *bool   `json:"emailEnabled,omitempty"`
	PushEnabled                *bool   `json:"pushEnabled,omitempty"`
	CourseCompletionEnabled    *bool   `json:"courseCompletionEnabled,omitempty"`
	ProgressEnabled            *bool   `json:"progressEnabled,omitempty"`
	EnrollmentEnabled          *bool   `json:"enrollmentEnabled,omitempty"`
	QuizCompletionEnabled      *bool   `json:"quizCompletionEnabled,omitempty"`
	AnnouncementEnabled        *bool   `json:"announcementEnabled,omitempty"`
	SystemUpdateEnabled        *bool   `json:"systemUpdateEnabled,omitempty"`
	ReminderEnabled            *bool   `json:"reminderEnabled,omitempty"`
	AchievementEnabled         *bool   `json:"achievementEnabled,omitempty"`
	AssignmentEnabled          *bool   `json:"assignmentEnabled,omitempty"`
	CertificateEnabled         *bool   `json:"certificateEnabled,omitempty"`
	DigestFrequency            *string `json:"digestFrequency,omitempty" validate:"omitempty,oneof=immediate hourly daily weekly"`
	QuietHoursStart            *string `json:"quietHoursStart,omitempty" validate:"omitempty,len=5"` // HH:MM format
	QuietHoursEnd              *string `json:"quietHoursEnd,omitempty" validate:"omitempty,len=5"`
}

// PreferencesResponse representa las preferencias de notificación
type PreferencesResponse struct {
	EmailEnabled               bool    `json:"emailEnabled"`
	PushEnabled                bool    `json:"pushEnabled"`
	CourseCompletionEnabled    bool    `json:"courseCompletionEnabled"`
	ProgressEnabled            bool    `json:"progressEnabled"`
	EnrollmentEnabled          bool    `json:"enrollmentEnabled"`
	QuizCompletionEnabled      bool    `json:"quizCompletionEnabled"`
	AnnouncementEnabled        bool    `json:"announcementEnabled"`
	SystemUpdateEnabled        bool    `json:"systemUpdateEnabled"`
	ReminderEnabled            bool    `json:"reminderEnabled"`
	AchievementEnabled         bool    `json:"achievementEnabled"`
	AssignmentEnabled          bool    `json:"assignmentEnabled"`
	CertificateEnabled         bool    `json:"certificateEnabled"`
	DigestFrequency            string  `json:"digestFrequency"`
	QuietHoursStart            *string `json:"quietHoursStart,omitempty"`
	QuietHoursEnd              *string `json:"quietHoursEnd,omitempty"`
}

// CreatePushSubscriptionRequest representa la solicitud para crear una suscripción push
type CreatePushSubscriptionRequest struct {
	Endpoint   string  `json:"endpoint" validate:"required,url"`
	P256DH     string  `json:"p256dh" validate:"required"`
	Auth       string  `json:"auth" validate:"required"`
	UserAgent  *string `json:"userAgent,omitempty"`
	DeviceType *string `json:"deviceType,omitempty"`
}

// PushSubscriptionResponse representa la respuesta de una suscripción push
type PushSubscriptionResponse struct {
	ID         uuid.UUID  `json:"id"`
	Endpoint   string     `json:"endpoint"`
	DeviceType *string    `json:"deviceType,omitempty"`
	IsActive   bool       `json:"isActive"`
	LastUsedAt *time.Time `json:"lastUsedAt,omitempty"`
	CreatedAt  time.Time  `json:"createdAt"`
}

// SendCourseCompletionNotificationRequest representa la solicitud específica para completar curso
type SendCourseCompletionNotificationRequest struct {
	UserID     uuid.UUID `json:"userId" validate:"required"`
	CourseID   uuid.UUID `json:"courseId" validate:"required"`
	CourseTitle string   `json:"courseTitle" validate:"required"`
}

// SendProgressNotificationRequest representa la solicitud para notificación de progreso
type SendProgressNotificationRequest struct {
	UserID       uuid.UUID `json:"userId" validate:"required"`
	CourseID     uuid.UUID `json:"courseId" validate:"required"`
	CourseTitle  string    `json:"courseTitle" validate:"required"`
	Progress     int       `json:"progress" validate:"required,min=0,max=100"`
}

// SendEnrollmentNotificationRequest representa la solicitud para notificación de inscripción
type SendEnrollmentNotificationRequest struct {
	UserID       uuid.UUID `json:"userId" validate:"required"`
	CourseID     uuid.UUID `json:"courseId" validate:"required"`
	CourseTitle  string    `json:"courseTitle" validate:"required"`
}

// SendQuizCompletionNotificationRequest representa la solicitud para notificación de quiz
type SendQuizCompletionNotificationRequest struct {
	UserID     uuid.UUID `json:"userId" validate:"required"`
	QuizID     uuid.UUID `json:"quizId" validate:"required"`
	QuizTitle  string    `json:"quizTitle" validate:"required"`
	Score      int       `json:"score" validate:"min=0,max=100"`
	Passed     bool      `json:"passed"`
}

// SendAnnouncementRequest representa la solicitud para enviar un anuncio
type SendAnnouncementRequest struct {
	Title       string         `json:"title" validate:"required,min=3,max=200"`
	Message     string         `json:"message" validate:"required,min=10,max=1000"`
	TargetUsers []uuid.UUID    `json:"targetUsers,omitempty"` // Si está vacío, se envía a todos
	CourseID    *uuid.UUID     `json:"courseId,omitempty"`
	Priority    NotificationPriority `json:"priority" validate:"omitempty,oneof=low normal high urgent"`
	ExpiresAt   *time.Time     `json:"expiresAt,omitempty"`
}

// Validate valida el CreateNotificationRequest
func (r *CreateNotificationRequest) Validate() error {
	if r.Title == "" || len(r.Title) < 3 || len(r.Title) > 200 {
		return ErrInvalidTitle
	}
	if r.Message == "" || len(r.Message) < 10 || len(r.Message) > 1000 {
		return ErrInvalidMessage
	}
	return nil
}

// Validate valida el BulkCreateNotificationRequest
func (r *BulkCreateNotificationRequest) Validate() error {
	if len(r.UserIDs) == 0 {
		return ErrNoRecipients
	}
	if r.Title == "" || len(r.Title) < 3 || len(r.Title) > 200 {
		return ErrInvalidTitle
	}
	if r.Message == "" || len(r.Message) < 10 || len(r.Message) > 1000 {
		return ErrInvalidMessage
	}
	return nil
}

// Validate valida el UpdateNotificationRequest
func (r *UpdateNotificationRequest) Validate() error {
	if r.Status != NotificationStatusUnread &&
	   r.Status != NotificationStatusRead &&
	   r.Status != NotificationStatusArchived {
		return ErrInvalidStatus
	}
	return nil
}
