"""
Servicio para la autenticación y autorización de usuarios
"""
from typing import Optional
from datetime import datetime, timedelta
from ...core.config import get_settings
from ...core.security import verify_password, create_access_token, get_password_hash
from ...domain.repositories.user_repository import UserRepository
from ...domain.entities.user import User
from ..dtos.auth_dto import Token, TokenData, LoginData, RegistrationData

class AuthService:
    """
    Servicio para la autenticación y autorización que implementa la lógica de negocio
    """
    
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository
        self.settings = get_settings()
    
    async def authenticate_user(self, login_data: LoginData) -> Optional[User]:
        """
        Autentica a un usuario con email/username y contraseña
        
        Args:
            login_data: Datos de inicio de sesión (email/username y contraseña)
        
        Returns:
            El usuario autenticado o None si las credenciales son incorrectas
        """
        user = None
        
        # Intentar autenticar por email
        if "@" in login_data.username:
            user = await self.user_repository.get_by_email(login_data.username)
        
        # Si no se encuentra, intentar por nombre de usuario
        if not user:
            user = await self.user_repository.get_by_username(login_data.username)
        
        # Verificar si el usuario existe y la contraseña es correcta
        if not user or not verify_password(login_data.password, user.hashed_password):
            return None
        
        # Verificar si el usuario está activo
        if not user.is_active:
            return None
        
        return user
    
    def create_token(self, user: User) -> Token:
        """
        Crea un token de acceso JWT para un usuario
        
        Args:
            user: Usuario para el que se crea el token
        
        Returns:
            Token de acceso JWT y su tiempo de expiración
        """
        access_token_expires = timedelta(minutes=self.settings.access_token_expire_minutes)
        
        # Crear los datos que se incluirán en el token
        token_data = {
            "sub": user.id,
            "email": user.email,
            "username": user.username,
            "role": user.role
        }
        
        # Crear el token
        access_token = create_access_token(
            data=token_data, 
            expires_delta=access_token_expires
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=self.settings.access_token_expire_minutes * 60,  # en segundos
            user_id=user.id,
            username=user.username,
            email=user.email,
            role=user.role
        )
    
    async def register_user(self, registration_data: RegistrationData) -> User:
        """
        Registra un nuevo usuario
        
        Args:
            registration_data: Datos de registro del usuario
        
        Returns:
            El usuario registrado
        
        Raises:
            ValueError: Si el email o nombre de usuario ya están registrados
        """
        # Verificar si el email ya está registrado
        existing_email = await self.user_repository.get_by_email(registration_data.email)
        if existing_email:
            raise ValueError("El email ya está registrado")
        
        # Verificar si el nombre de usuario ya está registrado
        existing_username = await self.user_repository.get_by_username(registration_data.username)
        if existing_username:
            raise ValueError("El nombre de usuario ya está en uso")
        
        # Crear el nuevo usuario con la contraseña hasheada
        hashed_password = get_password_hash(registration_data.password)
        
        user = User(
            email=registration_data.email,
            username=registration_data.username,
            hashed_password=hashed_password,
            full_name=registration_data.full_name,
            role="student"  # Por defecto, los usuarios registrados tienen rol de estudiante
        )
        
        return await self.user_repository.create(user)
    
    async def get_current_user(self, token_data: TokenData) -> Optional[User]:
        """
        Obtiene el usuario actual a partir de los datos del token
        
        Args:
            token_data: Datos extraídos del token JWT
        
        Returns:
            El usuario actual o None si no existe
        """
        return await self.user_repository.get_by_id(token_data.sub)
    
    async def reset_password(self, email: str) -> bool:
        """
        Inicia el proceso de restablecimiento de contraseña
        
        Args:
            email: Email del usuario
        
        Returns:
            True si el proceso se inició correctamente, False si no
        
        Nota: Este método se completaría con la lógica de envío de correo electrónico
              y generación de token temporal para restablecer la contraseña
        """
        # Verificar si el usuario existe
        user = await self.user_repository.get_by_email(email)
        if not user:
            return False
        
        # Aquí iría la lógica de generación de token temporal y envío de correo
        # Por ahora, solo devolvemos True para indicar que el usuario existe
        return True
    
    async def change_password(self, user_id: str, new_password: str) -> bool:
        """
        Cambia la contraseña de un usuario
        
        Args:
            user_id: ID del usuario
            new_password: Nueva contraseña
        
        Returns:
            True si se cambió correctamente, False si no
        """
        # Verificar si el usuario existe
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            return False
        
        # Actualizar la contraseña
        hashed_password = get_password_hash(new_password)
        update_data = {"hashed_password": hashed_password}
        
        return await self.user_repository.update(user_id, update_data) is not None
