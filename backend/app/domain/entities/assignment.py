"""
Entidades de dominio para el sistema de assignments (tareas).
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from uuid import uuid4


class AssignmentType(str, Enum):
    """Tipos de assignments disponibles."""
    ESSAY = "essay"
    FILE_UPLOAD = "file_upload"
    PROJECT = "project"
    PRESENTATION = "presentation"
    RESEARCH = "research"
    PRACTICAL = "practical"
    PORTFOLIO = "portfolio"


class SubmissionStatus(str, Enum):
    """Estados de la entrega del assignment."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    GRADED = "graded"
    RETURNED = "returned"
    LATE_SUBMISSION = "late_submission"
    MISSING = "missing"


class GradeStatus(str, Enum):
    """Estados de la calificación."""
    NOT_GRADED = "not_graded"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    NEEDS_REVISION = "needs_revision"


class FileType(str, Enum):
    """Tipos de archivos permitidos."""
    DOCUMENT = "document"  # pdf, doc, docx, txt
    IMAGE = "image"  # jpg, png, gif, webp
    VIDEO = "video"  # mp4, avi, mov
    AUDIO = "audio"  # mp3, wav, m4a
    PRESENTATION = "presentation"  # ppt, pptx
    SPREADSHEET = "spreadsheet"  # xls, xlsx
    ARCHIVE = "archive"  # zip, rar, 7z
    CODE = "code"  # py, js, html, css


@dataclass
class AssignmentFile:
    """Archivo adjunto al assignment."""
    id: str = field(default_factory=lambda: str(uuid4()))
    filename: str = ""
    original_filename: str = ""
    file_type: FileType = FileType.DOCUMENT
    file_size: int = 0  # bytes
    mime_type: str = ""
    file_path: str = ""
    uploaded_at: datetime = field(default_factory=datetime.utcnow)
    uploaded_by: str = ""  # user_id
    is_template: bool = False  # Si es un archivo template del instructor
    description: Optional[str] = None


@dataclass
class RubricCriterion:
    """Criterio individual del rubric."""
    id: str = field(default_factory=lambda: str(uuid4()))
    name: str = ""
    description: str = ""
    max_points: float = 10.0
    weight: float = 1.0  # Peso relativo del criterio
    
    # Niveles de desempeño
    levels: List[Dict[str, Any]] = field(default_factory=list)
    # Ejemplo: [{"name": "Excelente", "points": 10, "description": "..."}, ...]


@dataclass
class Rubric:
    """Rúbrica de evaluación para assignments."""
    id: str = field(default_factory=lambda: str(uuid4()))
    name: str = ""
    description: str = ""
    criteria: List[RubricCriterion] = field(default_factory=list)
    total_points: float = 0.0
    created_by: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)
    is_template: bool = False  # Si es un template reutilizable

    def calculate_total_points(self) -> float:
        """Calcula el total de puntos de la rúbrica."""
        self.total_points = sum(criterion.max_points * criterion.weight for criterion in self.criteria)
        return self.total_points


@dataclass
class Assignment:
    """Entidad principal para assignments."""
    id: str = field(default_factory=lambda: str(uuid4()))
    title: str = ""
    description: str = ""
    instructions: str = ""
    
    # Tipo y configuración
    assignment_type: AssignmentType = AssignmentType.ESSAY
    
    # Relaciones
    course_id: str = ""
    module_id: Optional[str] = None
    lesson_id: Optional[str] = None
    
    # Archivos y recursos
    attachments: List[AssignmentFile] = field(default_factory=list)
    template_files: List[AssignmentFile] = field(default_factory=list)
    
    # Configuración de entrega
    max_file_size: int = 50 * 1024 * 1024  # 50MB por defecto
    allowed_file_types: List[str] = field(default_factory=list)
    max_files: int = 5
    allow_multiple_submissions: bool = True
    
    # Fechas importantes
    available_from: Optional[datetime] = None
    due_date: Optional[datetime] = None
    late_penalty_per_day: float = 0.1  # 10% por día de retraso
    accept_late_submissions: bool = True
    
    # Evaluación
    rubric: Optional[Rubric] = None
    max_points: float = 100.0
    passing_score: float = 70.0
    
    # Configuración avanzada
    peer_review_enabled: bool = False
    peer_reviews_required: int = 0
    anonymous_grading: bool = False
    plagiarism_check_enabled: bool = False
    
    # Estado y metadata
    is_published: bool = False
    estimated_duration: int = 0  # horas estimadas
    
    # Timestamps
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    published_at: Optional[datetime] = None
    
    # Autor
    created_by: str = ""  # user_id del instructor
    
    # Estadísticas
    total_submissions: int = 0
    graded_submissions: int = 0
    average_grade: float = 0.0
    on_time_submissions: int = 0
    late_submissions: int = 0

    def is_available_now(self) -> bool:
        """Verifica si el assignment está disponible."""
        if not self.is_published:
            return False
        
        now = datetime.utcnow()
        
        if self.available_from and now < self.available_from:
            return False
        
        return True

    def is_overdue(self) -> bool:
        """Verifica si el assignment está vencido."""
        if not self.due_date:
            return False
        
        return datetime.utcnow() > self.due_date

    def days_overdue(self) -> int:
        """Calcula los días de retraso."""
        if not self.is_overdue():
            return 0
        
        delta = datetime.utcnow() - self.due_date
        return delta.days


@dataclass
class SubmissionComment:
    """Comentario en una entrega."""
    id: str = field(default_factory=lambda: str(uuid4()))
    content: str = ""
    author_id: str = ""  # user_id del comentarista
    author_role: str = ""  # instructor, student, peer
    is_private: bool = False  # Solo visible para instructor y estudiante
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None


@dataclass
class SubmissionGrade:
    """Calificación de una entrega."""
    criterion_id: Optional[str] = None  # Si usa rubric
    points_earned: float = 0.0
    points_possible: float = 0.0
    feedback: str = ""
    grader_id: str = ""
    graded_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class AssignmentSubmission:
    """Entrega de assignment por parte de un estudiante."""
    id: str = field(default_factory=lambda: str(uuid4()))
    assignment_id: str = ""
    student_id: str = ""  # user_id del estudiante
    
    # Contenido de la entrega
    text_content: str = ""  # Para essays y respuestas de texto
    files: List[AssignmentFile] = field(default_factory=list)
    
    # Estado
    status: SubmissionStatus = SubmissionStatus.NOT_STARTED
    submission_number: int = 1  # Para múltiples entregas
    is_final: bool = True
    
    # Fechas
    started_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    last_modified_at: datetime = field(default_factory=datetime.utcnow)
    
    # Calificación
    grade_status: GradeStatus = GradeStatus.NOT_GRADED
    grades: List[SubmissionGrade] = field(default_factory=list)
    total_points_earned: float = 0.0
    total_points_possible: float = 0.0
    percentage_grade: float = 0.0
    letter_grade: Optional[str] = None
    is_passing: bool = False
    
    # Late penalty
    is_late: bool = False
    days_late: int = 0
    penalty_applied: float = 0.0  # Porcentaje de penalización aplicada
    
    # Feedback
    instructor_feedback: str = ""
    comments: List[SubmissionComment] = field(default_factory=list)
    
    # Metadata
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    plagiarism_score: Optional[float] = None
    similarity_report: Optional[str] = None
    
    # Peer review (si está habilitado)
    peer_reviews_received: List[str] = field(default_factory=list)  # submission_ids
    peer_reviews_given: List[str] = field(default_factory=list)  # submission_ids

    def calculate_final_grade(self, assignment: Assignment) -> float:
        """Calcula la calificación final con penalizaciones."""
        if not self.grades:
            return 0.0
        
        # Suma total de puntos
        self.total_points_earned = sum(grade.points_earned for grade in self.grades)
        self.total_points_possible = assignment.max_points
        
        if self.total_points_possible > 0:
            base_percentage = (self.total_points_earned / self.total_points_possible) * 100
        else:
            base_percentage = 0.0
        
        # Aplicar penalización por entrega tardía
        if self.is_late and assignment.late_penalty_per_day > 0:
            penalty = min(assignment.late_penalty_per_day * self.days_late, 1.0)
            self.penalty_applied = penalty * 100
            final_percentage = base_percentage * (1 - penalty)
        else:
            final_percentage = base_percentage
        
        self.percentage_grade = max(0.0, final_percentage)
        self.is_passing = self.percentage_grade >= assignment.passing_score
        
        return self.percentage_grade

    def add_comment(self, content: str, author_id: str, author_role: str, is_private: bool = False):
        """Agrega un comentario a la entrega."""
        comment = SubmissionComment(
            content=content,
            author_id=author_id,
            author_role=author_role,
            is_private=is_private
        )
        self.comments.append(comment)
        return comment


@dataclass
class PeerReview:
    """Revisión por pares de assignments."""
    id: str = field(default_factory=lambda: str(uuid4()))
    assignment_id: str = ""
    submission_id: str = ""  # La entrega que se está revisando
    reviewer_id: str = ""  # user_id del revisor (estudiante)
    
    # Contenido de la revisión
    feedback: str = ""
    scores: Dict[str, float] = field(default_factory=dict)  # criterion_id: score
    overall_score: float = 0.0
    
    # Estado
    is_completed: bool = False
    is_anonymous: bool = True
    
    # Timestamps
    assigned_at: datetime = field(default_factory=datetime.utcnow)
    submitted_at: Optional[datetime] = None
    due_date: Optional[datetime] = None

    def calculate_overall_score(self) -> float:
        """Calcula el puntaje general de la revisión."""
        if not self.scores:
            return 0.0
        
        self.overall_score = sum(self.scores.values()) / len(self.scores)
        return self.overall_score
