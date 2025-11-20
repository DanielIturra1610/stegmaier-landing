package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/notifications/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/notifications/ports"
	"github.com/google/uuid"
)

// NotificationService implementa ports.NotificationService
type NotificationService struct {
	repo         ports.NotificationRepository
	emailService ports.EmailService
}

// NewNotificationService crea una nueva instancia del servicio
func NewNotificationService(repo ports.NotificationRepository, emailService ports.EmailService) ports.NotificationService {
	return &NotificationService{
		repo:         repo,
		emailService: emailService,
	}
}

// CreateNotification crea una nueva notificación
func (s *NotificationService) CreateNotification(ctx context.Context, tenantID uuid.UUID, req *domain.CreateNotificationRequest) (*domain.NotificationResponse, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	// Check user preferences
	prefs, err := s.repo.GetPreferences(ctx, req.UserID, tenantID)
	if err != nil {
		log.Printf("WARN: Could not get user preferences: %v", err)
		// Continue even if preferences not found, create default notification
	}

	// Check if user has this notification type enabled
	if prefs != nil && !s.isNotificationTypeEnabled(prefs, req.Type) {
		log.Printf("INFO: Notification type %s disabled for user %s", req.Type, req.UserID)
		// Don't return error, just skip notification
		return nil, nil
	}

	notification := &domain.Notification{
		ID:          uuid.New(),
		TenantID:    tenantID,
		UserID:      req.UserID,
		Type:        req.Type,
		Title:       req.Title,
		Message:     req.Message,
		Status:      domain.NotificationStatusUnread,
		Priority:    req.Priority,
		Metadata:    req.Metadata,
		ActionURL:   req.ActionURL,
		ActionLabel: req.ActionLabel,
		ExpiresAt:   req.ExpiresAt,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Default priority if not set
	if notification.Priority == "" {
		notification.Priority = domain.NotificationPriorityNormal
	}

	if err := s.repo.Create(ctx, notification); err != nil {
		log.Printf("ERROR: Failed to create notification: %v", err)
		return nil, err
	}

	log.Printf("INFO: Created notification %s for user %s", notification.ID, notification.UserID)

	return s.toResponse(notification), nil
}

// CreateBulkNotifications crea múltiples notificaciones
func (s *NotificationService) CreateBulkNotifications(ctx context.Context, tenantID uuid.UUID, req *domain.BulkCreateNotificationRequest) ([]domain.NotificationResponse, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	notifications := make([]*domain.Notification, 0, len(req.UserIDs))
	now := time.Now()

	for _, userID := range req.UserIDs {
		// Check user preferences
		prefs, err := s.repo.GetPreferences(ctx, userID, tenantID)
		if err != nil {
			log.Printf("WARN: Could not get user preferences for %s: %v", userID, err)
		}

		// Skip if notification type is disabled
		if prefs != nil && !s.isNotificationTypeEnabled(prefs, req.Type) {
			log.Printf("INFO: Notification type %s disabled for user %s", req.Type, userID)
			continue
		}

		notification := &domain.Notification{
			ID:          uuid.New(),
			TenantID:    tenantID,
			UserID:      userID,
			Type:        req.Type,
			Title:       req.Title,
			Message:     req.Message,
			Status:      domain.NotificationStatusUnread,
			Priority:    req.Priority,
			Metadata:    req.Metadata,
			ActionURL:   req.ActionURL,
			ActionLabel: req.ActionLabel,
			ExpiresAt:   req.ExpiresAt,
			CreatedAt:   now,
			UpdatedAt:   now,
		}

		if notification.Priority == "" {
			notification.Priority = domain.NotificationPriorityNormal
		}

		notifications = append(notifications, notification)
	}

	if len(notifications) == 0 {
		log.Printf("INFO: No notifications to create after filtering by preferences")
		return []domain.NotificationResponse{}, nil
	}

	if err := s.repo.CreateBulk(ctx, notifications); err != nil {
		log.Printf("ERROR: Failed to create bulk notifications: %v", err)
		return nil, err
	}

	log.Printf("INFO: Created %d bulk notifications", len(notifications))

	responses := make([]domain.NotificationResponse, len(notifications))
	for i, n := range notifications {
		responses[i] = *s.toResponse(n)
	}

	return responses, nil
}

// GetNotification obtiene una notificación por ID
func (s *NotificationService) GetNotification(ctx context.Context, id, tenantID, userID uuid.UUID) (*domain.NotificationResponse, error) {
	notification, err := s.repo.GetByID(ctx, id, tenantID)
	if err != nil {
		return nil, domain.ErrNotificationNotFound
	}

	// Verify ownership
	if notification.UserID != userID {
		return nil, domain.ErrUnauthorizedAccess
	}

	return s.toResponse(notification), nil
}

// GetUserNotifications obtiene las notificaciones de un usuario con filtros
func (s *NotificationService) GetUserNotifications(ctx context.Context, userID, tenantID uuid.UUID, filters *domain.NotificationFilters) (*domain.NotificationListResponse, error) {
	if filters == nil {
		filters = &domain.NotificationFilters{
			Page:     1,
			PageSize: 20,
		}
	}

	if filters.Page < 1 {
		filters.Page = 1
	}
	if filters.PageSize < 1 || filters.PageSize > 100 {
		filters.PageSize = 20
	}

	// Set userID in filters
	filters.UserID = &userID

	notifications, total, err := s.repo.GetByUserID(ctx, userID, tenantID, filters)
	if err != nil {
		log.Printf("ERROR: Failed to get user notifications: %v", err)
		return nil, err
	}

	responses := make([]domain.NotificationResponse, len(notifications))
	for i, n := range notifications {
		responses[i] = *s.toResponse(n)
	}

	totalPages := int(total) / filters.PageSize
	if int(total)%filters.PageSize > 0 {
		totalPages++
	}

	return &domain.NotificationListResponse{
		Notifications: responses,
		Total:         total,
		Page:          filters.Page,
		PageSize:      filters.PageSize,
		TotalPages:    totalPages,
	}, nil
}

// UpdateNotificationStatus actualiza el estado de una notificación
func (s *NotificationService) UpdateNotificationStatus(ctx context.Context, id, tenantID, userID uuid.UUID, status domain.NotificationStatus) error {
	notification, err := s.repo.GetByID(ctx, id, tenantID)
	if err != nil {
		return domain.ErrNotificationNotFound
	}

	// Verify ownership
	if notification.UserID != userID {
		return domain.ErrUnauthorizedAccess
	}

	// Update status
	switch status {
	case domain.NotificationStatusRead:
		notification.MarkAsRead()
	case domain.NotificationStatusUnread:
		notification.MarkAsUnread()
	case domain.NotificationStatusArchived:
		notification.Archive()
	default:
		return domain.ErrInvalidStatus
	}

	if err := s.repo.Update(ctx, notification); err != nil {
		log.Printf("ERROR: Failed to update notification status: %v", err)
		return err
	}

	log.Printf("INFO: Updated notification %s status to %s", id, status)
	return nil
}

// DeleteNotification elimina una notificación
func (s *NotificationService) DeleteNotification(ctx context.Context, id, tenantID, userID uuid.UUID) error {
	notification, err := s.repo.GetByID(ctx, id, tenantID)
	if err != nil {
		return domain.ErrNotificationNotFound
	}

	// Verify ownership
	if notification.UserID != userID {
		return domain.ErrUnauthorizedAccess
	}

	if err := s.repo.Delete(ctx, id, tenantID); err != nil {
		log.Printf("ERROR: Failed to delete notification: %v", err)
		return err
	}

	log.Printf("INFO: Deleted notification %s", id)
	return nil
}

// MarkAllAsRead marca todas las notificaciones como leídas
func (s *NotificationService) MarkAllAsRead(ctx context.Context, userID, tenantID uuid.UUID) error {
	if err := s.repo.MarkAllAsRead(ctx, userID, tenantID); err != nil {
		log.Printf("ERROR: Failed to mark all as read: %v", err)
		return err
	}

	log.Printf("INFO: Marked all notifications as read for user %s", userID)
	return nil
}

// DeleteAllRead elimina todas las notificaciones leídas
func (s *NotificationService) DeleteAllRead(ctx context.Context, userID, tenantID uuid.UUID) error {
	if err := s.repo.DeleteAllRead(ctx, userID, tenantID); err != nil {
		log.Printf("ERROR: Failed to delete all read: %v", err)
		return err
	}

	log.Printf("INFO: Deleted all read notifications for user %s", userID)
	return nil
}

// GetUnreadCount obtiene el conteo de notificaciones no leídas
func (s *NotificationService) GetUnreadCount(ctx context.Context, userID, tenantID uuid.UUID) (int64, error) {
	count, err := s.repo.CountUnread(ctx, userID, tenantID)
	if err != nil {
		log.Printf("ERROR: Failed to get unread count: %v", err)
		return 0, err
	}

	return count, nil
}

// SendCourseCompletionNotification envía notificación de completado de curso
func (s *NotificationService) SendCourseCompletionNotification(ctx context.Context, tenantID uuid.UUID, req *domain.SendCourseCompletionNotificationRequest) error {
	notification := &domain.CreateNotificationRequest{
		UserID:   req.UserID,
		Type:     domain.NotificationTypeCourseCompletion,
		Title:    "¡Curso completado!",
		Message:  fmt.Sprintf("Felicitaciones, has completado el curso '%s'", req.CourseTitle),
		Priority: domain.NotificationPriorityHigh,
		Metadata: map[string]any{
			"courseId":    req.CourseID,
			"courseTitle": req.CourseTitle,
		},
		ActionURL:   stringPtr(fmt.Sprintf("/platform/courses/%s/certificate", req.CourseID)),
		ActionLabel: stringPtr("Ver certificado"),
	}

	_, err := s.CreateNotification(ctx, tenantID, notification)

	// Send email notification if email service is configured
	if s.emailService != nil && err == nil {
		// Note: Email details (user email, name, etc.) should be provided by the caller
		// or fetched from a user service. For now, we log that email would be sent.
		log.Printf("INFO: Course completion email should be sent for user %s, course %s", req.UserID, req.CourseTitle)
	}

	return err
}

// SendProgressNotification envía notificación de progreso
func (s *NotificationService) SendProgressNotification(ctx context.Context, tenantID uuid.UUID, req *domain.SendProgressNotificationRequest) error {
	notification := &domain.CreateNotificationRequest{
		UserID:   req.UserID,
		Type:     domain.NotificationTypeProgress,
		Title:    "Progreso del curso",
		Message:  fmt.Sprintf("Has avanzado un %d%% en el curso '%s'", req.Progress, req.CourseTitle),
		Priority: domain.NotificationPriorityNormal,
		Metadata: map[string]any{
			"courseId":    req.CourseID,
			"courseTitle": req.CourseTitle,
			"progress":    req.Progress,
		},
		ActionURL:   stringPtr(fmt.Sprintf("/platform/courses/%s", req.CourseID)),
		ActionLabel: stringPtr("Ver curso"),
	}

	_, err := s.CreateNotification(ctx, tenantID, notification)
	return err
}

// SendEnrollmentNotification envía notificación de inscripción
func (s *NotificationService) SendEnrollmentNotification(ctx context.Context, tenantID uuid.UUID, req *domain.SendEnrollmentNotificationRequest) error {
	notification := &domain.CreateNotificationRequest{
		UserID:   req.UserID,
		Type:     domain.NotificationTypeEnrollment,
		Title:    "¡Inscripción exitosa!",
		Message:  fmt.Sprintf("Te has inscrito exitosamente en el curso '%s'", req.CourseTitle),
		Priority: domain.NotificationPriorityNormal,
		Metadata: map[string]any{
			"courseId":    req.CourseID,
			"courseTitle": req.CourseTitle,
		},
		ActionURL:   stringPtr(fmt.Sprintf("/platform/courses/%s", req.CourseID)),
		ActionLabel: stringPtr("Comenzar curso"),
	}

	_, err := s.CreateNotification(ctx, tenantID, notification)
	return err
}

// SendQuizCompletionNotification envía notificación de completado de quiz
func (s *NotificationService) SendQuizCompletionNotification(ctx context.Context, tenantID uuid.UUID, req *domain.SendQuizCompletionNotificationRequest) error {
	var message string
	var priority domain.NotificationPriority

	if req.Passed {
		message = fmt.Sprintf("¡Felicitaciones! Has aprobado el quiz '%s' con un %d%%", req.QuizTitle, req.Score)
		priority = domain.NotificationPriorityHigh
	} else {
		message = fmt.Sprintf("Has completado el quiz '%s' con un %d%%. Puedes volver a intentarlo", req.QuizTitle, req.Score)
		priority = domain.NotificationPriorityNormal
	}

	notification := &domain.CreateNotificationRequest{
		UserID:   req.UserID,
		Type:     domain.NotificationTypeQuizCompletion,
		Title:    "Quiz completado",
		Message:  message,
		Priority: priority,
		Metadata: map[string]any{
			"quizId":    req.QuizID,
			"quizTitle": req.QuizTitle,
			"score":     req.Score,
			"passed":    req.Passed,
		},
		ActionURL:   stringPtr(fmt.Sprintf("/platform/quizzes/%s/results", req.QuizID)),
		ActionLabel: stringPtr("Ver resultados"),
	}

	_, err := s.CreateNotification(ctx, tenantID, notification)
	return err
}

// SendAnnouncement envía un anuncio a múltiples usuarios
func (s *NotificationService) SendAnnouncement(ctx context.Context, tenantID uuid.UUID, req *domain.SendAnnouncementRequest) error {
	// TODO: If targetUsers is empty, get all users from tenant
	// For now, require targetUsers
	if len(req.TargetUsers) == 0 {
		return domain.ErrNoRecipients
	}

	metadata := map[string]any{}
	if req.CourseID != nil {
		metadata["courseId"] = req.CourseID
	}

	bulkReq := &domain.BulkCreateNotificationRequest{
		UserIDs:  req.TargetUsers,
		Type:     domain.NotificationTypeAnnouncement,
		Title:    req.Title,
		Message:  req.Message,
		Priority: req.Priority,
		Metadata: metadata,
		ExpiresAt: req.ExpiresAt,
	}

	if bulkReq.Priority == "" {
		bulkReq.Priority = domain.NotificationPriorityNormal
	}

	_, err := s.CreateBulkNotifications(ctx, tenantID, bulkReq)
	return err
}

// GetUserPreferences obtiene las preferencias de un usuario
func (s *NotificationService) GetUserPreferences(ctx context.Context, userID, tenantID uuid.UUID) (*domain.PreferencesResponse, error) {
	prefs, err := s.repo.GetPreferences(ctx, userID, tenantID)
	if err != nil {
		// Create default preferences if not found
		prefs = s.createDefaultPreferences(userID, tenantID)
		if err := s.repo.CreatePreferences(ctx, prefs); err != nil {
			log.Printf("ERROR: Failed to create default preferences: %v", err)
			return nil, err
		}
	}

	return s.toPreferencesResponse(prefs), nil
}

// UpdateUserPreferences actualiza las preferencias de un usuario
func (s *NotificationService) UpdateUserPreferences(ctx context.Context, userID, tenantID uuid.UUID, req *domain.UpdatePreferencesRequest) (*domain.PreferencesResponse, error) {
	prefs, err := s.repo.GetPreferences(ctx, userID, tenantID)
	if err != nil {
		// Create if not exists
		prefs = s.createDefaultPreferences(userID, tenantID)
	}

	// Update fields if provided
	if req.EmailEnabled != nil {
		prefs.EmailEnabled = *req.EmailEnabled
	}
	if req.PushEnabled != nil {
		prefs.PushEnabled = *req.PushEnabled
	}
	if req.CourseCompletionEnabled != nil {
		prefs.CourseCompletionEnabled = *req.CourseCompletionEnabled
	}
	if req.ProgressEnabled != nil {
		prefs.ProgressEnabled = *req.ProgressEnabled
	}
	if req.EnrollmentEnabled != nil {
		prefs.EnrollmentEnabled = *req.EnrollmentEnabled
	}
	if req.QuizCompletionEnabled != nil {
		prefs.QuizCompletionEnabled = *req.QuizCompletionEnabled
	}
	if req.AnnouncementEnabled != nil {
		prefs.AnnouncementEnabled = *req.AnnouncementEnabled
	}
	if req.SystemUpdateEnabled != nil {
		prefs.SystemUpdateEnabled = *req.SystemUpdateEnabled
	}
	if req.ReminderEnabled != nil {
		prefs.ReminderEnabled = *req.ReminderEnabled
	}
	if req.AchievementEnabled != nil {
		prefs.AchievementEnabled = *req.AchievementEnabled
	}
	if req.AssignmentEnabled != nil {
		prefs.AssignmentEnabled = *req.AssignmentEnabled
	}
	if req.CertificateEnabled != nil {
		prefs.CertificateEnabled = *req.CertificateEnabled
	}
	if req.DigestFrequency != nil {
		prefs.DigestFrequency = *req.DigestFrequency
	}
	if req.QuietHoursStart != nil {
		prefs.QuietHoursStart = req.QuietHoursStart
	}
	if req.QuietHoursEnd != nil {
		prefs.QuietHoursEnd = req.QuietHoursEnd
	}

	prefs.UpdatedAt = time.Now()

	if err := s.repo.UpdatePreferences(ctx, prefs); err != nil {
		log.Printf("ERROR: Failed to update preferences: %v", err)
		return nil, err
	}

	log.Printf("INFO: Updated preferences for user %s", userID)
	return s.toPreferencesResponse(prefs), nil
}

// CreatePushSubscription crea una suscripción push
func (s *NotificationService) CreatePushSubscription(ctx context.Context, userID, tenantID uuid.UUID, req *domain.CreatePushSubscriptionRequest) (*domain.PushSubscriptionResponse, error) {
	// Check if subscription already exists for this endpoint
	existing, err := s.repo.GetSubscriptionByEndpoint(ctx, req.Endpoint, tenantID)
	if err == nil && existing != nil {
		// Update existing subscription
		existing.P256DH = req.P256DH
		existing.Auth = req.Auth
		existing.UserAgent = req.UserAgent
		existing.DeviceType = req.DeviceType
		existing.IsActive = true
		existing.UpdatedAt = time.Now()

		if err := s.repo.UpdateSubscription(ctx, existing); err != nil {
			return nil, err
		}

		return s.toSubscriptionResponse(existing), nil
	}

	subscription := &domain.PushSubscription{
		ID:         uuid.New(),
		TenantID:   tenantID,
		UserID:     userID,
		Endpoint:   req.Endpoint,
		P256DH:     req.P256DH,
		Auth:       req.Auth,
		UserAgent:  req.UserAgent,
		DeviceType: req.DeviceType,
		IsActive:   true,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	if err := s.repo.CreateSubscription(ctx, subscription); err != nil {
		log.Printf("ERROR: Failed to create push subscription: %v", err)
		return nil, err
	}

	log.Printf("INFO: Created push subscription %s for user %s", subscription.ID, userID)
	return s.toSubscriptionResponse(subscription), nil
}

// GetUserPushSubscriptions obtiene las suscripciones push de un usuario
func (s *NotificationService) GetUserPushSubscriptions(ctx context.Context, userID, tenantID uuid.UUID) ([]domain.PushSubscriptionResponse, error) {
	subscriptions, err := s.repo.GetSubscriptionsByUser(ctx, userID, tenantID)
	if err != nil {
		return nil, err
	}

	responses := make([]domain.PushSubscriptionResponse, len(subscriptions))
	for i, sub := range subscriptions {
		responses[i] = *s.toSubscriptionResponse(sub)
	}

	return responses, nil
}

// DeletePushSubscription elimina una suscripción push
func (s *NotificationService) DeletePushSubscription(ctx context.Context, id, userID, tenantID uuid.UUID) error {
	subscription, err := s.repo.GetSubscription(ctx, id, tenantID)
	if err != nil {
		return domain.ErrSubscriptionNotFound
	}

	// Verify ownership
	if subscription.UserID != userID {
		return domain.ErrUnauthorizedAccess
	}

	if err := s.repo.DeleteSubscription(ctx, id, tenantID); err != nil {
		log.Printf("ERROR: Failed to delete subscription: %v", err)
		return err
	}

	log.Printf("INFO: Deleted push subscription %s", id)
	return nil
}

// CleanupExpiredNotifications limpia notificaciones expiradas
func (s *NotificationService) CleanupExpiredNotifications(ctx context.Context, tenantID uuid.UUID) error {
	if err := s.repo.DeleteExpired(ctx, tenantID); err != nil {
		log.Printf("ERROR: Failed to cleanup expired notifications: %v", err)
		return err
	}

	log.Printf("INFO: Cleaned up expired notifications for tenant %s", tenantID)
	return nil
}

// Helper methods

func (s *NotificationService) toResponse(n *domain.Notification) *domain.NotificationResponse {
	return &domain.NotificationResponse{
		ID:          n.ID,
		Type:        n.Type,
		Title:       n.Title,
		Message:     n.Message,
		Status:      n.Status,
		Priority:    n.Priority,
		Metadata:    n.Metadata,
		ActionURL:   n.ActionURL,
		ActionLabel: n.ActionLabel,
		ReadAt:      n.ReadAt,
		ArchivedAt:  n.ArchivedAt,
		ExpiresAt:   n.ExpiresAt,
		CreatedAt:   n.CreatedAt,
	}
}

func (s *NotificationService) toPreferencesResponse(p *domain.NotificationPreferences) *domain.PreferencesResponse {
	return &domain.PreferencesResponse{
		EmailEnabled:            p.EmailEnabled,
		PushEnabled:             p.PushEnabled,
		CourseCompletionEnabled: p.CourseCompletionEnabled,
		ProgressEnabled:         p.ProgressEnabled,
		EnrollmentEnabled:       p.EnrollmentEnabled,
		QuizCompletionEnabled:   p.QuizCompletionEnabled,
		AnnouncementEnabled:     p.AnnouncementEnabled,
		SystemUpdateEnabled:     p.SystemUpdateEnabled,
		ReminderEnabled:         p.ReminderEnabled,
		AchievementEnabled:      p.AchievementEnabled,
		AssignmentEnabled:       p.AssignmentEnabled,
		CertificateEnabled:      p.CertificateEnabled,
		DigestFrequency:         p.DigestFrequency,
		QuietHoursStart:         p.QuietHoursStart,
		QuietHoursEnd:           p.QuietHoursEnd,
	}
}

func (s *NotificationService) toSubscriptionResponse(sub *domain.PushSubscription) *domain.PushSubscriptionResponse {
	return &domain.PushSubscriptionResponse{
		ID:         sub.ID,
		Endpoint:   sub.Endpoint,
		DeviceType: sub.DeviceType,
		IsActive:   sub.IsActive,
		LastUsedAt: sub.LastUsedAt,
		CreatedAt:  sub.CreatedAt,
	}
}

func (s *NotificationService) createDefaultPreferences(userID, tenantID uuid.UUID) *domain.NotificationPreferences {
	return &domain.NotificationPreferences{
		ID:                      uuid.New(),
		TenantID:                tenantID,
		UserID:                  userID,
		EmailEnabled:            true,
		PushEnabled:             true,
		CourseCompletionEnabled: true,
		ProgressEnabled:         true,
		EnrollmentEnabled:       true,
		QuizCompletionEnabled:   true,
		AnnouncementEnabled:     true,
		SystemUpdateEnabled:     true,
		ReminderEnabled:         true,
		AchievementEnabled:      true,
		AssignmentEnabled:       true,
		CertificateEnabled:      true,
		DigestFrequency:         "immediate",
		CreatedAt:               time.Now(),
		UpdatedAt:               time.Now(),
	}
}

func (s *NotificationService) isNotificationTypeEnabled(prefs *domain.NotificationPreferences, notifType domain.NotificationType) bool {
	switch notifType {
	case domain.NotificationTypeCourseCompletion:
		return prefs.CourseCompletionEnabled
	case domain.NotificationTypeProgress:
		return prefs.ProgressEnabled
	case domain.NotificationTypeEnrollment:
		return prefs.EnrollmentEnabled
	case domain.NotificationTypeQuizCompletion:
		return prefs.QuizCompletionEnabled
	case domain.NotificationTypeAnnouncement:
		return prefs.AnnouncementEnabled
	case domain.NotificationTypeSystemUpdate:
		return prefs.SystemUpdateEnabled
	case domain.NotificationTypeReminder:
		return prefs.ReminderEnabled
	case domain.NotificationTypeAchievement:
		return prefs.AchievementEnabled
	case domain.NotificationTypeAssignment:
		return prefs.AssignmentEnabled
	case domain.NotificationTypeCertificate:
		return prefs.CertificateEnabled
	default:
		return true
	}
}

func stringPtr(s string) *string {
	return &s
}
