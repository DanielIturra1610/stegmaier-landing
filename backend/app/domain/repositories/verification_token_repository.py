"""
Interfaz para el repositorio de tokens de verificación
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from ..entities.verification_token import VerificationToken

class VerificationTokenRepository(ABC):
    """
    Interfaz para el repositorio de tokens de verificación siguiendo el patrón Repository
    """
    @abstractmethod
    async def create(self, verification_token: VerificationToken) -> VerificationToken:
        """Crear un nuevo token de verificación"""
        pass
    
    @abstractmethod
    async def get_by_token(self, token: str) -> Optional[VerificationToken]:
        """Obtener token de verificación por su valor"""
        pass
    
    @abstractmethod
    async def get_by_user_id(self, user_id: str) -> List[VerificationToken]:
        """Obtener tokens de verificación por ID de usuario"""
        pass
    
    @abstractmethod
    async def update(self, token_id: str, token_data: dict) -> Optional[VerificationToken]:
        """Actualizar token de verificación"""
        pass
    
    @abstractmethod
    async def delete(self, token_id: str) -> bool:
        """Eliminar token de verificación"""
        pass
    
    @abstractmethod
    async def mark_as_used(self, token: str) -> Optional[VerificationToken]:
        """Marcar token como utilizado"""
        pass
