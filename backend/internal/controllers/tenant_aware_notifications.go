package controllers

import (
	"log"
	"strconv"

	notificationadapters "github.com/DanielIturra1610/stegmaier-landing/internal/core/notifications/adapters"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/notifications/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/notifications/ports"
	notificationservices "github.com/DanielIturra1610/stegmaier-landing/internal/core/notifications/services"
	"github.com/DanielIturra1610/stegmaier-landing/internal/middleware"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// TenantAwareNotificationController handles notification-related HTTP requests with dynamic tenant DB connection
type TenantAwareNotificationController struct {
	emailService ports.EmailService
}

// NewTenantAwareNotificationController creates a new TenantAwareNotificationController
func NewTenantAwareNotificationController(emailService ports.EmailService) *TenantAwareNotificationController {
	return &TenantAwareNotificationController{
		emailService: emailService,
	}
}

// getNotificationService creates a notification service using the tenant DB from context
func (ctrl *TenantAwareNotificationController) getNotificationService(c *fiber.Ctx) (ports.NotificationService, error) {
	tenantDB, err := middleware.MustGetTenantDBFromContext(c)
	if err != nil {
		return nil, err
	}

	// Create repository with tenant DB
	notificationRepo := notificationadapters.NewPostgreSQLNotificationRepository(tenantDB)

	// Create and return service
	return notificationservices.NewNotificationService(notificationRepo, ctrl.emailService), nil
}

// CreateNotification creates a new notification
// POST /api/v1/notifications
func (ctrl *TenantAwareNotificationController) CreateNotification(c *fiber.Ctx) error {
	notificationService, err := ctrl.getNotificationService(c)
	if err != nil {
		log.Printf("❌ Failed to get notification service: %v", err)
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	var req domain.CreateNotificationRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	notification, err := notificationService.CreateNotification(c.Context(), tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Notification created successfully", notification)
}

// CreateBulkNotifications creates multiple notifications
// POST /api/v1/notifications/bulk
func (ctrl *TenantAwareNotificationController) CreateBulkNotifications(c *fiber.Ctx) error {
	notificationService, err := ctrl.getNotificationService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	var req domain.BulkCreateNotificationRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	notifications, err := notificationService.CreateBulkNotifications(c.Context(), tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Notifications created successfully", fiber.Map{
		"notifications": notifications,
		"count":         len(notifications),
	})
}

// GetNotification retrieves a single notification by ID
// GET /api/v1/notifications/:id
func (ctrl *TenantAwareNotificationController) GetNotification(c *fiber.Ctx) error {
	notificationService, err := ctrl.getNotificationService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	notificationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid notification ID")
	}

	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	notification, err := notificationService.GetNotification(c.Context(), notificationID, tenantID, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Notification retrieved successfully", notification)
}

// GetUserNotifications retrieves all notifications for the current user
// GET /api/v1/notifications
func (ctrl *TenantAwareNotificationController) GetUserNotifications(c *fiber.Ctx) error {
	notificationService, err := ctrl.getNotificationService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	filters := &domain.NotificationFilters{
		Page:     1,
		PageSize: 20,
	}

	if page := c.Query("page"); page != "" {
		if p, err := strconv.Atoi(page); err == nil && p > 0 {
			filters.Page = p
		}
	}

	if pageSize := c.Query("pageSize"); pageSize != "" {
		if ps, err := strconv.Atoi(pageSize); err == nil && ps > 0 && ps <= 100 {
			filters.PageSize = ps
		}
	}

	if status := c.Query("status"); status != "" {
		notifStatus := domain.NotificationStatus(status)
		filters.Status = &notifStatus
	}

	if notifType := c.Query("type"); notifType != "" {
		t := domain.NotificationType(notifType)
		filters.Type = &t
	}

	if priority := c.Query("priority"); priority != "" {
		p := domain.NotificationPriority(priority)
		filters.Priority = &p
	}

	notifications, err := notificationService.GetUserNotifications(c.Context(), userID, tenantID, filters)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Notifications retrieved successfully", notifications)
}

// UpdateNotificationStatus updates the status of a notification
// PUT /api/v1/notifications/:id/status
func (ctrl *TenantAwareNotificationController) UpdateNotificationStatus(c *fiber.Ctx) error {
	notificationService, err := ctrl.getNotificationService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	notificationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid notification ID")
	}

	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	var req domain.UpdateNotificationRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	if err := notificationService.UpdateNotificationStatus(c.Context(), notificationID, tenantID, userID, req.Status); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Notification status updated successfully", nil)
}

// MarkAsRead marks a notification as read
// PUT /api/v1/notifications/:id/read
func (ctrl *TenantAwareNotificationController) MarkAsRead(c *fiber.Ctx) error {
	notificationService, err := ctrl.getNotificationService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	notificationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid notification ID")
	}

	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	if err := notificationService.UpdateNotificationStatus(c.Context(), notificationID, tenantID, userID, domain.NotificationStatusRead); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Notification marked as read", nil)
}

// MarkAsUnread marks a notification as unread
// PUT /api/v1/notifications/:id/unread
func (ctrl *TenantAwareNotificationController) MarkAsUnread(c *fiber.Ctx) error {
	notificationService, err := ctrl.getNotificationService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	notificationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid notification ID")
	}

	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	if err := notificationService.UpdateNotificationStatus(c.Context(), notificationID, tenantID, userID, domain.NotificationStatusUnread); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Notification marked as unread", nil)
}

// ArchiveNotification archives a notification
// PUT /api/v1/notifications/:id/archive
func (ctrl *TenantAwareNotificationController) ArchiveNotification(c *fiber.Ctx) error {
	notificationService, err := ctrl.getNotificationService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	notificationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid notification ID")
	}

	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	if err := notificationService.UpdateNotificationStatus(c.Context(), notificationID, tenantID, userID, domain.NotificationStatusArchived); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Notification archived successfully", nil)
}

// DeleteNotification deletes a notification
// DELETE /api/v1/notifications/:id
func (ctrl *TenantAwareNotificationController) DeleteNotification(c *fiber.Ctx) error {
	notificationService, err := ctrl.getNotificationService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	notificationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid notification ID")
	}

	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	if err := notificationService.DeleteNotification(c.Context(), notificationID, tenantID, userID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Notification deleted successfully", nil)
}

// MarkAllAsRead marks all notifications as read for the current user
// POST /api/v1/notifications/mark-all-read
func (ctrl *TenantAwareNotificationController) MarkAllAsRead(c *fiber.Ctx) error {
	notificationService, err := ctrl.getNotificationService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	if err := notificationService.MarkAllAsRead(c.Context(), userID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "All notifications marked as read", nil)
}

// DeleteAllRead deletes all read notifications for the current user
// DELETE /api/v1/notifications/read
func (ctrl *TenantAwareNotificationController) DeleteAllRead(c *fiber.Ctx) error {
	notificationService, err := ctrl.getNotificationService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	if err := notificationService.DeleteAllRead(c.Context(), userID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "All read notifications deleted", nil)
}

// GetUnreadCount returns the count of unread notifications for the current user
// GET /api/v1/notifications/unread/count
func (ctrl *TenantAwareNotificationController) GetUnreadCount(c *fiber.Ctx) error {
	notificationService, err := ctrl.getNotificationService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	count, err := notificationService.GetUnreadCount(c.Context(), userID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Unread count retrieved successfully", domain.UnreadCountResponse{
		Count: count,
	})
}

// GetUserPreferences retrieves notification preferences for the current user
// GET /api/v1/notifications/preferences
func (ctrl *TenantAwareNotificationController) GetUserPreferences(c *fiber.Ctx) error {
	notificationService, err := ctrl.getNotificationService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	preferences, err := notificationService.GetUserPreferences(c.Context(), userID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Preferences retrieved successfully", preferences)
}

// UpdateUserPreferences updates notification preferences for the current user
// PUT /api/v1/notifications/preferences
func (ctrl *TenantAwareNotificationController) UpdateUserPreferences(c *fiber.Ctx) error {
	notificationService, err := ctrl.getNotificationService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	var req domain.UpdatePreferencesRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	preferences, err := notificationService.UpdateUserPreferences(c.Context(), userID, tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Preferences updated successfully", preferences)
}

// CreatePushSubscription creates a push subscription for the current user
// POST /api/v1/notifications/push/subscribe
func (ctrl *TenantAwareNotificationController) CreatePushSubscription(c *fiber.Ctx) error {
	notificationService, err := ctrl.getNotificationService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	var req domain.CreatePushSubscriptionRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	subscription, err := notificationService.CreatePushSubscription(c.Context(), userID, tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Push subscription created successfully", subscription)
}

// GetUserPushSubscriptions retrieves all push subscriptions for the current user
// GET /api/v1/notifications/push/subscriptions
func (ctrl *TenantAwareNotificationController) GetUserPushSubscriptions(c *fiber.Ctx) error {
	notificationService, err := ctrl.getNotificationService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	subscriptions, err := notificationService.GetUserPushSubscriptions(c.Context(), userID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Push subscriptions retrieved successfully", subscriptions)
}

// DeletePushSubscription deletes a push subscription
// DELETE /api/v1/notifications/push/subscriptions/:id
func (ctrl *TenantAwareNotificationController) DeletePushSubscription(c *fiber.Ctx) error {
	notificationService, err := ctrl.getNotificationService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	subscriptionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid subscription ID")
	}

	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	if err := notificationService.DeletePushSubscription(c.Context(), subscriptionID, userID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Push subscription deleted successfully", nil)
}

// SendCourseCompletionNotification sends a notification for course completion
// POST /api/v1/notifications/course-completion
func (ctrl *TenantAwareNotificationController) SendCourseCompletionNotification(c *fiber.Ctx) error {
	notificationService, err := ctrl.getNotificationService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	var req domain.SendCourseCompletionNotificationRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := notificationService.SendCourseCompletionNotification(c.Context(), tenantID, &req); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course completion notification sent", nil)
}

// SendProgressNotification sends a notification for progress update
// POST /api/v1/notifications/progress
func (ctrl *TenantAwareNotificationController) SendProgressNotification(c *fiber.Ctx) error {
	notificationService, err := ctrl.getNotificationService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	var req domain.SendProgressNotificationRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := notificationService.SendProgressNotification(c.Context(), tenantID, &req); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress notification sent", nil)
}

// SendEnrollmentNotification sends a notification for enrollment
// POST /api/v1/notifications/enrollment
func (ctrl *TenantAwareNotificationController) SendEnrollmentNotification(c *fiber.Ctx) error {
	notificationService, err := ctrl.getNotificationService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	var req domain.SendEnrollmentNotificationRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := notificationService.SendEnrollmentNotification(c.Context(), tenantID, &req); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Enrollment notification sent", nil)
}

// SendQuizCompletionNotification sends a notification for quiz completion
// POST /api/v1/notifications/quiz-completion
func (ctrl *TenantAwareNotificationController) SendQuizCompletionNotification(c *fiber.Ctx) error {
	notificationService, err := ctrl.getNotificationService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	var req domain.SendQuizCompletionNotificationRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := notificationService.SendQuizCompletionNotification(c.Context(), tenantID, &req); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Quiz completion notification sent", nil)
}

// SendAnnouncement sends an announcement notification
// POST /api/v1/notifications/announcement
func (ctrl *TenantAwareNotificationController) SendAnnouncement(c *fiber.Ctx) error {
	notificationService, err := ctrl.getNotificationService(c)
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	var req domain.SendAnnouncementRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if err := notificationService.SendAnnouncement(c.Context(), tenantID, &req); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Announcement sent", nil)
}
