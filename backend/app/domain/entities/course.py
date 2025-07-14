"""
Entidad Curso para la plataforma de cursos
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from enum import Enum

class CourseLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class CourseCategory(str, Enum):
    PROGRAMMING = "programming"
    DESIGN = "design"
    BUSINESS = "business"
    MARKETING = "marketing"
    PERSONAL_DEVELOPMENT = "personal_development"
    OTHER = "other"

class Course(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    instructor_id: str
    cover_image: Optional[str] = None
    price: float
    discount_price: Optional[float] = None
    level: CourseLevel
    category: CourseCategory
    tags: List[str] = []
    requirements: List[str] = []
    what_you_will_learn: List[str] = []
    lessons: List[str] = []
    total_duration: int = 0  # en minutos
    total_students: int = 0
    average_rating: float = 0.0
    is_published: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        schema_extra = {
            "example": {
                "title": "Introducción a Python",
                "description": "Aprende los fundamentos de programación con Python desde cero",
                "instructor_id": "60d5ec9f2c21e3d10f5d5b5c",
                "cover_image": "https://ejemplo.com/imagen.jpg",
                "price": 49.99,
                "level": "beginner",
                "category": "programming",
                "tags": ["python", "programación", "desarrollo"],
                "requirements": ["No se necesita experiencia previa"],
                "what_you_will_learn": ["Variables y tipos de datos", "Estructuras de control"],
            }
        }
