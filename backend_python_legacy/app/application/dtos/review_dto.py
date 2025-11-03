"""
DTOs para operaciones relacionadas con reseñas
"""
from typing import Optional
from pydantic import BaseModel, validator
from datetime import datetime

class ReviewCreate(BaseModel):
    """DTO para la creación de una nueva reseña"""
    user_id: str
    course_id: str
    rating: int
    comment: Optional[str] = None
    
    @validator('rating')
    def validate_rating(cls, v):
        if v < 1 or v > 5:
            raise ValueError('La calificación debe estar entre 1 y 5')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "user_id": "60d5ec9f2c21e3d10f5d5b5c",
                "course_id": "60d5ec9f2c21e3d10f5d5b5d",
                "rating": 5,
                "comment": "Excelente curso, muy bien explicado y con ejercicios prácticos."
            }
        }

class ReviewUpdate(BaseModel):
    """DTO para actualizar información de una reseña"""
    rating: Optional[int] = None
    comment: Optional[str] = None
    
    @validator('rating')
    def validate_rating(cls, v):
        if v is not None and (v < 1 or v > 5):
            raise ValueError('La calificación debe estar entre 1 y 5')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "rating": 4,
                "comment": "Comentario actualizado sobre el curso."
            }
        }

class ReviewResponse(BaseModel):
    """DTO para respuesta con datos de reseña"""
    id: str
    user_id: str
    course_id: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        schema_extra = {
            "example": {
                "id": "60d5ec9f2c21e3d10f5d5b61",
                "user_id": "60d5ec9f2c21e3d10f5d5b5c",
                "course_id": "60d5ec9f2c21e3d10f5d5b5d",
                "rating": 5,
                "comment": "Excelente curso, muy bien explicado y con ejercicios prácticos.",
                "created_at": "2023-06-25T10:00:00",
                "updated_at": "2023-06-25T10:00:00"
            }
        }
