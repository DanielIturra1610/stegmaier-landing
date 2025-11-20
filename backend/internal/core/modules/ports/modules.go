package ports

import (
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/modules/domain"
	"github.com/google/uuid"
)

// ModuleRepository define las operaciones de persistencia para Modules
type ModuleRepository interface {
	// CRUD operations
	Create(module *domain.Module) error
	GetByID(tenantID, moduleID uuid.UUID) (*domain.Module, error)
	GetByCourseID(tenantID, courseID uuid.UUID) ([]domain.Module, error)
	Update(module *domain.Module) error
	Delete(tenantID, moduleID uuid.UUID) error
	SoftDelete(tenantID, moduleID uuid.UUID) error

	// Query operations
	GetPublishedByCourseID(tenantID, courseID uuid.UUID) ([]domain.Module, error)
	CountByCourseID(tenantID, courseID uuid.UUID) (int, error)
	CountLessonsByModuleID(tenantID, moduleID uuid.UUID) (int, error)

	// Ordering operations
	GetMaxOrder(tenantID, courseID uuid.UUID) (int, error)
	UpdateOrder(tenantID, moduleID uuid.UUID, order int) error
	ReorderModules(tenantID, courseID uuid.UUID, moduleOrders []domain.ModuleOrder) error

	// Progress operations
	CreateProgress(progress *domain.ModuleProgress) error
	GetProgress(tenantID, moduleID, userID uuid.UUID) (*domain.ModuleProgress, error)
	GetUserProgressByCourse(tenantID, courseID, userID uuid.UUID) ([]domain.ModuleProgress, error)
	UpdateProgress(progress *domain.ModuleProgress) error
	RecalculateProgress(tenantID, moduleID, userID uuid.UUID) error
}

// ModuleService define la lógica de negocio para Modules
type ModuleService interface {
	// CRUD operations
	CreateModule(tenantID, userID uuid.UUID, req domain.CreateModuleRequest) (*domain.ModuleResponse, error)
	GetModule(tenantID, moduleID uuid.UUID) (*domain.ModuleResponse, error)
	GetModuleWithLessons(tenantID, moduleID uuid.UUID) (*domain.ModuleWithLessonsResponse, error)
	GetCourseModules(tenantID, courseID uuid.UUID) (*domain.ModuleListResponse, error)
	GetCourseModulesWithProgress(tenantID, courseID, userID uuid.UUID) (*domain.CourseModulesResponse, error)
	UpdateModule(tenantID, userID, moduleID uuid.UUID, req domain.UpdateModuleRequest) (*domain.ModuleResponse, error)
	DeleteModule(tenantID, userID, moduleID uuid.UUID) error

	// Publishing operations
	PublishModule(tenantID, userID, moduleID uuid.UUID) (*domain.ModuleResponse, error)
	UnpublishModule(tenantID, userID, moduleID uuid.UUID) (*domain.ModuleResponse, error)

	// Ordering operations
	ReorderModules(tenantID, userID, courseID uuid.UUID, req domain.ReorderModulesRequest) error

	// Progress operations
	GetModuleProgress(tenantID, moduleID, userID uuid.UUID) (*domain.ModuleProgressResponse, error)
	UpdateModuleProgress(tenantID, moduleID, userID uuid.UUID) (*domain.ModuleProgressResponse, error)
}
