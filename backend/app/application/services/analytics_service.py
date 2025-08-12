"""
Servicio para analytics y métricas del sistema
"""
import uuid
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any
from collections import Counter, defaultdict

from ...domain.entities.analytics import UserActivity, CourseAnalytics, UserAnalytics, PlatformMetrics
from ...domain.repositories.analytics_repository import AnalyticsRepository
from ...domain.repositories.user_repository import UserRepository
from ...domain.repositories.course_repository import CourseRepository
from ...domain.repositories.enrollment_repository import EnrollmentRepository
from ...domain.repositories.progress_repository import ProgressRepository

class AnalyticsService:
    def __init__(
        self,
        analytics_repository: AnalyticsRepository,
        user_repository: UserRepository,
        course_repository: CourseRepository,
        enrollment_repository: EnrollmentRepository,
        progress_repository: ProgressRepository
    ):
        self.analytics_repository = analytics_repository
        self.user_repository = user_repository
        self.course_repository = course_repository
        self.enrollment_repository = enrollment_repository
        self.progress_repository = progress_repository
    
    async def track_user_activity(
        self,
        user_id: str,
        activity_type: str,
        resource_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        session_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> UserActivity:
        """
        Registra una actividad de usuario para analytics
        """
        activity = UserActivity(
            id=str(uuid.uuid4()),
            user_id=user_id,
            activity_type=activity_type,
            resource_id=resource_id,
            resource_type=resource_type,
            metadata=metadata or {},
            session_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return await self.analytics_repository.save_user_activity(activity)
    
    async def get_platform_metrics(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Obtiene métricas generales de la plataforma
        """
        if not start_date:
            start_date = date.today() - timedelta(days=30)
        if not end_date:
            end_date = date.today()
        
        # Métricas básicas
        total_users = await self.user_repository.count_all()
        total_courses = await self.course_repository.count_all()
        
        # Usuarios activos (últimos 30 días) - Simulación
        # En una implementación real, esto buscaría actividades en el período
        active_users = min(total_users, max(1, total_users // 2))  # Simular 50% de usuarios activos
        
        # Nuevos usuarios - Simulación
        # En una implementación real, esto filtraría usuarios por fecha de creación
        new_users = max(1, total_users // 10)  # Simular 10% de usuarios nuevos
        
        # Métricas de engagement
        all_enrollments = await self.enrollment_repository.get_all()
        total_enrollments = len(all_enrollments)
        
        # Contar enrollments completados (simulación)
        completed_enrollments = len([e for e in all_enrollments if getattr(e, 'completed', False) or getattr(e, 'progress', 0) >= 100])
        
        # Tiempo de visualización (simulación - devolver 0 por ahora)
        total_watch_time = 0
        
        # Calcular métricas derivadas
        completion_rate = (completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0
        
        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": (end_date - start_date).days + 1
            },
            "users": {
                "total_users": total_users,
                "active_users": active_users,
                "new_users": new_users,
                "user_growth_rate": (new_users / total_users * 100) if total_users > 0 else 0
            },
            "content": {
                "total_courses": total_courses,
                "total_enrollments": total_enrollments,
                "completed_enrollments": completed_enrollments,
                "completion_rate": round(completion_rate, 2)
            },
            "engagement": {
                "total_watch_time_seconds": total_watch_time,
                "total_watch_time_hours": round(total_watch_time / 3600, 2),
                "average_watch_time_per_user": round(total_watch_time / active_users / 3600, 2) if active_users > 0 else 0
            }
        }
    
    async def get_course_analytics(self, course_id: str) -> Dict[str, Any]:
        """
        Obtiene analytics específicos de un curso
        """
        # Información básica del curso
        course = await self.course_repository.get_by_id(course_id)
        if not course:
            return {}
        
        # Estadísticas de enrollments
        enrollments = await self.enrollment_repository.get_by_course_id(course_id)
        total_enrollments = len(enrollments)
        completed_enrollments = len([e for e in enrollments if e.status == "COMPLETED"])
        active_enrollments = len([e for e in enrollments if e.status == "ACTIVE"])
        
        # Progreso de videos
        course_progress = await self.progress_repository.get_course_progress_summary(course_id)
        
        # Calcular métricas
        completion_rate = (completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0
        
        # Tiempo promedio de finalización (en días)
        completion_times = []
        for enrollment in enrollments:
            if enrollment.status == "COMPLETED" and enrollment.enrollment_date:
                # Calcular días entre enrollment y completion
                # Esta lógica necesitaría ser implementada según el modelo de datos
                pass
        
        avg_completion_time = sum(completion_times) / len(completion_times) if completion_times else 0
        
        # Lecciones más populares
        lesson_stats = await self.analytics_repository.get_lesson_popularity_stats(course_id)
        
        return {
            "course_info": {
                "id": course.id,
                "title": course.title,
                "instructor_id": course.instructor_id,
                "created_at": course.created_at.isoformat() if course.created_at else None
            },
            "enrollment_stats": {
                "total_enrollments": total_enrollments,
                "active_enrollments": active_enrollments,
                "completed_enrollments": completed_enrollments,
                "completion_rate": round(completion_rate, 2),
                "average_completion_time_days": round(avg_completion_time, 1)
            },
            "engagement_stats": {
                "total_watch_time": sum([p.get('total_watch_time', 0) for p in course_progress]),
                "average_progress": sum([p.get('watch_percentage', 0) for p in course_progress]) / len(course_progress) if course_progress else 0,
                "most_watched_lesson": lesson_stats.get('most_watched'),
                "least_watched_lesson": lesson_stats.get('least_watched')
            },
            "recent_activity": await self._get_course_recent_activity(course_id)
        }
    
    async def get_user_analytics(self, user_id: str) -> Dict[str, Any]:
        """
        Obtiene analytics específicos de un usuario
        """
        # Información básica del usuario
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            return {}
        
        # Enrollments del usuario
        user_enrollments = await self.enrollment_repository.get_by_user(user_id)
        
        # Progreso de videos del usuario
        user_progress = await self.progress_repository.get_user_progress_summary(user_id)
        
        # Actividad reciente
        recent_activity = await self.analytics_repository.get_user_recent_activity(
            user_id=user_id,
            limit=10
        )
        
        # Calcular métricas
        total_courses = len(user_enrollments)
        completed_courses = len([e for e in user_enrollments if e.status == "COMPLETED"])
        total_watch_time = sum([p.total_watch_time for p in user_progress])
        
        # Calcular racha de login
        login_streak = await self._calculate_login_streak(user_id)
        
        # Categoría favorita
        favorite_category = await self._get_user_favorite_category(user_id)
        
        return {
            "user_info": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
                "created_at": user.created_at.isoformat() if user.created_at else None
            },
            "learning_stats": {
                "total_courses_enrolled": total_courses,
                "completed_courses": completed_courses,
                "completion_rate": (completed_courses / total_courses * 100) if total_courses > 0 else 0,
                "total_watch_time_hours": round(total_watch_time / 3600, 2),
                "average_session_duration": await self._calculate_avg_session_duration(user_id)
            },
            "engagement_stats": {
                "login_streak": login_streak,
                "favorite_category": favorite_category,
                "last_activity": recent_activity[0].created_at.isoformat() if recent_activity else None,
                "activity_score": await self._calculate_activity_score(user_id)
            },
            "recent_activity": [
                {
                    "activity_type": activity.activity_type,
                    "resource_type": activity.resource_type,
                    "created_at": activity.created_at.isoformat() if activity.created_at else None
                }
                for activity in recent_activity[:5]
            ]
        }
    
    async def get_popular_courses(
        self,
        limit: int = 10,
        period_days: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Obtiene los cursos más populares
        """
        since_date = date.today() - timedelta(days=period_days)
        
        # Implementación simplificada - obtener cursos por número de enrollments
        # Obtener todos los enrollments en el período
        enrollments = await self.enrollment_repository.get_all()
        
        # Contar enrollments por curso
        course_counts = defaultdict(int)
        for enrollment in enrollments:
            # Filtrar por fecha si el enrollment tiene created_at
            if hasattr(enrollment, 'created_at') and enrollment.created_at:
                enrollment_date = enrollment.created_at.date()
                if enrollment_date >= since_date:
                    course_counts[enrollment.course_id] += 1
            else:
                # Si no hay fecha, incluir el enrollment
                course_counts[enrollment.course_id] += 1
        
        # Obtener información de cursos y crear respuesta
        popular_courses = []
        for course_id, count in sorted(course_counts.items(), key=lambda x: x[1], reverse=True)[:limit]:
            course = await self.course_repository.get_by_id(course_id)
            if course:
                popular_courses.append({
                    "course_id": course_id,
                    "title": course.title,
                    "instructor_id": course.instructor_id,
                    "enrollment_count": count,
                    "created_at": course.created_at.isoformat() if course.created_at else None
                })
        
        return popular_courses
    
    async def get_revenue_analytics(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """
        Obtiene analytics de ingresos (básico)
        """
        if not start_date:
            start_date = date.today() - timedelta(days=30)
        if not end_date:
            end_date = date.today()
        
        # Esta implementación es básica ya que no tenemos sistema de pagos completo
        # Se basa en enrollments y precios de cursos
        
        # Obtener todos los enrollments (simulando como pagados)
        all_enrollments = await self.enrollment_repository.get_all()
        
        # Filtrar por fecha si está disponible
        enrollments = []
        for enrollment in all_enrollments:
            if hasattr(enrollment, 'created_at') and enrollment.created_at:
                enrollment_date = enrollment.created_at.date()
                if start_date <= enrollment_date <= end_date:
                    enrollments.append(enrollment)
            else:
                # Si no hay fecha, incluir el enrollment
                enrollments.append(enrollment)
        
        total_revenue = 0
        courses_sold = defaultdict(int)
        
        for enrollment in enrollments:
            course = await self.course_repository.get_by_id(enrollment.course_id)
            if course and course.price:
                total_revenue += course.price
                courses_sold[course.id] += 1
        
        return {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "revenue": {
                "total_revenue": total_revenue,
                "total_sales": len(enrollments),
                "average_order_value": total_revenue / len(enrollments) if enrollments else 0
            },
            "top_selling_courses": [
                {
                    "course_id": course_id,
                    "sales_count": count,
                    "revenue": count * (await self.course_repository.get_by_id(course_id)).price
                }
                for course_id, count in courses_sold.most_common(5)
            ]
        }
    
    # Métodos helper privados
    async def _get_course_recent_activity(self, course_id: str) -> List[Dict[str, Any]]:
        """Obtiene actividad reciente de un curso"""
        activities = await self.analytics_repository.get_course_activities(
            course_id=course_id,
            limit=5
        )
        
        return [
            {
                "user_id": activity.user_id,
                "activity_type": activity.activity_type,
                "created_at": activity.created_at.isoformat() if activity.created_at else None
            }
            for activity in activities
        ]
    
    async def _calculate_login_streak(self, user_id: str) -> int:
        """Calcula la racha de login consecutivos"""
        # Implementación básica - obtener actividades de login recientes
        login_activities = await self.analytics_repository.get_user_login_activities(
            user_id=user_id,
            limit=30
        )
        
        if not login_activities:
            return 0
        
        # Contar días consecutivos desde hoy hacia atrás
        streak = 0
        current_date = date.today()
        
        for activity in login_activities:
            activity_date = activity.created_at.date()
            if activity_date == current_date - timedelta(days=streak):
                streak += 1
            else:
                break
        
        return streak
    
    async def _get_user_favorite_category(self, user_id: str) -> Optional[str]:
        """Obtiene la categoría favorita del usuario"""
        enrollments = await self.enrollment_repository.get_by_user(user_id)
        
        if not enrollments:
            return None
        
        # Contar categorías de cursos enrollados
        categories = []
        for enrollment in enrollments:
            course = await self.course_repository.get_by_id(enrollment.course_id)
            if course:
                categories.append(course.category)
        
        if categories:
            return Counter(categories).most_common(1)[0][0]
        
        return None
    
    async def _calculate_avg_session_duration(self, user_id: str) -> float:
        """Calcula la duración promedio de sesión en minutos"""
        # Esta es una implementación simplificada
        # En un sistema real, rastrearíamos sesiones con login/logout
        activities = await self.analytics_repository.get_user_activities(
            user_id=user_id,
            limit=50
        )
        
        if len(activities) < 2:
            return 0.0
        
        # Calcular tiempo promedio entre actividades
        session_times = []
        for i in range(len(activities) - 1):
            time_diff = activities[i].created_at - activities[i+1].created_at
            session_times.append(time_diff.total_seconds() / 60)  # en minutos
        
        return sum(session_times) / len(session_times) if session_times else 0.0
    
    async def _calculate_activity_score(self, user_id: str) -> float:
        """Calcula un score de actividad del usuario (0-100)"""
        # Score basado en múltiples factores
        score = 0.0
        
        # Factor 1: Cursos completados (40 puntos máx)
        user_enrollments = await self.enrollment_repository.get_by_user(user_id)
        total_courses = len(user_enrollments)
        completed_courses = len([e for e in user_enrollments if e.status == "COMPLETED"])
        
        if total_courses > 0:
            completion_factor = (completed_courses / total_courses) * 40
            score += completion_factor
        
        # Factor 2: Tiempo de estudio (30 puntos máx)
        user_progress = await self.progress_repository.get_user_progress_summary(user_id)
        total_watch_time_hours = sum([p.total_watch_time for p in user_progress]) / 3600
        
        # Normalizar tiempo de estudio (10+ horas = máximo score)
        time_factor = min(total_watch_time_hours / 10, 1) * 30
        score += time_factor
        
        # Factor 3: Actividad reciente (30 puntos máx)
        recent_activities = await self.analytics_repository.get_user_recent_activity(
            user_id=user_id,
            days=7,
            limit=50
        )
        
        # Más actividades recientes = mejor score
        activity_factor = min(len(recent_activities) / 10, 1) * 30
        score += activity_factor
        
        return round(score, 2)
