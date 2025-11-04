package ports

import "errors"

// ============================================================
// Certificate Errors
// ============================================================

var (
	// ErrCertificateNotFound is returned when certificate is not found
	ErrCertificateNotFound = errors.New("certificate not found")

	// ErrCertificateAlreadyExists is returned when trying to create duplicate certificate
	ErrCertificateAlreadyExists = errors.New("certificate already exists")

	// ErrCertificateCreationFailed is returned when certificate creation fails
	ErrCertificateCreationFailed = errors.New("failed to create certificate")

	// ErrCertificateUpdateFailed is returned when certificate update fails
	ErrCertificateUpdateFailed = errors.New("failed to update certificate")

	// ErrCertificateDeletionFailed is returned when certificate deletion fails
	ErrCertificateDeletionFailed = errors.New("failed to delete certificate")

	// ErrInvalidCertificateData is returned when certificate data is invalid
	ErrInvalidCertificateData = errors.New("invalid certificate data")

	// ErrInvalidCertificateStatus is returned when certificate status is invalid
	ErrInvalidCertificateStatus = errors.New("invalid certificate status")

	// ErrCertificateAlreadyRevoked is returned when trying to revoke an already revoked certificate
	ErrCertificateAlreadyRevoked = errors.New("certificate is already revoked")

	// ErrCertificateExpired is returned when certificate has expired
	ErrCertificateExpired = errors.New("certificate has expired")

	// ErrCannotRevokeCertificate is returned when certificate cannot be revoked
	ErrCannotRevokeCertificate = errors.New("cannot revoke certificate")
)

// ============================================================
// Certificate Verification Errors
// ============================================================

var (
	// ErrVerificationFailed is returned when certificate verification fails
	ErrVerificationFailed = errors.New("certificate verification failed")

	// ErrInvalidVerificationCode is returned when verification code is invalid
	ErrInvalidVerificationCode = errors.New("invalid verification code")

	// ErrInvalidCertificateNumber is returned when certificate number is invalid
	ErrInvalidCertificateNumber = errors.New("invalid certificate number")

	// ErrCertificateNotValid is returned when certificate is not valid
	ErrCertificateNotValid = errors.New("certificate is not valid")
)

// ============================================================
// Certificate Template Errors
// ============================================================

var (
	// ErrTemplateNotFound is returned when certificate template is not found
	ErrTemplateNotFound = errors.New("certificate template not found")

	// ErrTemplateAlreadyExists is returned when template already exists
	ErrTemplateAlreadyExists = errors.New("certificate template already exists")

	// ErrTemplateCreationFailed is returned when template creation fails
	ErrTemplateCreationFailed = errors.New("failed to create certificate template")

	// ErrTemplateUpdateFailed is returned when template update fails
	ErrTemplateUpdateFailed = errors.New("failed to update certificate template")

	// ErrTemplateDeletionFailed is returned when template deletion fails
	ErrTemplateDeletionFailed = errors.New("failed to delete certificate template")

	// ErrInvalidTemplateData is returned when template data is invalid
	ErrInvalidTemplateData = errors.New("invalid certificate template data")

	// ErrTemplateNotActive is returned when template is not active
	ErrTemplateNotActive = errors.New("certificate template is not active")

	// ErrCannotDeleteDefaultTemplate is returned when trying to delete default template
	ErrCannotDeleteDefaultTemplate = errors.New("cannot delete default template")

	// ErrNoDefaultTemplate is returned when no default template is found
	ErrNoDefaultTemplate = errors.New("no default certificate template found")
)

// ============================================================
// Certificate Generation Errors
// ============================================================

var (
	// ErrGenerationFailed is returned when certificate generation fails
	ErrGenerationFailed = errors.New("failed to generate certificate")

	// ErrPDFGenerationFailed is returned when PDF generation fails
	ErrPDFGenerationFailed = errors.New("failed to generate PDF certificate")

	// ErrInvalidFormat is returned when certificate format is invalid
	ErrInvalidFormat = errors.New("invalid certificate format")

	// ErrTemplateLoadFailed is returned when template loading fails
	ErrTemplateLoadFailed = errors.New("failed to load certificate template")

	// ErrTemplateRenderFailed is returned when template rendering fails
	ErrTemplateRenderFailed = errors.New("failed to render certificate template")
)

// ============================================================
// Certificate Business Logic Errors
// ============================================================

var (
	// ErrCourseNotCompleted is returned when course is not completed
	ErrCourseNotCompleted = errors.New("course is not completed")

	// ErrEnrollmentNotCompleted is returned when enrollment is not completed
	ErrEnrollmentNotCompleted = errors.New("enrollment is not completed")

	// ErrProgressNotCompleted is returned when progress is not completed
	ErrProgressNotCompleted = errors.New("progress is not completed")

	// ErrAlreadyCertified is returned when user already has a certificate
	ErrAlreadyCertified = errors.New("user already has a certificate for this course")

	// ErrInsufficientGrade is returned when grade is insufficient for certification
	ErrInsufficientGrade = errors.New("insufficient grade for certification")

	// ErrCertificationRequirementsNotMet is returned when certification requirements are not met
	ErrCertificationRequirementsNotMet = errors.New("certification requirements not met")
)

// ============================================================
// Certificate Permission Errors
// ============================================================

var (
	// ErrUnauthorizedAccess is returned when user doesn't have permission
	ErrUnauthorizedAccess = errors.New("unauthorized access to certificate")

	// ErrInsufficientPermissions is returned when user doesn't have required permissions
	ErrInsufficientPermissions = errors.New("insufficient permissions for this action")

	// ErrNotCertificateOwner is returned when user is not the certificate owner
	ErrNotCertificateOwner = errors.New("user is not the certificate owner")
)

// ============================================================
// Validation Errors
// ============================================================

var (
	// ErrInvalidUserID is returned when user ID is invalid
	ErrInvalidUserID = errors.New("invalid user ID")

	// ErrInvalidCourseID is returned when course ID is invalid
	ErrInvalidCourseID = errors.New("invalid course ID")

	// ErrInvalidEnrollmentID is returned when enrollment ID is invalid
	ErrInvalidEnrollmentID = errors.New("invalid enrollment ID")

	// ErrInvalidProgressID is returned when progress ID is invalid
	ErrInvalidProgressID = errors.New("invalid progress ID")

	// ErrInvalidTemplateID is returned when template ID is invalid
	ErrInvalidTemplateID = errors.New("invalid template ID")

	// ErrInvalidGrade is returned when grade is invalid
	ErrInvalidGrade = errors.New("invalid grade (must be 0-100)")

	// ErrInvalidDateRange is returned when date range is invalid
	ErrInvalidDateRange = errors.New("invalid date range")

	// ErrInvalidPageParameters is returned when page parameters are invalid
	ErrInvalidPageParameters = errors.New("invalid page parameters")

	// ErrMissingRevocationReason is returned when revocation reason is missing
	ErrMissingRevocationReason = errors.New("revocation reason is required")

	// ErrInvalidRevocationReason is returned when revocation reason is invalid
	ErrInvalidRevocationReason = errors.New("revocation reason must be at least 10 characters")
)

// ============================================================
// Statistics Errors
// ============================================================

var (
	// ErrStatisticsFailed is returned when retrieving statistics fails
	ErrStatisticsFailed = errors.New("failed to retrieve certificate statistics")

	// ErrNoCertificates is returned when no certificates are found
	ErrNoCertificates = errors.New("no certificates found")

	// ErrInsufficientData is returned when there is insufficient data for statistics
	ErrInsufficientData = errors.New("insufficient data for statistics")
)

// ============================================================
// Storage Errors
// ============================================================

var (
	// ErrStorageFailed is returned when storage operation fails
	ErrStorageFailed = errors.New("certificate storage operation failed")

	// ErrFileNotFound is returned when certificate file is not found
	ErrFileNotFound = errors.New("certificate file not found")

	// ErrFileUploadFailed is returned when file upload fails
	ErrFileUploadFailed = errors.New("failed to upload certificate file")

	// ErrFileDownloadFailed is returned when file download fails
	ErrFileDownloadFailed = errors.New("failed to download certificate file")
)

// ============================================================
// Course/Enrollment/Progress Errors
// ============================================================

var (
	// ErrCourseNotFound is returned when course is not found
	ErrCourseNotFound = errors.New("course not found")

	// ErrEnrollmentNotFound is returned when enrollment is not found
	ErrEnrollmentNotFound = errors.New("enrollment not found")

	// ErrProgressNotFound is returned when progress is not found
	ErrProgressNotFound = errors.New("progress not found")

	// ErrUserNotFound is returned when user is not found
	ErrUserNotFound = errors.New("user not found")
)
