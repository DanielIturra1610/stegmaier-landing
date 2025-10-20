"""
Entidad Módulo para la plataforma de cursos
Permite organizar lecciones en módulos jerárquicos
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class Module(BaseModel):
    id: Optional[str] = None
    course_id: str
    title: str
    description: str
    order: int  # Posición en el curso
    lessons: List[str] = []  # Lista de lesson IDs
    estimated_duration: int = 0  # Duración estimada en minutos
    is_required: bool = True  # Si es obligatorio para completar el curso
    unlock_previous: bool = True  # Si requiere completar módulo anterior
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        schema_extra = {
            "example": {
                "course_id": "60d5ec9f2c21e3d10f5d5b5c",
                "title": "Módulo 1: Introducción a Sistema de Gestión Integrado SICMON",
                "description": "Conoce la estructura organizacional y el sistema de gestión integrado de SICMON Chile",
                "order": 1,
                "lessons": ["lesson_id_1", "lesson_id_2", "lesson_id_3"],
                "estimated_duration": 120,
                "is_required": True,
                "unlock_previous": True
            }
        }
