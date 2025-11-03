package ports

import (
	"context"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/quizzes/domain"
	"github.com/google/uuid"
)

// QuizRepository defines the interface for quiz data access
type QuizRepository interface {
	// Quiz operations
	CreateQuiz(ctx context.Context, quiz *domain.Quiz) error
	UpdateQuiz(ctx context.Context, quiz *domain.Quiz) error
	DeleteQuiz(ctx context.Context, quizID, tenantID uuid.UUID) error
	GetQuizByID(ctx context.Context, quizID, tenantID uuid.UUID) (*domain.Quiz, error)
	GetQuizzesByCourseID(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) ([]domain.Quiz, int, error)
	GetQuizByLessonID(ctx context.Context, lessonID, tenantID uuid.UUID) (*domain.Quiz, error)
	GetQuizWithQuestions(ctx context.Context, quizID, tenantID uuid.UUID) (*domain.Quiz, []domain.Question, error)

	// Question operations
	CreateQuestion(ctx context.Context, question *domain.Question) error
	UpdateQuestion(ctx context.Context, question *domain.Question) error
	DeleteQuestion(ctx context.Context, questionID, tenantID uuid.UUID) error
	GetQuestionByID(ctx context.Context, questionID, tenantID uuid.UUID) (*domain.Question, error)
	GetQuestionsByQuizID(ctx context.Context, quizID, tenantID uuid.UUID) ([]domain.Question, error)
	GetMaxQuestionOrderIndex(ctx context.Context, quizID, tenantID uuid.UUID) (int, error)
	ReorderQuestions(ctx context.Context, quizID, tenantID uuid.UUID, orders []domain.QuestionOrder) error

	// Question option operations
	CreateOption(ctx context.Context, option *domain.QuestionOption) error
	UpdateOption(ctx context.Context, option *domain.QuestionOption) error
	DeleteOption(ctx context.Context, optionID, tenantID uuid.UUID) error
	GetOptionByID(ctx context.Context, optionID, tenantID uuid.UUID) (*domain.QuestionOption, error)
	GetOptionsByQuestionID(ctx context.Context, questionID, tenantID uuid.UUID) ([]domain.QuestionOption, error)
	GetOptionsByQuestionIDs(ctx context.Context, questionIDs []uuid.UUID, tenantID uuid.UUID) (map[uuid.UUID][]domain.QuestionOption, error)
	DeleteOptionsByQuestionID(ctx context.Context, questionID, tenantID uuid.UUID) error

	// Quiz attempt operations
	CreateAttempt(ctx context.Context, attempt *domain.QuizAttempt) error
	UpdateAttempt(ctx context.Context, attempt *domain.QuizAttempt) error
	GetAttemptByID(ctx context.Context, attemptID, tenantID uuid.UUID) (*domain.QuizAttempt, error)
	GetAttemptsByUserAndQuiz(ctx context.Context, quizID, userID, tenantID uuid.UUID) ([]domain.QuizAttempt, error)
	GetAttemptsByQuiz(ctx context.Context, quizID, tenantID uuid.UUID, page, pageSize int) ([]domain.QuizAttempt, int, error)
	GetUserAttemptCount(ctx context.Context, quizID, userID, tenantID uuid.UUID) (int, error)

	// Quiz answer operations
	CreateAnswer(ctx context.Context, answer *domain.QuizAnswer) error
	UpdateAnswer(ctx context.Context, answer *domain.QuizAnswer) error
	GetAnswerByID(ctx context.Context, answerID, tenantID uuid.UUID) (*domain.QuizAnswer, error)
	GetAnswersByAttemptID(ctx context.Context, attemptID, tenantID uuid.UUID) ([]domain.QuizAnswer, error)
	GetAnswerByAttemptAndQuestion(ctx context.Context, attemptID, questionID, tenantID uuid.UUID) (*domain.QuizAnswer, error)

	// Statistics operations
	GetQuizStatistics(ctx context.Context, quizID, tenantID uuid.UUID) (*domain.QuizStatisticsResponse, error)
	GetAverageScore(ctx context.Context, quizID, tenantID uuid.UUID) (float64, error)
	GetPassRate(ctx context.Context, quizID, tenantID uuid.UUID) (float64, error)
	GetPendingGradingCount(ctx context.Context, quizID, tenantID uuid.UUID) (int, error)
}

// QuizService defines the interface for quiz business logic
type QuizService interface {
	// Quiz management
	CreateQuiz(ctx context.Context, tenantID uuid.UUID, req *domain.CreateQuizRequest) (*domain.QuizResponse, error)
	UpdateQuiz(ctx context.Context, quizID, tenantID uuid.UUID, req *domain.UpdateQuizRequest) (*domain.QuizResponse, error)
	DeleteQuiz(ctx context.Context, quizID, tenantID uuid.UUID) error
	GetQuiz(ctx context.Context, quizID, tenantID uuid.UUID, includeQuestions bool) (interface{}, error)
	GetQuizzesByCourse(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) (*domain.PaginatedQuizResponse, error)
	GetQuizByLesson(ctx context.Context, lessonID, tenantID uuid.UUID) (*domain.QuizDetailResponse, error)

	// Question management
	CreateQuestion(ctx context.Context, tenantID uuid.UUID, req *domain.CreateQuestionRequest) (*domain.QuestionDetailResponse, error)
	UpdateQuestion(ctx context.Context, questionID, tenantID uuid.UUID, req *domain.UpdateQuestionRequest) (*domain.QuestionResponse, error)
	DeleteQuestion(ctx context.Context, questionID, tenantID uuid.UUID) error
	ReorderQuestions(ctx context.Context, quizID, tenantID uuid.UUID, req *domain.ReorderQuestionsRequest) error

	// Question option management
	UpdateQuestionOption(ctx context.Context, optionID, tenantID uuid.UUID, req *domain.UpdateQuestionOptionRequest) (*domain.QuestionOptionResponse, error)

	// Quiz taking
	StartQuizAttempt(ctx context.Context, userID, tenantID uuid.UUID, req *domain.StartQuizRequest) (*domain.QuizAttemptResponse, error)
	SubmitQuizAttempt(ctx context.Context, attemptID, userID, tenantID uuid.UUID, req *domain.SubmitQuizRequest) (*domain.QuizAttemptDetailResponse, error)
	GetAttemptDetails(ctx context.Context, attemptID, userID, tenantID uuid.UUID) (*domain.QuizAttemptDetailResponse, error)
	GetUserAttempts(ctx context.Context, quizID, userID, tenantID uuid.UUID) ([]domain.QuizAttemptResponse, error)

	// Manual grading
	GradeEssayQuestion(ctx context.Context, answerID, instructorID, tenantID uuid.UUID, req *domain.GradeQuestionRequest) (*domain.QuizAnswerResponse, error)
	GetPendingGrading(ctx context.Context, quizID, tenantID uuid.UUID) ([]domain.QuizAnswerResponse, error)

	// Statistics
	GetQuizStatistics(ctx context.Context, quizID, tenantID uuid.UUID) (*domain.QuizStatisticsResponse, error)
	GetQuizAttempts(ctx context.Context, quizID, tenantID uuid.UUID, page, pageSize int) (*domain.PaginatedAttemptResponse, error)
}
