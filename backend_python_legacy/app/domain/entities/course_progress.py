"""
Entidades para tracking de progreso de cursos y lecciones
"""
from datetime import datetime
from typing import Optional, List
from dataclasses import dataclass, field
from enum import Enum

class ProgressStatus(Enum):
    """Estados de progreso"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"  
    COMPLETED = "completed"
    PAUSED = "paused"

@dataclass
class LessonProgress:
    """
    Entidad para tracking de progreso de lecciones individuales
    """
    id: Optional[str] = None
    user_id: str = ""
    lesson_id: str = ""
    course_id: str = ""
    enrollment_id: str = ""
    
    # Status tracking
    status: ProgressStatus = ProgressStatus.NOT_STARTED
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    last_accessed_at: Optional[datetime] = None
    
    # Progress details
    progress_percentage: float = 0.0  # 0.0 to 100.0
    time_spent: int = 0  # seconds
    
    # Content specific (para diferentes tipos de contenido)
    content_type: str = "video"  # video, text, quiz, interactive
    video_position: Optional[int] = None  # seconds for video lessons
    video_duration: Optional[int] = None  # seconds
    quiz_score: Optional[float] = None  # 0.0 to 100.0 for quiz lessons
    quiz_attempts: int = 0
    
    # Metadata
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.updated_at is None:
            self.updated_at = datetime.utcnow()
    
    def mark_started(self):
        """Marcar lección como iniciada"""
        if self.status == ProgressStatus.NOT_STARTED:
            self.status = ProgressStatus.IN_PROGRESS
            self.started_at = datetime.utcnow()
        self.last_accessed_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
    
    def mark_completed(self):
        """Marcar lección como completada"""
        self.status = ProgressStatus.COMPLETED
        self.progress_percentage = 100.0
        self.completed_at = datetime.utcnow()
        self.last_accessed_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
    
    def update_progress(self, percentage: float, time_spent_delta: int = 0):
        """Actualizar progreso de la lección"""
        self.progress_percentage = min(100.0, max(0.0, percentage))
        self.time_spent += time_spent_delta
        self.last_accessed_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        
        if self.status == ProgressStatus.NOT_STARTED:
            self.mark_started()
        
        if percentage >= 100.0:
            self.mark_completed()

@dataclass  
class CourseProgress:
    """
    Entidad para tracking de progreso de cursos completos
    """
    id: Optional[str] = None
    user_id: str = ""
    course_id: str = ""
    enrollment_id: str = ""
    
    # Progress summary
    progress_percentage: float = 0.0  # 0.0 to 100.0
    status: ProgressStatus = ProgressStatus.NOT_STARTED
    
    # Lesson tracking
    lessons_completed: int = 0
    total_lessons: int = 0
    lessons_in_progress: int = 0
    
    # Time tracking  
    total_time_spent: int = 0  # seconds
    estimated_remaining_time: Optional[int] = None  # seconds
    
    # Dates
    started_at: Optional[datetime] = None
    last_accessed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    target_completion_date: Optional[datetime] = None
    
    # Achievements
    certificate_issued: bool = False
    certificate_issued_at: Optional[datetime] = None
    certificate_url: Optional[str] = None
    
    # Stats
    average_lesson_score: Optional[float] = None  # Para cursos con quizzes
    streak_days: int = 0  # Días consecutivos de actividad
    
    # Metadata
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Lessons progress list (se carga por separado)
    lessons_progress: List[LessonProgress] = field(default_factory=list)
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.updated_at is None:
            self.updated_at = datetime.utcnow()
    
    def calculate_progress(self) -> float:
        """Calcular progreso basado en lecciones completadas"""
        if self.total_lessons == 0:
            return 0.0
        return (self.lessons_completed / self.total_lessons) * 100.0
    
    def update_from_lessons(self, lessons_progress: List[LessonProgress]):
        """Actualizar progreso del curso basado en progreso de lecciones"""
        self.lessons_progress = lessons_progress
        self.total_lessons = len(lessons_progress)
        
        # Contar lecciones por status
        completed = sum(1 for lp in lessons_progress if lp.status == ProgressStatus.COMPLETED)
        in_progress = sum(1 for lp in lessons_progress if lp.status == ProgressStatus.IN_PROGRESS)
        
        self.lessons_completed = completed
        self.lessons_in_progress = in_progress
        
        # Calcular progreso
        self.progress_percentage = self.calculate_progress()
        
        # Calcular tiempo total
        self.total_time_spent = sum(lp.time_spent for lp in lessons_progress)
        
        # Actualizar status del curso
        if completed == 0 and in_progress == 0:
            self.status = ProgressStatus.NOT_STARTED
        elif completed == self.total_lessons:
            self.status = ProgressStatus.COMPLETED
            if not self.completed_at:
                self.completed_at = datetime.utcnow()
        else:
            self.status = ProgressStatus.IN_PROGRESS
            if not self.started_at:
                self.started_at = datetime.utcnow()
        
        # Actualizar última actividad
        if lessons_progress:
            latest_activity = max(
                (lp.last_accessed_at for lp in lessons_progress if lp.last_accessed_at),
                default=None
            )
            if latest_activity:
                self.last_accessed_at = latest_activity
        
        self.updated_at = datetime.utcnow()
    
    def get_next_lesson(self) -> Optional[LessonProgress]:
        """Obtener la siguiente lección a completar"""
        # Buscar primera lección no completada
        for lesson in sorted(self.lessons_progress, key=lambda x: x.lesson_id):
            if lesson.status != ProgressStatus.COMPLETED:
                return lesson
        return None
    
    def should_issue_certificate(self) -> bool:
        """Determinar si se debe emitir certificado"""
        return (
            self.progress_percentage >= 100.0 and 
            self.status == ProgressStatus.COMPLETED and
            not self.certificate_issued
        )

@dataclass
class ProgressSummary:
    """
    Resumen de progreso para dashboards y reportes
    """
    user_id: str = ""
    
    # Course stats
    total_courses_enrolled: int = 0
    courses_completed: int = 0
    courses_in_progress: int = 0
    courses_not_started: int = 0
    
    # Time stats
    total_time_spent: int = 0  # seconds
    average_daily_time: float = 0.0  # seconds
    
    # Activity stats
    current_streak: int = 0  # días consecutivos
    longest_streak: int = 0
    last_activity: Optional[datetime] = None
    
    # Achievement stats
    certificates_earned: int = 0
    total_lessons_completed: int = 0
    
    # Recent activity
    recent_courses: List[CourseProgress] = field(default_factory=list)
    
    def completion_rate(self) -> float:
        """Calcular tasa de completación"""
        if self.total_courses_enrolled == 0:
            return 0.0
        return (self.courses_completed / self.total_courses_enrolled) * 100.0
