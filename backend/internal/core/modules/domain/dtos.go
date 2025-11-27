package domain

import (
	"strings"

	"github.com/google/uuid"
)

// CreateModuleRequest representa una solicitud de creación de módulo
type CreateModuleRequest struct {
	CourseID    uuid.UUID `json:"course_id"`
	Title       string    `json:"title"`
	Description *string   `json:"description,omitempty"`
	Order       int       `json:"order"`
	Duration    *int      `json:"duration,omitempty"`
	IsPublished bool      `json:"is_published"`
}

// Validate valida la solicitud de creación
func (r *CreateModuleRequest) Validate() error {
	if r.CourseID == uuid.Nil {
		return ErrInvalidCourseID
	}

	title := strings.TrimSpace(r.Title)
	if title == "" {
		return ErrInvalidTitle
	}
	if len(title) < MinTitleLength {
		return ErrInvalidTitle
	}
	if len(title) > MaxTitleLength {
		return ErrTitleTooLong
	}

	if r.Description != nil {
		desc := strings.TrimSpace(*r.Description)
		if len(desc) > MaxDescriptionLength {
			return ErrDescriptionTooLong
		}
	}

	if r.Order < 0 {
		return ErrInvalidOrder
	}

	if r.Duration != nil && *r.Duration < 0 {
		return ErrInvalidDuration
	}

	return nil
}

// UpdateModuleRequest representa una solicitud de actualización de módulo
type UpdateModuleRequest struct {
	Title       *string `json:"title,omitempty"`
	Description *string `json:"description,omitempty"`
	Order       *int    `json:"order,omitempty"`
	Duration    *int    `json:"duration,omitempty"`
	IsPublished *bool   `json:"is_published,omitempty"`
}

// Validate valida la solicitud de actualización
func (r *UpdateModuleRequest) Validate() error {
	if r.Title != nil {
		title := strings.TrimSpace(*r.Title)
		if title == "" {
			return ErrInvalidTitle
		}
		if len(title) < MinTitleLength {
			return ErrInvalidTitle
		}
		if len(title) > MaxTitleLength {
			return ErrTitleTooLong
		}
	}

	if r.Description != nil {
		desc := strings.TrimSpace(*r.Description)
		if len(desc) > MaxDescriptionLength {
			return ErrDescriptionTooLong
		}
	}

	if r.Order != nil && *r.Order < 0 {
		return ErrInvalidOrder
	}

	if r.Duration != nil && *r.Duration < 0 {
		return ErrInvalidDuration
	}

	return nil
}

// ReorderModulesRequest representa una solicitud de reordenamiento de módulos
type ReorderModulesRequest struct {
	ModuleOrders []ModuleOrder `json:"module_orders"`
}

// ModuleOrder representa el orden de un módulo
type ModuleOrder struct {
	ModuleID uuid.UUID `json:"module_id"`
	Order    int       `json:"order"`
}

// Validate valida la solicitud de reordenamiento
func (r *ReorderModulesRequest) Validate() error {
	if len(r.ModuleOrders) == 0 {
		return ErrMissingRequiredField
	}

	for _, mo := range r.ModuleOrders {
		if mo.ModuleID == uuid.Nil {
			return ErrModuleNotFound
		}
		if mo.Order < 0 {
			return ErrInvalidOrder
		}
	}

	return nil
}

// ModuleResponse representa la respuesta de un módulo
type ModuleResponse struct {
	ID          uuid.UUID `json:"id"`
	TenantID    uuid.UUID `json:"tenant_id"`
	CourseID    uuid.UUID `json:"course_id"`
	Title       string    `json:"title"`
	Description *string   `json:"description,omitempty"`
	Order       int       `json:"order"`
	IsPublished bool      `json:"is_published"`
	Duration    *int      `json:"duration,omitempty"`
	LessonCount int       `json:"lesson_count"`
	CreatedBy   uuid.UUID `json:"created_by"`
	CreatedAt   string    `json:"created_at"`
	UpdatedAt   string    `json:"updated_at"`
}

// ModuleWithLessonsResponse representa la respuesta de un módulo con sus lecciones
type ModuleWithLessonsResponse struct {
	ModuleResponse
	Lessons []LessonSummary `json:"lessons"`
}

// LessonSummary representa un resumen de una lección
type LessonSummary struct {
	ID          uuid.UUID `json:"id"`
	Title       string    `json:"title"`
	Type        string    `json:"type"`
	Duration    *int      `json:"duration,omitempty"`
	Order       int       `json:"order"`
	IsPublished bool      `json:"is_published"`
	IsFree      bool      `json:"is_free"`
}

// ModuleListResponse representa una lista de módulos
type ModuleListResponse struct {
	Modules []ModuleResponse `json:"modules"`
	Total   int64            `json:"total"`
}

// ModuleProgressResponse representa la respuesta del progreso en un módulo
type ModuleProgressResponse struct {
	ID               uuid.UUID `json:"id"`
	ModuleID         uuid.UUID `json:"module_id"`
	ModuleTitle      string    `json:"module_title"`
	UserID           uuid.UUID `json:"user_id"`
	CompletedLessons int       `json:"completed_lessons"`
	TotalLessons     int       `json:"total_lessons"`
	ProgressPercent  float64   `json:"progress_percent"`
	IsCompleted      bool      `json:"is_completed"`
	StartedAt        string    `json:"started_at"`
	CompletedAt      *string   `json:"completed_at,omitempty"`
	LastAccessedAt   string    `json:"last_accessed_at"`
}

// CourseModulesResponse representa la respuesta de módulos de un curso con progreso
type CourseModulesResponse struct {
	CourseID        uuid.UUID                `json:"course_id"`
	Modules         []ModuleResponse         `json:"modules"`
	ProgressByModule map[string]ModuleProgressResponse `json:"progress_by_module,omitempty"` // Key: module_id
	TotalModules    int                      `json:"total_modules"`
	CompletedModules int                     `json:"completed_modules"`
}
