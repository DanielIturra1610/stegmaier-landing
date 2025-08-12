"""
Servicio para gestión de progreso granular de videos
"""
import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

from ...domain.entities.progress import VideoProgress, UserNote, VideoBookmark
from ...domain.entities.course_progress import LessonProgress, CourseProgress, ProgressSummary, ProgressStatus
from ...domain.repositories.progress_repository import ProgressRepository
from ...domain.repositories.enrollment_repository import EnrollmentRepository

class ProgressService:
    def __init__(
        self, 
        progress_repository: ProgressRepository,
        enrollment_repository: EnrollmentRepository
    ):
        self.progress_repository = progress_repository
        self.enrollment_repository = enrollment_repository
    
    async def update_video_progress(
        self,
        user_id: str,
        lesson_id: str,
        video_id: str,
        current_position: float,
        duration: float,
        session_time: int = 0
    ) -> VideoProgress:
        """
        Actualiza el progreso de un video específico
        """
        # Obtener progreso existente o crear nuevo
        progress = await self.progress_repository.get_video_progress(
            user_id=user_id,
            lesson_id=lesson_id,
            video_id=video_id
        )
        
        if not progress:
            progress = VideoProgress(
                id=str(uuid.uuid4()),
                user_id=user_id,
                lesson_id=lesson_id,
                video_id=video_id,
                duration=duration
            )
        
        # Actualizar posición y estadísticas
        progress.current_position = current_position
        progress.duration = duration if duration > 0 else progress.duration
        progress.last_watched = datetime.utcnow()
        progress.total_watch_time += session_time
        
        # Calcular porcentaje visto
        if progress.duration > 0:
            progress.watch_percentage = min((current_position / progress.duration) * 100, 100)
        
        # Determinar si está completo
        was_completed = progress.is_completed
        progress.is_completed = progress.watch_percentage >= progress.completion_threshold
        
        # Incrementar sesiones si es nueva sesión
        if session_time > 0:
            progress.watch_sessions += 1
        
        progress.updated_at = datetime.utcnow()
        
        # Guardar progreso
        saved_progress = await self.progress_repository.save_video_progress(progress)
        
        # Si se completó por primera vez, actualizar progreso general del curso
        if not was_completed and progress.is_completed:
            await self._update_course_progress(user_id, lesson_id)
        
        return saved_progress
    
    async def get_video_progress(
        self,
        user_id: str,
        lesson_id: str,
        video_id: str
    ) -> Optional[VideoProgress]:
        """
        Obtiene el progreso de un video específico
        """
        return await self.progress_repository.get_video_progress(
            user_id=user_id,
            lesson_id=lesson_id,
            video_id=video_id
        )
    
    async def get_user_video_progress_summary(
        self,
        user_id: str,
        course_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Obtiene resumen del progreso de videos de un usuario
        """
        progress_list = await self.progress_repository.get_user_progress_summary(
            user_id=user_id,
            course_id=course_id
        )
        
        # Calcular estadísticas
        total_videos = len(progress_list)
        completed_videos = sum(1 for p in progress_list if p.is_completed)
        total_watch_time = sum(p.total_watch_time for p in progress_list)
        average_completion = sum(p.watch_percentage for p in progress_list) / total_videos if total_videos > 0 else 0
        
        # Construir estructura de datos que espera el frontend
        summary_data = {
            "total_videos": total_videos,
            "completed_videos": completed_videos,
            "completion_rate": (completed_videos / total_videos * 100) if total_videos > 0 else 0,
            "total_watch_time_seconds": total_watch_time,
            "total_watch_time_formatted": self._format_duration(total_watch_time),
            "average_completion_percentage": round(average_completion, 2)
        }
        
        recent_courses = [
            {
                "lesson_id": p.lesson_id,
                "video_id": p.video_id,
                "current_position": p.current_position,
                "watch_percentage": p.watch_percentage,
                "is_completed": p.is_completed,
                "last_watched": p.last_watched.isoformat() if p.last_watched else None,
                "total_watch_time": p.total_watch_time,
                "course_id": p.course_id,
                "status": "in_progress" if p.watch_percentage > 0 and not p.is_completed else ("completed" if p.is_completed else "not_started")
            }
            for p in progress_list
        ]
        
        return {
            "summary": summary_data,
            "recent_courses": recent_courses,
            "videos": recent_courses  # Mantenemos compatibilidad con ambos nombres
        }
    
    async def add_video_bookmark(
        self,
        user_id: str,
        lesson_id: str,
        video_id: str,
        timestamp: float,
        title: str,
        description: str = ""
    ) -> VideoBookmark:
        """
        Añade un marcador a un video
        """
        bookmark = VideoBookmark(
            id=str(uuid.uuid4()),
            user_id=user_id,
            lesson_id=lesson_id,
            video_id=video_id,
            timestamp=timestamp,
            title=title,
            description=description
        )
        
        return await self.progress_repository.save_bookmark(bookmark)
    
    async def get_video_bookmarks(
        self,
        user_id: str,
        lesson_id: str,
        video_id: str
    ) -> List[VideoBookmark]:
        """
        Obtiene los marcadores de un video
        """
        return await self.progress_repository.get_video_bookmarks(
            user_id=user_id,
            lesson_id=lesson_id,
            video_id=video_id
        )
    
    async def add_video_note(
        self,
        user_id: str,
        lesson_id: str,
        video_id: str,
        timestamp: float,
        content: str,
        is_private: bool = True
    ) -> UserNote:
        """
        Añade una nota a un video
        """
        note = UserNote(
            id=str(uuid.uuid4()),
            user_id=user_id,
            lesson_id=lesson_id,
            video_id=video_id,
            timestamp=timestamp,
            content=content,
            is_private=is_private
        )
        
        return await self.progress_repository.save_note(note)
    
    async def get_video_notes(
        self,
        user_id: str,
        lesson_id: str,
        video_id: str
    ) -> List[UserNote]:
        """
        Obtiene las notas de un video
        """
        return await self.progress_repository.get_video_notes(
            user_id=user_id,
            lesson_id=lesson_id,
            video_id=video_id
        )
    
    async def _update_course_progress(self, user_id: str, lesson_id: str):
        """
        Actualiza el progreso general del curso cuando se completa una lección
        """
        try:
            # Obtener el enrollment del usuario para esta lección
            # Nota: Necesitaríamos lesson_repository para obtener course_id desde lesson_id
            # Por ahora, implementamos lógica básica que se puede extender
            
            # Verificar que el usuario tenga un enrollment activo
            enrollments = await self.enrollment_repository.get_user_enrollments(
                user_id=user_id, 
                active_only=True
            )
            
            if not enrollments:
                print(f"⚠️  No active enrollments found for user {user_id}")
                return
                
            # Por simplicidad, actualizamos el timestamp de última actividad
            # En una implementación completa, calcularíamos porcentaje de progreso
            for enrollment in enrollments:
                # Actualizar última actividad del enrollment
                await self.enrollment_repository.update_last_activity(
                    enrollment_id=enrollment.id,
                    last_activity=datetime.utcnow()
                )
                
            print(f"✅ Course progress updated for user {user_id}, lesson {lesson_id}")
            
        except Exception as e:
            print(f"❌ Error updating course progress: {e}")
            # No fallar el video progress si el course progress falla
    
    def _format_duration(self, seconds: int) -> str:
        """
        Formatea duración en segundos a formato legible
        """
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        seconds = seconds % 60
        
        if hours > 0:
            return f"{hours}h {minutes}m {seconds}s"
        elif minutes > 0:
            return f"{minutes}m {seconds}s"
        else:
            return f"{seconds}s"
    
    # === LESSON PROGRESS METHODS ===
    
    async def start_lesson(self, user_id: str, lesson_id: str, course_id: str, enrollment_id: str) -> LessonProgress:
        """
        Iniciar una lección (marcar como empezada)
        """
        try:
            # Verificar si ya existe progreso
            existing_progress = await self.progress_repository.get_lesson_progress(user_id, lesson_id)
            
            if existing_progress:
                # Ya existe, solo actualizar timestamp de acceso
                existing_progress.mark_started()
                return await self.progress_repository.save_lesson_progress(existing_progress)
            
            # Crear nuevo progreso
            new_progress = LessonProgress(
                user_id=user_id,
                lesson_id=lesson_id,
                course_id=course_id,
                enrollment_id=enrollment_id,
                content_type="video"  # Default, se puede especificar
            )
            
            new_progress.mark_started()
            saved_progress = await self.progress_repository.save_lesson_progress(new_progress)
            
            # Actualizar progreso del curso
            await self._update_course_progress_from_lessons(user_id, course_id)
            
            return saved_progress
            
        except Exception as e:
            print(f"❌ Error starting lesson: {e}")
            raise e
    
    async def complete_lesson(self, user_id: str, lesson_id: str, course_id: str, enrollment_id: str) -> LessonProgress:
        """
        Completar una lección
        """
        try:
            # Obtener progreso existente o crear uno
            progress = await self.progress_repository.get_lesson_progress(user_id, lesson_id)
            
            if not progress:
                progress = LessonProgress(
                    user_id=user_id,
                    lesson_id=lesson_id,
                    course_id=course_id,
                    enrollment_id=enrollment_id
                )
            
            # Marcar como completado
            progress.mark_completed()
            saved_progress = await self.progress_repository.save_lesson_progress(progress)
            
            # Actualizar progreso del curso
            await self._update_course_progress_from_lessons(user_id, course_id)
            
            # Verificar si el curso está completo para certificado
            course_progress = await self.progress_repository.get_course_progress(user_id, course_id)
            if course_progress and course_progress.should_issue_certificate():
                await self._issue_certificate(user_id, course_id)
            
            return saved_progress
            
        except Exception as e:
            print(f"❌ Error completing lesson: {e}")
            raise e
    
    async def update_lesson_progress(
        self, 
        user_id: str, 
        lesson_id: str, 
        course_id: str,
        enrollment_id: str,
        progress_percentage: float = None,
        time_spent_delta: int = 0,
        video_position: int = None,
        quiz_score: float = None
    ) -> LessonProgress:
        """
        Actualizar progreso de lección
        """
        try:
            # Obtener progreso existente o crear uno
            progress = await self.progress_repository.get_lesson_progress(user_id, lesson_id)
            
            if not progress:
                progress = LessonProgress(
                    user_id=user_id,
                    lesson_id=lesson_id,
                    course_id=course_id,
                    enrollment_id=enrollment_id
                )
            
            # Actualizar campos según parámetros
            if progress_percentage is not None:
                progress.update_progress(progress_percentage, time_spent_delta)
            
            if time_spent_delta > 0:
                progress.time_spent += time_spent_delta
                progress.last_accessed_at = datetime.utcnow()
                progress.updated_at = datetime.utcnow()
            
            if video_position is not None:
                progress.video_position = video_position
            
            if quiz_score is not None:
                progress.quiz_score = quiz_score
                progress.quiz_attempts += 1
            
            # Guardar cambios
            saved_progress = await self.progress_repository.save_lesson_progress(progress)
            
            # Actualizar progreso del curso si es necesario
            if progress_percentage is not None or quiz_score is not None:
                await self._update_course_progress_from_lessons(user_id, course_id)
            
            return saved_progress
            
        except Exception as e:
            print(f"❌ Error updating lesson progress: {e}")
            raise e
    
    async def get_lesson_progress(self, user_id: str, lesson_id: str) -> Optional[LessonProgress]:
        """
        Obtener progreso de una lección específica
        """
        return await self.progress_repository.get_lesson_progress(user_id, lesson_id)
    
    # === COURSE PROGRESS METHODS ===
    
    async def get_course_progress(self, user_id: str, course_id: str) -> Optional[CourseProgress]:
        """
        Obtener progreso completo del curso
        """
        try:
            # Obtener course progress base
            course_progress = await self.progress_repository.get_course_progress(user_id, course_id)
            
            if course_progress:
                # Cargar lessons progress
                lessons_progress = await self.progress_repository.get_course_lessons_progress(user_id, course_id)
                course_progress.lessons_progress = lessons_progress
            
            return course_progress
            
        except Exception as e:
            print(f"❌ Error getting course progress: {e}")
            return None
    
    async def get_detailed_course_progress(self, user_id: str, course_id: str) -> Dict[str, Any]:
        """
        Obtener progreso detallado del curso con información adicional
        """
        try:
            course_progress = await self.get_course_progress(user_id, course_id)
            
            if not course_progress:
                return {
                    "course_progress": None,
                    "lessons_progress": [],
                    "next_lesson": None,
                    "completion_percentage": 0.0
                }
            
            # Obtener próxima lección
            next_lesson = course_progress.get_next_lesson()
            
            return {
                "course_progress": course_progress,
                "lessons_progress": course_progress.lessons_progress,
                "next_lesson": next_lesson,
                "completion_percentage": course_progress.progress_percentage,
                "total_time_spent": course_progress.total_time_spent,
                "certificate_available": course_progress.should_issue_certificate()
            }
            
        except Exception as e:
            print(f"❌ Error getting detailed course progress: {e}")
            return {"error": str(e)}
    
    async def get_user_progress_summary(self, user_id: str) -> ProgressSummary:
        """
        Obtener resumen completo de progreso del usuario
        """
        return await self.progress_repository.get_user_progress_summary(user_id)
    
    async def _update_course_progress_from_lessons(self, user_id: str, course_id: str):
        """
        Actualizar progreso del curso basado en progreso de lecciones
        """
        try:
            await self.progress_repository.recalculate_course_progress(user_id, course_id)
            print(f"✅ Course progress recalculated for user {user_id}, course {course_id}")
            
        except Exception as e:
            print(f"❌ Error recalculating course progress: {e}")
    
    async def _issue_certificate(self, user_id: str, course_id: str):
        """
        Emitir certificado cuando se completa un curso
        """
        try:
            course_progress = await self.progress_repository.get_course_progress(user_id, course_id)
            
            if course_progress and course_progress.should_issue_certificate():
                # Generar URL del certificado (implementación simplificada)
                certificate_url = f"/certificates/{user_id}/{course_id}/{course_progress.id}"
                
                # Marcar certificado como emitido
                course_progress.certificate_issued = True
                course_progress.certificate_issued_at = datetime.utcnow()
                course_progress.certificate_url = certificate_url
                
                await self.progress_repository.save_course_progress(course_progress)
                
                print(f"🏆 Certificate issued for user {user_id}, course {course_id}")
                
                # TODO: Enviar notificación al usuario
                # TODO: Generar PDF del certificado
                
        except Exception as e:
            print(f"❌ Error issuing certificate: {e}")
