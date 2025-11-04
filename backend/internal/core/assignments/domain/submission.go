package domain

import (
	"time"

	"github.com/google/uuid"
)

// AssignmentSubmission representa una entrega de un assignment por un estudiante
type AssignmentSubmission struct {
	ID              uuid.UUID        `json:"id"`
	TenantID        uuid.UUID        `json:"tenant_id"`
	AssignmentID    uuid.UUID        `json:"assignment_id"`
	AssignmentTitle string           `json:"assignment_title,omitempty"`
	StudentID       uuid.UUID        `json:"student_id"`
	StudentName     string           `json:"student_name,omitempty"`
	StudentEmail    string           `json:"student_email,omitempty"`

	// Content
	TextContent string      `json:"text_content"`
	Files       []uuid.UUID `json:"files"` // IDs de archivos de entrega

	// State
	Status           SubmissionStatus `json:"status"`
	SubmissionNumber int              `json:"submission_number"` // Número de intento (1, 2, 3...)
	IsFinal          bool             `json:"is_final"`          // Marca si es la entrega final

	// Dates
	CreatedAt      time.Time  `json:"created_at"`       // Cuándo se creó el borrador
	UpdatedAt      time.Time  `json:"updated_at"`       // Última modificación
	StartedAt      *time.Time `json:"started_at,omitempty"` // Cuándo el estudiante comenzó
	SubmittedAt    *time.Time `json:"submitted_at,omitempty"` // Cuándo se envió finalmente
	LastModifiedAt time.Time  `json:"last_modified_at"` // Última vez que se modificó

	// Grading
	GradeStatus          GradeStatus `json:"grade_status"`
	Grades               []uuid.UUID `json:"grades,omitempty"` // IDs de calificaciones individuales
	TotalPointsEarned    float64     `json:"total_points_earned"`
	TotalPointsPossible  float64     `json:"total_points_possible"`
	PercentageGrade      float64     `json:"percentage_grade"`
	LetterGrade          string      `json:"letter_grade,omitempty"`
	IsPassing            bool        `json:"is_passing"`
	GradedAt             *time.Time  `json:"graded_at,omitempty"`

	// Late penalty
	IsLate         bool    `json:"is_late"`
	DaysLate       int     `json:"days_late"`
	PenaltyApplied float64 `json:"penalty_applied"` // Porcentaje de penalización aplicado

	// Feedback
	InstructorFeedback string      `json:"instructor_feedback,omitempty"`
	Comments           []uuid.UUID `json:"comments,omitempty"` // IDs de comentarios

	// Metadata
	PlagiarismScore   float64 `json:"plagiarism_score,omitempty"`
	SimilarityReport  string  `json:"similarity_report,omitempty"`
}

// NewAssignmentSubmission crea una nueva entrega
func NewAssignmentSubmission(
	tenantID, assignmentID, studentID uuid.UUID,
	textContent string,
) *AssignmentSubmission {
	now := time.Now().UTC()

	return &AssignmentSubmission{
		ID:               uuid.New(),
		TenantID:         tenantID,
		AssignmentID:     assignmentID,
		StudentID:        studentID,
		TextContent:      textContent,
		Status:           SubmissionStatusInProgress,
		SubmissionNumber: 1,
		IsFinal:          false,
		CreatedAt:        now,
		UpdatedAt:        now,
		StartedAt:        &now,
		LastModifiedAt:   now,
		GradeStatus:      GradeStatusNotGraded,
		Files:            []uuid.UUID{},
		Grades:           []uuid.UUID{},
		Comments:         []uuid.UUID{},
		IsLate:           false,
		DaysLate:         0,
		PenaltyApplied:   0,
		IsPassing:        false,
	}
}

// Validate valida los datos de la entrega
func (s *AssignmentSubmission) Validate() error {
	if s.TenantID == uuid.Nil {
		return ErrInvalidTenantID
	}
	if s.AssignmentID == uuid.Nil {
		return ErrInvalidAssignmentID
	}
	if s.StudentID == uuid.Nil {
		return ErrInvalidStudentID
	}
	if !ValidateSubmissionStatus(s.Status) {
		return ErrInvalidSubmissionStatus
	}
	if !ValidateGradeStatus(s.GradeStatus) {
		return ErrInvalidGradeStatus
	}
	if s.SubmissionNumber <= 0 {
		return ErrInvalidSubmissionNumber
	}

	return nil
}

// Update actualiza el contenido de la entrega
func (s *AssignmentSubmission) Update(textContent string) error {
	if s.Status == SubmissionStatusSubmitted || s.Status == SubmissionStatusGraded {
		return ErrCannotModifySubmittedSubmission
	}

	s.TextContent = textContent
	s.LastModifiedAt = time.Now().UTC()
	s.UpdatedAt = time.Now().UTC()

	return nil
}

// Submit marca la entrega como enviada
func (s *AssignmentSubmission) Submit(assignment *Assignment) error {
	if s.Status == SubmissionStatusSubmitted {
		return ErrSubmissionAlreadySubmitted
	}

	// Validar que hay contenido o archivos
	if s.TextContent == "" && len(s.Files) == 0 {
		return ErrSubmissionEmpty
	}

	now := time.Now().UTC()
	s.Status = SubmissionStatusSubmitted
	s.SubmittedAt = &now
	s.IsFinal = true
	s.UpdatedAt = now

	// Calcular si es tarde y aplicar penalización
	if assignment.DueDate != nil && now.After(*assignment.DueDate) {
		s.IsLate = true
		duration := now.Sub(*assignment.DueDate)
		s.DaysLate = int(duration.Hours()/24) + 1
		s.PenaltyApplied = assignment.CalculateLatePenalty(now)
		s.Status = SubmissionStatusLateSubmission
	}

	return nil
}

// StartGrading marca la entrega como en revisión
func (s *AssignmentSubmission) StartGrading() error {
	if s.Status != SubmissionStatusSubmitted && s.Status != SubmissionStatusLateSubmission {
		return ErrCannotGradeUnsubmittedSubmission
	}

	s.Status = SubmissionStatusUnderReview
	s.GradeStatus = GradeStatusInProgress
	s.UpdatedAt = time.Now().UTC()

	return nil
}

// Grade califica la entrega
func (s *AssignmentSubmission) Grade(
	totalPointsEarned, totalPointsPossible float64,
	feedback string,
	assignment *Assignment,
) error {
	if s.Status != SubmissionStatusUnderReview &&
	   s.Status != SubmissionStatusSubmitted &&
	   s.Status != SubmissionStatusLateSubmission {
		return ErrCannotGradeUnsubmittedSubmission
	}

	if totalPointsEarned < 0 || totalPointsEarned > totalPointsPossible {
		return ErrInvalidPoints
	}

	now := time.Now().UTC()

	// Aplicar penalización por entrega tardía
	finalPoints := totalPointsEarned
	if s.IsLate && s.PenaltyApplied > 0 {
		penalty := (s.PenaltyApplied / 100) * totalPointsEarned
		finalPoints = totalPointsEarned - penalty
		if finalPoints < 0 {
			finalPoints = 0
		}
	}

	s.TotalPointsEarned = finalPoints
	s.TotalPointsPossible = totalPointsPossible
	s.PercentageGrade = (finalPoints / totalPointsPossible) * 100
	s.LetterGrade = CalculateLetterGrade(s.PercentageGrade)
	s.IsPassing = finalPoints >= assignment.PassingScore
	s.InstructorFeedback = feedback
	s.Status = SubmissionStatusGraded
	s.GradeStatus = GradeStatusCompleted
	s.GradedAt = &now
	s.UpdatedAt = now

	return nil
}

// Return devuelve la entrega al estudiante para correcciones
func (s *AssignmentSubmission) Return(feedback string) error {
	if s.Status != SubmissionStatusUnderReview && s.Status != SubmissionStatusGraded {
		return ErrCannotReturnSubmission
	}

	s.Status = SubmissionStatusReturned
	s.GradeStatus = GradeStatusNeedsRevision
	s.InstructorFeedback = feedback
	s.IsFinal = false
	s.UpdatedAt = time.Now().UTC()

	return nil
}

// Resubmit permite reenviar una entrega devuelta
func (s *AssignmentSubmission) Resubmit(textContent string, assignment *Assignment) error {
	if s.Status != SubmissionStatusReturned {
		return ErrCannotResubmit
	}

	if !assignment.AllowMultipleSubmissions {
		return ErrMultipleSubmissionsNotAllowed
	}

	s.TextContent = textContent
	s.SubmissionNumber++
	s.Status = SubmissionStatusInProgress
	s.GradeStatus = GradeStatusNotGraded
	s.TotalPointsEarned = 0
	s.PercentageGrade = 0
	s.LetterGrade = ""
	s.IsPassing = false
	s.GradedAt = nil
	s.UpdatedAt = time.Now().UTC()
	s.LastModifiedAt = time.Now().UTC()

	return nil
}

// AddFile agrega un archivo a la entrega
func (s *AssignmentSubmission) AddFile(fileID uuid.UUID, assignment *Assignment) error {
	if s.Status == SubmissionStatusSubmitted || s.Status == SubmissionStatusGraded {
		return ErrCannotModifySubmittedSubmission
	}

	if len(s.Files) >= assignment.MaxFiles {
		return ErrMaxFilesExceeded
	}

	s.Files = append(s.Files, fileID)
	s.LastModifiedAt = time.Now().UTC()
	s.UpdatedAt = time.Now().UTC()

	return nil
}

// RemoveFile elimina un archivo de la entrega
func (s *AssignmentSubmission) RemoveFile(fileID uuid.UUID) error {
	if s.Status == SubmissionStatusSubmitted || s.Status == SubmissionStatusGraded {
		return ErrCannotModifySubmittedSubmission
	}

	for i, id := range s.Files {
		if id == fileID {
			s.Files = append(s.Files[:i], s.Files[i+1:]...)
			break
		}
	}

	s.LastModifiedAt = time.Now().UTC()
	s.UpdatedAt = time.Now().UTC()

	return nil
}

// AddGrade agrega una calificación individual
func (s *AssignmentSubmission) AddGrade(gradeID uuid.UUID) {
	s.Grades = append(s.Grades, gradeID)
}

// AddComment agrega un comentario
func (s *AssignmentSubmission) AddComment(commentID uuid.UUID) {
	s.Comments = append(s.Comments, commentID)
}

// SetPlagiarismScore establece el puntaje de plagio
func (s *AssignmentSubmission) SetPlagiarismScore(score float64, report string) {
	s.PlagiarismScore = score
	s.SimilarityReport = report
	s.UpdatedAt = time.Now().UTC()
}

// SetStudentInfo establece la información del estudiante
func (s *AssignmentSubmission) SetStudentInfo(name, email string) {
	s.StudentName = name
	s.StudentEmail = email
}

// SetAssignmentTitle establece el título del assignment
func (s *AssignmentSubmission) SetAssignmentTitle(title string) {
	s.AssignmentTitle = title
}

// CalculateLetterGrade calcula la letra de calificación basada en el porcentaje
func CalculateLetterGrade(percentage float64) string {
	switch {
	case percentage >= 95:
		return "A+"
	case percentage >= 90:
		return "A"
	case percentage >= 85:
		return "A-"
	case percentage >= 80:
		return "B+"
	case percentage >= 75:
		return "B"
	case percentage >= 70:
		return "B-"
	case percentage >= 65:
		return "C+"
	case percentage >= 60:
		return "C"
	case percentage >= 55:
		return "C-"
	case percentage >= 50:
		return "D"
	default:
		return "F"
	}
}
