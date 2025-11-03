package ports

import (
	"errors"
	"fmt"
)

// Quiz errors
var (
	ErrQuizNotFound        = errors.New("quiz not found")
	ErrQuizAlreadyExists   = errors.New("quiz already exists")
	ErrQuizDeleted         = errors.New("quiz has been deleted")
	ErrQuizNotPublished    = errors.New("quiz is not published")
	ErrInvalidQuizData     = errors.New("invalid quiz data")
	ErrQuizCreationFailed  = errors.New("failed to create quiz")
	ErrQuizUpdateFailed    = errors.New("failed to update quiz")
	ErrQuizDeletionFailed  = errors.New("failed to delete quiz")
	ErrQuizNotEnrollable   = errors.New("quiz cannot be accessed")
)

// Question errors
var (
	ErrQuestionNotFound       = errors.New("question not found")
	ErrQuestionAlreadyExists  = errors.New("question already exists")
	ErrInvalidQuestionData    = errors.New("invalid question data")
	ErrInvalidQuestionType    = errors.New("invalid question type")
	ErrInvalidQuestionPoints  = errors.New("invalid question points")
	ErrQuestionCreationFailed = errors.New("failed to create question")
	ErrQuestionUpdateFailed   = errors.New("failed to update question")
	ErrQuestionDeletionFailed = errors.New("failed to delete question")
	ErrReorderFailed          = errors.New("failed to reorder questions")
)

// Question option errors
var (
	ErrOptionNotFound       = errors.New("question option not found")
	ErrInvalidOptionData    = errors.New("invalid option data")
	ErrOptionCreationFailed = errors.New("failed to create option")
	ErrOptionUpdateFailed   = errors.New("failed to update option")
	ErrOptionDeletionFailed = errors.New("failed to delete option")
	ErrNoCorrectOption      = errors.New("at least one correct option required")
	ErrInvalidOptionCount   = errors.New("invalid number of options")
)

// Quiz attempt errors
var (
	ErrAttemptNotFound        = errors.New("quiz attempt not found")
	ErrAttemptAlreadyExists   = errors.New("quiz attempt already exists")
	ErrAttemptCreationFailed  = errors.New("failed to create quiz attempt")
	ErrAttemptUpdateFailed    = errors.New("failed to update quiz attempt")
	ErrAttemptAlreadyComplete = errors.New("quiz attempt already completed")
	ErrMaxAttemptsReached     = errors.New("maximum attempts reached for this quiz")
	ErrTimeLimitExceeded      = errors.New("time limit exceeded for this quiz")
	ErrInvalidAttemptNumber   = errors.New("invalid attempt number")
	ErrAttemptNotComplete     = errors.New("quiz attempt not yet completed")
)

// Quiz answer errors
var (
	ErrAnswerNotFound       = errors.New("quiz answer not found")
	ErrAnswerAlreadyExists  = errors.New("answer already exists for this question")
	ErrInvalidAnswerData    = errors.New("invalid answer data")
	ErrAnswerCreationFailed = errors.New("failed to create answer")
	ErrAnswerUpdateFailed   = errors.New("failed to update answer")
	ErrAnswerRequired       = errors.New("answer required for this question")
)

// Validation errors
var (
	ErrInvalidPassingScore    = errors.New("invalid passing score (must be 0-100)")
	ErrInvalidTimeLimit       = errors.New("invalid time limit")
	ErrInvalidMaxAttempts     = errors.New("invalid max attempts")
	ErrInvalidScore           = errors.New("invalid score (must be 0-100)")
	ErrInvalidTimeSpent       = errors.New("invalid time spent")
	ErrInvalidOrderIndex      = errors.New("invalid order index")
	ErrInvalidPointsAwarded   = errors.New("invalid points awarded")
	ErrInvalidSubmission      = errors.New("invalid quiz submission")
	ErrMissingRequiredAnswer  = errors.New("missing answer for required question")
	ErrInvalidAnswerFormat    = errors.New("invalid answer format for question type")
)

// Grading errors
var (
	ErrAlreadyGraded          = errors.New("question already graded")
	ErrNotGradedYet           = errors.New("question not graded yet")
	ErrCannotGradeAutoGraded  = errors.New("cannot manually grade auto-graded question")
	ErrRequiresManualGrading  = errors.New("question requires manual grading")
	ErrGradingFailed          = errors.New("failed to grade question")
	ErrPendingGrading         = errors.New("quiz has questions pending grading")
)

// Authorization errors
var (
	ErrNotQuizOwner           = errors.New("not the quiz owner")
	ErrInsufficientPermissions = errors.New("insufficient permissions to perform this action")
	ErrUnauthorizedAccess     = errors.New("unauthorized access to quiz")
	ErrNotEnrolledInCourse    = errors.New("not enrolled in course")
)

// Business logic errors
var (
	ErrCourseNotFound     = errors.New("course not found")
	ErrLessonNotFound     = errors.New("lesson not found")
	ErrQuizNotStarted     = errors.New("quiz attempt not started")
	ErrInvalidAttemptFlow = errors.New("invalid quiz attempt flow")
	ErrStatisticsFailed   = errors.New("failed to retrieve quiz statistics")
)

// QuizError wraps errors with additional context
type QuizError struct {
	Op      string // Operation being performed
	Err     error  // Underlying error
	Message string // Additional context message
}

func (e *QuizError) Error() string {
	if e.Message != "" {
		return fmt.Sprintf("%s: %s: %v", e.Op, e.Message, e.Err)
	}
	return fmt.Sprintf("%s: %v", e.Op, e.Err)
}

func (e *QuizError) Unwrap() error {
	return e.Err
}

// NewQuizError creates a new QuizError
func NewQuizError(op string, err error, message string) error {
	return &QuizError{
		Op:      op,
		Err:     err,
		Message: message,
	}
}
