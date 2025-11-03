"""
Interfaz para el repositorio de cursos
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from ..entities.course import Course

class CourseRepository(ABC):
    """
    Interfaz para el repositorio de cursos siguiendo el patrón Repository
    """
    @abstractmethod
    async def create(self, course: Course) -> Course:
        """Crear un nuevo curso"""
        pass
    
    @abstractmethod
    async def get_by_id(self, course_id: str) -> Optional[Course]:
        """Obtener curso por ID"""
        pass
    
    @abstractmethod
    async def list(self, skip: int = 0, limit: int = 100, **filters) -> List[Course]:
        """Listar cursos con paginación y filtros opcionales"""
        pass
    
    @abstractmethod
    async def get_by_instructor(self, instructor_id: str) -> List[Course]:
        """Obtener cursos por instructor"""
        pass
    
    @abstractmethod
    async def search(self, query: str, skip: int = 0, limit: int = 100) -> List[Course]:
        """Buscar cursos por título, descripción o etiquetas"""
        pass
    
    @abstractmethod
    async def update(self, course_id: str, course_data: dict) -> Optional[Course]:
        """Actualizar curso"""
        pass
    
    @abstractmethod
    async def delete(self, course_id: str) -> bool:
        """Eliminar curso"""
        pass
    
    @abstractmethod
    async def update_rating(self, course_id: str, new_rating: float) -> bool:
        """Actualizar calificación promedio del curso"""
        pass
