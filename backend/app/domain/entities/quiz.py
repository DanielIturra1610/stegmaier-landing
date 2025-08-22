"""
Entidades de dominio para el sistema de evaluaciones (Quizzes).
"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from uuid import uuid4


class QuestionType(str, Enum):
    """Tipos de preguntas disponibles."""
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    FILL_IN_BLANK = "fill_in_blank"
    ESSAY = "essay"
    ORDERING = "ordering"
    MATCHING = "matching"


class QuizStatus(str, Enum):
    """Estados del quiz."""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class AttemptStatus(str, Enum):
    """Estados del intento de quiz."""
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SUBMITTED = "submitted"
    GRADED = "graded"
    EXPIRED = "expired"


@dataclass
class QuestionOption:
    """Opción para preguntas de múltiple elección."""
    id: str = field(default_factory=lambda: str(uuid4()))
    text: str = ""
    is_correct: bool = False
    explanation: Optional[str] = None
    order: int = 0


@dataclass
class Question:
    """Entidad para preguntas individuales."""
    id: str = field(default_factory=lambda: str(uuid4()))
    type: QuestionType = QuestionType.MULTIPLE_CHOICE
    title: str = ""
    content: str = ""  # Texto de la pregunta
    explanation: Optional[str] = None  # Explicación de la respuesta correcta
    points: float = 1.0
    time_limit: Optional[int] = None  # Tiempo límite en segundos
    
    # Para multiple choice y true/false
    options: List[QuestionOption] = field(default_factory=list)
    
    # Para fill-in-blank
    correct_answers: List[str] = field(default_factory=list)
    case_sensitive: bool = False
    
    # Para ordering y matching
    pairs: List[Dict[str, str]] = field(default_factory=list)
    
    # Metadata
    tags: List[str] = field(default_factory=list)
    difficulty: str = "medium"  # easy, medium, hard
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None  # user_id del instructor


@dataclass
class QuizConfiguration:
    """Configuración avanzada del quiz."""
    shuffle_questions: bool = False
    shuffle_answers: bool = False
    show_results_immediately: bool = True
    show_correct_answers: bool = True
    allow_retakes: bool = True
    max_attempts: Optional[int] = None
    passing_score: float = 70.0  # Porcentaje mínimo para aprobar
    time_limit: Optional[int] = None  # Tiempo límite total en minutos
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None
    require_proctor: bool = False
    randomize_from_pool: bool = False
    questions_per_attempt: Optional[int] = None


@dataclass
class Quiz:
    """Entidad principal para quizzes."""
    id: str = field(default_factory=lambda: str(uuid4()))
    title: str = ""
    description: str = ""
    instructions: str = ""
    
    # Relaciones
    course_id: str = ""
    module_id: Optional[str] = None
    lesson_id: Optional[str] = None
    
    # Preguntas
    questions: List[Question] = field(default_factory=list)
    question_pool: List[str] = field(default_factory=list)  # IDs de preguntas para pool
    
    # Configuración
    config: QuizConfiguration = field(default_factory=QuizConfiguration)
    
    # Estado y metadata
    status: QuizStatus = QuizStatus.DRAFT
    total_points: float = 0.0
    estimated_duration: int = 0  # minutos estimados
    
    # Timestamps
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    published_at: Optional[datetime] = None
    
    # Autor
    created_by: str = ""  # user_id del instructor
    
    # Estadísticas
    total_attempts: int = 0
    average_score: float = 0.0
    completion_rate: float = 0.0

    def calculate_total_points(self) -> float:
        """Calcula el total de puntos del quiz."""
        self.total_points = sum(question.points for question in self.questions)
        return self.total_points

    def is_available_now(self) -> bool:
        """Verifica si el quiz está disponible actualmente."""
        now = datetime.utcnow()
        
        if self.status != QuizStatus.PUBLISHED:
            return False
            
        if self.config.available_from and now < self.config.available_from:
            return False
            
        if self.config.available_until and now > self.config.available_until:
            return False
            
        return True


@dataclass
class QuizAnswer:
    """Respuesta a una pregunta específica."""
    question_id: str = ""
    answer: Any = None  # Puede ser string, list, dict dependiendo del tipo
    time_spent: int = 0  # segundos
    is_correct: Optional[bool] = None
    points_earned: float = 0.0
    submitted_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class QuizAttempt:
    """Intento de quiz por parte de un estudiante."""
    id: str = field(default_factory=lambda: str(uuid4()))
    quiz_id: str = ""
    student_id: str = ""  # user_id del estudiante
    
    # Estado del intento
    status: AttemptStatus = AttemptStatus.IN_PROGRESS
    attempt_number: int = 1
    
    # Respuestas
    answers: List[QuizAnswer] = field(default_factory=list)
    current_question_index: int = 0
    
    # Scoring
    total_points: float = 0.0
    points_earned: float = 0.0
    score_percentage: float = 0.0
    is_passing: bool = False
    
    # Timing
    started_at: datetime = field(default_factory=datetime.utcnow)
    submitted_at: Optional[datetime] = None
    time_spent: int = 0  # segundos totales
    time_remaining: Optional[int] = None  # segundos restantes
    
    # Metadata
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    browser_data: Dict[str, Any] = field(default_factory=dict)
    
    def calculate_score(self, quiz: Quiz) -> float:
        """Calcula el puntaje del intento."""
        if not self.answers:
            return 0.0
        
        total_possible = quiz.total_points or quiz.calculate_total_points()
        self.points_earned = sum(answer.points_earned for answer in self.answers)
        
        if total_possible > 0:
            self.score_percentage = (self.points_earned / total_possible) * 100
        else:
            self.score_percentage = 0.0
        
        self.is_passing = self.score_percentage >= quiz.config.passing_score
        return self.score_percentage

    def is_expired(self, quiz: Quiz) -> bool:
        """Verifica si el intento ha expirado."""
        if not quiz.config.time_limit:
            return False
        
        if self.status in [AttemptStatus.COMPLETED, AttemptStatus.SUBMITTED, AttemptStatus.GRADED]:
            return False
        
        time_limit_seconds = quiz.config.time_limit * 60
        elapsed = (datetime.utcnow() - self.started_at).total_seconds()
        
        return elapsed > time_limit_seconds

    def get_remaining_time(self, quiz: Quiz) -> Optional[int]:
        """Obtiene el tiempo restante en segundos."""
        if not quiz.config.time_limit:
            return None
        
        time_limit_seconds = quiz.config.time_limit * 60
        elapsed = (datetime.utcnow() - self.started_at).total_seconds()
        remaining = max(0, time_limit_seconds - elapsed)
        
        return int(remaining)


@dataclass
class QuestionBank:
    """Banco de preguntas para reutilización."""
    id: str = field(default_factory=lambda: str(uuid4()))
    name: str = ""
    description: str = ""
    course_id: str = ""
    category: str = ""
    tags: List[str] = field(default_factory=list)
    questions: List[Question] = field(default_factory=list)
    created_by: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    is_public: bool = False  # Si otros instructores pueden usarlo
