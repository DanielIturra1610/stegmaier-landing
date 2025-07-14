"""
Entidad Lección para la plataforma de cursos
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum

class ContentType(str, Enum):
    VIDEO = "video"
    TEXT = "text"
    QUIZ = "quiz"
    ASSIGNMENT = "assignment"

class Lesson(BaseModel):
    id: Optional[str] = None
    title: str
    course_id: str
    order: int  # Posición en el curso
    content_type: ContentType
    content_url: Optional[str] = None  # URL del video o recurso externo
    content_text: Optional[str] = None  # Contenido en formato markdown
    duration: int = 0  # Duración en minutos
    is_free_preview: bool = False
    attachments: List[str] = []  # URLs a archivos adjuntos
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        schema_extra = {
            "example": {
                "title": "Introducción a variables en Python",
                "course_id": "60d5ec9f2c21e3d10f5d5b5d",
                "order": 1,
                "content_type": "video",
                "content_url": "https://ejemplo.com/video.mp4",
                "duration": 15,
                "is_free_preview": True,
            }
        }
