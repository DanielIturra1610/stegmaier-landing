"""
Interfaz del repositorio de progreso
"""
from abc import ABC, abstractmethod
from typing import Optional, List

from ..entities.progress import VideoProgress, UserNote, VideoBookmark

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
