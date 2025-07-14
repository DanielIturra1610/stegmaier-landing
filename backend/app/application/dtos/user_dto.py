"""
DTOs para operaciones relacionadas con usuarios
"""
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime
from ...domain.entities.user import UserRole

class UserCreate(BaseModel):
    """DTO para la creación de un nuevo usuario"""
    email: EmailStr
    username: str
    password: str
    full_name: str
    role: UserRole = UserRole.STUDENT
    bio: Optional[str] = None
    profile_picture: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "email": "usuario@ejemplo.com",
                "username": "usuario123",
                "password": "contraseña_segura",
                "full_name": "Nombre Completo",
                "role": "student",
                "bio": "Descripción breve sobre el usuario",
                "profile_picture": "https://ejemplo.com/foto.jpg"
            }
        }

class UserUpdate(BaseModel):
    """DTO para actualizar información de usuario"""
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    bio: Optional[str] = None
    profile_picture: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "full_name": "Nuevo Nombre Completo",
                "bio": "Nueva descripción del usuario",
                "profile_picture": "https://ejemplo.com/nueva_foto.jpg"
            }
        }
        
class UserPasswordUpdate(BaseModel):
    """DTO para actualizar la contraseña del usuario"""
    current_password: str
    new_password: str
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "current_password": "contraseña_actual",
                "new_password": "nueva_contraseña_segura"
            }
        }

class UserResponse(BaseModel):
    """DTO para respuesta con datos de usuario"""
    id: str
    email: EmailStr
    username: str
    full_name: str
    role: UserRole
    bio: Optional[str] = None
    profile_picture: Optional[str] = None
    is_active: bool
    is_verified: bool
    enrolled_courses: List[str] = []
    created_courses: List[str] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        schema_extra = {
            "example": {
                "id": "60d5ec9f2c21e3d10f5d5b5c",
                "email": "usuario@ejemplo.com",
                "username": "usuario123",
                "full_name": "Nombre Completo",
                "role": "student",
                "bio": "Descripción breve sobre el usuario",
                "profile_picture": "https://ejemplo.com/foto.jpg",
                "is_active": True,
                "is_verified": True,
                "enrolled_courses": ["60d5ec9f2c21e3d10f5d5b5d"],
                "created_courses": [],
                "created_at": "2023-06-25T10:00:00",
                "updated_at": "2023-06-25T10:00:00"
            }
        }
