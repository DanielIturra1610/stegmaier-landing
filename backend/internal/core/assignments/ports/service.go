package ports

import (
	"context"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/assignments/domain"
	"github.com/google/uuid"
)

// AssignmentService define las operaciones de lógica de negocio para assignments
type AssignmentService interface {
	// Assignment operations
	CreateAssignment(ctx context.Context, tenantID, userID uuid.UUID, req *domain.CreateAssignmentRequest) (*domain.AssignmentResponse, error)
	GetAssignment(ctx context.Context, id, tenantID uuid.UUID) (*domain.AssignmentResponse, error)
	GetCourseAssignments(ctx context.Context, courseID, tenantID uuid.UUID, page, pageSize int) (*domain.AssignmentListResponse, error)
	GetMyAssignments(ctx context.Context, studentID, tenantID uuid.UUID, page, pageSize int) (*domain.AssignmentListResponse, error)
	UpdateAssignment(ctx context.Context, id, tenantID, userID uuid.UUID, req *domain.UpdateAssignmentRequest) (*domain.AssignmentResponse, error)
	DeleteAssignment(ctx context.Context, id, tenantID, userID uuid.UUID) error
	PublishAssignment(ctx context.Context, id, tenantID, userID uuid.UUID) (*domain.AssignmentResponse, error)
	UnpublishAssignment(ctx context.Context, id, tenantID, userID uuid.UUID) (*domain.AssignmentResponse, error)

	// Submission operations - Student
	GetMySubmission(ctx context.Context, assignmentID, studentID, tenantID uuid.UUID) (*domain.SubmissionResponse, error)
	GetMySubmissions(ctx context.Context, studentID, tenantID uuid.UUID, page, pageSize int) (*domain.SubmissionListResponse, error)
	CreateSubmission(ctx context.Context, tenantID, studentID uuid.UUID, req *domain.CreateSubmissionRequest) (*domain.SubmissionResponse, error)
	UpdateSubmission(ctx context.Context, id, tenantID, studentID uuid.UUID, req *domain.UpdateSubmissionRequest) (*domain.SubmissionResponse, error)
	SubmitAssignment(ctx context.Context, submissionID, studentID, tenantID uuid.UUID) (*domain.SubmissionResponse, error)

	// Submission operations - Instructor
	GetSubmission(ctx context.Context, id, tenantID uuid.UUID) (*domain.SubmissionResponse, error)
	GetAssignmentSubmissions(ctx context.Context, assignmentID, tenantID uuid.UUID, page, pageSize int) (*domain.SubmissionListResponse, error)
	GetStudentSubmissions(ctx context.Context, studentID, courseID, tenantID uuid.UUID) (*domain.SubmissionListResponse, error)
	GradeSubmission(ctx context.Context, submissionID, graderID, tenantID uuid.UUID, req *domain.GradeSubmissionRequest) (*domain.SubmissionResponse, error)
	BulkGrade(ctx context.Context, tenantID, graderID uuid.UUID, req *domain.BulkGradeRequest) ([]domain.SubmissionResponse, error)
	ReturnSubmission(ctx context.Context, submissionID, instructorID, tenantID uuid.UUID, feedback string) (*domain.SubmissionResponse, error)
	DeleteSubmission(ctx context.Context, id, tenantID, userID uuid.UUID) error

	// File operations
	UploadAssignmentFile(ctx context.Context, assignmentID, tenantID, userID uuid.UUID, filename, originalFilename, mimeType string, fileData []byte, description string, isTemplate bool) (*domain.FileResponse, error)
	UploadSubmissionFile(ctx context.Context, submissionID, tenantID, userID uuid.UUID, filename, originalFilename, mimeType string, fileData []byte, description string) (*domain.FileResponse, error)
	GetFile(ctx context.Context, fileID, tenantID uuid.UUID) (*domain.FileResponse, error)
	DownloadFile(ctx context.Context, fileID, tenantID, userID uuid.UUID) ([]byte, string, error)
	DeleteAssignmentFile(ctx context.Context, assignmentID, fileID, tenantID, userID uuid.UUID) error
	DeleteSubmissionFile(ctx context.Context, submissionID, fileID, tenantID, userID uuid.UUID) error

	// Comment operations
	AddComment(ctx context.Context, submissionID, authorID, tenantID uuid.UUID, req *domain.CreateCommentRequest, authorRole string) (*domain.CommentResponse, error)
	GetSubmissionComments(ctx context.Context, submissionID, tenantID, userID uuid.UUID, isInstructor bool) ([]domain.CommentResponse, error)
	UpdateComment(ctx context.Context, commentID, userID, tenantID uuid.UUID, content string) (*domain.CommentResponse, error)
	DeleteComment(ctx context.Context, commentID, userID, tenantID uuid.UUID) error

	// Rubric operations
	CreateRubric(ctx context.Context, tenantID, createdBy uuid.UUID, req *domain.CreateRubricRequest) (*domain.RubricResponse, error)
	GetRubric(ctx context.Context, id, tenantID uuid.UUID) (*domain.RubricResponse, error)
	GetTenantRubrics(ctx context.Context, tenantID uuid.UUID, page, pageSize int) (*domain.RubricListResponse, error)
	GetRubricTemplates(ctx context.Context, tenantID uuid.UUID) (*domain.RubricListResponse, error)
	UpdateRubric(ctx context.Context, id, tenantID, userID uuid.UUID, req *domain.UpdateRubricRequest) (*domain.RubricResponse, error)
	DeleteRubric(ctx context.Context, id, tenantID, userID uuid.UUID) error
	AttachRubricToAssignment(ctx context.Context, assignmentID, rubricID, tenantID, userID uuid.UUID) error
	DetachRubricFromAssignment(ctx context.Context, assignmentID, tenantID, userID uuid.UUID) error

	// Peer review operations
	AssignPeerReview(ctx context.Context, tenantID, instructorID uuid.UUID, req *domain.CreatePeerReviewRequest) (*domain.PeerReviewResponse, error)
	GetMyPeerReviews(ctx context.Context, reviewerID, tenantID uuid.UUID) ([]domain.PeerReviewResponse, error)
	GetSubmissionPeerReviews(ctx context.Context, submissionID, tenantID uuid.UUID) ([]domain.PeerReviewResponse, error)
	SubmitPeerReview(ctx context.Context, reviewID, reviewerID, tenantID uuid.UUID, req *domain.SubmitPeerReviewRequest) (*domain.PeerReviewResponse, error)
	DeletePeerReview(ctx context.Context, reviewID, tenantID, userID uuid.UUID) error

	// Statistics operations
	GetAssignmentStatistics(ctx context.Context, assignmentID, tenantID uuid.UUID) (*domain.AssignmentStatisticsResponse, error)
	GetStudentProgress(ctx context.Context, studentID, courseID, tenantID uuid.UUID) (*domain.StudentProgressResponse, error)
	GetCourseStatistics(ctx context.Context, courseID, tenantID uuid.UUID) (map[string]interface{}, error)
}
