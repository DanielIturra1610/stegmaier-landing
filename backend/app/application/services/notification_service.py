"""
Servicio de aplicación para notificaciones
"""
from typing import List, Optional, Dict, Any
from datetime import datetime

from ...domain.repositories.notification_repository import NotificationRepository
from ...domain.entities.notification import Notification, NotificationType, NotificationStatus
from ..dtos.notification_dto import (
    NotificationCreate, NotificationUpdate, NotificationResponse,
    BulkNotificationCreate, NotificationFilters
)


class NotificationService:
    """Servicio para gestión de notificaciones"""

    def __init__(self, notification_repository: NotificationRepository):
        self.notification_repository = notification_repository

    async def create_notification(self, notification_data: NotificationCreate) -> NotificationResponse:
        """Crea una nueva notificación"""
        notification = Notification(
            recipient_id=notification_data.recipient_id,
            sender_id=notification_data.sender_id,
            type=notification_data.type,
            title=notification_data.title,
            message=notification_data.message,
            metadata=notification_data.metadata or {},
            action_url=notification_data.action_url,
            action_label=notification_data.action_label
        )

        created_notification = await self.notification_repository.create(notification)
        return self._to_response(created_notification)

    async def bulk_create_notifications(self, bulk_data: BulkNotificationCreate) -> List[NotificationResponse]:
        """Crea múltiples notificaciones en lote"""
        notifications = []
        for recipient_id in bulk_data.recipient_ids:
            notification = Notification(
                recipient_id=recipient_id,
                sender_id=bulk_data.sender_id,
                type=bulk_data.type,
                title=bulk_data.title,
                message=bulk_data.message,
                metadata=bulk_data.metadata or {},
                action_url=bulk_data.action_url,
                action_label=bulk_data.action_label
            )
            notifications.append(notification)

        created_notifications = await self.notification_repository.bulk_create(notifications)
        return [self._to_response(notif) for notif in created_notifications]

    async def get_user_notifications(
        self, 
        user_id: str, 
        status: Optional[NotificationStatus] = None,
        limit: int = 50,
        skip: int = 0
    ) -> List[NotificationResponse]:
        """Obtiene notificaciones de un usuario"""
        notifications = await self.notification_repository.get_by_recipient(
            user_id, status, limit, skip
        )
        return [self._to_response(notif) for notif in notifications]

    async def get_unread_count(self, user_id: str) -> int:
        """Obtiene el número de notificaciones no leídas"""
        return await self.notification_repository.get_unread_count(user_id)

    async def mark_as_read(self, notification_id: str) -> bool:
        """Marca una notificación como leída"""
        return await self.notification_repository.mark_as_read(notification_id)

    async def mark_all_as_read(self, user_id: str) -> int:
        """Marca todas las notificaciones como leídas"""
        return await self.notification_repository.mark_all_as_read(user_id)

    async def delete_notification(self, notification_id: str) -> bool:
        """Elimina una notificación"""
        return await self.notification_repository.delete(notification_id)

    async def archive_notification(self, notification_id: str) -> bool:
        """Archiva una notificación"""
        return await self.notification_repository.archive_notification(notification_id)

    # Notificaciones específicas del dominio LMS

    async def notify_course_completion(
        self, 
        student_id: str, 
        course_id: str, 
        course_title: str,
        instructor_id: str
    ) -> None:
        """Notifica completación de curso al instructor"""
        notification = NotificationCreate(
            recipient_id=instructor_id,
            sender_id=student_id,
            type=NotificationType.COURSE_COMPLETION,
            title="Estudiante completó curso",
            message=f"Un estudiante ha completado exitosamente el curso '{course_title}'",
            metadata={
                "course_id": course_id,
                "student_id": student_id,
                "completion_date": datetime.utcnow().isoformat()
            },
            action_url=f"/platform/admin/courses/{course_id}/students",
            action_label="Ver detalles"
        )
        await self.create_notification(notification)

    async def notify_course_progress(
        self, 
        student_id: str, 
        course_id: str, 
        course_title: str,
        instructor_id: str,
        progress_percentage: int
    ) -> None:
        """Notifica progreso significativo del curso al instructor"""
        if progress_percentage >= 80:
            notification = NotificationCreate(
                recipient_id=instructor_id,
                sender_id=student_id,
                type=NotificationType.COURSE_PROGRESS,
                title="Progreso significativo de estudiante",
                message=f"Un estudiante ha alcanzado {progress_percentage}% en el curso '{course_title}'",
                metadata={
                    "course_id": course_id,
                    "student_id": student_id,
                    "progress": progress_percentage
                },
                action_url=f"/platform/admin/courses/{course_id}/students",
                action_label="Ver progreso"
            )
            await self.create_notification(notification)

    async def notify_new_enrollment(
        self, 
        student_id: str, 
        course_id: str, 
        course_title: str,
        instructor_id: str,
        student_name: str
    ) -> None:
        """Notifica nueva inscripción al instructor"""
        notification = NotificationCreate(
            recipient_id=instructor_id,
            sender_id=student_id,
            type=NotificationType.ENROLLMENT,
            title="Nueva inscripción en tu curso",
            message=f"{student_name} se ha inscrito en tu curso '{course_title}'",
            metadata={
                "course_id": course_id,
                "student_id": student_id,
                "enrollment_date": datetime.utcnow().isoformat()
            },
            action_url=f"/platform/admin/courses/{course_id}/students",
            action_label="Ver estudiantes"
        )
        await self.create_notification(notification)

    async def notify_new_course_to_all_students(
        self, 
        course_id: str, 
        course_title: str,
        instructor_name: str,
        student_ids: List[str]
    ) -> None:
        """Notifica nuevo curso a todos los estudiantes"""
        bulk_notification = BulkNotificationCreate(
            recipient_ids=student_ids,
            type=NotificationType.NEW_COURSE,
            title="Nuevo curso disponible",
            message=f"Se ha publicado un nuevo curso: '{course_title}' por {instructor_name}",
            metadata={
                "course_id": course_id,
                "publication_date": datetime.utcnow().isoformat()
            },
            action_url=f"/platform/courses/{course_id}",
            action_label="Ver curso"
        )
        await self.bulk_create_notifications(bulk_notification)

    async def notify_quiz_completion(
        self, 
        student_id: str, 
        quiz_id: str, 
        quiz_title: str,
        course_id: str,
        instructor_id: str,
        score: float
    ) -> None:
        """Notifica completación de quiz al instructor"""
        notification = NotificationCreate(
            recipient_id=instructor_id,
            sender_id=student_id,
            type=NotificationType.QUIZ_COMPLETED,
            title="Quiz completado por estudiante",
            message=f"Un estudiante completó el quiz '{quiz_title}' con puntaje: {score}%",
            metadata={
                "quiz_id": quiz_id,
                "course_id": course_id,
                "student_id": student_id,
                "score": score
            },
            action_url=f"/platform/admin/quizzes/{quiz_id}/statistics"
        )
        
        await self.create_notification(notification)
    
    def _to_response(self, notification: Notification) -> NotificationResponse:
        """Convierte entidad a DTO de respuesta"""
        return NotificationResponse(
            id=notification.id,
            recipient_id=notification.recipient_id,
            sender_id=notification.sender_id,
            type=notification.type.value,
            title=notification.title,
            message=notification.message,
            status=notification.status.value,
            metadata=notification.metadata,
            action_url=notification.action_url,
            action_label=notification.action_label,
            created_at=notification.created_at,
            read_at=notification.read_at,
            archived_at=notification.archived_at
        )
