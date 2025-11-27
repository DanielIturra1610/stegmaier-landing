package ports

import "errors"

// Notification errors
var (
	ErrNotificationNotFound = errors.New("notification not found")
	ErrUnauthorizedAccess   = errors.New("unauthorized access to notification")
	ErrInvalidTitle         = errors.New("invalid notification title")
	ErrInvalidMessage       = errors.New("invalid notification message")
	ErrInvalidStatus        = errors.New("invalid notification status")
	ErrNoRecipients         = errors.New("no recipients specified")

	// Preferences errors
	ErrPreferencesNotFound       = errors.New("notification preferences not found")
	ErrInvalidDigestFrequency    = errors.New("invalid digest frequency")
	ErrInvalidQuietHours         = errors.New("invalid quiet hours")

	// Push subscription errors
	ErrSubscriptionNotFound      = errors.New("push subscription not found")
	ErrSubscriptionAlreadyExists = errors.New("push subscription already exists")

	// Other errors
	ErrNotificationExpired = errors.New("notification has expired")
)
