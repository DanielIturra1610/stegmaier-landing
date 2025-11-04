package ports

import "errors"

// Port-level errors (re-export domain errors for convenience)

// Assignment service errors
var (
	ErrAssignmentCreationFailed = errors.New("failed to create assignment")
	ErrAssignmentUpdateFailed   = errors.New("failed to update assignment")
	ErrAssignmentDeletionFailed = errors.New("failed to delete assignment")
	ErrAssignmentNotFound       = errors.New("assignment not found")
)

// Submission service errors
var (
	ErrSubmissionCreationFailed = errors.New("failed to create submission")
	ErrSubmissionUpdateFailed   = errors.New("failed to update submission")
	ErrSubmissionDeletionFailed = errors.New("failed to delete submission")
	ErrSubmissionNotFound       = errors.New("submission not found")
)

// File service errors
var (
	ErrFileCreationFailed  = errors.New("failed to create file record")
	ErrFileUploadFailed    = errors.New("failed to upload file")
	ErrFileDownloadFailed  = errors.New("failed to download file")
	ErrFileDeletionFailed  = errors.New("failed to delete file")
	ErrFileNotFound        = errors.New("file not found")
	ErrInvalidFileType     = errors.New("invalid file type")
	ErrFileTooLarge        = errors.New("file exceeds maximum size")
	ErrFileTypeNotAllowed  = errors.New("file type not allowed")
)

// Rubric service errors
var (
	ErrRubricCreationFailed = errors.New("failed to create rubric")
	ErrRubricUpdateFailed   = errors.New("failed to update rubric")
	ErrRubricDeletionFailed = errors.New("failed to delete rubric")
	ErrRubricNotFound       = errors.New("rubric not found")
)

// Grade service errors
var (
	ErrGradeCreationFailed = errors.New("failed to create grade")
	ErrGradeUpdateFailed   = errors.New("failed to update grade")
	ErrGradeDeletionFailed = errors.New("failed to delete grade")
	ErrGradeNotFound       = errors.New("grade not found")
)

// Comment service errors
var (
	ErrCommentCreationFailed = errors.New("failed to create comment")
	ErrCommentUpdateFailed   = errors.New("failed to update comment")
	ErrCommentDeletionFailed = errors.New("failed to delete comment")
	ErrCommentNotFound       = errors.New("comment not found")
)

// Peer review service errors
var (
	ErrPeerReviewCreationFailed = errors.New("failed to create peer review")
	ErrPeerReviewUpdateFailed   = errors.New("failed to update peer review")
	ErrPeerReviewDeletionFailed = errors.New("failed to delete peer review")
	ErrPeerReviewNotFound       = errors.New("peer review not found")
)

// Permission errors
var (
	ErrUnauthorized            = errors.New("unauthorized access")
	ErrInsufficientPermissions = errors.New("insufficient permissions")
	ErrNotAssignmentOwner      = errors.New("user is not the assignment owner")
	ErrNotSubmissionOwner      = errors.New("user is not the submission owner")
)

// Validation errors
var (
	ErrInvalidRequest   = errors.New("invalid request")
	ErrInvalidTenantID  = errors.New("invalid tenant ID")
	ErrInvalidUserID    = errors.New("invalid user ID")
	ErrInvalidCourseID  = errors.New("invalid course ID")
	ErrMissingParameter = errors.New("missing required parameter")
)

// Storage errors
var (
	ErrStorageFailed      = errors.New("storage operation failed")
	ErrStorageUnavailable = errors.New("storage service unavailable")
)

// Database errors
var (
	ErrDatabaseError      = errors.New("database error occurred")
	ErrTransactionFailed  = errors.New("transaction failed")
	ErrRecordNotFound     = errors.New("record not found")
	ErrDuplicateRecord    = errors.New("duplicate record")
)
