"""
DTOs para Módulos
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class ModuleCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=1000)
    order: Optional[int] = None  # Se auto-asigna si no se proporciona
    estimated_duration: int = Field(0, ge=0)
    is_required: bool = True
    unlock_previous: bool = True

class ModuleUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1, max_length=1000)
    order: Optional[int] = Field(None, ge=1)
    estimated_duration: Optional[int] = Field(None, ge=0)
    is_required: Optional[bool] = None
    unlock_previous: Optional[bool] = None

class ModuleResponse(BaseModel):
    id: str
    course_id: str
    title: str
    description: str
    order: int
    lessons: List[str]
    estimated_duration: int
    is_required: bool
    unlock_previous: bool
    created_at: datetime
    updated_at: datetime

class ModuleWithLessons(BaseModel):
    id: str
    course_id: str
    title: str
    description: str
    order: int
    lessons: List[dict]  # Lista completa de lecciones
    lessons_count: int
    total_duration: int
    estimated_duration: int
    is_required: bool
    unlock_previous: bool
    created_at: datetime
    updated_at: datetime

class ModuleOrderUpdate(BaseModel):
    module_id: str
    order: int

class CourseStructureResponse(BaseModel):
    course_id: str
    modules: List[ModuleWithLessons]
    total_modules: int
    total_lessons: int
    total_duration: int

class LessonAssignment(BaseModel):
    lesson_id: str
