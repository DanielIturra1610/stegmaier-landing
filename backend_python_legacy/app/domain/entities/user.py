"""
Entidad Usuario para la plataforma de cursos
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from enum import Enum

class UserRole(str, Enum):
    STUDENT = "student"
    INSTRUCTOR = "instructor"
    ADMIN = "admin"

class User(BaseModel):
    id: Optional[str] = None
    email: EmailStr
    username: str
    hashed_password: str
    full_name: str
    role: UserRole = UserRole.STUDENT
    bio: Optional[str] = None
    profile_picture: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    enrolled_courses: List[str] = []
    created_courses: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        schema_extra = {
            "example": {
                "email": "usuario@ejemplo.com",
                "username": "usuario123",
                "full_name": "Nombre Completo",
                "role": "student",
                "bio": "Descripción breve sobre el usuario",
                "profile_picture": "https://ejemplo.com/foto.jpg",
            }
        }
