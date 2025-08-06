"""
Entidades para analytics y métricas del sistema
"""
from datetime import datetime, date
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

@dataclass
class UserActivity:
    """
    Registro de actividad de usuario
    """
    id: Optional[str] = None
    user_id: str = ""
    activity_type: str = ""  # login, logout, lesson_view, course_complete, etc.
    resource_id: Optional[str] = None  # course_id, lesson_id, etc.
    resource_type: Optional[str] = None  # course, lesson, quiz, etc.
    metadata: Dict[str, Any] = None
    session_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}
        if self.created_at is None:
            self.created_at = datetime.utcnow()

@dataclass
class CourseAnalytics:
    """
    Analytics específicos de un curso
    """
    course_id: str = ""
    total_enrollments: int = 0
    active_students: int = 0
    completion_rate: float = 0.0
    average_completion_time: float = 0.0  # en horas
    average_rating: float = 0.0
    total_watch_time: int = 0  # en segundos
    most_watched_lesson: Optional[str] = None
    most_skipped_lesson: Optional[str] = None
    dropout_points: List[str] = None
    daily_activity: Dict[str, int] = None
    updated_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.dropout_points is None:
            self.dropout_points = []
        if self.daily_activity is None:
            self.daily_activity = {}
        if self.updated_at is None:
            self.updated_at = datetime.utcnow()

@dataclass
class UserAnalytics:
    """
    Analytics específicos de un usuario
    """
    user_id: str = ""
    total_courses_enrolled: int = 0
    completed_courses: int = 0
    total_watch_time: int = 0  # en segundos
    average_session_duration: float = 0.0  # en minutos
    login_streak: int = 0
    last_activity: Optional[datetime] = None
    favorite_category: Optional[str] = None
    learning_pace: str = "normal"  # slow, normal, fast
    engagement_score: float = 0.0  # 0-100
    completion_rate: float = 0.0
    updated_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.updated_at is None:
            self.updated_at = datetime.utcnow()

@dataclass
class PlatformMetrics:
    """
    Métricas generales de la plataforma
    """
    date: date
    total_users: int = 0
    active_users_today: int = 0
    new_users_today: int = 0
    total_courses: int = 0
    total_lessons_watched: int = 0
    total_watch_time: int = 0  # en segundos
    completion_events: int = 0
    revenue_today: float = 0.0
    average_session_duration: float = 0.0
    bounce_rate: float = 0.0
    top_course_today: Optional[str] = None
    created_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
