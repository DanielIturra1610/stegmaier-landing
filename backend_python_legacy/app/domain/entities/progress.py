"""
Entidades para tracking de progreso granular de videos y lecciones
"""
from datetime import datetime
from typing import Optional, Dict, Any
from dataclasses import dataclass

@dataclass
class VideoProgress:
    """
    Entidad para tracking de progreso específico en videos
    """
    id: Optional[str] = None
    user_id: str = ""
    lesson_id: str = ""
    video_id: str = ""
    current_position: float = 0.0  # Posición actual en segundos
    duration: float = 0.0  # Duración total del video
    watch_percentage: float = 0.0  # Porcentaje visto (0-100)
    is_completed: bool = False
    completion_threshold: float = 90.0  # % necesario para marcar como completo
    last_watched: Optional[datetime] = None
    total_watch_time: int = 0  # Tiempo total visto en segundos
    watch_sessions: int = 0  # Número de sesiones de visualización
    bookmarks: list = None  # Marcadores del usuario en el video
    notes: str = ""  # Notas del usuario sobre el video
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.bookmarks is None:
            self.bookmarks = []
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.updated_at is None:
            self.updated_at = datetime.utcnow()

@dataclass
class UserNote:
    """
    Entidad para notas de usuario en videos
    """
    id: Optional[str] = None
    user_id: str = ""
    lesson_id: str = ""
    video_id: str = ""
    timestamp: float = 0.0  # Momento del video donde se hizo la nota
    content: str = ""
    is_private: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
        if self.updated_at is None:
            self.updated_at = datetime.utcnow()

@dataclass
class VideoBookmark:
    """
    Entidad para marcadores en videos
    """
    id: Optional[str] = None
    user_id: str = ""
    lesson_id: str = ""
    video_id: str = ""
    timestamp: float = 0.0  # Momento del video marcado
    title: str = ""
    description: str = ""
    created_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()
