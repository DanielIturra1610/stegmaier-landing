"""
Entidad Reseña para la plataforma de cursos
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, validator

class Review(BaseModel):
    id: Optional[str] = None
    user_id: str
    course_id: str
    rating: int  # 1-5 estrellas
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @validator('rating')
    def rating_must_be_valid(cls, v):
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
