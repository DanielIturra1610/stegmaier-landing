"""
DTOs para el sistema de quizzes.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class QuestionTypeEnum(str, Enum):
    """Tipos de preguntas disponibles."""
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    FILL_IN_BLANK = "fill_in_blank"
    ESSAY = "essay"
    ORDERING = "ordering"
    MATCHING = "matching"


class QuizStatusEnum(str, Enum):
    """Estados del quiz."""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class AttemptStatusEnum(str, Enum):
    """Estados del intento de quiz."""
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SUBMITTED = "submitted"
    GRADED = "graded"
    EXPIRED = "expired"


# DTOs para Question
class QuestionOptionCreate(BaseModel):
    """DTO para crear una opción de pregunta."""
    text: str = Field(..., min_length=1, max_length=500)
    is_correct: bool = False
    explanation: Optional[str] = Field(None, max_length=1000)
    order: int = 0


class QuestionOptionResponse(BaseModel):
    """DTO para respuesta de opción de pregunta."""
    id: str
    text: str
    is_correct: bool
    explanation: Optional[str] = None
    order: int


class QuestionCreate(BaseModel):
    """DTO para crear una pregunta."""
    type: QuestionTypeEnum
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=5000)
    explanation: Optional[str] = Field(None, max_length=2000)
    points: float = Field(1.0, ge=0, le=100)
    time_limit: Optional[int] = Field(None, ge=1, le=3600)  # segundos
    
    # Para multiple choice y true/false
    options: List[QuestionOptionCreate] = []
    
    # Para fill-in-blank
    correct_answers: List[str] = []
    case_sensitive: bool = False
    
    # Para ordering y matching
    pairs: List[Dict[str, str]] = []
    
    # Metadata
    tags: List[str] = []
    difficulty: str = Field("medium", regex="^(easy|medium|hard)$")


class QuestionUpdate(BaseModel):
    """DTO para actualizar una pregunta."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1, max_length=5000)
    explanation: Optional[str] = Field(None, max_length=2000)
    points: Optional[float] = Field(None, ge=0, le=100)
    time_limit: Optional[int] = Field(None, ge=1, le=3600)
    options: Optional[List[QuestionOptionCreate]] = None
    correct_answers: Optional[List[str]] = None
    case_sensitive: Optional[bool] = None
    pairs: Optional[List[Dict[str, str]]] = None
    tags: Optional[List[str]] = None
    difficulty: Optional[str] = Field(None, regex="^(easy|medium|hard)$")


class QuestionResponse(BaseModel):
    """DTO para respuesta de pregunta."""
    id: str
    type: QuestionTypeEnum
    title: str
    content: str
    explanation: Optional[str] = None
    points: float
    time_limit: Optional[int] = None
    options: List[QuestionOptionResponse] = []
    correct_answers: List[str] = []
    case_sensitive: bool = False
    pairs: List[Dict[str, str]] = []
    tags: List[str] = []
    difficulty: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None


# DTOs para Quiz Configuration
class QuizConfigurationCreate(BaseModel):
    """DTO para crear configuración de quiz."""
    shuffle_questions: bool = False
    shuffle_answers: bool = False
    show_results_immediately: bool = True
    show_correct_answers: bool = True
    allow_retakes: bool = True
    max_attempts: Optional[int] = Field(None, ge=1, le=10)
    passing_score: float = Field(70.0, ge=0, le=100)
    time_limit: Optional[int] = Field(None, ge=1, le=600)  # minutos
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None
    require_proctor: bool = False
    randomize_from_pool: bool = False
    questions_per_attempt: Optional[int] = Field(None, ge=1, le=100)


class QuizConfigurationResponse(BaseModel):
    """DTO para respuesta de configuración de quiz."""
    shuffle_questions: bool
    shuffle_answers: bool
    show_results_immediately: bool
    show_correct_answers: bool
    allow_retakes: bool
    max_attempts: Optional[int] = None
    passing_score: float
    time_limit: Optional[int] = None
    available_from: Optional[datetime] = None
    available_until: Optional[datetime] = None
    require_proctor: bool
    randomize_from_pool: bool
    questions_per_attempt: Optional[int] = None


# DTOs para Quiz
class QuizCreate(BaseModel):
    """DTO para crear un quiz."""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field("", max_length=2000)
    instructions: str = Field("", max_length=3000)
    course_id: str = Field(..., min_length=1)
    module_id: Optional[str] = None
    lesson_id: Optional[str] = None
    questions: List[str] = []  # IDs de preguntas
    question_pool: List[str] = []  # IDs de preguntas para pool
    config: QuizConfigurationCreate
    estimated_duration: int = Field(0, ge=0, le=600)  # minutos


class QuizUpdate(BaseModel):
    """DTO para actualizar un quiz."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    instructions: Optional[str] = Field(None, max_length=3000)
    questions: Optional[List[str]] = None
    question_pool: Optional[List[str]] = None
    config: Optional[QuizConfigurationCreate] = None
    estimated_duration: Optional[int] = Field(None, ge=0, le=600)
    status: Optional[QuizStatusEnum] = None


class QuizListResponse(BaseModel):
    """DTO para respuesta de lista de quizzes."""
    id: str
    title: str
    description: str
    course_id: str
    module_id: Optional[str] = None
    lesson_id: Optional[str] = None
    status: QuizStatusEnum
    total_points: float
    estimated_duration: int
    total_attempts: int
    average_score: float
    completion_rate: float
    created_at: datetime
    published_at: Optional[datetime] = None
    created_by: str
    is_available: bool = False


class QuizResponse(BaseModel):
    """DTO para respuesta completa de quiz."""
    id: str
    title: str
    description: str
    instructions: str
    course_id: str
    module_id: Optional[str] = None
    lesson_id: Optional[str] = None
    questions: List[QuestionResponse] = []
    question_pool: List[str] = []
    config: QuizConfigurationResponse
    status: QuizStatusEnum
    total_points: float
    estimated_duration: int
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None
    created_by: str
    total_attempts: int
    average_score: float
    completion_rate: float
    is_available: bool = False


# DTOs para Quiz Attempt
class QuizAnswerSubmit(BaseModel):
    """DTO para enviar respuesta a una pregunta."""
    question_id: str
    answer: Any  # Puede ser string, list, dict
    time_spent: int = 0  # segundos


class QuizAttemptCreate(BaseModel):
    """DTO para crear un intento de quiz."""
    quiz_id: str = Field(..., min_length=1)


class QuizAttemptUpdate(BaseModel):
    """DTO para actualizar un intento de quiz."""
    answers: List[QuizAnswerSubmit] = []
    current_question_index: Optional[int] = None
    status: Optional[AttemptStatusEnum] = None


class QuizAnswerResponse(BaseModel):
    """DTO para respuesta de una pregunta en el intento."""
    question_id: str
    answer: Any
    time_spent: int
    is_correct: Optional[bool] = None
    points_earned: float
    submitted_at: datetime


class QuizAttemptResponse(BaseModel):
    """DTO para respuesta de intento de quiz."""
    id: str
    quiz_id: str
    student_id: str
    status: AttemptStatusEnum
    attempt_number: int
    answers: List[QuizAnswerResponse] = []
    current_question_index: int
    total_points: float
    points_earned: float
    score_percentage: float
    is_passing: bool
    started_at: datetime
    submitted_at: Optional[datetime] = None
    time_spent: int
    time_remaining: Optional[int] = None


class QuizAttemptListResponse(BaseModel):
    """DTO para lista de intentos de quiz."""
    id: str
    quiz_id: str
    quiz_title: str
    student_id: str
    student_name: Optional[str] = None
    status: AttemptStatusEnum
    attempt_number: int
    score_percentage: float
    is_passing: bool
    started_at: datetime
    submitted_at: Optional[datetime] = None
    time_spent: int


# DTOs para estadísticas
class QuizStatistics(BaseModel):
    """DTO para estadísticas de quiz."""
    quiz_id: str
    quiz_title: str
    total_attempts: int
    unique_students: int
    average_score: float
    median_score: float
    pass_rate: float
    completion_rate: float
    average_time: int  # segundos
    question_statistics: List[Dict[str, Any]] = []


class StudentQuizProgress(BaseModel):
    """DTO para progreso del estudiante en quizzes."""
    student_id: str
    course_id: str
    quizzes_available: int
    quizzes_attempted: int
    quizzes_completed: int
    quizzes_passed: int
    average_score: float
    total_time_spent: int  # segundos


# DTOs para Question Bank
class QuestionBankCreate(BaseModel):
    """DTO para crear banco de preguntas."""
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field("", max_length=1000)
    course_id: str = Field(..., min_length=1)
    category: str = Field("", max_length=100)
    tags: List[str] = []
    is_public: bool = False


class QuestionBankUpdate(BaseModel):
    """DTO para actualizar banco de preguntas."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    category: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None


class QuestionBankResponse(BaseModel):
    """DTO para respuesta de banco de preguntas."""
    id: str
    name: str
    description: str
    course_id: str
    category: str
    tags: List[str]
    questions: List[QuestionResponse] = []
    question_count: int = 0
    created_by: str
    created_at: datetime
    updated_at: datetime
    is_public: bool


class QuestionBankListResponse(BaseModel):
    """DTO para lista de bancos de preguntas."""
    id: str
    name: str
    description: str
    course_id: str
    category: str
    tags: List[str]
    question_count: int
    created_by: str
    created_at: datetime
    is_public: bool
