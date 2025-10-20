"""
Interfaz para el repositorio de reseñas
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from ..entities.review import Review

class ReviewRepository(ABC):
    """
    Interfaz para el repositorio de reseñas siguiendo el patrón Repository
    """
    @abstractmethod
    async def create(self, review: Review) -> Review:
        """Crear una nueva reseña"""
        pass
    
    @abstractmethod
    async def get_by_id(self, review_id: str) -> Optional[Review]:
        """Obtener reseña por ID"""
        pass
    
    @abstractmethod
    async def get_by_user_and_course(self, user_id: str, course_id: str) -> Optional[Review]:
        """Obtener reseña por usuario y curso"""
        pass
    
    @abstractmethod
    async def get_by_course(self, course_id: str, skip: int = 0, limit: int = 100) -> List[Review]:
        """Obtener todas las reseñas de un curso"""
        pass
    
    @abstractmethod
    async def get_by_user(self, user_id: str) -> List[Review]:
        """Obtener todas las reseñas de un usuario"""
        pass
    
    @abstractmethod
    async def update(self, review_id: str, review_data: dict) -> Optional[Review]:
        """Actualizar reseña"""
        pass
    
    @abstractmethod
    async def delete(self, review_id: str) -> bool:
        """Eliminar reseña"""
        pass
    
    @abstractmethod
    async def calculate_course_average(self, course_id: str) -> float:
        """Calcular promedio de calificaciones de un curso"""
        pass
