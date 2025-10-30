"""
DTOs para operaciones relacionadas con lecciones
"""
from typing import Optional, List
from pydantic import BaseModel, validator
from datetime import datetime
from ...domain.entities.lesson import ContentType

class LessonCreate(BaseModel):
    """DTO para la creación de una nueva lección"""
    title: str
    course_id: str
    module_id: Optional[str] = None
    order: int
    content_type: ContentType
    content_url: Optional[str] = None
    content_text: Optional[str] = None
    duration: int = 0
    is_free_preview: bool = False
    attachments: List[str] = []
    
    @validator('order')
    def validate_order(cls, v):
        if v < 0:
            raise ValueError('El orden no puede ser negativo')
        return v
    
    @validator('duration')
    def validate_duration(cls, v):
        if v < 0:
            raise ValueError('La duración no puede ser negativa')
        return v
    
    @validator('content_url', 'content_text')
    def validate_content(cls, v, values, **kwargs):
        field = kwargs.get('field')
        content_type = values.get('content_type')
        
        if content_type == ContentType.VIDEO and field.name == 'content_url' and not v:
            raise ValueError('URL de contenido es requerida para lecciones de tipo video')
        
        if content_type == ContentType.TEXT and field.name == 'content_text' and not v:
            raise ValueError('Texto de contenido es requerido para lecciones de tipo texto')
            
        return v
    
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
                "attachments": ["https://ejemplo.com/recursos/material.pdf"]
            }
        }

class LessonUpdate(BaseModel):
    """DTO para actualizar información de una lección"""
    title: Optional[str] = None
    order: Optional[int] = None
    content_type: Optional[ContentType] = None
    content_url: Optional[str] = None
    content_text: Optional[str] = None
    duration: Optional[int] = None
    is_free_preview: Optional[bool] = None
    attachments: Optional[List[str]] = None
    
    @validator('order')
    def validate_order(cls, v):
        if v is not None and v < 0:
            raise ValueError('El orden no puede ser negativo')
        return v
    
    @validator('duration')
    def validate_duration(cls, v):
        if v is not None and v < 0:
            raise ValueError('La duración no puede ser negativa')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "title": "Título actualizado",
                "order": 2,
                "duration": 20,
                "is_free_preview": False
            }
        }

class LessonOrderItem(BaseModel):
    """DTO para reordenar lecciones"""
    lesson_id: str
    order: int

class LessonOrderUpdate(BaseModel):
    """DTO para actualizar el orden de las lecciones"""
    lesson_id: str
    order: int

class LessonResponse(BaseModel):
    """DTO para respuesta con datos de lección"""
    id: str
    title: str
    course_id: str
    order: int
    content_type: ContentType
    content_url: Optional[str] = None
    content_text: Optional[str] = None
    duration: int
    is_free_preview: bool
    attachments: List[str] = []
    created_at: datetime
    updated_at: datetime
    
    # ✅ Campos adicionales para compatibilidad con frontend
    video_url: Optional[str] = None  # Alias de content_url para videos
    video_id: Optional[str] = None   # ID extraído de la URL del video
    lesson_type: Optional[str] = None  # Alias de content_type para compatibilidad
    
    @classmethod
    def from_lesson(cls, lesson):
        """Crear LessonResponse desde Lesson con campos computados"""
        data = lesson.dict()
        
        # Mapear content_type a lesson_type para compatibilidad
        data['lesson_type'] = str(lesson.content_type.value) if hasattr(lesson.content_type, 'value') else str(lesson.content_type)
        
        # Si es video, extraer video_id y setear video_url
        if lesson.content_type in ['video', 'VIDEO']:
            data['video_url'] = lesson.content_url
            
            # Extraer video_id de la URL: /api/v1/media/videos/{video_id}/stream
            if lesson.content_url:
                parts = lesson.content_url.split('/')
                if 'videos' in parts and len(parts) > parts.index('videos') + 1:
                    data['video_id'] = parts[parts.index('videos') + 1]
        
        return cls(**data)
    
    class Config:
        schema_extra = {
            "example": {
                "id": "60d5ec9f2c21e3d10f5d5b5e",
                "title": "Introducción a variables en Python",
                "course_id": "60d5ec9f2c21e3d10f5d5b5d",
                "order": 1,
                "content_type": "video",
                "content_url": "https://ejemplo.com/video.mp4",
                "duration": 15,
                "is_free_preview": True,
                "attachments": ["https://ejemplo.com/recursos/material.pdf"],
                "created_at": "2023-06-25T10:00:00",
                "updated_at": "2023-06-25T10:00:00"
            }
        }
