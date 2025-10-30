"""
Interfaz para el repositorio de usuarios
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from ..entities.user import User

class UserRepository(ABC):
    """
    Interfaz para el repositorio de usuarios siguiendo el patrón Repository
    """
    @abstractmethod
    async def create(self, user: User) -> User:
        """Crear un nuevo usuario"""
        pass
    
    @abstractmethod
    async def get_by_id(self, user_id: str) -> Optional[User]:
        """Obtener usuario por ID"""
        pass
    
    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[User]:
        """Obtener usuario por email"""
        pass
    
    @abstractmethod
    async def get_by_username(self, username: str) -> Optional[User]:
        """Obtener usuario por nombre de usuario"""
        pass
    
    @abstractmethod
    async def list(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Listar usuarios con paginación"""
        pass
    
    @abstractmethod
    async def update(self, user_id: str, user_data: dict) -> Optional[User]:
        """Actualizar usuario"""
        pass
    
    @abstractmethod
    async def delete(self, user_id: str) -> bool:
        """Eliminar usuario"""
        pass
