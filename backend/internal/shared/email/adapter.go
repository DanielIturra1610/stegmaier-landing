package email

import (
	"context"
	"fmt"
	"log"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/notifications/ports"
)

// EmailServiceAdapter adapta nuestro EmailService para implementar ports.EmailService
type EmailServiceAdapter struct {
	emailService *EmailService
}

// NewEmailServiceAdapter crea un nuevo adaptador
func NewEmailServiceAdapter(emailService *EmailService) ports.EmailService {
	return &EmailServiceAdapter{
		emailService: emailService,
	}
}

// SendNotificationEmail envía un email genérico de notificación
func (a *EmailServiceAdapter) SendNotificationEmail(ctx context.Context, to, subject, body string) error {
	data := EmailData{
		To:           []string{to},
		Subject:      subject,
		TemplateName: "notification", // Usará el fallback template
		Data: map[string]interface{}{
			"Message": body,
		},
	}

	if err := a.emailService.SendEmail(ctx, data); err != nil {
		log.Printf("ERROR: Failed to send notification email to %s: %v", to, err)
		return fmt.Errorf("failed to send notification email: %w", err)
	}

	return nil
}

// SendCourseCompletionEmail envía email de curso completado
func (a *EmailServiceAdapter) SendCourseCompletionEmail(ctx context.Context, to, userName, courseTitle string) error {
	// Por ahora enviamos un email básico, los detalles completos se enviarán desde donde se tenga toda la información
	if err := a.emailService.SendCourseCompletionEmail(
		ctx,
		to,
		userName,
		courseTitle,
		"", // courseID - se llenará cuando se tenga
		"", // completionDate - se llenará cuando se tenga
		"", // certificateURL - se llenará cuando se tenga
	); err != nil {
		log.Printf("ERROR: Failed to send course completion email to %s: %v", to, err)
		return fmt.Errorf("failed to send course completion email: %w", err)
	}

	return nil
}

// SendProgressEmail envía email de progreso
func (a *EmailServiceAdapter) SendProgressEmail(ctx context.Context, to, userName, courseTitle string, progress int) error {
	// Determinamos si es un hito (25%, 50%, 75%, 100%)
	milestones := []int{25, 50, 75, 100}
	isMilestone := false
	for _, m := range milestones {
		if progress == m {
			isMilestone = true
			break
		}
	}

	if !isMilestone {
		// No enviar email para progresos que no sean hitos
		log.Printf("INFO: Skipping progress email for %d%% (not a milestone)", progress)
		return nil
	}

	if err := a.emailService.SendProgressMilestoneEmail(
		ctx,
		to,
		userName,
		courseTitle,
		"", // courseID - se llenará cuando se tenga
		progress,
	); err != nil {
		log.Printf("ERROR: Failed to send progress email to %s: %v", to, err)
		return fmt.Errorf("failed to send progress email: %w", err)
	}

	return nil
}

// SendEnrollmentEmail envía email de inscripción
func (a *EmailServiceAdapter) SendEnrollmentEmail(ctx context.Context, to, userName, courseTitle string) error {
	if err := a.emailService.SendEnrollmentConfirmationEmail(
		ctx,
		to,
		userName,
		courseTitle,
		"", // courseID - se llenará cuando se tenga
	); err != nil {
		log.Printf("ERROR: Failed to send enrollment email to %s: %v", to, err)
		return fmt.Errorf("failed to send enrollment email: %w", err)
	}

	return nil
}
