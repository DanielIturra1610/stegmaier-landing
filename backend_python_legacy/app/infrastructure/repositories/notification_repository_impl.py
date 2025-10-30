"""
Implementación MongoDB del repositorio de notificaciones
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from ...domain.repositories.notification_repository import NotificationRepository
from ...domain.entities.notification import Notification, NotificationType, NotificationStatus


class MongoDBNotificationRepository(NotificationRepository):
    """Implementación MongoDB para el repositorio de notificaciones"""

    def __init__(self, database: AsyncIOMotorDatabase):
        self.database = database
        self.collection = database.notifications

    async def create(self, notification: Notification) -> Notification:
        """Crea una nueva notificación"""
        notification_dict = notification.to_dict()
        notification_dict.pop("id", None)  # Remove id for MongoDB
        
        result = await self.collection.insert_one(notification_dict)
        notification.id = str(result.inserted_id)
        return notification

    async def get_by_id(self, notification_id: str) -> Optional[Notification]:
        """Obtiene una notificación por su ID"""
        try:
            doc = await self.collection.find_one({"_id": ObjectId(notification_id)})
            if doc:
                doc["id"] = str(doc.pop("_id"))
                return Notification.from_dict(doc)
            return None
        except Exception:
            return None

    async def get_by_recipient(
        self, 
        recipient_id: str, 
        status: Optional[NotificationStatus] = None,
        limit: int = 50,
        skip: int = 0
    ) -> List[Notification]:
        """Obtiene notificaciones de un receptor específico"""
        query = {"recipient_id": recipient_id}
        if status:
            query["status"] = status.value

        cursor = self.collection.find(query)\
            .sort("created_at", -1)\
            .skip(skip)\
            .limit(limit)
        
        notifications = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            notifications.append(Notification.from_dict(doc))
        
        return notifications

    async def get_unread_count(self, recipient_id: str) -> int:
        """Obtiene el número de notificaciones no leídas de un usuario"""
        return await self.collection.count_documents({
            "recipient_id": recipient_id,
            "status": NotificationStatus.UNREAD.value
        })

    async def mark_as_read(self, notification_id: str) -> bool:
        """Marca una notificación como leída"""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(notification_id)},
                {
                    "$set": {
                        "status": NotificationStatus.READ.value,
                        "read_at": datetime.utcnow().isoformat()
                    }
                }
            )
            return result.modified_count > 0
        except Exception:
            return False

    async def mark_all_as_read(self, recipient_id: str) -> int:
        """Marca todas las notificaciones de un usuario como leídas"""
        result = await self.collection.update_many(
            {
                "recipient_id": recipient_id,
                "status": NotificationStatus.UNREAD.value
            },
            {
                "$set": {
                    "status": NotificationStatus.READ.value,
                    "read_at": datetime.utcnow().isoformat()
                }
            }
        )
        return result.modified_count

    async def archive_notification(self, notification_id: str) -> bool:
        """Archiva una notificación"""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(notification_id)},
                {
                    "$set": {
                        "status": NotificationStatus.ARCHIVED.value,
                        "archived_at": datetime.utcnow().isoformat()
                    }
                }
            )
            return result.modified_count > 0
        except Exception:
            return False

    async def delete(self, notification_id: str) -> bool:
        """Elimina una notificación"""
        try:
            result = await self.collection.delete_one({"_id": ObjectId(notification_id)})
            return result.deleted_count > 0
        except Exception:
            return False

    async def get_by_type_and_metadata(
        self, 
        notification_type: NotificationType,
        metadata_filters: Dict[str, Any]
    ) -> List[Notification]:
        """Obtiene notificaciones por tipo y metadatos específicos"""
        query = {"type": notification_type.value}
        
        # Agregar filtros de metadatos
        for key, value in metadata_filters.items():
            query[f"metadata.{key}"] = value

        cursor = self.collection.find(query).sort("created_at", -1)
        
        notifications = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            notifications.append(Notification.from_dict(doc))
        
        return notifications

    async def bulk_create(self, notifications: List[Notification]) -> List[Notification]:
        """Crea múltiples notificaciones en lote"""
        if not notifications:
            return []

        docs = []
        for notification in notifications:
            doc = notification.to_dict()
            doc.pop("id", None)
            docs.append(doc)

        result = await self.collection.insert_many(docs)
        
        # Asignar IDs generados
        for i, inserted_id in enumerate(result.inserted_ids):
            notifications[i].id = str(inserted_id)

        return notifications

    async def cleanup_old_notifications(self, days_old: int = 30) -> int:
        """Limpia notificaciones antiguas (archivadas o leídas)"""
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        
        result = await self.collection.delete_many({
            "status": {"$in": [NotificationStatus.READ.value, NotificationStatus.ARCHIVED.value]},
            "created_at": {"$lt": cutoff_date.isoformat()}
        })
        
        return result.deleted_count

    async def get_recent_notifications(
        self, 
        recipient_id: str, 
        hours: int = 24
    ) -> List[Notification]:
        """Obtiene notificaciones recientes de un usuario"""
        cutoff_date = datetime.utcnow() - timedelta(hours=hours)
        
        cursor = self.collection.find({
            "recipient_id": recipient_id,
            "created_at": {"$gte": cutoff_date.isoformat()}
        }).sort("created_at", -1)
        
        notifications = []
        async for doc in cursor:
            doc["id"] = str(doc.pop("_id"))
            notifications.append(Notification.from_dict(doc))
        
        return notifications
