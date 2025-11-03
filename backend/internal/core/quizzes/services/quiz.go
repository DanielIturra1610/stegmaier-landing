package services

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/quizzes/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/quizzes/ports"
	"github.com/google/uuid"
)

// QuizServiceImpl implements the QuizService interface
type QuizServiceImpl struct {
	quizRepo ports.QuizRepository
}

// NewQuizService creates a new quiz service
func NewQuizService(quizRepo ports.QuizRepository) ports.QuizService {
	return &QuizServiceImpl{
		quizRepo: quizRepo,
	}
}

// ============================================================================
// Quiz management
// ============================================================================

func (s *QuizServiceImpl) CreateQuiz(ctx context.Context, tenantID uuid.UUID, req *domain.CreateQuizRequest) (*domain.QuizResponse, error) {
	if err := req.Validate(); err != nil {
		return nil, ports.NewQuizError("CreateQuiz", err, "invalid quiz data")
	}

	quiz := &domain.Quiz{
		ID:                 uuid.New(),
		TenantID:           tenantID,
		LessonID:           req.LessonID,
		CourseID:           req.CourseID,
		Title:              req.Title,
		Description:        req.Description,
		PassingScore:       req.PassingScore,
		TimeLimit:          req.TimeLimit,
		MaxAttempts:        req.MaxAttempts,
		ShuffleQuestions:   req.ShuffleQuestions,
		ShuffleOptions:     req.ShuffleOptions,
		ShowResults:        req.ShowResults,
		ShowCorrectAnswers: req.ShowCorrectAnswers,
		IsPublished:        req.IsPublished,
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}

	if err := s.quizRepo.CreateQuiz(ctx, quiz); err != nil {
		return nil, ports.NewQuizError("CreateQuiz", ports.ErrQuizCreationFailed, err.Error())
	}

	response := &domain.QuizResponse{}
	response.FromEntity(quiz)
	return response, nil
}

func (s *QuizServiceImpl) UpdateQuiz(ctx context.Context, quizID, tenantID uuid.UUID, req *domain.UpdateQuizRequest) (*domain.QuizResponse, error) {
	if err := req.Validate(); err != nil {
		return nil, ports.NewQuizError("UpdateQuiz", err, "invalid quiz data")
	}

	// Get existing quiz
	quiz, err := s.quizRepo.GetQuizByID(ctx, quizID, tenantID)
	if err != nil {
		return nil, ports.NewQuizError("UpdateQuiz", err, "failed to get quiz")
	}

	// Update fields
	if req.Title != nil {
		quiz.Title = *req.Title
	}
	if req.Description != nil {
		quiz.Description = req.Description
	}
	if req.PassingScore != nil {
		quiz.PassingScore = *req.PassingScore
	}
	if req.TimeLimit != nil {
		quiz.TimeLimit = req.TimeLimit
	}
	if req.MaxAttempts != nil {
		quiz.MaxAttempts = req.MaxAttempts
	}
	if req.ShuffleQuestions != nil {
		quiz.ShuffleQuestions = *req.ShuffleQuestions
	}
	if req.ShuffleOptions != nil {
		quiz.ShuffleOptions = *req.ShuffleOptions
	}
	if req.ShowResults != nil {
		quiz.ShowResults = *req.ShowResults
	}
	if req.ShowCorrectAnswers != nil {
		quiz.ShowCorrectAnswers = *req.ShowCorrectAnswers
	}
	if req.IsPublished != nil {
		quiz.IsPublished = *req.IsPublished
	}

	quiz.UpdatedAt = time.Now()

	if err := s.quizRepo.UpdateQuiz(ctx, quiz); err != nil {
		return nil, ports.NewQuizError("UpdateQuiz", ports.ErrQuizUpdateFailed, err.Error())
	}

	response := &domain.QuizResponse{}
	response.FromEntity(quiz)
	return response, nil
}

func (s *QuizServiceImpl) DeleteQuiz(ctx context.Context, quizID, tenantID uuid.UUID) error {
	if err := s.quizRepo.DeleteQuiz(ctx, quizID, tenantID); err != nil {
		return ports.NewQuizError("DeleteQuiz", err, "failed to delete quiz")
	}
	return nil
}

func (s *QuizServiceImpl) GetQuiz(ctx context.Context, quizID, tenantID uuid.UUID, includeQuestions bool) (interface{}, error) {
	if !includeQuestions {
		quiz, err := s.quizRepo.GetQuizByID(ctx, quizID, tenantID)
		if err != nil {
			return nil, ports.NewQuizError("GetQuiz", err, "failed to get quiz")
		}

		response := &domain.QuizResponse{}
		response.FromEntity(quiz)
		return response, nil
	}

	// Get quiz with questions
	quiz, questions, err := s.quizRepo.GetQuizWithQuestions(ctx, quizID, tenantID)
	if err != nil {
		return nil, ports.NewQuizError("GetQuiz", err, "failed to get quiz with questions")
	}

	// Get question IDs for bulk option loading
	questionIDs := make([]uuid.UUID, len(questions))
	for i, q := range questions {
		questionIDs[i] = q.ID
	}

	// Get all options in one query
	optionsMap, err := s.quizRepo.GetOptionsByQuestionIDs(ctx, questionIDs, tenantID)
	if err != nil {
		return nil, ports.NewQuizError("GetQuiz", err, "failed to get options")
	}

	// Build response
	response := &domain.QuizDetailResponse{}
	response.FromEntity(quiz)

	response.Questions = make([]domain.QuestionDetailResponse, len(questions))
	for i, q := range questions {
		qResp := domain.QuestionDetailResponse{}
		qResp.FromEntity(&q)

		// Add options
		if opts, ok := optionsMap[q.ID]; ok {
			qResp.Options = make([]domain.QuestionOptionResponse, len(opts))
			for j, opt := range opts {
				qResp.Options[j].FromEntity(&opt)
			}
		}

		response.Questions[i] = qResp
	}

	return response, nil
}

func (s *QuizServiceImpl) GetQuizzesByCourse(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) (*domain.PaginatedQuizResponse, error) {
	quizzes, totalCount, err := s.quizRepo.GetQuizzesByCourseID(ctx, courseID, tenantID, page, pageSize)
	if err != nil {
		return nil, ports.NewQuizError("GetQuizzesByCourse", err, "failed to get quizzes")
	}

	responses := make([]domain.QuizResponse, len(quizzes))
	for i, quiz := range quizzes {
		responses[i].FromEntity(&quiz)
	}

	totalPages := int(math.Ceil(float64(totalCount) / float64(pageSize)))

	return &domain.PaginatedQuizResponse{
		Quizzes:    responses,
		TotalCount: totalCount,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

func (s *QuizServiceImpl) GetQuizByLesson(ctx context.Context, lessonID, tenantID uuid.UUID) (*domain.QuizDetailResponse, error) {
	quiz, err := s.quizRepo.GetQuizByLessonID(ctx, lessonID, tenantID)
	if err != nil {
		return nil, ports.NewQuizError("GetQuizByLesson", err, "failed to get quiz")
	}

	// Get questions
	questions, err := s.quizRepo.GetQuestionsByQuizID(ctx, quiz.ID, tenantID)
	if err != nil {
		return nil, ports.NewQuizError("GetQuizByLesson", err, "failed to get questions")
	}

	// Get question IDs for bulk option loading
	questionIDs := make([]uuid.UUID, len(questions))
	for i, q := range questions {
		questionIDs[i] = q.ID
	}

	// Get all options
	optionsMap, err := s.quizRepo.GetOptionsByQuestionIDs(ctx, questionIDs, tenantID)
	if err != nil {
		return nil, ports.NewQuizError("GetQuizByLesson", err, "failed to get options")
	}

	// Build response
	response := &domain.QuizDetailResponse{}
	response.FromEntity(quiz)

	response.Questions = make([]domain.QuestionDetailResponse, len(questions))
	for i, q := range questions {
		qResp := domain.QuestionDetailResponse{}
		qResp.FromEntity(&q)

		if opts, ok := optionsMap[q.ID]; ok {
			qResp.Options = make([]domain.QuestionOptionResponse, len(opts))
			for j, opt := range opts {
				qResp.Options[j].FromEntity(&opt)
			}
		}

		response.Questions[i] = qResp
	}

	return response, nil
}

// ============================================================================
// Question management
// ============================================================================

func (s *QuizServiceImpl) CreateQuestion(ctx context.Context, tenantID uuid.UUID, req *domain.CreateQuestionRequest) (*domain.QuestionDetailResponse, error) {
	if err := req.Validate(); err != nil {
		return nil, ports.NewQuizError("CreateQuestion", err, "invalid question data")
	}

	// Get max order index if not provided
	if req.OrderIndex == 0 {
		maxOrder, err := s.quizRepo.GetMaxQuestionOrderIndex(ctx, req.QuizID, tenantID)
		if err != nil {
			maxOrder = -1
		}
		req.OrderIndex = maxOrder + 1
	}

	question := &domain.Question{
		ID:          uuid.New(),
		TenantID:    tenantID,
		QuizID:      req.QuizID,
		Type:        req.Type,
		Text:        req.Text,
		Points:      req.Points,
		Explanation: req.Explanation,
		OrderIndex:  req.OrderIndex,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.quizRepo.CreateQuestion(ctx, question); err != nil {
		return nil, ports.NewQuizError("CreateQuestion", ports.ErrQuestionCreationFailed, err.Error())
	}

	// Create options if provided
	var options []domain.QuestionOption
	if len(req.Options) > 0 {
		for i, optReq := range req.Options {
			option := domain.QuestionOption{
				ID:         uuid.New(),
				TenantID:   tenantID,
				QuestionID: question.ID,
				Text:       optReq.Text,
				IsCorrect:  optReq.IsCorrect,
				OrderIndex: optReq.OrderIndex,
				CreatedAt:  time.Now(),
				UpdatedAt:  time.Now(),
			}
			if option.OrderIndex == 0 {
				option.OrderIndex = i
			}
			if err := s.quizRepo.CreateOption(ctx, &option); err != nil {
				return nil, ports.NewQuizError("CreateQuestion", ports.ErrOptionCreationFailed, err.Error())
			}
			options = append(options, option)
		}
	}

	// Build response
	response := &domain.QuestionDetailResponse{}
	response.FromEntity(question)
	if len(options) > 0 {
		response.Options = make([]domain.QuestionOptionResponse, len(options))
		for i, opt := range options {
			response.Options[i].FromEntity(&opt)
		}
	}

	return response, nil
}

func (s *QuizServiceImpl) UpdateQuestion(ctx context.Context, questionID, tenantID uuid.UUID, req *domain.UpdateQuestionRequest) (*domain.QuestionResponse, error) {
	if err := req.Validate(); err != nil {
		return nil, ports.NewQuizError("UpdateQuestion", err, "invalid question data")
	}

	// Get existing question
	question, err := s.quizRepo.GetQuestionByID(ctx, questionID, tenantID)
	if err != nil {
		return nil, ports.NewQuizError("UpdateQuestion", err, "failed to get question")
	}

	// Update fields
	if req.Text != nil {
		question.Text = *req.Text
	}
	if req.Points != nil {
		question.Points = *req.Points
	}
	if req.Explanation != nil {
		question.Explanation = req.Explanation
	}
	if req.OrderIndex != nil {
		question.OrderIndex = *req.OrderIndex
	}

	question.UpdatedAt = time.Now()

	if err := s.quizRepo.UpdateQuestion(ctx, question); err != nil {
		return nil, ports.NewQuizError("UpdateQuestion", ports.ErrQuestionUpdateFailed, err.Error())
	}

	response := &domain.QuestionResponse{}
	response.FromEntity(question)
	return response, nil
}

func (s *QuizServiceImpl) DeleteQuestion(ctx context.Context, questionID, tenantID uuid.UUID) error {
	// Delete options first
	if err := s.quizRepo.DeleteOptionsByQuestionID(ctx, questionID, tenantID); err != nil {
		return ports.NewQuizError("DeleteQuestion", err, "failed to delete options")
	}

	// Delete question
	if err := s.quizRepo.DeleteQuestion(ctx, questionID, tenantID); err != nil {
		return ports.NewQuizError("DeleteQuestion", err, "failed to delete question")
	}

	return nil
}

func (s *QuizServiceImpl) ReorderQuestions(ctx context.Context, quizID, tenantID uuid.UUID, req *domain.ReorderQuestionsRequest) error {
	if len(req.Orders) == 0 {
		return ports.NewQuizError("ReorderQuestions", ports.ErrInvalidOrderIndex, "no orders provided")
	}

	if err := s.quizRepo.ReorderQuestions(ctx, quizID, tenantID, req.Orders); err != nil {
		return ports.NewQuizError("ReorderQuestions", ports.ErrReorderFailed, err.Error())
	}

	return nil
}

// ============================================================================
// Question option management
// ============================================================================

func (s *QuizServiceImpl) UpdateQuestionOption(ctx context.Context, optionID, tenantID uuid.UUID, req *domain.UpdateQuestionOptionRequest) (*domain.QuestionOptionResponse, error) {
	// Get existing option
	option, err := s.quizRepo.GetOptionByID(ctx, optionID, tenantID)
	if err != nil {
		return nil, ports.NewQuizError("UpdateQuestionOption", err, "failed to get option")
	}

	// Update fields
	if req.Text != nil {
		option.Text = *req.Text
	}
	if req.IsCorrect != nil {
		option.IsCorrect = *req.IsCorrect
	}
	if req.OrderIndex != nil {
		option.OrderIndex = *req.OrderIndex
	}

	option.UpdatedAt = time.Now()

	if err := s.quizRepo.UpdateOption(ctx, option); err != nil {
		return nil, ports.NewQuizError("UpdateQuestionOption", ports.ErrOptionUpdateFailed, err.Error())
	}

	response := &domain.QuestionOptionResponse{}
	response.FromEntity(option)
	return response, nil
}

// ============================================================================
// Quiz taking
// ============================================================================

func (s *QuizServiceImpl) StartQuizAttempt(ctx context.Context, userID, tenantID uuid.UUID, req *domain.StartQuizRequest) (*domain.QuizAttemptResponse, error) {
	// Get quiz
	quiz, err := s.quizRepo.GetQuizByID(ctx, req.QuizID, tenantID)
	if err != nil {
		return nil, ports.NewQuizError("StartQuizAttempt", err, "failed to get quiz")
	}

	// Check if quiz is published
	if !quiz.IsPublished {
		return nil, ports.NewQuizError("StartQuizAttempt", ports.ErrQuizNotPublished, "quiz is not published")
	}

	// Check max attempts
	attemptCount, err := s.quizRepo.GetUserAttemptCount(ctx, req.QuizID, userID, tenantID)
	if err != nil {
		return nil, ports.NewQuizError("StartQuizAttempt", err, "failed to get attempt count")
	}

	if !domain.CanAttempt(quiz.MaxAttempts, attemptCount) {
		return nil, ports.NewQuizError("StartQuizAttempt", ports.ErrMaxAttemptsReached, fmt.Sprintf("maximum %d attempts allowed", *quiz.MaxAttempts))
	}

	// Create attempt
	attempt := &domain.QuizAttempt{
		ID:            uuid.New(),
		TenantID:      tenantID,
		QuizID:        req.QuizID,
		UserID:        userID,
		AttemptNumber: attemptCount + 1,
		StartedAt:     time.Now(),
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := s.quizRepo.CreateAttempt(ctx, attempt); err != nil {
		return nil, ports.NewQuizError("StartQuizAttempt", ports.ErrAttemptCreationFailed, err.Error())
	}

	response := &domain.QuizAttemptResponse{}
	response.FromEntity(attempt)
	return response, nil
}

func (s *QuizServiceImpl) SubmitQuizAttempt(ctx context.Context, attemptID, userID, tenantID uuid.UUID, req *domain.SubmitQuizRequest) (*domain.QuizAttemptDetailResponse, error) {
	if err := req.Validate(); err != nil {
		return nil, ports.NewQuizError("SubmitQuizAttempt", err, "invalid submission")
	}

	// Get attempt
	attempt, err := s.quizRepo.GetAttemptByID(ctx, attemptID, tenantID)
	if err != nil {
		return nil, ports.NewQuizError("SubmitQuizAttempt", err, "failed to get attempt")
	}

	// Verify user owns the attempt
	if attempt.UserID != userID {
		return nil, ports.NewQuizError("SubmitQuizAttempt", ports.ErrUnauthorizedAccess, "not your attempt")
	}

	// Check if already completed
	if attempt.IsComplete() {
		return nil, ports.NewQuizError("SubmitQuizAttempt", ports.ErrAttemptAlreadyComplete, "attempt already completed")
	}

	// Get quiz
	quiz, err := s.quizRepo.GetQuizByID(ctx, attempt.QuizID, tenantID)
	if err != nil {
		return nil, ports.NewQuizError("SubmitQuizAttempt", err, "failed to get quiz")
	}

	// Check time limit
	if attempt.IsTimeUp(quiz.TimeLimit) {
		return nil, ports.NewQuizError("SubmitQuizAttempt", ports.ErrTimeLimitExceeded, "time limit exceeded")
	}

	// Get all questions
	questions, err := s.quizRepo.GetQuestionsByQuizID(ctx, quiz.ID, tenantID)
	if err != nil {
		return nil, ports.NewQuizError("SubmitQuizAttempt", err, "failed to get questions")
	}

	// Build question map
	questionMap := make(map[uuid.UUID]*domain.Question)
	for i := range questions {
		questionMap[questions[i].ID] = &questions[i]
	}

	// Process answers
	var totalPoints int
	var earnedPoints int
	var hasPendingGrading bool

	for _, answerReq := range req.Answers {
		question, ok := questionMap[answerReq.QuestionID]
		if !ok {
			return nil, ports.NewQuizError("SubmitQuizAttempt", ports.ErrQuestionNotFound, fmt.Sprintf("question %s not found", answerReq.QuestionID))
		}

		totalPoints += question.Points

		answer := &domain.QuizAnswer{
			ID:               uuid.New(),
			TenantID:         tenantID,
			AttemptID:        attemptID,
			QuestionID:       answerReq.QuestionID,
			AnswerText:       answerReq.AnswerText,
			SelectedOptionID: answerReq.SelectedOptionID,
			CreatedAt:        time.Now(),
			UpdatedAt:        time.Now(),
		}

		// Auto-grade if possible
		if question.SupportsAutoGrading() {
			// Get correct option
			options, err := s.quizRepo.GetOptionsByQuestionID(ctx, question.ID, tenantID)
			if err != nil {
				return nil, ports.NewQuizError("SubmitQuizAttempt", err, "failed to get options")
			}

			// Check if selected option is correct
			isCorrect := false
			for _, opt := range options {
				if answerReq.SelectedOptionID != nil && opt.ID == *answerReq.SelectedOptionID && opt.IsCorrect {
					isCorrect = true
					break
				}
			}

			answer.IsCorrect = &isCorrect
			if isCorrect {
				answer.PointsAwarded = question.Points
				earnedPoints += question.Points
			}
		} else if question.RequiresManualGrading() {
			// Essay - mark as pending
			hasPendingGrading = true
			answer.IsCorrect = nil
			answer.PointsAwarded = 0
		} else {
			// Short answer - for now, mark as pending (future: implement pattern matching)
			hasPendingGrading = true
			answer.IsCorrect = nil
			answer.PointsAwarded = 0
		}

		if err := s.quizRepo.CreateAnswer(ctx, answer); err != nil {
			return nil, ports.NewQuizError("SubmitQuizAttempt", ports.ErrAnswerCreationFailed, err.Error())
		}
	}

	// Calculate score and mark complete
	timeSpent := int(time.Since(attempt.StartedAt).Minutes())
	attempt.MarkComplete(timeSpent)

	if !hasPendingGrading {
		// Calculate final score
		attempt.CalculateScore(totalPoints, earnedPoints)
		passed := *attempt.Score >= quiz.PassingScore
		attempt.IsPassed = &passed
	}

	if err := s.quizRepo.UpdateAttempt(ctx, attempt); err != nil {
		return nil, ports.NewQuizError("SubmitQuizAttempt", ports.ErrAttemptUpdateFailed, err.Error())
	}

	// Get answers for response
	answers, err := s.quizRepo.GetAnswersByAttemptID(ctx, attemptID, tenantID)
	if err != nil {
		return nil, ports.NewQuizError("SubmitQuizAttempt", err, "failed to get answers")
	}

	// Build response
	response := &domain.QuizAttemptDetailResponse{}
	response.FromEntity(attempt)
	response.Answers = make([]domain.QuizAnswerResponse, len(answers))
	for i, ans := range answers {
		response.Answers[i].FromEntity(&ans)
	}

	return response, nil
}

func (s *QuizServiceImpl) GetAttemptDetails(ctx context.Context, attemptID, userID, tenantID uuid.UUID) (*domain.QuizAttemptDetailResponse, error) {
	// Get attempt
	attempt, err := s.quizRepo.GetAttemptByID(ctx, attemptID, tenantID)
	if err != nil {
		return nil, ports.NewQuizError("GetAttemptDetails", err, "failed to get attempt")
	}

	// Verify user owns the attempt
	if attempt.UserID != userID {
		return nil, ports.NewQuizError("GetAttemptDetails", ports.ErrUnauthorizedAccess, "not your attempt")
	}

	// Get answers
	answers, err := s.quizRepo.GetAnswersByAttemptID(ctx, attemptID, tenantID)
	if err != nil {
		return nil, ports.NewQuizError("GetAttemptDetails", err, "failed to get answers")
	}

	// Build response
	response := &domain.QuizAttemptDetailResponse{}
	response.FromEntity(attempt)
	response.Answers = make([]domain.QuizAnswerResponse, len(answers))
	for i, ans := range answers {
		response.Answers[i].FromEntity(&ans)
	}

	return response, nil
}

func (s *QuizServiceImpl) GetUserAttempts(ctx context.Context, quizID, userID, tenantID uuid.UUID) ([]domain.QuizAttemptResponse, error) {
	attempts, err := s.quizRepo.GetAttemptsByUserAndQuiz(ctx, quizID, userID, tenantID)
	if err != nil {
		return nil, ports.NewQuizError("GetUserAttempts", err, "failed to get attempts")
	}

	responses := make([]domain.QuizAttemptResponse, len(attempts))
	for i, attempt := range attempts {
		responses[i].FromEntity(&attempt)
	}

	return responses, nil
}

// ============================================================================
// Manual grading
// ============================================================================

func (s *QuizServiceImpl) GradeEssayQuestion(ctx context.Context, answerID, instructorID, tenantID uuid.UUID, req *domain.GradeQuestionRequest) (*domain.QuizAnswerResponse, error) {
	if err := req.Validate(); err != nil {
		return nil, ports.NewQuizError("GradeEssayQuestion", err, "invalid grading data")
	}

	// Get answer
	answer, err := s.quizRepo.GetAnswerByID(ctx, answerID, tenantID)
	if err != nil {
		return nil, ports.NewQuizError("GradeEssayQuestion", err, "failed to get answer")
	}

	// Get question to verify it's an essay
	question, err := s.quizRepo.GetQuestionByID(ctx, answer.QuestionID, tenantID)
	if err != nil {
		return nil, ports.NewQuizError("GradeEssayQuestion", err, "failed to get question")
	}

	if !question.RequiresManualGrading() {
		return nil, ports.NewQuizError("GradeEssayQuestion", ports.ErrCannotGradeAutoGraded, "question does not require manual grading")
	}

	// Check if points awarded exceeds question points
	if req.PointsAwarded > question.Points {
		return nil, ports.NewQuizError("GradeEssayQuestion", ports.ErrInvalidPointsAwarded, fmt.Sprintf("points awarded (%d) exceeds question points (%d)", req.PointsAwarded, question.Points))
	}

	// Update answer
	isCorrect := req.PointsAwarded == question.Points
	answer.IsCorrect = &isCorrect
	answer.PointsAwarded = req.PointsAwarded
	answer.InstructorFeedback = req.InstructorFeedback

	if err := s.quizRepo.UpdateAnswer(ctx, answer); err != nil {
		return nil, ports.NewQuizError("GradeEssayQuestion", ports.ErrGradingFailed, err.Error())
	}

	// Recalculate attempt score
	attempt, err := s.quizRepo.GetAttemptByID(ctx, answer.AttemptID, tenantID)
	if err != nil {
		return nil, ports.NewQuizError("GradeEssayQuestion", err, "failed to get attempt")
	}

	// Get all answers for this attempt
	answers, err := s.quizRepo.GetAnswersByAttemptID(ctx, answer.AttemptID, tenantID)
	if err != nil {
		return nil, ports.NewQuizError("GradeEssayQuestion", err, "failed to get answers")
	}

	// Calculate total points
	var totalPoints int
	var earnedPoints int
	allGraded := true

	for _, ans := range answers {
		// Get question for points
		q, err := s.quizRepo.GetQuestionByID(ctx, ans.QuestionID, tenantID)
		if err != nil {
			continue
		}

		totalPoints += q.Points
		earnedPoints += ans.PointsAwarded

		if ans.IsCorrect == nil {
			allGraded = false
		}
	}

	// Update attempt score if all graded
	if allGraded {
		attempt.CalculateScore(totalPoints, earnedPoints)

		// Get quiz to check passing score
		quiz, err := s.quizRepo.GetQuizByID(ctx, attempt.QuizID, tenantID)
		if err == nil {
			passed := *attempt.Score >= quiz.PassingScore
			attempt.IsPassed = &passed
		}

		if err := s.quizRepo.UpdateAttempt(ctx, attempt); err != nil {
			return nil, ports.NewQuizError("GradeEssayQuestion", err, "failed to update attempt")
		}
	}

	response := &domain.QuizAnswerResponse{}
	response.FromEntity(answer)
	return response, nil
}

func (s *QuizServiceImpl) GetPendingGrading(ctx context.Context, quizID, tenantID uuid.UUID) ([]domain.QuizAnswerResponse, error) {
	// Get all attempts for this quiz
	attempts, _, err := s.quizRepo.GetAttemptsByQuiz(ctx, quizID, tenantID, 1, 1000)
	if err != nil {
		return nil, ports.NewQuizError("GetPendingGrading", err, "failed to get attempts")
	}

	var pendingAnswers []domain.QuizAnswerResponse

	for _, attempt := range attempts {
		// Get answers for this attempt
		answers, err := s.quizRepo.GetAnswersByAttemptID(ctx, attempt.ID, tenantID)
		if err != nil {
			continue
		}

		// Find answers that need grading
		for _, answer := range answers {
			if answer.IsCorrect == nil {
				// Get question to verify it's an essay
				question, err := s.quizRepo.GetQuestionByID(ctx, answer.QuestionID, tenantID)
				if err != nil {
					continue
				}

				if question.RequiresManualGrading() {
					resp := domain.QuizAnswerResponse{}
					resp.FromEntity(&answer)
					pendingAnswers = append(pendingAnswers, resp)
				}
			}
		}
	}

	return pendingAnswers, nil
}

// ============================================================================
// Statistics
// ============================================================================

func (s *QuizServiceImpl) GetQuizStatistics(ctx context.Context, quizID, tenantID uuid.UUID) (*domain.QuizStatisticsResponse, error) {
	stats, err := s.quizRepo.GetQuizStatistics(ctx, quizID, tenantID)
	if err != nil {
		return nil, ports.NewQuizError("GetQuizStatistics", err, "failed to get statistics")
	}

	return stats, nil
}

func (s *QuizServiceImpl) GetQuizAttempts(ctx context.Context, quizID, tenantID uuid.UUID, page, pageSize int) (*domain.PaginatedAttemptResponse, error) {
	attempts, totalCount, err := s.quizRepo.GetAttemptsByQuiz(ctx, quizID, tenantID, page, pageSize)
	if err != nil {
		return nil, ports.NewQuizError("GetQuizAttempts", err, "failed to get attempts")
	}

	responses := make([]domain.QuizAttemptResponse, len(attempts))
	for i, attempt := range attempts {
		responses[i].FromEntity(&attempt)
	}

	totalPages := int(math.Ceil(float64(totalCount) / float64(pageSize)))

	return &domain.PaginatedAttemptResponse{
		Attempts:   responses,
		TotalCount: totalCount,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}
