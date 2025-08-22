"""
Repositorio abstracto para notificaciones
"""
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime

from ..entities.notification import Notification, NotificationType, NotificationStatus


class NotificationRepository(ABC):
    """Repositorio abstracto para manejo de notificaciones"""

    @abstractmethod
    async def create(self, notification: Notification) -> Notification:
        """Crea una nueva notificación"""
        pass

    @abstractmethod
    async def get_by_id(self, notification_id: str) -> Optional[Notification]:
        """Obtiene una notificación por su ID"""
        pass

    @abstractmethod
    async def get_by_recipient(
        self, 
        recipient_id: str, 
        status: Optional[NotificationStatus] = None,
        limit: int = 50,
        skip: int = 0
    ) -> List[Notification]:
        """Obtiene notificaciones de un receptor específico"""
        pass

    @abstractmethod
    async def get_unread_count(self, recipient_id: str) -> int:
        """Obtiene el número de notificaciones no leídas de un usuario"""
        pass

    @abstractmethod
    async def mark_as_read(self, notification_id: str) -> bool:
        """Marca una notificación como leída"""
        pass

    @abstractmethod
    async def mark_all_as_read(self, recipient_id: str) -> int:
        """Marca todas las notificaciones de un usuario como leídas"""
        pass

    @abstractmethod
    async def archive_notification(self, notification_id: str) -> bool:
        """Archiva una notificación"""
        pass

    @abstractmethod
    async def delete(self, notification_id: str) -> bool:
        """Elimina una notificación"""
        pass

    @abstractmethod
    async def get_by_type_and_metadata(
        self, 
        notification_type: NotificationType,
        metadata_filters: Dict[str, Any]
    ) -> List[Notification]:
        """Obtiene notificaciones por tipo y metadatos específicos"""
        pass

    @abstractmethod
    async def bulk_create(self, notifications: List[Notification]) -> List[Notification]:
        """Crea múltiples notificaciones en lote"""
        pass

    @abstractmethod
    async def cleanup_old_notifications(self, days_old: int = 30) -> int:
        """Limpia notificaciones antiguas (archivadas o leídas)"""
        pass
