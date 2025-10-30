"""
Interfaces de repositorio para gestión de media
"""
from abc import ABC, abstractmethod
from typing import Optional, List

from ..entities.media import VideoAsset, ImageAsset

class MediaRepository(ABC):
    """
    Interfaz del repositorio para gestión de archivos multimedia
    """
    
    @abstractmethod
    async def save_video(self, video_asset: VideoAsset) -> VideoAsset:
        """Guardar metadata de video"""
        pass
    
    @abstractmethod
    async def save_image(self, image_asset: ImageAsset) -> ImageAsset:
        """Guardar metadata de imagen"""
        pass
    
    @abstractmethod
    async def get_video_by_id(self, video_id: str) -> Optional[VideoAsset]:
        """Obtener video por ID"""
        pass
    
    @abstractmethod
    async def get_image_by_id(self, image_id: str) -> Optional[ImageAsset]:
        """Obtener imagen por ID"""
        pass
    
    @abstractmethod
    async def delete_video(self, video_id: str) -> bool:
        """Eliminar video"""
        pass
    
    @abstractmethod
    async def delete_image(self, image_id: str) -> bool:
        """Eliminar imagen"""
        pass
    
    @abstractmethod
    async def list_videos(self, uploaded_by: Optional[str] = None) -> List[VideoAsset]:
        """Listar videos"""
        pass
