"""
DTOs para el sistema de assignments.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class AssignmentTypeEnum(str, Enum):
    """Tipos de assignments disponibles."""
    ESSAY = "essay"
    FILE_UPLOAD = "file_upload"
    PROJECT = "project"
    PRESENTATION = "presentation"
    RESEARCH = "research"
    PRACTICAL = "practical"
    PORTFOLIO = "portfolio"


class SubmissionStatusEnum(str, Enum):
    """Estados de la entrega del assignment."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    GRADED = "graded"
    RETURNED = "returned"
    LATE_SUBMISSION = "late_submission"
    MISSING = "missing"


class GradeStatusEnum(str, Enum):
    """Estados de la calificación."""
    NOT_GRADED = "not_graded"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    NEEDS_REVISION = "needs_revision"


class FileTypeEnum(str, Enum):
    """Tipos de archivos permitidos."""
    DOCUMENT = "document"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    PRESENTATION = "presentation"
    SPREADSHEET = "spreadsheet"
    ARCHIVE = "archive"
    CODE = "code"


# DTOs para AssignmentFile
class AssignmentFileCreate(BaseModel):
    """DTO para crear archivo de assignment."""
    filename: str = Field(..., min_length=1, max_length=255)
    original_filename: str = Field(..., min_length=1, max_length=255)
    file_type: FileTypeEnum
    file_size: int = Field(..., ge=1)
    mime_type: str = Field(..., min_length=1, max_length=100)
    file_path: str = Field(..., min_length=1)
    is_template: bool = False
    description: Optional[str] = Field(None, max_length=500)


class AssignmentFileResponse(BaseModel):
    """DTO para respuesta de archivo de assignment."""
    id: str
    filename: str
    original_filename: str
    file_type: FileTypeEnum
    file_size: int
    mime_type: str
    file_path: str
    uploaded_at: datetime
    uploaded_by: str
    is_template: bool
    description: Optional[str] = None


# DTOs para Rubric
class RubricCriterionCreate(BaseModel):
    """DTO para crear criterio de rúbrica."""
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=1000)
    max_points: float = Field(10.0, ge=0, le=100)
    weight: float = Field(1.0, ge=0, le=10)
    levels: List[Dict[str, Any]] = []


class RubricCriterionResponse(BaseModel):
    """DTO para respuesta de criterio de rúbrica."""
    id: str
    name: str
    description: str
    max_points: float
    weight: float
    levels: List[Dict[str, Any]]


class RubricCreate(BaseModel):
    """DTO para crear rúbrica."""
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field("", max_length=1000)
    criteria: List[RubricCriterionCreate] = []
    is_template: bool = False


class RubricUpdate(BaseModel):
    """DTO para actualizar rúbrica."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    criteria: Optional[List[RubricCriterionCreate]] = None
    is_template: Optional[bool] = None


class RubricResponse(BaseModel):
    """DTO para respuesta de rúbrica."""
    id: str
    name: str
    description: str
    criteria: List[RubricCriterionResponse]
    total_points: float
    created_by: str
    created_at: datetime
    is_template: bool


class RubricListResponse(BaseModel):
    """DTO para lista de rúbricas."""
    id: str
    name: str
    description: str
    total_points: float
    criteria_count: int
    created_by: str
    created_at: datetime
    is_template: bool


# DTOs para Assignment
class AssignmentCreate(BaseModel):
    """DTO para crear assignment."""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field("", max_length=3000)
    instructions: str = Field("", max_length=5000)
    assignment_type: AssignmentTypeEnum
    course_id: str = Field(..., min_length=1)
    module_id: Optional[str] = None
    lesson_id: Optional[str] = None
    
    # Configuración de entrega
    max_file_size: int = Field(50 * 1024 * 1024, ge=1024)  # 50MB por defecto
    allowed_file_types: List[str] = []
    max_files: int = Field(5, ge=1, le=20)
    allow_multiple_submissions: bool = True
    
    # Fechas
    available_from: Optional[datetime] = None
    due_date: Optional[datetime] = None
    late_penalty_per_day: float = Field(0.1, ge=0, le=1)
    accept_late_submissions: bool = True
    
    # Evaluación
    rubric_id: Optional[str] = None
    max_points: float = Field(100.0, ge=1, le=1000)
    passing_score: float = Field(70.0, ge=0, le=100)
    
    # Configuración avanzada
    peer_review_enabled: bool = False
    peer_reviews_required: int = Field(0, ge=0, le=5)
    anonymous_grading: bool = False
    plagiarism_check_enabled: bool = False
    
    estimated_duration: int = Field(0, ge=0, le=168)  # horas


class AssignmentUpdate(BaseModel):
    """DTO para actualizar assignment."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=3000)
    instructions: Optional[str] = Field(None, max_length=5000)
    max_file_size: Optional[int] = Field(None, ge=1024)
    allowed_file_types: Optional[List[str]] = None
    max_files: Optional[int] = Field(None, ge=1, le=20)
    allow_multiple_submissions: Optional[bool] = None
    available_from: Optional[datetime] = None
    due_date: Optional[datetime] = None
    late_penalty_per_day: Optional[float] = Field(None, ge=0, le=1)
    accept_late_submissions: Optional[bool] = None
    rubric_id: Optional[str] = None
    max_points: Optional[float] = Field(None, ge=1, le=1000)
    passing_score: Optional[float] = Field(None, ge=0, le=100)
    peer_review_enabled: Optional[bool] = None
    peer_reviews_required: Optional[int] = Field(None, ge=0, le=5)
    anonymous_grading: Optional[bool] = None
    plagiarism_check_enabled: Optional[bool] = None
    estimated_duration: Optional[int] = Field(None, ge=0, le=168)
    is_published: Optional[bool] = None


class AssignmentListResponse(BaseModel):
    """DTO para lista de assignments."""
    id: str
    title: str
    description: str
    assignment_type: AssignmentTypeEnum
    course_id: str
    module_id: Optional[str] = None
    lesson_id: Optional[str] = None
    max_points: float
    due_date: Optional[datetime] = None
    is_published: bool
    total_submissions: int
    graded_submissions: int
    average_grade: float
    created_at: datetime
    created_by: str
    is_available: bool = False
    is_overdue: bool = False
    days_until_due: Optional[int] = None


class AssignmentResponse(BaseModel):
    """DTO para respuesta completa de assignment."""
    id: str
    title: str
    description: str
    instructions: str
    assignment_type: AssignmentTypeEnum
    course_id: str
    module_id: Optional[str] = None
    lesson_id: Optional[str] = None
    
    # Archivos
    attachments: List[AssignmentFileResponse] = []
    template_files: List[AssignmentFileResponse] = []
    
    # Configuración
    max_file_size: int
    allowed_file_types: List[str]
    max_files: int
    allow_multiple_submissions: bool
    
    # Fechas
    available_from: Optional[datetime] = None
    due_date: Optional[datetime] = None
    late_penalty_per_day: float
    accept_late_submissions: bool
    
    # Evaluación
    rubric: Optional[RubricResponse] = None
    max_points: float
    passing_score: float
    
    # Configuración avanzada
    peer_review_enabled: bool
    peer_reviews_required: int
    anonymous_grading: bool
    plagiarism_check_enabled: bool
    
    # Estado
    is_published: bool
    estimated_duration: int
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    created_by: str
    
    # Estadísticas
    total_submissions: int
    graded_submissions: int
    average_grade: float
    on_time_submissions: int
    late_submissions: int
    
    # Estado actual
    is_available: bool = False
    is_overdue: bool = False
    days_until_due: Optional[int] = None


# DTOs para AssignmentSubmission
class SubmissionCommentCreate(BaseModel):
    """DTO para crear comentario en entrega."""
    content: str = Field(..., min_length=1, max_length=2000)
    is_private: bool = False


class SubmissionCommentResponse(BaseModel):
    """DTO para respuesta de comentario."""
    id: str
    content: str
    author_id: str
    author_name: Optional[str] = None
    author_role: str
    is_private: bool
    created_at: datetime
    updated_at: Optional[datetime] = None


class SubmissionGradeCreate(BaseModel):
    """DTO para crear calificación."""
    criterion_id: Optional[str] = None
    points_earned: float = Field(..., ge=0)
    points_possible: float = Field(..., ge=0)
    feedback: str = Field("", max_length=2000)


class SubmissionGradeResponse(BaseModel):
    """DTO para respuesta de calificación."""
    criterion_id: Optional[str] = None
    criterion_name: Optional[str] = None
    points_earned: float
    points_possible: float
    feedback: str
    grader_id: str
    grader_name: Optional[str] = None
    graded_at: datetime


class AssignmentSubmissionCreate(BaseModel):
    """DTO para crear entrega de assignment."""
    assignment_id: str = Field(..., min_length=1)
    text_content: str = Field("", max_length=10000)
    is_final: bool = False


class AssignmentSubmissionUpdate(BaseModel):
    """DTO para actualizar entrega."""
    text_content: Optional[str] = Field(None, max_length=10000)
    is_final: Optional[bool] = None
    status: Optional[SubmissionStatusEnum] = None


class AssignmentSubmissionResponse(BaseModel):
    """DTO para respuesta de entrega."""
    id: str
    assignment_id: str
    assignment_title: str
    student_id: str
    student_name: Optional[str] = None
    
    # Contenido
    text_content: str
    files: List[AssignmentFileResponse] = []
    
    # Estado
    status: SubmissionStatusEnum
    submission_number: int
    is_final: bool
    
    # Fechas
    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    last_modified_at: datetime
    
    # Calificación
    grade_status: GradeStatusEnum
    grades: List[SubmissionGradeResponse] = []
    total_points_earned: float
    total_points_possible: float
    percentage_grade: float
    letter_grade: Optional[str] = None
    is_passing: bool
    
    # Late penalty
    is_late: bool
    days_late: int
    penalty_applied: float
    
    # Feedback
    instructor_feedback: str
    comments: List[SubmissionCommentResponse] = []
    
    # Metadata
    plagiarism_score: Optional[float] = None
    similarity_report: Optional[str] = None


class AssignmentSubmissionListResponse(BaseModel):
    """DTO para lista de entregas."""
    id: str
    assignment_id: str
    assignment_title: str
    student_id: str
    student_name: Optional[str] = None
    status: SubmissionStatusEnum
    grade_status: GradeStatusEnum
    submission_number: int
    percentage_grade: float
    is_passing: bool
    is_late: bool
    submitted_at: Optional[datetime] = None
    last_modified_at: datetime


# DTOs para grading
class BulkGradeCreate(BaseModel):
    """DTO para calificación en lote."""
    submission_ids: List[str] = Field(..., min_items=1)
    grades: List[SubmissionGradeCreate] = Field(..., min_items=1)
    feedback: str = Field("", max_length=2000)


class GradingQueueResponse(BaseModel):
    """DTO para cola de calificaciones."""
    assignment_id: str
    assignment_title: str
    course_id: str
    course_title: str
    pending_submissions: int
    total_submissions: int
    due_date: Optional[datetime] = None
    average_grade: float
    grading_progress: float  # Porcentaje


# DTOs para PeerReview
class PeerReviewCreate(BaseModel):
    """DTO para crear revisión por pares."""
    submission_id: str = Field(..., min_length=1)
    feedback: str = Field(..., min_length=10, max_length=3000)
    scores: Dict[str, float] = {}
    overall_score: float = Field(..., ge=0, le=100)


class PeerReviewUpdate(BaseModel):
    """DTO para actualizar revisión por pares."""
    feedback: Optional[str] = Field(None, min_length=10, max_length=3000)
    scores: Optional[Dict[str, float]] = None
    overall_score: Optional[float] = Field(None, ge=0, le=100)
    is_completed: Optional[bool] = None


class PeerReviewResponse(BaseModel):
    """DTO para respuesta de revisión por pares."""
    id: str
    assignment_id: str
    submission_id: str
    reviewer_id: str
    reviewer_name: Optional[str] = None
    feedback: str
    scores: Dict[str, float]
    overall_score: float
    is_completed: bool
    is_anonymous: bool
    assigned_at: datetime
    submitted_at: Optional[datetime] = None
    due_date: Optional[datetime] = None


# DTOs para estadísticas
class AssignmentStatistics(BaseModel):
    """DTO para estadísticas de assignment."""
    assignment_id: str
    assignment_title: str
    total_students: int
    total_submissions: int
    graded_submissions: int
    average_grade: float
    median_grade: float
    pass_rate: float
    on_time_rate: float
    grade_distribution: Dict[str, int] = {}
    submission_timeline: List[Dict[str, Any]] = []


class StudentAssignmentProgress(BaseModel):
    """DTO para progreso del estudiante en assignments."""
    student_id: str
    course_id: str
    assignments_available: int
    assignments_submitted: int
    assignments_graded: int
    assignments_passed: int
    average_grade: float
    total_late_submissions: int
    pending_assignments: List[str] = []
