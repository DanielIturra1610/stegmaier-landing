package controllers

import (
	"strconv"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/quizzes/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/quizzes/ports"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// QuizController handles quiz-related HTTP requests
type QuizController struct {
	quizService ports.QuizService
}

// NewQuizController creates a new QuizController
func NewQuizController(quizService ports.QuizService) *QuizController {
	return &QuizController{
		quizService: quizService,
	}
}

// ============================================================================
// Quiz Management
// ============================================================================

// CreateQuiz creates a new quiz
// POST /api/v1/courses/:courseId/quizzes
func (ctrl *QuizController) CreateQuiz(c *fiber.Ctx) error {
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
	var req domain.CreateQuizRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Set course ID from params (override if in body)
	req.CourseID = courseID

	// Call service
	quiz, err := ctrl.quizService.CreateQuiz(c.Context(), tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Quiz created successfully", quiz)
}

// UpdateQuiz updates an existing quiz
// PUT /api/v1/quizzes/:id
func (ctrl *QuizController) UpdateQuiz(c *fiber.Ctx) error {
	// Get quiz ID from params
	quizID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid quiz ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.UpdateQuizRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	quiz, err := ctrl.quizService.UpdateQuiz(c.Context(), quizID, tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Quiz updated successfully", quiz)
}

// DeleteQuiz deletes a quiz (soft delete)
// DELETE /api/v1/quizzes/:id
func (ctrl *QuizController) DeleteQuiz(c *fiber.Ctx) error {
	// Get quiz ID from params
	quizID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid quiz ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	if err := ctrl.quizService.DeleteQuiz(c.Context(), quizID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Quiz deleted successfully", nil)
}

// GetQuiz retrieves a quiz by ID
// GET /api/v1/quizzes/:id
func (ctrl *QuizController) GetQuiz(c *fiber.Ctx) error {
	// Get quiz ID from params
	quizID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid quiz ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse query params
	includeQuestions := c.Query("includeQuestions", "false") == "true"

	// Call service
	quiz, err := ctrl.quizService.GetQuiz(c.Context(), quizID, tenantID, includeQuestions)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Quiz retrieved successfully", quiz)
}

// GetQuizzesByCourse retrieves quizzes for a course
// GET /api/v1/courses/:courseId/quizzes
func (ctrl *QuizController) GetQuizzesByCourse(c *fiber.Ctx) error {
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
	response, err := ctrl.quizService.GetQuizzesByCourse(c.Context(), courseID, tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Quizzes retrieved successfully", response)
}

// GetQuizByLesson retrieves the quiz associated with a lesson
// GET /api/v1/lessons/:lessonId/quiz
func (ctrl *QuizController) GetQuizByLesson(c *fiber.Ctx) error {
	// Get lesson ID from params
	lessonID, err := uuid.Parse(c.Params("lessonId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid lesson ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	quiz, err := ctrl.quizService.GetQuizByLesson(c.Context(), lessonID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Quiz retrieved successfully", quiz)
}

// ============================================================================
// Question Management
// ============================================================================

// CreateQuestion creates a new question for a quiz
// POST /api/v1/quizzes/:quizId/questions
func (ctrl *QuizController) CreateQuestion(c *fiber.Ctx) error {
	// Get quiz ID from params
	quizID, err := uuid.Parse(c.Params("quizId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid quiz ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.CreateQuestionRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Set quiz ID from params (override if in body)
	req.QuizID = quizID

	// Call service
	question, err := ctrl.quizService.CreateQuestion(c.Context(), tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Question created successfully", question)
}

// UpdateQuestion updates an existing question
// PUT /api/v1/questions/:id
func (ctrl *QuizController) UpdateQuestion(c *fiber.Ctx) error {
	// Get question ID from params
	questionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid question ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.UpdateQuestionRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	question, err := ctrl.quizService.UpdateQuestion(c.Context(), questionID, tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Question updated successfully", question)
}

// DeleteQuestion deletes a question
// DELETE /api/v1/questions/:id
func (ctrl *QuizController) DeleteQuestion(c *fiber.Ctx) error {
	// Get question ID from params
	questionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid question ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	if err := ctrl.quizService.DeleteQuestion(c.Context(), questionID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Question deleted successfully", nil)
}

// ReorderQuestions reorders questions within a quiz
// POST /api/v1/quizzes/:quizId/questions/reorder
func (ctrl *QuizController) ReorderQuestions(c *fiber.Ctx) error {
	// Get quiz ID from params
	quizID, err := uuid.Parse(c.Params("quizId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid quiz ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.ReorderQuestionsRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	if err := ctrl.quizService.ReorderQuestions(c.Context(), quizID, tenantID, &req); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Questions reordered successfully", nil)
}

// ============================================================================
// Quiz Taking
// ============================================================================

// StartQuizAttempt starts a new quiz attempt
// POST /api/v1/quizzes/:quizId/attempts
func (ctrl *QuizController) StartQuizAttempt(c *fiber.Ctx) error {
	// Get quiz ID from params
	quizID, err := uuid.Parse(c.Params("quizId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid quiz ID")
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

	// Create request
	req := domain.StartQuizRequest{
		QuizID: quizID,
	}

	// Call service
	attempt, err := ctrl.quizService.StartQuizAttempt(c.Context(), userID, tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Quiz attempt started successfully", attempt)
}

// SubmitQuizAttempt submits answers for a quiz attempt
// POST /api/v1/attempts/:attemptId/submit
func (ctrl *QuizController) SubmitQuizAttempt(c *fiber.Ctx) error {
	// Get attempt ID from params
	attemptID, err := uuid.Parse(c.Params("attemptId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid attempt ID")
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
	var req domain.SubmitQuizRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	result, err := ctrl.quizService.SubmitQuizAttempt(c.Context(), attemptID, userID, tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Quiz submitted successfully", result)
}

// GetAttemptDetails retrieves details of a quiz attempt
// GET /api/v1/attempts/:attemptId
func (ctrl *QuizController) GetAttemptDetails(c *fiber.Ctx) error {
	// Get attempt ID from params
	attemptID, err := uuid.Parse(c.Params("attemptId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid attempt ID")
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
	attempt, err := ctrl.quizService.GetAttemptDetails(c.Context(), attemptID, userID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Attempt details retrieved successfully", attempt)
}

// GetMyAttempts retrieves all attempts for a quiz by the current user
// GET /api/v1/quizzes/:quizId/my-attempts
func (ctrl *QuizController) GetMyAttempts(c *fiber.Ctx) error {
	// Get quiz ID from params
	quizID, err := uuid.Parse(c.Params("quizId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid quiz ID")
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
	attempts, err := ctrl.quizService.GetUserAttempts(c.Context(), quizID, userID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "User attempts retrieved successfully", attempts)
}

// ============================================================================
// Manual Grading
// ============================================================================

// GradeEssayQuestion manually grades an essay question answer
// POST /api/v1/answers/:answerId/grade
func (ctrl *QuizController) GradeEssayQuestion(c *fiber.Ctx) error {
	// Get answer ID from params
	answerID, err := uuid.Parse(c.Params("answerId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid answer ID")
	}

	// Get instructor ID from context
	instructorID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid instructor ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.GradeQuestionRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	answer, err := ctrl.quizService.GradeEssayQuestion(c.Context(), answerID, instructorID, tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Essay graded successfully", answer)
}

// ============================================================================
// Statistics
// ============================================================================

// GetQuizStatistics retrieves statistics for a quiz
// GET /api/v1/quizzes/:quizId/statistics
func (ctrl *QuizController) GetQuizStatistics(c *fiber.Ctx) error {
	// Get quiz ID from params
	quizID, err := uuid.Parse(c.Params("quizId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid quiz ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenant_id").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	stats, err := ctrl.quizService.GetQuizStatistics(c.Context(), quizID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Quiz statistics retrieved successfully", stats)
}

// GetQuizAttempts retrieves all attempts for a quiz (instructor/admin)
// GET /api/v1/quizzes/:quizId/attempts
func (ctrl *QuizController) GetQuizAttempts(c *fiber.Ctx) error {
	// Get quiz ID from params
	quizID, err := uuid.Parse(c.Params("quizId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid quiz ID")
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
	response, err := ctrl.quizService.GetQuizAttempts(c.Context(), quizID, tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Quiz attempts retrieved successfully", response)
}
