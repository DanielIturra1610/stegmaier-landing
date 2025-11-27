package domain

import (
	"time"

	"github.com/google/uuid"
)

// CreateQuizRequest represents a request to create a quiz
type CreateQuizRequest struct {
	LessonID           *uuid.UUID `json:"lesson_id,omitempty"`
	CourseID           uuid.UUID  `json:"course_id" validate:"required"`
	Title              string     `json:"title" validate:"required,min=3,max=200"`
	Description        *string    `json:"description,omitempty" validate:"omitempty,max=1000"`
	PassingScore       int        `json:"passing_score" validate:"min=0,max=100"`
	TimeLimit          *int       `json:"time_limit,omitempty" validate:"omitempty,min=1"`
	MaxAttempts        *int       `json:"max_attempts,omitempty" validate:"omitempty,min=1"`
	ShuffleQuestions   bool       `json:"shuffle_questions"`
	ShuffleOptions     bool       `json:"shuffle_options"`
	ShowResults        bool       `json:"show_results"`
	ShowCorrectAnswers bool       `json:"show_correct_answers"`
	IsPublished        bool       `json:"is_published"`
}

// Validate validates the create quiz request
func (req *CreateQuizRequest) Validate() error {
	if req.Title == "" {
		return ErrInvalidQuizData
	}
	if req.PassingScore < 0 || req.PassingScore > 100 {
		return ErrInvalidPassingScore
	}
	if req.TimeLimit != nil && *req.TimeLimit <= 0 {
		return ErrInvalidTimeLimit
	}
	if req.MaxAttempts != nil && *req.MaxAttempts <= 0 {
		return ErrInvalidMaxAttempts
	}
	return nil
}

// UpdateQuizRequest represents a request to update a quiz
type UpdateQuizRequest struct {
	Title              *string `json:"title,omitempty" validate:"omitempty,min=3,max=200"`
	Description        *string `json:"description,omitempty" validate:"omitempty,max=1000"`
	PassingScore       *int    `json:"passing_score,omitempty" validate:"omitempty,min=0,max=100"`
	TimeLimit          *int    `json:"time_limit,omitempty" validate:"omitempty,min=1"`
	MaxAttempts        *int    `json:"max_attempts,omitempty" validate:"omitempty,min=1"`
	ShuffleQuestions   *bool   `json:"shuffle_questions,omitempty"`
	ShuffleOptions     *bool   `json:"shuffle_options,omitempty"`
	ShowResults        *bool   `json:"show_results,omitempty"`
	ShowCorrectAnswers *bool   `json:"show_correct_answers,omitempty"`
	IsPublished        *bool   `json:"is_published,omitempty"`
}

// Validate validates the update quiz request
func (req *UpdateQuizRequest) Validate() error {
	if req.Title != nil && *req.Title == "" {
		return ErrInvalidQuizData
	}
	if req.PassingScore != nil && (*req.PassingScore < 0 || *req.PassingScore > 100) {
		return ErrInvalidPassingScore
	}
	if req.TimeLimit != nil && *req.TimeLimit <= 0 {
		return ErrInvalidTimeLimit
	}
	if req.MaxAttempts != nil && *req.MaxAttempts <= 0 {
		return ErrInvalidMaxAttempts
	}
	return nil
}

// CreateQuestionRequest represents a request to create a question
type CreateQuestionRequest struct {
	QuizID      uuid.UUID    `json:"quiz_id" validate:"required"`
	Type        QuestionType `json:"type" validate:"required"`
	Text        string       `json:"text" validate:"required,min=3,max=1000"`
	Points      int          `json:"points" validate:"min=1"`
	Explanation *string      `json:"explanation,omitempty" validate:"omitempty,max=500"`
	OrderIndex  int          `json:"order_index" validate:"min=0"`
	Options     []CreateQuestionOptionRequest `json:"options,omitempty"` // For multiple_choice and true_false
}

// Validate validates the create question request
func (req *CreateQuestionRequest) Validate() error {
	if req.Text == "" {
		return ErrInvalidQuestionData
	}
	if !IsValidQuestionType(req.Type) {
		return ErrInvalidQuestionType
	}
	if req.Points < 0 {
		return ErrInvalidQuestionPoints
	}
	if req.OrderIndex < 0 {
		return ErrInvalidOrderIndex
	}

	// Validate options for multiple choice and true/false questions
	if req.Type == QuestionTypeMultipleChoice || req.Type == QuestionTypeTrueFalse {
		if len(req.Options) == 0 {
			return NewQuizError("options required for multiple choice and true/false questions")
		}

		hasCorrect := false
		for _, opt := range req.Options {
			if err := opt.Validate(); err != nil {
				return err
			}
			if opt.IsCorrect {
				hasCorrect = true
			}
		}

		if !hasCorrect {
			return NewQuizError("at least one correct option required")
		}

		// True/false must have exactly 2 options
		if req.Type == QuestionTypeTrueFalse && len(req.Options) != 2 {
			return NewQuizError("true/false questions must have exactly 2 options")
		}
	}

	return nil
}

// UpdateQuestionRequest represents a request to update a question
type UpdateQuestionRequest struct {
	Text        *string `json:"text,omitempty" validate:"omitempty,min=3,max=1000"`
	Points      *int    `json:"points,omitempty" validate:"omitempty,min=1"`
	Explanation *string `json:"explanation,omitempty" validate:"omitempty,max=500"`
	OrderIndex  *int    `json:"order_index,omitempty" validate:"omitempty,min=0"`
}

// Validate validates the update question request
func (req *UpdateQuestionRequest) Validate() error {
	if req.Text != nil && *req.Text == "" {
		return ErrInvalidQuestionData
	}
	if req.Points != nil && *req.Points < 0 {
		return ErrInvalidQuestionPoints
	}
	if req.OrderIndex != nil && *req.OrderIndex < 0 {
		return ErrInvalidOrderIndex
	}
	return nil
}

// CreateQuestionOptionRequest represents a request to create a question option
type CreateQuestionOptionRequest struct {
	Text       string `json:"text" validate:"required,min=1,max=500"`
	IsCorrect  bool   `json:"is_correct"`
	OrderIndex int    `json:"order_index" validate:"min=0"`
}

// Validate validates the create question option request
func (req *CreateQuestionOptionRequest) Validate() error {
	if req.Text == "" {
		return ErrInvalidOptionData
	}
	if req.OrderIndex < 0 {
		return ErrInvalidOrderIndex
	}
	return nil
}

// UpdateQuestionOptionRequest represents a request to update a question option
type UpdateQuestionOptionRequest struct {
	Text       *string `json:"text,omitempty" validate:"omitempty,min=1,max=500"`
	IsCorrect  *bool   `json:"is_correct,omitempty"`
	OrderIndex *int    `json:"order_index,omitempty" validate:"omitempty,min=0"`
}

// StartQuizRequest represents a request to start a quiz attempt
type StartQuizRequest struct {
	QuizID uuid.UUID `json:"quiz_id" validate:"required"`
}

// SubmitAnswerRequest represents a single answer submission
type SubmitAnswerRequest struct {
	QuestionID       uuid.UUID  `json:"question_id" validate:"required"`
	AnswerText       *string    `json:"answer_text,omitempty"`        // For short_answer and essay
	SelectedOptionID *uuid.UUID `json:"selected_option_id,omitempty"` // For multiple_choice and true_false
}

// SubmitQuizRequest represents a request to submit a quiz attempt
type SubmitQuizRequest struct {
	Answers []SubmitAnswerRequest `json:"answers" validate:"required,min=1"`
}

// Validate validates the submit quiz request
func (req *SubmitQuizRequest) Validate() error {
	if len(req.Answers) == 0 {
		return NewQuizError("at least one answer required")
	}
	return nil
}

// GradeQuestionRequest represents a request to manually grade a question (for essays)
type GradeQuestionRequest struct {
	PointsAwarded      int     `json:"points_awarded" validate:"min=0"`
	InstructorFeedback *string `json:"instructor_feedback,omitempty" validate:"omitempty,max=1000"`
}

// Validate validates the grade question request
func (req *GradeQuestionRequest) Validate() error {
	if req.PointsAwarded < 0 {
		return ErrInvalidPointsAwarded
	}
	return nil
}

// QuizResponse represents a quiz response
type QuizResponse struct {
	ID                 uuid.UUID  `json:"id"`
	TenantID           uuid.UUID  `json:"tenant_id"`
	LessonID           *uuid.UUID `json:"lesson_id,omitempty"`
	CourseID           uuid.UUID  `json:"course_id"`
	Title              string     `json:"title"`
	Description        *string    `json:"description,omitempty"`
	PassingScore       int        `json:"passing_score"`
	TimeLimit          *int       `json:"time_limit,omitempty"`
	MaxAttempts        *int       `json:"max_attempts,omitempty"`
	ShuffleQuestions   bool       `json:"shuffle_questions"`
	ShuffleOptions     bool       `json:"shuffle_options"`
	ShowResults        bool       `json:"show_results"`
	ShowCorrectAnswers bool       `json:"show_correct_answers"`
	IsPublished        bool       `json:"is_published"`
	QuestionCount      int        `json:"question_count,omitempty"` // Added dynamically
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

// QuizDetailResponse represents a detailed quiz response with questions
type QuizDetailResponse struct {
	QuizResponse
	Questions []QuestionDetailResponse `json:"questions"`
}

// QuestionResponse represents a question response
type QuestionResponse struct {
	ID          uuid.UUID    `json:"id"`
	TenantID    uuid.UUID    `json:"tenant_id"`
	QuizID      uuid.UUID    `json:"quiz_id"`
	Type        QuestionType `json:"type"`
	Text        string       `json:"text"`
	Points      int          `json:"points"`
	Explanation *string      `json:"explanation,omitempty"`
	OrderIndex  int          `json:"order_index"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

// QuestionDetailResponse represents a detailed question response with options
type QuestionDetailResponse struct {
	QuestionResponse
	Options []QuestionOptionResponse `json:"options,omitempty"`
}

// QuestionOptionResponse represents a question option response
type QuestionOptionResponse struct {
	ID         uuid.UUID `json:"id"`
	TenantID   uuid.UUID `json:"tenant_id"`
	QuestionID uuid.UUID `json:"question_id"`
	Text       string    `json:"text"`
	IsCorrect  bool      `json:"is_correct,omitempty"` // Hidden for students during attempt
	OrderIndex int       `json:"order_index"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// QuizAttemptResponse represents a quiz attempt response
type QuizAttemptResponse struct {
	ID            uuid.UUID  `json:"id"`
	TenantID      uuid.UUID  `json:"tenant_id"`
	QuizID        uuid.UUID  `json:"quiz_id"`
	UserID        uuid.UUID  `json:"user_id"`
	Score         *int       `json:"score,omitempty"`
	IsPassed      *bool      `json:"is_passed,omitempty"`
	TimeSpent     *int       `json:"time_spent,omitempty"`
	AttemptNumber int        `json:"attempt_number"`
	StartedAt     time.Time  `json:"started_at"`
	CompletedAt   *time.Time `json:"completed_at,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

// QuizAttemptDetailResponse represents a detailed quiz attempt with answers
type QuizAttemptDetailResponse struct {
	QuizAttemptResponse
	Answers []QuizAnswerResponse `json:"answers"`
}

// QuizAnswerResponse represents a quiz answer response
type QuizAnswerResponse struct {
	ID                 uuid.UUID  `json:"id"`
	TenantID           uuid.UUID  `json:"tenant_id"`
	AttemptID          uuid.UUID  `json:"attempt_id"`
	QuestionID         uuid.UUID  `json:"question_id"`
	AnswerText         *string    `json:"answer_text,omitempty"`
	SelectedOptionID   *uuid.UUID `json:"selected_option_id,omitempty"`
	IsCorrect          *bool      `json:"is_correct,omitempty"`
	PointsAwarded      int        `json:"points_awarded"`
	InstructorFeedback *string    `json:"instructor_feedback,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

// QuizStatisticsResponse represents quiz statistics
type QuizStatisticsResponse struct {
	QuizID            uuid.UUID `json:"quiz_id"`
	TotalAttempts     int       `json:"total_attempts"`
	CompletedAttempts int       `json:"completed_attempts"`
	AverageScore      float64   `json:"average_score"`
	PassRate          float64   `json:"pass_rate"`
	AverageTimeSpent  float64   `json:"average_time_spent"`
}

// FromEntity converts a Quiz entity to QuizResponse
func (qr *QuizResponse) FromEntity(quiz *Quiz) {
	qr.ID = quiz.ID
	qr.TenantID = quiz.TenantID
	qr.LessonID = quiz.LessonID
	qr.CourseID = quiz.CourseID
	qr.Title = quiz.Title
	qr.Description = quiz.Description
	qr.PassingScore = quiz.PassingScore
	qr.TimeLimit = quiz.TimeLimit
	qr.MaxAttempts = quiz.MaxAttempts
	qr.ShuffleQuestions = quiz.ShuffleQuestions
	qr.ShuffleOptions = quiz.ShuffleOptions
	qr.ShowResults = quiz.ShowResults
	qr.ShowCorrectAnswers = quiz.ShowCorrectAnswers
	qr.IsPublished = quiz.IsPublished
	qr.CreatedAt = quiz.CreatedAt
	qr.UpdatedAt = quiz.UpdatedAt
}

// FromEntity converts a Question entity to QuestionResponse
func (qr *QuestionResponse) FromEntity(question *Question) {
	qr.ID = question.ID
	qr.TenantID = question.TenantID
	qr.QuizID = question.QuizID
	qr.Type = question.Type
	qr.Text = question.Text
	qr.Points = question.Points
	qr.Explanation = question.Explanation
	qr.OrderIndex = question.OrderIndex
	qr.CreatedAt = question.CreatedAt
	qr.UpdatedAt = question.UpdatedAt
}

// FromEntity converts a QuestionOption entity to QuestionOptionResponse
func (qor *QuestionOptionResponse) FromEntity(option *QuestionOption) {
	qor.ID = option.ID
	qor.TenantID = option.TenantID
	qor.QuestionID = option.QuestionID
	qor.Text = option.Text
	qor.IsCorrect = option.IsCorrect
	qor.OrderIndex = option.OrderIndex
	qor.CreatedAt = option.CreatedAt
	qor.UpdatedAt = option.UpdatedAt
}

// FromEntity converts a QuizAttempt entity to QuizAttemptResponse
func (qar *QuizAttemptResponse) FromEntity(attempt *QuizAttempt) {
	qar.ID = attempt.ID
	qar.TenantID = attempt.TenantID
	qar.QuizID = attempt.QuizID
	qar.UserID = attempt.UserID
	qar.Score = attempt.Score
	qar.IsPassed = attempt.IsPassed
	qar.TimeSpent = attempt.TimeSpent
	qar.AttemptNumber = attempt.AttemptNumber
	qar.StartedAt = attempt.StartedAt
	qar.CompletedAt = attempt.CompletedAt
	qar.CreatedAt = attempt.CreatedAt
	qar.UpdatedAt = attempt.UpdatedAt
}

// FromEntity converts a QuizAnswer entity to QuizAnswerResponse
func (qar *QuizAnswerResponse) FromEntity(answer *QuizAnswer) {
	qar.ID = answer.ID
	qar.TenantID = answer.TenantID
	qar.AttemptID = answer.AttemptID
	qar.QuestionID = answer.QuestionID
	qar.AnswerText = answer.AnswerText
	qar.SelectedOptionID = answer.SelectedOptionID
	qar.IsCorrect = answer.IsCorrect
	qar.PointsAwarded = answer.PointsAwarded
	qar.InstructorFeedback = answer.InstructorFeedback
	qar.CreatedAt = answer.CreatedAt
	qar.UpdatedAt = answer.UpdatedAt
}

// QuestionOrder represents the order of a question
type QuestionOrder struct {
	QuestionID uuid.UUID `json:"question_id" validate:"required"`
	OrderIndex int       `json:"order_index" validate:"min=0"`
}

// ReorderQuestionsRequest represents a request to reorder questions in a quiz
type ReorderQuestionsRequest struct {
	Orders []QuestionOrder `json:"orders" validate:"required,min=1"`
}

// PaginatedQuizResponse represents a paginated list of quizzes
type PaginatedQuizResponse struct {
	Quizzes    []QuizResponse `json:"quizzes"`
	TotalCount int            `json:"total_count"`
	Page       int            `json:"page"`
	PageSize   int            `json:"page_size"`
	TotalPages int            `json:"total_pages"`
}

// PaginatedAttemptResponse represents a paginated list of quiz attempts
type PaginatedAttemptResponse struct {
	Attempts   []QuizAttemptResponse `json:"attempts"`
	TotalCount int                   `json:"total_count"`
	Page       int                   `json:"page"`
	PageSize   int                   `json:"page_size"`
	TotalPages int                   `json:"total_pages"`
}
