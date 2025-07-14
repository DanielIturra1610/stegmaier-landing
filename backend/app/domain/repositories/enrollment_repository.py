"""
Interfaz para el repositorio de inscripciones
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from ..entities.enrollment import Enrollment

class EnrollmentRepository(ABC):
    """
    Interfaz para el repositorio de inscripciones siguiendo el patrón Repository
    """
    @abstractmethod
    async def create(self, enrollment: Enrollment) -> Enrollment:
        """Crear una nueva inscripción"""
        pass
    
    @abstractmethod
    async def get_by_id(self, enrollment_id: str) -> Optional[Enrollment]:
        """Obtener inscripción por ID"""
        pass
    
    @abstractmethod
    async def get_by_user_and_course(self, user_id: str, course_id: str) -> Optional[Enrollment]:
        """Obtener inscripción por usuario y curso"""
        pass
    
    @abstractmethod
    async def get_by_user(self, user_id: str) -> List[Enrollment]:
        """Obtener todas las inscripciones de un usuario"""
        pass
    
    @abstractmethod
    async def get_by_course(self, course_id: str) -> List[Enrollment]:
        """Obtener todas las inscripciones de un curso"""
        pass
    
    @abstractmethod
    async def update_progress(self, enrollment_id: str, progress: float, completed_lessons: List[str]) -> bool:
        """Actualizar progreso de inscripción"""
        pass
    
    @abstractmethod
    async def update_status(self, enrollment_id: str, status: str) -> bool:
        """Actualizar estado de inscripción"""
        pass
    
    @abstractmethod
    async def delete(self, enrollment_id: str) -> bool:
        """Eliminar inscripción"""
        pass
        
    @abstractmethod
    async def issue_certificate(self, enrollment_id: str, certificate_url: str) -> bool:
        """Emitir certificado para una inscripción completada"""
        pass
