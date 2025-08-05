"""
Endpoints para gestión de archivos multimedia
"""
from typing import List, Optional
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.security import HTTPBearer

from ....application.services.media_service import MediaService
from ....domain.entities.media import VideoAsset, ImageAsset
from ....core.auth import get_current_user
from ....core.dependencies import get_media_service

router = APIRouter()
security = HTTPBearer()

@router.post("/upload/video", response_model=dict)
async def upload_video(
    title: str = Form(..., description="Título del video"),
    description: Optional[str] = Form(None, description="Descripción del video"),
    file: UploadFile = File(..., description="Archivo de video"),
    current_user: dict = Depends(get_current_user),
    media_service: MediaService = Depends(get_media_service)
):
    """
    Subir archivo de video
    
    **Formatos soportados:** MP4, MPEG, MOV, WebM
    **Tamaño máximo:** 100MB
    """
    try:
        video_asset = await media_service.upload_video(
            file=file,
            title=title,
            description=description,
            uploaded_by=current_user.get("id")
        )
        
        return {
            "message": "Video subido exitosamente",
            "video_id": video_asset.id,
            "title": video_asset.title,
            "status": video_asset.status,
            "upload_date": video_asset.upload_date
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upload/image", response_model=dict)
async def upload_image(
    purpose: str = Form("general", description="Propósito de la imagen"),
    file: UploadFile = File(..., description="Archivo de imagen"),
    current_user: dict = Depends(get_current_user),
    media_service: MediaService = Depends(get_media_service)
):
    """
    Subir archivo de imagen
    
    **Formatos soportados:** JPEG, PNG, WebP, GIF
    **Tamaño máximo:** 10MB
    """
    try:
        image_asset = await media_service.upload_image(
            file=file,
            purpose=purpose,
            uploaded_by=current_user.get("id")
        )
        
        return {
            "message": "Imagen subida exitosamente",
            "image_id": image_asset.id,
            "purpose": image_asset.purpose,
            "upload_date": image_asset.upload_date
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/video/{video_id}/info", response_model=dict)
async def get_video_info(
    video_id: str,
    current_user: dict = Depends(get_current_user),
    media_service: MediaService = Depends(get_media_service)
):
    """Obtener información de un video"""
    try:
        video = await media_service.get_video_info(video_id)
        
        # Verificar permisos: admin puede ver todo, usuario solo sus videos
        if current_user.get("role") != "admin" and video.uploaded_by != current_user.get("id"):
            raise HTTPException(status_code=403, detail="Acceso denegado")
        
        return {
            "id": video.id,
            "title": video.title,
            "description": video.description,
            "original_filename": video.original_filename,
            "file_size": video.file_size,
            "upload_date": video.upload_date,
            "mime_type": video.mime_type,
            "duration": video.duration,
            "status": video.status,
            "uploaded_by": video.uploaded_by
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/image/{image_id}/info", response_model=dict)
async def get_image_info(
    image_id: str,
    current_user: dict = Depends(get_current_user),
    media_service: MediaService = Depends(get_media_service)
):
    """Obtener información de una imagen"""
    try:
        image = await media_service.get_image_info(image_id)
        
        # Verificar permisos: admin puede ver todo, usuario solo sus imágenes
        if current_user.get("role") != "admin" and image.uploaded_by != current_user.get("id"):
            raise HTTPException(status_code=403, detail="Acceso denegado")
        
        return {
            "id": image.id,
            "purpose": image.purpose,
            "original_filename": image.original_filename,
            "file_size": image.file_size,
            "upload_date": image.upload_date,
            "mime_type": image.mime_type,
            "extension": image.extension,
            "uploaded_by": image.uploaded_by
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/video/{video_id}/stream")
async def stream_video(
    video_id: str,
    current_user: dict = Depends(get_current_user),
    media_service: MediaService = Depends(get_media_service)
):
    """Stream de video con control de acceso"""
    try:
        video = await media_service.get_video_info(video_id)
        
        # Verificar permisos
        if current_user.get("role") != "admin" and video.uploaded_by != current_user.get("id"):
            raise HTTPException(status_code=403, detail="Acceso denegado")
        
        file_path = Path(video.file_path)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Archivo de video no encontrado")
        
        return FileResponse(
            path=file_path,
            media_type=video.mime_type,
            filename=video.original_filename
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/image/{image_id}")
async def serve_image(
    image_id: str,
    current_user: dict = Depends(get_current_user),
    media_service: MediaService = Depends(get_media_service)
):
    """Servir imagen con control de acceso"""
    try:
        image = await media_service.get_image_info(image_id)
        
        # Verificar permisos
        if current_user.get("role") != "admin" and image.uploaded_by != current_user.get("id"):
            raise HTTPException(status_code=403, detail="Acceso denegado")
        
        file_path = Path(image.file_path)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Archivo de imagen no encontrado")
        
        return FileResponse(
            path=file_path,
            media_type=image.mime_type,
            filename=image.original_filename
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/video/{video_id}")
async def delete_video(
    video_id: str,
    current_user: dict = Depends(get_current_user),
    media_service: MediaService = Depends(get_media_service)
):
    """Eliminar video (solo admins)"""
    try:
        success = await media_service.delete_video(video_id, current_user)
        if success:
            return {"message": "Video eliminado exitosamente"}
        else:
            raise HTTPException(status_code=404, detail="Video no encontrado")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/image/{image_id}")
async def delete_image(
    image_id: str,
    current_user: dict = Depends(get_current_user),
    media_service: MediaService = Depends(get_media_service)
):
    """Eliminar imagen (solo admins)"""
    try:
        success = await media_service.delete_image(image_id, current_user)
        if success:
            return {"message": "Imagen eliminada exitosamente"}
        else:
            raise HTTPException(status_code=404, detail="Imagen no encontrada")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/videos", response_model=List[dict])
async def list_videos(
    current_user: dict = Depends(get_current_user),
    media_service: MediaService = Depends(get_media_service)
):
    """Listar videos del usuario (o todos si es admin)"""
    try:
        videos = await media_service.list_videos(current_user)
        
        return [
            {
                "id": video.id,
                "title": video.title,
                "description": video.description,
                "original_filename": video.original_filename,
                "file_size": video.file_size,
                "upload_date": video.upload_date,
                "status": video.status,
                "uploaded_by": video.uploaded_by
            }
            for video in videos
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
