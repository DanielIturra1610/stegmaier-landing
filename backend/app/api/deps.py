"""
Dependencias para la API que implementan la autenticación y autorización.
"""
from typing import Optional, List

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from jose import jwt, JWTError
from pydantic import ValidationError

from ..core.config import get_settings
from ..domain.entities.user import User
from ..application.dtos.auth_dto import TokenData
from ..application.services.auth_service import AuthService
from ..dependencies import get_auth_service

settings = get_settings()

# Configuración de seguridad OAuth2
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.api_v1_str}/auth/login",
    scopes={
        "admin": "Acceso completo a todos los recursos",
        "instructor": "Crear y gestionar cursos",
        "student": "Acceso a cursos en los que está inscrito"
    }
)

async def get_current_user(
    security_scopes: SecurityScopes,
    token: str = Depends(oauth2_scheme),
    auth_service: AuthService = Depends(get_auth_service)
) -> User:
    """
    Valida el token JWT y devuelve el usuario actual.
    
    Args:
        security_scopes: Ámbitos de seguridad requeridos
        token: Token JWT
        auth_service: Servicio de autenticación
    
    Returns:
        Usuario autenticado
        
    Raises:
        HTTPException: Si el token es inválido o el usuario no existe
    """
    if security_scopes.scopes:
        authenticate_value = f'Bearer scope="{security_scopes.scope_str}"'
    else:
        authenticate_value = "Bearer"
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": authenticate_value},
    )
    
    try:
        # Decodificar el token JWT
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        # Extraer los datos del token
        token_data = TokenData(
            sub=payload.get("sub"),
            email=payload.get("email"),
            username=payload.get("username"),
            role=payload.get("role"),
            exp=payload.get("exp")
        )
        
    except (JWTError, ValidationError):
        raise credentials_exception
    
    # Obtener el usuario a partir de los datos del token
    user = await auth_service.get_current_user(token_data)
    if not user:
        raise credentials_exception
    
    # Verificar si el usuario está activo
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    # Verificar si el usuario tiene los permisos necesarios
    if security_scopes.scopes and token_data.role not in security_scopes.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permisos insuficientes. Se requiere: {security_scopes.scope_str}",
            headers={"WWW-Authenticate": authenticate_value},
        )
    
    return user

def get_current_active_user(
    current_user: User = Security(get_current_user, scopes=[])
) -> User:
    """
    Devuelve el usuario actual si está activo.
    
    Args:
        current_user: Usuario actual autenticado
        
    Returns:
        Usuario autenticado y activo
    """
    return current_user

def get_current_admin_user(
    current_user: User = Security(get_current_user, scopes=["admin"])
) -> User:
    """
    Devuelve el usuario actual si es administrador.
    
    Args:
        current_user: Usuario actual autenticado
        
    Returns:
        Usuario autenticado con rol de administrador
    """
    return current_user

def get_current_instructor_user(
    current_user: User = Security(get_current_user, scopes=["admin", "instructor"])
) -> User:
    """
    Devuelve el usuario actual si es instructor o administrador.
    
    Args:
        current_user: Usuario actual autenticado
        
    Returns:
        Usuario autenticado con rol de instructor o administrador
    """
    return current_user
