"""
Servicio para gestión de archivos multimedia
"""
import os
import uuid
import shutil
from pathlib import Path
from typing import List, Optional, Tuple
from datetime import datetime

from fastapi import UploadFile, HTTPException

from ...domain.entities.media import VideoAsset, ImageAsset
from ...domain.repositories.media_repository import MediaRepository
from ...core.config import settings

class MediaService:
    """Servicio para gestión de archivos multimedia"""
    
    def __init__(self, media_repository: MediaRepository):
        self.media_repository = media_repository
        self.base_media_path = Path(settings.MEDIA_ROOT)
        self.videos_path = self.base_media_path / "videos"
        self.images_path = self.base_media_path / "images"
        
        # Crear directorios base
        self.videos_path.mkdir(parents=True, exist_ok=True)
        self.images_path.mkdir(parents=True, exist_ok=True)
    
    def _validate_video_file(self, file: UploadFile) -> bool:
        """Validar archivo de video"""
        if not file.content_type:
            return False
        
        allowed_types = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm']
        if file.content_type not in allowed_types:
            return False
        
        return True
    
    def _validate_image_file(self, file: UploadFile) -> bool:
        """Validar archivo de imagen"""
        if not file.content_type:
            return False
        
        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if file.content_type not in allowed_types:
            return False
        
        return True
    
    def _get_file_extension(self, filename: str) -> str:
        """Obtener extensión del archivo"""
        return Path(filename).suffix.lower()
    
    def _generate_stored_filename(self, original_filename: str) -> str:
        """Generar nombre único para almacenar archivo"""
        extension = self._get_file_extension(original_filename)
        unique_id = str(uuid.uuid4())
        return f"{unique_id}{extension}"
    
    async def _save_file_to_disk(self, file: UploadFile, target_path: Path) -> int:
        """Guardar archivo en disco y retornar tamaño"""
        with open(target_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
            return len(content)
    
    async def upload_video(
        self, 
        file: UploadFile, 
        title: str, 
        description: Optional[str] = None,
        uploaded_by: Optional[str] = None
    ) -> VideoAsset:
        """Subir archivo de video"""
        
        # Validar archivo
        if not self._validate_video_file(file):
            raise HTTPException(
                status_code=400, 
                detail="Tipo de archivo no válido. Tipos permitidos: MP4, MPEG, MOV, WebM"
            )
        
        # Validar tamaño máximo (100MB)
        max_size = 100 * 1024 * 1024  # 100MB
        
        # Generar nombres de archivo
        stored_filename = self._generate_stored_filename(file.filename)
        file_path = self.videos_path / stored_filename
        
        # Guardar archivo
        file_size = await self._save_file_to_disk(file, file_path)
        
        if file_size > max_size:
            os.remove(file_path)  # Eliminar archivo si es muy grande
            raise HTTPException(
                status_code=400,
                detail="El archivo es demasiado grande. Tamaño máximo: 100MB"
            )
        
        # Crear entidad VideoAsset
        video_asset = VideoAsset(
            id=str(uuid.uuid4()),
            original_filename=file.filename,
            stored_filename=stored_filename,
            file_path=str(file_path),
            file_size=file_size,
            title=title,
            description=description,
            uploaded_by=uploaded_by,
            upload_date=datetime.now(),
            mime_type=file.content_type,
            duration=None,  # Se podría calcular con FFmpeg
            status="pending_processing"
        )
        
        # Guardar metadata
        return await self.media_repository.save_video(video_asset)
    
    async def upload_image(
        self, 
        file: UploadFile, 
        purpose: str = "general",
        uploaded_by: Optional[str] = None
    ) -> ImageAsset:
        """Subir archivo de imagen"""
        
        # Validar archivo
        if not self._validate_image_file(file):
            raise HTTPException(
                status_code=400, 
                detail="Tipo de archivo no válido. Tipos permitidos: JPEG, PNG, WebP, GIF"
            )
        
        # Validar tamaño máximo (10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        
        # Generar nombres de archivo
        stored_filename = self._generate_stored_filename(file.filename)
        file_path = self.images_path / stored_filename
        
        # Guardar archivo
        file_size = await self._save_file_to_disk(file, file_path)
        
        if file_size > max_size:
            os.remove(file_path)  # Eliminar archivo si es muy grande
            raise HTTPException(
                status_code=400,
                detail="El archivo es demasiado grande. Tamaño máximo: 10MB"
            )
        
        # Crear entidad ImageAsset
        image_asset = ImageAsset(
            id=str(uuid.uuid4()),
            original_filename=file.filename,
            stored_filename=stored_filename,
            file_path=str(file_path),
            file_size=file_size,
            purpose=purpose,
            uploaded_by=uploaded_by,
            upload_date=datetime.now(),
            mime_type=file.content_type,
            extension=self._get_file_extension(file.filename)
        )
        
        # Guardar metadata
        return await self.media_repository.save_image(image_asset)
    
    async def get_video_info(self, video_id: str) -> VideoAsset:
        """Obtener información de video"""
        video = await self.media_repository.get_video_by_id(video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video no encontrado")
        return video
    
    async def get_image_info(self, image_id: str) -> ImageAsset:
        """Obtener información de imagen"""
        image = await self.media_repository.get_image_by_id(image_id)
        if not image:
            raise HTTPException(status_code=404, detail="Imagen no encontrada")
        return image
    
    async def delete_video(self, video_id: str, current_user: dict) -> bool:
        """Eliminar video (solo admins)"""
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Permisos insuficientes")
        
        video = await self.media_repository.get_video_by_id(video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video no encontrado")
        
        # Eliminar archivo físico
        file_path = Path(video.file_path)
        if file_path.exists():
            os.remove(file_path)
        
        # Eliminar metadata
        return await self.media_repository.delete_video(video_id)
    
    async def delete_image(self, image_id: str, current_user: dict) -> bool:
        """Eliminar imagen (solo admins)"""
        if current_user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Permisos insuficientes")
        
        image = await self.media_repository.get_image_by_id(image_id)
        if not image:
            raise HTTPException(status_code=404, detail="Imagen no encontrada")
        
        # Eliminar archivo físico
        file_path = Path(image.file_path)
        if file_path.exists():
            os.remove(file_path)
        
        # Eliminar metadata
        return await self.media_repository.delete_image(image_id)
    
    async def list_videos(self, current_user: dict) -> List[VideoAsset]:
        """Listar videos del usuario o todos (si es admin)"""
        if current_user.get("role") == "admin":
            return await self.media_repository.list_videos()
        else:
            return await self.media_repository.list_videos(uploaded_by=current_user.get("id"))
    
    def get_video_file_path(self, video_id: str) -> Optional[Path]:
        """Obtener ruta física del archivo de video"""
        # Esta función será usada para streaming de video
        return self.videos_path / f"{video_id}.mp4"  # Simplificado
    
    def get_image_file_path(self, image_id: str) -> Optional[Path]:
        """Obtener ruta física del archivo de imagen"""
        # Esta función será usada para servir imágenes
        return self.images_path / f"{image_id}.jpg"  # Simplificado
