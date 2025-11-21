"""
DTOs para operaciones relacionadas con inscripciones
"""
from typing import Optional, List
from pydantic import BaseModel, validator
from datetime import datetime
from ...domain.entities.enrollment import EnrollmentStatus

class EnrollmentCreate(BaseModel):
    """DTO para la creación de una nueva inscripción"""
    course_id: str
    student_id: Optional[str] = None  # Solo para admins
    expiry_date: Optional[datetime] = None
    
    class Config:
        schema_extra = {
            "example": {
                "course_id": "60d5ec9f2c21e3d10f5d5b5d",
                "student_id": "60d5ec9f2c21e3d10f5d5b5c",
                "expiry_date": "2024-06-25T10:00:00"
            }
        }

class EnrollmentUpdate(BaseModel):
    """DTO para actualizar información de una inscripción"""
    status: Optional[EnrollmentStatus] = None
    progress: Optional[float] = None
    completed_lessons: Optional[List[str]] = None
    expiry_date: Optional[datetime] = None
    
    @validator('progress')
    def validate_progress(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError('El progreso debe estar entre 0 y 100')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "status": "completed",
                "progress": 100.0,
                "completed_lessons": ["60d5ec9f2c21e3d10f5d5b5e", "60d5ec9f2c21e3d10f5d5b5f"],
                "expiry_date": "2024-06-25T10:00:00"
            }
        }

class EnrollmentResponse(BaseModel):
    """DTO para respuesta con datos de inscripción"""
    id: str
    user_id: str
    course_id: str
    status: EnrollmentStatus
    progress: float
    completed_lessons: List[str] = []
    enrollment_date: datetime
    expiry_date: Optional[datetime] = None
    last_accessed: Optional[datetime] = None
    certificate_issued: bool
    certificate_url: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "id": "60d5ec9f2c21e3d10f5d5b60",
                "user_id": "60d5ec9f2c21e3d10f5d5b5c",
                "course_id": "60d5ec9f2c21e3d10f5d5b5d",
                "status": "active",
                "progress": 25.5,
                "completed_lessons": ["60d5ec9f2c21e3d10f5d5b5e"],
                "enrollment_date": "2023-06-25T10:00:00",
                "expiry_date": "2024-06-25T10:00:00",
                "last_accessed": "2023-06-30T15:30:00",
                "certificate_issued": False,
                "certificate_url": None
            }
        }

class EnrollmentProgressUpdate(BaseModel):
    """DTO para actualizar el progreso de una lección"""
    lesson_id: str
    completed: bool
    
    class Config:
        schema_extra = {
            "example": {
                "lesson_id": "60d5ec9f2c21e3d10f5d5b5e",
                "completed": True
            }
        }

class LessonCompletionUpdate(BaseModel):
    """DTO para marcar una lección como completada en una inscripción"""
    lesson_id: str
    completed: bool = True
    
    class Config:
        schema_extra = {
            "example": {
                "lesson_id": "60d5ec9f2c21e3d10f5d5b5e",
                "completed": True
            }
        }

class EnrollmentProgressResponse(BaseModel):
    """DTO para respuesta con datos detallados del progreso de una inscripción"""
    total_lessons: int
    completed_lessons: int
    progress_percentage: float
    completed_lesson_ids: List[str] = []
    
    class Config:
        schema_extra = {
            "example": {
                "total_lessons": 10,
                "completed_lessons": 5,
                "progress_percentage": 50.0,
                "completed_lesson_ids": ["60d5ec9f2c21e3d10f5d5b5e", "60d5ec9f2c21e3d10f5d5b5f"]
            }
        }
