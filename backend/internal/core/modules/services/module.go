package services

import (
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/modules/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/modules/ports"
	"github.com/google/uuid"
)

// ModuleService implementa la lógica de negocio para Modules
type ModuleService struct {
	repo ports.ModuleRepository
}

// NewModuleService crea una nueva instancia del servicio
func NewModuleService(repo ports.ModuleRepository) ports.ModuleService {
	return &ModuleService{
		repo: repo,
	}
}

// CreateModule crea un nuevo módulo
func (s *ModuleService) CreateModule(tenantID, userID uuid.UUID, req domain.CreateModuleRequest) (*domain.ModuleResponse, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	// Si no se especifica orden, obtener el siguiente
	if req.Order == 0 {
		maxOrder, err := s.repo.GetMaxOrder(tenantID, req.CourseID)
		if err != nil {
			return nil, err
		}
		req.Order = maxOrder + 1
	}

	module := &domain.Module{
		ID:          uuid.New(),
		TenantID:    tenantID,
		CourseID:    req.CourseID,
		Title:       req.Title,
		Description: req.Description,
		Order:       req.Order,
		IsPublished: req.IsPublished,
		Duration:    req.Duration,
		CreatedBy:   userID,
	}

	if err := s.repo.Create(module); err != nil {
		return nil, err
	}

	return s.toResponse(module, 0), nil
}

// GetModule obtiene un módulo por ID
func (s *ModuleService) GetModule(tenantID, moduleID uuid.UUID) (*domain.ModuleResponse, error) {
	module, err := s.repo.GetByID(tenantID, moduleID)
	if err != nil {
		return nil, err
	}

	lessonCount, _ := s.repo.CountLessonsByModuleID(tenantID, moduleID)
	return s.toResponse(module, lessonCount), nil
}

// GetModuleWithLessons obtiene un módulo con sus lecciones (stub - requires lessons repo)
func (s *ModuleService) GetModuleWithLessons(tenantID, moduleID uuid.UUID) (*domain.ModuleWithLessonsResponse, error) {
	module, err := s.repo.GetByID(tenantID, moduleID)
	if err != nil {
		return nil, err
	}

	lessonCount, _ := s.repo.CountLessonsByModuleID(tenantID, moduleID)

	response := &domain.ModuleWithLessonsResponse{
		ModuleResponse: *s.toResponse(module, lessonCount),
		Lessons:        []domain.LessonSummary{}, // TODO: Fetch from lessons repo
	}

	return response, nil
}

// GetCourseModules obtiene todos los módulos de un curso
func (s *ModuleService) GetCourseModules(tenantID, courseID uuid.UUID) (*domain.ModuleListResponse, error) {
	modules, err := s.repo.GetByCourseID(tenantID, courseID)
	if err != nil {
		return nil, err
	}

	responses := make([]domain.ModuleResponse, len(modules))
	for i, module := range modules {
		lessonCount, _ := s.repo.CountLessonsByModuleID(tenantID, module.ID)
		responses[i] = *s.toResponse(&module, lessonCount)
	}

	return &domain.ModuleListResponse{
		Modules: responses,
		Total:   int64(len(responses)),
	}, nil
}

// GetCourseModulesWithProgress obtiene módulos con progreso del usuario
func (s *ModuleService) GetCourseModulesWithProgress(tenantID, courseID, userID uuid.UUID) (*domain.CourseModulesResponse, error) {
	modules, err := s.repo.GetByCourseID(tenantID, courseID)
	if err != nil {
		return nil, err
	}

	responses := make([]domain.ModuleResponse, len(modules))
	progressByModule := make(map[string]domain.ModuleProgressResponse)
	completedCount := 0

	for i, module := range modules {
		lessonCount, _ := s.repo.CountLessonsByModuleID(tenantID, module.ID)
		responses[i] = *s.toResponse(&module, lessonCount)

		// Obtener progreso
		progress, err := s.repo.GetProgress(tenantID, module.ID, userID)
		if err == nil {
			progressResp := s.toProgressResponse(progress, module.Title)
			progressByModule[module.ID.String()] = *progressResp
			if progress.IsCompleted() {
				completedCount++
			}
		}
	}

	return &domain.CourseModulesResponse{
		CourseID:         courseID,
		Modules:          responses,
		ProgressByModule: progressByModule,
		TotalModules:     len(modules),
		CompletedModules: completedCount,
	}, nil
}

// UpdateModule actualiza un módulo
func (s *ModuleService) UpdateModule(tenantID, userID, moduleID uuid.UUID, req domain.UpdateModuleRequest) (*domain.ModuleResponse, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	module, err := s.repo.GetByID(tenantID, moduleID)
	if err != nil {
		return nil, err
	}

	// Actualizar campos
	if req.Title != nil {
		module.Title = *req.Title
	}
	if req.Description != nil {
		module.Description = req.Description
	}
	if req.Order != nil {
		module.Order = *req.Order
	}
	if req.Duration != nil {
		module.Duration = req.Duration
	}
	if req.IsPublished != nil {
		module.IsPublished = *req.IsPublished
	}

	if err := s.repo.Update(module); err != nil {
		return nil, err
	}

	lessonCount, _ := s.repo.CountLessonsByModuleID(tenantID, moduleID)
	return s.toResponse(module, lessonCount), nil
}

// DeleteModule elimina un módulo
func (s *ModuleService) DeleteModule(tenantID, userID, moduleID uuid.UUID) error {
	// Verificar que no tenga lecciones
	lessonCount, err := s.repo.CountLessonsByModuleID(tenantID, moduleID)
	if err != nil {
		return err
	}

	if lessonCount > 0 {
		return domain.ErrCannotDeleteModule
	}

	return s.repo.SoftDelete(tenantID, moduleID)
}

// PublishModule publica un módulo
func (s *ModuleService) PublishModule(tenantID, userID, moduleID uuid.UUID) (*domain.ModuleResponse, error) {
	module, err := s.repo.GetByID(tenantID, moduleID)
	if err != nil {
		return nil, err
	}

	module.IsPublished = true
	if err := s.repo.Update(module); err != nil {
		return nil, err
	}

	lessonCount, _ := s.repo.CountLessonsByModuleID(tenantID, moduleID)
	return s.toResponse(module, lessonCount), nil
}

// UnpublishModule despublica un módulo
func (s *ModuleService) UnpublishModule(tenantID, userID, moduleID uuid.UUID) (*domain.ModuleResponse, error) {
	module, err := s.repo.GetByID(tenantID, moduleID)
	if err != nil {
		return nil, err
	}

	module.IsPublished = false
	if err := s.repo.Update(module); err != nil {
		return nil, err
	}

	lessonCount, _ := s.repo.CountLessonsByModuleID(tenantID, moduleID)
	return s.toResponse(module, lessonCount), nil
}

// ReorderModules reordena los módulos de un curso
func (s *ModuleService) ReorderModules(tenantID, userID, courseID uuid.UUID, req domain.ReorderModulesRequest) error {
	if err := req.Validate(); err != nil {
		return err
	}

	return s.repo.ReorderModules(tenantID, courseID, req.ModuleOrders)
}

// GetModuleProgress obtiene el progreso de un usuario en un módulo
func (s *ModuleService) GetModuleProgress(tenantID, moduleID, userID uuid.UUID) (*domain.ModuleProgressResponse, error) {
	module, err := s.repo.GetByID(tenantID, moduleID)
	if err != nil {
		return nil, err
	}

	progress, err := s.repo.GetProgress(tenantID, moduleID, userID)
	if err != nil {
		if err == domain.ErrProgressNotFound {
			// Crear progreso inicial
			progress = &domain.ModuleProgress{
				TenantID:         tenantID,
				ModuleID:         moduleID,
				UserID:           userID,
				CompletedLessons: 0,
				TotalLessons:     0,
			}

			// Contar lecciones totales
			totalLessons, _ := s.repo.CountLessonsByModuleID(tenantID, moduleID)
			progress.TotalLessons = totalLessons

			if err := s.repo.CreateProgress(progress); err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	}

	return s.toProgressResponse(progress, module.Title), nil
}

// UpdateModuleProgress actualiza el progreso de un usuario en un módulo
func (s *ModuleService) UpdateModuleProgress(tenantID, moduleID, userID uuid.UUID) (*domain.ModuleProgressResponse, error) {
	module, err := s.repo.GetByID(tenantID, moduleID)
	if err != nil {
		return nil, err
	}

	// Recalcular progreso basado en lecciones
	if err := s.repo.RecalculateProgress(tenantID, moduleID, userID); err != nil {
		return nil, err
	}

	progress, err := s.repo.GetProgress(tenantID, moduleID, userID)
	if err != nil {
		return nil, err
	}

	return s.toProgressResponse(progress, module.Title), nil
}

// ============================================================
// Helper Methods
// ============================================================

// toResponse convierte un módulo a ModuleResponse
func (s *ModuleService) toResponse(module *domain.Module, lessonCount int) *domain.ModuleResponse {
	return &domain.ModuleResponse{
		ID:          module.ID,
		TenantID:    module.TenantID,
		CourseID:    module.CourseID,
		Title:       module.Title,
		Description: module.Description,
		Order:       module.Order,
		IsPublished: module.IsPublished,
		Duration:    module.Duration,
		LessonCount: lessonCount,
		CreatedBy:   module.CreatedBy,
		CreatedAt:   module.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:   module.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

// toProgressResponse convierte progreso a ModuleProgressResponse
func (s *ModuleService) toProgressResponse(progress *domain.ModuleProgress, moduleTitle string) *domain.ModuleProgressResponse {
	response := &domain.ModuleProgressResponse{
		ID:               progress.ID,
		ModuleID:         progress.ModuleID,
		ModuleTitle:      moduleTitle,
		UserID:           progress.UserID,
		CompletedLessons: progress.CompletedLessons,
		TotalLessons:     progress.TotalLessons,
		ProgressPercent:  progress.ProgressPercent,
		IsCompleted:      progress.IsCompleted(),
		StartedAt:        progress.StartedAt.Format("2006-01-02T15:04:05Z07:00"),
		LastAccessedAt:   progress.LastAccessedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	if progress.CompletedAt != nil {
		completedAt := progress.CompletedAt.Format("2006-01-02T15:04:05Z07:00")
		response.CompletedAt = &completedAt
	}

	return response
}
