package ports

import (
	"context"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/assignments/domain"
	"github.com/google/uuid"
)

// AssignmentRepository define las operaciones de persistencia para assignments
type AssignmentRepository interface {
	// Assignment operations
	CreateAssignment(ctx context.Context, assignment *domain.Assignment) error
	GetAssignment(ctx context.Context, id, tenantID uuid.UUID) (*domain.Assignment, error)
	GetAssignmentsByCourse(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) ([]*domain.Assignment, int, error)
	GetAssignmentsByModule(ctx context.Context, moduleID, tenantID uuid.UUID) ([]*domain.Assignment, error)
	GetAssignmentsByLesson(ctx context.Context, lessonID, tenantID uuid.UUID) ([]*domain.Assignment, error)
	GetPublishedAssignmentsByCourse(ctx context.Context, courseID, tenantID uuid.UUID) ([]*domain.Assignment, error)
	UpdateAssignment(ctx context.Context, assignment *domain.Assignment) error
	DeleteAssignment(ctx context.Context, id, tenantID uuid.UUID) error
	AssignmentExists(ctx context.Context, id, tenantID uuid.UUID) (bool, error)
	CountAssignmentsByCourse(ctx context.Context, courseID, tenantID uuid.UUID) (int, error)

	// Submission operations
	CreateSubmission(ctx context.Context, submission *domain.AssignmentSubmission) error
	GetSubmission(ctx context.Context, id, tenantID uuid.UUID) (*domain.AssignmentSubmission, error)
	GetSubmissionByStudentAndAssignment(ctx context.Context, studentID, assignmentID, tenantID uuid.UUID) (*domain.AssignmentSubmission, error)
	GetSubmissionsByAssignment(ctx context.Context, assignmentID, tenantID uuid.UUID, page, pageSize int) ([]*domain.AssignmentSubmission, int, error)
	GetSubmissionsByStudent(ctx context.Context, studentID, tenantID uuid.UUID, page, pageSize int) ([]*domain.AssignmentSubmission, int, error)
	GetSubmissionsByCourse(ctx context.Context, courseID, studentID, tenantID uuid.UUID) ([]*domain.AssignmentSubmission, error)
	UpdateSubmission(ctx context.Context, submission *domain.AssignmentSubmission) error
	DeleteSubmission(ctx context.Context, id, tenantID uuid.UUID) error
	SubmissionExists(ctx context.Context, studentID, assignmentID, tenantID uuid.UUID) (bool, error)
	CountSubmissionsByAssignment(ctx context.Context, assignmentID, tenantID uuid.UUID) (int, error)
	CountSubmissionsByStatus(ctx context.Context, assignmentID, tenantID uuid.UUID, status domain.SubmissionStatus) (int, error)

	// File operations
	CreateFile(ctx context.Context, file *domain.AssignmentFile) error
	GetFile(ctx context.Context, id, tenantID uuid.UUID) (*domain.AssignmentFile, error)
	GetFilesByAssignment(ctx context.Context, assignmentID, tenantID uuid.UUID) ([]*domain.AssignmentFile, error)
	GetFilesBySubmission(ctx context.Context, submissionID, tenantID uuid.UUID) ([]*domain.AssignmentFile, error)
	DeleteFile(ctx context.Context, id, tenantID uuid.UUID) error
	FileExists(ctx context.Context, id, tenantID uuid.UUID) (bool, error)

	// Rubric operations
	CreateRubric(ctx context.Context, rubric *domain.Rubric) error
	GetRubric(ctx context.Context, id, tenantID uuid.UUID) (*domain.Rubric, error)
	GetRubricsByTenant(ctx context.Context, tenantID uuid.UUID, page, pageSize int) ([]*domain.Rubric, int, error)
	GetRubricTemplates(ctx context.Context, tenantID uuid.UUID) ([]*domain.Rubric, error)
	UpdateRubric(ctx context.Context, rubric *domain.Rubric) error
	DeleteRubric(ctx context.Context, id, tenantID uuid.UUID) error
	RubricExists(ctx context.Context, id, tenantID uuid.UUID) (bool, error)

	// Grade operations
	CreateGrade(ctx context.Context, grade *domain.SubmissionGrade) error
	GetGrade(ctx context.Context, id, tenantID uuid.UUID) (*domain.SubmissionGrade, error)
	GetGradesBySubmission(ctx context.Context, submissionID, tenantID uuid.UUID) ([]*domain.SubmissionGrade, error)
	UpdateGrade(ctx context.Context, grade *domain.SubmissionGrade) error
	DeleteGrade(ctx context.Context, id, tenantID uuid.UUID) error
	DeleteGradesBySubmission(ctx context.Context, submissionID, tenantID uuid.UUID) error

	// Comment operations
	CreateComment(ctx context.Context, comment *domain.SubmissionComment) error
	GetComment(ctx context.Context, id, tenantID uuid.UUID) (*domain.SubmissionComment, error)
	GetCommentsBySubmission(ctx context.Context, submissionID, tenantID uuid.UUID) ([]*domain.SubmissionComment, error)
	UpdateComment(ctx context.Context, comment *domain.SubmissionComment) error
	DeleteComment(ctx context.Context, id, tenantID uuid.UUID) error

	// Peer review operations
	CreatePeerReview(ctx context.Context, review *domain.PeerReview) error
	GetPeerReview(ctx context.Context, id, tenantID uuid.UUID) (*domain.PeerReview, error)
	GetPeerReviewsBySubmission(ctx context.Context, submissionID, tenantID uuid.UUID) ([]*domain.PeerReview, error)
	GetPeerReviewsByReviewer(ctx context.Context, reviewerID, tenantID uuid.UUID) ([]*domain.PeerReview, error)
	GetPeerReviewByReviewerAndSubmission(ctx context.Context, reviewerID, submissionID, tenantID uuid.UUID) (*domain.PeerReview, error)
	UpdatePeerReview(ctx context.Context, review *domain.PeerReview) error
	DeletePeerReview(ctx context.Context, id, tenantID uuid.UUID) error
	CountCompletedPeerReviews(ctx context.Context, submissionID, tenantID uuid.UUID) (int, error)

	// Statistics operations
	GetAssignmentStatistics(ctx context.Context, assignmentID, tenantID uuid.UUID) (*domain.AssignmentStatisticsResponse, error)
	GetStudentProgress(ctx context.Context, studentID, courseID, tenantID uuid.UUID) (*domain.StudentProgressResponse, error)
	GetCourseStatistics(ctx context.Context, courseID, tenantID uuid.UUID) (map[string]interface{}, error)
}
