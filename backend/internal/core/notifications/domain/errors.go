package domain

import "errors"

var (
	// ErrNotificationNotFound indica que la notificación no existe
	ErrNotificationNotFound = errors.New("notification not found")

	// ErrUnauthorizedAccess indica acceso no autorizado a la notificación
	ErrUnauthorizedAccess = errors.New("unauthorized access to notification")

	// ErrInvalidTitle indica que el título es inválido
	ErrInvalidTitle = errors.New("invalid notification title")

	// ErrInvalidMessage indica que el mensaje es inválido
	ErrInvalidMessage = errors.New("invalid notification message")

	// ErrInvalidStatus indica que el estado es inválido
	ErrInvalidStatus = errors.New("invalid notification status")

	// ErrNoRecipients indica que no hay destinatarios
	ErrNoRecipients = errors.New("no recipients specified")

	// ErrPreferencesNotFound indica que las preferencias no existen
	ErrPreferencesNotFound = errors.New("notification preferences not found")

	// ErrSubscriptionNotFound indica que la suscripción no existe
	ErrSubscriptionNotFound = errors.New("push subscription not found")

	// ErrSubscriptionAlreadyExists indica que ya existe una suscripción para ese endpoint
	ErrSubscriptionAlreadyExists = errors.New("push subscription already exists")

	// ErrInvalidDigestFrequency indica frecuencia de digest inválida
	ErrInvalidDigestFrequency = errors.New("invalid digest frequency")

	// ErrInvalidQuietHours indica horas de silencio inválidas
	ErrInvalidQuietHours = errors.New("invalid quiet hours format")

	// ErrNotificationExpired indica que la notificación está expirada
	ErrNotificationExpired = errors.New("notification has expired")
)
