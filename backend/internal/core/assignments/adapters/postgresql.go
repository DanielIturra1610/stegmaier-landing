package adapters

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/assignments/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/assignments/ports"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

// PostgreSQLAssignmentRepository implements the AssignmentRepository interface using PostgreSQL
type PostgreSQLAssignmentRepository struct {
	db *sqlx.DB
}

// NewPostgreSQLAssignmentRepository creates a new PostgreSQL assignment repository
func NewPostgreSQLAssignmentRepository(db *sqlx.DB) ports.AssignmentRepository {
	return &PostgreSQLAssignmentRepository{
		db: db,
	}
}

// Database row structures

type assignmentRow struct {
	ID                       uuid.UUID      `db:"id"`
	TenantID                 uuid.UUID      `db:"tenant_id"`
	Title                    string         `db:"title"`
	Description              string         `db:"description"`
	Instructions             string         `db:"instructions"`
	Type                     string         `db:"assignment_type"`
	CourseID                 *uuid.UUID     `db:"course_id"`
	ModuleID                 *uuid.UUID     `db:"module_id"`
	LessonID                 *uuid.UUID     `db:"lesson_id"`
	MaxFileSize              int64          `db:"max_file_size"`
	AllowedFileTypes         pq.StringArray `db:"allowed_file_types"`
	MaxFiles                 int            `db:"max_files"`
	AllowMultipleSubmissions bool           `db:"allow_multiple_submissions"`
	AvailableFrom            *time.Time     `db:"available_from"`
	DueDate                  *time.Time     `db:"due_date"`
	LatePenaltyPerDay        float64        `db:"late_penalty_per_day"`
	AcceptLateSubmissions    bool           `db:"accept_late_submissions"`
	RubricID                 *uuid.UUID     `db:"rubric_id"`
	MaxPoints                float64        `db:"max_points"`
	PassingScore             float64        `db:"passing_score"`
	PeerReviewEnabled        bool           `db:"peer_review_enabled"`
	PeerReviewsRequired      int            `db:"peer_reviews_required"`
	AnonymousGrading         bool           `db:"anonymous_grading"`
	PlagiarismCheckEnabled   bool           `db:"plagiarism_check_enabled"`
	IsPublished              bool           `db:"is_published"`
	EstimatedDuration        int            `db:"estimated_duration"`
	TotalSubmissions         int            `db:"total_submissions"`
	GradedSubmissions        int            `db:"graded_submissions"`
	AverageGrade             float64        `db:"average_grade"`
	CreatedBy                uuid.UUID      `db:"created_by"`
	CreatedAt                time.Time      `db:"created_at"`
	UpdatedAt                time.Time      `db:"updated_at"`
}

type submissionRow struct {
	ID                   uuid.UUID      `db:"id"`
	TenantID             uuid.UUID      `db:"tenant_id"`
	AssignmentID         uuid.UUID      `db:"assignment_id"`
	StudentID            uuid.UUID      `db:"student_id"`
	TextContent          string         `db:"text_content"`
	Files                pq.StringArray `db:"files"`
	Status               string         `db:"status"`
	SubmissionNumber     int            `db:"submission_number"`
	IsFinal              bool           `db:"is_final"`
	GradeStatus          string         `db:"grade_status"`
	Grades               pq.StringArray `db:"grades"`
	TotalPointsEarned    float64        `db:"total_points_earned"`
	TotalPointsPossible  float64        `db:"total_points_possible"`
	PercentageGrade      float64        `db:"percentage_grade"`
	LetterGrade          *string        `db:"letter_grade"`
	IsPassing            bool           `db:"is_passing"`
	InstructorFeedback   string         `db:"instructor_feedback"`
	IsLate               bool           `db:"is_late"`
	DaysLate             int            `db:"days_late"`
	PenaltyApplied       float64        `db:"penalty_applied"`
	PlagiarismScore      *float64       `db:"plagiarism_score"`
	PlagiarismChecked    bool           `db:"plagiarism_checked"`
	SubmittedAt          *time.Time     `db:"submitted_at"`
	GradedAt             *time.Time     `db:"graded_at"`
	ReturnedAt           *time.Time     `db:"returned_at"`
	CreatedAt            time.Time      `db:"created_at"`
	UpdatedAt            time.Time      `db:"updated_at"`
}

type fileRow struct {
	ID               uuid.UUID  `db:"id"`
	TenantID         uuid.UUID  `db:"tenant_id"`
	AssignmentID     *uuid.UUID `db:"assignment_id"`
	SubmissionID     *uuid.UUID `db:"submission_id"`
	Filename         string     `db:"filename"`
	OriginalFilename string     `db:"original_filename"`
	FileType         string     `db:"file_type"`
	FileSize         int64      `db:"file_size"`
	MimeType         string     `db:"mime_type"`
	FilePath         string     `db:"file_path"`
	FileURL          *string    `db:"file_url"`
	IsTemplate       bool       `db:"is_template"`
	Description      *string    `db:"description"`
	UploadedBy       uuid.UUID  `db:"uploaded_by"`
	UploadedAt       time.Time  `db:"uploaded_at"`
}

type rubricRow struct {
	ID          uuid.UUID `db:"id"`
	TenantID    uuid.UUID `db:"tenant_id"`
	Name        string    `db:"name"`
	Description string    `db:"description"`
	Criteria    []byte    `db:"criteria"`
	TotalPoints float64   `db:"total_points"`
	IsTemplate  bool      `db:"is_template"`
	CreatedBy   uuid.UUID `db:"created_by"`
	CreatedAt   time.Time `db:"created_at"`
	UpdatedAt   time.Time `db:"updated_at"`
}

type gradeRow struct {
	ID                  uuid.UUID `db:"id"`
	TenantID            uuid.UUID `db:"tenant_id"`
	SubmissionID        uuid.UUID `db:"submission_id"`
	CriterionID         uuid.UUID `db:"criterion_id"`
	GraderID            uuid.UUID `db:"grader_id"`
	PointsEarned        float64   `db:"points_earned"`
	PointsPossible      float64   `db:"points_possible"`
	Feedback            string    `db:"feedback"`
	GradedAt            time.Time `db:"graded_at"`
}

type commentRow struct {
	ID           uuid.UUID `db:"id"`
	TenantID     uuid.UUID `db:"tenant_id"`
	SubmissionID uuid.UUID `db:"submission_id"`
	AuthorID     uuid.UUID `db:"author_id"`
	AuthorRole   string    `db:"author_role"`
	Content      string    `db:"content"`
	IsPrivate    bool      `db:"is_private"`
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
}

type peerReviewRow struct {
	ID             uuid.UUID `db:"id"`
	TenantID       uuid.UUID `db:"tenant_id"`
	AssignmentID   uuid.UUID `db:"assignment_id"`
	SubmissionID   uuid.UUID `db:"submission_id"`
	ReviewerID     uuid.UUID `db:"reviewer_id"`
	IsAnonymous    bool      `db:"is_anonymous"`
	Status         string    `db:"status"`
	Feedback       string    `db:"feedback"`
	Scores         []byte    `db:"scores"`
	DueDate        *time.Time `db:"due_date"`
	SubmittedAt    *time.Time `db:"submitted_at"`
	CreatedAt      time.Time `db:"created_at"`
	UpdatedAt      time.Time `db:"updated_at"`
}

// ========================================
// Assignment Operations
// ========================================

func (r *PostgreSQLAssignmentRepository) CreateAssignment(ctx context.Context, assignment *domain.Assignment) error {
	query := `
		INSERT INTO assignments (
			id, tenant_id, title, description, instructions, assignment_type,
			course_id, module_id, lesson_id, max_file_size, allowed_file_types,
			max_files, allow_multiple_submissions, available_from, due_date,
			late_penalty_per_day, accept_late_submissions, rubric_id, max_points,
			passing_score, peer_review_enabled, peer_reviews_required,
			anonymous_grading, plagiarism_check_enabled, is_published,
			estimated_duration, total_submissions, graded_submissions,
			average_grade, created_by, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
			$16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
			$29, $30, $31, $32
		)
	`

	_, err := r.db.ExecContext(ctx, query,
		assignment.ID, assignment.TenantID, assignment.Title, assignment.Description,
		assignment.Instructions, assignment.Type, assignment.CourseID, assignment.ModuleID,
		assignment.LessonID, assignment.MaxFileSize, pq.Array(assignment.AllowedFileTypes),
		assignment.MaxFiles, assignment.AllowMultipleSubmissions, assignment.AvailableFrom,
		assignment.DueDate, assignment.LatePenaltyPerDay, assignment.AcceptLateSubmissions,
		assignment.RubricID, assignment.MaxPoints, assignment.PassingScore,
		assignment.PeerReviewEnabled, assignment.PeerReviewsRequired, assignment.AnonymousGrading,
		assignment.PlagiarismCheckEnabled, assignment.IsPublished, assignment.EstimatedDuration,
		assignment.TotalSubmissions, assignment.GradedSubmissions, assignment.AverageGrade,
		assignment.CreatedBy, assignment.CreatedAt, assignment.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create assignment: %w", err)
	}

	return nil
}

func (r *PostgreSQLAssignmentRepository) GetAssignment(ctx context.Context, id, tenantID uuid.UUID) (*domain.Assignment, error) {
	query := `
		SELECT
			id, tenant_id, title, description, instructions, assignment_type,
			course_id, module_id, lesson_id, max_file_size, allowed_file_types,
			max_files, allow_multiple_submissions, available_from, due_date,
			late_penalty_per_day, accept_late_submissions, rubric_id, max_points,
			passing_score, peer_review_enabled, peer_reviews_required,
			anonymous_grading, plagiarism_check_enabled, is_published,
			estimated_duration, total_submissions, graded_submissions,
			average_grade, created_by, created_at, updated_at
		FROM assignments
		WHERE id = $1 AND tenant_id = $2
	`

	var row assignmentRow
	err := r.db.GetContext(ctx, &row, query, id, tenantID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ports.ErrAssignmentNotFound
		}
		return nil, fmt.Errorf("failed to get assignment: %w", err)
	}

	return rowToAssignment(&row), nil
}

func (r *PostgreSQLAssignmentRepository) GetAssignmentsByCourse(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) ([]*domain.Assignment, int, error) {
	offset := (page - 1) * pageSize

	// Get total count
	var total int
	countQuery := `SELECT COUNT(*) FROM assignments WHERE course_id = $1 AND tenant_id = $2`
	err := r.db.GetContext(ctx, &total, countQuery, courseID, tenantID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count assignments: %w", err)
	}

	// Get assignments
	query := `
		SELECT
			id, tenant_id, title, description, instructions, assignment_type,
			course_id, module_id, lesson_id, max_file_size, allowed_file_types,
			max_files, allow_multiple_submissions, available_from, due_date,
			late_penalty_per_day, accept_late_submissions, rubric_id, max_points,
			passing_score, peer_review_enabled, peer_reviews_required,
			anonymous_grading, plagiarism_check_enabled, is_published,
			estimated_duration, total_submissions, graded_submissions,
			average_grade, created_by, created_at, updated_at
		FROM assignments
		WHERE course_id = $1 AND tenant_id = $2
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4
	`

	var rows []assignmentRow
	err = r.db.SelectContext(ctx, &rows, query, courseID, tenantID, pageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get assignments by course: %w", err)
	}

	assignments := make([]*domain.Assignment, len(rows))
	for i, row := range rows {
		assignments[i] = rowToAssignment(&row)
	}

	return assignments, total, nil
}

func (r *PostgreSQLAssignmentRepository) GetAssignmentsByModule(ctx context.Context, moduleID, tenantID uuid.UUID) ([]*domain.Assignment, error) {
	query := `
		SELECT
			id, tenant_id, title, description, instructions, assignment_type,
			course_id, module_id, lesson_id, max_file_size, allowed_file_types,
			max_files, allow_multiple_submissions, available_from, due_date,
			late_penalty_per_day, accept_late_submissions, rubric_id, max_points,
			passing_score, peer_review_enabled, peer_reviews_required,
			anonymous_grading, plagiarism_check_enabled, is_published,
			estimated_duration, total_submissions, graded_submissions,
			average_grade, created_by, created_at, updated_at
		FROM assignments
		WHERE module_id = $1 AND tenant_id = $2
		ORDER BY created_at DESC
	`

	var rows []assignmentRow
	err := r.db.SelectContext(ctx, &rows, query, moduleID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get assignments by module: %w", err)
	}

	assignments := make([]*domain.Assignment, len(rows))
	for i, row := range rows {
		assignments[i] = rowToAssignment(&row)
	}

	return assignments, nil
}

func (r *PostgreSQLAssignmentRepository) GetAssignmentsByLesson(ctx context.Context, lessonID, tenantID uuid.UUID) ([]*domain.Assignment, error) {
	query := `
		SELECT
			id, tenant_id, title, description, instructions, assignment_type,
			course_id, module_id, lesson_id, max_file_size, allowed_file_types,
			max_files, allow_multiple_submissions, available_from, due_date,
			late_penalty_per_day, accept_late_submissions, rubric_id, max_points,
			passing_score, peer_review_enabled, peer_reviews_required,
			anonymous_grading, plagiarism_check_enabled, is_published,
			estimated_duration, total_submissions, graded_submissions,
			average_grade, created_by, created_at, updated_at
		FROM assignments
		WHERE lesson_id = $1 AND tenant_id = $2
		ORDER BY created_at DESC
	`

	var rows []assignmentRow
	err := r.db.SelectContext(ctx, &rows, query, lessonID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get assignments by lesson: %w", err)
	}

	assignments := make([]*domain.Assignment, len(rows))
	for i, row := range rows {
		assignments[i] = rowToAssignment(&row)
	}

	return assignments, nil
}

func (r *PostgreSQLAssignmentRepository) GetPublishedAssignmentsByCourse(ctx context.Context, courseID, tenantID uuid.UUID) ([]*domain.Assignment, error) {
	query := `
		SELECT
			id, tenant_id, title, description, instructions, assignment_type,
			course_id, module_id, lesson_id, max_file_size, allowed_file_types,
			max_files, allow_multiple_submissions, available_from, due_date,
			late_penalty_per_day, accept_late_submissions, rubric_id, max_points,
			passing_score, peer_review_enabled, peer_reviews_required,
			anonymous_grading, plagiarism_check_enabled, is_published,
			estimated_duration, total_submissions, graded_submissions,
			average_grade, created_by, created_at, updated_at
		FROM assignments
		WHERE course_id = $1 AND tenant_id = $2 AND is_published = true
		ORDER BY created_at DESC
	`

	var rows []assignmentRow
	err := r.db.SelectContext(ctx, &rows, query, courseID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get published assignments: %w", err)
	}

	assignments := make([]*domain.Assignment, len(rows))
	for i, row := range rows {
		assignments[i] = rowToAssignment(&row)
	}

	return assignments, nil
}

func (r *PostgreSQLAssignmentRepository) UpdateAssignment(ctx context.Context, assignment *domain.Assignment) error {
	query := `
		UPDATE assignments SET
			title = $1, description = $2, instructions = $3, assignment_type = $4,
			course_id = $5, module_id = $6, lesson_id = $7, max_file_size = $8,
			allowed_file_types = $9, max_files = $10, allow_multiple_submissions = $11,
			available_from = $12, due_date = $13, late_penalty_per_day = $14,
			accept_late_submissions = $15, rubric_id = $16, max_points = $17,
			passing_score = $18, peer_review_enabled = $19, peer_reviews_required = $20,
			anonymous_grading = $21, plagiarism_check_enabled = $22, is_published = $23,
			estimated_duration = $24, total_submissions = $25, graded_submissions = $26,
			average_grade = $27, updated_at = $28
		WHERE id = $29 AND tenant_id = $30
	`

	_, err := r.db.ExecContext(ctx, query,
		assignment.Title, assignment.Description, assignment.Instructions, assignment.Type,
		assignment.CourseID, assignment.ModuleID, assignment.LessonID, assignment.MaxFileSize,
		pq.Array(assignment.AllowedFileTypes), assignment.MaxFiles, assignment.AllowMultipleSubmissions,
		assignment.AvailableFrom, assignment.DueDate, assignment.LatePenaltyPerDay,
		assignment.AcceptLateSubmissions, assignment.RubricID, assignment.MaxPoints,
		assignment.PassingScore, assignment.PeerReviewEnabled, assignment.PeerReviewsRequired,
		assignment.AnonymousGrading, assignment.PlagiarismCheckEnabled, assignment.IsPublished,
		assignment.EstimatedDuration, assignment.TotalSubmissions, assignment.GradedSubmissions,
		assignment.AverageGrade, assignment.UpdatedAt, assignment.ID, assignment.TenantID,
	)

	if err != nil {
		return fmt.Errorf("failed to update assignment: %w", err)
	}

	return nil
}

func (r *PostgreSQLAssignmentRepository) DeleteAssignment(ctx context.Context, id, tenantID uuid.UUID) error {
	query := `DELETE FROM assignments WHERE id = $1 AND tenant_id = $2`

	_, err := r.db.ExecContext(ctx, query, id, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete assignment: %w", err)
	}

	return nil
}

func (r *PostgreSQLAssignmentRepository) AssignmentExists(ctx context.Context, id, tenantID uuid.UUID) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM assignments WHERE id = $1 AND tenant_id = $2)`

	err := r.db.GetContext(ctx, &exists, query, id, tenantID)
	if err != nil {
		return false, fmt.Errorf("failed to check assignment existence: %w", err)
	}

	return exists, nil
}

func (r *PostgreSQLAssignmentRepository) CountAssignmentsByCourse(ctx context.Context, courseID, tenantID uuid.UUID) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM assignments WHERE course_id = $1 AND tenant_id = $2`

	err := r.db.GetContext(ctx, &count, query, courseID, tenantID)
	if err != nil {
		return 0, fmt.Errorf("failed to count assignments: %w", err)
	}

	return count, nil
}

// ========================================
// Submission Operations
// ========================================

func (r *PostgreSQLAssignmentRepository) CreateSubmission(ctx context.Context, submission *domain.AssignmentSubmission) error {
	query := `
		INSERT INTO assignment_submissions (
			id, tenant_id, assignment_id, student_id, text_content, files,
			status, submission_number, is_final, grade_status, grades,
			total_points_earned, total_points_possible, percentage_grade,
			letter_grade, is_passing, instructor_feedback, is_late, days_late,
			penalty_applied, plagiarism_score, plagiarism_checked, submitted_at,
			graded_at, returned_at, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
			$15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
		)
	`

	_, err := r.db.ExecContext(ctx, query,
		submission.ID, submission.TenantID, submission.AssignmentID, submission.StudentID,
		submission.TextContent, pq.Array(uuidSliceToStringSlice(submission.Files)),
		submission.Status, submission.SubmissionNumber, submission.IsFinal,
		submission.GradeStatus, pq.Array(uuidSliceToStringSlice(submission.Grades)),
		submission.TotalPointsEarned, submission.TotalPointsPossible, submission.PercentageGrade,
		submission.LetterGrade, submission.IsPassing, submission.InstructorFeedback,
		submission.IsLate, submission.DaysLate, submission.PenaltyApplied,
		submission.PlagiarismScore, false, submission.SubmittedAt,
		submission.GradedAt, nil, submission.CreatedAt, submission.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create submission: %w", err)
	}

	return nil
}

func (r *PostgreSQLAssignmentRepository) GetSubmission(ctx context.Context, id, tenantID uuid.UUID) (*domain.AssignmentSubmission, error) {
	query := `
		SELECT
			id, tenant_id, assignment_id, student_id, text_content, files,
			status, submission_number, is_final, grade_status, grades,
			total_points_earned, total_points_possible, percentage_grade,
			letter_grade, is_passing, instructor_feedback, is_late, days_late,
			penalty_applied, plagiarism_score, plagiarism_checked, submitted_at,
			graded_at, returned_at, created_at, updated_at
		FROM assignment_submissions
		WHERE id = $1 AND tenant_id = $2
	`

	var row submissionRow
	err := r.db.GetContext(ctx, &row, query, id, tenantID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ports.ErrSubmissionNotFound
		}
		return nil, fmt.Errorf("failed to get submission: %w", err)
	}

	return rowToSubmission(&row), nil
}

func (r *PostgreSQLAssignmentRepository) GetSubmissionByStudentAndAssignment(ctx context.Context, studentID, assignmentID, tenantID uuid.UUID) (*domain.AssignmentSubmission, error) {
	query := `
		SELECT
			id, tenant_id, assignment_id, student_id, text_content, files,
			status, submission_number, is_final, grade_status, grades,
			total_points_earned, total_points_possible, percentage_grade,
			letter_grade, is_passing, instructor_feedback, is_late, days_late,
			penalty_applied, plagiarism_score, plagiarism_checked, submitted_at,
			graded_at, returned_at, created_at, updated_at
		FROM assignment_submissions
		WHERE student_id = $1 AND assignment_id = $2 AND tenant_id = $3
	`

	var row submissionRow
	err := r.db.GetContext(ctx, &row, query, studentID, assignmentID, tenantID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ports.ErrSubmissionNotFound
		}
		return nil, fmt.Errorf("failed to get submission: %w", err)
	}

	return rowToSubmission(&row), nil
}

func (r *PostgreSQLAssignmentRepository) GetSubmissionsByAssignment(ctx context.Context, assignmentID, tenantID uuid.UUID, page, pageSize int) ([]*domain.AssignmentSubmission, int, error) {
	offset := (page - 1) * pageSize

	// Get total count
	var total int
	countQuery := `SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = $1 AND tenant_id = $2`
	err := r.db.GetContext(ctx, &total, countQuery, assignmentID, tenantID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count submissions: %w", err)
	}

	// Get submissions
	query := `
		SELECT
			id, tenant_id, assignment_id, student_id, text_content, files,
			status, submission_number, is_final, grade_status, grades,
			total_points_earned, total_points_possible, percentage_grade,
			letter_grade, is_passing, instructor_feedback, is_late, days_late,
			penalty_applied, plagiarism_score, plagiarism_checked, submitted_at,
			graded_at, returned_at, created_at, updated_at
		FROM assignment_submissions
		WHERE assignment_id = $1 AND tenant_id = $2
		ORDER BY submitted_at DESC
		LIMIT $3 OFFSET $4
	`

	var rows []submissionRow
	err = r.db.SelectContext(ctx, &rows, query, assignmentID, tenantID, pageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get submissions by assignment: %w", err)
	}

	submissions := make([]*domain.AssignmentSubmission, len(rows))
	for i, row := range rows {
		submissions[i] = rowToSubmission(&row)
	}

	return submissions, total, nil
}

func (r *PostgreSQLAssignmentRepository) GetSubmissionsByStudent(ctx context.Context, studentID, tenantID uuid.UUID, page, pageSize int) ([]*domain.AssignmentSubmission, int, error) {
	offset := (page - 1) * pageSize

	// Get total count
	var total int
	countQuery := `SELECT COUNT(*) FROM assignment_submissions WHERE student_id = $1 AND tenant_id = $2`
	err := r.db.GetContext(ctx, &total, countQuery, studentID, tenantID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count submissions: %w", err)
	}

	// Get submissions
	query := `
		SELECT
			id, tenant_id, assignment_id, student_id, text_content, files,
			status, submission_number, is_final, grade_status, grades,
			total_points_earned, total_points_possible, percentage_grade,
			letter_grade, is_passing, instructor_feedback, is_late, days_late,
			penalty_applied, plagiarism_score, plagiarism_checked, submitted_at,
			graded_at, returned_at, created_at, updated_at
		FROM assignment_submissions
		WHERE student_id = $1 AND tenant_id = $2
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4
	`

	var rows []submissionRow
	err = r.db.SelectContext(ctx, &rows, query, studentID, tenantID, pageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get submissions by student: %w", err)
	}

	submissions := make([]*domain.AssignmentSubmission, len(rows))
	for i, row := range rows {
		submissions[i] = rowToSubmission(&row)
	}

	return submissions, total, nil
}

func (r *PostgreSQLAssignmentRepository) GetSubmissionsByCourse(ctx context.Context, courseID, studentID, tenantID uuid.UUID) ([]*domain.AssignmentSubmission, error) {
	query := `
		SELECT
			s.id, s.tenant_id, s.assignment_id, s.student_id, s.text_content, s.files,
			s.status, s.submission_number, s.is_final, s.grade_status, s.grades,
			s.total_points_earned, s.total_points_possible, s.percentage_grade,
			s.letter_grade, s.is_passing, s.instructor_feedback, s.is_late, s.days_late,
			s.penalty_applied, s.plagiarism_score, s.plagiarism_checked, s.submitted_at,
			s.graded_at, s.returned_at, s.created_at, s.updated_at
		FROM assignment_submissions s
		INNER JOIN assignments a ON s.assignment_id = a.id
		WHERE a.course_id = $1 AND s.student_id = $2 AND s.tenant_id = $3
		ORDER BY s.created_at DESC
	`

	var rows []submissionRow
	err := r.db.SelectContext(ctx, &rows, query, courseID, studentID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get submissions by course: %w", err)
	}

	submissions := make([]*domain.AssignmentSubmission, len(rows))
	for i, row := range rows {
		submissions[i] = rowToSubmission(&row)
	}

	return submissions, nil
}

func (r *PostgreSQLAssignmentRepository) UpdateSubmission(ctx context.Context, submission *domain.AssignmentSubmission) error {
	query := `
		UPDATE assignment_submissions SET
			text_content = $1, files = $2, status = $3, submission_number = $4,
			is_final = $5, grade_status = $6, grades = $7, total_points_earned = $8,
			total_points_possible = $9, percentage_grade = $10, letter_grade = $11,
			is_passing = $12, instructor_feedback = $13, is_late = $14, days_late = $15,
			penalty_applied = $16, plagiarism_score = $17, plagiarism_checked = $18,
			submitted_at = $19, graded_at = $20, returned_at = $21, updated_at = $22
		WHERE id = $23 AND tenant_id = $24
	`

	_, err := r.db.ExecContext(ctx, query,
		submission.TextContent, pq.Array(uuidSliceToStringSlice(submission.Files)),
		submission.Status, submission.SubmissionNumber, submission.IsFinal,
		submission.GradeStatus, pq.Array(uuidSliceToStringSlice(submission.Grades)),
		submission.TotalPointsEarned, submission.TotalPointsPossible, submission.PercentageGrade,
		submission.LetterGrade, submission.IsPassing, submission.InstructorFeedback,
		submission.IsLate, submission.DaysLate, submission.PenaltyApplied,
		submission.PlagiarismScore, false, submission.SubmittedAt,
		submission.GradedAt, nil, submission.UpdatedAt,
		submission.ID, submission.TenantID,
	)

	if err != nil {
		return fmt.Errorf("failed to update submission: %w", err)
	}

	return nil
}

func (r *PostgreSQLAssignmentRepository) DeleteSubmission(ctx context.Context, id, tenantID uuid.UUID) error {
	query := `DELETE FROM assignment_submissions WHERE id = $1 AND tenant_id = $2`

	_, err := r.db.ExecContext(ctx, query, id, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete submission: %w", err)
	}

	return nil
}

func (r *PostgreSQLAssignmentRepository) SubmissionExists(ctx context.Context, studentID, assignmentID, tenantID uuid.UUID) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM assignment_submissions WHERE student_id = $1 AND assignment_id = $2 AND tenant_id = $3)`

	err := r.db.GetContext(ctx, &exists, query, studentID, assignmentID, tenantID)
	if err != nil {
		return false, fmt.Errorf("failed to check submission existence: %w", err)
	}

	return exists, nil
}

func (r *PostgreSQLAssignmentRepository) CountSubmissionsByAssignment(ctx context.Context, assignmentID, tenantID uuid.UUID) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = $1 AND tenant_id = $2`

	err := r.db.GetContext(ctx, &count, query, assignmentID, tenantID)
	if err != nil {
		return 0, fmt.Errorf("failed to count submissions: %w", err)
	}

	return count, nil
}

func (r *PostgreSQLAssignmentRepository) CountSubmissionsByStatus(ctx context.Context, assignmentID, tenantID uuid.UUID, status domain.SubmissionStatus) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = $1 AND tenant_id = $2 AND status = $3`

	err := r.db.GetContext(ctx, &count, query, assignmentID, tenantID, status)
	if err != nil {
		return 0, fmt.Errorf("failed to count submissions by status: %w", err)
	}

	return count, nil
}

// ========================================
// File Operations
// ========================================

func (r *PostgreSQLAssignmentRepository) CreateFile(ctx context.Context, file *domain.AssignmentFile) error {
	query := `
		INSERT INTO assignment_files (
			id, tenant_id, assignment_id, submission_id, filename, original_filename,
			file_type, file_size, mime_type, file_path, file_url, is_template,
			description, uploaded_by, uploaded_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
		)
	`

	_, err := r.db.ExecContext(ctx, query,
		file.ID, file.TenantID, file.AssignmentID, file.SubmissionID, file.Filename,
		file.OriginalFilename, file.FileType, file.FileSize, file.MimeType, file.FilePath,
		file.FileURL, file.IsTemplate, file.Description, file.UploadedBy, file.UploadedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}

	return nil
}

func (r *PostgreSQLAssignmentRepository) GetFile(ctx context.Context, id, tenantID uuid.UUID) (*domain.AssignmentFile, error) {
	query := `
		SELECT
			id, tenant_id, assignment_id, submission_id, filename, original_filename,
			file_type, file_size, mime_type, file_path, file_url, is_template,
			description, uploaded_by, uploaded_at
		FROM assignment_files
		WHERE id = $1 AND tenant_id = $2
	`

	var row fileRow
	err := r.db.GetContext(ctx, &row, query, id, tenantID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ports.ErrFileNotFound
		}
		return nil, fmt.Errorf("failed to get file: %w", err)
	}

	return rowToFile(&row), nil
}

func (r *PostgreSQLAssignmentRepository) GetFilesByAssignment(ctx context.Context, assignmentID, tenantID uuid.UUID) ([]*domain.AssignmentFile, error) {
	query := `
		SELECT
			id, tenant_id, assignment_id, submission_id, filename, original_filename,
			file_type, file_size, mime_type, file_path, file_url, is_template,
			description, uploaded_by, uploaded_at
		FROM assignment_files
		WHERE assignment_id = $1 AND tenant_id = $2
		ORDER BY uploaded_at DESC
	`

	var rows []fileRow
	err := r.db.SelectContext(ctx, &rows, query, assignmentID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get files by assignment: %w", err)
	}

	files := make([]*domain.AssignmentFile, len(rows))
	for i, row := range rows {
		files[i] = rowToFile(&row)
	}

	return files, nil
}

func (r *PostgreSQLAssignmentRepository) GetFilesBySubmission(ctx context.Context, submissionID, tenantID uuid.UUID) ([]*domain.AssignmentFile, error) {
	query := `
		SELECT
			id, tenant_id, assignment_id, submission_id, filename, original_filename,
			file_type, file_size, mime_type, file_path, file_url, is_template,
			description, uploaded_by, uploaded_at
		FROM assignment_files
		WHERE submission_id = $1 AND tenant_id = $2
		ORDER BY uploaded_at DESC
	`

	var rows []fileRow
	err := r.db.SelectContext(ctx, &rows, query, submissionID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get files by submission: %w", err)
	}

	files := make([]*domain.AssignmentFile, len(rows))
	for i, row := range rows {
		files[i] = rowToFile(&row)
	}

	return files, nil
}

func (r *PostgreSQLAssignmentRepository) DeleteFile(ctx context.Context, id, tenantID uuid.UUID) error {
	query := `DELETE FROM assignment_files WHERE id = $1 AND tenant_id = $2`

	_, err := r.db.ExecContext(ctx, query, id, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	return nil
}

func (r *PostgreSQLAssignmentRepository) FileExists(ctx context.Context, id, tenantID uuid.UUID) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM assignment_files WHERE id = $1 AND tenant_id = $2)`

	err := r.db.GetContext(ctx, &exists, query, id, tenantID)
	if err != nil {
		return false, fmt.Errorf("failed to check file existence: %w", err)
	}

	return exists, nil
}

// ========================================
// Rubric Operations
// ========================================

func (r *PostgreSQLAssignmentRepository) CreateRubric(ctx context.Context, rubric *domain.Rubric) error {
	criteriaJSON, err := json.Marshal(rubric.Criteria)
	if err != nil {
		return fmt.Errorf("failed to marshal criteria: %w", err)
	}

	query := `
		INSERT INTO rubrics (
			id, tenant_id, name, description, criteria, total_points,
			is_template, created_by, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10
		)
	`

	_, err = r.db.ExecContext(ctx, query,
		rubric.ID, rubric.TenantID, rubric.Name, rubric.Description, criteriaJSON,
		rubric.TotalPoints, rubric.IsTemplate, rubric.CreatedBy, rubric.CreatedAt,
		rubric.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create rubric: %w", err)
	}

	return nil
}

func (r *PostgreSQLAssignmentRepository) GetRubric(ctx context.Context, id, tenantID uuid.UUID) (*domain.Rubric, error) {
	query := `
		SELECT
			id, tenant_id, name, description, criteria, total_points,
			is_template, created_by, created_at, updated_at
		FROM rubrics
		WHERE id = $1 AND tenant_id = $2
	`

	var row rubricRow
	err := r.db.GetContext(ctx, &row, query, id, tenantID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ports.ErrRubricNotFound
		}
		return nil, fmt.Errorf("failed to get rubric: %w", err)
	}

	return rowToRubric(&row)
}

func (r *PostgreSQLAssignmentRepository) GetRubricsByTenant(ctx context.Context, tenantID uuid.UUID, page, pageSize int) ([]*domain.Rubric, int, error) {
	offset := (page - 1) * pageSize

	// Get total count
	var total int
	countQuery := `SELECT COUNT(*) FROM rubrics WHERE tenant_id = $1`
	err := r.db.GetContext(ctx, &total, countQuery, tenantID)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count rubrics: %w", err)
	}

	// Get rubrics
	query := `
		SELECT
			id, tenant_id, name, description, criteria, total_points,
			is_template, created_by, created_at, updated_at
		FROM rubrics
		WHERE tenant_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	var rows []rubricRow
	err = r.db.SelectContext(ctx, &rows, query, tenantID, pageSize, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get rubrics: %w", err)
	}

	rubrics := make([]*domain.Rubric, 0, len(rows))
	for _, row := range rows {
		rubric, err := rowToRubric(&row)
		if err != nil {
			continue
		}
		rubrics = append(rubrics, rubric)
	}

	return rubrics, total, nil
}

func (r *PostgreSQLAssignmentRepository) GetRubricTemplates(ctx context.Context, tenantID uuid.UUID) ([]*domain.Rubric, error) {
	query := `
		SELECT
			id, tenant_id, name, description, criteria, total_points,
			is_template, created_by, created_at, updated_at
		FROM rubrics
		WHERE tenant_id = $1 AND is_template = true
		ORDER BY created_at DESC
	`

	var rows []rubricRow
	err := r.db.SelectContext(ctx, &rows, query, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get rubric templates: %w", err)
	}

	rubrics := make([]*domain.Rubric, 0, len(rows))
	for _, row := range rows {
		rubric, err := rowToRubric(&row)
		if err != nil {
			continue
		}
		rubrics = append(rubrics, rubric)
	}

	return rubrics, nil
}

func (r *PostgreSQLAssignmentRepository) UpdateRubric(ctx context.Context, rubric *domain.Rubric) error {
	criteriaJSON, err := json.Marshal(rubric.Criteria)
	if err != nil {
		return fmt.Errorf("failed to marshal criteria: %w", err)
	}

	query := `
		UPDATE rubrics SET
			name = $1, description = $2, criteria = $3, total_points = $4,
			is_template = $5, updated_at = $6
		WHERE id = $7 AND tenant_id = $8
	`

	_, err = r.db.ExecContext(ctx, query,
		rubric.Name, rubric.Description, criteriaJSON, rubric.TotalPoints,
		rubric.IsTemplate, rubric.UpdatedAt, rubric.ID, rubric.TenantID,
	)

	if err != nil {
		return fmt.Errorf("failed to update rubric: %w", err)
	}

	return nil
}

func (r *PostgreSQLAssignmentRepository) DeleteRubric(ctx context.Context, id, tenantID uuid.UUID) error {
	query := `DELETE FROM rubrics WHERE id = $1 AND tenant_id = $2`

	_, err := r.db.ExecContext(ctx, query, id, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete rubric: %w", err)
	}

	return nil
}

func (r *PostgreSQLAssignmentRepository) RubricExists(ctx context.Context, id, tenantID uuid.UUID) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM rubrics WHERE id = $1 AND tenant_id = $2)`

	err := r.db.GetContext(ctx, &exists, query, id, tenantID)
	if err != nil {
		return false, fmt.Errorf("failed to check rubric existence: %w", err)
	}

	return exists, nil
}

// ========================================
// Grade Operations
// ========================================

func (r *PostgreSQLAssignmentRepository) CreateGrade(ctx context.Context, grade *domain.SubmissionGrade) error {
	query := `
		INSERT INTO submission_grades (
			id, tenant_id, submission_id, criterion_id, grader_id,
			points_earned, points_possible, feedback, graded_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9
		)
	`

	_, err := r.db.ExecContext(ctx, query,
		grade.ID, grade.TenantID, grade.SubmissionID, grade.CriterionID,
		grade.GraderID, grade.PointsEarned, grade.PointsPossible,
		grade.Feedback, grade.GradedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create grade: %w", err)
	}

	return nil
}

func (r *PostgreSQLAssignmentRepository) GetGrade(ctx context.Context, id, tenantID uuid.UUID) (*domain.SubmissionGrade, error) {
	query := `
		SELECT
			id, tenant_id, submission_id, criterion_id, grader_id,
			points_earned, points_possible, feedback, graded_at
		FROM submission_grades
		WHERE id = $1 AND tenant_id = $2
	`

	var row gradeRow
	err := r.db.GetContext(ctx, &row, query, id, tenantID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ports.ErrGradeNotFound
		}
		return nil, fmt.Errorf("failed to get grade: %w", err)
	}

	return rowToGrade(&row), nil
}

func (r *PostgreSQLAssignmentRepository) GetGradesBySubmission(ctx context.Context, submissionID, tenantID uuid.UUID) ([]*domain.SubmissionGrade, error) {
	query := `
		SELECT
			id, tenant_id, submission_id, criterion_id, grader_id,
			points_earned, points_possible, feedback, graded_at
		FROM submission_grades
		WHERE submission_id = $1 AND tenant_id = $2
		ORDER BY graded_at DESC
	`

	var rows []gradeRow
	err := r.db.SelectContext(ctx, &rows, query, submissionID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get grades by submission: %w", err)
	}

	grades := make([]*domain.SubmissionGrade, len(rows))
	for i, row := range rows {
		grades[i] = rowToGrade(&row)
	}

	return grades, nil
}

func (r *PostgreSQLAssignmentRepository) UpdateGrade(ctx context.Context, grade *domain.SubmissionGrade) error {
	query := `
		UPDATE submission_grades SET
			points_earned = $1, points_possible = $2, feedback = $3, graded_at = $4
		WHERE id = $5 AND tenant_id = $6
	`

	_, err := r.db.ExecContext(ctx, query,
		grade.PointsEarned, grade.PointsPossible, grade.Feedback, grade.GradedAt,
		grade.ID, grade.TenantID,
	)

	if err != nil {
		return fmt.Errorf("failed to update grade: %w", err)
	}

	return nil
}

func (r *PostgreSQLAssignmentRepository) DeleteGrade(ctx context.Context, id, tenantID uuid.UUID) error {
	query := `DELETE FROM submission_grades WHERE id = $1 AND tenant_id = $2`

	_, err := r.db.ExecContext(ctx, query, id, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete grade: %w", err)
	}

	return nil
}

func (r *PostgreSQLAssignmentRepository) DeleteGradesBySubmission(ctx context.Context, submissionID, tenantID uuid.UUID) error {
	query := `DELETE FROM submission_grades WHERE submission_id = $1 AND tenant_id = $2`

	_, err := r.db.ExecContext(ctx, query, submissionID, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete grades by submission: %w", err)
	}

	return nil
}

// ========================================
// Comment Operations
// ========================================

func (r *PostgreSQLAssignmentRepository) CreateComment(ctx context.Context, comment *domain.SubmissionComment) error {
	query := `
		INSERT INTO submission_comments (
			id, tenant_id, submission_id, author_id, author_role,
			content, is_private, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9
		)
	`

	_, err := r.db.ExecContext(ctx, query,
		comment.ID, comment.TenantID, comment.SubmissionID, comment.AuthorID,
		comment.AuthorRole, comment.Content, comment.IsPrivate, comment.CreatedAt,
		comment.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create comment: %w", err)
	}

	return nil
}

func (r *PostgreSQLAssignmentRepository) GetComment(ctx context.Context, id, tenantID uuid.UUID) (*domain.SubmissionComment, error) {
	query := `
		SELECT
			id, tenant_id, submission_id, author_id, author_role,
			content, is_private, created_at, updated_at
		FROM submission_comments
		WHERE id = $1 AND tenant_id = $2
	`

	var row commentRow
	err := r.db.GetContext(ctx, &row, query, id, tenantID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ports.ErrCommentNotFound
		}
		return nil, fmt.Errorf("failed to get comment: %w", err)
	}

	return rowToComment(&row), nil
}

func (r *PostgreSQLAssignmentRepository) GetCommentsBySubmission(ctx context.Context, submissionID, tenantID uuid.UUID) ([]*domain.SubmissionComment, error) {
	query := `
		SELECT
			id, tenant_id, submission_id, author_id, author_role,
			content, is_private, created_at, updated_at
		FROM submission_comments
		WHERE submission_id = $1 AND tenant_id = $2
		ORDER BY created_at ASC
	`

	var rows []commentRow
	err := r.db.SelectContext(ctx, &rows, query, submissionID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get comments by submission: %w", err)
	}

	comments := make([]*domain.SubmissionComment, len(rows))
	for i, row := range rows {
		comments[i] = rowToComment(&row)
	}

	return comments, nil
}

func (r *PostgreSQLAssignmentRepository) UpdateComment(ctx context.Context, comment *domain.SubmissionComment) error {
	query := `
		UPDATE submission_comments SET
			content = $1, is_private = $2, updated_at = $3
		WHERE id = $4 AND tenant_id = $5
	`

	_, err := r.db.ExecContext(ctx, query,
		comment.Content, comment.IsPrivate, comment.UpdatedAt, comment.ID, comment.TenantID,
	)

	if err != nil {
		return fmt.Errorf("failed to update comment: %w", err)
	}

	return nil
}

func (r *PostgreSQLAssignmentRepository) DeleteComment(ctx context.Context, id, tenantID uuid.UUID) error {
	query := `DELETE FROM submission_comments WHERE id = $1 AND tenant_id = $2`

	_, err := r.db.ExecContext(ctx, query, id, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete comment: %w", err)
	}

	return nil
}

// ========================================
// Peer Review Operations
// ========================================

func (r *PostgreSQLAssignmentRepository) CreatePeerReview(ctx context.Context, review *domain.PeerReview) error {
	scoresJSON, err := json.Marshal(review.Scores)
	if err != nil {
		return fmt.Errorf("failed to marshal scores: %w", err)
	}

	query := `
		INSERT INTO peer_reviews (
			id, tenant_id, assignment_id, submission_id, reviewer_id,
			is_anonymous, status, feedback, scores, due_date, submitted_at,
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
		)
	`

	status := "pending"
	if review.IsCompleted {
		status = "completed"
	}

	_, err = r.db.ExecContext(ctx, query,
		review.ID, review.TenantID, review.AssignmentID, review.SubmissionID,
		review.ReviewerID, review.IsAnonymous, status, review.Feedback,
		scoresJSON, review.DueDate, review.SubmittedAt, review.AssignedAt,
		review.AssignedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create peer review: %w", err)
	}

	return nil
}

func (r *PostgreSQLAssignmentRepository) GetPeerReview(ctx context.Context, id, tenantID uuid.UUID) (*domain.PeerReview, error) {
	query := `
		SELECT
			id, tenant_id, assignment_id, submission_id, reviewer_id,
			is_anonymous, status, feedback, scores, due_date, submitted_at,
			created_at, updated_at
		FROM peer_reviews
		WHERE id = $1 AND tenant_id = $2
	`

	var row peerReviewRow
	err := r.db.GetContext(ctx, &row, query, id, tenantID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ports.ErrPeerReviewNotFound
		}
		return nil, fmt.Errorf("failed to get peer review: %w", err)
	}

	return rowToPeerReview(&row)
}

func (r *PostgreSQLAssignmentRepository) GetPeerReviewsBySubmission(ctx context.Context, submissionID, tenantID uuid.UUID) ([]*domain.PeerReview, error) {
	query := `
		SELECT
			id, tenant_id, assignment_id, submission_id, reviewer_id,
			is_anonymous, status, feedback, scores, due_date, submitted_at,
			created_at, updated_at
		FROM peer_reviews
		WHERE submission_id = $1 AND tenant_id = $2
		ORDER BY created_at DESC
	`

	var rows []peerReviewRow
	err := r.db.SelectContext(ctx, &rows, query, submissionID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get peer reviews by submission: %w", err)
	}

	reviews := make([]*domain.PeerReview, 0, len(rows))
	for _, row := range rows {
		review, err := rowToPeerReview(&row)
		if err != nil {
			continue
		}
		reviews = append(reviews, review)
	}

	return reviews, nil
}

func (r *PostgreSQLAssignmentRepository) GetPeerReviewsByReviewer(ctx context.Context, reviewerID, tenantID uuid.UUID) ([]*domain.PeerReview, error) {
	query := `
		SELECT
			id, tenant_id, assignment_id, submission_id, reviewer_id,
			is_anonymous, status, feedback, scores, due_date, submitted_at,
			created_at, updated_at
		FROM peer_reviews
		WHERE reviewer_id = $1 AND tenant_id = $2
		ORDER BY created_at DESC
	`

	var rows []peerReviewRow
	err := r.db.SelectContext(ctx, &rows, query, reviewerID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get peer reviews by reviewer: %w", err)
	}

	reviews := make([]*domain.PeerReview, 0, len(rows))
	for _, row := range rows {
		review, err := rowToPeerReview(&row)
		if err != nil {
			continue
		}
		reviews = append(reviews, review)
	}

	return reviews, nil
}

func (r *PostgreSQLAssignmentRepository) GetPeerReviewByReviewerAndSubmission(ctx context.Context, reviewerID, submissionID, tenantID uuid.UUID) (*domain.PeerReview, error) {
	query := `
		SELECT
			id, tenant_id, assignment_id, submission_id, reviewer_id,
			is_anonymous, status, feedback, scores, due_date, submitted_at,
			created_at, updated_at
		FROM peer_reviews
		WHERE reviewer_id = $1 AND submission_id = $2 AND tenant_id = $3
	`

	var row peerReviewRow
	err := r.db.GetContext(ctx, &row, query, reviewerID, submissionID, tenantID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ports.ErrPeerReviewNotFound
		}
		return nil, fmt.Errorf("failed to get peer review: %w", err)
	}

	return rowToPeerReview(&row)
}

func (r *PostgreSQLAssignmentRepository) UpdatePeerReview(ctx context.Context, review *domain.PeerReview) error {
	scoresJSON, err := json.Marshal(review.Scores)
	if err != nil {
		return fmt.Errorf("failed to marshal scores: %w", err)
	}

	status := "pending"
	if review.IsCompleted {
		status = "completed"
	}

	query := `
		UPDATE peer_reviews SET
			status = $1, feedback = $2, scores = $3, submitted_at = $4, updated_at = CURRENT_TIMESTAMP
		WHERE id = $5 AND tenant_id = $6
	`

	_, err = r.db.ExecContext(ctx, query,
		status, review.Feedback, scoresJSON, review.SubmittedAt,
		review.ID, review.TenantID,
	)

	if err != nil {
		return fmt.Errorf("failed to update peer review: %w", err)
	}

	return nil
}

func (r *PostgreSQLAssignmentRepository) DeletePeerReview(ctx context.Context, id, tenantID uuid.UUID) error {
	query := `DELETE FROM peer_reviews WHERE id = $1 AND tenant_id = $2`

	_, err := r.db.ExecContext(ctx, query, id, tenantID)
	if err != nil {
		return fmt.Errorf("failed to delete peer review: %w", err)
	}

	return nil
}

func (r *PostgreSQLAssignmentRepository) CountCompletedPeerReviews(ctx context.Context, submissionID, tenantID uuid.UUID) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM peer_reviews WHERE submission_id = $1 AND tenant_id = $2 AND status = 'completed'`

	err := r.db.GetContext(ctx, &count, query, submissionID, tenantID)
	if err != nil {
		return 0, fmt.Errorf("failed to count completed peer reviews: %w", err)
	}

	return count, nil
}

// ========================================
// Statistics Operations
// ========================================

func (r *PostgreSQLAssignmentRepository) GetAssignmentStatistics(ctx context.Context, assignmentID, tenantID uuid.UUID) (*domain.AssignmentStatisticsResponse, error) {
	var stats domain.AssignmentStatisticsResponse

	// Get total submissions
	countQuery := `SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = $1 AND tenant_id = $2`
	err := r.db.GetContext(ctx, &stats.TotalSubmissions, countQuery, assignmentID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to count total submissions: %w", err)
	}

	// Get graded submissions
	gradedQuery := `SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = $1 AND tenant_id = $2 AND grade_status = 'completed'`
	err = r.db.GetContext(ctx, &stats.GradedSubmissions, gradedQuery, assignmentID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to count graded submissions: %w", err)
	}

	// Get average grade
	avgQuery := `SELECT COALESCE(AVG(percentage_grade), 0) FROM assignment_submissions WHERE assignment_id = $1 AND tenant_id = $2 AND grade_status = 'completed'`
	err = r.db.GetContext(ctx, &stats.AverageGrade, avgQuery, assignmentID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate average grade: %w", err)
	}

	return &stats, nil
}

func (r *PostgreSQLAssignmentRepository) GetStudentProgress(ctx context.Context, studentID, courseID, tenantID uuid.UUID) (*domain.StudentProgressResponse, error) {
	query := `
		SELECT
			COUNT(*) as total_assignments,
			COUNT(CASE WHEN s.id IS NOT NULL THEN 1 END) as submitted_assignments,
			COUNT(CASE WHEN s.grade_status = 'completed' THEN 1 END) as graded_assignments,
			COALESCE(AVG(CASE WHEN s.grade_status = 'completed' THEN s.percentage_grade END), 0) as average_grade
		FROM assignments a
		LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.student_id = $1
		WHERE a.course_id = $2 AND a.tenant_id = $3 AND a.is_published = true
	`

	var progress domain.StudentProgressResponse
	err := r.db.GetContext(ctx, &progress, query, studentID, courseID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get student progress: %w", err)
	}

	return &progress, nil
}

func (r *PostgreSQLAssignmentRepository) GetCourseStatistics(ctx context.Context, courseID, tenantID uuid.UUID) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Get total assignments
	var totalAssignments int
	assignmentsQuery := `SELECT COUNT(*) FROM assignments WHERE course_id = $1 AND tenant_id = $2`
	err := r.db.GetContext(ctx, &totalAssignments, assignmentsQuery, courseID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to count assignments: %w", err)
	}
	stats["total_assignments"] = totalAssignments

	// Get total submissions
	var totalSubmissions int
	submissionsQuery := `
		SELECT COUNT(s.*)
		FROM assignment_submissions s
		INNER JOIN assignments a ON s.assignment_id = a.id
		WHERE a.course_id = $1 AND s.tenant_id = $2
	`
	err = r.db.GetContext(ctx, &totalSubmissions, submissionsQuery, courseID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to count submissions: %w", err)
	}
	stats["total_submissions"] = totalSubmissions

	// Get average grade
	var averageGrade float64
	avgQuery := `
		SELECT COALESCE(AVG(s.percentage_grade), 0)
		FROM assignment_submissions s
		INNER JOIN assignments a ON s.assignment_id = a.id
		WHERE a.course_id = $1 AND s.tenant_id = $2 AND s.grade_status = 'completed'
	`
	err = r.db.GetContext(ctx, &averageGrade, avgQuery, courseID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate average grade: %w", err)
	}
	stats["average_grade"] = averageGrade

	return stats, nil
}

// ========================================
// Helper Functions - Row to Domain Conversions
// ========================================

func rowToAssignment(row *assignmentRow) *domain.Assignment {
	return &domain.Assignment{
		ID:                       row.ID,
		TenantID:                 row.TenantID,
		Title:                    row.Title,
		Description:              row.Description,
		Instructions:             row.Instructions,
		Type:                     domain.AssignmentType(row.Type),
		CourseID:                 row.CourseID,
		ModuleID:                 row.ModuleID,
		LessonID:                 row.LessonID,
		MaxFileSize:              row.MaxFileSize,
		AllowedFileTypes:         []string(row.AllowedFileTypes),
		MaxFiles:                 row.MaxFiles,
		AllowMultipleSubmissions: row.AllowMultipleSubmissions,
		AvailableFrom:            row.AvailableFrom,
		DueDate:                  row.DueDate,
		LatePenaltyPerDay:        row.LatePenaltyPerDay,
		AcceptLateSubmissions:    row.AcceptLateSubmissions,
		RubricID:                 row.RubricID,
		MaxPoints:                row.MaxPoints,
		PassingScore:             row.PassingScore,
		PeerReviewEnabled:        row.PeerReviewEnabled,
		PeerReviewsRequired:      row.PeerReviewsRequired,
		AnonymousGrading:         row.AnonymousGrading,
		PlagiarismCheckEnabled:   row.PlagiarismCheckEnabled,
		IsPublished:              row.IsPublished,
		EstimatedDuration:        row.EstimatedDuration,
		TotalSubmissions:         row.TotalSubmissions,
		GradedSubmissions:        row.GradedSubmissions,
		AverageGrade:             row.AverageGrade,
		CreatedBy:                row.CreatedBy,
		CreatedAt:                row.CreatedAt,
		UpdatedAt:                row.UpdatedAt,
	}
}

func rowToSubmission(row *submissionRow) *domain.AssignmentSubmission {
	submission := &domain.AssignmentSubmission{
		ID:                   row.ID,
		TenantID:             row.TenantID,
		AssignmentID:         row.AssignmentID,
		StudentID:            row.StudentID,
		TextContent:          row.TextContent,
		Files:                stringSliceToUUIDSlice([]string(row.Files)),
		Status:               domain.SubmissionStatus(row.Status),
		SubmissionNumber:     row.SubmissionNumber,
		IsFinal:              row.IsFinal,
		GradeStatus:          domain.GradeStatus(row.GradeStatus),
		Grades:               stringSliceToUUIDSlice([]string(row.Grades)),
		TotalPointsEarned:    row.TotalPointsEarned,
		TotalPointsPossible:  row.TotalPointsPossible,
		PercentageGrade:      row.PercentageGrade,
		IsPassing:            row.IsPassing,
		InstructorFeedback:   row.InstructorFeedback,
		IsLate:               row.IsLate,
		DaysLate:             row.DaysLate,
		PenaltyApplied:       row.PenaltyApplied,
		SubmittedAt:          row.SubmittedAt,
		GradedAt:             row.GradedAt,
		CreatedAt:            row.CreatedAt,
		UpdatedAt:            row.UpdatedAt,
	}

	if row.LetterGrade != nil {
		submission.LetterGrade = *row.LetterGrade
	}

	if row.PlagiarismScore != nil {
		submission.PlagiarismScore = *row.PlagiarismScore
	}

	return submission
}

func rowToFile(row *fileRow) *domain.AssignmentFile {
	file := &domain.AssignmentFile{
		ID:               row.ID,
		TenantID:         row.TenantID,
		Filename:         row.Filename,
		OriginalFilename: row.OriginalFilename,
		FileType:         domain.FileType(row.FileType),
		FileSize:         row.FileSize,
		MimeType:         row.MimeType,
		FilePath:         row.FilePath,
		IsTemplate:       row.IsTemplate,
		UploadedBy:       row.UploadedBy,
		UploadedAt:       row.UploadedAt,
	}

	if row.FileURL != nil {
		file.FileURL = *row.FileURL
	}

	if row.Description != nil {
		file.Description = *row.Description
	}

	file.AssignmentID = row.AssignmentID
	file.SubmissionID = row.SubmissionID

	return file
}

func rowToRubric(row *rubricRow) (*domain.Rubric, error) {
	var criteria []domain.RubricCriterion
	if err := json.Unmarshal(row.Criteria, &criteria); err != nil {
		return nil, fmt.Errorf("failed to unmarshal criteria: %w", err)
	}

	return &domain.Rubric{
		ID:          row.ID,
		TenantID:    row.TenantID,
		Name:        row.Name,
		Description: row.Description,
		Criteria:    criteria,
		TotalPoints: row.TotalPoints,
		IsTemplate:  row.IsTemplate,
		CreatedBy:   row.CreatedBy,
		CreatedAt:   row.CreatedAt,
		UpdatedAt:   row.UpdatedAt,
	}, nil
}

func rowToGrade(row *gradeRow) *domain.SubmissionGrade {
	criterionID := row.CriterionID
	return &domain.SubmissionGrade{
		ID:              row.ID,
		TenantID:        row.TenantID,
		SubmissionID:    row.SubmissionID,
		CriterionID:     &criterionID,
		GraderID:        row.GraderID,
		PointsEarned:    row.PointsEarned,
		PointsPossible:  row.PointsPossible,
		Feedback:        row.Feedback,
		GradedAt:        row.GradedAt,
	}
}

func rowToComment(row *commentRow) *domain.SubmissionComment {
	return &domain.SubmissionComment{
		ID:           row.ID,
		TenantID:     row.TenantID,
		SubmissionID: row.SubmissionID,
		AuthorID:     row.AuthorID,
		AuthorRole:   row.AuthorRole,
		Content:      row.Content,
		IsPrivate:    row.IsPrivate,
		CreatedAt:    row.CreatedAt,
		UpdatedAt:    row.UpdatedAt,
	}
}

func rowToPeerReview(row *peerReviewRow) (*domain.PeerReview, error) {
	var scores map[string]float64
	if len(row.Scores) > 0 {
		if err := json.Unmarshal(row.Scores, &scores); err != nil {
			return nil, fmt.Errorf("failed to unmarshal scores: %w", err)
		}
	}

	isCompleted := row.Status == "completed"

	// Calculate overall score from scores map
	overallScore := 0.0
	if len(scores) > 0 {
		total := 0.0
		for _, score := range scores {
			total += score
		}
		overallScore = total / float64(len(scores))
	}

	return &domain.PeerReview{
		ID:           row.ID,
		TenantID:     row.TenantID,
		AssignmentID: row.AssignmentID,
		SubmissionID: row.SubmissionID,
		ReviewerID:   row.ReviewerID,
		IsAnonymous:  row.IsAnonymous,
		IsCompleted:  isCompleted,
		Feedback:     row.Feedback,
		Scores:       scores,
		OverallScore: overallScore,
		DueDate:      row.DueDate,
		SubmittedAt:  row.SubmittedAt,
		AssignedAt:   row.CreatedAt,
	}, nil
}

// Helper functions for UUID conversion

func uuidSliceToStringSlice(uuids []uuid.UUID) []string {
	strings := make([]string, len(uuids))
	for i, id := range uuids {
		strings[i] = id.String()
	}
	return strings
}

func stringSliceToUUIDSlice(strings []string) []uuid.UUID {
	uuids := make([]uuid.UUID, 0, len(strings))
	for _, s := range strings {
		if id, err := uuid.Parse(s); err == nil {
			uuids = append(uuids, id)
		}
	}
	return uuids
}
