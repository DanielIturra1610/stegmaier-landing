"""
Interfaz del repositorio de analytics
"""
from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from datetime import date

from ..entities.analytics import UserActivity, CourseAnalytics, UserAnalytics, PlatformMetrics

class AnalyticsRepository(ABC):
    """
    Interfaz del repositorio para gestión de analytics
    """
    
    @abstractmethod
    async def save_user_activity(self, activity: UserActivity) -> UserActivity:
        """Guardar actividad de usuario"""
        pass
    
    @abstractmethod
    async def count_active_users(self, start_date: date, end_date: date) -> int:
        """Contar usuarios activos en un período"""
        pass
    
    @abstractmethod
    async def count_new_users(self, start_date: date, end_date: date) -> int:
        """Contar nuevos usuarios en un período"""
        pass
    
    @abstractmethod
    async def get_lesson_popularity_stats(self, course_id: str) -> Dict[str, Any]:
        """Obtener estadísticas de popularidad de lecciones"""
        pass
    
    @abstractmethod
    async def get_user_recent_activity(
        self, 
        user_id: str, 
        limit: int = 10,
        days: Optional[int] = None
    ) -> List[UserActivity]:
        """Obtener actividad reciente de un usuario"""
        pass
    
    @abstractmethod
    async def get_course_activities(
        self, 
        course_id: str, 
        limit: int = 10
    ) -> List[UserActivity]:
        """Obtener actividades recientes de un curso"""
        pass
    
    @abstractmethod
    async def get_course_popularity_stats(
        self, 
        since_date: date, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Obtener estadísticas de popularidad de cursos"""
        pass
    
    @abstractmethod
    async def get_user_login_activities(
        self, 
        user_id: str, 
        limit: int = 30
    ) -> List[UserActivity]:
        """Obtener actividades de login de un usuario"""
        pass
    
    @abstractmethod
    async def get_user_activities(
        self, 
        user_id: str, 
        limit: int = 50
    ) -> List[UserActivity]:
        """Obtener todas las actividades de un usuario"""
        pass
