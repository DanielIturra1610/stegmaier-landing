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
    allow_review: bool = True
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

        # ✅ Si no está publicado, no está disponible
        if self.status != QuizStatus.PUBLISHED:
            return False

        # ✅ Si no hay configuración, asumir que está disponible (por defecto)
        if not self.config:
            return True

        # ✅ Verificar fecha de inicio (solo si está configurada)
        if self.config.available_from and now < self.config.available_from:
            return False

        # ✅ Verificar fecha de fin (solo si está configurada)
        if self.config.available_until and now > self.config.available_until:
            return False

        # ✅ Si pasó todas las validaciones, está disponible
        return True

    def to_dict(self) -> dict:
        """Convierte la entidad Quiz a diccionario para persistencia en MongoDB."""
        # Convertir questions a dict
        questions_dict = []
        for question in self.questions:
            q_dict = {
                "id": question.id,
                "type": question.type.value if isinstance(question.type, QuestionType) else question.type,
                "title": question.title,
                "content": question.content,  # ✅ Corregido: era 'text' ahora 'content'
                "points": question.points,
                "explanation": question.explanation,
                "time_limit": question.time_limit,
                "correct_answers": question.correct_answers,
                "case_sensitive": question.case_sensitive,
                "pairs": question.pairs,
                "tags": question.tags,
                "difficulty": question.difficulty,
                "created_at": question.created_at.isoformat() if question.created_at else None,
                "updated_at": question.updated_at.isoformat() if question.updated_at else None,
                "created_by": question.created_by,
                "options": []
            }

            # Convertir opciones si existen
            for option in question.options:
                opt_dict = {
                    "id": option.id,
                    "text": option.text,
                    "is_correct": option.is_correct,
                    "explanation": option.explanation,
                    "order": option.order
                }
                q_dict["options"].append(opt_dict)

            questions_dict.append(q_dict)

        # Convertir configuración a dict con validación
        if self.config:
            config_dict = {
                "shuffle_questions": self.config.shuffle_questions,
                "shuffle_answers": self.config.shuffle_answers,
                "show_results_immediately": self.config.show_results_immediately,
                "show_correct_answers": self.config.show_correct_answers,
                "allow_review": getattr(self.config, 'allow_review', True),  # ✅ Valor por defecto
                "allow_retakes": getattr(self.config, 'allow_retakes', True),
                "max_attempts": self.config.max_attempts,
                "time_limit": self.config.time_limit,  # ✅ Corregido nombre
                "passing_score": self.config.passing_score,
                "available_from": self.config.available_from.isoformat() if self.config.available_from else None,
                "available_until": self.config.available_until.isoformat() if self.config.available_until else None,
                "require_proctor": getattr(self.config, 'require_proctor', False),
                "randomize_from_pool": getattr(self.config, 'randomize_from_pool', False),
                "questions_per_attempt": getattr(self.config, 'questions_per_attempt', None)
            }
        else:
            # ✅ Configuración por defecto si es None
            config_dict = {
                "shuffle_questions": False,
                "shuffle_answers": False,
                "show_results_immediately": True,
                "show_correct_answers": True,
                "allow_review": True,
                "allow_retakes": True,
                "max_attempts": None,
                "time_limit": None,
                "passing_score": 70.0,
                "available_from": None,
                "available_until": None,
                "require_proctor": False,
                "randomize_from_pool": False,
                "questions_per_attempt": None
            }

        return {
            "title": self.title,
            "description": self.description,
            "instructions": self.instructions,
            "course_id": self.course_id,
            "module_id": self.module_id,
            "lesson_id": self.lesson_id,
            "questions": questions_dict,
            "question_pool": self.question_pool,
            "config": config_dict,
            "status": self.status.value if isinstance(self.status, QuizStatus) else self.status,
            "total_points": self.total_points,
            "estimated_duration": self.estimated_duration,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "published_at": self.published_at.isoformat() if self.published_at else None,
            "created_by": self.created_by,
            "total_attempts": self.total_attempts,
            "average_score": self.average_score,
            "completion_rate": self.completion_rate
        }


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
