package domain

import (
	"time"

	"github.com/google/uuid"
)

// SubmissionGrade representa una calificación de una entrega
type SubmissionGrade struct {
	ID              uuid.UUID  `json:"id"`
	SubmissionID    uuid.UUID  `json:"submission_id"`
	CriterionID     *uuid.UUID `json:"criterion_id,omitempty"`     // Referencia al criterio de la rúbrica
	CriterionName   string     `json:"criterion_name,omitempty"`   // Nombre del criterio
	PointsEarned    float64    `json:"points_earned"`              // Puntos obtenidos
	PointsPossible  float64    `json:"points_possible"`            // Puntos posibles
	Feedback        string     `json:"feedback,omitempty"`         // Retroalimentación específica
	GraderID        uuid.UUID  `json:"grader_id"`                  // Quien calificó
	GraderName      string     `json:"grader_name,omitempty"`      // Nombre del calificador
	GradedAt        time.Time  `json:"graded_at"`                  // Cuándo se calificó

	// Audit
	TenantID uuid.UUID `json:"tenant_id"`
}

// NewSubmissionGrade crea una nueva calificación
func NewSubmissionGrade(
	tenantID, submissionID, graderID uuid.UUID,
	pointsEarned, pointsPossible float64,
	feedback string,
) *SubmissionGrade {
	return &SubmissionGrade{
		ID:             uuid.New(),
		TenantID:       tenantID,
		SubmissionID:   submissionID,
		PointsEarned:   pointsEarned,
		PointsPossible: pointsPossible,
		Feedback:       feedback,
		GraderID:       graderID,
		GradedAt:       time.Now().UTC(),
	}
}

// NewSubmissionGradeWithCriterion crea una calificación asociada a un criterio de rúbrica
func NewSubmissionGradeWithCriterion(
	tenantID, submissionID, graderID, criterionID uuid.UUID,
	criterionName string,
	pointsEarned, pointsPossible float64,
	feedback string,
) *SubmissionGrade {
	grade := NewSubmissionGrade(tenantID, submissionID, graderID, pointsEarned, pointsPossible, feedback)
	grade.CriterionID = &criterionID
	grade.CriterionName = criterionName
	return grade
}

// Validate valida los datos de la calificación
func (g *SubmissionGrade) Validate() error {
	if g.TenantID == uuid.Nil {
		return ErrInvalidTenantID
	}
	if g.SubmissionID == uuid.Nil {
		return ErrInvalidSubmissionID
	}
	if g.GraderID == uuid.Nil {
		return ErrInvalidGraderID
	}
	if g.PointsEarned < 0 {
		return ErrInvalidPoints
	}
	if g.PointsPossible <= 0 {
		return ErrInvalidPoints
	}
	if g.PointsEarned > g.PointsPossible {
		return ErrPointsExceedMaximum
	}

	return nil
}

// SetGraderName establece el nombre del calificador
func (g *SubmissionGrade) SetGraderName(name string) {
	g.GraderName = name
}

// GetPercentage calcula el porcentaje de la calificación
func (g *SubmissionGrade) GetPercentage() float64 {
	if g.PointsPossible == 0 {
		return 0
	}
	return (g.PointsEarned / g.PointsPossible) * 100
}

// Update actualiza la calificación
func (g *SubmissionGrade) Update(pointsEarned float64, feedback string) error {
	if pointsEarned < 0 {
		return ErrInvalidPoints
	}
	if pointsEarned > g.PointsPossible {
		return ErrPointsExceedMaximum
	}

	g.PointsEarned = pointsEarned
	if feedback != "" {
		g.Feedback = feedback
	}
	g.GradedAt = time.Now().UTC()

	return nil
}
