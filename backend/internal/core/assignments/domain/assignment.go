package domain

import (
	"time"

	"github.com/google/uuid"
)

// Assignment representa una tarea o asignación en un curso
type Assignment struct {
	ID           uuid.UUID      `json:"id"`
	TenantID     uuid.UUID      `json:"tenant_id"`
	Title        string         `json:"title"`
	Description  string         `json:"description"`
	Instructions string         `json:"instructions"`
	Type         AssignmentType `json:"assignment_type"`

	// Relations
	CourseID *uuid.UUID `json:"course_id,omitempty"`
	ModuleID *uuid.UUID `json:"module_id,omitempty"`
	LessonID *uuid.UUID `json:"lesson_id,omitempty"`

	// Files and resources
	Attachments   []uuid.UUID `json:"attachments"`     // IDs de archivos adjuntos
	TemplateFiles []uuid.UUID `json:"template_files"`  // IDs de archivos plantilla

	// Submission configuration
	MaxFileSize             int64    `json:"max_file_size"`              // En bytes
	AllowedFileTypes        []string `json:"allowed_file_types"`         // Extensiones permitidas
	MaxFiles                int      `json:"max_files"`                  // Máximo de archivos por entrega
	AllowMultipleSubmissions bool    `json:"allow_multiple_submissions"` // Permitir reenvíos

	// Dates
	AvailableFrom       *time.Time `json:"available_from,omitempty"`
	DueDate             *time.Time `json:"due_date,omitempty"`
	LatePenaltyPerDay   float64    `json:"late_penalty_per_day"`   // Penalización por día de retraso (%)
	AcceptLateSubmissions bool      `json:"accept_late_submissions"`

	// Evaluation
	RubricID     *uuid.UUID `json:"rubric_id,omitempty"`
	MaxPoints    float64    `json:"max_points"`
	PassingScore float64    `json:"passing_score"` // Puntuación mínima para aprobar

	// Advanced configuration
	PeerReviewEnabled       bool `json:"peer_review_enabled"`
	PeerReviewsRequired     int  `json:"peer_reviews_required"`     // Número de revisiones por pares requeridas
	AnonymousGrading        bool `json:"anonymous_grading"`         // Calificación anónima
	PlagiarismCheckEnabled  bool `json:"plagiarism_check_enabled"`  // Verificación de plagio

	// State
	IsPublished       bool `json:"is_published"`
	EstimatedDuration int  `json:"estimated_duration"` // Duración estimada en minutos

	// Timestamps
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	PublishedAt *time.Time `json:"published_at,omitempty"`
	CreatedBy   uuid.UUID  `json:"created_by"`

	// Statistics (calculated fields)
	TotalSubmissions  int     `json:"total_submissions"`
	GradedSubmissions int     `json:"graded_submissions"`
	AverageGrade      float64 `json:"average_grade"`
	OnTimeSubmissions int     `json:"on_time_submissions"`
	LateSubmissions   int     `json:"late_submissions"`
}

// NewAssignment crea un nuevo assignment
func NewAssignment(
	tenantID, createdBy, courseID uuid.UUID,
	title, description, instructions string,
	assignmentType AssignmentType,
) *Assignment {
	now := time.Now().UTC()

	return &Assignment{
		ID:                    uuid.New(),
		TenantID:              tenantID,
		CreatedBy:             createdBy,
		CourseID:              &courseID,
		Title:                 title,
		Description:           description,
		Instructions:          instructions,
		Type:                  assignmentType,
		MaxFileSize:           10 * 1024 * 1024, // 10 MB default
		AllowedFileTypes:      []string{},       // Todos los tipos permitidos por defecto
		MaxFiles:              5,                // 5 archivos por defecto
		AllowMultipleSubmissions: true,
		LatePenaltyPerDay:     10.0, // 10% por día por defecto
		AcceptLateSubmissions: true,
		MaxPoints:             100.0,
		PassingScore:          60.0,
		PeerReviewsRequired:   0,
		AnonymousGrading:      false,
		PlagiarismCheckEnabled: false,
		PeerReviewEnabled:     false,
		IsPublished:           false,
		EstimatedDuration:     60, // 60 minutos por defecto
		CreatedAt:             now,
		UpdatedAt:             now,
		Attachments:           []uuid.UUID{},
		TemplateFiles:         []uuid.UUID{},
	}
}

// Validate valida los datos del assignment
func (a *Assignment) Validate() error {
	if a.TenantID == uuid.Nil {
		return ErrInvalidTenantID
	}
	if a.Title == "" {
		return ErrInvalidTitle
	}
	if len(a.Title) < 3 {
		return ErrTitleTooShort
	}
	if len(a.Title) > 200 {
		return ErrTitleTooLong
	}
	if a.Description == "" {
		return ErrInvalidDescription
	}
	if a.Instructions == "" {
		return ErrInvalidInstructions
	}
	if !ValidateAssignmentType(a.Type) {
		return ErrInvalidAssignmentType
	}
	if a.CourseID == nil || *a.CourseID == uuid.Nil {
		return ErrInvalidCourseID
	}
	if a.CreatedBy == uuid.Nil {
		return ErrInvalidUserID
	}
	if a.MaxFileSize <= 0 {
		return ErrInvalidFileSize
	}
	if a.MaxFiles <= 0 {
		return ErrInvalidMaxFiles
	}
	if a.MaxPoints <= 0 {
		return ErrInvalidPoints
	}
	if a.PassingScore < 0 || a.PassingScore > a.MaxPoints {
		return ErrInvalidPassingScore
	}
	if a.LatePenaltyPerDay < 0 || a.LatePenaltyPerDay > 100 {
		return ErrInvalidLatePenalty
	}
	if a.PeerReviewEnabled && a.PeerReviewsRequired <= 0 {
		return ErrInvalidPeerReviewCount
	}
	if a.EstimatedDuration < 0 {
		return ErrInvalidDuration
	}

	// Validar fechas
	if a.AvailableFrom != nil && a.DueDate != nil {
		if a.AvailableFrom.After(*a.DueDate) {
			return ErrInvalidDateRange
		}
	}

	return nil
}

// Publish publica el assignment
func (a *Assignment) Publish() error {
	if a.IsPublished {
		return ErrAssignmentAlreadyPublished
	}

	if err := a.Validate(); err != nil {
		return err
	}

	now := time.Now().UTC()
	a.IsPublished = true
	a.PublishedAt = &now
	a.UpdatedAt = now

	return nil
}

// Unpublish despublica el assignment
func (a *Assignment) Unpublish() error {
	if !a.IsPublished {
		return ErrAssignmentNotPublished
	}

	a.IsPublished = false
	a.PublishedAt = nil
	a.UpdatedAt = time.Now().UTC()

	return nil
}

// Update actualiza los datos del assignment
func (a *Assignment) Update(
	title, description, instructions string,
	maxFileSize int64,
	allowedFileTypes []string,
	maxFiles int,
	allowMultipleSubmissions bool,
	dueDate *time.Time,
	availableFrom *time.Time,
	latePenaltyPerDay float64,
	acceptLateSubmissions bool,
	maxPoints, passingScore float64,
	estimatedDuration int,
) error {
	if title != "" {
		a.Title = title
	}
	if description != "" {
		a.Description = description
	}
	if instructions != "" {
		a.Instructions = instructions
	}
	if maxFileSize > 0 {
		a.MaxFileSize = maxFileSize
	}
	if allowedFileTypes != nil {
		a.AllowedFileTypes = allowedFileTypes
	}
	if maxFiles > 0 {
		a.MaxFiles = maxFiles
	}
	a.AllowMultipleSubmissions = allowMultipleSubmissions
	a.DueDate = dueDate
	a.AvailableFrom = availableFrom
	if latePenaltyPerDay >= 0 {
		a.LatePenaltyPerDay = latePenaltyPerDay
	}
	a.AcceptLateSubmissions = acceptLateSubmissions
	if maxPoints > 0 {
		a.MaxPoints = maxPoints
	}
	if passingScore >= 0 {
		a.PassingScore = passingScore
	}
	if estimatedDuration > 0 {
		a.EstimatedDuration = estimatedDuration
	}

	a.UpdatedAt = time.Now().UTC()

	return a.Validate()
}

// SetRubric asocia una rúbrica al assignment
func (a *Assignment) SetRubric(rubricID uuid.UUID) {
	a.RubricID = &rubricID
	a.UpdatedAt = time.Now().UTC()
}

// RemoveRubric elimina la rúbrica del assignment
func (a *Assignment) RemoveRubric() {
	a.RubricID = nil
	a.UpdatedAt = time.Now().UTC()
}

// SetModuleID asocia el assignment a un módulo
func (a *Assignment) SetModuleID(moduleID uuid.UUID) {
	a.ModuleID = &moduleID
	a.UpdatedAt = time.Now().UTC()
}

// SetLessonID asocia el assignment a una lección
func (a *Assignment) SetLessonID(lessonID uuid.UUID) {
	a.LessonID = &lessonID
	a.UpdatedAt = time.Now().UTC()
}

// AddAttachment agrega un archivo adjunto
func (a *Assignment) AddAttachment(fileID uuid.UUID) {
	a.Attachments = append(a.Attachments, fileID)
	a.UpdatedAt = time.Now().UTC()
}

// RemoveAttachment elimina un archivo adjunto
func (a *Assignment) RemoveAttachment(fileID uuid.UUID) {
	for i, id := range a.Attachments {
		if id == fileID {
			a.Attachments = append(a.Attachments[:i], a.Attachments[i+1:]...)
			break
		}
	}
	a.UpdatedAt = time.Now().UTC()
}

// AddTemplateFile agrega un archivo plantilla
func (a *Assignment) AddTemplateFile(fileID uuid.UUID) {
	a.TemplateFiles = append(a.TemplateFiles, fileID)
	a.UpdatedAt = time.Now().UTC()
}

// RemoveTemplateFile elimina un archivo plantilla
func (a *Assignment) RemoveTemplateFile(fileID uuid.UUID) {
	for i, id := range a.TemplateFiles {
		if id == fileID {
			a.TemplateFiles = append(a.TemplateFiles[:i], a.TemplateFiles[i+1:]...)
			break
		}
	}
	a.UpdatedAt = time.Now().UTC()
}

// EnablePeerReview habilita la revisión por pares
func (a *Assignment) EnablePeerReview(requiredReviews int) error {
	if requiredReviews <= 0 {
		return ErrInvalidPeerReviewCount
	}
	a.PeerReviewEnabled = true
	a.PeerReviewsRequired = requiredReviews
	a.UpdatedAt = time.Now().UTC()
	return nil
}

// DisablePeerReview deshabilita la revisión por pares
func (a *Assignment) DisablePeerReview() {
	a.PeerReviewEnabled = false
	a.PeerReviewsRequired = 0
	a.UpdatedAt = time.Now().UTC()
}

// IsAvailable verifica si el assignment está disponible
func (a *Assignment) IsAvailable() bool {
	if !a.IsPublished {
		return false
	}
	if a.AvailableFrom != nil && time.Now().UTC().Before(*a.AvailableFrom) {
		return false
	}
	return true
}

// IsOverdue verifica si el assignment está vencido
func (a *Assignment) IsOverdue() bool {
	if a.DueDate == nil {
		return false
	}
	return time.Now().UTC().After(*a.DueDate)
}

// DaysUntilDue calcula los días hasta la fecha límite
func (a *Assignment) DaysUntilDue() int {
	if a.DueDate == nil {
		return 0
	}
	duration := time.Until(*a.DueDate)
	return int(duration.Hours() / 24)
}

// CalculateLatePenalty calcula la penalización por entrega tardía
func (a *Assignment) CalculateLatePenalty(submittedAt time.Time) float64 {
	if a.DueDate == nil || !a.AcceptLateSubmissions {
		return 0
	}

	if submittedAt.Before(*a.DueDate) || submittedAt.Equal(*a.DueDate) {
		return 0
	}

	daysLate := int(submittedAt.Sub(*a.DueDate).Hours() / 24)
	if daysLate <= 0 {
		daysLate = 1
	}

	penalty := float64(daysLate) * a.LatePenaltyPerDay
	if penalty > 100 {
		penalty = 100
	}

	return penalty
}

// UpdateStatistics actualiza las estadísticas del assignment
func (a *Assignment) UpdateStatistics(
	totalSubmissions, gradedSubmissions, onTimeSubmissions, lateSubmissions int,
	averageGrade float64,
) {
	a.TotalSubmissions = totalSubmissions
	a.GradedSubmissions = gradedSubmissions
	a.OnTimeSubmissions = onTimeSubmissions
	a.LateSubmissions = lateSubmissions
	a.AverageGrade = averageGrade
}
