"""
Utilidades de seguridad para JWT y contraseñas
"""
from datetime import datetime, timedelta
from typing import Any, Union, Optional

from jose import jwt
from passlib.context import CryptContext
from .config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(subject: Union[str, Any], additional_data: dict = None, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crear token JWT
    
    Args:
        subject: ID del usuario u otro identificador principal
        additional_data: Datos adicionales a incluir en el token (email, username, role, etc.)
        expires_delta: Tiempo de expiración personalizado
    
    Returns:
        Token JWT codificado
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Crear el payload básico
    to_encode = {"exp": expire, "sub": str(subject)}
    
    # Añadir datos adicionales si se proporcionan
    if additional_data:
        to_encode.update(additional_data)
    
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verificar contraseña
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Generar hash de contraseña
    """
    return pwd_context.hash(password)
