"""
Implementación del repositorio de analytics usando JSON local
"""
import json
import uuid
from typing import Optional, List, Dict, Any
from pathlib import Path
from datetime import datetime, date, timedelta
from collections import defaultdict

from ...domain.entities.analytics import UserActivity, CourseAnalytics, UserAnalytics, PlatformMetrics
from ...domain.repositories.analytics_repository import AnalyticsRepository
from ...core.config import settings

class FileSystemAnalyticsRepository(AnalyticsRepository):
    """
    Implementación del repositorio de analytics usando sistema de archivos local
    """
    
    def __init__(self):
        self.base_path = Path(settings.MEDIA_ROOT if hasattr(settings, 'MEDIA_ROOT') else 'data')
        self.analytics_path = self.base_path / "analytics"
        self.activities_file = self.analytics_path / "user_activities.json"
        self.platform_metrics_file = self.analytics_path / "platform_metrics.json"
        
        # Crear directorios necesarios
        self.analytics_path.mkdir(parents=True, exist_ok=True)
        
        # Inicializar archivos
        self._init_files()
    
    def _init_files(self):
        """Inicializar archivos JSON si no existen"""
        if not self.activities_file.exists():
            self._save_json(self.activities_file, [])
        
        if not self.platform_metrics_file.exists():
            self._save_json(self.platform_metrics_file, {})
    
    def _load_json(self, file_path: Path) -> Any:
        """Cargar datos JSON desde archivo"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return [] if 'activities' in str(file_path) else {}
    
    def _save_json(self, file_path: Path, data: Any):
        """Guardar datos JSON en archivo"""
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, default=str)
    
    async def save_user_activity(self, activity: UserActivity) -> UserActivity:
        """Guardar actividad de usuario"""
        if not activity.id:
            activity.id = str(uuid.uuid4())
        
        activities_data = self._load_json(self.activities_file)
        
        activity_dict = {
            'id': activity.id,
            'user_id': activity.user_id,
            'activity_type': activity.activity_type,
            'resource_id': activity.resource_id,
            'resource_type': activity.resource_type,
            'metadata': activity.metadata,
            'session_id': activity.session_id,
            'ip_address': activity.ip_address,
            'user_agent': activity.user_agent,
            'created_at': activity.created_at.isoformat() if activity.created_at else None
        }
        
        activities_data.append(activity_dict)
        
        # Mantener solo las últimas 10000 actividades para evitar archivos muy grandes
        if len(activities_data) > 10000:
            activities_data = activities_data[-10000:]
        
        self._save_json(self.activities_file, activities_data)
        return activity
    
    async def count_active_users(self, start_date: date, end_date: date) -> int:
        """Contar usuarios activos en un período"""
        activities_data = self._load_json(self.activities_file)
        active_users = set()
        
        for activity in activities_data:
            if activity.get('created_at'):
                activity_date = datetime.fromisoformat(activity['created_at']).date()
                if start_date <= activity_date <= end_date:
                    active_users.add(activity['user_id'])
        
        return len(active_users)
    
    async def count_new_users(self, start_date: date, end_date: date) -> int:
        """Contar nuevos usuarios en un período"""
        activities_data = self._load_json(self.activities_file)
        new_users = set()
        
        for activity in activities_data:
            if (activity.get('activity_type') == 'user_registered' and 
                activity.get('created_at')):
                activity_date = datetime.fromisoformat(activity['created_at']).date()
                if start_date <= activity_date <= end_date:
                    new_users.add(activity['user_id'])
        
        return len(new_users)
    
    async def get_lesson_popularity_stats(self, course_id: str) -> Dict[str, Any]:
        """Obtener estadísticas de popularidad de lecciones"""
        activities_data = self._load_json(self.activities_file)
        lesson_views = defaultdict(int)
        
        for activity in activities_data:
            if (activity.get('activity_type') == 'lesson_view' and
                activity.get('metadata', {}).get('course_id') == course_id):
                lesson_id = activity.get('resource_id')
                if lesson_id:
                    lesson_views[lesson_id] += 1
        
        if not lesson_views:
            return {'most_watched': None, 'least_watched': None}
        
        sorted_lessons = sorted(lesson_views.items(), key=lambda x: x[1], reverse=True)
        
        return {
            'most_watched': sorted_lessons[0][0] if sorted_lessons else None,
            'least_watched': sorted_lessons[-1][0] if sorted_lessons else None,
            'view_counts': dict(lesson_views)
        }
    
    async def get_user_recent_activity(
        self, 
        user_id: str, 
        limit: int = 10,
        days: Optional[int] = None
    ) -> List[UserActivity]:
        """Obtener actividad reciente de un usuario"""
        activities_data = self._load_json(self.activities_file)
        user_activities = []
        
        cutoff_date = None
        if days:
            cutoff_date = datetime.now() - timedelta(days=days)
        
        for activity_dict in activities_data:
            if activity_dict.get('user_id') == user_id:
                if cutoff_date and activity_dict.get('created_at'):
                    activity_date = datetime.fromisoformat(activity_dict['created_at'])
                    if activity_date < cutoff_date:
                        continue
                
                activity = UserActivity(
                    id=activity_dict.get('id'),
                    user_id=activity_dict.get('user_id', ''),
                    activity_type=activity_dict.get('activity_type', ''),
                    resource_id=activity_dict.get('resource_id'),
                    resource_type=activity_dict.get('resource_type'),
                    metadata=activity_dict.get('metadata', {}),
                    session_id=activity_dict.get('session_id'),
                    ip_address=activity_dict.get('ip_address'),
                    user_agent=activity_dict.get('user_agent'),
                    created_at=datetime.fromisoformat(activity_dict['created_at']) if activity_dict.get('created_at') else None
                )
                user_activities.append(activity)
        
        # Ordenar por fecha más reciente primero
        user_activities.sort(key=lambda x: x.created_at or datetime.min, reverse=True)
        
        return user_activities[:limit]
    
    async def get_course_activities(
        self, 
        course_id: str, 
        limit: int = 10
    ) -> List[UserActivity]:
        """Obtener actividades recientes de un curso"""
        activities_data = self._load_json(self.activities_file)
        course_activities = []
        
        for activity_dict in activities_data:
            # Buscar actividades relacionadas con el curso
            is_course_related = (
                activity_dict.get('resource_id') == course_id or
                activity_dict.get('metadata', {}).get('course_id') == course_id
            )
            
            if is_course_related:
                activity = UserActivity(
                    id=activity_dict.get('id'),
                    user_id=activity_dict.get('user_id', ''),
                    activity_type=activity_dict.get('activity_type', ''),
                    resource_id=activity_dict.get('resource_id'),
                    resource_type=activity_dict.get('resource_type'),
                    metadata=activity_dict.get('metadata', {}),
                    created_at=datetime.fromisoformat(activity_dict['created_at']) if activity_dict.get('created_at') else None
                )
                course_activities.append(activity)
        
        # Ordenar por fecha más reciente primero
        course_activities.sort(key=lambda x: x.created_at or datetime.min, reverse=True)
        
        return course_activities[:limit]
    
    async def get_course_popularity_stats(
        self, 
        since_date: date, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Obtener estadísticas de popularidad de cursos"""
        activities_data = self._load_json(self.activities_file)
        course_enrollments = defaultdict(int)
        course_info = {}
        
        for activity in activities_data:
            if (activity.get('activity_type') == 'course_enrollment' and
                activity.get('created_at')):
                activity_date = datetime.fromisoformat(activity['created_at']).date()
                if activity_date >= since_date:
                    course_id = activity.get('resource_id')
                    if course_id:
                        course_enrollments[course_id] += 1
                        if course_id not in course_info:
                            course_info[course_id] = {
                                'course_id': course_id,
                                'title': activity.get('metadata', {}).get('course_title', f'Curso {course_id}'),
                                'enrollments_count': 0,
                                'completion_rate': 0.0,
                                'average_rating': 4.2  # Valor por defecto
                            }
        
        # Actualizar contadores
        for course_id, count in course_enrollments.items():
            if course_id in course_info:
                course_info[course_id]['enrollments_count'] = count
        
        # Ordenar por popularidad y limitar
        sorted_courses = sorted(
            course_info.values(),
            key=lambda x: x['enrollments_count'],
            reverse=True
        )
        
        return sorted_courses[:limit]
    
    async def get_user_login_activities(
        self, 
        user_id: str, 
        limit: int = 30
    ) -> List[UserActivity]:
        """Obtener actividades de login de un usuario"""
        activities_data = self._load_json(self.activities_file)
        login_activities = []
        
        for activity_dict in activities_data:
            if (activity_dict.get('user_id') == user_id and
                activity_dict.get('activity_type') == 'login'):
                
                activity = UserActivity(
                    id=activity_dict.get('id'),
                    user_id=activity_dict.get('user_id', ''),
                    activity_type=activity_dict.get('activity_type', ''),
                    created_at=datetime.fromisoformat(activity_dict['created_at']) if activity_dict.get('created_at') else None
                )
                login_activities.append(activity)
        
        # Ordenar por fecha más reciente primero
        login_activities.sort(key=lambda x: x.created_at or datetime.min, reverse=True)
        
        return login_activities[:limit]
    
    async def get_user_activities(
        self, 
        user_id: str, 
        limit: int = 50
    ) -> List[UserActivity]:
        """Obtener todas las actividades de un usuario"""
        return await self.get_user_recent_activity(user_id, limit)
