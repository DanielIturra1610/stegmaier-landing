"""
Servicio para gestión de archivos multimedia
Maneja upload, almacenamiento y metadata de videos e imágenes
"""
import os
import json
import shutil
from typing import Optional, Dict, Any
from pathlib import Path
from datetime import datetime
from fastapi import UploadFile

from ...core.config import settings
from ...domain.entities.media import VideoAsset, ImageAsset
from ...domain.repositories.media_repository import MediaRepository

class MediaService:
    def __init__(self, media_repository: MediaRepository):
        self.media_repository = media_repository
        
        # Configurar directorios de almacenamiento
        self.base_media_dir = Path(settings.MEDIA_ROOT if hasattr(settings, 'MEDIA_ROOT') else 'media')
        self.videos_dir = self.base_media_dir / 'videos'
        self.images_dir = self.base_media_dir / 'images'
        self.covers_dir = self.images_dir / 'covers'
        
        # Crear directorios si no existen
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Crear directorios necesarios si no existen"""
        self.videos_dir.mkdir(parents=True, exist_ok=True)
        self.images_dir.mkdir(parents=True, exist_ok=True)
        self.covers_dir.mkdir(parents=True, exist_ok=True)
    
    async def save_video_file(
        self, 
        file: UploadFile, 
        filename: str,
        title: str,
        description: Optional[str] = None,
        user_id: str = None
    ) -> Dict[str, Any]:
        """
        Guarda un archivo de video en el sistema de archivos y metadata en BD
        """
        try:
            # Ruta completa del archivo
            file_path = self.videos_dir / filename
            
            # Guardar archivo físico
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Obtener información básica del archivo
            file_size = os.path.getsize(file_path)
            
            # Crear registro en base de datos
            video_asset = VideoAsset(
                original_filename=file.filename,
                stored_filename=filename,
                file_path=str(file_path),
                file_size=file_size,
                title=title,
                description=description,
                uploaded_by=user_id,
                upload_date=datetime.utcnow(),
                mime_type=file.content_type or 'video/mp4',
                duration=0,  # TODO: Extraer duración real del video
                status='uploaded'
            )
            
            # Guardar en repositorio
            saved_video = await self.media_repository.save_video(video_asset)
            
            return {
                "id": saved_video.id,
                "title": saved_video.title,
                "original_filename": saved_video.original_filename,
                "file_size": saved_video.file_size,
                "duration": saved_video.duration,
                "url": f"/api/v1/media/videos/{saved_video.id}/stream",
                "file_path": str(file_path),
                "upload_date": saved_video.upload_date.isoformat()
            }
            
        except Exception as e:
            # Limpiar archivo si hubo error en BD
            if file_path.exists():
                file_path.unlink()
            raise e
    
    async def save_image_file(
        self,
        file: UploadFile,
        filename: str,
        purpose: str,
        user_id: str = None
    ) -> Dict[str, Any]:
        """
        Guarda un archivo de imagen
        """
        try:
            # Seleccionar directorio según propósito
            if purpose == 'course_cover':
                save_dir = self.covers_dir
            else:
                save_dir = self.images_dir
            
            file_path = save_dir / filename
            
            # Guardar archivo físico
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Obtener información del archivo
            file_size = os.path.getsize(file_path)
            file_extension = Path(filename).suffix.lower()
            
            # Crear registro en base de datos
            image_asset = ImageAsset(
                original_filename=file.filename,
                stored_filename=filename,
                file_path=str(file_path),
                file_size=file_size,
                purpose=purpose,
                uploaded_by=user_id,
                upload_date=datetime.utcnow(),
                mime_type=file.content_type or f'image/{file_extension[1:]}',
                extension=file_extension
            )
            
            # Guardar en repositorio
            saved_image = await self.media_repository.save_image(image_asset)
            
            return {
                "id": saved_image.id,
                "original_filename": saved_image.original_filename,
                "file_size": saved_image.file_size,
                "purpose": saved_image.purpose,
                "url": f"/api/v1/media/images/{saved_image.id}",
                "file_path": str(file_path),
                "upload_date": saved_image.upload_date.isoformat()
            }
            
        except Exception as e:
            # Limpiar archivo si hubo error
            if file_path.exists():
                file_path.unlink()
            raise e
    
    async def get_video_info(self, video_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene información de un video por ID
        """
        video = await self.media_repository.get_video_by_id(video_id)
        
        if not video:
            return None
        
        return {
            "id": video.id,
            "title": video.title,
            "description": video.description,
            "original_filename": video.original_filename,
            "file_size": video.file_size,
            "duration": video.duration,
            "status": video.status,
            "file_path": video.file_path,
            "url": f"/api/v1/media/videos/{video.id}/stream",
            "upload_date": video.upload_date.isoformat()
        }
    
    async def get_image_info(self, image_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene información de una imagen por ID
        """
        image = await self.media_repository.get_image_by_id(image_id)
        
        if not image:
            return None
        
        return {
            "id": image.id,
            "original_filename": image.original_filename,
            "file_size": image.file_size,
            "purpose": image.purpose,
            "file_path": image.file_path,
            "extension": image.extension,
            "url": f"/api/v1/media/images/{image.id}",
            "upload_date": image.upload_date.isoformat()
        }
    
    async def delete_video(self, video_id: str) -> bool:
        """
        Elimina un video del sistema (archivo y metadata)
        """
        video = await self.media_repository.get_video_by_id(video_id)
        
        if not video:
            return False
        
        # Eliminar archivo físico
        try:
            if os.path.exists(video.file_path):
                os.unlink(video.file_path)
        except Exception as e:
            print(f"Error eliminando archivo físico: {e}")
        
        # Eliminar de base de datos
        return await self.media_repository.delete_video(video_id)
    
    async def delete_video_file(self, file_path: str):
        """
        Elimina solo el archivo físico (para cleanup en errores)
        """
        try:
            if os.path.exists(file_path):
                os.unlink(file_path)
        except Exception as e:
            print(f"Error eliminando archivo: {e}")

