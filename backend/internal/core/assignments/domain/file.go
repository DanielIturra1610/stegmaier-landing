package domain

import (
	"time"

	"github.com/google/uuid"
)

// AssignmentFile representa un archivo adjunto a un assignment o submission
type AssignmentFile struct {
	ID               uuid.UUID `json:"id"`
	Filename         string    `json:"filename"`
	OriginalFilename string    `json:"original_filename"`
	FileType         FileType  `json:"file_type"`
	FileSize         int64     `json:"file_size"`
	MimeType         string    `json:"mime_type"`
	FilePath         string    `json:"file_path"`
	FileURL          string    `json:"file_url,omitempty"`
	UploadedAt       time.Time `json:"uploaded_at"`
	UploadedBy       uuid.UUID `json:"uploaded_by"`
	IsTemplate       bool      `json:"is_template"`
	Description      string    `json:"description,omitempty"`

	// Relations
	AssignmentID *uuid.UUID `json:"assignment_id,omitempty"`
	SubmissionID *uuid.UUID `json:"submission_id,omitempty"`

	// Audit
	TenantID uuid.UUID `json:"tenant_id"`
}

// NewAssignmentFile crea un nuevo archivo de assignment
func NewAssignmentFile(
	tenantID, uploadedBy uuid.UUID,
	filename, originalFilename, mimeType, filePath string,
	fileSize int64,
	isTemplate bool,
) *AssignmentFile {
	fileType := DetermineFileType(mimeType)

	return &AssignmentFile{
		ID:               uuid.New(),
		TenantID:         tenantID,
		Filename:         filename,
		OriginalFilename: originalFilename,
		FileType:         fileType,
		FileSize:         fileSize,
		MimeType:         mimeType,
		FilePath:         filePath,
		UploadedAt:       time.Now().UTC(),
		UploadedBy:       uploadedBy,
		IsTemplate:       isTemplate,
	}
}

// Validate valida los datos del archivo
func (f *AssignmentFile) Validate() error {
	if f.TenantID == uuid.Nil {
		return ErrInvalidTenantID
	}
	if f.Filename == "" {
		return ErrInvalidFileName
	}
	if f.OriginalFilename == "" {
		return ErrInvalidFileName
	}
	if f.FileSize <= 0 {
		return ErrInvalidFileSize
	}
	if f.MimeType == "" {
		return ErrInvalidMimeType
	}
	if f.FilePath == "" {
		return ErrInvalidFilePath
	}
	if f.UploadedBy == uuid.Nil {
		return ErrInvalidUserID
	}
	if !ValidateFileType(f.FileType) {
		return ErrInvalidFileType
	}

	return nil
}

// SetAssignmentID asocia el archivo con un assignment
func (f *AssignmentFile) SetAssignmentID(assignmentID uuid.UUID) {
	f.AssignmentID = &assignmentID
}

// SetSubmissionID asocia el archivo con una submission
func (f *AssignmentFile) SetSubmissionID(submissionID uuid.UUID) {
	f.SubmissionID = &submissionID
}

// SetDescription establece la descripción del archivo
func (f *AssignmentFile) SetDescription(description string) {
	f.Description = description
}

// SetFileURL establece la URL pública del archivo
func (f *AssignmentFile) SetFileURL(url string) {
	f.FileURL = url
}
