package services

import (
	"context"
	"fmt"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/assignments/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/assignments/ports"
	"github.com/google/uuid"
)

// AssignmentService implementa la interfaz ports.AssignmentService
type AssignmentService struct {
	repo    ports.AssignmentRepository
	storage ports.FileStorage
}

// NewAssignmentService crea una nueva instancia del servicio
func NewAssignmentService(
	repo ports.AssignmentRepository,
	storage ports.FileStorage,
) ports.AssignmentService {
	return &AssignmentService{
		repo:    repo,
		storage: storage,
	}
}

// ============================================================================
// ASSIGNMENT OPERATIONS
// ============================================================================

// CreateAssignment crea un nuevo assignment
func (s *AssignmentService) CreateAssignment(
	ctx context.Context,
	tenantID, userID uuid.UUID,
	req *domain.CreateAssignmentRequest,
) (*domain.AssignmentResponse, error) {
	// Crear assignment
	assignment := domain.NewAssignment(
		tenantID,
		userID,
		req.CourseID,
		req.Title,
		req.Description,
		req.Instructions,
		req.Type,
	)

	// Configurar opciones adicionales
	if req.ModuleID != nil {
		assignment.SetModuleID(*req.ModuleID)
	}
	if req.LessonID != nil {
		assignment.SetLessonID(*req.LessonID)
	}
	if req.MaxFileSize > 0 {
		assignment.MaxFileSize = req.MaxFileSize
	}
	if len(req.AllowedFileTypes) > 0 {
		assignment.AllowedFileTypes = req.AllowedFileTypes
	}
	if req.MaxFiles > 0 {
		assignment.MaxFiles = req.MaxFiles
	}
	assignment.AllowMultipleSubmissions = req.AllowMultipleSubmissions
	assignment.AvailableFrom = req.AvailableFrom
	assignment.DueDate = req.DueDate
	if req.LatePenaltyPerDay > 0 {
		assignment.LatePenaltyPerDay = req.LatePenaltyPerDay
	}
	assignment.AcceptLateSubmissions = req.AcceptLateSubmissions
	if req.RubricID != nil {
		assignment.SetRubric(*req.RubricID)
	}
	if req.MaxPoints > 0 {
		assignment.MaxPoints = req.MaxPoints
	}
	if req.PassingScore > 0 {
		assignment.PassingScore = req.PassingScore
	}
	assignment.PeerReviewEnabled = req.PeerReviewEnabled
	if req.PeerReviewsRequired > 0 {
		assignment.PeerReviewsRequired = req.PeerReviewsRequired
	}
	assignment.AnonymousGrading = req.AnonymousGrading
	assignment.PlagiarismCheckEnabled = req.PlagiarismCheckEnabled
	if req.EstimatedDuration > 0 {
		assignment.EstimatedDuration = req.EstimatedDuration
	}

	// Validar
	if err := assignment.Validate(); err != nil {
		return nil, err
	}

	// Guardar en base de datos
	if err := s.repo.CreateAssignment(ctx, assignment); err != nil {
		return nil, ports.ErrAssignmentCreationFailed
	}

	return &domain.AssignmentResponse{Assignment: assignment}, nil
}

// GetAssignment obtiene un assignment por ID
func (s *AssignmentService) GetAssignment(
	ctx context.Context,
	id, tenantID uuid.UUID,
) (*domain.AssignmentResponse, error) {
	assignment, err := s.repo.GetAssignment(ctx, id, tenantID)
	if err != nil {
		return nil, ports.ErrAssignmentNotFound
	}

	return &domain.AssignmentResponse{Assignment: assignment}, nil
}

// GetCourseAssignments obtiene los assignments de un curso
func (s *AssignmentService) GetCourseAssignments(
	ctx context.Context,
	courseID, tenantID uuid.UUID,
	page, pageSize int,
) (*domain.AssignmentListResponse, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 20
	}

	assignments, total, err := s.repo.GetAssignmentsByCourse(ctx, courseID, tenantID, page, pageSize)
	if err != nil {
		return nil, err
	}

	responses := make([]domain.AssignmentResponse, len(assignments))
	for i, a := range assignments {
		responses[i] = domain.AssignmentResponse{Assignment: a}
	}

	totalPages := (total + pageSize - 1) / pageSize

	return &domain.AssignmentListResponse{
		Assignments: responses,
		Total:       total,
		Page:        page,
		PageSize:    pageSize,
		TotalPages:  totalPages,
	}, nil
}

// GetMyAssignments obtiene los assignments disponibles para un estudiante
func (s *AssignmentService) GetMyAssignments(
	ctx context.Context,
	studentID, tenantID uuid.UUID,
	page, pageSize int,
) (*domain.AssignmentListResponse, error) {
	// Por ahora retornamos error - necesitaríamos el courseID del estudiante
	// Esta funcionalidad se puede implementar obteniendo los cursos del estudiante primero
	return nil, fmt.Errorf("not implemented: need to get student's enrolled courses first")
}

// UpdateAssignment actualiza un assignment
func (s *AssignmentService) UpdateAssignment(
	ctx context.Context,
	id, tenantID, userID uuid.UUID,
	req *domain.UpdateAssignmentRequest,
) (*domain.AssignmentResponse, error) {
	// Obtener assignment existente
	assignment, err := s.repo.GetAssignment(ctx, id, tenantID)
	if err != nil {
		return nil, ports.ErrAssignmentNotFound
	}

	// Verificar permisos
	if assignment.CreatedBy != userID {
		return nil, ports.ErrNotAssignmentOwner
	}

	// Aplicar actualizaciones
	title := ""
	if req.Title != nil {
		title = *req.Title
	}
	description := ""
	if req.Description != nil {
		description = *req.Description
	}
	instructions := ""
	if req.Instructions != nil {
		instructions = *req.Instructions
	}

	maxFileSize := int64(0)
	if req.MaxFileSize != nil {
		maxFileSize = *req.MaxFileSize
	}

	var allowedFileTypes []string
	if req.AllowedFileTypes != nil {
		allowedFileTypes = req.AllowedFileTypes
	}

	maxFiles := 0
	if req.MaxFiles != nil {
		maxFiles = *req.MaxFiles
	}

	allowMultiple := assignment.AllowMultipleSubmissions
	if req.AllowMultipleSubmissions != nil {
		allowMultiple = *req.AllowMultipleSubmissions
	}

	latePenalty := float64(0)
	if req.LatePenaltyPerDay != nil {
		latePenalty = *req.LatePenaltyPerDay
	}

	acceptLate := assignment.AcceptLateSubmissions
	if req.AcceptLateSubmissions != nil {
		acceptLate = *req.AcceptLateSubmissions
	}

	maxPoints := float64(0)
	if req.MaxPoints != nil {
		maxPoints = *req.MaxPoints
	}

	passingScore := float64(0)
	if req.PassingScore != nil {
		passingScore = *req.PassingScore
	}

	estimatedDuration := 0
	if req.EstimatedDuration != nil {
		estimatedDuration = *req.EstimatedDuration
	}

	if err := assignment.Update(
		title, description, instructions,
		maxFileSize, allowedFileTypes, maxFiles,
		allowMultiple,
		req.DueDate, req.AvailableFrom,
		latePenalty, acceptLate,
		maxPoints, passingScore,
		estimatedDuration,
	); err != nil {
		return nil, err
	}

	// Actualizar rubric si se especifica
	if req.RubricID != nil {
		assignment.SetRubric(*req.RubricID)
	}

	// Actualizar configuraciones avanzadas
	if req.PeerReviewEnabled != nil {
		assignment.PeerReviewEnabled = *req.PeerReviewEnabled
	}
	if req.PeerReviewsRequired != nil {
		assignment.PeerReviewsRequired = *req.PeerReviewsRequired
	}
	if req.AnonymousGrading != nil {
		assignment.AnonymousGrading = *req.AnonymousGrading
	}
	if req.PlagiarismCheckEnabled != nil {
		assignment.PlagiarismCheckEnabled = *req.PlagiarismCheckEnabled
	}

	// Manejar publicación
	if req.IsPublished != nil {
		if *req.IsPublished && !assignment.IsPublished {
			if err := assignment.Publish(); err != nil {
				return nil, err
			}
		} else if !*req.IsPublished && assignment.IsPublished {
			if err := assignment.Unpublish(); err != nil {
				return nil, err
			}
		}
	}

	// Guardar cambios
	if err := s.repo.UpdateAssignment(ctx, assignment); err != nil {
		return nil, ports.ErrAssignmentUpdateFailed
	}

	return &domain.AssignmentResponse{Assignment: assignment}, nil
}

// DeleteAssignment elimina un assignment
func (s *AssignmentService) DeleteAssignment(
	ctx context.Context,
	id, tenantID, userID uuid.UUID,
) error {
	// Obtener assignment
	assignment, err := s.repo.GetAssignment(ctx, id, tenantID)
	if err != nil {
		return ports.ErrAssignmentNotFound
	}

	// Verificar permisos
	if assignment.CreatedBy != userID {
		return ports.ErrNotAssignmentOwner
	}

	// Eliminar assignment
	if err := s.repo.DeleteAssignment(ctx, id, tenantID); err != nil {
		return ports.ErrAssignmentDeletionFailed
	}

	return nil
}

// PublishAssignment publica un assignment
func (s *AssignmentService) PublishAssignment(
	ctx context.Context,
	id, tenantID, userID uuid.UUID,
) (*domain.AssignmentResponse, error) {
	// Obtener assignment
	assignment, err := s.repo.GetAssignment(ctx, id, tenantID)
	if err != nil {
		return nil, ports.ErrAssignmentNotFound
	}

	// Verificar permisos
	if assignment.CreatedBy != userID {
		return nil, ports.ErrNotAssignmentOwner
	}

	// Publicar
	if err := assignment.Publish(); err != nil {
		return nil, err
	}

	// Guardar cambios
	if err := s.repo.UpdateAssignment(ctx, assignment); err != nil {
		return nil, ports.ErrAssignmentUpdateFailed
	}

	return &domain.AssignmentResponse{Assignment: assignment}, nil
}

// UnpublishAssignment despublica un assignment
func (s *AssignmentService) UnpublishAssignment(
	ctx context.Context,
	id, tenantID, userID uuid.UUID,
) (*domain.AssignmentResponse, error) {
	// Obtener assignment
	assignment, err := s.repo.GetAssignment(ctx, id, tenantID)
	if err != nil {
		return nil, ports.ErrAssignmentNotFound
	}

	// Verificar permisos
	if assignment.CreatedBy != userID {
		return nil, ports.ErrNotAssignmentOwner
	}

	// Despublicar
	if err := assignment.Unpublish(); err != nil {
		return nil, err
	}

	// Guardar cambios
	if err := s.repo.UpdateAssignment(ctx, assignment); err != nil {
		return nil, ports.ErrAssignmentUpdateFailed
	}

	return &domain.AssignmentResponse{Assignment: assignment}, nil
}

// ============================================================================
// SUBMISSION OPERATIONS - STUDENT
// ============================================================================

// GetMySubmission obtiene la submission de un estudiante para un assignment
func (s *AssignmentService) GetMySubmission(
	ctx context.Context,
	assignmentID, studentID, tenantID uuid.UUID,
) (*domain.SubmissionResponse, error) {
	submission, err := s.repo.GetSubmissionByStudentAndAssignment(ctx, studentID, assignmentID, tenantID)
	if err != nil {
		return nil, ports.ErrSubmissionNotFound
	}

	return &domain.SubmissionResponse{AssignmentSubmission: submission}, nil
}

// GetMySubmissions obtiene todas las submissions de un estudiante
func (s *AssignmentService) GetMySubmissions(
	ctx context.Context,
	studentID, tenantID uuid.UUID,
	page, pageSize int,
) (*domain.SubmissionListResponse, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 20
	}

	submissions, total, err := s.repo.GetSubmissionsByStudent(ctx, studentID, tenantID, page, pageSize)
	if err != nil {
		return nil, err
	}

	responses := make([]domain.SubmissionResponse, len(submissions))
	for i, sub := range submissions {
		responses[i] = domain.SubmissionResponse{AssignmentSubmission: sub}
	}

	totalPages := (total + pageSize - 1) / pageSize

	return &domain.SubmissionListResponse{
		Submissions: responses,
		Total:       total,
		Page:        page,
		PageSize:    pageSize,
		TotalPages:  totalPages,
	}, nil
}

// CreateSubmission crea una nueva submission
func (s *AssignmentService) CreateSubmission(
	ctx context.Context,
	tenantID, studentID uuid.UUID,
	req *domain.CreateSubmissionRequest,
) (*domain.SubmissionResponse, error) {
	// Verificar que no exista una submission
	exists, err := s.repo.SubmissionExists(ctx, studentID, req.AssignmentID, tenantID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, domain.ErrSubmissionAlreadyExists
	}

	// Obtener assignment
	assignment, err := s.repo.GetAssignment(ctx, req.AssignmentID, tenantID)
	if err != nil {
		return nil, ports.ErrAssignmentNotFound
	}

	// Verificar que el assignment esté disponible
	if !assignment.IsAvailable() {
		return nil, domain.ErrAssignmentNotAvailable
	}

	// Crear submission
	submission := domain.NewAssignmentSubmission(
		tenantID,
		req.AssignmentID,
		studentID,
		req.TextContent,
	)

	if req.IsFinal {
		if err := submission.Submit(assignment); err != nil {
			return nil, err
		}
	}

	// Validar
	if err := submission.Validate(); err != nil {
		return nil, err
	}

	// Guardar
	if err := s.repo.CreateSubmission(ctx, submission); err != nil {
		return nil, ports.ErrSubmissionCreationFailed
	}

	return &domain.SubmissionResponse{AssignmentSubmission: submission}, nil
}

// UpdateSubmission actualiza una submission
func (s *AssignmentService) UpdateSubmission(
	ctx context.Context,
	id, tenantID, studentID uuid.UUID,
	req *domain.UpdateSubmissionRequest,
) (*domain.SubmissionResponse, error) {
	// Obtener submission
	submission, err := s.repo.GetSubmission(ctx, id, tenantID)
	if err != nil {
		return nil, ports.ErrSubmissionNotFound
	}

	// Verificar permisos
	if submission.StudentID != studentID {
		return nil, ports.ErrNotSubmissionOwner
	}

	// Aplicar actualizaciones
	if req.TextContent != nil {
		if err := submission.Update(*req.TextContent); err != nil {
			return nil, err
		}
	}

	// Guardar cambios
	if err := s.repo.UpdateSubmission(ctx, submission); err != nil {
		return nil, ports.ErrSubmissionUpdateFailed
	}

	return &domain.SubmissionResponse{AssignmentSubmission: submission}, nil
}

// SubmitAssignment marca una submission como enviada
func (s *AssignmentService) SubmitAssignment(
	ctx context.Context,
	submissionID, studentID, tenantID uuid.UUID,
) (*domain.SubmissionResponse, error) {
	// Obtener submission
	submission, err := s.repo.GetSubmission(ctx, submissionID, tenantID)
	if err != nil {
		return nil, ports.ErrSubmissionNotFound
	}

	// Verificar permisos
	if submission.StudentID != studentID {
		return nil, ports.ErrNotSubmissionOwner
	}

	// Obtener assignment
	assignment, err := s.repo.GetAssignment(ctx, submission.AssignmentID, tenantID)
	if err != nil {
		return nil, ports.ErrAssignmentNotFound
	}

	// Enviar submission
	if err := submission.Submit(assignment); err != nil {
		return nil, err
	}

	// Guardar cambios
	if err := s.repo.UpdateSubmission(ctx, submission); err != nil {
		return nil, ports.ErrSubmissionUpdateFailed
	}

	return &domain.SubmissionResponse{AssignmentSubmission: submission}, nil
}

// ============================================================================
// SUBMISSION OPERATIONS - INSTRUCTOR
// ============================================================================

// GetSubmission obtiene una submission por ID (instructor)
func (s *AssignmentService) GetSubmission(
	ctx context.Context,
	id, tenantID uuid.UUID,
) (*domain.SubmissionResponse, error) {
	submission, err := s.repo.GetSubmission(ctx, id, tenantID)
	if err != nil {
		return nil, ports.ErrSubmissionNotFound
	}

	return &domain.SubmissionResponse{AssignmentSubmission: submission}, nil
}

// GetAssignmentSubmissions obtiene todas las submissions de un assignment
func (s *AssignmentService) GetAssignmentSubmissions(
	ctx context.Context,
	assignmentID, tenantID uuid.UUID,
	page, pageSize int,
) (*domain.SubmissionListResponse, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 20
	}

	submissions, total, err := s.repo.GetSubmissionsByAssignment(ctx, assignmentID, tenantID, page, pageSize)
	if err != nil {
		return nil, err
	}

	responses := make([]domain.SubmissionResponse, len(submissions))
	for i, sub := range submissions {
		responses[i] = domain.SubmissionResponse{AssignmentSubmission: sub}
	}

	totalPages := (total + pageSize - 1) / pageSize

	return &domain.SubmissionListResponse{
		Submissions: responses,
		Total:       total,
		Page:        page,
		PageSize:    pageSize,
		TotalPages:  totalPages,
	}, nil
}

// GetStudentSubmissions obtiene todas las submissions de un estudiante en un curso
func (s *AssignmentService) GetStudentSubmissions(
	ctx context.Context,
	studentID, courseID, tenantID uuid.UUID,
) (*domain.SubmissionListResponse, error) {
	submissions, err := s.repo.GetSubmissionsByCourse(ctx, courseID, studentID, tenantID)
	if err != nil {
		return nil, err
	}

	responses := make([]domain.SubmissionResponse, len(submissions))
	for i, sub := range submissions {
		responses[i] = domain.SubmissionResponse{AssignmentSubmission: sub}
	}

	return &domain.SubmissionListResponse{
		Submissions: responses,
		Total:       len(responses),
		Page:        1,
		PageSize:    len(responses),
		TotalPages:  1,
	}, nil
}

// GradeSubmission califica una submission
func (s *AssignmentService) GradeSubmission(
	ctx context.Context,
	submissionID, graderID, tenantID uuid.UUID,
	req *domain.GradeSubmissionRequest,
) (*domain.SubmissionResponse, error) {
	// Obtener submission
	submission, err := s.repo.GetSubmission(ctx, submissionID, tenantID)
	if err != nil {
		return nil, ports.ErrSubmissionNotFound
	}

	// Obtener assignment
	assignment, err := s.repo.GetAssignment(ctx, submission.AssignmentID, tenantID)
	if err != nil {
		return nil, ports.ErrAssignmentNotFound
	}

	// Calcular puntos totales
	totalPointsEarned := 0.0
	totalPointsPossible := 0.0

	// Eliminar calificaciones anteriores
	if err := s.repo.DeleteGradesBySubmission(ctx, submissionID, tenantID); err != nil {
		return nil, err
	}

	// Crear nuevas calificaciones
	for _, gradeDTO := range req.Grades {
		grade := domain.NewSubmissionGrade(
			tenantID,
			submissionID,
			graderID,
			gradeDTO.PointsEarned,
			gradeDTO.PointsPossible,
			gradeDTO.Feedback,
		)

		if gradeDTO.CriterionID != nil {
			grade.CriterionID = gradeDTO.CriterionID
		}

		if err := grade.Validate(); err != nil {
			return nil, err
		}

		if err := s.repo.CreateGrade(ctx, grade); err != nil {
			return nil, ports.ErrGradeCreationFailed
		}

		totalPointsEarned += gradeDTO.PointsEarned
		totalPointsPossible += gradeDTO.PointsPossible

		submission.AddGrade(grade.ID)
	}

	// Calificar submission
	if err := submission.Grade(totalPointsEarned, totalPointsPossible, req.Feedback, assignment); err != nil {
		return nil, err
	}

	// Guardar cambios
	if err := s.repo.UpdateSubmission(ctx, submission); err != nil {
		return nil, ports.ErrSubmissionUpdateFailed
	}

	return &domain.SubmissionResponse{AssignmentSubmission: submission}, nil
}

// BulkGrade califica múltiples submissions
func (s *AssignmentService) BulkGrade(
	ctx context.Context,
	tenantID, graderID uuid.UUID,
	req *domain.BulkGradeRequest,
) ([]domain.SubmissionResponse, error) {
	responses := make([]domain.SubmissionResponse, 0, len(req.SubmissionIDs))

	for _, submissionID := range req.SubmissionIDs {
		gradeReq := &domain.GradeSubmissionRequest{
			Grades:   req.Grades,
			Feedback: req.Feedback,
		}

		response, err := s.GradeSubmission(ctx, submissionID, graderID, tenantID, gradeReq)
		if err != nil {
			// Continuar con las demás submissions en caso de error
			continue
		}

		responses = append(responses, *response)
	}

	return responses, nil
}

// ReturnSubmission devuelve una submission al estudiante
func (s *AssignmentService) ReturnSubmission(
	ctx context.Context,
	submissionID, instructorID, tenantID uuid.UUID,
	feedback string,
) (*domain.SubmissionResponse, error) {
	// Obtener submission
	submission, err := s.repo.GetSubmission(ctx, submissionID, tenantID)
	if err != nil {
		return nil, ports.ErrSubmissionNotFound
	}

	// Devolver submission
	if err := submission.Return(feedback); err != nil {
		return nil, err
	}

	// Guardar cambios
	if err := s.repo.UpdateSubmission(ctx, submission); err != nil {
		return nil, ports.ErrSubmissionUpdateFailed
	}

	return &domain.SubmissionResponse{AssignmentSubmission: submission}, nil
}

// DeleteSubmission elimina una submission
func (s *AssignmentService) DeleteSubmission(
	ctx context.Context,
	id, tenantID, userID uuid.UUID,
) error {
	// Obtener submission
	submission, err := s.repo.GetSubmission(ctx, id, tenantID)
	if err != nil {
		return ports.ErrSubmissionNotFound
	}

	// Verificar permisos (solo el estudiante puede eliminar su submission)
	if submission.StudentID != userID {
		return ports.ErrNotSubmissionOwner
	}

	// Eliminar submission
	if err := s.repo.DeleteSubmission(ctx, id, tenantID); err != nil {
		return ports.ErrSubmissionDeletionFailed
	}

	return nil
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

// UploadAssignmentFile sube un archivo para un assignment
func (s *AssignmentService) UploadAssignmentFile(
	ctx context.Context,
	assignmentID, tenantID, userID uuid.UUID,
	filename, originalFilename, mimeType string,
	fileData []byte,
	description string,
	isTemplate bool,
) (*domain.FileResponse, error) {
	// Obtener assignment
	assignment, err := s.repo.GetAssignment(ctx, assignmentID, tenantID)
	if err != nil {
		return nil, ports.ErrAssignmentNotFound
	}

	// Verificar permisos
	if assignment.CreatedBy != userID {
		return nil, ports.ErrNotAssignmentOwner
	}

	// Validar archivo
	if err := s.storage.ValidateFile(originalFilename, int64(len(fileData)), mimeType, assignment); err != nil {
		return nil, err
	}

	// Crear registro de archivo
	file := domain.NewAssignmentFile(
		tenantID,
		userID,
		filename,
		originalFilename,
		mimeType,
		"", // filePath se llenará después del upload
		int64(len(fileData)),
		isTemplate,
	)
	file.SetAssignmentID(assignmentID)
	if description != "" {
		file.SetDescription(description)
	}

	// Subir archivo al storage
	fileURL, err := s.storage.Store(ctx, file.ID, fileData, mimeType)
	if err != nil {
		return nil, ports.ErrFileUploadFailed
	}

	file.FilePath = fileURL
	file.SetFileURL(fileURL)

	// Guardar registro en base de datos
	if err := s.repo.CreateFile(ctx, file); err != nil {
		// Intentar eliminar el archivo subido
		_ = s.storage.Delete(ctx, file.ID)
		return nil, ports.ErrFileCreationFailed
	}

	// Agregar archivo al assignment
	if isTemplate {
		assignment.AddTemplateFile(file.ID)
	} else {
		assignment.AddAttachment(file.ID)
	}

	// Actualizar assignment
	if err := s.repo.UpdateAssignment(ctx, assignment); err != nil {
		return nil, err
	}

	return &domain.FileResponse{AssignmentFile: file}, nil
}

// UploadSubmissionFile sube un archivo para una submission
func (s *AssignmentService) UploadSubmissionFile(
	ctx context.Context,
	submissionID, tenantID, userID uuid.UUID,
	filename, originalFilename, mimeType string,
	fileData []byte,
	description string,
) (*domain.FileResponse, error) {
	// Obtener submission
	submission, err := s.repo.GetSubmission(ctx, submissionID, tenantID)
	if err != nil {
		return nil, ports.ErrSubmissionNotFound
	}

	// Verificar permisos
	if submission.StudentID != userID {
		return nil, ports.ErrNotSubmissionOwner
	}

	// Obtener assignment para validación
	assignment, err := s.repo.GetAssignment(ctx, submission.AssignmentID, tenantID)
	if err != nil {
		return nil, ports.ErrAssignmentNotFound
	}

	// Validar archivo
	if err := s.storage.ValidateFile(originalFilename, int64(len(fileData)), mimeType, assignment); err != nil {
		return nil, err
	}

	// Crear registro de archivo
	file := domain.NewAssignmentFile(
		tenantID,
		userID,
		filename,
		originalFilename,
		mimeType,
		"",
		int64(len(fileData)),
		false,
	)
	file.SetSubmissionID(submissionID)
	if description != "" {
		file.SetDescription(description)
	}

	// Subir archivo al storage
	fileURL, err := s.storage.Store(ctx, file.ID, fileData, mimeType)
	if err != nil {
		return nil, ports.ErrFileUploadFailed
	}

	file.FilePath = fileURL
	file.SetFileURL(fileURL)

	// Guardar registro en base de datos
	if err := s.repo.CreateFile(ctx, file); err != nil {
		_ = s.storage.Delete(ctx, file.ID)
		return nil, ports.ErrFileCreationFailed
	}

	// Agregar archivo a la submission
	if err := submission.AddFile(file.ID, assignment); err != nil {
		return nil, err
	}

	// Actualizar submission
	if err := s.repo.UpdateSubmission(ctx, submission); err != nil {
		return nil, err
	}

	return &domain.FileResponse{AssignmentFile: file}, nil
}

// GetFile obtiene un archivo por ID
func (s *AssignmentService) GetFile(
	ctx context.Context,
	fileID, tenantID uuid.UUID,
) (*domain.FileResponse, error) {
	file, err := s.repo.GetFile(ctx, fileID, tenantID)
	if err != nil {
		return nil, ports.ErrFileNotFound
	}

	return &domain.FileResponse{AssignmentFile: file}, nil
}

// DownloadFile descarga un archivo
func (s *AssignmentService) DownloadFile(
	ctx context.Context,
	fileID, tenantID, userID uuid.UUID,
) ([]byte, string, error) {
	// Obtener archivo
	file, err := s.repo.GetFile(ctx, fileID, tenantID)
	if err != nil {
		return nil, "", ports.ErrFileNotFound
	}

	// Descargar archivo del storage
	data, err := s.storage.Retrieve(ctx, file.ID)
	if err != nil {
		return nil, "", ports.ErrFileDownloadFailed
	}

	return data, file.OriginalFilename, nil
}

// DeleteAssignmentFile elimina un archivo de un assignment
func (s *AssignmentService) DeleteAssignmentFile(
	ctx context.Context,
	assignmentID, fileID, tenantID, userID uuid.UUID,
) error {
	// Obtener assignment
	assignment, err := s.repo.GetAssignment(ctx, assignmentID, tenantID)
	if err != nil {
		return ports.ErrAssignmentNotFound
	}

	// Verificar permisos
	if assignment.CreatedBy != userID {
		return ports.ErrNotAssignmentOwner
	}

	// Obtener archivo
	file, err := s.repo.GetFile(ctx, fileID, tenantID)
	if err != nil {
		return ports.ErrFileNotFound
	}

	// Eliminar del storage
	if err := s.storage.Delete(ctx, file.ID); err != nil {
		return ports.ErrFileDeletionFailed
	}

	// Eliminar de base de datos
	if err := s.repo.DeleteFile(ctx, fileID, tenantID); err != nil {
		return ports.ErrFileDeletionFailed
	}

	// Remover del assignment
	if file.IsTemplate {
		assignment.RemoveTemplateFile(fileID)
	} else {
		assignment.RemoveAttachment(fileID)
	}

	// Actualizar assignment
	if err := s.repo.UpdateAssignment(ctx, assignment); err != nil {
		return err
	}

	return nil
}

// DeleteSubmissionFile elimina un archivo de una submission
func (s *AssignmentService) DeleteSubmissionFile(
	ctx context.Context,
	submissionID, fileID, tenantID, userID uuid.UUID,
) error {
	// Obtener submission
	submission, err := s.repo.GetSubmission(ctx, submissionID, tenantID)
	if err != nil {
		return ports.ErrSubmissionNotFound
	}

	// Verificar permisos
	if submission.StudentID != userID {
		return ports.ErrNotSubmissionOwner
	}

	// Obtener archivo
	file, err := s.repo.GetFile(ctx, fileID, tenantID)
	if err != nil {
		return ports.ErrFileNotFound
	}

	// Eliminar del storage
	if err := s.storage.Delete(ctx, file.ID); err != nil {
		return ports.ErrFileDeletionFailed
	}

	// Eliminar de base de datos
	if err := s.repo.DeleteFile(ctx, fileID, tenantID); err != nil {
		return ports.ErrFileDeletionFailed
	}

	// Remover de la submission
	if err := submission.RemoveFile(fileID); err != nil {
		return err
	}

	// Actualizar submission
	if err := s.repo.UpdateSubmission(ctx, submission); err != nil {
		return err
	}

	return nil
}

// ============================================================================
// COMMENT OPERATIONS
// ============================================================================

// AddComment agrega un comentario a una submission
func (s *AssignmentService) AddComment(
	ctx context.Context,
	submissionID, authorID, tenantID uuid.UUID,
	req *domain.CreateCommentRequest,
	authorRole string,
) (*domain.CommentResponse, error) {
	// Verificar que la submission existe
	_, err := s.repo.GetSubmission(ctx, submissionID, tenantID)
	if err != nil {
		return nil, ports.ErrSubmissionNotFound
	}

	// Crear comentario
	comment := domain.NewSubmissionComment(
		tenantID,
		submissionID,
		authorID,
		authorRole,
		req.Content,
		req.IsPrivate,
	)

	// Validar
	if err := comment.Validate(); err != nil {
		return nil, err
	}

	// Guardar
	if err := s.repo.CreateComment(ctx, comment); err != nil {
		return nil, ports.ErrCommentCreationFailed
	}

	return &domain.CommentResponse{SubmissionComment: comment}, nil
}

// GetSubmissionComments obtiene los comentarios de una submission
func (s *AssignmentService) GetSubmissionComments(
	ctx context.Context,
	submissionID, tenantID, userID uuid.UUID,
	isInstructor bool,
) ([]domain.CommentResponse, error) {
	comments, err := s.repo.GetCommentsBySubmission(ctx, submissionID, tenantID)
	if err != nil {
		return nil, err
	}

	// Filtrar comentarios privados si el usuario no es instructor
	visibleComments := make([]domain.CommentResponse, 0)
	for _, comment := range comments {
		if comment.IsVisibleTo(userID, isInstructor) {
			visibleComments = append(visibleComments, domain.CommentResponse{SubmissionComment: comment})
		}
	}

	return visibleComments, nil
}

// UpdateComment actualiza un comentario
func (s *AssignmentService) UpdateComment(
	ctx context.Context,
	commentID, userID, tenantID uuid.UUID,
	content string,
) (*domain.CommentResponse, error) {
	// Obtener comentario
	comment, err := s.repo.GetComment(ctx, commentID, tenantID)
	if err != nil {
		return nil, ports.ErrCommentNotFound
	}

	// Verificar permisos
	if comment.AuthorID != userID {
		return nil, ports.ErrUnauthorized
	}

	// Actualizar
	if err := comment.Update(content); err != nil {
		return nil, err
	}

	// Guardar cambios
	if err := s.repo.UpdateComment(ctx, comment); err != nil {
		return nil, ports.ErrCommentUpdateFailed
	}

	return &domain.CommentResponse{SubmissionComment: comment}, nil
}

// DeleteComment elimina un comentario
func (s *AssignmentService) DeleteComment(
	ctx context.Context,
	commentID, userID, tenantID uuid.UUID,
) error {
	// Obtener comentario
	comment, err := s.repo.GetComment(ctx, commentID, tenantID)
	if err != nil {
		return ports.ErrCommentNotFound
	}

	// Verificar permisos
	if comment.AuthorID != userID {
		return ports.ErrUnauthorized
	}

	// Eliminar
	if err := s.repo.DeleteComment(ctx, commentID, tenantID); err != nil {
		return ports.ErrCommentDeletionFailed
	}

	return nil
}

// ============================================================================
// RUBRIC OPERATIONS
// ============================================================================

// CreateRubric crea una nueva rúbrica
func (s *AssignmentService) CreateRubric(
	ctx context.Context,
	tenantID, createdBy uuid.UUID,
	req *domain.CreateRubricRequest,
) (*domain.RubricResponse, error) {
	// Convertir DTOs a entidades de dominio
	criteria := make([]domain.RubricCriterion, len(req.Criteria))
	for i, criterionDTO := range req.Criteria {
		levels := make([]domain.RubricLevel, len(criterionDTO.Levels))
		for j, levelDTO := range criterionDTO.Levels {
			levels[j] = *domain.NewRubricLevel(levelDTO.Name, levelDTO.Points, levelDTO.Description)
		}

		criteria[i] = *domain.NewRubricCriterion(
			criterionDTO.Name,
			criterionDTO.Description,
			criterionDTO.MaxPoints,
			criterionDTO.Weight,
			levels,
		)
	}

	// Crear rúbrica
	rubric := domain.NewRubric(
		tenantID,
		createdBy,
		req.Name,
		req.Description,
		criteria,
		req.IsTemplate,
	)

	// Validar
	if err := rubric.Validate(); err != nil {
		return nil, err
	}

	// Guardar
	if err := s.repo.CreateRubric(ctx, rubric); err != nil {
		return nil, ports.ErrRubricCreationFailed
	}

	return &domain.RubricResponse{Rubric: rubric}, nil
}

// GetRubric obtiene una rúbrica por ID
func (s *AssignmentService) GetRubric(
	ctx context.Context,
	id, tenantID uuid.UUID,
) (*domain.RubricResponse, error) {
	rubric, err := s.repo.GetRubric(ctx, id, tenantID)
	if err != nil {
		return nil, ports.ErrRubricNotFound
	}

	return &domain.RubricResponse{Rubric: rubric}, nil
}

// GetTenantRubrics obtiene las rúbricas de un tenant
func (s *AssignmentService) GetTenantRubrics(
	ctx context.Context,
	tenantID uuid.UUID,
	page, pageSize int,
) (*domain.RubricListResponse, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 20
	}

	rubrics, total, err := s.repo.GetRubricsByTenant(ctx, tenantID, page, pageSize)
	if err != nil {
		return nil, err
	}

	responses := make([]domain.RubricResponse, len(rubrics))
	for i, r := range rubrics {
		responses[i] = domain.RubricResponse{Rubric: r}
	}

	totalPages := (total + pageSize - 1) / pageSize

	return &domain.RubricListResponse{
		Rubrics:    responses,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

// GetRubricTemplates obtiene las plantillas de rúbricas
func (s *AssignmentService) GetRubricTemplates(
	ctx context.Context,
	tenantID uuid.UUID,
) (*domain.RubricListResponse, error) {
	rubrics, err := s.repo.GetRubricTemplates(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	responses := make([]domain.RubricResponse, len(rubrics))
	for i, r := range rubrics {
		responses[i] = domain.RubricResponse{Rubric: r}
	}

	return &domain.RubricListResponse{
		Rubrics:    responses,
		Total:      len(responses),
		Page:       1,
		PageSize:   len(responses),
		TotalPages: 1,
	}, nil
}

// UpdateRubric actualiza una rúbrica
func (s *AssignmentService) UpdateRubric(
	ctx context.Context,
	id, tenantID, userID uuid.UUID,
	req *domain.UpdateRubricRequest,
) (*domain.RubricResponse, error) {
	// Obtener rúbrica
	rubric, err := s.repo.GetRubric(ctx, id, tenantID)
	if err != nil {
		return nil, ports.ErrRubricNotFound
	}

	// Verificar permisos
	if rubric.CreatedBy != userID {
		return nil, ports.ErrUnauthorized
	}

	// Aplicar actualizaciones
	name := ""
	if req.Name != nil {
		name = *req.Name
	}
	description := ""
	if req.Description != nil {
		description = *req.Description
	}

	var criteria []domain.RubricCriterion
	if req.Criteria != nil {
		criteria = make([]domain.RubricCriterion, len(req.Criteria))
		for i, criterionDTO := range req.Criteria {
			levels := make([]domain.RubricLevel, len(criterionDTO.Levels))
			for j, levelDTO := range criterionDTO.Levels {
				levels[j] = *domain.NewRubricLevel(levelDTO.Name, levelDTO.Points, levelDTO.Description)
			}

			criteria[i] = *domain.NewRubricCriterion(
				criterionDTO.Name,
				criterionDTO.Description,
				criterionDTO.MaxPoints,
				criterionDTO.Weight,
				levels,
			)
		}
	}

	if err := rubric.Update(name, description, criteria); err != nil {
		return nil, err
	}

	// Guardar cambios
	if err := s.repo.UpdateRubric(ctx, rubric); err != nil {
		return nil, ports.ErrRubricUpdateFailed
	}

	return &domain.RubricResponse{Rubric: rubric}, nil
}

// DeleteRubric elimina una rúbrica
func (s *AssignmentService) DeleteRubric(
	ctx context.Context,
	id, tenantID, userID uuid.UUID,
) error {
	// Obtener rúbrica
	rubric, err := s.repo.GetRubric(ctx, id, tenantID)
	if err != nil {
		return ports.ErrRubricNotFound
	}

	// Verificar permisos
	if rubric.CreatedBy != userID {
		return ports.ErrUnauthorized
	}

	// Eliminar
	if err := s.repo.DeleteRubric(ctx, id, tenantID); err != nil {
		return ports.ErrRubricDeletionFailed
	}

	return nil
}

// AttachRubricToAssignment asocia una rúbrica a un assignment
func (s *AssignmentService) AttachRubricToAssignment(
	ctx context.Context,
	assignmentID, rubricID, tenantID, userID uuid.UUID,
) error {
	// Obtener assignment
	assignment, err := s.repo.GetAssignment(ctx, assignmentID, tenantID)
	if err != nil {
		return ports.ErrAssignmentNotFound
	}

	// Verificar permisos
	if assignment.CreatedBy != userID {
		return ports.ErrNotAssignmentOwner
	}

	// Verificar que la rúbrica existe
	_, err = s.repo.GetRubric(ctx, rubricID, tenantID)
	if err != nil {
		return ports.ErrRubricNotFound
	}

	// Asociar rúbrica
	assignment.SetRubric(rubricID)

	// Guardar cambios
	if err := s.repo.UpdateAssignment(ctx, assignment); err != nil {
		return ports.ErrAssignmentUpdateFailed
	}

	return nil
}

// DetachRubricFromAssignment desasocia una rúbrica de un assignment
func (s *AssignmentService) DetachRubricFromAssignment(
	ctx context.Context,
	assignmentID, tenantID, userID uuid.UUID,
) error {
	// Obtener assignment
	assignment, err := s.repo.GetAssignment(ctx, assignmentID, tenantID)
	if err != nil {
		return ports.ErrAssignmentNotFound
	}

	// Verificar permisos
	if assignment.CreatedBy != userID {
		return ports.ErrNotAssignmentOwner
	}

	// Desasociar rúbrica
	assignment.RemoveRubric()

	// Guardar cambios
	if err := s.repo.UpdateAssignment(ctx, assignment); err != nil {
		return ports.ErrAssignmentUpdateFailed
	}

	return nil
}

// ============================================================================
// PEER REVIEW OPERATIONS
// ============================================================================

// AssignPeerReview asigna una peer review
func (s *AssignmentService) AssignPeerReview(
	ctx context.Context,
	tenantID, instructorID uuid.UUID,
	req *domain.CreatePeerReviewRequest,
) (*domain.PeerReviewResponse, error) {
	// Verificar que la submission existe
	submission, err := s.repo.GetSubmission(ctx, req.SubmissionID, tenantID)
	if err != nil {
		return nil, ports.ErrSubmissionNotFound
	}

	// Obtener assignment
	assignment, err := s.repo.GetAssignment(ctx, submission.AssignmentID, tenantID)
	if err != nil {
		return nil, ports.ErrAssignmentNotFound
	}

	// Verificar que peer review está habilitado
	if !assignment.PeerReviewEnabled {
		return nil, domain.ErrPeerReviewsNotEnabled
	}

	// Verificar que el revisor no sea el mismo que el estudiante
	if req.ReviewerID == submission.StudentID {
		return nil, domain.ErrCannotReviewOwnSubmission
	}

	// Verificar que no exista ya una review asignada
	existing, err := s.repo.GetPeerReviewByReviewerAndSubmission(ctx, req.ReviewerID, req.SubmissionID, tenantID)
	if err == nil && existing != nil {
		return nil, domain.ErrPeerReviewAlreadyAssigned
	}

	// Crear peer review
	review := domain.NewPeerReview(
		tenantID,
		assignment.ID,
		req.SubmissionID,
		req.ReviewerID,
		assignment.AnonymousGrading,
		req.DueDate,
	)

	// Validar
	if err := review.Validate(); err != nil {
		return nil, err
	}

	// Guardar
	if err := s.repo.CreatePeerReview(ctx, review); err != nil {
		return nil, ports.ErrPeerReviewCreationFailed
	}

	return &domain.PeerReviewResponse{PeerReview: review}, nil
}

// GetMyPeerReviews obtiene las peer reviews asignadas a un revisor
func (s *AssignmentService) GetMyPeerReviews(
	ctx context.Context,
	reviewerID, tenantID uuid.UUID,
) ([]domain.PeerReviewResponse, error) {
	reviews, err := s.repo.GetPeerReviewsByReviewer(ctx, reviewerID, tenantID)
	if err != nil {
		return nil, err
	}

	responses := make([]domain.PeerReviewResponse, len(reviews))
	for i, r := range reviews {
		responses[i] = domain.PeerReviewResponse{PeerReview: r}
	}

	return responses, nil
}

// GetSubmissionPeerReviews obtiene las peer reviews de una submission
func (s *AssignmentService) GetSubmissionPeerReviews(
	ctx context.Context,
	submissionID, tenantID uuid.UUID,
) ([]domain.PeerReviewResponse, error) {
	reviews, err := s.repo.GetPeerReviewsBySubmission(ctx, submissionID, tenantID)
	if err != nil {
		return nil, err
	}

	responses := make([]domain.PeerReviewResponse, len(reviews))
	for i, r := range reviews {
		responses[i] = domain.PeerReviewResponse{PeerReview: r}
	}

	return responses, nil
}

// SubmitPeerReview envía una peer review
func (s *AssignmentService) SubmitPeerReview(
	ctx context.Context,
	reviewID, reviewerID, tenantID uuid.UUID,
	req *domain.SubmitPeerReviewRequest,
) (*domain.PeerReviewResponse, error) {
	// Obtener peer review
	review, err := s.repo.GetPeerReview(ctx, reviewID, tenantID)
	if err != nil {
		return nil, ports.ErrPeerReviewNotFound
	}

	// Verificar permisos
	if review.ReviewerID != reviewerID {
		return nil, ports.ErrUnauthorized
	}

	// Enviar review
	if err := review.Submit(req.Feedback, req.Scores); err != nil {
		return nil, err
	}

	// Guardar cambios
	if err := s.repo.UpdatePeerReview(ctx, review); err != nil {
		return nil, ports.ErrPeerReviewUpdateFailed
	}

	return &domain.PeerReviewResponse{PeerReview: review}, nil
}

// DeletePeerReview elimina una peer review
func (s *AssignmentService) DeletePeerReview(
	ctx context.Context,
	reviewID, tenantID, userID uuid.UUID,
) error {
	// Obtener peer review
	_, err := s.repo.GetPeerReview(ctx, reviewID, tenantID)
	if err != nil {
		return ports.ErrPeerReviewNotFound
	}

	// Eliminar (solo instructores pueden eliminar)
	if err := s.repo.DeletePeerReview(ctx, reviewID, tenantID); err != nil {
		return ports.ErrPeerReviewDeletionFailed
	}

	return nil
}

// ============================================================================
// STATISTICS OPERATIONS
// ============================================================================

// GetAssignmentStatistics obtiene estadísticas de un assignment
func (s *AssignmentService) GetAssignmentStatistics(
	ctx context.Context,
	assignmentID, tenantID uuid.UUID,
) (*domain.AssignmentStatisticsResponse, error) {
	stats, err := s.repo.GetAssignmentStatistics(ctx, assignmentID, tenantID)
	if err != nil {
		return nil, err
	}

	return stats, nil
}

// GetStudentProgress obtiene el progreso de un estudiante
func (s *AssignmentService) GetStudentProgress(
	ctx context.Context,
	studentID, courseID, tenantID uuid.UUID,
) (*domain.StudentProgressResponse, error) {
	progress, err := s.repo.GetStudentProgress(ctx, studentID, courseID, tenantID)
	if err != nil {
		return nil, err
	}

	return progress, nil
}

// GetCourseStatistics obtiene estadísticas de un curso
func (s *AssignmentService) GetCourseStatistics(
	ctx context.Context,
	courseID, tenantID uuid.UUID,
) (map[string]interface{}, error) {
	stats, err := s.repo.GetCourseStatistics(ctx, courseID, tenantID)
	if err != nil {
		return nil, err
	}

	return stats, nil
}
