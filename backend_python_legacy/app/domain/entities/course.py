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
    # Prevención de Riesgos
    OCCUPATIONAL_SAFETY = "occupational_safety"  # Seguridad Ocupacional
    INDUSTRIAL_HYGIENE = "industrial_hygiene"    # Higiene Industrial  
    EMERGENCY_MANAGEMENT = "emergency_management" # Gestión de Emergencias
    RISK_ASSESSMENT = "risk_assessment"          # Evaluación de Riesgos
    WORK_SAFETY = "work_safety"                 # Seguridad en el Trabajo
    
    # Normas ISO
    ISO_9001 = "iso_9001"                       # Gestión de Calidad
    ISO_14001 = "iso_14001"                     # Gestión Ambiental
    ISO_45001 = "iso_45001"                     # Seguridad y Salud Ocupacional
    ISO_27001 = "iso_27001"                     # Seguridad de la Información
    ISO_50001 = "iso_50001"                     # Gestión de Energía
    
    # Categorías Generales
    REGULATORY_COMPLIANCE = "regulatory_compliance" # Cumplimiento Normativo
    SAFETY_TRAINING = "safety_training"           # Capacitación en Seguridad
    OTHER = "other"

class Course(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    instructor_id: str
    cover_image: Optional[str] = None
    price: Optional[float] = None
    discount_price: Optional[float] = None
    level: CourseLevel
    category: CourseCategory
    tags: List[str] = []
    requirements: List[str] = []
    what_you_will_learn: List[str] = []
    lessons: List[str] = []
    lessons_count: int = 0  # ✅ AGREGADO: Número de lecciones del curso
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
