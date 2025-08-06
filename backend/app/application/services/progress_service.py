"""
Servicio para gestión de progreso granular de videos
"""
import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

from ...domain.entities.progress import VideoProgress, UserNote, VideoBookmark
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
        
        return {
            "total_videos": total_videos,
            "completed_videos": completed_videos,
            "completion_rate": (completed_videos / total_videos * 100) if total_videos > 0 else 0,
            "total_watch_time_seconds": total_watch_time,
            "total_watch_time_formatted": self._format_duration(total_watch_time),
            "average_completion_percentage": round(average_completion, 2),
            "videos": [
                {
                    "lesson_id": p.lesson_id,
                    "video_id": p.video_id,
                    "current_position": p.current_position,
                    "watch_percentage": p.watch_percentage,
                    "is_completed": p.is_completed,
                    "last_watched": p.last_watched.isoformat() if p.last_watched else None,
                    "total_watch_time": p.total_watch_time
                }
                for p in progress_list
            ]
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
        # TODO: Implementar lógica para actualizar progreso del curso
        # Esto debería actualizar el enrollment correspondiente
        pass
    
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
