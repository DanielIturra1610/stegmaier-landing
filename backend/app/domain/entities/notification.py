"""
Entidad de dominio para el sistema de notificaciones
"""
from datetime import datetime
from typing import Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum


class NotificationType(str, Enum):
    """Tipos de notificaciones del sistema"""
    COURSE_COMPLETION = "course_completion"
    COURSE_PROGRESS = "course_progress"
    NEW_COURSE = "new_course"
    ENROLLMENT = "enrollment"
    QUIZ_COMPLETED = "quiz_completed"
    ASSIGNMENT_SUBMITTED = "assignment_submitted"
    CERTIFICATE_AWARDED = "certificate_awarded"
    COURSE_PUBLISHED = "course_published"
    LESSON_COMPLETED = "lesson_completed"
    SYSTEM_UPDATE = "system_update"


class NotificationStatus(str, Enum):
    """Estados de las notificaciones"""
    UNREAD = "unread"
    READ = "read"
    ARCHIVED = "archived"


@dataclass
class Notification:
    """Entidad de notificación del sistema"""
    id: Optional[str] = None
    recipient_id: str = ""  # ID del usuario que recibe la notificación
    sender_id: Optional[str] = None  # ID del usuario que generó la notificación (opcional)
    type: NotificationType = NotificationType.SYSTEM_UPDATE
    title: str = ""
    message: str = ""
    status: NotificationStatus = NotificationStatus.UNREAD
    metadata: Dict[str, Any] = None  # Datos adicionales (course_id, quiz_id, etc.)
    action_url: Optional[str] = None  # URL de acción (opcional)
    action_label: Optional[str] = None  # Etiqueta del botón de acción
    created_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    archived_at: Optional[datetime] = None

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}
        if self.created_at is None:
            self.created_at = datetime.utcnow()

    def mark_as_read(self) -> None:
        """Marca la notificación como leída"""
        self.status = NotificationStatus.READ
        self.read_at = datetime.utcnow()

    def archive(self) -> None:
        """Archiva la notificación"""
        self.status = NotificationStatus.ARCHIVED
        self.archived_at = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        """Convierte la notificación a diccionario"""
        return {
            "id": self.id,
            "recipient_id": self.recipient_id,
            "sender_id": self.sender_id,
            "type": self.type.value,
            "title": self.title,
            "message": self.message,
            "status": self.status.value,
            "metadata": self.metadata,
            "action_url": self.action_url,
            "action_label": self.action_label,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "read_at": self.read_at.isoformat() if self.read_at else None,
            "archived_at": self.archived_at.isoformat() if self.archived_at else None
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Notification':
        """Crea una notificación desde un diccionario"""
        return cls(
            id=data.get("id"),
            recipient_id=data.get("recipient_id", ""),
            sender_id=data.get("sender_id"),
            type=NotificationType(data.get("type", NotificationType.SYSTEM_UPDATE)),
            title=data.get("title", ""),
            message=data.get("message", ""),
            status=NotificationStatus(data.get("status", NotificationStatus.UNREAD)),
            metadata=data.get("metadata", {}),
            action_url=data.get("action_url"),
            action_label=data.get("action_label"),
            created_at=datetime.fromisoformat(data["created_at"]) if data.get("created_at") else None,
            read_at=datetime.fromisoformat(data["read_at"]) if data.get("read_at") else None,
            archived_at=datetime.fromisoformat(data["archived_at"]) if data.get("archived_at") else None
        )
