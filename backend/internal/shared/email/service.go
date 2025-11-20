package email

import (
	"bytes"
	"context"
	"crypto/tls"
	"fmt"
	"html/template"
	"log"
	"path/filepath"
	"time"

	"gopkg.in/gomail.v2"

	"github.com/DanielIturra1610/stegmaier-landing/internal/shared/config"
)

// EmailService maneja el envío de emails con templates HTML
type EmailService struct {
	config    *config.EmailConfig
	baseURL   string
	templates map[string]*template.Template
}

// EmailData contiene los datos para enviar un email
type EmailData struct {
	To          []string
	Subject     string
	TemplateName string
	Data        map[string]interface{}
	Attachments []string
}

// NewEmailService crea una nueva instancia del servicio de email
func NewEmailService(cfg *config.EmailConfig, baseURL string) *EmailService {
	service := &EmailService{
		config:    cfg,
		baseURL:   baseURL,
		templates: make(map[string]*template.Template),
	}

	// Cargar templates
	service.loadTemplates()

	return service
}

// SendEmail envía un email usando un template HTML
func (s *EmailService) SendEmail(ctx context.Context, data EmailData) error {
	// Renderizar template
	htmlContent, err := s.renderTemplate(data.TemplateName, data.Data)
	if err != nil {
		log.Printf("ERROR: Failed to render template %s: %v", data.TemplateName, err)
		return fmt.Errorf("failed to render template: %w", err)
	}

	// Crear mensaje
	m := gomail.NewMessage()
	m.SetHeader("From", s.config.From)
	m.SetHeader("To", data.To...)
	m.SetHeader("Subject", data.Subject)
	m.SetBody("text/html", htmlContent)

	// Agregar attachments si existen
	for _, attachment := range data.Attachments {
		m.Attach(attachment)
	}

	// Enviar email
	if err := s.sendSMTP(m); err != nil {
		log.Printf("ERROR: Failed to send email to %v: %v", data.To, err)
		return fmt.Errorf("failed to send email: %w", err)
	}

	log.Printf("INFO: Email sent successfully to %v with subject: %s", data.To, data.Subject)
	return nil
}

// SendWelcomeEmail envía email de bienvenida a nuevo usuario
func (s *EmailService) SendWelcomeEmail(ctx context.Context, to, userName, verificationToken string) error {
	data := map[string]interface{}{
		"UserName":        userName,
		"LoginURL":        fmt.Sprintf("%s/login", s.baseURL),
		"VerificationURL": "",
		"PlatformName":    "Stegmaier LMS",
		"SupportEmail":    s.config.From,
		"Year":            time.Now().Year(),
	}

	if verificationToken != "" {
		data["VerificationURL"] = fmt.Sprintf("%s/verify-email?token=%s", s.baseURL, verificationToken)
	}

	return s.SendEmail(ctx, EmailData{
		To:           []string{to},
		Subject:      "¡Bienvenido a Stegmaier LMS!",
		TemplateName: "welcome",
		Data:         data,
	})
}

// SendEnrollmentConfirmationEmail envía email de confirmación de inscripción
func (s *EmailService) SendEnrollmentConfirmationEmail(ctx context.Context, to, userName, courseTitle, courseID string) error {
	data := map[string]interface{}{
		"UserName":     userName,
		"CourseTitle":  courseTitle,
		"CourseURL":    fmt.Sprintf("%s/platform/courses/%s", s.baseURL, courseID),
		"DashboardURL": fmt.Sprintf("%s/platform/dashboard", s.baseURL),
		"PlatformName": "Stegmaier LMS",
		"Year":         time.Now().Year(),
	}

	return s.SendEmail(ctx, EmailData{
		To:           []string{to},
		Subject:      fmt.Sprintf("Inscripción exitosa en %s", courseTitle),
		TemplateName: "enrollment_confirmation",
		Data:         data,
	})
}

// SendCourseCompletionEmail envía email de felicitación por completar curso
func (s *EmailService) SendCourseCompletionEmail(ctx context.Context, to, userName, courseTitle, courseID, completionDate, certificateURL string) error {
	data := map[string]interface{}{
		"UserName":       userName,
		"CourseTitle":    courseTitle,
		"CompletionDate": completionDate,
		"CertificateURL": certificateURL,
		"CourseURL":      fmt.Sprintf("%s/platform/courses/%s", s.baseURL, courseID),
		"CertificatesURL": fmt.Sprintf("%s/platform/certificates", s.baseURL),
		"PlatformName":   "Stegmaier LMS",
		"Year":           time.Now().Year(),
	}

	return s.SendEmail(ctx, EmailData{
		To:           []string{to},
		Subject:      fmt.Sprintf("¡Felicitaciones! Has completado %s", courseTitle),
		TemplateName: "course_completion",
		Data:         data,
	})
}

// SendCertificateGeneratedEmail envía email cuando se genera un certificado
func (s *EmailService) SendCertificateGeneratedEmail(ctx context.Context, to, userName, courseTitle, certificateNumber, downloadURL string) error {
	data := map[string]interface{}{
		"UserName":          userName,
		"CourseTitle":       courseTitle,
		"CertificateNumber": certificateNumber,
		"DownloadURL":       downloadURL,
		"CertificatesURL":   fmt.Sprintf("%s/platform/certificates", s.baseURL),
		"PlatformName":      "Stegmaier LMS",
		"Year":              time.Now().Year(),
	}

	return s.SendEmail(ctx, EmailData{
		To:           []string{to},
		Subject:      fmt.Sprintf("Tu certificado de %s está listo", courseTitle),
		TemplateName: "certificate_generated",
		Data:         data,
	})
}

// SendCourseReminderEmail envía recordatorio para continuar curso
func (s *EmailService) SendCourseReminderEmail(ctx context.Context, to, userName, courseTitle, courseID string, progressPercentage int, lastActivity string) error {
	data := map[string]interface{}{
		"UserName":           userName,
		"CourseTitle":        courseTitle,
		"ProgressPercentage": progressPercentage,
		"LastActivity":       lastActivity,
		"CourseURL":          fmt.Sprintf("%s/platform/courses/%s", s.baseURL, courseID),
		"DashboardURL":       fmt.Sprintf("%s/platform/dashboard", s.baseURL),
		"PlatformName":       "Stegmaier LMS",
		"Year":               time.Now().Year(),
	}

	return s.SendEmail(ctx, EmailData{
		To:           []string{to},
		Subject:      fmt.Sprintf("Continúa tu progreso en %s", courseTitle),
		TemplateName: "course_reminder",
		Data:         data,
	})
}

// SendPasswordResetEmail envía email para restablecer contraseña
func (s *EmailService) SendPasswordResetEmail(ctx context.Context, to, userName, resetToken string) error {
	data := map[string]interface{}{
		"UserName":     userName,
		"ResetURL":     fmt.Sprintf("%s/reset-password?token=%s", s.baseURL, resetToken),
		"PlatformName": "Stegmaier LMS",
		"SupportEmail": s.config.From,
		"Year":         time.Now().Year(),
	}

	return s.SendEmail(ctx, EmailData{
		To:           []string{to},
		Subject:      "Restablece tu contraseña - Stegmaier LMS",
		TemplateName: "password_reset",
		Data:         data,
	})
}

// SendEnrollmentRequestEmail envía email cuando se solicita inscripción
func (s *EmailService) SendEnrollmentRequestEmail(ctx context.Context, to, userName, courseTitle, courseID, message string) error {
	data := map[string]interface{}{
		"UserName":     userName,
		"CourseTitle":  courseTitle,
		"Message":      message,
		"CourseURL":    fmt.Sprintf("%s/platform/courses/%s", s.baseURL, courseID),
		"RequestsURL":  fmt.Sprintf("%s/platform/enrollment-requests", s.baseURL),
		"PlatformName": "Stegmaier LMS",
		"Year":         time.Now().Year(),
	}

	return s.SendEmail(ctx, EmailData{
		To:           []string{to},
		Subject:      fmt.Sprintf("Solicitud de inscripción en %s", courseTitle),
		TemplateName: "enrollment_request",
		Data:         data,
	})
}

// SendEnrollmentApprovedEmail envía email cuando se aprueba una solicitud de inscripción
func (s *EmailService) SendEnrollmentApprovedEmail(ctx context.Context, to, userName, courseTitle, courseID string) error {
	data := map[string]interface{}{
		"UserName":     userName,
		"CourseTitle":  courseTitle,
		"CourseURL":    fmt.Sprintf("%s/platform/courses/%s", s.baseURL, courseID),
		"DashboardURL": fmt.Sprintf("%s/platform/dashboard", s.baseURL),
		"PlatformName": "Stegmaier LMS",
		"Year":         time.Now().Year(),
	}

	return s.SendEmail(ctx, EmailData{
		To:           []string{to},
		Subject:      fmt.Sprintf("¡Tu solicitud de inscripción en %s fue aprobada!", courseTitle),
		TemplateName: "enrollment_approved",
		Data:         data,
	})
}

// SendEnrollmentRejectedEmail envía email cuando se rechaza una solicitud de inscripción
func (s *EmailService) SendEnrollmentRejectedEmail(ctx context.Context, to, userName, courseTitle, reason string) error {
	data := map[string]interface{}{
		"UserName":     userName,
		"CourseTitle":  courseTitle,
		"Reason":       reason,
		"CoursesURL":   fmt.Sprintf("%s/platform/courses", s.baseURL),
		"SupportEmail": s.config.From,
		"PlatformName": "Stegmaier LMS",
		"Year":         time.Now().Year(),
	}

	return s.SendEmail(ctx, EmailData{
		To:           []string{to},
		Subject:      fmt.Sprintf("Actualización sobre tu solicitud de inscripción en %s", courseTitle),
		TemplateName: "enrollment_rejected",
		Data:         data,
	})
}

// SendProgressMilestoneEmail envía email cuando se alcanza un hito de progreso
func (s *EmailService) SendProgressMilestoneEmail(ctx context.Context, to, userName, courseTitle, courseID string, milestone int) error {
	data := map[string]interface{}{
		"UserName":     userName,
		"CourseTitle":  courseTitle,
		"Milestone":    milestone,
		"CourseURL":    fmt.Sprintf("%s/platform/courses/%s", s.baseURL, courseID),
		"PlatformName": "Stegmaier LMS",
		"Year":         time.Now().Year(),
	}

	return s.SendEmail(ctx, EmailData{
		To:           []string{to},
		Subject:      fmt.Sprintf("¡Has alcanzado el %d%% en %s!", milestone, courseTitle),
		TemplateName: "progress_milestone",
		Data:         data,
	})
}

// renderTemplate renderiza un template HTML con los datos proporcionados
func (s *EmailService) renderTemplate(templateName string, data map[string]interface{}) (string, error) {
	tmpl, exists := s.templates[templateName]
	if !exists {
		// Si no existe el template, usar el fallback
		return s.getFallbackTemplate(data), nil
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		log.Printf("ERROR: Failed to execute template %s: %v", templateName, err)
		return s.getFallbackTemplate(data), nil
	}

	return buf.String(), nil
}

// loadTemplates carga todos los templates HTML
func (s *EmailService) loadTemplates() {
	templateDir := "backend/internal/shared/email/templates"

	templates := []string{
		"welcome",
		"enrollment_confirmation",
		"enrollment_request",
		"enrollment_approved",
		"enrollment_rejected",
		"course_completion",
		"certificate_generated",
		"course_reminder",
		"progress_milestone",
		"password_reset",
	}

	for _, name := range templates {
		templatePath := filepath.Join(templateDir, name+".html")
		tmpl, err := template.ParseFiles(templatePath)
		if err != nil {
			log.Printf("WARN: Failed to load template %s: %v (will use fallback)", name, err)
			continue
		}
		s.templates[name] = tmpl
		log.Printf("INFO: Loaded email template: %s", name)
	}
}

// getFallbackTemplate retorna un template HTML básico como fallback
func (s *EmailService) getFallbackTemplate(data map[string]interface{}) string {
	userName := "Usuario"
	if name, ok := data["UserName"].(string); ok {
		userName = name
	}

	dashboardURL := fmt.Sprintf("%s/platform/dashboard", s.baseURL)
	if url, ok := data["DashboardURL"].(string); ok && url != "" {
		dashboardURL = url
	}

	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <title>Stegmaier LMS</title>
    <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #2563eb 0%%, #1d4ed8 100%%); color: white; padding: 30px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Stegmaier LMS</h1>
    </div>
    <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Hola <strong>%s</strong>,</p>
        <p>Tienes una nueva notificación en la plataforma.</p>
        <p style="margin: 30px 0;">
            <a href="%s" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Ir al Dashboard
            </a>
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
            Este es un email automático de Stegmaier LMS.<br>
            © %d Stegmaier LMS. Todos los derechos reservados.
        </p>
    </div>
</body>
</html>
	`, userName, dashboardURL, time.Now().Year())
}

// sendSMTP envía el email via SMTP
func (s *EmailService) sendSMTP(m *gomail.Message) error {
	// Crear dialer SMTP
	d := gomail.NewDialer(
		s.config.SMTPHost,
		s.config.SMTPPort,
		s.config.SMTPUser,
		s.config.SMTPPassword,
	)

	// Configurar TLS
	d.TLSConfig = &tls.Config{
		InsecureSkipVerify: false,
		ServerName:         s.config.SMTPHost,
	}

	// Enviar email
	if err := d.DialAndSend(m); err != nil {
		return fmt.Errorf("SMTP error: %w", err)
	}

	return nil
}

// SendBulkEmail envía emails en lote a múltiples destinatarios
func (s *EmailService) SendBulkEmail(ctx context.Context, recipients []string, subject, templateName string, data map[string]interface{}) error {
	for _, recipient := range recipients {
		// Personalizar datos para cada destinatario si es necesario
		personalizedData := make(map[string]interface{})
		for k, v := range data {
			personalizedData[k] = v
		}

		if err := s.SendEmail(ctx, EmailData{
			To:           []string{recipient},
			Subject:      subject,
			TemplateName: templateName,
			Data:         personalizedData,
		}); err != nil {
			log.Printf("WARN: Failed to send email to %s: %v", recipient, err)
			// Continuar enviando a otros destinatarios
			continue
		}

		// Pequeño delay para evitar rate limiting
		time.Sleep(100 * time.Millisecond)
	}

	return nil
}
