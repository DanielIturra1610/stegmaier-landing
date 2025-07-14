"""
Servicio para la gestión de usuarios
"""
from typing import List, Optional
from ...domain.repositories.user_repository import UserRepository
from ...domain.entities.user import User
from ..dtos.user_dto import UserCreate, UserUpdate, UserPasswordUpdate
from ...core.security import verify_password, get_password_hash

class UserService:
    """
    Servicio para la gestión de usuarios que implementa la lógica de negocio
    """
    
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository
    
    async def create_user(self, user_data: UserCreate) -> User:
        """
        Crea un nuevo usuario
        
        Args:
            user_data: Datos del usuario a crear
        
        Returns:
            El usuario creado
        
        Raises:
            ValueError: Si el correo o nombre de usuario ya existe
        """
        # Verificar si el correo ya está registrado
        existing_email = await self.user_repository.get_by_email(user_data.email)
        if existing_email:
            raise ValueError("El correo ya está registrado")
        
        # Verificar si el nombre de usuario ya está registrado
        existing_username = await self.user_repository.get_by_username(user_data.username)
        if existing_username:
            raise ValueError("El nombre de usuario ya está en uso")
        
        # Crear el nuevo usuario con la contraseña hasheada
        hashed_password = get_password_hash(user_data.password)
        
        user = User(
            email=user_data.email,
            username=user_data.username,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            role=user_data.role,
            bio=user_data.bio,
            profile_picture=user_data.profile_picture
        )
        
        return await self.user_repository.create(user)
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """
        Obtiene un usuario por su ID
        
        Args:
            user_id: ID del usuario
        
        Returns:
            El usuario encontrado o None
        """
        return await self.user_repository.get_by_id(user_id)
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Obtiene un usuario por su correo electrónico
        
        Args:
            email: Correo del usuario
        
        Returns:
            El usuario encontrado o None
        """
        return await self.user_repository.get_by_email(email)
    
    async def get_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """
        Obtiene una lista de usuarios con paginación
        
        Args:
            skip: Número de usuarios a saltar
            limit: Número máximo de usuarios a devolver
        
        Returns:
            Lista de usuarios
        """
        return await self.user_repository.list(skip, limit)
    
    async def update_user(self, user_id: str, user_data: UserUpdate) -> Optional[User]:
        """
        Actualiza los datos de un usuario
        
        Args:
            user_id: ID del usuario a actualizar
            user_data: Datos a actualizar
        
        Returns:
            El usuario actualizado o None si no existe
        
        Raises:
            ValueError: Si el correo o nombre de usuario ya está en uso por otro usuario
        """
        # Verificar si el usuario existe
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            return None
        
        update_data = user_data.dict(exclude_unset=True)
        
        # Verificar si el correo ya está en uso por otro usuario
        if "email" in update_data and update_data["email"] != user.email:
            existing_email = await self.user_repository.get_by_email(update_data["email"])
            if existing_email:
                raise ValueError("El correo ya está registrado por otro usuario")
        
        # Verificar si el nombre de usuario ya está en uso por otro usuario
        if "username" in update_data and update_data["username"] != user.username:
            existing_username = await self.user_repository.get_by_username(update_data["username"])
            if existing_username:
                raise ValueError("El nombre de usuario ya está en uso por otro usuario")
        
        return await self.user_repository.update(user_id, update_data)
    
    async def update_user_password(self, user_id: str, password_data: UserPasswordUpdate) -> bool:
        """
        Actualiza la contraseña de un usuario
        
        Args:
            user_id: ID del usuario
            password_data: Datos de contraseña actual y nueva
        
        Returns:
            True si se actualizó correctamente, False si no
        
        Raises:
            ValueError: Si la contraseña actual no es correcta
        """
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            return False
        
        # Verificar si la contraseña actual es correcta
        if not verify_password(password_data.current_password, user.hashed_password):
            raise ValueError("La contraseña actual no es correcta")
        
        # Actualizar la contraseña
        hashed_password = get_password_hash(password_data.new_password)
        await self.user_repository.update(user_id, {"hashed_password": hashed_password})
        
        return True
    
    async def delete_user(self, user_id: str) -> bool:
        """
        Elimina un usuario
        
        Args:
            user_id: ID del usuario a eliminar
        
        Returns:
            True si se eliminó correctamente, False si no
        """
        return await self.user_repository.delete(user_id)
