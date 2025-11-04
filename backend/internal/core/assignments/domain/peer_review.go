package domain

import (
	"time"

	"github.com/google/uuid"
)

// PeerReview representa una revisión por pares de una entrega
type PeerReview struct {
	ID           uuid.UUID         `json:"id"`
	TenantID     uuid.UUID         `json:"tenant_id"`
	AssignmentID uuid.UUID         `json:"assignment_id"`
	SubmissionID uuid.UUID         `json:"submission_id"`
	ReviewerID   uuid.UUID         `json:"reviewer_id"`
	ReviewerName string            `json:"reviewer_name,omitempty"`
	Feedback     string            `json:"feedback"`
	Scores       map[string]float64 `json:"scores"`        // Scores por criterio
	OverallScore float64           `json:"overall_score"` // Score promedio
	IsCompleted  bool              `json:"is_completed"`
	IsAnonymous  bool              `json:"is_anonymous"` // Si la revisión es anónima
	AssignedAt   time.Time         `json:"assigned_at"`
	SubmittedAt  *time.Time        `json:"submitted_at,omitempty"`
	DueDate      *time.Time        `json:"due_date,omitempty"`
}

// NewPeerReview crea una nueva revisión por pares
func NewPeerReview(
	tenantID, assignmentID, submissionID, reviewerID uuid.UUID,
	isAnonymous bool,
	dueDate *time.Time,
) *PeerReview {
	return &PeerReview{
		ID:           uuid.New(),
		TenantID:     tenantID,
		AssignmentID: assignmentID,
		SubmissionID: submissionID,
		ReviewerID:   reviewerID,
		IsAnonymous:  isAnonymous,
		IsCompleted:  false,
		AssignedAt:   time.Now().UTC(),
		DueDate:      dueDate,
		Scores:       make(map[string]float64),
	}
}

// Validate valida los datos de la revisión
func (p *PeerReview) Validate() error {
	if p.TenantID == uuid.Nil {
		return ErrInvalidTenantID
	}
	if p.AssignmentID == uuid.Nil {
		return ErrInvalidAssignmentID
	}
	if p.SubmissionID == uuid.Nil {
		return ErrInvalidSubmissionID
	}
	if p.ReviewerID == uuid.Nil {
		return ErrInvalidReviewerID
	}

	return nil
}

// Submit envía la revisión por pares
func (p *PeerReview) Submit(feedback string, scores map[string]float64) error {
	if p.IsCompleted {
		return ErrPeerReviewAlreadySubmitted
	}

	if feedback == "" {
		return ErrInvalidPeerReviewFeedback
	}

	if len(scores) == 0 {
		return ErrInvalidPeerReviewScores
	}

	// Calcular score promedio
	total := 0.0
	for _, score := range scores {
		if score < 0 {
			return ErrInvalidScore
		}
		total += score
	}
	overallScore := total / float64(len(scores))

	now := time.Now().UTC()
	p.Feedback = feedback
	p.Scores = scores
	p.OverallScore = overallScore
	p.IsCompleted = true
	p.SubmittedAt = &now

	return nil
}

// Update actualiza la revisión por pares (solo si no está completada)
func (p *PeerReview) Update(feedback string, scores map[string]float64) error {
	if p.IsCompleted {
		return ErrCannotUpdateCompletedReview
	}

	if feedback != "" {
		p.Feedback = feedback
	}

	if len(scores) > 0 {
		// Actualizar scores
		for criterion, score := range scores {
			if score < 0 {
				return ErrInvalidScore
			}
			p.Scores[criterion] = score
		}

		// Recalcular score promedio
		total := 0.0
		for _, score := range p.Scores {
			total += score
		}
		p.OverallScore = total / float64(len(p.Scores))
	}

	return nil
}

// SetReviewerName establece el nombre del revisor
func (p *PeerReview) SetReviewerName(name string) {
	if !p.IsAnonymous {
		p.ReviewerName = name
	}
}

// IsOverdue verifica si la revisión está vencida
func (p *PeerReview) IsOverdue() bool {
	if p.DueDate == nil {
		return false
	}
	return time.Now().UTC().After(*p.DueDate) && !p.IsCompleted
}

// GetAnonymizedReviewerName obtiene el nombre del revisor (anónimo si corresponde)
func (p *PeerReview) GetAnonymizedReviewerName() string {
	if p.IsAnonymous {
		return "Revisor Anónimo"
	}
	if p.ReviewerName != "" {
		return p.ReviewerName
	}
	return "Revisor"
}
