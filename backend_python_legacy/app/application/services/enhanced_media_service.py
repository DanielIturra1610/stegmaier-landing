"""
Enhanced Media Service - Sistema de media optimizado con CDN y compresión
"""
import os
import uuid
import asyncio
from typing import Optional, Dict, Any, List
from pathlib import Path
from PIL import Image, ImageOps
from moviepy.editor import VideoFileClip
import aiofiles
from fastapi import UploadFile
import boto3
from botocore.exceptions import ClientError

from ...core.config import settings
from ...domain.entities.media import MediaFile
from ...infrastructure.repositories.media_repository import MediaRepository

class EnhancedMediaService:
    """
    Servicio de media mejorado con:
    - Compresión automática de imágenes
    - Optimización de videos 
    - Integración con CDN (AWS CloudFront)
    - Múltiples resoluciones automáticas
    - Metadatos avanzados
    """
    
    def __init__(self, media_repository: MediaRepository):
        self.repository = media_repository
        self.s3_client = None
        self.cloudfront_url = settings.CDN_URL if hasattr(settings, 'CDN_URL') else None
        
        # Configurar S3 si está habilitado
        if hasattr(settings, 'AWS_ACCESS_KEY_ID') and settings.AWS_ACCESS_KEY_ID:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )
    
    async def upload_and_optimize_image(
        self,
        file: UploadFile,
        purpose: str,
        user_id: str,
        max_width: int = 1920,
        quality: int = 85
    ) -> Dict[str, Any]:
        """
        Sube y optimiza una imagen automáticamente
        Genera múltiples tamaños para diferentes usos
        """
        try:
            # Generar ID único
            file_id = str(uuid.uuid4())
            original_name = file.filename
            extension = Path(original_name).suffix.lower()
            
            # Crear directorio temporal
            temp_dir = Path(f"/tmp/media_processing/{file_id}")
            temp_dir.mkdir(parents=True, exist_ok=True)
            
            # Guardar archivo original temporalmente
            temp_original = temp_dir / f"original{extension}"
            async with aiofiles.open(temp_original, 'wb') as f:
                content = await file.read()
                await f.write(content)
            
            # Procesar imagen con PIL
            with Image.open(temp_original) as img:
                # Corregir orientación EXIF
                img = ImageOps.exif_transpose(img)
                
                # Generar múltiples tamaños
                sizes = self._get_image_sizes(purpose)
                processed_files = {}
                
                for size_name, (width, height) in sizes.items():
                    # Redimensionar manteniendo aspect ratio
                    img_resized = img.copy()
                    img_resized.thumbnail((width, height), Image.Resampling.LANCZOS)
                    
                    # Optimizar y comprimir
                    output_path = temp_dir / f"{size_name}{extension}"
                    
                    # Configurar compresión según formato
                    save_kwargs = {}
                    if extension in ['.jpg', '.jpeg']:
                        save_kwargs = {
                            'optimize': True, 
                            'quality': quality,
                            'progressive': True
                        }
                    elif extension == '.png':
                        img_resized = img_resized.convert('P', palette=Image.ADAPTIVE)
                        save_kwargs = {'optimize': True}
                    elif extension == '.webp':
                        save_kwargs = {
                            'optimize': True, 
                            'quality': quality,
                            'method': 6  # Mejor compresión
                        }
                    
                    img_resized.save(output_path, **save_kwargs)
                    processed_files[size_name] = {
                        'path': output_path,
                        'size': output_path.stat().st_size,
                        'dimensions': img_resized.size
                    }
                
                # Subir a CDN si está configurado
                urls = {}
                if self.s3_client:
                    urls = await self._upload_to_s3(file_id, processed_files, 'images')
                else:
                    urls = await self._save_to_local(file_id, processed_files, 'images')
                
                # Crear registro en BD
                media_record = MediaFile(
                    id=file_id,
                    original_filename=original_name,
                    file_type='image',
                    purpose=purpose,
                    user_id=user_id,
                    urls=urls,
                    metadata={
                        'original_size': len(content),
                        'optimized_sizes': {k: v['size'] for k, v in processed_files.items()},
                        'dimensions': {k: v['dimensions'] for k, v in processed_files.items()},
                        'compression_ratio': len(content) / sum(v['size'] for v in processed_files.values()),
                        'format': extension[1:].upper()
                    }
                )
                
                await self.repository.create_media_file(media_record)
                
                # Limpiar archivos temporales
                await self._cleanup_temp_files(temp_dir)
                
                return {
                    'id': file_id,
                    'urls': urls,
                    'metadata': media_record.metadata,
                    'optimization_stats': {
                        'original_size': len(content),
                        'total_optimized_size': sum(v['size'] for v in processed_files.values()),
                        'compression_percentage': round((1 - sum(v['size'] for v in processed_files.values()) / len(content)) * 100, 2),
                        'sizes_generated': list(processed_files.keys())
                    }
                }
                
        except Exception as e:
            # Limpiar en caso de error
            if 'temp_dir' in locals():
                await self._cleanup_temp_files(temp_dir)
            raise e
    
    async def upload_and_optimize_video(
        self,
        file: UploadFile,
        title: str,
        user_id: str,
        target_resolutions: List[str] = None
    ) -> Dict[str, Any]:
        """
        Sube y optimiza video automáticamente
        Genera múltiples resoluciones y formatos
        """
        try:
            if target_resolutions is None:
                target_resolutions = ['480p', '720p', '1080p']
            
            file_id = str(uuid.uuid4())
            original_name = file.filename
            extension = Path(original_name).suffix.lower()
            
            # Crear directorio temporal
            temp_dir = Path(f"/tmp/media_processing/{file_id}")
            temp_dir.mkdir(parents=True, exist_ok=True)
            
            # Guardar archivo original temporalmente
            temp_original = temp_dir / f"original{extension}"
            async with aiofiles.open(temp_original, 'wb') as f:
                content = await file.read()
                await f.write(content)
            
            # Procesar video con MoviePy
            with VideoFileClip(str(temp_original)) as video:
                original_duration = video.duration
                original_fps = video.fps
                original_resolution = (video.w, video.h)
                
                # Generar múltiples resoluciones
                processed_videos = {}
                resolution_configs = {
                    '480p': {'height': 480, 'bitrate': '1000k'},
                    '720p': {'height': 720, 'bitrate': '2500k'},
                    '1080p': {'height': 1080, 'bitrate': '5000k'}
                }
                
                for res_name in target_resolutions:
                    if res_name not in resolution_configs:
                        continue
                        
                    config = resolution_configs[res_name]
                    
                    # Solo procesar si la resolución original es mayor
                    if original_resolution[1] >= config['height']:
                        # Calcular nuevo ancho manteniendo aspect ratio
                        aspect_ratio = original_resolution[0] / original_resolution[1]
                        new_height = config['height']
                        new_width = int(new_height * aspect_ratio)
                        
                        # Redimensionar y optimizar
                        resized_video = video.resize(height=new_height)
                        output_path = temp_dir / f"{res_name}.mp4"
                        
                        resized_video.write_videofile(
                            str(output_path),
                            codec='libx264',
                            bitrate=config['bitrate'],
                            audio_codec='aac',
                            temp_audiofile='temp-audio.m4a',
                            remove_temp=True,
                            verbose=False,
                            logger=None
                        )
                        
                        processed_videos[res_name] = {
                            'path': output_path,
                            'size': output_path.stat().st_size,
                            'resolution': (new_width, new_height),
                            'bitrate': config['bitrate']
                        }
                
                # Subir a CDN o almacenamiento local
                urls = {}
                if self.s3_client:
                    urls = await self._upload_to_s3(file_id, processed_videos, 'videos')
                else:
                    urls = await self._save_to_local(file_id, processed_videos, 'videos')
                
                # Crear registro en BD
                media_record = MediaFile(
                    id=file_id,
                    original_filename=original_name,
                    file_type='video',
                    purpose='lesson_content',
                    user_id=user_id,
                    urls=urls,
                    metadata={
                        'duration': original_duration,
                        'fps': original_fps,
                        'original_resolution': original_resolution,
                        'original_size': len(content),
                        'processed_resolutions': {k: v['resolution'] for k, v in processed_videos.items()},
                        'optimized_sizes': {k: v['size'] for k, v in processed_videos.items()},
                        'compression_stats': {
                            'total_reduction': len(content) - sum(v['size'] for v in processed_videos.values()),
                            'compression_ratio': sum(v['size'] for v in processed_videos.values()) / len(content)
                        }
                    }
                )
                
                await self.repository.create_media_file(media_record)
                
                # Limpiar archivos temporales
                await self._cleanup_temp_files(temp_dir)
                
                return {
                    'id': file_id,
                    'urls': urls,
                    'metadata': media_record.metadata,
                    'optimization_stats': {
                        'original_size': len(content),
                        'processed_versions': len(processed_videos),
                        'total_size_after_optimization': sum(v['size'] for v in processed_videos.values()),
                        'storage_efficiency': round((1 - sum(v['size'] for v in processed_videos.values()) / len(content)) * 100, 2)
                    }
                }
                
        except Exception as e:
            if 'temp_dir' in locals():
                await self._cleanup_temp_files(temp_dir)
            raise e
    
    async def get_optimized_url(
        self, 
        media_id: str, 
        size: str = 'medium',
        resolution: str = '720p'
    ) -> Optional[str]:
        """
        Obtiene la URL optimizada para un tamaño/resolución específica
        """
        media = await self.repository.get_media_by_id(media_id)
        if not media:
            return None
        
        # Para imágenes
        if media.file_type == 'image':
            if size in media.urls:
                return self._get_cdn_url(media.urls[size])
            # Fallback al tamaño más cercano
            available_sizes = list(media.urls.keys())
            if available_sizes:
                return self._get_cdn_url(media.urls[available_sizes[0]])
        
        # Para videos
        elif media.file_type == 'video':
            if resolution in media.urls:
                return self._get_cdn_url(media.urls[resolution])
            # Fallback a la resolución más baja disponible
            available_resolutions = list(media.urls.keys())
            if available_resolutions:
                return self._get_cdn_url(media.urls[available_resolutions[0]])
        
        return None
    
    def _get_image_sizes(self, purpose: str) -> Dict[str, tuple]:
        """Define los tamaños de imagen según el propósito"""
        size_configs = {
            'course_cover': {
                'thumbnail': (300, 200),
                'medium': (600, 400),
                'large': (1200, 800),
                'hero': (1920, 1080)
            },
            'profile': {
                'thumbnail': (100, 100),
                'medium': (300, 300),
                'large': (600, 600)
            },
            'general': {
                'small': (200, 200),
                'medium': (600, 600),
                'large': (1200, 1200)
            }
        }
        
        return size_configs.get(purpose, size_configs['general'])
    
    async def _upload_to_s3(
        self, 
        file_id: str, 
        files: Dict[str, Dict], 
        media_type: str
    ) -> Dict[str, str]:
        """Sube archivos a S3 y retorna las URLs"""
        urls = {}
        bucket = settings.AWS_S3_BUCKET
        
        for size_name, file_info in files.items():
            key = f"{media_type}/{file_id}/{size_name}{Path(file_info['path']).suffix}"
            
            try:
                self.s3_client.upload_file(
                    str(file_info['path']),
                    bucket,
                    key,
                    ExtraArgs={
                        'ACL': 'public-read',
                        'CacheControl': 'max-age=31536000'  # 1 año de cache
                    }
                )
                urls[size_name] = f"s3://{bucket}/{key}"
                
            except ClientError as e:
                print(f"Error uploading {key} to S3: {e}")
                # Fallback a almacenamiento local
                urls[size_name] = await self._save_file_locally(
                    file_info['path'], 
                    f"{media_type}/{file_id}/{size_name}{Path(file_info['path']).suffix}"
                )
        
        return urls
    
    async def _save_to_local(
        self, 
        file_id: str, 
        files: Dict[str, Dict], 
        media_type: str
    ) -> Dict[str, str]:
        """Guarda archivos en almacenamiento local"""
        urls = {}
        base_path = Path(f"media/{media_type}/{file_id}")
        base_path.mkdir(parents=True, exist_ok=True)
        
        for size_name, file_info in files.items():
            extension = Path(file_info['path']).suffix
            final_path = base_path / f"{size_name}{extension}"
            
            # Copiar archivo
            async with aiofiles.open(file_info['path'], 'rb') as src:
                async with aiofiles.open(final_path, 'wb') as dst:
                    content = await src.read()
                    await dst.write(content)
            
            urls[size_name] = f"/media/{media_type}/{file_id}/{size_name}{extension}"
        
        return urls
    
    async def _cleanup_temp_files(self, temp_dir: Path):
        """Limpia archivos temporales"""
        try:
            if temp_dir.exists():
                import shutil
                shutil.rmtree(temp_dir)
        except Exception as e:
            print(f"Error cleaning up temp files: {e}")
    
    def _get_cdn_url(self, s3_path: str) -> str:
        """Convierte path S3 a URL de CDN"""
        if self.cloudfront_url and s3_path.startswith('s3://'):
            # Extraer la key del path S3
            key = s3_path.split('/', 3)[-1]  # Quitar s3://bucket/
            return f"{self.cloudfront_url}/{key}"
        
        return s3_path
    
    async def get_media_analytics(self, user_id: str) -> Dict[str, Any]:
        """
        Obtiene analytics de uso de media para un usuario
        """
        user_media = await self.repository.get_media_by_user(user_id)
        
        total_files = len(user_media)
        total_storage = sum(
            sum(media.metadata.get('optimized_sizes', {}).values()) 
            for media in user_media
        )
        
        # Estadísticas por tipo
        by_type = {}
        for media in user_media:
            media_type = media.file_type
            if media_type not in by_type:
                by_type[media_type] = {'count': 0, 'size': 0}
            
            by_type[media_type]['count'] += 1
            by_type[media_type]['size'] += sum(
                media.metadata.get('optimized_sizes', {}).values()
            )
        
        return {
            'summary': {
                'total_files': total_files,
                'total_storage_bytes': total_storage,
                'total_storage_mb': round(total_storage / (1024 * 1024), 2)
            },
            'by_type': by_type,
            'optimization_savings': {
                'total_original_size': sum(
                    media.metadata.get('original_size', 0) for media in user_media
                ),
                'total_optimized_size': total_storage,
                'savings_percentage': round(
                    (1 - total_storage / sum(media.metadata.get('original_size', 1) for media in user_media)) * 100, 
                    2
                )
            }
        }
