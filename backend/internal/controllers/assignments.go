package controllers

import (
	"strconv"

	"github.com/DanielIturra1610/stegmaier-landing/internal/core/assignments/domain"
	"github.com/DanielIturra1610/stegmaier-landing/internal/core/assignments/ports"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// AssignmentController handles assignment-related HTTP requests
type AssignmentController struct {
	assignmentService ports.AssignmentService
}

// NewAssignmentController creates a new AssignmentController
func NewAssignmentController(assignmentService ports.AssignmentService) *AssignmentController {
	return &AssignmentController{
		assignmentService: assignmentService,
	}
}

// ============================================================================
// Assignment CRUD Operations
// ============================================================================

// CreateAssignment creates a new assignment
// POST /api/v1/assignments
func (ctrl *AssignmentController) CreateAssignment(c *fiber.Ctx) error {
	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.CreateAssignmentRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	assignment, err := ctrl.assignmentService.CreateAssignment(c.Context(), tenantID, userID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Assignment created successfully", assignment)
}

// GetAssignment retrieves a single assignment by ID
// GET /api/v1/assignments/:id
func (ctrl *AssignmentController) GetAssignment(c *fiber.Ctx) error {
	// Get assignment ID from params
	assignmentID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid assignment ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	assignment, err := ctrl.assignmentService.GetAssignment(c.Context(), assignmentID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Assignment retrieved successfully", assignment)
}

// GetCourseAssignments retrieves all assignments for a course
// GET /api/v1/courses/:courseId/assignments
func (ctrl *AssignmentController) GetCourseAssignments(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("courseId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Call service
	response, err := ctrl.assignmentService.GetCourseAssignments(c.Context(), courseID, tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course assignments retrieved successfully", response)
}

// GetMyAssignments retrieves all assignments for the current student
// GET /api/v1/assignments/me
func (ctrl *AssignmentController) GetMyAssignments(c *fiber.Ctx) error {
	// Get user ID from context
	studentID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Call service
	response, err := ctrl.assignmentService.GetMyAssignments(c.Context(), studentID, tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Assignments retrieved successfully", response)
}

// UpdateAssignment updates an existing assignment
// PUT /api/v1/assignments/:id
func (ctrl *AssignmentController) UpdateAssignment(c *fiber.Ctx) error {
	// Get assignment ID from params
	assignmentID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid assignment ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.UpdateAssignmentRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	assignment, err := ctrl.assignmentService.UpdateAssignment(c.Context(), assignmentID, tenantID, userID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Assignment updated successfully", assignment)
}

// DeleteAssignment deletes an assignment
// DELETE /api/v1/assignments/:id
func (ctrl *AssignmentController) DeleteAssignment(c *fiber.Ctx) error {
	// Get assignment ID from params
	assignmentID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid assignment ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	if err := ctrl.assignmentService.DeleteAssignment(c.Context(), assignmentID, tenantID, userID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Assignment deleted successfully", nil)
}

// PublishAssignment publishes an assignment
// POST /api/v1/assignments/:id/publish
func (ctrl *AssignmentController) PublishAssignment(c *fiber.Ctx) error {
	// Get assignment ID from params
	assignmentID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid assignment ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	assignment, err := ctrl.assignmentService.PublishAssignment(c.Context(), assignmentID, tenantID, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Assignment published successfully", assignment)
}

// UnpublishAssignment unpublishes an assignment
// POST /api/v1/assignments/:id/unpublish
func (ctrl *AssignmentController) UnpublishAssignment(c *fiber.Ctx) error {
	// Get assignment ID from params
	assignmentID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid assignment ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	assignment, err := ctrl.assignmentService.UnpublishAssignment(c.Context(), assignmentID, tenantID, userID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Assignment unpublished successfully", assignment)
}

// ============================================================================
// Student Submission Operations
// ============================================================================

// GetMySubmission retrieves the current user's submission for an assignment
// GET /api/v1/assignments/:assignmentId/submissions/me
func (ctrl *AssignmentController) GetMySubmission(c *fiber.Ctx) error {
	// Get assignment ID from params
	assignmentID, err := uuid.Parse(c.Params("assignmentId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid assignment ID")
	}

	// Get user ID from context
	studentID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	submission, err := ctrl.assignmentService.GetMySubmission(c.Context(), assignmentID, studentID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Submission retrieved successfully", submission)
}

// GetMySubmissions retrieves all submissions for the current student
// GET /api/v1/submissions/me
func (ctrl *AssignmentController) GetMySubmissions(c *fiber.Ctx) error {
	// Get user ID from context
	studentID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Call service
	response, err := ctrl.assignmentService.GetMySubmissions(c.Context(), studentID, tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Submissions retrieved successfully", response)
}

// CreateSubmission creates a new submission for an assignment
// POST /api/v1/assignments/:assignmentId/submissions
func (ctrl *AssignmentController) CreateSubmission(c *fiber.Ctx) error {
	// Get user ID from context
	studentID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.CreateSubmissionRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	submission, err := ctrl.assignmentService.CreateSubmission(c.Context(), tenantID, studentID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Submission created successfully", submission)
}

// UpdateSubmission updates an existing submission
// PUT /api/v1/submissions/:id
func (ctrl *AssignmentController) UpdateSubmission(c *fiber.Ctx) error {
	// Get submission ID from params
	submissionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid submission ID")
	}

	// Get user ID from context
	studentID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.UpdateSubmissionRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	submission, err := ctrl.assignmentService.UpdateSubmission(c.Context(), submissionID, tenantID, studentID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Submission updated successfully", submission)
}

// SubmitAssignment submits an assignment for grading
// POST /api/v1/submissions/:id/submit
func (ctrl *AssignmentController) SubmitAssignment(c *fiber.Ctx) error {
	// Get submission ID from params
	submissionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid submission ID")
	}

	// Get user ID from context
	studentID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	submission, err := ctrl.assignmentService.SubmitAssignment(c.Context(), submissionID, studentID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Assignment submitted successfully", submission)
}

// ============================================================================
// Instructor Submission Operations
// ============================================================================

// GetSubmission retrieves a single submission by ID (instructor)
// GET /api/v1/submissions/:id
func (ctrl *AssignmentController) GetSubmission(c *fiber.Ctx) error {
	// Get submission ID from params
	submissionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid submission ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	submission, err := ctrl.assignmentService.GetSubmission(c.Context(), submissionID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Submission retrieved successfully", submission)
}

// GetAssignmentSubmissions retrieves all submissions for an assignment (instructor)
// GET /api/v1/assignments/:assignmentId/submissions
func (ctrl *AssignmentController) GetAssignmentSubmissions(c *fiber.Ctx) error {
	// Get assignment ID from params
	assignmentID, err := uuid.Parse(c.Params("assignmentId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid assignment ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Call service
	response, err := ctrl.assignmentService.GetAssignmentSubmissions(c.Context(), assignmentID, tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Assignment submissions retrieved successfully", response)
}

// GetStudentSubmissions retrieves all submissions for a student in a course (instructor)
// GET /api/v1/courses/:courseId/students/:studentId/submissions
func (ctrl *AssignmentController) GetStudentSubmissions(c *fiber.Ctx) error {
	// Get student ID from params
	studentID, err := uuid.Parse(c.Params("studentId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid student ID")
	}

	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("courseId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	response, err := ctrl.assignmentService.GetStudentSubmissions(c.Context(), studentID, courseID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Student submissions retrieved successfully", response)
}

// GradeSubmission grades a student submission (instructor)
// POST /api/v1/submissions/:id/grade
func (ctrl *AssignmentController) GradeSubmission(c *fiber.Ctx) error {
	// Get submission ID from params
	submissionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid submission ID")
	}

	// Get user ID from context
	graderID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.GradeSubmissionRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	submission, err := ctrl.assignmentService.GradeSubmission(c.Context(), submissionID, graderID, tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Submission graded successfully", submission)
}

// BulkGrade grades multiple submissions at once (instructor)
// POST /api/v1/submissions/bulk-grade
func (ctrl *AssignmentController) BulkGrade(c *fiber.Ctx) error {
	// Get user ID from context
	graderID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.BulkGradeRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	submissions, err := ctrl.assignmentService.BulkGrade(c.Context(), tenantID, graderID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Submissions graded successfully", submissions)
}

// ReturnSubmission returns a submission to the student (instructor)
// POST /api/v1/submissions/:id/return
func (ctrl *AssignmentController) ReturnSubmission(c *fiber.Ctx) error {
	// Get submission ID from params
	submissionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid submission ID")
	}

	// Get user ID from context
	instructorID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body for feedback
	var reqBody struct {
		Feedback string `json:"feedback"`
	}
	if err := c.BodyParser(&reqBody); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Call service
	submission, err := ctrl.assignmentService.ReturnSubmission(c.Context(), submissionID, instructorID, tenantID, reqBody.Feedback)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Submission returned successfully", submission)
}

// DeleteSubmission deletes a submission (instructor)
// DELETE /api/v1/submissions/:id
func (ctrl *AssignmentController) DeleteSubmission(c *fiber.Ctx) error {
	// Get submission ID from params
	submissionID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid submission ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	if err := ctrl.assignmentService.DeleteSubmission(c.Context(), submissionID, tenantID, userID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Submission deleted successfully", nil)
}

// ============================================================================
// File Operations
// ============================================================================

// UploadAssignmentFile uploads a file to an assignment
// POST /api/v1/assignments/:assignmentId/files
func (ctrl *AssignmentController) UploadAssignmentFile(c *fiber.Ctx) error {
	// Get assignment ID from params
	assignmentID, err := uuid.Parse(c.Params("assignmentId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid assignment ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Get file from form data
	file, err := c.FormFile("file")
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "File is required")
	}

	// Open file
	fileData, err := file.Open()
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "Failed to read file")
	}
	defer fileData.Close()

	// Read file data
	fileBytes := make([]byte, file.Size)
	if _, err := fileData.Read(fileBytes); err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "Failed to read file data")
	}

	// Get optional fields
	description := c.FormValue("description")
	isTemplate := c.FormValue("is_template") == "true"

	// Generate filename (could use a better strategy)
	filename := uuid.New().String() + "-" + file.Filename

	// Call service
	fileResponse, err := ctrl.assignmentService.UploadAssignmentFile(
		c.Context(),
		assignmentID,
		tenantID,
		userID,
		filename,
		file.Filename,
		file.Header.Get("Content-Type"),
		fileBytes,
		description,
		isTemplate,
	)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "File uploaded successfully", fileResponse)
}

// UploadSubmissionFile uploads a file to a submission
// POST /api/v1/submissions/:submissionId/files
func (ctrl *AssignmentController) UploadSubmissionFile(c *fiber.Ctx) error {
	// Get submission ID from params
	submissionID, err := uuid.Parse(c.Params("submissionId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid submission ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Get file from form data
	file, err := c.FormFile("file")
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "File is required")
	}

	// Open file
	fileData, err := file.Open()
	if err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "Failed to read file")
	}
	defer fileData.Close()

	// Read file data
	fileBytes := make([]byte, file.Size)
	if _, err := fileData.Read(fileBytes); err != nil {
		return ErrorResponse(c, fiber.StatusInternalServerError, "Failed to read file data")
	}

	// Get optional description
	description := c.FormValue("description")

	// Generate filename
	filename := uuid.New().String() + "-" + file.Filename

	// Call service
	fileResponse, err := ctrl.assignmentService.UploadSubmissionFile(
		c.Context(),
		submissionID,
		tenantID,
		userID,
		filename,
		file.Filename,
		file.Header.Get("Content-Type"),
		fileBytes,
		description,
	)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "File uploaded successfully", fileResponse)
}

// GetFile retrieves file metadata
// GET /api/v1/files/:fileId
func (ctrl *AssignmentController) GetFile(c *fiber.Ctx) error {
	// Get file ID from params
	fileID, err := uuid.Parse(c.Params("fileId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid file ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	file, err := ctrl.assignmentService.GetFile(c.Context(), fileID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "File retrieved successfully", file)
}

// DownloadFile downloads a file
// GET /api/v1/files/:fileId/download
func (ctrl *AssignmentController) DownloadFile(c *fiber.Ctx) error {
	// Get file ID from params
	fileID, err := uuid.Parse(c.Params("fileId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid file ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	data, filename, err := ctrl.assignmentService.DownloadFile(c.Context(), fileID, tenantID, userID)
	if err != nil {
		return HandleError(c, err)
	}

	// Set headers
	c.Set("Content-Type", "application/octet-stream")
	c.Set("Content-Disposition", "attachment; filename=\""+filename+"\"")
	c.Set("Content-Length", strconv.Itoa(len(data)))

	return c.Send(data)
}

// DeleteAssignmentFile deletes a file from an assignment
// DELETE /api/v1/assignments/:assignmentId/files/:fileId
func (ctrl *AssignmentController) DeleteAssignmentFile(c *fiber.Ctx) error {
	// Get assignment ID from params
	assignmentID, err := uuid.Parse(c.Params("assignmentId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid assignment ID")
	}

	// Get file ID from params
	fileID, err := uuid.Parse(c.Params("fileId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid file ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	if err := ctrl.assignmentService.DeleteAssignmentFile(c.Context(), assignmentID, fileID, tenantID, userID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "File deleted successfully", nil)
}

// DeleteSubmissionFile deletes a file from a submission
// DELETE /api/v1/submissions/:submissionId/files/:fileId
func (ctrl *AssignmentController) DeleteSubmissionFile(c *fiber.Ctx) error {
	// Get submission ID from params
	submissionID, err := uuid.Parse(c.Params("submissionId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid submission ID")
	}

	// Get file ID from params
	fileID, err := uuid.Parse(c.Params("fileId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid file ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	if err := ctrl.assignmentService.DeleteSubmissionFile(c.Context(), submissionID, fileID, tenantID, userID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "File deleted successfully", nil)
}

// ============================================================================
// Comment Operations
// ============================================================================

// AddComment adds a comment to a submission
// POST /api/v1/submissions/:submissionId/comments
func (ctrl *AssignmentController) AddComment(c *fiber.Ctx) error {
	// Get submission ID from params
	submissionID, err := uuid.Parse(c.Params("submissionId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid submission ID")
	}

	// Get user ID from context
	authorID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Get author role from context (set by middleware)
	authorRole := c.Locals("role").(string)

	// Parse request body
	var req domain.CreateCommentRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	comment, err := ctrl.assignmentService.AddComment(c.Context(), submissionID, authorID, tenantID, &req, authorRole)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Comment added successfully", comment)
}

// GetSubmissionComments retrieves all comments for a submission
// GET /api/v1/submissions/:submissionId/comments
func (ctrl *AssignmentController) GetSubmissionComments(c *fiber.Ctx) error {
	// Get submission ID from params
	submissionID, err := uuid.Parse(c.Params("submissionId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid submission ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Check if user is instructor (from context/role)
	role := c.Locals("role").(string)
	isInstructor := role == "instructor" || role == "admin"

	// Call service
	comments, err := ctrl.assignmentService.GetSubmissionComments(c.Context(), submissionID, tenantID, userID, isInstructor)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Comments retrieved successfully", comments)
}

// UpdateComment updates a comment
// PUT /api/v1/comments/:commentId
func (ctrl *AssignmentController) UpdateComment(c *fiber.Ctx) error {
	// Get comment ID from params
	commentID, err := uuid.Parse(c.Params("commentId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid comment ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var reqBody struct {
		Content string `json:"content"`
	}
	if err := c.BodyParser(&reqBody); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if reqBody.Content == "" {
		return ErrorResponse(c, fiber.StatusBadRequest, "Content is required")
	}

	// Call service
	comment, err := ctrl.assignmentService.UpdateComment(c.Context(), commentID, userID, tenantID, reqBody.Content)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Comment updated successfully", comment)
}

// DeleteComment deletes a comment
// DELETE /api/v1/comments/:commentId
func (ctrl *AssignmentController) DeleteComment(c *fiber.Ctx) error {
	// Get comment ID from params
	commentID, err := uuid.Parse(c.Params("commentId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid comment ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	if err := ctrl.assignmentService.DeleteComment(c.Context(), commentID, userID, tenantID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Comment deleted successfully", nil)
}

// ============================================================================
// Rubric Operations
// ============================================================================

// CreateRubric creates a new rubric
// POST /api/v1/rubrics
func (ctrl *AssignmentController) CreateRubric(c *fiber.Ctx) error {
	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.CreateRubricRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	rubric, err := ctrl.assignmentService.CreateRubric(c.Context(), tenantID, userID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Rubric created successfully", rubric)
}

// GetRubric retrieves a single rubric by ID
// GET /api/v1/rubrics/:id
func (ctrl *AssignmentController) GetRubric(c *fiber.Ctx) error {
	// Get rubric ID from params
	rubricID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid rubric ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	rubric, err := ctrl.assignmentService.GetRubric(c.Context(), rubricID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Rubric retrieved successfully", rubric)
}

// GetTenantRubrics retrieves all rubrics for the tenant
// GET /api/v1/rubrics
func (ctrl *AssignmentController) GetTenantRubrics(c *fiber.Ctx) error {
	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("pageSize", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Call service
	response, err := ctrl.assignmentService.GetTenantRubrics(c.Context(), tenantID, page, pageSize)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Rubrics retrieved successfully", response)
}

// GetRubricTemplates retrieves all rubric templates
// GET /api/v1/rubrics/templates
func (ctrl *AssignmentController) GetRubricTemplates(c *fiber.Ctx) error {
	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	response, err := ctrl.assignmentService.GetRubricTemplates(c.Context(), tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Rubric templates retrieved successfully", response)
}

// UpdateRubric updates an existing rubric
// PUT /api/v1/rubrics/:id
func (ctrl *AssignmentController) UpdateRubric(c *fiber.Ctx) error {
	// Get rubric ID from params
	rubricID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid rubric ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.UpdateRubricRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	rubric, err := ctrl.assignmentService.UpdateRubric(c.Context(), rubricID, tenantID, userID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Rubric updated successfully", rubric)
}

// DeleteRubric deletes a rubric
// DELETE /api/v1/rubrics/:id
func (ctrl *AssignmentController) DeleteRubric(c *fiber.Ctx) error {
	// Get rubric ID from params
	rubricID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid rubric ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	if err := ctrl.assignmentService.DeleteRubric(c.Context(), rubricID, tenantID, userID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Rubric deleted successfully", nil)
}

// AttachRubricToAssignment attaches a rubric to an assignment
// POST /api/v1/assignments/:assignmentId/rubric/:rubricId
func (ctrl *AssignmentController) AttachRubricToAssignment(c *fiber.Ctx) error {
	// Get assignment ID from params
	assignmentID, err := uuid.Parse(c.Params("assignmentId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid assignment ID")
	}

	// Get rubric ID from params
	rubricID, err := uuid.Parse(c.Params("rubricId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid rubric ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	if err := ctrl.assignmentService.AttachRubricToAssignment(c.Context(), assignmentID, rubricID, tenantID, userID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Rubric attached to assignment successfully", nil)
}

// DetachRubricFromAssignment detaches a rubric from an assignment
// DELETE /api/v1/assignments/:assignmentId/rubric
func (ctrl *AssignmentController) DetachRubricFromAssignment(c *fiber.Ctx) error {
	// Get assignment ID from params
	assignmentID, err := uuid.Parse(c.Params("assignmentId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid assignment ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	if err := ctrl.assignmentService.DetachRubricFromAssignment(c.Context(), assignmentID, tenantID, userID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Rubric detached from assignment successfully", nil)
}

// ============================================================================
// Peer Review Operations
// ============================================================================

// AssignPeerReview assigns a peer review
// POST /api/v1/peer-reviews
func (ctrl *AssignmentController) AssignPeerReview(c *fiber.Ctx) error {
	// Get user ID from context (instructor)
	instructorID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.CreatePeerReviewRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	peerReview, err := ctrl.assignmentService.AssignPeerReview(c.Context(), tenantID, instructorID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusCreated, "Peer review assigned successfully", peerReview)
}

// GetMyPeerReviews retrieves all peer reviews assigned to the current user
// GET /api/v1/peer-reviews/me
func (ctrl *AssignmentController) GetMyPeerReviews(c *fiber.Ctx) error {
	// Get user ID from context
	reviewerID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	peerReviews, err := ctrl.assignmentService.GetMyPeerReviews(c.Context(), reviewerID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Peer reviews retrieved successfully", peerReviews)
}

// GetSubmissionPeerReviews retrieves all peer reviews for a submission
// GET /api/v1/submissions/:submissionId/peer-reviews
func (ctrl *AssignmentController) GetSubmissionPeerReviews(c *fiber.Ctx) error {
	// Get submission ID from params
	submissionID, err := uuid.Parse(c.Params("submissionId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid submission ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	peerReviews, err := ctrl.assignmentService.GetSubmissionPeerReviews(c.Context(), submissionID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Submission peer reviews retrieved successfully", peerReviews)
}

// SubmitPeerReview submits a peer review
// POST /api/v1/peer-reviews/:reviewId/submit
func (ctrl *AssignmentController) SubmitPeerReview(c *fiber.Ctx) error {
	// Get review ID from params
	reviewID, err := uuid.Parse(c.Params("reviewId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid review ID")
	}

	// Get user ID from context
	reviewerID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Parse request body
	var req domain.SubmitPeerReviewRequest
	if err := c.BodyParser(&req); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
	}

	// Validate request
	if err := req.Validate(); err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, err.Error())
	}

	// Call service
	peerReview, err := ctrl.assignmentService.SubmitPeerReview(c.Context(), reviewID, reviewerID, tenantID, &req)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Peer review submitted successfully", peerReview)
}

// DeletePeerReview deletes a peer review
// DELETE /api/v1/peer-reviews/:reviewId
func (ctrl *AssignmentController) DeletePeerReview(c *fiber.Ctx) error {
	// Get review ID from params
	reviewID, err := uuid.Parse(c.Params("reviewId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid review ID")
	}

	// Get user ID from context
	userID, err := uuid.Parse(c.Locals("userID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid user ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	if err := ctrl.assignmentService.DeletePeerReview(c.Context(), reviewID, tenantID, userID); err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Peer review deleted successfully", nil)
}

// ============================================================================
// Statistics Operations
// ============================================================================

// GetAssignmentStatistics retrieves statistics for an assignment
// GET /api/v1/assignments/:assignmentId/statistics
func (ctrl *AssignmentController) GetAssignmentStatistics(c *fiber.Ctx) error {
	// Get assignment ID from params
	assignmentID, err := uuid.Parse(c.Params("assignmentId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid assignment ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	stats, err := ctrl.assignmentService.GetAssignmentStatistics(c.Context(), assignmentID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Assignment statistics retrieved successfully", stats)
}

// GetStudentProgress retrieves a student's progress in a course
// GET /api/v1/courses/:courseId/students/:studentId/progress
func (ctrl *AssignmentController) GetStudentProgress(c *fiber.Ctx) error {
	// Get student ID from params
	studentID, err := uuid.Parse(c.Params("studentId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid student ID")
	}

	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("courseId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	progress, err := ctrl.assignmentService.GetStudentProgress(c.Context(), studentID, courseID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Student progress retrieved successfully", progress)
}

// GetCourseStatistics retrieves statistics for a course
// GET /api/v1/courses/:courseId/statistics
func (ctrl *AssignmentController) GetCourseStatistics(c *fiber.Ctx) error {
	// Get course ID from params
	courseID, err := uuid.Parse(c.Params("courseId"))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid course ID")
	}

	// Get tenant ID from context
	tenantID, err := uuid.Parse(c.Locals("tenantID").(string))
	if err != nil {
		return ErrorResponse(c, fiber.StatusBadRequest, "Invalid tenant ID")
	}

	// Call service
	stats, err := ctrl.assignmentService.GetCourseStatistics(c.Context(), courseID, tenantID)
	if err != nil {
		return HandleError(c, err)
	}

	return SuccessResponse(c, fiber.StatusOK, "Course statistics retrieved successfully", stats)
}
