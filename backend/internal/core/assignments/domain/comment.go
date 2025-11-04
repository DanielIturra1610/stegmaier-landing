package domain

import (
	"time"

	"github.com/google/uuid"
)

// SubmissionComment representa un comentario en una entrega
type SubmissionComment struct {
	ID           uuid.UUID `json:"id"`
	SubmissionID uuid.UUID `json:"submission_id"`
	AuthorID     uuid.UUID `json:"author_id"`
	AuthorName   string    `json:"author_name,omitempty"`
	AuthorRole   string    `json:"author_role"`
	Content      string    `json:"content"`
	IsPrivate    bool      `json:"is_private"` // Solo visible para instructores
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	// Audit
	TenantID uuid.UUID `json:"tenant_id"`
}

// NewSubmissionComment crea un nuevo comentario
func NewSubmissionComment(
	tenantID, submissionID, authorID uuid.UUID,
	authorRole, content string,
	isPrivate bool,
) *SubmissionComment {
	return &SubmissionComment{
		ID:           uuid.New(),
		TenantID:     tenantID,
		SubmissionID: submissionID,
		AuthorID:     authorID,
		AuthorRole:   authorRole,
		Content:      content,
		IsPrivate:    isPrivate,
		CreatedAt:    time.Now().UTC(),
		UpdatedAt:    time.Now().UTC(),
	}
}

// Validate valida los datos del comentario
func (c *SubmissionComment) Validate() error {
	if c.TenantID == uuid.Nil {
		return ErrInvalidTenantID
	}
	if c.SubmissionID == uuid.Nil {
		return ErrInvalidSubmissionID
	}
	if c.AuthorID == uuid.Nil {
		return ErrInvalidUserID
	}
	if c.AuthorRole == "" {
		return ErrInvalidAuthorRole
	}
	if c.Content == "" {
		return ErrInvalidCommentContent
	}
	if len(c.Content) < 1 {
		return ErrCommentTooShort
	}
	if len(c.Content) > 5000 {
		return ErrCommentTooLong
	}

	return nil
}

// Update actualiza el contenido del comentario
func (c *SubmissionComment) Update(content string) error {
	if content == "" {
		return ErrInvalidCommentContent
	}
	if len(content) < 1 {
		return ErrCommentTooShort
	}
	if len(content) > 5000 {
		return ErrCommentTooLong
	}

	c.Content = content
	c.UpdatedAt = time.Now().UTC()
	return nil
}

// SetAuthorName establece el nombre del autor
func (c *SubmissionComment) SetAuthorName(name string) {
	c.AuthorName = name
}

// IsVisibleTo determina si el comentario es visible para un usuario
func (c *SubmissionComment) IsVisibleTo(userID uuid.UUID, isInstructor bool) bool {
	// Los comentarios privados solo son visibles para instructores
	if c.IsPrivate && !isInstructor {
		return false
	}
	return true
}
