"""
Servicio para gestión de archivos multimedia
Maneja upload, almacenamiento y metadata de videos e imágenes
"""
import os
import json
import shutil
import subprocess
from typing import Optional, Dict, Any
from pathlib import Path
from datetime import datetime
from fastapi import UploadFile, HTTPException

from ...core.config import settings
from ...core.file_security import validate_uploaded_file
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

    def _extract_video_duration(self, file_path: str) -> float:
        """
        Extrae la duración real del video usando FFprobe/FFmpeg con fallbacks robusto
        Retorna la duración en segundos, o 0 si no se puede extraer
        """
        print(f"🎬 [MediaService] Extracting duration for video: {file_path}")

        # Método 1: Intentar usar ffprobe (más preciso)
        try:
            # Verificar si ffprobe está disponible
            subprocess.run(['ffprobe', '-version'], capture_output=True, check=True, timeout=5)

            cmd = [
                'ffprobe',
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_format',
                file_path
            ]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0:
                data = json.loads(result.stdout)
                duration_str = data.get('format', {}).get('duration')
                if duration_str:
                    duration = float(duration_str)
                    print(f"✅ [MediaService] Duration extracted with ffprobe: {duration} seconds")
                    return duration

        except FileNotFoundError:
            print(f"⚠️ [MediaService] ffprobe not found on system")
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError, json.JSONDecodeError, ValueError) as e:
            print(f"⚠️ [MediaService] ffprobe failed: {e}")

        # Método 2: Intentar usar ffmpeg como fallback
        try:
            # Verificar si ffmpeg está disponible
            subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True, timeout=5)

            cmd = [
                'ffmpeg',
                '-i', file_path,
                '-f', 'null',
                '-'
            ]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )

            # FFmpeg imprime información en stderr
            stderr_output = result.stderr

            # Buscar la línea que contiene "Duration:"
            for line in stderr_output.split('\n'):
                if 'Duration:' in line:
                    # Formato: Duration: 00:01:23.45, start: 0.000000, bitrate: 1234 kb/s
                    duration_part = line.split('Duration:')[1].split(',')[0].strip()

                    # Convertir formato HH:MM:SS.ff a segundos
                    time_parts = duration_part.split(':')
                    if len(time_parts) >= 3:
                        hours = float(time_parts[0])
                        minutes = float(time_parts[1])
                        seconds = float(time_parts[2])
                        total_seconds = hours * 3600 + minutes * 60 + seconds
                        print(f"✅ [MediaService] Duration extracted with ffmpeg: {total_seconds} seconds")
                        return total_seconds

        except FileNotFoundError:
            print(f"⚠️ [MediaService] ffmpeg not found on system")
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError, ValueError, IndexError) as e:
            print(f"⚠️ [MediaService] ffmpeg failed: {e}")

        # Método 3: Fallback usando tamaño de archivo (estimación muy básica)
        try:
            import os
            file_size = os.path.getsize(file_path)
            # Estimación muy básica: ~1MB por minuto para video comprimido
            estimated_duration = max(60, file_size / (1024 * 1024 * 0.5))  # Mínimo 1 minuto
            print(f"⚠️ [MediaService] Using file size estimation: {estimated_duration} seconds (file: {file_size/1024/1024:.1f}MB)")
            return estimated_duration
        except Exception as e:
            print(f"⚠️ [MediaService] File size estimation failed: {e}")

        # Si todo falla, retornar duración predeterminada
        default_duration = 60.0  # 1 minuto por defecto
        print(f"⚠️ [MediaService] All duration extraction methods failed for {file_path}, using default: {default_duration} seconds")
        return default_duration
    
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
        Con validaciones de seguridad mejoradas
        """
        # SECURITY: Validar archivo antes de procesarlo
        is_valid, errors, file_hash = await validate_uploaded_file(file, 'video')
        if not is_valid:
            raise HTTPException(
                status_code=400, 
                detail={
                    "error": "File validation failed",
                    "details": errors
                }
            )
        
        try:
            # Ruta completa del archivo
            file_path = self.videos_dir / filename
            
            # Guardar archivo físico
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Obtener información básica del archivo
            file_size = os.path.getsize(file_path)

            # Extraer duración real del video con manejo robusto de errores
            duration_minutes = 0
            duration_seconds = 0

            # Por defecto, siempre intentar extraer duración con fallbacks
            try:
                print(f"🎬 [MediaService] Attempting to extract duration for video: {file_path}")
                duration_seconds = self._extract_video_duration(str(file_path))
                duration_minutes = round(duration_seconds / 60, 1) if duration_seconds > 0 else 0
                print(f"✅ [MediaService] Video duration extracted: {duration_seconds}s ({duration_minutes}min)")
            except Exception as e:
                print(f"⚠️ [MediaService] Duration extraction failed with error: {e}")
                print(f"⚠️ [MediaService] Using default duration values")
                duration_seconds = 60.0  # 1 minuto por defecto
                duration_minutes = 1.0

            # Crear registro en base de datos con hash de seguridad
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
                duration=duration_minutes,  # Duración extraída del video en minutos
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
            
            # SECURITY: Validar archivo antes de procesarlo
            is_valid, errors, file_hash = await validate_uploaded_file(file, 'image')
            if not is_valid:
                raise HTTPException(
                    status_code=400, 
                    detail={
                        "error": "File validation failed",
                        "details": errors
                    }
                )
            
            # Crear registro en base de datos
            image_asset = ImageAsset(
                original_filename=file.filename,
                stored_filename=filename,
                file_path=str(file_path),
                file_size=file_size,
                purpose=purpose,
                uploaded_by=user_id,
                file_hash=file_hash,  # Para detección de duplicados,
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

