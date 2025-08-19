"""
DTOs para operaciones relacionadas con cursos
"""
from typing import Optional, List, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime
from ...domain.entities.course import CourseLevel, CourseCategory

class CourseCreate(BaseModel):
    """DTO para la creación de un nuevo curso"""
    title: str
    description: str
    cover_image: Optional[str] = None
    price: Optional[float] = None
    discount_price: Optional[float] = None
    level: CourseLevel
    category: CourseCategory
    tags: List[str] = []
    requirements: List[str] = []
    what_you_will_learn: List[str] = []
    
    @validator('price')
    def validate_price(cls, v):
        if v < 0:
            raise ValueError('El precio no puede ser negativo')
        return v
    
    @validator('discount_price')
    def validate_discount_price(cls, v, values):
        if v is not None:
            if v < 0:
                raise ValueError('El precio con descuento no puede ser negativo')
            if 'price' in values and v > values['price']:
                raise ValueError('El precio con descuento no puede ser mayor que el precio original')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "title": "Introducción a Python",
                "description": "Aprende los fundamentos de programación con Python desde cero",
                "cover_image": "https://ejemplo.com/imagen.jpg",
                "price": 49.99,
                "discount_price": 39.99,
                "level": "beginner",
                "category": "programming",
                "tags": ["python", "programación", "desarrollo"],
                "requirements": ["No se necesita experiencia previa"],
                "what_you_will_learn": ["Variables y tipos de datos", "Estructuras de control"]
            }
        }

class CourseUpdate(BaseModel):
    """DTO para actualizar información de un curso"""
    title: Optional[str] = None
    description: Optional[str] = None
    cover_image: Optional[str] = None
    price: Optional[float] = None
    discount_price: Optional[float] = None
    level: Optional[CourseLevel] = None
    category: Optional[CourseCategory] = None
    tags: Optional[List[str]] = None
    requirements: Optional[List[str]] = None
    what_you_will_learn: Optional[List[str]] = None
    is_published: Optional[bool] = None
    
    @validator('price')
    def validate_price(cls, v):
        if v is not None and v < 0:
            raise ValueError('El precio no puede ser negativo')
        return v
    
    @validator('discount_price')
    def validate_discount_price(cls, v, values):
        if v is not None:
            if v < 0:
                raise ValueError('El precio con descuento no puede ser negativo')
            if 'price' in values and values['price'] is not None and v > values['price']:
                raise ValueError('El precio con descuento no puede ser mayor que el precio original')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "title": "Curso Actualizado de Python",
                "description": "Descripción actualizada",
                "price": 59.99,
                "is_published": True
            }
        }

class CourseListResponse(BaseModel):
    """DTO para respuesta con datos resumidos de curso para listados"""
    id: str
    title: str
    description: str
    instructor_id: str
    cover_image: Optional[str] = None
    price: Optional[float] = None
    discount_price: Optional[float] = None
    level: CourseLevel
    category: CourseCategory
    tags: List[str] = []
    total_duration: int = 0
    lessons_count: int = 0  # ✅ AGREGADO: Número de lecciones del curso
    total_students: int = 0
    average_rating: float = 0.0
    is_published: bool
    created_at: datetime
    
    class Config:
        schema_extra = {
            "example": {
                "id": "60d5ec9f2c21e3d10f5d5b5d",
                "title": "Introducción a Python",
                "description": "Aprende los fundamentos de programación con Python desde cero",
                "instructor_id": "60d5ec9f2c21e3d10f5d5b5c",
                "cover_image": "https://ejemplo.com/imagen.jpg",
                "price": 49.99,
                "discount_price": 39.99,
                "level": "beginner",
                "category": "programming",
                "tags": ["python", "programación", "desarrollo"],
                "total_duration": 120,
                "lessons_count": 8,
                "total_students": 150,
                "average_rating": 4.7,
                "is_published": True,
                "created_at": "2023-06-25T10:00:00"
            }
        }

class CourseResponse(BaseModel):
    """DTO para respuesta con datos de curso"""
    id: str
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
    lessons: List[Any] = []  # 🔥 FIX: Changed from List[str] to List[Any] to support full lesson objects
    total_duration: int = 0
    total_students: int = 0
    average_rating: float = 0.0
    is_published: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        schema_extra = {
            "example": {
                "id": "60d5ec9f2c21e3d10f5d5b5d",
                "title": "Introducción a Python",
                "description": "Aprende los fundamentos de programación con Python desde cero",
                "instructor_id": "60d5ec9f2c21e3d10f5d5b5c",
                "cover_image": "https://ejemplo.com/imagen.jpg",
                "price": 49.99,
                "discount_price": 39.99,
                "level": "beginner",
                "category": "programming",
                "tags": ["python", "programación", "desarrollo"],
                "requirements": ["No se necesita experiencia previa"],
                "what_you_will_learn": ["Variables y tipos de datos", "Estructuras de control"],
                "lessons": ["60d5ec9f2c21e3d10f5d5b5e", "60d5ec9f2c21e3d10f5d5b5f"],
                "total_duration": 120,
                "total_students": 150,
                "average_rating": 4.7,
                "is_published": True,
                "created_at": "2023-06-25T10:00:00",
                "updated_at": "2023-06-25T10:00:00"
            }
        }
