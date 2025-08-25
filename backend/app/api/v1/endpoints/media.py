"""
Endpoints para gestión de archivos multimedia
Sistema básico de upload y almacenamiento de videos
"""
import os
import uuid
import shutil
from typing import Optional, List
from pathlib import Path
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, status
from fastapi.responses import FileResponse

from ....domain.entities.user import User
from ....application.services.media_service import MediaService
from ....application.services.lesson_service import LessonService
from ....dependencies import get_lesson_service, get_media_service
from ...deps import get_current_instructor_user, get_current_admin_user

router = APIRouter()

# Configuración de archivos permitidos
ALLOWED_VIDEO_EXTENSIONS = {'.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'}
ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
MAX_VIDEO_SIZE = 500 * 1024 * 1024  # 500MB
MAX_IMAGE_SIZE = 10 * 1024 * 1024   # 10MB

@router.post("/videos/upload", summary="Subir video")
async def upload_video(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    lesson_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_instructor_user),
    media_service: MediaService = Depends(get_media_service),
    lesson_service: LessonService = Depends(get_lesson_service)
):
    """
    Sube un video al servidor y opcionalmente lo asocia a una lección
    """
    try:
        # Validar archivo
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se proporcionó un archivo"
            )
        
        # Validar extensión
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in ALLOWED_VIDEO_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Formato de archivo no permitido. Formatos válidos: {', '.join(ALLOWED_VIDEO_EXTENSIONS)}"
            )
        
        # Validar tamaño (aproximado por headers)
        if file.size and file.size > MAX_VIDEO_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El archivo es demasiado grande. Tamaño máximo: {MAX_VIDEO_SIZE // (1024*1024)}MB"
            )
        
        # Generar nombre único para el archivo
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Guardar archivo
        video_info = await media_service.save_video_file(
            file=file,
            filename=unique_filename,
            title=title,
            description=description,
            user_id=current_user.id
        )
        
        # Si se proporciona lesson_id, actualizar la lección
        if lesson_id:
            lesson = await lesson_service.update_lesson_video(
                lesson_id=lesson_id,
                video_url=video_info["url"],
                duration=video_info.get("duration", 0)
            )
            
            if not lesson:
                # Archivo subido pero lección no encontrada
                await media_service.delete_video_file(video_info["file_path"])
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Lección no encontrada"
                )
        
        return {
            "message": "Video subido exitosamente",
            "video": video_info,
            "lesson_updated": bool(lesson_id)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor: {str(e)}"
        )

@router.get("/videos/{video_id}", summary="Obtener información del video")
async def get_video_info(
    video_id: str,
    current_user: User = Depends(get_current_instructor_user),
    media_service: MediaService = Depends(get_media_service)
):
    """
    Obtiene información de un video específico
    """
    video_info = await media_service.get_video_info(video_id)
    
    if not video_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video no encontrado"
        )
    
    return video_info

@router.get("/videos/{video_id}/stream", summary="Servir video para streaming")
async def stream_video(
    video_id: str,
    current_user: User = Depends(get_current_instructor_user),
    media_service: MediaService = Depends(get_media_service)
):
    """
    Sirve el archivo de video para reproducción
    """
    video_info = await media_service.get_video_info(video_id)
    
    if not video_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video no encontrado"
        )
    
    file_path = video_info["file_path"]
    
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archivo de video no encontrado en el servidor"
        )
    
    return FileResponse(
        path=file_path,
        media_type="video/mp4",
        filename=video_info["original_filename"]
    )

@router.delete("/videos/{video_id}", summary="Eliminar video")
async def delete_video(
    video_id: str,
    current_user: User = Depends(get_current_admin_user),  # Solo admin puede eliminar
    media_service: MediaService = Depends(get_media_service)
):
    """
    Elimina un video del sistema (solo administradores)
    """
    success = await media_service.delete_video(video_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video no encontrado"
        )
    
    return {"message": "Video eliminado exitosamente"}

@router.post("/images/upload", summary="Subir imagen")
async def upload_image(
    file: UploadFile = File(...),
    purpose: str = Form(...),  # 'course_cover', 'profile', 'general'
    current_user: User = Depends(get_current_instructor_user),
    media_service: MediaService = Depends(get_media_service)
):
    """
    Sube una imagen al servidor
    """
    try:
        # Validar archivo
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se proporcionó un archivo"
            )
        
        # Validar extensión
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Formato de imagen no permitido. Formatos válidos: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
            )
        
        # Validar tamaño
        if file.size and file.size > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"La imagen es demasiado grande. Tamaño máximo: {MAX_IMAGE_SIZE // (1024*1024)}MB"
            )
        
        # Generar nombre único
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Guardar imagen
        image_info = await media_service.save_image_file(
            file=file,
            filename=unique_filename,
            purpose=purpose,
            user_id=current_user.id
        )
        
        return {
            "message": "Imagen subida exitosamente",
            "image": image_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor: {str(e)}"
        )

@router.get("/images/{image_id}", summary="Servir imagen")
async def serve_image(
    image_id: str,
    media_service: MediaService = Depends(get_media_service)
):
    """
    Sirve una imagen (público para imágenes de cursos)
    """
    image_info = await media_service.get_image_info(image_id)
    
    if not image_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Imagen no encontrada"
        )
    
    file_path = image_info["file_path"]
    
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archivo de imagen no encontrado"
        )
    
    return FileResponse(
        path=file_path,
        media_type=f"image/{image_info['extension'][1:]}",  # Quitar el punto del extension
        filename=image_info["original_filename"]
    )
