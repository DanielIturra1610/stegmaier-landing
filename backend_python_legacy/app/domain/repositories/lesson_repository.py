"""
Interfaz para el repositorio de lecciones
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from ..entities.lesson import Lesson

class LessonRepository(ABC):
    """
    Interfaz para el repositorio de lecciones siguiendo el patrón Repository
    """
    @abstractmethod
    async def create(self, lesson: Lesson) -> Lesson:
        """Crear una nueva lección"""
        pass
    
    @abstractmethod
    async def get_by_id(self, lesson_id: str) -> Optional[Lesson]:
        """Obtener lección por ID"""
        pass
    
    @abstractmethod
    async def get_by_course(self, course_id: str) -> List[Lesson]:
        """Obtener todas las lecciones de un curso"""
        pass
    
    @abstractmethod
    async def list(self, skip: int = 0, limit: int = 100) -> List[Lesson]:
        """Listar lecciones con paginación"""
        pass
    
    @abstractmethod
    async def update(self, lesson_id: str, lesson_data: dict) -> Optional[Lesson]:
        """Actualizar lección"""
        pass
    
    @abstractmethod
    async def delete(self, lesson_id: str) -> bool:
        """Eliminar lección"""
        pass
    
    @abstractmethod
    async def reorder(self, course_id: str, lesson_order: List[dict]) -> bool:
        """Reordenar lecciones de un curso"""
        pass
