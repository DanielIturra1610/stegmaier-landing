"""
Entidad Inscripción para la plataforma de cursos
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from enum import Enum

class EnrollmentStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    EXPIRED = "expired"
    CANCELLED = "cancelled"

class Enrollment(BaseModel):
    id: Optional[str] = None
    user_id: str
    course_id: str
    status: EnrollmentStatus = EnrollmentStatus.ACTIVE
    progress: float = 0.0  # Porcentaje de progreso (0-100)
    completed_lessons: list[str] = []  # IDs de lecciones completadas
    enrollment_date: datetime = Field(default_factory=datetime.utcnow)
    expiry_date: Optional[datetime] = None  # Para cursos con acceso limitado
    last_accessed: Optional[datetime] = None
    certificate_issued: bool = False
    certificate_url: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "user_id": "60d5ec9f2c21e3d10f5d5b5c",
                "course_id": "60d5ec9f2c21e3d10f5d5b5d",
                "status": "active",
                "progress": 25.5,
                "enrollment_date": "2023-06-15T10:00:00",
                "expiry_date": "2024-06-15T10:00:00"
            }
        }
