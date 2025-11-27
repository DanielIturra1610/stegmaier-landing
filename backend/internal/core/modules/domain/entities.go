package domain

import (
	"time"

	"github.com/google/uuid"
)

// Module representa un módulo o sección dentro de un curso
// Agrupa lecciones relacionadas para mejor organización del contenido
type Module struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	TenantID    uuid.UUID  `json:"tenant_id" db:"tenant_id"`
	CourseID    uuid.UUID  `json:"course_id" db:"course_id"`
	Title       string     `json:"title" db:"title"`
	Description *string    `json:"description,omitempty" db:"description"`
	Order       int        `json:"order" db:"order"` // Order within the course
	IsPublished bool       `json:"is_published" db:"is_published"`
	Duration    *int       `json:"duration,omitempty" db:"duration"` // Estimated duration in minutes
	CreatedBy   uuid.UUID  `json:"created_by" db:"created_by"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
	DeletedAt   *time.Time `json:"deleted_at,omitempty" db:"deleted_at"`
}

// ModuleWithLessons representa un módulo con sus lecciones
type ModuleWithLessons struct {
	Module
	LessonCount int `json:"lesson_count"`
	Lessons     []ModuleLesson `json:"lessons,omitempty"`
}

// ModuleLesson representa información básica de una lección dentro de un módulo
type ModuleLesson struct {
	ID          uuid.UUID `json:"id"`
	Title       string    `json:"title"`
	Type        string    `json:"type"`
	Duration    *int      `json:"duration,omitempty"`
	Order       int       `json:"order"`
	IsPublished bool      `json:"is_published"`
}

// ModuleProgress representa el progreso de un usuario en un módulo
type ModuleProgress struct {
	ID                uuid.UUID  `json:"id" db:"id"`
	TenantID          uuid.UUID  `json:"tenant_id" db:"tenant_id"`
	ModuleID          uuid.UUID  `json:"module_id" db:"module_id"`
	UserID            uuid.UUID  `json:"user_id" db:"user_id"`
	CompletedLessons  int        `json:"completed_lessons" db:"completed_lessons"`
	TotalLessons      int        `json:"total_lessons" db:"total_lessons"`
	ProgressPercent   float64    `json:"progress_percent" db:"progress_percent"`
	StartedAt         time.Time  `json:"started_at" db:"started_at"`
	CompletedAt       *time.Time `json:"completed_at,omitempty" db:"completed_at"`
	LastAccessedAt    time.Time  `json:"last_accessed_at" db:"last_accessed_at"`
	CreatedAt         time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at" db:"updated_at"`
}

// IsCompleted verifica si el módulo está completado
func (mp *ModuleProgress) IsCompleted() bool {
	return mp.CompletedAt != nil || mp.ProgressPercent >= 100.0
}

// CalculateProgress calcula el porcentaje de progreso
func (mp *ModuleProgress) CalculateProgress() {
	if mp.TotalLessons > 0 {
		mp.ProgressPercent = (float64(mp.CompletedLessons) / float64(mp.TotalLessons)) * 100.0
	} else {
		mp.ProgressPercent = 0
	}
}
