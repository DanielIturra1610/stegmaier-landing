package ports

import "errors"

// Lesson errors
var (
	// Not found errors
	ErrLessonNotFound           = errors.New("lesson not found")
	ErrLessonCompletionNotFound = errors.New("lesson completion not found")

	// Validation errors
	ErrInvalidLessonData        = errors.New("invalid lesson data")
	ErrInvalidContentType       = errors.New("invalid content type")
	ErrQuizIDRequired           = errors.New("quiz ID required for quiz lessons")
	ErrContentRequired          = errors.New("content or content URL required")
	ErrInvalidOrderIndex        = errors.New("invalid order index")
	ErrInvalidCompletionPercent = errors.New("invalid completion percent")
	ErrInvalidTimeSpent         = errors.New("invalid time spent")

	// Business logic errors
	ErrLessonDeleted         = errors.New("lesson has been deleted")
	ErrLessonNotPublished    = errors.New("lesson is not published")
	ErrCourseNotFound        = errors.New("course not found")
	ErrQuizNotFound          = errors.New("quiz not found")
	ErrLessonNotEnrollable   = errors.New("lesson cannot be accessed")
	ErrNotEnrolledInCourse   = errors.New("not enrolled in course")
	ErrLessonNotFree         = errors.New("lesson is not free to preview")

	// Authorization errors
	ErrNotLessonOwner           = errors.New("not the lesson owner")
	ErrInsufficientPermissions  = errors.New("insufficient permissions")
	ErrUnauthorizedAccess       = errors.New("unauthorized access to lesson")

	// Update errors
	ErrLessonUpdateFailed       = errors.New("failed to update lesson")
	ErrCompletionUpdateFailed   = errors.New("failed to update lesson completion")
	ErrReorderFailed            = errors.New("failed to reorder lessons")

	// Creation errors
	ErrLessonCreationFailed     = errors.New("failed to create lesson")
	ErrCompletionCreationFailed = errors.New("failed to create lesson completion")

	// Deletion errors
	ErrLessonDeletionFailed = errors.New("failed to delete lesson")
)

// LessonError wraps an error with additional context
type LessonError struct {
	Op  string // Operation being performed
	Err error  // Original error
	Msg string // Additional message
}

func (e *LessonError) Error() string {
	if e.Msg != "" {
		return e.Op + ": " + e.Msg + ": " + e.Err.Error()
	}
	return e.Op + ": " + e.Err.Error()
}

func (e *LessonError) Unwrap() error {
	return e.Err
}

// NewLessonError creates a new LessonError
func NewLessonError(op string, err error, msg string) error {
	return &LessonError{
		Op:  op,
		Err: err,
		Msg: msg,
	}
}
