package adapters

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/quizzes/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/quizzes/ports"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

// PostgreSQLQuizRepository implements the QuizRepository interface
type PostgreSQLQuizRepository struct {
	db *sqlx.DB
}

// NewPostgreSQLQuizRepository creates a new PostgreSQL quiz repository
func NewPostgreSQLQuizRepository(db *sqlx.DB) ports.QuizRepository {
	return &PostgreSQLQuizRepository{db: db}
}

// ============================================================================
// Quiz operations
// ============================================================================

func (r *PostgreSQLQuizRepository) CreateQuiz(ctx context.Context, quiz *domain.Quiz) error {
	query := `
		INSERT INTO quizzes (
			id, tenant_id, lesson_id, course_id, title, description,
			passing_score, time_limit, max_attempts, shuffle_questions,
			shuffle_options, show_results, show_correct_answers, is_published,
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
		)
	`
	_, err := r.db.ExecContext(ctx, query,
		quiz.ID, quiz.TenantID, quiz.LessonID, quiz.CourseID, quiz.Title, quiz.Description,
		quiz.PassingScore, quiz.TimeLimit, quiz.MaxAttempts, quiz.ShuffleQuestions,
		quiz.ShuffleOptions, quiz.ShowResults, quiz.ShowCorrectAnswers, quiz.IsPublished,
		quiz.CreatedAt, quiz.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create quiz: %w", err)
	}
	return nil
}

func (r *PostgreSQLQuizRepository) UpdateQuiz(ctx context.Context, quiz *domain.Quiz) error {
	query := `
		UPDATE quizzes SET
			title = $1, description = $2, passing_score = $3, time_limit = $4,
			max_attempts = $5, shuffle_questions = $6, shuffle_options = $7,
			show_results = $8, show_correct_answers = $9, is_published = $10,
			updated_at = $11
		WHERE id = $12 AND tenant_id = $13 AND deleted_at IS NULL
	`
	result, err := r.db.ExecContext(ctx, query,
		quiz.Title, quiz.Description, quiz.PassingScore, quiz.TimeLimit,
		quiz.MaxAttempts, quiz.ShuffleQuestions, quiz.ShuffleOptions,
		quiz.ShowResults, quiz.ShowCorrectAnswers, quiz.IsPublished,
		time.Now(), quiz.ID, quiz.TenantID,
	)
	if err != nil {
		return fmt.Errorf("failed to update quiz: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return ports.ErrQuizNotFound
	}
	return nil
}

func (r *PostgreSQLQuizRepository) DeleteQuiz(ctx context.Context, quizID, tenantID uuid.UUID) error {
	query := `
		UPDATE quizzes SET deleted_at = $1, updated_at = $2
		WHERE id = $3 AND tenant_id = $4 AND deleted_at IS NULL
	`
	result, err := r.db.ExecContext(ctx, query, time.Now(), time.Now(), quizID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete quiz: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return ports.ErrQuizNotFound
	}
	return nil
}

func (r *PostgreSQLQuizRepository) GetQuizByID(ctx context.Context, quizID, tenantID uuid.UUID) (*domain.Quiz, error) {
	query := `
		SELECT id, tenant_id, lesson_id, course_id, title, description,
			passing_score, time_limit, max_attempts, shuffle_questions,
			shuffle_options, show_results, show_correct_answers, is_published,
			created_at, updated_at, deleted_at
		FROM quizzes
		WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
	`
	var quiz domain.Quiz
	err := r.db.GetContext(ctx, &quiz, query, quizID, tenantID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ports.ErrQuizNotFound
		}
		return nil, fmt.Errorf("failed to get quiz: %w", err)
	}
	return &quiz, nil
}

func (r *PostgreSQLQuizRepository) GetQuizzesByCourseID(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) ([]domain.Quiz, int, error) {
	offset := (page - 1) * pageSize

	// Get total count
	countQuery := `SELECT COUNT(*) FROM quizzes WHERE course_id = $1 AND tenant_id = $2 AND deleted_at IS NULL`
	var totalCount int
	err := r.db.GetContext(ctx, &totalCount, countQuery, courseID, tenantID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count quizzes: %w", err)
	}

	// Get quizzes
	query := `
		SELECT id, tenant_id, lesson_id, course_id, title, description,
			passing_score, time_limit, max_attempts, shuffle_questions,
			shuffle_options, show_results, show_correct_answers, is_published,
			created_at, updated_at
		FROM quizzes
		WHERE course_id = $1 AND tenant_id = $2 AND deleted_at IS NULL
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4
	`
	var quizzes []domain.Quiz
	err = r.db.SelectContext(ctx, &quizzes, query, courseID, tenantID, pageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get quizzes: %w", err)
	}

	return quizzes, totalCount, nil
}

func (r *PostgreSQLQuizRepository) GetQuizByLessonID(ctx context.Context, lessonID, tenantID uuid.UUID) (*domain.Quiz, error) {
	query := `
		SELECT id, tenant_id, lesson_id, course_id, title, description,
			passing_score, time_limit, max_attempts, shuffle_questions,
			shuffle_options, show_results, show_correct_answers, is_published,
			created_at, updated_at
		FROM quizzes
		WHERE lesson_id = $1 AND tenant_id = $2 AND deleted_at IS NULL
	`
	var quiz domain.Quiz
	err := r.db.GetContext(ctx, &quiz, query, lessonID, tenantID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ports.ErrQuizNotFound
		}
		return nil, fmt.Errorf("failed to get quiz by lesson: %w", err)
	}
	return &quiz, nil
}

func (r *PostgreSQLQuizRepository) GetQuizWithQuestions(ctx context.Context, quizID, tenantID uuid.UUID) (*domain.Quiz, []domain.Question, error) {
	// Get quiz
	quiz, err := r.GetQuizByID(ctx, quizID, tenantID)
	if err != nil {
		return nil, nil, err
	}

	// Get questions
	questions, err := r.GetQuestionsByQuizID(ctx, quizID, tenantID)
	if err != nil {
		return nil, nil, err
	}

	return quiz, questions, nil
}

// ============================================================================
// Question operations
// ============================================================================

func (r *PostgreSQLQuizRepository) CreateQuestion(ctx context.Context, question *domain.Question) error {
	query := `
		INSERT INTO questions (
			id, tenant_id, quiz_id, type, text, points, explanation, order_index,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`
	_, err := r.db.ExecContext(ctx, query,
		question.ID, question.TenantID, question.QuizID, question.Type, question.Text,
		question.Points, question.Explanation, question.OrderIndex,
		question.CreatedAt, question.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create question: %w", err)
	}
	return nil
}

func (r *PostgreSQLQuizRepository) UpdateQuestion(ctx context.Context, question *domain.Question) error {
	query := `
		UPDATE questions SET
			text = $1, points = $2, explanation = $3, order_index = $4, updated_at = $5
		WHERE id = $6 AND tenant_id = $7
	`
	result, err := r.db.ExecContext(ctx, query,
		question.Text, question.Points, question.Explanation, question.OrderIndex, time.Now(),
		question.ID, question.TenantID,
	)
	if err != nil {
		return fmt.Errorf("failed to update question: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return ports.ErrQuestionNotFound
	}
	return nil
}

func (r *PostgreSQLQuizRepository) DeleteQuestion(ctx context.Context, questionID, tenantID uuid.UUID) error {
	query := `DELETE FROM questions WHERE id = $1 AND tenant_id = $2`
	result, err := r.db.ExecContext(ctx, query, questionID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete question: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return ports.ErrQuestionNotFound
	}
	return nil
}

func (r *PostgreSQLQuizRepository) GetQuestionByID(ctx context.Context, questionID, tenantID uuid.UUID) (*domain.Question, error) {
	query := `
		SELECT id, tenant_id, quiz_id, type, text, points, explanation, order_index,
			created_at, updated_at
		FROM questions
		WHERE id = $1 AND tenant_id = $2
	`
	var question domain.Question
	err := r.db.GetContext(ctx, &question, query, questionID, tenantID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ports.ErrQuestionNotFound
		}
		return nil, fmt.Errorf("failed to get question: %w", err)
	}
	return &question, nil
}

func (r *PostgreSQLQuizRepository) GetQuestionsByQuizID(ctx context.Context, quizID, tenantID uuid.UUID) ([]domain.Question, error) {
	query := `
		SELECT id, tenant_id, quiz_id, type, text, points, explanation, order_index,
			created_at, updated_at
		FROM questions
		WHERE quiz_id = $1 AND tenant_id = $2
		ORDER BY order_index ASC
	`
	var questions []domain.Question
	err := r.db.SelectContext(ctx, &questions, query, quizID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get questions: %w", err)
	}
	return questions, nil
}

func (r *PostgreSQLQuizRepository) GetMaxQuestionOrderIndex(ctx context.Context, quizID, tenantID uuid.UUID) (int, error) {
	query := `SELECT COALESCE(MAX(order_index), -1) FROM questions WHERE quiz_id = $1 AND tenant_id = $2`
	var maxOrder int
	err := r.db.GetContext(ctx, &maxOrder, query, quizID, tenantID)
	if err != nil {
		return -1, fmt.Errorf("failed to get max order index: %w", err)
	}
	return maxOrder, nil
}

func (r *PostgreSQLQuizRepository) ReorderQuestions(ctx context.Context, quizID, tenantID uuid.UUID, orders []domain.QuestionOrder) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	query := `
		UPDATE questions SET order_index = $1, updated_at = $2
		WHERE id = $3 AND quiz_id = $4 AND tenant_id = $5
	`
	for _, order := range orders {
		result, err := tx.ExecContext(ctx, query, order.OrderIndex, time.Now(), order.QuestionID, quizID, tenantID)
		if err != nil {
			return fmt.Errorf("failed to update question order: %w", err)
		}

		rows, err := result.RowsAffected()
		if err != nil {
			return fmt.Errorf("failed to get rows affected: %w", err)
		}
		if rows == 0 {
			return ports.ErrQuestionNotFound
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	return nil
}

// ============================================================================
// Question option operations
// ============================================================================

func (r *PostgreSQLQuizRepository) CreateOption(ctx context.Context, option *domain.QuestionOption) error {
	query := `
		INSERT INTO question_options (
			id, tenant_id, question_id, text, is_correct, order_index,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := r.db.ExecContext(ctx, query,
		option.ID, option.TenantID, option.QuestionID, option.Text,
		option.IsCorrect, option.OrderIndex, option.CreatedAt, option.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create option: %w", err)
	}
	return nil
}

func (r *PostgreSQLQuizRepository) UpdateOption(ctx context.Context, option *domain.QuestionOption) error {
	query := `
		UPDATE question_options SET
			text = $1, is_correct = $2, order_index = $3, updated_at = $4
		WHERE id = $5 AND tenant_id = $6
	`
	result, err := r.db.ExecContext(ctx, query,
		option.Text, option.IsCorrect, option.OrderIndex, time.Now(),
		option.ID, option.TenantID,
	)
	if err != nil {
		return fmt.Errorf("failed to update option: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return ports.ErrOptionNotFound
	}
	return nil
}

func (r *PostgreSQLQuizRepository) DeleteOption(ctx context.Context, optionID, tenantID uuid.UUID) error {
	query := `DELETE FROM question_options WHERE id = $1 AND tenant_id = $2`
	result, err := r.db.ExecContext(ctx, query, optionID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete option: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return ports.ErrOptionNotFound
	}
	return nil
}

func (r *PostgreSQLQuizRepository) GetOptionByID(ctx context.Context, optionID, tenantID uuid.UUID) (*domain.QuestionOption, error) {
	query := `
		SELECT id, tenant_id, question_id, text, is_correct, order_index,
			created_at, updated_at
		FROM question_options
		WHERE id = $1 AND tenant_id = $2
	`
	var option domain.QuestionOption
	err := r.db.GetContext(ctx, &option, query, optionID, tenantID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ports.ErrOptionNotFound
		}
		return nil, fmt.Errorf("failed to get option: %w", err)
	}
	return &option, nil
}

func (r *PostgreSQLQuizRepository) GetOptionsByQuestionID(ctx context.Context, questionID, tenantID uuid.UUID) ([]domain.QuestionOption, error) {
	query := `
		SELECT id, tenant_id, question_id, text, is_correct, order_index,
			created_at, updated_at
		FROM question_options
		WHERE question_id = $1 AND tenant_id = $2
		ORDER BY order_index ASC
	`
	var options []domain.QuestionOption
	err := r.db.SelectContext(ctx, &options, query, questionID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get options: %w", err)
	}
	return options, nil
}

func (r *PostgreSQLQuizRepository) GetOptionsByQuestionIDs(ctx context.Context, questionIDs []uuid.UUID, tenantID uuid.UUID) (map[uuid.UUID][]domain.QuestionOption, error) {
	if len(questionIDs) == 0 {
		return make(map[uuid.UUID][]domain.QuestionOption), nil
	}

	query := `
		SELECT id, tenant_id, question_id, text, is_correct, order_index,
			created_at, updated_at
		FROM question_options
		WHERE question_id = ANY($1) AND tenant_id = $2
		ORDER BY order_index ASC
	`
	var options []domain.QuestionOption
	err := r.db.SelectContext(ctx, &options, query, questionIDs, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get options: %w", err)
	}

	// Group by question_id
	result := make(map[uuid.UUID][]domain.QuestionOption)
	for _, opt := range options {
		result[opt.QuestionID] = append(result[opt.QuestionID], opt)
	}

	return result, nil
}

func (r *PostgreSQLQuizRepository) DeleteOptionsByQuestionID(ctx context.Context, questionID, tenantID uuid.UUID) error {
	query := `DELETE FROM question_options WHERE question_id = $1 AND tenant_id = $2`
	_, err := r.db.ExecContext(ctx, query, questionID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete options: %w", err)
	}
	return nil
}

// ============================================================================
// Quiz attempt operations
// ============================================================================

func (r *PostgreSQLQuizRepository) CreateAttempt(ctx context.Context, attempt *domain.QuizAttempt) error {
	query := `
		INSERT INTO quiz_attempts (
			id, tenant_id, quiz_id, user_id, score, is_passed, time_spent,
			attempt_number, started_at, completed_at, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`
	_, err := r.db.ExecContext(ctx, query,
		attempt.ID, attempt.TenantID, attempt.QuizID, attempt.UserID,
		attempt.Score, attempt.IsPassed, attempt.TimeSpent, attempt.AttemptNumber,
		attempt.StartedAt, attempt.CompletedAt, attempt.CreatedAt, attempt.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create attempt: %w", err)
	}
	return nil
}

func (r *PostgreSQLQuizRepository) UpdateAttempt(ctx context.Context, attempt *domain.QuizAttempt) error {
	query := `
		UPDATE quiz_attempts SET
			score = $1, is_passed = $2, time_spent = $3, completed_at = $4, updated_at = $5
		WHERE id = $6 AND tenant_id = $7
	`
	result, err := r.db.ExecContext(ctx, query,
		attempt.Score, attempt.IsPassed, attempt.TimeSpent, attempt.CompletedAt, time.Now(),
		attempt.ID, attempt.TenantID,
	)
	if err != nil {
		return fmt.Errorf("failed to update attempt: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return ports.ErrAttemptNotFound
	}
	return nil
}

func (r *PostgreSQLQuizRepository) GetAttemptByID(ctx context.Context, attemptID, tenantID uuid.UUID) (*domain.QuizAttempt, error) {
	query := `
		SELECT id, tenant_id, quiz_id, user_id, score, is_passed, time_spent,
			attempt_number, started_at, completed_at, created_at, updated_at
		FROM quiz_attempts
		WHERE id = $1 AND tenant_id = $2
	`
	var attempt domain.QuizAttempt
	err := r.db.GetContext(ctx, &attempt, query, attemptID, tenantID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ports.ErrAttemptNotFound
		}
		return nil, fmt.Errorf("failed to get attempt: %w", err)
	}
	return &attempt, nil
}

func (r *PostgreSQLQuizRepository) GetAttemptsByUserAndQuiz(ctx context.Context, quizID, userID, tenantID uuid.UUID) ([]domain.QuizAttempt, error) {
	query := `
		SELECT id, tenant_id, quiz_id, user_id, score, is_passed, time_spent,
			attempt_number, started_at, completed_at, created_at, updated_at
		FROM quiz_attempts
		WHERE quiz_id = $1 AND user_id = $2 AND tenant_id = $3
		ORDER BY attempt_number DESC
	`
	var attempts []domain.QuizAttempt
	err := r.db.SelectContext(ctx, &attempts, query, quizID, userID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get attempts: %w", err)
	}
	return attempts, nil
}

func (r *PostgreSQLQuizRepository) GetAttemptsByQuiz(ctx context.Context, quizID, tenantID uuid.UUID, page, pageSize int) ([]domain.QuizAttempt, int, error) {
	offset := (page - 1) * pageSize

	// Get total count
	countQuery := `SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = $1 AND tenant_id = $2`
	var totalCount int
	err := r.db.GetContext(ctx, &totalCount, countQuery, quizID, tenantID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count attempts: %w", err)
	}

	// Get attempts
	query := `
		SELECT id, tenant_id, quiz_id, user_id, score, is_passed, time_spent,
			attempt_number, started_at, completed_at, created_at, updated_at
		FROM quiz_attempts
		WHERE quiz_id = $1 AND tenant_id = $2
		ORDER BY started_at DESC
		LIMIT $3 OFFSET $4
	`
	var attempts []domain.QuizAttempt
	err = r.db.SelectContext(ctx, &attempts, query, quizID, tenantID, pageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get attempts: %w", err)
	}

	return attempts, totalCount, nil
}

func (r *PostgreSQLQuizRepository) GetUserAttemptCount(ctx context.Context, quizID, userID, tenantID uuid.UUID) (int, error) {
	query := `SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = $1 AND user_id = $2 AND tenant_id = $3`
	var count int
	err := r.db.GetContext(ctx, &count, query, quizID, userID, tenantID)
	if err != nil {
		return 0, fmt.Errorf("failed to get attempt count: %w", err)
	}
	return count, nil
}

// ============================================================================
// Quiz answer operations
// ============================================================================

func (r *PostgreSQLQuizRepository) CreateAnswer(ctx context.Context, answer *domain.QuizAnswer) error {
	query := `
		INSERT INTO quiz_answers (
			id, tenant_id, attempt_id, question_id, answer_text, selected_option_id,
			is_correct, points_awarded, instructor_feedback, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`
	_, err := r.db.ExecContext(ctx, query,
		answer.ID, answer.TenantID, answer.AttemptID, answer.QuestionID,
		answer.AnswerText, answer.SelectedOptionID, answer.IsCorrect,
		answer.PointsAwarded, answer.InstructorFeedback,
		answer.CreatedAt, answer.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create answer: %w", err)
	}
	return nil
}

func (r *PostgreSQLQuizRepository) UpdateAnswer(ctx context.Context, answer *domain.QuizAnswer) error {
	query := `
		UPDATE quiz_answers SET
			is_correct = $1, points_awarded = $2, instructor_feedback = $3, updated_at = $4
		WHERE id = $5 AND tenant_id = $6
	`
	result, err := r.db.ExecContext(ctx, query,
		answer.IsCorrect, answer.PointsAwarded, answer.InstructorFeedback, time.Now(),
		answer.ID, answer.TenantID,
	)
	if err != nil {
		return fmt.Errorf("failed to update answer: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rows == 0 {
		return ports.ErrAnswerNotFound
	}
	return nil
}

func (r *PostgreSQLQuizRepository) GetAnswerByID(ctx context.Context, answerID, tenantID uuid.UUID) (*domain.QuizAnswer, error) {
	query := `
		SELECT id, tenant_id, attempt_id, question_id, answer_text, selected_option_id,
			is_correct, points_awarded, instructor_feedback, created_at, updated_at
		FROM quiz_answers
		WHERE id = $1 AND tenant_id = $2
	`
	var answer domain.QuizAnswer
	err := r.db.GetContext(ctx, &answer, query, answerID, tenantID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ports.ErrAnswerNotFound
		}
		return nil, fmt.Errorf("failed to get answer: %w", err)
	}
	return &answer, nil
}

func (r *PostgreSQLQuizRepository) GetAnswersByAttemptID(ctx context.Context, attemptID, tenantID uuid.UUID) ([]domain.QuizAnswer, error) {
	query := `
		SELECT id, tenant_id, attempt_id, question_id, answer_text, selected_option_id,
			is_correct, points_awarded, instructor_feedback, created_at, updated_at
		FROM quiz_answers
		WHERE attempt_id = $1 AND tenant_id = $2
		ORDER BY created_at ASC
	`
	var answers []domain.QuizAnswer
	err := r.db.SelectContext(ctx, &answers, query, attemptID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get answers: %w", err)
	}
	return answers, nil
}

func (r *PostgreSQLQuizRepository) GetAnswerByAttemptAndQuestion(ctx context.Context, attemptID, questionID, tenantID uuid.UUID) (*domain.QuizAnswer, error) {
	query := `
		SELECT id, tenant_id, attempt_id, question_id, answer_text, selected_option_id,
			is_correct, points_awarded, instructor_feedback, created_at, updated_at
		FROM quiz_answers
		WHERE attempt_id = $1 AND question_id = $2 AND tenant_id = $3
	`
	var answer domain.QuizAnswer
	err := r.db.GetContext(ctx, &answer, query, attemptID, questionID, tenantID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ports.ErrAnswerNotFound
		}
		return nil, fmt.Errorf("failed to get answer: %w", err)
	}
	return &answer, nil
}

// ============================================================================
// Statistics operations
// ============================================================================

func (r *PostgreSQLQuizRepository) GetQuizStatistics(ctx context.Context, quizID, tenantID uuid.UUID) (*domain.QuizStatisticsResponse, error) {
	query := `
		SELECT
			COUNT(*) as total_attempts,
			COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed_attempts,
			COALESCE(AVG(CASE WHEN score IS NOT NULL THEN score END), 0) as average_score,
			COALESCE(AVG(CASE WHEN time_spent IS NOT NULL THEN time_spent END), 0) as average_time_spent,
			COALESCE(
				COUNT(CASE WHEN is_passed = true THEN 1 END)::float /
				NULLIF(COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END), 0) * 100,
				0
			) as pass_rate
		FROM quiz_attempts
		WHERE quiz_id = $1 AND tenant_id = $2
	`
	var stats domain.QuizStatisticsResponse
	stats.QuizID = quizID

	err := r.db.QueryRowContext(ctx, query, quizID, tenantID).Scan(
		&stats.TotalAttempts,
		&stats.CompletedAttempts,
		&stats.AverageScore,
		&stats.AverageTimeSpent,
		&stats.PassRate,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get statistics: %w", err)
	}

	return &stats, nil
}

func (r *PostgreSQLQuizRepository) GetAverageScore(ctx context.Context, quizID, tenantID uuid.UUID) (float64, error) {
	query := `
		SELECT COALESCE(AVG(score), 0)
		FROM quiz_attempts
		WHERE quiz_id = $1 AND tenant_id = $2 AND score IS NOT NULL
	`
	var avg float64
	err := r.db.GetContext(ctx, &avg, query, quizID, tenantID)
	if err != nil {
		return 0, fmt.Errorf("failed to get average score: %w", err)
	}
	return avg, nil
}

func (r *PostgreSQLQuizRepository) GetPassRate(ctx context.Context, quizID, tenantID uuid.UUID) (float64, error) {
	query := `
		SELECT
			COALESCE(
				COUNT(CASE WHEN is_passed = true THEN 1 END)::float /
				NULLIF(COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END), 0) * 100,
				0
			) as pass_rate
		FROM quiz_attempts
		WHERE quiz_id = $1 AND tenant_id = $2
	`
	var passRate float64
	err := r.db.GetContext(ctx, &passRate, query, quizID, tenantID)
	if err != nil {
		return 0, fmt.Errorf("failed to get pass rate: %w", err)
	}
	return passRate, nil
}

func (r *PostgreSQLQuizRepository) GetPendingGradingCount(ctx context.Context, quizID, tenantID uuid.UUID) (int, error) {
	query := `
		SELECT COUNT(DISTINCT qa.id)
		FROM quiz_answers qa
		JOIN quiz_attempts qat ON qa.attempt_id = qat.id
		JOIN questions q ON qa.question_id = q.id
		WHERE qat.quiz_id = $1 AND qa.tenant_id = $2
			AND q.type = 'essay' AND qa.is_correct IS NULL
	`
	var count int
	err := r.db.GetContext(ctx, &count, query, quizID, tenantID)
	if err != nil {
		return 0, fmt.Errorf("failed to get pending grading count: %w", err)
	}
	return count, nil
}
