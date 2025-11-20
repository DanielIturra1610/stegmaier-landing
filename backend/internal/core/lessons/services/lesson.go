package services

import (
	"context"
	"fmt"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/lessons/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/lessons/ports"
	moduleports "github.com/DanielIturra1610/stegmaier-landing/internal/core/modules/ports"
	"github.com/google/uuid"
)

// LessonServiceImpl implements the LessonService interface
type LessonServiceImpl struct {
	lessonRepo ports.LessonRepository
	moduleRepo moduleports.ModuleRepository
	// TODO: Add CourseRepository when implementing enrollment checks
}

// NewLessonService creates a new lesson service instance
func NewLessonService(lessonRepo ports.LessonRepository, moduleRepo moduleports.ModuleRepository) ports.LessonService {
	return &LessonServiceImpl{
		lessonRepo: lessonRepo,
		moduleRepo: moduleRepo,
	}
}

// CreateLesson creates a new lesson
func (s *LessonServiceImpl) CreateLesson(ctx context.Context, tenantID uuid.UUID, req *domain.CreateLessonRequest) (*domain.LessonDetailResponse, error) {
	// Validate request
	if err := req.Validate(); err != nil {
		return nil, ports.NewLessonError("CreateLesson", err, "invalid lesson data")
	}

	// TODO: Validate that course exists and instructor has access
	// This will require CourseRepository dependency

	// Get max order index if not provided
	if req.OrderIndex == 0 {
		maxOrder, err := s.lessonRepo.GetMaxOrderIndex(ctx, req.CourseID, tenantID)
		if err != nil {
			// If no lessons exist, start from 0
			maxOrder = -1
		}
		req.OrderIndex = maxOrder + 1
	}

	// TODO: Validate quiz exists if QuizID is provided
	// This will require QuizRepository dependency

	// Validate that module exists and belongs to the course
	module, err := s.moduleRepo.GetByID(tenantID, req.ModuleID)
	if err != nil {
		return nil, ports.NewLessonError("CreateLesson", err, fmt.Sprintf("module with ID %s not found", req.ModuleID))
	}
	if module.CourseID != req.CourseID {
		return nil, ports.NewLessonError("CreateLesson", ports.ErrInvalidLessonData, fmt.Sprintf("module %s does not belong to course %s", req.ModuleID, req.CourseID))
	}

	// Create lesson entity
	lesson := &domain.Lesson{
		ID:          uuid.New(),
		TenantID:    tenantID,
		CourseID:    req.CourseID,
		ModuleID:    &req.ModuleID,
		Title:       req.Title,
		Description: req.Description,
		ContentType: req.ContentType,
		ContentURL:  req.ContentURL,
		Content:     req.Content,
		Duration:    req.Duration,
		OrderIndex:  req.OrderIndex,
		IsPublished: req.IsPublished,
		IsFree:      req.IsFree,
		QuizID:      req.QuizID,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Create lesson
	if err := s.lessonRepo.Create(ctx, lesson); err != nil {
		return nil, ports.NewLessonError("CreateLesson", ports.ErrLessonCreationFailed, err.Error())
	}

	// Convert to response
	response := &domain.LessonDetailResponse{}
	response.FromEntity(lesson)

	return response, nil
}

// UpdateLesson updates an existing lesson
func (s *LessonServiceImpl) UpdateLesson(ctx context.Context, lessonID, tenantID uuid.UUID, req *domain.UpdateLessonRequest) (*domain.LessonDetailResponse, error) {
	// Validate request
	if err := req.Validate(); err != nil {
		return nil, ports.NewLessonError("UpdateLesson", err, "invalid lesson data")
	}

	// Get existing lesson
	lesson, err := s.lessonRepo.GetByID(ctx, lessonID, tenantID)
	if err != nil {
		return nil, ports.NewLessonError("UpdateLesson", err, "failed to get lesson")
	}

	// Check if lesson is deleted
	if lesson.DeletedAt != nil {
		return nil, ports.NewLessonError("UpdateLesson", ports.ErrLessonDeleted, "lesson has been deleted")
	}

	// TODO: Validate that instructor has access to this lesson
	// This will require CourseRepository to check ownership

	// Update fields if provided
	if req.ModuleID != nil {
		// Validate module exists and belongs to the same course
		module, err := s.moduleRepo.GetByID(tenantID, *req.ModuleID)
		if err != nil {
			return nil, ports.NewLessonError("UpdateLesson", err, fmt.Sprintf("module with ID %s not found", *req.ModuleID))
		}
		if module.CourseID != lesson.CourseID {
			return nil, ports.NewLessonError("UpdateLesson", ports.ErrInvalidLessonData, fmt.Sprintf("module %s does not belong to course %s", *req.ModuleID, lesson.CourseID))
		}
		lesson.ModuleID = req.ModuleID
	}
	if req.Title != nil {
		lesson.Title = *req.Title
	}
	if req.Description != nil {
		lesson.Description = req.Description
	}
	if req.ContentType != nil {
		lesson.ContentType = *req.ContentType
	}
	if req.ContentURL != nil {
		lesson.ContentURL = req.ContentURL
	}
	if req.Content != nil {
		lesson.Content = req.Content
	}
	if req.Duration != nil {
		lesson.Duration = req.Duration
	}
	if req.OrderIndex != nil {
		lesson.OrderIndex = *req.OrderIndex
	}
	if req.IsPublished != nil {
		lesson.IsPublished = *req.IsPublished
	}
	if req.IsFree != nil {
		lesson.IsFree = *req.IsFree
	}
	if req.QuizID != nil {
		// TODO: Validate quiz exists
		lesson.QuizID = req.QuizID
	}

	lesson.UpdatedAt = time.Now()

	// Validate updated lesson
	if err := lesson.Validate(); err != nil {
		return nil, ports.NewLessonError("UpdateLesson", err, "invalid lesson data after update")
	}

	// Update lesson
	if err := s.lessonRepo.Update(ctx, lesson); err != nil {
		return nil, ports.NewLessonError("UpdateLesson", ports.ErrLessonUpdateFailed, err.Error())
	}

	// Convert to response
	response := &domain.LessonDetailResponse{}
	response.FromEntity(lesson)

	return response, nil
}

// DeleteLesson soft deletes a lesson
func (s *LessonServiceImpl) DeleteLesson(ctx context.Context, lessonID, tenantID uuid.UUID) error {
	// Check if lesson exists
	exists, err := s.lessonRepo.Exists(ctx, lessonID, tenantID)
	if err != nil {
		return ports.NewLessonError("DeleteLesson", err, "failed to check lesson existence")
	}
	if !exists {
		return ports.NewLessonError("DeleteLesson", ports.ErrLessonNotFound, "lesson not found")
	}

	// TODO: Validate that instructor has access to this lesson

	// Delete lesson
	if err := s.lessonRepo.Delete(ctx, lessonID, tenantID); err != nil {
		return ports.NewLessonError("DeleteLesson", ports.ErrLessonDeletionFailed, err.Error())
	}

	return nil
}

// ReorderLessons reorders lessons within a course
func (s *LessonServiceImpl) ReorderLessons(ctx context.Context, courseID, tenantID uuid.UUID, req *domain.ReorderLessonsRequest) error {
	// Validate request
	if err := req.Validate(); err != nil {
		return ports.NewLessonError("ReorderLessons", err, "invalid reorder request")
	}

	// TODO: Validate that instructor has access to this course

	// Verify all lessons belong to the course
	for _, order := range req.LessonOrders {
		lesson, err := s.lessonRepo.GetByID(ctx, order.LessonID, tenantID)
		if err != nil {
			return ports.NewLessonError("ReorderLessons", ports.ErrLessonNotFound, "lesson not found: "+order.LessonID.String())
		}
		if lesson.CourseID != courseID {
			return ports.NewLessonError("ReorderLessons", ports.ErrInvalidLessonData, "lesson does not belong to this course")
		}
	}

	// Reorder lessons
	if err := s.lessonRepo.ReorderLessons(ctx, courseID, tenantID, req.LessonOrders); err != nil {
		return ports.NewLessonError("ReorderLessons", ports.ErrReorderFailed, err.Error())
	}

	return nil
}

// GetLesson retrieves a lesson by ID
func (s *LessonServiceImpl) GetLesson(ctx context.Context, lessonID, tenantID uuid.UUID, userID *uuid.UUID) (*domain.LessonDetailResponse, error) {
	// Get lesson
	lesson, err := s.lessonRepo.GetByID(ctx, lessonID, tenantID)
	if err != nil {
		return nil, ports.NewLessonError("GetLesson", err, "failed to get lesson")
	}

	// Check if lesson is deleted
	if lesson.DeletedAt != nil {
		return nil, ports.NewLessonError("GetLesson", ports.ErrLessonDeleted, "lesson has been deleted")
	}

	// Check if lesson is published (unless it's free or user is enrolled)
	if !lesson.IsPublished && !lesson.IsFree {
		// TODO: Check if user is enrolled in the course or is the instructor
		// For now, return error if not published and not free
		if userID == nil {
			return nil, ports.NewLessonError("GetLesson", ports.ErrLessonNotPublished, "lesson is not published")
		}
		// TODO: Check enrollment status
	}

	// If lesson is not free and user is not enrolled, restrict content
	// TODO: Implement enrollment check
	if !lesson.IsFree && userID == nil {
		return nil, ports.NewLessonError("GetLesson", ports.ErrLessonNotFree, "lesson requires enrollment")
	}

	// Convert to response
	response := &domain.LessonDetailResponse{}
	response.FromEntity(lesson)

	return response, nil
}

// GetLessonsByCourse retrieves lessons for a course
func (s *LessonServiceImpl) GetLessonsByCourse(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) (*domain.ListLessonsResponse, error) {
	// Validate pagination
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Get lessons
	lessons, total, err := s.lessonRepo.GetByCourseID(ctx, courseID, tenantID, page, pageSize)
	if err != nil {
		return nil, ports.NewLessonError("GetLessonsByCourse", err, "failed to get lessons")
	}

	// Convert to responses
	lessonResponses := make([]domain.LessonResponse, 0, len(lessons))
	for _, lesson := range lessons {
		response := domain.LessonResponse{}
		response.FromEntity(&lesson)
		lessonResponses = append(lessonResponses, response)
	}

	// Calculate total pages
	totalPages := (total + pageSize - 1) / pageSize

	return &domain.ListLessonsResponse{
		Lessons:    lessonResponses,
		TotalCount: total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

// GetLessonsWithProgress retrieves lessons with user progress
func (s *LessonServiceImpl) GetLessonsWithProgress(ctx context.Context, courseID, userID, tenantID uuid.UUID, page, pageSize int) (*domain.ListLessonsWithProgressResponse, error) {
	// Validate pagination
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// TODO: Validate that user is enrolled in the course

	// Get lessons
	lessons, total, err := s.lessonRepo.GetByCourseID(ctx, courseID, tenantID, page, pageSize)
	if err != nil {
		return nil, ports.NewLessonError("GetLessonsWithProgress", err, "failed to get lessons")
	}

	// Get completions for all lessons
	completions, err := s.lessonRepo.GetCompletionsByCourse(ctx, courseID, userID, tenantID)
	if err != nil {
		return nil, ports.NewLessonError("GetLessonsWithProgress", err, "failed to get completions")
	}

	// Create a map of lesson ID to completion
	completionMap := make(map[uuid.UUID]*domain.LessonCompletion)
	for i := range completions {
		completionMap[completions[i].LessonID] = &completions[i]
	}

	// Convert to responses
	lessonResponses := make([]domain.LessonWithProgressResponse, 0, len(lessons))
	for _, lesson := range lessons {
		lessonResponse := domain.LessonResponse{}
		lessonResponse.FromEntity(&lesson)

		var completionResponse *domain.LessonCompletionResponse
		if completion, ok := completionMap[lesson.ID]; ok {
			completionResponse = &domain.LessonCompletionResponse{}
			completionResponse.FromEntity(completion)
		}

		lessonResponses = append(lessonResponses, domain.LessonWithProgressResponse{
			Lesson:     lessonResponse,
			Completion: completionResponse,
		})
	}

	// Calculate total pages
	totalPages := (total + pageSize - 1) / pageSize

	return &domain.ListLessonsWithProgressResponse{
		Lessons:    lessonResponses,
		TotalCount: total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

// MarkLessonComplete marks a lesson as complete or updates progress
func (s *LessonServiceImpl) MarkLessonComplete(ctx context.Context, lessonID, userID, tenantID uuid.UUID, req *domain.MarkLessonCompleteRequest) error {
	// Validate request
	if err := req.Validate(); err != nil {
		return ports.NewLessonError("MarkLessonComplete", err, "invalid completion request")
	}

	// Verify lesson exists and is published
	lesson, err := s.lessonRepo.GetByID(ctx, lessonID, tenantID)
	if err != nil {
		return ports.NewLessonError("MarkLessonComplete", err, "failed to get lesson")
	}

	if lesson.DeletedAt != nil {
		return ports.NewLessonError("MarkLessonComplete", ports.ErrLessonDeleted, "lesson has been deleted")
	}

	// TODO: Verify user is enrolled in the course

	// Check if completion record exists
	exists, err := s.lessonRepo.CompletionExists(ctx, lessonID, userID, tenantID)
	if err != nil {
		return ports.NewLessonError("MarkLessonComplete", err, "failed to check completion existence")
	}

	if !exists {
		// Create new completion record
		completion := &domain.LessonCompletion{
			ID:                uuid.New(),
			TenantID:          tenantID,
			LessonID:          lessonID,
			UserID:            userID,
			IsCompleted:       req.CompletionPercent == 100,
			TimeSpent:         req.TimeSpent,
			CompletionPercent: req.CompletionPercent,
			CreatedAt:         time.Now(),
			UpdatedAt:         time.Now(),
		}

		now := time.Now()
		completion.LastAccessedAt = &now
		if req.CompletionPercent == 100 {
			completion.CompletedAt = &now
		}

		if err := s.lessonRepo.CreateCompletion(ctx, completion); err != nil {
			return ports.NewLessonError("MarkLessonComplete", ports.ErrCompletionCreationFailed, err.Error())
		}
	} else {
		// Update existing completion
		completion, err := s.lessonRepo.GetCompletion(ctx, lessonID, userID, tenantID)
		if err != nil {
			return ports.NewLessonError("MarkLessonComplete", err, "failed to get completion")
		}

		if err := completion.UpdateProgress(req.CompletionPercent, req.TimeSpent); err != nil {
			return ports.NewLessonError("MarkLessonComplete", err, "failed to update progress")
		}

		if err := s.lessonRepo.UpdateCompletion(ctx, completion); err != nil {
			return ports.NewLessonError("MarkLessonComplete", ports.ErrCompletionUpdateFailed, err.Error())
		}
	}

	return nil
}

// GetLessonCompletion retrieves lesson completion for a user
func (s *LessonServiceImpl) GetLessonCompletion(ctx context.Context, lessonID, userID, tenantID uuid.UUID) (*domain.LessonCompletionResponse, error) {
	// Get completion
	completion, err := s.lessonRepo.GetCompletion(ctx, lessonID, userID, tenantID)
	if err != nil {
		return nil, ports.NewLessonError("GetLessonCompletion", err, "failed to get completion")
	}

	// Convert to response
	response := &domain.LessonCompletionResponse{}
	response.FromEntity(completion)

	return response, nil
}

// GetCourseProgress retrieves overall course progress for a user
func (s *LessonServiceImpl) GetCourseProgress(ctx context.Context, courseID, userID, tenantID uuid.UUID) (completed int, total int, percentage int, err error) {
	// Get completion stats
	completed, total, err = s.lessonRepo.GetCourseCompletionStats(ctx, courseID, userID, tenantID)
	if err != nil {
		return 0, 0, 0, ports.NewLessonError("GetCourseProgress", err, "failed to get course progress")
	}

	// Calculate percentage
	if total == 0 {
		return 0, 0, 0, nil
	}

	percentage = (completed * 100) / total

	return completed, total, percentage, nil
}
