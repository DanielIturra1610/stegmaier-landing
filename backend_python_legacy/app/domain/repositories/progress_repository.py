"""
Interfaz del repositorio de progreso
"""
from abc import ABC, abstractmethod
from typing import Optional, List

from ..entities.progress import VideoProgress, UserNote, VideoBookmark
from ..entities.course_progress import LessonProgress, CourseProgress, ProgressSummary

class ProgressRepository(ABC):
    """
    Interfaz del repositorio para gestión de progreso de videos
    """
    
    @abstractmethod
    async def save_video_progress(self, progress: VideoProgress) -> VideoProgress:
        """Guardar progreso de video"""
        pass
    
    @abstractmethod
    async def get_video_progress(
        self, 
        user_id: str, 
        lesson_id: str, 
        video_id: str
    ) -> Optional[VideoProgress]:
        """Obtener progreso de video"""
        pass
    
    @abstractmethod
    async def get_user_progress_summary(
        self, 
        user_id: str, 
        course_id: Optional[str] = None
    ) -> List[VideoProgress]:
        """Obtener resumen de progreso del usuario"""
        pass
    
    @abstractmethod
    async def save_bookmark(self, bookmark: VideoBookmark) -> VideoBookmark:
        """Guardar marcador"""
        pass
    
    @abstractmethod
    async def get_video_bookmarks(
        self, 
        user_id: str, 
        lesson_id: str, 
        video_id: str
    ) -> List[VideoBookmark]:
        """Obtener marcadores de video"""
        pass
    
    @abstractmethod
    async def save_note(self, note: UserNote) -> UserNote:
        """Guardar nota"""
        pass
    
    @abstractmethod
    async def get_video_notes(
        self, 
        user_id: str, 
        lesson_id: str, 
        video_id: str
    ) -> List[UserNote]:
       """Obtener notas de video"""
       pass
    
    # === LESSON PROGRESS METHODS ===
    
    @abstractmethod
    async def save_lesson_progress(self, progress: LessonProgress) -> LessonProgress:
        """Guardar progreso de lección"""
        pass
    
    @abstractmethod
    async def get_lesson_progress(
        self, 
        user_id: str, 
        lesson_id: str
    ) -> Optional[LessonProgress]:
        """Obtener progreso de lección específica"""
        pass
    
    @abstractmethod
    async def get_course_lessons_progress(
        self, 
        user_id: str, 
        course_id: str
    ) -> List[LessonProgress]:
        """Obtener progreso de todas las lecciones de un curso"""
        pass
    
    @abstractmethod
    async def mark_lesson_completed(
        self, 
        user_id: str, 
        lesson_id: str
    ) -> LessonProgress:
        """Marcar lección como completada"""
        pass
    
    # === COURSE PROGRESS METHODS ===
    
    @abstractmethod
    async def save_course_progress(self, progress: CourseProgress) -> CourseProgress:
        """Guardar progreso de curso"""
        pass
    
    @abstractmethod
    async def get_course_progress(
        self, 
        user_id: str, 
        course_id: str
    ) -> Optional[CourseProgress]:
        """Obtener progreso de curso"""
        pass
    
    @abstractmethod
    async def recalculate_course_progress(
        self, 
        user_id: str, 
        course_id: str
    ) -> CourseProgress:
        """Recalcular progreso del curso basado en lecciones"""
        pass
    
    @abstractmethod
    async def get_user_progress_summary(
        self, 
        user_id: str
    ) -> ProgressSummary:
        """Obtener resumen completo de progreso del usuario"""
        pass
    
    @abstractmethod
    async def get_user_active_courses(
        self, 
        user_id: str
    ) -> List[CourseProgress]:
        """Obtener cursos activos del usuario"""
        pass
