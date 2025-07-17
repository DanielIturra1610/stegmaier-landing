"""
Servicio para la autenticación y autorización de usuarios
"""
from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
import secrets
import string
from ...core.config import get_settings
from ...core.security import verify_password, create_access_token, get_password_hash
from ...domain.repositories.user_repository import UserRepository
from ...domain.repositories.verification_token_repository import VerificationTokenRepository
from ...domain.entities.user import User
from ...domain.entities.verification_token import VerificationToken
from ..dtos.auth_dto import Token, TokenData, LoginData, RegistrationData, VerificationResponse

class AuthService:
    """
    Servicio para la autenticación y autorización que implementa la lógica de negocio
    """
    
    def __init__(self, user_repository: UserRepository, verification_token_repository: Optional[VerificationTokenRepository] = None):
        self.user_repository = user_repository
        self.verification_token_repository = verification_token_repository
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
    
    async def register_user(self, registration_data: RegistrationData) -> Tuple[User, str]:
        """
        Registra un nuevo usuario y genera un token de verificación
        
        Args:
            registration_data: Datos de registro del usuario
        
        Returns:
            Tupla con el usuario registrado y el token de verificación
        
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
            role="student",  # Por defecto, los usuarios registrados tienen rol de estudiante
            is_verified=False  # Por defecto, el usuario no está verificado
        )
        
        created_user = await self.user_repository.create(user)
        
        # Generar token de verificación
        verification_token_value = self._generate_verification_token()
        
        # Si tenemos acceso al repositorio de tokens de verificación, guardamos el token
        if self.verification_token_repository:
            # Crear el token con una fecha de expiración de 24 horas
            expires_at = datetime.utcnow() + timedelta(hours=24)
            verification_token = VerificationToken(
                user_id=created_user.id,
                token=verification_token_value,
                expires_at=expires_at
            )
            
            await self.verification_token_repository.create(verification_token)
        
        # Aquí iría la lógica para enviar el correo electrónico con el enlace de verificación
        # Por ejemplo, usando un servicio de email como SendGrid, Mailgun, etc.
        
        return created_user, verification_token_value
    
    async def get_current_user(self, token_data: TokenData) -> Optional[User]:
        """
        Obtiene el usuario actual a partir de los datos del token
        
        Args:
            token_data: Datos extraídos del token JWT
        
        Returns:
            El usuario actual o None si no existe
        """
        return await self.user_repository.get_by_id(token_data.sub)
    
    async def verify_email(self, token: str) -> VerificationResponse:
        """
        Verifica el correo electrónico de un usuario mediante un token
        
        Args:
            token: Token de verificación
            
        Returns:
            Objeto VerificationResponse con el resultado de la operación
        """
        try:
            # Si no tenemos el repositorio de tokens de verificación, devolvemos error
            if not self.verification_token_repository:
                return VerificationResponse(
                    success=False,
                    message="Servicio de verificación no disponible",
                    user_id=None
                )
                
            # Buscar el token en la base de datos
            verification_token = await self.verification_token_repository.get_by_token(token)
            
            # Verificar si el token existe
            if not verification_token:
                return VerificationResponse(
                    success=False,
                    message="Token de verificación inválido",
                    user_id=None
                )
                
            # Verificar si el token ya fue utilizado
            if verification_token.is_used:
                return VerificationResponse(
                    success=False,
                    message="Este token ya ha sido utilizado",
                    user_id=verification_token.user_id
                )
                
            # Verificar si el token ha expirado
            if verification_token.expires_at < datetime.utcnow():
                return VerificationResponse(
                    success=False,
                    message="El token de verificación ha expirado",
                    user_id=verification_token.user_id
                )
                
            # Obtener el usuario asociado al token
            user = await self.user_repository.get_by_id(verification_token.user_id)
            
            if not user:
                return VerificationResponse(
                    success=False,
                    message="Usuario no encontrado",
                    user_id=None
                )
                
            # Actualizar el usuario como verificado
            update_data = {"is_verified": True}
            updated_user = await self.user_repository.update(user.id, update_data)
            
            if not updated_user:
                return VerificationResponse(
                    success=False,
                    message="Error al actualizar el usuario",
                    user_id=verification_token.user_id
                )
                
            # Marcar el token como utilizado
            await self.verification_token_repository.mark_as_used(token)
            
            return VerificationResponse(
                success=True,
                message="Correo electrónico verificado correctamente",
                user_id=verification_token.user_id
            )
            
        except Exception as e:
            # Manejar errores
            return VerificationResponse(
                success=False,
                message=f"Error al verificar el correo electrónico: {str(e)}",
                user_id=None
            )
    
    async def resend_verification(self, email: str) -> VerificationResponse:
        """
        Reenvía el correo de verificación al usuario
        
        Args:
            email: Email del usuario
            
        Returns:
            Objeto VerificationResponse con el resultado de la operación
        """
        # Verificar si el usuario existe
        user = await self.user_repository.get_by_email(email)
        if not user:
            return VerificationResponse(
                success=False,
                message="No se encontró un usuario con ese correo electrónico",
                user_id=None
            )
            
        # Verificar si el usuario ya está verificado
        if user.is_verified:
            return VerificationResponse(
                success=False,
                message="El correo electrónico ya está verificado",
                user_id=user.id
            )
        
        # Si no tenemos el repositorio de tokens de verificación, devolvemos error
        if not self.verification_token_repository:
            return VerificationResponse(
                success=False,
                message="Servicio de verificación no disponible",
                user_id=None
            )
            
        # Generar un nuevo token de verificación
        verification_token_value = self._generate_verification_token()
        
        # Crear el token con una fecha de expiración de 24 horas
        expires_at = datetime.utcnow() + timedelta(hours=24)
        verification_token = VerificationToken(
            user_id=user.id,
            token=verification_token_value,
            expires_at=expires_at
        )
        
        # Guardar el nuevo token en la base de datos
        await self.verification_token_repository.create(verification_token)
        
        # Aquí iría la lógica para enviar el correo electrónico con el enlace de verificación
        # Por ejemplo, usando un servicio de email como SendGrid, Mailgun, etc.
        
        return VerificationResponse(
            success=True,
            message="Se ha enviado un nuevo correo de verificación",
            user_id=user.id,
            # Solo para desarrollo, en producción no se devolvería
            # verification_token: verification_token_value
        )
        
    def _generate_verification_token(self) -> str:
        """
        Genera un token aleatorio para verificación de correo
        
        Returns:
            Token aleatorio
        """
        # Generar un token de 32 caracteres alfanuméricos
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(32))
    
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
