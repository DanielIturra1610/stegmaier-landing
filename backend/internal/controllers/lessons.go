package controllers

import (
	"strconv"
	"strings"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/lessons/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/lessons/ports"
	mediadomain "github.com/DanielIturra1610/stegmaier-landing/internal/core/media/domain"
	mediaports "github.com/DanielIturra1610/stegmaier-landing/internal/core/media/ports"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// LessonController handles lesson-related HTTP requests
type LessonController struct {
	lessonService ports.LessonService
	mediaService  mediaports.MediaService
}

// NewLessonController creates a new LessonController
func NewLessonController(lessonService ports.LessonService, mediaService mediaports.MediaService) *LessonController {
	return &LessonController{
		lessonService: lessonService,
		mediaService:  mediaService,
	}
}

// GetLesson retrieves a lesson by ID
// GET /api/v1/lessons/:id
func (ctrl *LessonController) GetLesson(c *fiber.Ctx) error {
	// Get lesson ID from params
	lessonID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid lesson ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Get user ID from context (optional - may be nil for public access)
	var userID *uuid.UUID
	if userIDStr, ok := c.Locals("userID").(string); ok && userIDStr != "" {
		uid, err := uuid.Parse(userIDStr)
		if err == nil {
			userID = &uid
		}
	}

	// Call service
	lesson, err := ctrl.lessonService.GetLesson(c.Context(), lessonID, tenantID, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Lesson retrieved successfully", lesson)
}

// GetLessonsByCourse retrieves lessons for a course
// GET /api/v1/courses/:courseId/lessons
func (ctrl *LessonController) GetLessonsByCourse(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("courseId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse pagination parameters
	page := 1
	pageSize := 20

	if pageParam := c.Query("page"); pageParam != "" {
		if p, err := strconv.Atoi(pageParam); err == nil && p > 0 {
			page = p
		}
	}

	if pageSizeParam := c.Query("pageSize"); pageSizeParam != "" {
		if ps, err := strconv.Atoi(pageSizeParam); err == nil && ps > 0 {
			pageSize = ps
		}
	}

	// Call service
	response, err := ctrl.lessonService.GetLessonsByCourse(c.Context(), courseID, tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Lessons retrieved successfully", response)
}

// GetLessonsWithProgress retrieves lessons with user progress
// GET /api/v1/courses/:courseId/lessons/progress
func (ctrl *LessonController) GetLessonsWithProgress(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("courseId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse pagination parameters
	page := 1
	pageSize := 20

	if pageParam := c.Query("page"); pageParam != "" {
		if p, err := strconv.Atoi(pageParam); err == nil && p > 0 {
			page = p
		}
	}

	if pageSizeParam := c.Query("pageSize"); pageSizeParam != "" {
		if ps, err := strconv.Atoi(pageSizeParam); err == nil && ps > 0 {
			pageSize = ps
		}
	}

	// Call service
	response, err := ctrl.lessonService.GetLessonsWithProgress(c.Context(), courseID, userID, tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Lessons with progress retrieved successfully", response)
}

// MarkLessonComplete marks a lesson as complete or updates progress
// POST /api/v1/lessons/:id/complete
func (ctrl *LessonController) MarkLessonComplete(c *fiber.Ctx) error {
	// Get lesson ID from params
	lessonID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid lesson ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.MarkLessonCompleteRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	if err := ctrl.lessonService.MarkLessonComplete(c.Context(), lessonID, userID, tenantID, &req); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Lesson progress updated successfully", nil)
}

// GetLessonCompletion retrieves lesson completion for a user
// GET /api/v1/lessons/:id/completion
func (ctrl *LessonController) GetLessonCompletion(c *fiber.Ctx) error {
	// Get lesson ID from params
	lessonID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid lesson ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	completion, err := ctrl.lessonService.GetLessonCompletion(c.Context(), lessonID, userID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Lesson completion retrieved successfully", completion)
}

// GetCourseProgress retrieves overall course progress for a user
// GET /api/v1/courses/:courseId/progress
func (ctrl *LessonController) GetCourseProgress(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("courseId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	completed, total, percentage, err := ctrl.lessonService.GetCourseProgress(c.Context(), courseID, userID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	// Build response
	progressData := map[string]interface{}{
		"course_id":          courseID,
		"completed_lessons":  completed,
		"total_lessons":      total,
		"completion_percent": percentage,
	}

	return SuccessResponse(c, fiber.StatusOK, "Course progress retrieved successfully", progressData)
}

// CreateLesson creates a new lesson (instructor/admin only)
// POST /api/v1/courses/:courseId/lessons
func (ctrl *LessonController) CreateLesson(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("courseId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.CreateLessonRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Set course ID from params (override if in body)
	req.CourseID = courseID

	// Call service
	lesson, err := ctrl.lessonService.CreateLesson(c.Context(), tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Lesson created successfully", lesson)
}

// UpdateLesson updates an existing lesson (instructor/admin only)
// PUT /api/v1/lessons/:id
func (ctrl *LessonController) UpdateLesson(c *fiber.Ctx) error {
	// Get lesson ID from params
	lessonID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid lesson ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.UpdateLessonRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	lesson, err := ctrl.lessonService.UpdateLesson(c.Context(), lessonID, tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Lesson updated successfully", lesson)
}

// DeleteLesson soft deletes a lesson (instructor/admin only)
// DELETE /api/v1/lessons/:id
func (ctrl *LessonController) DeleteLesson(c *fiber.Ctx) error {
	// Get lesson ID from params
	lessonID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid lesson ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	if err := ctrl.lessonService.DeleteLesson(c.Context(), lessonID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Lesson deleted successfully", nil)
}

// ReorderLessons reorders lessons within a course (instructor/admin only)
// POST /api/v1/courses/:courseId/lessons/reorder
func (ctrl *LessonController) ReorderLessons(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("courseId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.ReorderLessonsRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	if err := ctrl.lessonService.ReorderLessons(c.Context(), courseID, tenantID, &req); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Lessons reordered successfully", nil)
}

// UploadLessonVideo uploads a video file for a lesson
// POST /api/v1/lessons/:id/upload-video
func (ctrl *LessonController) UploadLessonVideo(c *fiber.Ctx) error {
	// Get lesson ID from params
	lessonID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid lesson ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("user_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get video file from form
	file, err := c.FormFile("video")
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "No video file provided")
	}

	// Validate file type (must be video)
	if !strings.HasPrefix(file.Header.Get("Content-Type"), "video/") {
		return ErrorResponse(c, fiber.StatusBadRequest, "File must be a video")
	}

	// Open file
	src, err := file.Open()
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "Failed to open file")
	}
	defer src.Close()

	// Upload to MinIO via Media Service
	uploadReq := mediadomain.UploadMediaRequest{
		TenantID:     tenantID,
		UserID:       userID,
		FileName:     file.Filename,
		OriginalName: file.Filename,
		MimeType:     file.Header.Get("Content-Type"),
		FileSize:     file.Size,
		Context:      mediadomain.MediaContextLesson,
		ContextID:    &lessonID,
		Visibility:   mediadomain.MediaVisibilityPrivate,
	}

	mediaResp, err := ctrl.mediaService.UploadMedia(uploadReq, src)
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "Failed to upload video: "+err.Error())
	}

	// Update lesson with media_id and video_url
	lesson, err := ctrl.lessonService.UpdateLessonVideo(c.Context(), lessonID, tenantID, mediaResp.ID, mediaResp.URL)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Video uploaded successfully", map[string]interface{}{
		"lesson": lesson,
		"media":  mediaResp,
	})
}
