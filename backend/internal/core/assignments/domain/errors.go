package domain

import "errors"

// Assignment errors
var (
	ErrAssignmentNotFound          = errors.New("assignment not found")
	ErrAssignmentAlreadyExists     = errors.New("assignment already exists")
	ErrAssignmentAlreadyPublished  = errors.New("assignment is already published")
	ErrAssignmentNotPublished      = errors.New("assignment is not published")
	ErrInvalidAssignmentType       = errors.New("invalid assignment type")
	ErrInvalidTitle                = errors.New("invalid title")
	ErrTitleTooShort               = errors.New("title is too short (minimum 3 characters)")
	ErrTitleTooLong                = errors.New("title is too long (maximum 200 characters)")
	ErrInvalidDescription          = errors.New("invalid description")
	ErrInvalidInstructions         = errors.New("invalid instructions")
	ErrInvalidMaxFiles             = errors.New("invalid max files")
	ErrInvalidPassingScore         = errors.New("invalid passing score")
	ErrInvalidLatePenalty          = errors.New("invalid late penalty (must be 0-100)")
	ErrInvalidPeerReviewCount      = errors.New("invalid peer review count")
	ErrInvalidDuration             = errors.New("invalid duration")
	ErrInvalidDateRange            = errors.New("invalid date range")
)

// Submission errors
var (
	ErrSubmissionNotFound              = errors.New("submission not found")
	ErrSubmissionAlreadyExists         = errors.New("submission already exists for this student and assignment")
	ErrSubmissionAlreadySubmitted      = errors.New("submission is already submitted")
	ErrSubmissionEmpty                 = errors.New("submission is empty (no content or files)")
	ErrInvalidSubmissionStatus         = errors.New("invalid submission status")
	ErrInvalidSubmissionNumber         = errors.New("invalid submission number")
	ErrCannotModifySubmittedSubmission = errors.New("cannot modify a submitted submission")
	ErrCannotGradeUnsubmittedSubmission = errors.New("cannot grade an unsubmitted submission")
	ErrCannotReturnSubmission          = errors.New("cannot return submission")
	ErrCannotResubmit                  = errors.New("cannot resubmit this submission")
	ErrMultipleSubmissionsNotAllowed   = errors.New("multiple submissions are not allowed for this assignment")
	ErrMaxFilesExceeded                = errors.New("maximum number of files exceeded")
)

// File errors
var (
	ErrFileNotFound       = errors.New("file not found")
	ErrInvalidFileName    = errors.New("invalid file name")
	ErrInvalidFileSize    = errors.New("invalid file size")
	ErrInvalidFileType    = errors.New("invalid file type")
	ErrInvalidMimeType    = errors.New("invalid MIME type")
	ErrInvalidFilePath    = errors.New("invalid file path")
	ErrFileTooLarge       = errors.New("file is too large")
	ErrFileUploadFailed   = errors.New("file upload failed")
	ErrFileDownloadFailed = errors.New("file download failed")
	ErrFileDeleteFailed   = errors.New("file deletion failed")
	ErrInvalidFileFormat  = errors.New("invalid file format")
)

// Rubric errors
var (
	ErrRubricNotFound          = errors.New("rubric not found")
	ErrRubricAlreadyExists     = errors.New("rubric already exists")
	ErrRubricCriterionNotFound = errors.New("rubric criterion not found")
	ErrInvalidRubricName       = errors.New("invalid rubric name")
	ErrInvalidRubricCriteria   = errors.New("invalid rubric criteria")
	ErrInvalidRubricCriterion  = errors.New("invalid rubric criterion")
	ErrInvalidRubricLevel      = errors.New("invalid rubric level")
	ErrInvalidRubricLevels     = errors.New("rubric must have at least one level")
	ErrInvalidWeight           = errors.New("invalid weight (must be 0.0-1.0)")
	ErrInvalidTotalWeight      = errors.New("total weight of criteria must equal 1.0")
)

// Grading errors
var (
	ErrGradeNotFound        = errors.New("grade not found")
	ErrInvalidGradeStatus   = errors.New("invalid grade status")
	ErrInvalidGraderID      = errors.New("invalid grader ID")
	ErrInvalidPoints        = errors.New("invalid points")
	ErrPointsExceedMaximum  = errors.New("points earned exceed maximum points")
	ErrInvalidScore         = errors.New("invalid score")
)

// Comment errors
var (
	ErrCommentNotFound        = errors.New("comment not found")
	ErrInvalidCommentContent  = errors.New("invalid comment content")
	ErrCommentTooShort        = errors.New("comment is too short")
	ErrCommentTooLong         = errors.New("comment is too long (maximum 5000 characters)")
	ErrInvalidAuthorRole      = errors.New("invalid author role")
)

// Peer review errors
var (
	ErrPeerReviewNotFound           = errors.New("peer review not found")
	ErrPeerReviewAlreadySubmitted   = errors.New("peer review is already submitted")
	ErrPeerReviewAlreadyAssigned    = errors.New("peer review is already assigned to this reviewer")
	ErrCannotUpdateCompletedReview  = errors.New("cannot update completed peer review")
	ErrInvalidPeerReviewFeedback    = errors.New("invalid peer review feedback")
	ErrInvalidPeerReviewScores      = errors.New("invalid peer review scores")
	ErrInvalidReviewerID            = errors.New("invalid reviewer ID")
	ErrCannotReviewOwnSubmission    = errors.New("cannot review own submission")
	ErrPeerReviewsNotEnabled        = errors.New("peer reviews are not enabled for this assignment")
	ErrInsufficientPeerReviews      = errors.New("insufficient peer reviews completed")
)

// Validation errors
var (
	ErrInvalidRequest      = errors.New("invalid request")
	ErrInvalidTenantID     = errors.New("invalid tenant ID")
	ErrInvalidUserID       = errors.New("invalid user ID")
	ErrInvalidStudentID    = errors.New("invalid student ID")
	ErrInvalidCourseID     = errors.New("invalid course ID")
	ErrInvalidModuleID     = errors.New("invalid module ID")
	ErrInvalidLessonID     = errors.New("invalid lesson ID")
	ErrInvalidAssignmentID = errors.New("invalid assignment ID")
	ErrInvalidSubmissionID = errors.New("invalid submission ID")
	ErrInvalidRubricID     = errors.New("invalid rubric ID")
)

// Permission errors
var (
	ErrUnauthorizedAccess       = errors.New("unauthorized access")
	ErrInsufficientPermissions  = errors.New("insufficient permissions")
	ErrNotAssignmentOwner       = errors.New("user is not the assignment owner")
	ErrNotSubmissionOwner       = errors.New("user is not the submission owner")
	ErrNotEnrolledInCourse      = errors.New("user is not enrolled in the course")
)

// Business logic errors
var (
	ErrAssignmentNotAvailable     = errors.New("assignment is not available yet")
	ErrAssignmentOverdue          = errors.New("assignment is overdue")
	ErrLateSubmissionsNotAccepted = errors.New("late submissions are not accepted")
	ErrSubmissionDeadlinePassed   = errors.New("submission deadline has passed")
	ErrNoRubricAssigned           = errors.New("no rubric assigned to assignment")
	ErrRubricMismatch             = errors.New("rubric does not match assignment requirements")
)

// Statistics errors
var (
	ErrInvalidStatisticsRequest = errors.New("invalid statistics request")
	ErrNoSubmissionsFound       = errors.New("no submissions found for statistics")
	ErrStatisticsCalculationFailed = errors.New("statistics calculation failed")
)

// Repository errors
var (
	ErrDatabaseError         = errors.New("database error occurred")
	ErrCreationFailed        = errors.New("creation failed")
	ErrUpdateFailed          = errors.New("update failed")
	ErrDeletionFailed        = errors.New("deletion failed")
	ErrTransactionFailed     = errors.New("transaction failed")
	ErrRecordNotFound        = errors.New("record not found")
)

// Storage errors
var (
	ErrStorageFailed       = errors.New("storage operation failed")
	ErrStorageUnavailable  = errors.New("storage service unavailable")
)
