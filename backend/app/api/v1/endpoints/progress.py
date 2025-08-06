"""
Endpoints para gestión de progreso de videos
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body
from pydantic import BaseModel

from ....domain.entities.user import User
from ....application.services.progress_service import ProgressService
from ....dependencies import get_progress_service
from ...deps import get_current_active_user

router = APIRouter()

class VideoProgressUpdate(BaseModel):
    current_position: float
    duration: float
    session_time: int = 0

class BookmarkCreate(BaseModel):
    timestamp: float
    title: str
    description: str = ""

class NoteCreate(BaseModel):
    timestamp: float
    content: str
    is_private: bool = True

@router.put("/videos/{lesson_id}/{video_id}", summary="Actualizar progreso de video")
async def update_video_progress(
    lesson_id: str,
    video_id: str,
    progress_data: VideoProgressUpdate,
    current_user: User = Depends(get_current_active_user),
    progress_service: ProgressService = Depends(get_progress_service)
):
    """
    Actualiza el progreso de un video específico para el usuario actual
    """
    try:
        progress = await progress_service.update_video_progress(
            user_id=current_user.id,
            lesson_id=lesson_id,
            video_id=video_id,
            current_position=progress_data.current_position,
            duration=progress_data.duration,
            session_time=progress_data.session_time
        )
        
        return {
            "message": "Progreso actualizado exitosamente",
            "progress": {
                "current_position": progress.current_position,
                "watch_percentage": progress.watch_percentage,
                "is_completed": progress.is_completed,
                "total_watch_time": progress.total_watch_time,
                "last_watched": progress.last_watched.isoformat() if progress.last_watched else None
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error actualizando progreso: {str(e)}"
        )

@router.get("/videos/{lesson_id}/{video_id}", summary="Obtener progreso de video")
async def get_video_progress(
    lesson_id: str,
    video_id: str,
    current_user: User = Depends(get_current_active_user),
    progress_service: ProgressService = Depends(get_progress_service)
):
    """
    Obtiene el progreso actual de un video para el usuario
    """
    progress = await progress_service.get_video_progress(
        user_id=current_user.id,
        lesson_id=lesson_id,
        video_id=video_id
    )
    
    if not progress:
        return {
            "current_position": 0.0,
            "watch_percentage": 0.0,
            "is_completed": False,
            "total_watch_time": 0,
            "last_watched": None
        }
    
    return {
        "current_position": progress.current_position,
        "watch_percentage": progress.watch_percentage,
        "is_completed": progress.is_completed,
        "total_watch_time": progress.total_watch_time,
        "last_watched": progress.last_watched.isoformat() if progress.last_watched else None,
        "bookmarks": len(progress.bookmarks) if progress.bookmarks else 0
    }

@router.get("/summary", summary="Obtener resumen de progreso del usuario")
async def get_progress_summary(
    course_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    progress_service: ProgressService = Depends(get_progress_service)
):
    """
    Obtiene un resumen del progreso de videos del usuario
    """
    summary = await progress_service.get_user_video_progress_summary(
        user_id=current_user.id,
        course_id=course_id
    )
    
    return summary

@router.post("/videos/{lesson_id}/{video_id}/bookmarks", summary="Añadir marcador")
async def create_bookmark(
    lesson_id: str,
    video_id: str,
    bookmark_data: BookmarkCreate,
    current_user: User = Depends(get_current_active_user),
    progress_service: ProgressService = Depends(get_progress_service)
):
    """
    Añade un marcador a un video
    """
    try:
        bookmark = await progress_service.add_video_bookmark(
            user_id=current_user.id,
            lesson_id=lesson_id,
            video_id=video_id,
            timestamp=bookmark_data.timestamp,
            title=bookmark_data.title,
            description=bookmark_data.description
        )
        
        return {
            "message": "Marcador añadido exitosamente",
            "bookmark": {
                "id": bookmark.id,
                "timestamp": bookmark.timestamp,
                "title": bookmark.title,
                "description": bookmark.description,
                "created_at": bookmark.created_at.isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error añadiendo marcador: {str(e)}"
        )

@router.get("/videos/{lesson_id}/{video_id}/bookmarks", summary="Obtener marcadores")
async def get_bookmarks(
    lesson_id: str,
    video_id: str,
    current_user: User = Depends(get_current_active_user),
    progress_service: ProgressService = Depends(get_progress_service)
):
    """
    Obtiene los marcadores de un video
    """
    bookmarks = await progress_service.get_video_bookmarks(
        user_id=current_user.id,
        lesson_id=lesson_id,
        video_id=video_id
    )
    
    return {
        "bookmarks": [
            {
                "id": b.id,
                "timestamp": b.timestamp,
                "title": b.title,
                "description": b.description,
                "created_at": b.created_at.isoformat()
            }
            for b in bookmarks
        ]
    }

@router.post("/videos/{lesson_id}/{video_id}/notes", summary="Añadir nota")
async def create_note(
    lesson_id: str,
    video_id: str,
    note_data: NoteCreate,
    current_user: User = Depends(get_current_active_user),
    progress_service: ProgressService = Depends(get_progress_service)
):
    """
    Añade una nota a un video
    """
    try:
        note = await progress_service.add_video_note(
            user_id=current_user.id,
            lesson_id=lesson_id,
            video_id=video_id,
            timestamp=note_data.timestamp,
            content=note_data.content,
            is_private=note_data.is_private
        )
        
        return {
            "message": "Nota añadida exitosamente",
            "note": {
                "id": note.id,
                "timestamp": note.timestamp,
                "content": note.content,
                "is_private": note.is_private,
                "created_at": note.created_at.isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error añadiendo nota: {str(e)}"
        )

@router.get("/videos/{lesson_id}/{video_id}/notes", summary="Obtener notas")
async def get_notes(
    lesson_id: str,
    video_id: str,
    current_user: User = Depends(get_current_active_user),
    progress_service: ProgressService = Depends(get_progress_service)
):
    """
    Obtiene las notas de un video
    """
    notes = await progress_service.get_video_notes(
        user_id=current_user.id,
        lesson_id=lesson_id,
        video_id=video_id
    )
    
    return {
        "notes": [
            {
                "id": n.id,
                "timestamp": n.timestamp,
                "content": n.content,
                "is_private": n.is_private,
                "created_at": n.created_at.isoformat(),
                "updated_at": n.updated_at.isoformat() if n.updated_at else None
            }
            for n in notes
        ]
    }
