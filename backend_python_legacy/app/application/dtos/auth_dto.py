"""
DTOs para autenticación y registro de usuarios
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, validator
import re

class LoginData(BaseModel):
    """DTO para inicio de sesión"""
    username: Optional[str] = Field(None, description="Nombre de usuario o email", example="johndoe")
    email: Optional[str] = Field(None, description="Email del usuario", example="johndoe@example.com")
    password: str = Field(..., min_length=6, description="Contraseña", example="secret123")
    
    @validator('username', 'email')
    def validate_login_fields(cls, v, values):
        # Asegurarse de que al menos uno de username o email esté presente
        username = values.get('username')
        email = values.get('email')
        if not username and not email and not v:
            raise ValueError('Se requiere proporcionar un nombre de usuario o email')
        return v
    
    class Config:
        schema_extra = {
            "examples": [
                {
                    "username": "johndoe",
                    "password": "secret123"
                },
                {
                    "email": "johndoe@example.com",
                    "password": "secret123"
                }
            ]
        }


class TokenData(BaseModel):
    """DTO para datos extraídos del token JWT"""
    sub: str = Field(..., description="ID del usuario")
    email: EmailStr = Field(..., description="Correo del usuario")
    username: str = Field(..., description="Nombre de usuario")
    role: str = Field(..., description="Rol del usuario")
    exp: Optional[int] = Field(None, description="Tiempo de expiración")


class Token(BaseModel):
    """DTO para token de acceso"""
    access_token: str = Field(..., description="Token de acceso JWT")
    token_type: str = Field(..., description="Tipo de token", example="bearer")
    expires_in: int = Field(..., description="Tiempo de expiración en segundos", example=3600)
    user_id: str = Field(..., description="ID del usuario")
    username: str = Field(..., description="Nombre de usuario")
    email: EmailStr = Field(..., description="Correo del usuario")
    role: str = Field(..., description="Rol del usuario")

    class Config:
        schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 3600,
                "user_id": "60d21b4967d0d8992e610c85",
                "username": "johndoe",
                "email": "john@example.com",
                "role": "student"
            }
        }


class RegistrationData(BaseModel):
    """DTO para registro de usuario"""
    email: EmailStr = Field(..., description="Correo electrónico", example="john@example.com")
    firstName: str = Field(..., min_length=2, max_length=50, description="Nombre", example="John")
    lastName: str = Field(..., min_length=2, max_length=50, description="Apellido", example="Doe")
    password: str = Field(..., min_length=6, description="Contraseña", example="secret123")
    
    class Config:
        schema_extra = {
            "example": {
                "email": "john@example.com",
                "firstName": "John",
                "lastName": "Doe",
                "password": "secret123"
            }
        }


class PasswordResetRequest(BaseModel):
    """DTO para solicitud de restablecimiento de contraseña"""
    email: EmailStr = Field(..., description="Correo electrónico", example="john@example.com")

    class Config:
        schema_extra = {
            "example": {
                "email": "john@example.com"
            }
        }


class PasswordReset(BaseModel):
    """DTO para restablecimiento de contraseña"""
    token: str = Field(..., description="Token de restablecimiento")
    new_password: str = Field(..., min_length=6, description="Nueva contraseña")
    confirm_password: str = Field(..., description="Confirmación de nueva contraseña")

    @validator('confirm_password')
    def passwords_match(cls, v, values, **kwargs):
        if 'new_password' in values and v != values['new_password']:
            raise ValueError('Las contraseñas no coinciden')
        return v

    class Config:
        schema_extra = {
            "example": {
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "new_password": "newSecret123",
                "confirm_password": "newSecret123"
            }
        }


class VerificationResponse(BaseModel):
    """DTO para respuesta de verificación de correo"""
    success: bool = Field(..., description="Indica si la operación fue exitosa")
    message: str = Field(..., description="Mensaje informativo")
    user_id: Optional[str] = Field(None, description="ID del usuario verificado (si la operación fue exitosa)")
    
    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "message": "Correo electrónico verificado correctamente",
                "user_id": "60d21b4967d0d8992e610c85"
            }
        }


class ResendVerificationRequest(BaseModel):
    """DTO para solicitud de reenvío de verificación de correo"""
    email: EmailStr = Field(..., description="Correo electrónico", example="john@example.com")
    
    class Config:
        schema_extra = {
            "example": {
                "email": "john@example.com"
            }
        }
