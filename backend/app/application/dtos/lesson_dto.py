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
