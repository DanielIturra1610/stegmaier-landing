package domain

// AssignmentType representa el tipo de assignment
type AssignmentType string

const (
	AssignmentTypeEssay        AssignmentType = "essay"
	AssignmentTypeFileUpload   AssignmentType = "file_upload"
	AssignmentTypeProject      AssignmentType = "project"
	AssignmentTypePresentation AssignmentType = "presentation"
	AssignmentTypeResearch     AssignmentType = "research"
	AssignmentTypePractical    AssignmentType = "practical"
	AssignmentTypePortfolio    AssignmentType = "portfolio"
)

// ValidateAssignmentType valida si el tipo de assignment es válido
func ValidateAssignmentType(t AssignmentType) bool {
	switch t {
	case AssignmentTypeEssay, AssignmentTypeFileUpload, AssignmentTypeProject,
		AssignmentTypePresentation, AssignmentTypeResearch, AssignmentTypePractical,
		AssignmentTypePortfolio:
		return true
	default:
		return false
	}
}

// SubmissionStatus representa el estado de una entrega
type SubmissionStatus string

const (
	SubmissionStatusNotStarted     SubmissionStatus = "not_started"
	SubmissionStatusInProgress     SubmissionStatus = "in_progress"
	SubmissionStatusSubmitted      SubmissionStatus = "submitted"
	SubmissionStatusUnderReview    SubmissionStatus = "under_review"
	SubmissionStatusGraded         SubmissionStatus = "graded"
	SubmissionStatusReturned       SubmissionStatus = "returned"
	SubmissionStatusLateSubmission SubmissionStatus = "late_submission"
	SubmissionStatusMissing        SubmissionStatus = "missing"
)

// ValidateSubmissionStatus valida si el estado de submission es válido
func ValidateSubmissionStatus(s SubmissionStatus) bool {
	switch s {
	case SubmissionStatusNotStarted, SubmissionStatusInProgress, SubmissionStatusSubmitted,
		SubmissionStatusUnderReview, SubmissionStatusGraded, SubmissionStatusReturned,
		SubmissionStatusLateSubmission, SubmissionStatusMissing:
		return true
	default:
		return false
	}
}

// GradeStatus representa el estado de calificación
type GradeStatus string

const (
	GradeStatusNotGraded     GradeStatus = "not_graded"
	GradeStatusInProgress    GradeStatus = "in_progress"
	GradeStatusCompleted     GradeStatus = "completed"
	GradeStatusNeedsRevision GradeStatus = "needs_revision"
)

// ValidateGradeStatus valida si el estado de calificación es válido
func ValidateGradeStatus(s GradeStatus) bool {
	switch s {
	case GradeStatusNotGraded, GradeStatusInProgress, GradeStatusCompleted, GradeStatusNeedsRevision:
		return true
	default:
		return false
	}
}

// FileType representa el tipo de archivo
type FileType string

const (
	FileTypeDocument     FileType = "document"
	FileTypeImage        FileType = "image"
	FileTypeVideo        FileType = "video"
	FileTypeAudio        FileType = "audio"
	FileTypePresentation FileType = "presentation"
	FileTypeSpreadsheet  FileType = "spreadsheet"
	FileTypeArchive      FileType = "archive"
	FileTypeCode         FileType = "code"
)

// ValidateFileType valida si el tipo de archivo es válido
func ValidateFileType(t FileType) bool {
	switch t {
	case FileTypeDocument, FileTypeImage, FileTypeVideo, FileTypeAudio,
		FileTypePresentation, FileTypeSpreadsheet, FileTypeArchive, FileTypeCode:
		return true
	default:
		return false
	}
}

// DetermineFileType determina el tipo de archivo basado en el MIME type
func DetermineFileType(mimeType string) FileType {
	switch mimeType {
	case "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"text/plain", "text/markdown":
		return FileTypeDocument
	case "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml":
		return FileTypeImage
	case "video/mp4", "video/webm", "video/ogg", "video/quicktime":
		return FileTypeVideo
	case "audio/mpeg", "audio/wav", "audio/ogg", "audio/webm":
		return FileTypeAudio
	case "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation":
		return FileTypePresentation
	case "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv":
		return FileTypeSpreadsheet
	case "application/zip", "application/x-rar-compressed", "application/x-7z-compressed", "application/x-tar":
		return FileTypeArchive
	case "text/html", "text/css", "text/javascript", "application/json", "application/xml",
		"text/x-python", "text/x-java", "text/x-c", "text/x-go":
		return FileTypeCode
	default:
		return FileTypeDocument
	}
}
