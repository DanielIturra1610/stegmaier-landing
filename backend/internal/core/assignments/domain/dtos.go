package domain

import (
	"time"

	"github.com/google/uuid"
)

// Assignment DTOs

// CreateAssignmentRequest representa una solicitud para crear un assignment
type CreateAssignmentRequest struct {
	Title                   string         `json:"title" validate:"required,min=3,max=200"`
	Description             string         `json:"description" validate:"required"`
	Instructions            string         `json:"instructions" validate:"required"`
	Type                    AssignmentType `json:"assignment_type" validate:"required"`
	CourseID                uuid.UUID      `json:"course_id" validate:"required"`
	ModuleID                *uuid.UUID     `json:"module_id,omitempty"`
	LessonID                *uuid.UUID     `json:"lesson_id,omitempty"`
	MaxFileSize             int64          `json:"max_file_size,omitempty"`
	AllowedFileTypes        []string       `json:"allowed_file_types,omitempty"`
	MaxFiles                int            `json:"max_files,omitempty"`
	AllowMultipleSubmissions bool          `json:"allow_multiple_submissions"`
	AvailableFrom           *time.Time     `json:"available_from,omitempty"`
	DueDate                 *time.Time     `json:"due_date,omitempty"`
	LatePenaltyPerDay       float64        `json:"late_penalty_per_day,omitempty"`
	AcceptLateSubmissions   bool           `json:"accept_late_submissions"`
	RubricID                *uuid.UUID     `json:"rubric_id,omitempty"`
	MaxPoints               float64        `json:"max_points,omitempty"`
	PassingScore            float64        `json:"passing_score,omitempty"`
	PeerReviewEnabled       bool           `json:"peer_review_enabled"`
	PeerReviewsRequired     int            `json:"peer_reviews_required,omitempty"`
	AnonymousGrading        bool           `json:"anonymous_grading"`
	PlagiarismCheckEnabled  bool           `json:"plagiarism_check_enabled"`
	EstimatedDuration       int            `json:"estimated_duration,omitempty"`
}

// UpdateAssignmentRequest representa una solicitud para actualizar un assignment
type UpdateAssignmentRequest struct {
	Title                   *string        `json:"title,omitempty" validate:"omitempty,min=3,max=200"`
	Description             *string        `json:"description,omitempty"`
	Instructions            *string        `json:"instructions,omitempty"`
	MaxFileSize             *int64         `json:"max_file_size,omitempty"`
	AllowedFileTypes        []string       `json:"allowed_file_types,omitempty"`
	MaxFiles                *int           `json:"max_files,omitempty"`
	AllowMultipleSubmissions *bool         `json:"allow_multiple_submissions,omitempty"`
	AvailableFrom           *time.Time     `json:"available_from,omitempty"`
	DueDate                 *time.Time     `json:"due_date,omitempty"`
	LatePenaltyPerDay       *float64       `json:"late_penalty_per_day,omitempty"`
	AcceptLateSubmissions   *bool          `json:"accept_late_submissions,omitempty"`
	RubricID                *uuid.UUID     `json:"rubric_id,omitempty"`
	MaxPoints               *float64       `json:"max_points,omitempty"`
	PassingScore            *float64       `json:"passing_score,omitempty"`
	PeerReviewEnabled       *bool          `json:"peer_review_enabled,omitempty"`
	PeerReviewsRequired     *int           `json:"peer_reviews_required,omitempty"`
	AnonymousGrading        *bool          `json:"anonymous_grading,omitempty"`
	PlagiarismCheckEnabled  *bool          `json:"plagiarism_check_enabled,omitempty"`
	EstimatedDuration       *int           `json:"estimated_duration,omitempty"`
	IsPublished             *bool          `json:"is_published,omitempty"`
}

// AssignmentResponse representa la respuesta con datos de un assignment
type AssignmentResponse struct {
	*Assignment
}

// Submission DTOs

// CreateSubmissionRequest representa una solicitud para crear una submission
type CreateSubmissionRequest struct {
	AssignmentID uuid.UUID `json:"assignment_id" validate:"required"`
	TextContent  string    `json:"text_content"`
	IsFinal      bool      `json:"is_final"`
}

// UpdateSubmissionRequest representa una solicitud para actualizar una submission
type UpdateSubmissionRequest struct {
	TextContent *string           `json:"text_content,omitempty"`
	IsFinal     *bool             `json:"is_final,omitempty"`
	Status      *SubmissionStatus `json:"status,omitempty"`
}

// SubmissionResponse representa la respuesta con datos de una submission
type SubmissionResponse struct {
	*AssignmentSubmission
}

// Grading DTOs

// GradeSubmissionRequest representa una solicitud para calificar una submission
type GradeSubmissionRequest struct {
	Grades   []SubmissionGradeDTO `json:"grades" validate:"required,min=1"`
	Feedback string               `json:"feedback,omitempty"`
}

// SubmissionGradeDTO representa una calificación individual
type SubmissionGradeDTO struct {
	CriterionID    *uuid.UUID `json:"criterion_id,omitempty"`
	PointsEarned   float64    `json:"points_earned" validate:"required,gte=0"`
	PointsPossible float64    `json:"points_possible" validate:"required,gt=0"`
	Feedback       string     `json:"feedback,omitempty"`
}

// BulkGradeRequest representa una solicitud para calificar múltiples submissions
type BulkGradeRequest struct {
	SubmissionIDs []uuid.UUID          `json:"submission_ids" validate:"required,min=1"`
	Grades        []SubmissionGradeDTO `json:"grades" validate:"required,min=1"`
	Feedback      string               `json:"feedback,omitempty"`
}

// Comment DTOs

// CreateCommentRequest representa una solicitud para crear un comentario
type CreateCommentRequest struct {
	Content   string `json:"content" validate:"required,min=1,max=5000"`
	IsPrivate bool   `json:"is_private"`
}

// CommentResponse representa la respuesta con datos de un comentario
type CommentResponse struct {
	*SubmissionComment
}

// File DTOs

// FileUploadRequest representa una solicitud para subir un archivo
type FileUploadRequest struct {
	Description string `json:"description,omitempty"`
	IsTemplate  bool   `json:"is_template"`
}

// FileResponse representa la respuesta con datos de un archivo
type FileResponse struct {
	*AssignmentFile
}

// Rubric DTOs

// CreateRubricRequest representa una solicitud para crear una rúbrica
type CreateRubricRequest struct {
	Name        string                  `json:"name" validate:"required"`
	Description string                  `json:"description,omitempty"`
	Criteria    []RubricCriterionDTO    `json:"criteria" validate:"required,min=1"`
	IsTemplate  bool                    `json:"is_template"`
}

// RubricCriterionDTO representa un criterio de rúbrica en un DTO
type RubricCriterionDTO struct {
	Name        string           `json:"name" validate:"required"`
	Description string           `json:"description,omitempty"`
	MaxPoints   float64          `json:"max_points" validate:"required,gt=0"`
	Weight      float64          `json:"weight" validate:"required,gte=0,lte=1"`
	Levels      []RubricLevelDTO `json:"levels" validate:"required,min=1"`
}

// RubricLevelDTO representa un nivel de rúbrica en un DTO
type RubricLevelDTO struct {
	Name        string  `json:"name" validate:"required"`
	Points      float64 `json:"points" validate:"required,gte=0"`
	Description string  `json:"description" validate:"required"`
}

// UpdateRubricRequest representa una solicitud para actualizar una rúbrica
type UpdateRubricRequest struct {
	Name        *string               `json:"name,omitempty"`
	Description *string               `json:"description,omitempty"`
	Criteria    []RubricCriterionDTO  `json:"criteria,omitempty"`
}

// RubricResponse representa la respuesta con datos de una rúbrica
type RubricResponse struct {
	*Rubric
}

// Peer Review DTOs

// CreatePeerReviewRequest representa una solicitud para asignar una peer review
type CreatePeerReviewRequest struct {
	SubmissionID uuid.UUID  `json:"submission_id" validate:"required"`
	ReviewerID   uuid.UUID  `json:"reviewer_id" validate:"required"`
	DueDate      *time.Time `json:"due_date,omitempty"`
}

// SubmitPeerReviewRequest representa una solicitud para enviar una peer review
type SubmitPeerReviewRequest struct {
	Feedback string             `json:"feedback" validate:"required"`
	Scores   map[string]float64 `json:"scores" validate:"required"`
}

// PeerReviewResponse representa la respuesta con datos de una peer review
type PeerReviewResponse struct {
	*PeerReview
}

// Statistics DTOs

// AssignmentStatisticsResponse representa estadísticas de un assignment
type AssignmentStatisticsResponse struct {
	AssignmentID       uuid.UUID                        `json:"assignment_id"`
	AssignmentTitle    string                           `json:"assignment_title"`
	TotalStudents      int                              `json:"total_students"`
	TotalSubmissions   int                              `json:"total_submissions"`
	GradedSubmissions  int                              `json:"graded_submissions"`
	AverageGrade       float64                          `json:"average_grade"`
	MedianGrade        float64                          `json:"median_grade"`
	PassRate           float64                          `json:"pass_rate"`
	OnTimeRate         float64                          `json:"on_time_rate"`
	GradeDistribution  map[string]int                   `json:"grade_distribution"`
	SubmissionTimeline []SubmissionTimelineEntry        `json:"submission_timeline"`
}

// SubmissionTimelineEntry representa una entrada en la línea de tiempo de entregas
type SubmissionTimelineEntry struct {
	Date        string `json:"date"`
	Submissions int    `json:"submissions"`
}

// StudentProgressResponse representa el progreso de un estudiante en assignments
type StudentProgressResponse struct {
	StudentID              uuid.UUID   `json:"student_id"`
	CourseID               uuid.UUID   `json:"course_id"`
	AssignmentsAvailable   int         `json:"assignments_available"`
	AssignmentsSubmitted   int         `json:"assignments_submitted"`
	AssignmentsGraded      int         `json:"assignments_graded"`
	AssignmentsPassed      int         `json:"assignments_passed"`
	AverageGrade           float64     `json:"average_grade"`
	TotalLateSubmissions   int         `json:"total_late_submissions"`
	PendingAssignments     []uuid.UUID `json:"pending_assignments"`
}

// List responses with pagination

// AssignmentListResponse representa una lista paginada de assignments
type AssignmentListResponse struct {
	Assignments []AssignmentResponse `json:"assignments"`
	Total       int                  `json:"total"`
	Page        int                  `json:"page"`
	PageSize    int                  `json:"page_size"`
	TotalPages  int                  `json:"total_pages"`
}

// SubmissionListResponse representa una lista paginada de submissions
type SubmissionListResponse struct {
	Submissions []SubmissionResponse `json:"submissions"`
	Total       int                  `json:"total"`
	Page        int                  `json:"page"`
	PageSize    int                  `json:"page_size"`
	TotalPages  int                  `json:"total_pages"`
}

// RubricListResponse representa una lista paginada de rúbricas
type RubricListResponse struct {
	Rubrics    []RubricResponse `json:"rubrics"`
	Total      int              `json:"total"`
	Page       int              `json:"page"`
	PageSize   int              `json:"page_size"`
	TotalPages int              `json:"total_pages"`
}
