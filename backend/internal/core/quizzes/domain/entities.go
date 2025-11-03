package domain

import (
	"time"

	"github.com/google/uuid"
)

// QuestionType represents the type of question
type QuestionType string

const (
	QuestionTypeMultipleChoice QuestionType = "multiple_choice"
	QuestionTypeTrueFalse      QuestionType = "true_false"
	QuestionTypeShortAnswer    QuestionType = "short_answer"
	QuestionTypeEssay          QuestionType = "essay"
)

// Quiz represents a quiz entity
type Quiz struct {
	ID               uuid.UUID  `json:"id"`
	TenantID         uuid.UUID  `json:"tenant_id"`
	LessonID         *uuid.UUID `json:"lesson_id,omitempty"`      // Optional: Associated lesson
	CourseID         uuid.UUID  `json:"course_id"`
	Title            string     `json:"title"`
	Description      *string    `json:"description,omitempty"`
	PassingScore     int        `json:"passing_score"`            // 0-100
	TimeLimit        *int       `json:"time_limit,omitempty"`     // Minutes (null = no limit)
	MaxAttempts      *int       `json:"max_attempts,omitempty"`   // null = unlimited
	ShuffleQuestions bool       `json:"shuffle_questions"`
	ShuffleOptions   bool       `json:"shuffle_options"`
	ShowResults      bool       `json:"show_results"`             // Show results after completion
	ShowCorrectAnswers bool     `json:"show_correct_answers"`     // Show correct answers after completion
	IsPublished      bool       `json:"is_published"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
	DeletedAt        *time.Time `json:"deleted_at,omitempty"`
}

// Question represents a question in a quiz
type Question struct {
	ID          uuid.UUID    `json:"id"`
	TenantID    uuid.UUID    `json:"tenant_id"`
	QuizID      uuid.UUID    `json:"quiz_id"`
	Type        QuestionType `json:"type"`
	Text        string       `json:"text"`
	Points      int          `json:"points"`                  // Points awarded for correct answer
	Explanation *string      `json:"explanation,omitempty"`   // Explanation shown after answering
	OrderIndex  int          `json:"order_index"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

// QuestionOption represents an option for a multiple choice question
type QuestionOption struct {
	ID         uuid.UUID `json:"id"`
	TenantID   uuid.UUID `json:"tenant_id"`
	QuestionID uuid.UUID `json:"question_id"`
	Text       string    `json:"text"`
	IsCorrect  bool      `json:"is_correct"`
	OrderIndex int       `json:"order_index"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// QuizAttempt represents a user's attempt at a quiz
type QuizAttempt struct {
	ID             uuid.UUID  `json:"id"`
	TenantID       uuid.UUID  `json:"tenant_id"`
	QuizID         uuid.UUID  `json:"quiz_id"`
	UserID         uuid.UUID  `json:"user_id"`
	Score          *int       `json:"score,omitempty"`           // 0-100 (null if not graded yet)
	IsPassed       *bool      `json:"is_passed,omitempty"`       // null if not graded yet
	TimeSpent      *int       `json:"time_spent,omitempty"`      // Minutes
	AttemptNumber  int        `json:"attempt_number"`            // 1, 2, 3, ...
	StartedAt      time.Time  `json:"started_at"`
	CompletedAt    *time.Time `json:"completed_at,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

// QuizAnswer represents a user's answer to a question in an attempt
type QuizAnswer struct {
	ID                 uuid.UUID  `json:"id"`
	TenantID           uuid.UUID  `json:"tenant_id"`
	AttemptID          uuid.UUID  `json:"attempt_id"`
	QuestionID         uuid.UUID  `json:"question_id"`
	AnswerText         *string    `json:"answer_text,omitempty"`        // For short_answer and essay
	SelectedOptionID   *uuid.UUID `json:"selected_option_id,omitempty"` // For multiple_choice and true_false
	IsCorrect          *bool      `json:"is_correct,omitempty"`         // null if not graded yet (essay)
	PointsAwarded      int        `json:"points_awarded"`
	InstructorFeedback *string    `json:"instructor_feedback,omitempty"` // For essay questions
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

// TableName returns the table name for Quiz
func (Quiz) TableName() string {
	return "quizzes"
}

// TableName returns the table name for Question
func (Question) TableName() string {
	return "questions"
}

// TableName returns the table name for QuestionOption
func (QuestionOption) TableName() string {
	return "question_options"
}

// TableName returns the table name for QuizAttempt
func (QuizAttempt) TableName() string {
	return "quiz_attempts"
}

// TableName returns the table name for QuizAnswer
func (QuizAnswer) TableName() string {
	return "quiz_answers"
}

// IsValidQuestionType checks if the question type is valid
func IsValidQuestionType(qt QuestionType) bool {
	switch qt {
	case QuestionTypeMultipleChoice, QuestionTypeTrueFalse, QuestionTypeShortAnswer, QuestionTypeEssay:
		return true
	default:
		return false
	}
}

// RequiresOptions returns true if the question type requires options
func (q *Question) RequiresOptions() bool {
	return q.Type == QuestionTypeMultipleChoice || q.Type == QuestionTypeTrueFalse
}

// SupportsAutoGrading returns true if the question type supports automatic grading
func (q *Question) SupportsAutoGrading() bool {
	return q.Type == QuestionTypeMultipleChoice || q.Type == QuestionTypeTrueFalse
}

// RequiresManualGrading returns true if the question requires manual grading
func (q *Question) RequiresManualGrading() bool {
	return q.Type == QuestionTypeEssay
}

// Validate validates the quiz entity
func (quiz *Quiz) Validate() error {
	if quiz.Title == "" {
		return ErrInvalidQuizData
	}

	if quiz.PassingScore < 0 || quiz.PassingScore > 100 {
		return ErrInvalidPassingScore
	}

	if quiz.TimeLimit != nil && *quiz.TimeLimit <= 0 {
		return ErrInvalidTimeLimit
	}

	if quiz.MaxAttempts != nil && *quiz.MaxAttempts <= 0 {
		return ErrInvalidMaxAttempts
	}

	return nil
}

// Validate validates the question entity
func (q *Question) Validate() error {
	if q.Text == "" {
		return ErrInvalidQuestionData
	}

	if !IsValidQuestionType(q.Type) {
		return ErrInvalidQuestionType
	}

	if q.Points < 0 {
		return ErrInvalidQuestionPoints
	}

	if q.OrderIndex < 0 {
		return ErrInvalidOrderIndex
	}

	return nil
}

// Validate validates the question option entity
func (opt *QuestionOption) Validate() error {
	if opt.Text == "" {
		return ErrInvalidOptionData
	}

	if opt.OrderIndex < 0 {
		return ErrInvalidOrderIndex
	}

	return nil
}

// Validate validates the quiz attempt entity
func (attempt *QuizAttempt) Validate() error {
	if attempt.Score != nil && (*attempt.Score < 0 || *attempt.Score > 100) {
		return ErrInvalidScore
	}

	if attempt.TimeSpent != nil && *attempt.TimeSpent < 0 {
		return ErrInvalidTimeSpent
	}

	if attempt.AttemptNumber < 1 {
		return ErrInvalidAttemptNumber
	}

	return nil
}

// Validate validates the quiz answer entity
func (answer *QuizAnswer) Validate() error {
	if answer.PointsAwarded < 0 {
		return ErrInvalidPointsAwarded
	}

	return nil
}

// CalculateScore calculates the final score for an attempt
func (attempt *QuizAttempt) CalculateScore(totalPoints int, earnedPoints int) {
	if totalPoints == 0 {
		attempt.Score = new(int)
		*attempt.Score = 0
		attempt.IsPassed = new(bool)
		*attempt.IsPassed = false
		return
	}

	score := (earnedPoints * 100) / totalPoints
	attempt.Score = &score

	// Check if passed (this will be compared against quiz.PassingScore in service layer)
	attempt.IsPassed = new(bool)
	*attempt.IsPassed = false // Will be updated in service layer with actual passing score
}

// MarkComplete marks the attempt as complete
func (attempt *QuizAttempt) MarkComplete(timeSpent int) {
	now := time.Now()
	attempt.CompletedAt = &now
	attempt.TimeSpent = &timeSpent
	attempt.UpdatedAt = now
}

// IsComplete returns true if the attempt is complete
func (attempt *QuizAttempt) IsComplete() bool {
	return attempt.CompletedAt != nil
}

// CanAttempt checks if a user can attempt a quiz based on max attempts
func CanAttempt(maxAttempts *int, currentAttemptCount int) bool {
	if maxAttempts == nil {
		return true // Unlimited attempts
	}
	return currentAttemptCount < *maxAttempts
}

// IsTimeUp checks if the time limit has been exceeded
func (attempt *QuizAttempt) IsTimeUp(timeLimit *int) bool {
	if timeLimit == nil {
		return false // No time limit
	}

	if attempt.CompletedAt != nil {
		return false // Already completed
	}

	elapsed := time.Since(attempt.StartedAt).Minutes()
	return elapsed > float64(*timeLimit)
}

// Domain errors
var (
	ErrInvalidQuizData         = NewQuizError("invalid quiz data")
	ErrInvalidQuestionData     = NewQuizError("invalid question data")
	ErrInvalidOptionData       = NewQuizError("invalid option data")
	ErrInvalidQuestionType     = NewQuizError("invalid question type")
	ErrInvalidPassingScore     = NewQuizError("invalid passing score (must be 0-100)")
	ErrInvalidTimeLimit        = NewQuizError("invalid time limit")
	ErrInvalidMaxAttempts      = NewQuizError("invalid max attempts")
	ErrInvalidQuestionPoints   = NewQuizError("invalid question points")
	ErrInvalidOrderIndex       = NewQuizError("invalid order index")
	ErrInvalidScore            = NewQuizError("invalid score (must be 0-100)")
	ErrInvalidTimeSpent        = NewQuizError("invalid time spent")
	ErrInvalidAttemptNumber    = NewQuizError("invalid attempt number")
	ErrInvalidPointsAwarded    = NewQuizError("invalid points awarded")
)

// QuizError represents a quiz domain error
type QuizError struct {
	Message string
}

func (e QuizError) Error() string {
	return e.Message
}

// NewQuizError creates a new quiz error
func NewQuizError(message string) error {
	return QuizError{Message: message}
}
