"""
Endpoints API para el sistema de notificaciones
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Security
from fastapi.security import HTTPBearer

from ....domain.entities.notification import NotificationStatus, NotificationType
from ....application.services.notification_service import NotificationService
from ....application.dtos.notification_dto import (
    NotificationCreate, NotificationResponse, NotificationListResponse,
    BulkNotificationCreate
)
from ....dependencies import get_notification_service
from ...deps import get_current_user, get_current_admin_user
from ....domain.entities.user import User

router = APIRouter()
security = HTTPBearer()


@router.get("/", response_model=NotificationListResponse)
async def get_user_notifications(
    status: Optional[NotificationStatus] = Query(None, description="Filtrar por estado"),
    page: int = Query(1, ge=1, description="Número de página"),
    per_page: int = Query(20, ge=1, le=100, description="Notificaciones por página"),
    current_user: User = Depends(get_current_user),
    notification_service: NotificationService = Depends(get_notification_service)
):
    """Obtiene las notificaciones del usuario actual"""
    skip = (page - 1) * per_page
    
    notifications = await notification_service.get_user_notifications(
        current_user.id, status, per_page, skip
    )
    
    unread_count = await notification_service.get_unread_count(current_user.id)
    
    # Para obtener el total, necesitaríamos una consulta adicional
    # Por simplicidad, usamos el número actual de notificaciones
    total = len(notifications) + skip
    
    return NotificationListResponse(
        notifications=notifications,
        total=total,
        unread_count=unread_count,
        page=page,
        per_page=per_page
    )


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    notification_service: NotificationService = Depends(get_notification_service)
):
    """Obtiene el número de notificaciones no leídas"""
    count = await notification_service.get_unread_count(current_user.id)
    return {"unread_count": count}


@router.patch("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    notification_service: NotificationService = Depends(get_notification_service)
):
    """Marca una notificación como leída"""
    success = await notification_service.mark_as_read(notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    
    return {"message": "Notificación marcada como leída"}


@router.patch("/mark-all-read")
async def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    notification_service: NotificationService = Depends(get_notification_service)
):
    """Marca todas las notificaciones del usuario como leídas"""
    count = await notification_service.mark_all_as_read(current_user.id)
    return {"message": f"{count} notificaciones marcadas como leídas"}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    notification_service: NotificationService = Depends(get_notification_service)
):
    """Elimina una notificación"""
    success = await notification_service.delete_notification(notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    
    return {"message": "Notificación eliminada"}


@router.patch("/{notification_id}/archive")
async def archive_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    notification_service: NotificationService = Depends(get_notification_service)
):
    """Archiva una notificación"""
    success = await notification_service.archive_notification(notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    
    return {"message": "Notificación archivada"}


# Endpoints administrativos

@router.post("/", response_model=NotificationResponse)
async def create_notification(
    notification_data: NotificationCreate,
    current_user: User = Security(get_current_admin_user, scopes=["admin"]),
    notification_service: NotificationService = Depends(get_notification_service)
):
    """Crea una nueva notificación (solo admins)"""
    return await notification_service.create_notification(notification_data)


@router.post("/bulk", response_model=List[NotificationResponse])
async def create_bulk_notifications(
    bulk_data: BulkNotificationCreate,
    current_user: User = Security(get_current_admin_user, scopes=["admin"]),
    notification_service: NotificationService = Depends(get_notification_service)
):
    """Crea múltiples notificaciones en lote (solo admins)"""
    return await notification_service.bulk_create_notifications(bulk_data)


@router.post("/course-published/{course_id}")
async def notify_course_published(
    course_id: str,
    current_user: User = Security(get_current_admin_user, scopes=["admin"]),
    notification_service: NotificationService = Depends(get_notification_service)
):
    """Notifica a todos los estudiantes sobre un nuevo curso publicado"""
    # Esta funcionalidad requeriría obtener todos los estudiantes
    # Por ahora es un placeholder
    return {"message": "Notificaciones de curso publicado enviadas"}


# Endpoints específicos del dominio LMS

@router.post("/course-completion")
async def notify_course_completion(
    student_id: str,
    course_id: str,
    course_title: str,
    instructor_id: str,
    current_user: User = Depends(get_current_user),
    notification_service: NotificationService = Depends(get_notification_service)
):
    """Notifica completación de curso al instructor"""
    await notification_service.notify_course_completion(
        student_id, course_id, course_title, instructor_id
    )
    return {"message": "Notificación de completación enviada"}


@router.post("/course-progress")
async def notify_course_progress(
    student_id: str,
    course_id: str,
    course_title: str,
    instructor_id: str,
    progress_percentage: int,
    current_user: User = Depends(get_current_user),
    notification_service: NotificationService = Depends(get_notification_service)
):
    """Notifica progreso significativo al instructor"""
    await notification_service.notify_course_progress(
        student_id, course_id, course_title, instructor_id, progress_percentage
    )
    return {"message": "Notificación de progreso enviada"}


@router.post("/enrollment")
async def notify_new_enrollment(
    student_id: str,
    course_id: str,
    course_title: str,
    instructor_id: str,
    student_name: str,
    current_user: User = Depends(get_current_user),
    notification_service: NotificationService = Depends(get_notification_service)
):
    """Notifica nueva inscripción al instructor"""
    await notification_service.notify_new_enrollment(
        student_id, course_id, course_title, instructor_id, student_name
    )
    return {"message": "Notificación de inscripción enviada"}


@router.post("/quiz-completion")
async def notify_quiz_completion(
    student_id: str,
    quiz_id: str,
    quiz_title: str,
    course_id: str,
    instructor_id: str,
    score: float,
    current_user: User = Depends(get_current_user),
    notification_service: NotificationService = Depends(get_notification_service)
):
    """Notifica completación de quiz al instructor"""
    await notification_service.notify_quiz_completion(
        student_id, quiz_id, quiz_title, course_id, instructor_id, score
    )
    return {"message": "Notificación de quiz completado enviada"}
