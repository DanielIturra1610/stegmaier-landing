"""
Course Progress Endpoints
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ...deps import get_current_active_user
from ....domain.entities.user import User
from ....dependencies import get_progress_service
from ....application.services.progress_service import ProgressService

router = APIRouter()

# === BATCH SYNC MODEL ===

class BatchProgressUpdate(BaseModel):
    lesson_id: str
    progress_percentage: float = None
    time_spent_delta: int = 0
    video_position: int = None
    quiz_score: float = None

class BatchSyncRequest(BaseModel):
    updates: List[BatchProgressUpdate]

# === COURSE PROGRESS ENDPOINTS ===

@router.get("/courses/{course_id}", summary="Obtener progreso del curso")
async def get_course_progress(
    course_id: str,
    current_user: User = Depends(get_current_active_user),
    progress_service: ProgressService = Depends(get_progress_service)
):
    """
    Obtener progreso completo del curso
    """
    try:
        detailed_progress = await progress_service.get_detailed_course_progress(
            user_id=current_user.id,
            course_id=course_id
        )
        
        if "error" in detailed_progress:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=detailed_progress["error"]
            )
        
        if not detailed_progress["course_progress"]:
            return {
                "course_progress": None,
                "lessons_progress": [],
                "next_lesson": None,
                "completion_percentage": 0.0,
                "message": "No hay progreso registrado para este curso"
            }
        
        course_progress = detailed_progress["course_progress"]
        next_lesson = detailed_progress["next_lesson"]
        
        # Serializar course progress
        course_data = {
            "id": course_progress.id,
            "course_id": course_progress.course_id,
            "progress_percentage": course_progress.progress_percentage,
            "status": course_progress.status.value,
            "lessons_completed": course_progress.lessons_completed,
            "total_lessons": course_progress.total_lessons,
            "total_time_spent": course_progress.total_time_spent,
            "certificate_issued": course_progress.certificate_issued,
            "certificate_url": course_progress.certificate_url,
            "started_at": course_progress.started_at.isoformat() if course_progress.started_at else None,
            "last_accessed_at": course_progress.last_accessed_at.isoformat() if course_progress.last_accessed_at else None,
            "completed_at": course_progress.completed_at.isoformat() if course_progress.completed_at else None
        }
        
        # Serializar lessons progress
        lessons_data = [
            {
                "id": lp.id,
                "lesson_id": lp.lesson_id,
                "status": lp.status.value,
                "progress_percentage": lp.progress_percentage,
                "time_spent": lp.time_spent,
                "content_type": lp.content_type,
                "completed_at": lp.completed_at.isoformat() if lp.completed_at else None
            }
            for lp in course_progress.lessons_progress
        ]
        
        # Serializar next lesson
        next_lesson_data = None
        if next_lesson:
            next_lesson_data = {
                "id": next_lesson.id,
                "lesson_id": next_lesson.lesson_id,
                "status": next_lesson.status.value,
                "progress_percentage": next_lesson.progress_percentage,
                "content_type": next_lesson.content_type
            }
        
        return {
            "course_progress": course_data,
            "lessons_progress": lessons_data,
            "next_lesson": next_lesson_data,
            "completion_percentage": detailed_progress["completion_percentage"],
            "certificate_available": detailed_progress["certificate_available"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo progreso del curso: {str(e)}"
        )

@router.get("/summary", summary="Resumen de progreso del usuario")
async def get_user_progress_summary(
    current_user: User = Depends(get_current_active_user),
    progress_service: ProgressService = Depends(get_progress_service)
):
    """
    Obtener resumen completo de progreso del usuario
    """
    try:
        summary = await progress_service.get_user_progress_summary(current_user.id)
        
        return {
            "summary": {
                "user_id": summary.user_id,
                "total_courses_enrolled": summary.total_courses_enrolled,
                "courses_completed": summary.courses_completed,
                "courses_in_progress": summary.courses_in_progress,
                "courses_not_started": summary.courses_not_started,
                "total_time_spent": summary.total_time_spent,
                "certificates_earned": summary.certificates_earned,
                "total_lessons_completed": summary.total_lessons_completed,
                "completion_rate": summary.completion_rate(),
                "last_activity": summary.last_activity.isoformat() if summary.last_activity else None
            },
            "recent_courses": [
                {
                    "course_id": cp.course_id,
                    "progress_percentage": cp.progress_percentage,
                    "status": cp.status.value,
                    "last_accessed_at": cp.last_accessed_at.isoformat() if cp.last_accessed_at else None
                }
                for cp in summary.recent_courses
            ]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo resumen de progreso: {str(e)}"
        )

# === BATCH SYNC ENDPOINT ===

@router.post("/sync", summary="Sincronización batch de progreso")
async def sync_progress_batch(
    sync_data: BatchSyncRequest,
    current_user: User = Depends(get_current_active_user),
    progress_service: ProgressService = Depends(get_progress_service)
):
    """
    Sincronizar múltiples actualizaciones de progreso (para offline sync)
    """
    try:
        synced_count = 0
        failed_updates = []
        
        for update in sync_data.updates:
            try:
                # Necesitamos course_id y enrollment_id - se pueden pasar como query params
                # o inferir desde la lección. Por ahora usamos valores por defecto
                await progress_service.update_lesson_progress(
                    user_id=current_user.id,
                    lesson_id=update.lesson_id,
                    course_id="",  # TODO: Obtener desde lesson_id
                    enrollment_id="",  # TODO: Obtener desde user + course
                    progress_percentage=update.progress_percentage,
                    time_spent_delta=update.time_spent_delta,
                    video_position=update.video_position,
                    quiz_score=update.quiz_score
                )
                synced_count += 1
                
            except Exception as e:
                failed_updates.append({
                    "lesson_id": update.lesson_id,
                    "reason": str(e)
                })
        
        return {
            "message": "Sincronización completada",
            "synced_count": synced_count,
            "failed_count": len(failed_updates),
            "conflicts": failed_updates
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en sincronización batch: {str(e)}"
        )
