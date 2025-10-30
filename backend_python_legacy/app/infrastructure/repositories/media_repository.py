"""
Repositorio para gestión de archivos multimedia
Implementación básica usando sistema de archivos + JSON para metadata
"""
import json
import uuid
from typing import Optional, List, Dict, Any
from pathlib import Path
from datetime import datetime

from ...domain.entities.media import VideoAsset, ImageAsset
from ...domain.repositories.media_repository import MediaRepository

class FileSystemMediaRepository(MediaRepository):
    """
    Implementación del repositorio de media usando sistema de archivos local
    """
    
    def __init__(self):
        self.base_path = Path("media")  # Directorio base de media
        self.metadata_path = self.base_path / "metadata"
        self.videos_metadata_path = self.metadata_path / "videos.json"
        self.images_metadata_path = self.metadata_path / "images.json"
        
        # Crear directorios necesarios
        self.metadata_path.mkdir(parents=True, exist_ok=True)
        
        # Inicializar archivos de metadata si no existen
        self._init_metadata_files()
    
    def _init_metadata_files(self):
        """Inicializar archivos JSON de metadata"""
        if not self.videos_metadata_path.exists():
            self._save_videos_metadata({})
        
        if not self.images_metadata_path.exists():
            self._save_images_metadata({})
    
    def _load_videos_metadata(self) -> Dict[str, Dict[str, Any]]:
        """Cargar metadata de videos desde JSON"""
        try:
            with open(self.videos_metadata_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}
    
    def _save_videos_metadata(self, metadata: Dict[str, Dict[str, Any]]):
        """Guardar metadata de videos en JSON"""
        with open(self.videos_metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, default=str)
    
    def _load_images_metadata(self) -> Dict[str, Dict[str, Any]]:
        """Cargar metadata de imágenes desde JSON"""
        try:
            with open(self.images_metadata_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}
    
    def _save_images_metadata(self, metadata: Dict[str, Dict[str, Any]]):
        """Guardar metadata de imágenes en JSON"""
        with open(self.images_metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, default=str)
    
    async def save_video(self, video_asset: VideoAsset) -> VideoAsset:
        """Guardar metadata de video"""
        if not video_asset.id:
            video_asset.id = str(uuid.uuid4())
        
        metadata = self._load_videos_metadata()
        metadata[video_asset.id] = {
            'id': video_asset.id,
            'original_filename': video_asset.original_filename,
            'stored_filename': video_asset.stored_filename,
            'file_path': video_asset.file_path,
            'file_size': video_asset.file_size,
            'title': video_asset.title,
            'description': video_asset.description,
            'uploaded_by': video_asset.uploaded_by,
            'upload_date': video_asset.upload_date.isoformat() if video_asset.upload_date else None,
            'mime_type': video_asset.mime_type,
            'duration': video_asset.duration,
            'status': video_asset.status
        }
        
        self._save_videos_metadata(metadata)
        return video_asset
    
    async def save_image(self, image_asset: ImageAsset) -> ImageAsset:
        """Guardar metadata de imagen"""
        if not image_asset.id:
            image_asset.id = str(uuid.uuid4())
        
        metadata = self._load_images_metadata()
        metadata[image_asset.id] = {
            'id': image_asset.id,
            'original_filename': image_asset.original_filename,
            'stored_filename': image_asset.stored_filename,
            'file_path': image_asset.file_path,
            'file_size': image_asset.file_size,
            'purpose': image_asset.purpose,
            'uploaded_by': image_asset.uploaded_by,
            'upload_date': image_asset.upload_date.isoformat() if image_asset.upload_date else None,
            'mime_type': image_asset.mime_type,
            'extension': image_asset.extension
        }
        
        self._save_images_metadata(metadata)
        return image_asset
    
    async def get_video_by_id(self, video_id: str) -> Optional[VideoAsset]:
        """Obtener video por ID"""
        metadata = self._load_videos_metadata()
        video_data = metadata.get(video_id)
        
        if not video_data:
            return None
        
        return VideoAsset(
            id=video_data['id'],
            original_filename=video_data['original_filename'],
            stored_filename=video_data['stored_filename'],
            file_path=video_data['file_path'],
            file_size=video_data['file_size'],
            title=video_data['title'],
            description=video_data.get('description'),
            uploaded_by=video_data.get('uploaded_by'),
            upload_date=datetime.fromisoformat(video_data['upload_date']) if video_data.get('upload_date') else None,
            mime_type=video_data['mime_type'],
            duration=video_data['duration'],
            status=video_data['status']
        )
    
    async def get_image_by_id(self, image_id: str) -> Optional[ImageAsset]:
        """Obtener imagen por ID"""
        metadata = self._load_images_metadata()
        image_data = metadata.get(image_id)
        
        if not image_data:
            return None
        
        return ImageAsset(
            id=image_data['id'],
            original_filename=image_data['original_filename'],
            stored_filename=image_data['stored_filename'],
            file_path=image_data['file_path'],
            file_size=image_data['file_size'],
            purpose=image_data['purpose'],
            uploaded_by=image_data.get('uploaded_by'),
            upload_date=datetime.fromisoformat(image_data['upload_date']) if image_data.get('upload_date') else None,
            mime_type=image_data['mime_type'],
            extension=image_data['extension']
        )
    
    async def delete_video(self, video_id: str) -> bool:
        """Eliminar video"""
        metadata = self._load_videos_metadata()
        
        if video_id not in metadata:
            return False
        
        del metadata[video_id]
        self._save_videos_metadata(metadata)
        return True
    
    async def delete_image(self, image_id: str) -> bool:
        """Eliminar imagen"""
        metadata = self._load_images_metadata()
        
        if image_id not in metadata:
            return False
        
        del metadata[image_id]
        self._save_images_metadata(metadata)
        return True
    
    async def list_videos(self, uploaded_by: Optional[str] = None) -> List[VideoAsset]:
        """Listar videos con filtro opcional por usuario"""
        metadata = self._load_videos_metadata()
        videos = []
        
        for video_data in metadata.values():
            if uploaded_by and video_data.get('uploaded_by') != uploaded_by:
                continue
            
            video = VideoAsset(
                id=video_data['id'],
                original_filename=video_data['original_filename'],
                stored_filename=video_data['stored_filename'],
                file_path=video_data['file_path'],
                file_size=video_data['file_size'],
                title=video_data['title'],
                description=video_data.get('description'),
                uploaded_by=video_data.get('uploaded_by'),
                upload_date=datetime.fromisoformat(video_data['upload_date']) if video_data.get('upload_date') else None,
                mime_type=video_data['mime_type'],
                duration=video_data['duration'],
                status=video_data['status']
            )
            videos.append(video)
        
        return sorted(videos, key=lambda x: x.upload_date or datetime.min, reverse=True)
