package controllers

import (
	"strconv"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/notifications/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/notifications/ports"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// NotificationController handles notification-related HTTP requests
type NotificationController struct {
	notificationService ports.NotificationService
}

// NewNotificationController creates a new NotificationController
func NewNotificationController(notificationService ports.NotificationService) *NotificationController {
	return &NotificationController{
		notificationService: notificationService,
	}
}

// ============================================================================
// Helper Functions for Context Extraction
// ============================================================================

// getUserIDFromContext safely extracts and parses userID from Fiber context
func getUserIDFromContext(c *fiber.Ctx) (uuid.UUID, error) {
	userIDRaw := c.Locals("userID")
	if userIDRaw == nil {
		return uuid.Nil, fiber.NewError(fiber.StatusUnauthorized, "User ID not found in context")
	}

	userIDStr, ok := userIDRaw.(string)
	if !ok {
		return uuid.Nil, fiber.NewError(fiber.StatusInternalServerError, "Invalid user ID type in context")
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return uuid.Nil, fiber.NewError(fiber.StatusBadRequest, "Invalid user ID format")
	}

	return userID, nil
}

// getTenantIDFromContext safely extracts and parses tenantID from Fiber context
func getTenantIDFromContext(c *fiber.Ctx) (uuid.UUID, error) {
	tenantIDRaw := c.Locals("tenant_id") // Use snake_case key to match TenantMiddleware
	if tenantIDRaw == nil {
		return uuid.Nil, fiber.NewError(fiber.StatusBadRequest, "Tenant ID not found in context")
	}

	tenantIDStr, ok := tenantIDRaw.(string)
	if !ok {
		return uuid.Nil, fiber.NewError(fiber.StatusInternalServerError, "Invalid tenant ID type in context")
	}

	tenantID, err := uuid.Parse(tenantIDStr)
	if err != nil {
		return uuid.Nil, fiber.NewError(fiber.StatusBadRequest, "Invalid tenant ID format")
	}

	return tenantID, nil
}

// ============================================================================
// Notification CRUD Operations
// ============================================================================

// CreateNotification creates a new notification
// POST /api/v1/notifications
func (ctrl *NotificationController) CreateNotification(c *fiber.Ctx) error {
	// Get tenant ID from context
	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	// Parse request body
	var req domain.CreateNotificationRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	notification, err := ctrl.notificationService.CreateNotification(c.Context(), tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Notification created successfully", notification)
}

// CreateBulkNotifications creates multiple notifications
// POST /api/v1/notifications/bulk
func (ctrl *NotificationController) CreateBulkNotifications(c *fiber.Ctx) error {
	// Get tenant ID from context
	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	// Parse request body
	var req domain.BulkCreateNotificationRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	notifications, err := ctrl.notificationService.CreateBulkNotifications(c.Context(), tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Notifications created successfully", fiber.Map{
		"notifications": notifications,
		"count":        len(notifications),
	})
}

// GetNotification retrieves a single notification by ID
// GET /api/v1/notifications/:id
func (ctrl *NotificationController) GetNotification(c *fiber.Ctx) error {
	// Get notification ID from params
	notificationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid notification ID")
	}

	// Get tenant ID from context
	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	// Get user ID from context
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	// Call service
	notification, err := ctrl.notificationService.GetNotification(c.Context(), notificationID, tenantID, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Notification retrieved successfully", notification)
}

// GetUserNotifications retrieves all notifications for the current user
// GET /api/v1/notifications
func (ctrl *NotificationController) GetUserNotifications(c *fiber.Ctx) error {
	// Get user ID from context
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	// Get tenant ID from context
	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	// Parse query parameters
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

	// Call service
	notifications, err := ctrl.notificationService.GetUserNotifications(c.Context(), userID, tenantID, filters)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Notifications retrieved successfully", notifications)
}

// UpdateNotificationStatus updates the status of a notification
// PUT /api/v1/notifications/:id/status
func (ctrl *NotificationController) UpdateNotificationStatus(c *fiber.Ctx) error {
	// Get notification ID from params
	notificationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid notification ID")
	}

	// Get tenant ID from context
	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	// Get user ID from context
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	// Parse request body
	var req domain.UpdateNotificationRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	if err := ctrl.notificationService.UpdateNotificationStatus(c.Context(), notificationID, tenantID, userID, req.Status); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Notification status updated successfully", nil)
}

// MarkAsRead marks a notification as read
// PUT /api/v1/notifications/:id/read
func (ctrl *NotificationController) MarkAsRead(c *fiber.Ctx) error {
	// Get notification ID from params
	notificationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid notification ID")
	}

	// Get tenant ID from context
	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	// Get user ID from context
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	// Call service
	if err := ctrl.notificationService.UpdateNotificationStatus(c.Context(), notificationID, tenantID, userID, domain.NotificationStatusRead); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Notification marked as read", nil)
}

// MarkAsUnread marks a notification as unread
// PUT /api/v1/notifications/:id/unread
func (ctrl *NotificationController) MarkAsUnread(c *fiber.Ctx) error {
	// Get notification ID from params
	notificationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid notification ID")
	}

	// Get tenant ID from context
	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	// Get user ID from context
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	// Call service
	if err := ctrl.notificationService.UpdateNotificationStatus(c.Context(), notificationID, tenantID, userID, domain.NotificationStatusUnread); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Notification marked as unread", nil)
}

// ArchiveNotification archives a notification
// PUT /api/v1/notifications/:id/archive
func (ctrl *NotificationController) ArchiveNotification(c *fiber.Ctx) error {
	// Get notification ID from params
	notificationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid notification ID")
	}

	// Get tenant ID from context
	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	// Get user ID from context
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	// Call service
	if err := ctrl.notificationService.UpdateNotificationStatus(c.Context(), notificationID, tenantID, userID, domain.NotificationStatusArchived); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Notification archived successfully", nil)
}

// DeleteNotification deletes a notification
// DELETE /api/v1/notifications/:id
func (ctrl *NotificationController) DeleteNotification(c *fiber.Ctx) error {
	// Get notification ID from params
	notificationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid notification ID")
	}

	// Get tenant ID from context
	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	// Get user ID from context
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	// Call service
	if err := ctrl.notificationService.DeleteNotification(c.Context(), notificationID, tenantID, userID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Notification deleted successfully", nil)
}

// ============================================================================
// Bulk Operations
// ============================================================================

// MarkAllAsRead marks all notifications as read for the current user
// POST /api/v1/notifications/mark-all-read
func (ctrl *NotificationController) MarkAllAsRead(c *fiber.Ctx) error {
	// Get user ID from context
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	// Get tenant ID from context
	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	// Call service
	if err := ctrl.notificationService.MarkAllAsRead(c.Context(), userID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "All notifications marked as read", nil)
}

// DeleteAllRead deletes all read notifications for the current user
// DELETE /api/v1/notifications/read
func (ctrl *NotificationController) DeleteAllRead(c *fiber.Ctx) error {
	// Get user ID from context
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	// Get tenant ID from context
	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	// Call service
	if err := ctrl.notificationService.DeleteAllRead(c.Context(), userID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "All read notifications deleted", nil)
}

// ============================================================================
// Queries
// ============================================================================

// GetUnreadCount returns the count of unread notifications for the current user
// GET /api/v1/notifications/unread/count
func (ctrl *NotificationController) GetUnreadCount(c *fiber.Ctx) error {
	// Get user ID from context
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	// Get tenant ID from context
	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	// Call service
	count, err := ctrl.notificationService.GetUnreadCount(c.Context(), userID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Unread count retrieved successfully", domain.UnreadCountResponse{
		Count: count,
	})
}

// ============================================================================
// Specific Notification Types
// ============================================================================

// SendCourseCompletionNotification sends a course completion notification
// POST /api/v1/notifications/course-completion
func (ctrl *NotificationController) SendCourseCompletionNotification(c *fiber.Ctx) error {
	// Get tenant ID from context
	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	// Parse request body
	var req domain.SendCourseCompletionNotificationRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	if err := ctrl.notificationService.SendCourseCompletionNotification(c.Context(), tenantID, &req); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course completion notification sent", nil)
}

// SendProgressNotification sends a progress notification
// POST /api/v1/notifications/progress
func (ctrl *NotificationController) SendProgressNotification(c *fiber.Ctx) error {
	// Get tenant ID from context
	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	// Parse request body
	var req domain.SendProgressNotificationRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	if err := ctrl.notificationService.SendProgressNotification(c.Context(), tenantID, &req); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Progress notification sent", nil)
}

// SendEnrollmentNotification sends an enrollment notification
// POST /api/v1/notifications/enrollment
func (ctrl *NotificationController) SendEnrollmentNotification(c *fiber.Ctx) error {
	// Get tenant ID from context
	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	// Parse request body
	var req domain.SendEnrollmentNotificationRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	if err := ctrl.notificationService.SendEnrollmentNotification(c.Context(), tenantID, &req); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Enrollment notification sent", nil)
}

// SendQuizCompletionNotification sends a quiz completion notification
// POST /api/v1/notifications/quiz-completion
func (ctrl *NotificationController) SendQuizCompletionNotification(c *fiber.Ctx) error {
	// Get tenant ID from context
	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	// Parse request body
	var req domain.SendQuizCompletionNotificationRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	if err := ctrl.notificationService.SendQuizCompletionNotification(c.Context(), tenantID, &req); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Quiz completion notification sent", nil)
}

// SendAnnouncement sends an announcement to multiple users
// POST /api/v1/notifications/announcements
func (ctrl *NotificationController) SendAnnouncement(c *fiber.Ctx) error {
	// Get tenant ID from context
	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	// Parse request body
	var req domain.SendAnnouncementRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	if err := ctrl.notificationService.SendAnnouncement(c.Context(), tenantID, &req); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Announcement sent successfully", nil)
}

// ============================================================================
// Preferences
// ============================================================================

// GetUserPreferences retrieves notification preferences for the current user
// GET /api/v1/notifications/preferences
func (ctrl *NotificationController) GetUserPreferences(c *fiber.Ctx) error {
	// Get user ID from context
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	// Get tenant ID from context
	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	// Call service
	preferences, err := ctrl.notificationService.GetUserPreferences(c.Context(), userID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Preferences retrieved successfully", preferences)
}

// UpdateUserPreferences updates notification preferences for the current user
// PUT /api/v1/notifications/preferences
func (ctrl *NotificationController) UpdateUserPreferences(c *fiber.Ctx) error {
	// Get user ID from context
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	// Get tenant ID from context
	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	// Parse request body
	var req domain.UpdatePreferencesRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	preferences, err := ctrl.notificationService.UpdateUserPreferences(c.Context(), userID, tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Preferences updated successfully", preferences)
}

// ============================================================================
// Push Subscriptions
// ============================================================================

// CreatePushSubscription creates a push subscription for the current user
// POST /api/v1/notifications/push/subscribe
func (ctrl *NotificationController) CreatePushSubscription(c *fiber.Ctx) error {
	// Get user ID from context
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	// Get tenant ID from context
	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	// Parse request body
	var req domain.CreatePushSubscriptionRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	subscription, err := ctrl.notificationService.CreatePushSubscription(c.Context(), userID, tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Push subscription created successfully", subscription)
}

// GetUserPushSubscriptions retrieves all push subscriptions for the current user
// GET /api/v1/notifications/push/subscriptions
func (ctrl *NotificationController) GetUserPushSubscriptions(c *fiber.Ctx) error {
	// Get user ID from context
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	// Get tenant ID from context
	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	// Call service
	subscriptions, err := ctrl.notificationService.GetUserPushSubscriptions(c.Context(), userID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Push subscriptions retrieved successfully", subscriptions)
}

// DeletePushSubscription deletes a push subscription
// DELETE /api/v1/notifications/push/subscriptions/:id
func (ctrl *NotificationController) DeletePushSubscription(c *fiber.Ctx) error {
	// Get subscription ID from params
	subscriptionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid subscription ID")
	}

	// Get user ID from context
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return err
	}

	// Get tenant ID from context
	tenantID, err := getTenantIDFromContext(c)
	if err != nil {
		return err
	}

	// Call service
	if err := ctrl.notificationService.DeletePushSubscription(c.Context(), subscriptionID, userID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Push subscription deleted successfully", nil)
}
