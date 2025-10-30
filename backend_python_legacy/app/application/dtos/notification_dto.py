"""
DTOs para el sistema de notificaciones
"""
from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

from ...domain.entities.notification import NotificationType, NotificationStatus


class NotificationCreate(BaseModel):
    """DTO para crear notificaciones"""
    recipient_id: str = Field(..., description="ID del usuario destinatario")
    sender_id: Optional[str] = Field(None, description="ID del usuario emisor")
    type: NotificationType = Field(..., description="Tipo de notificación")
    title: str = Field(..., min_length=1, max_length=200, description="Título de la notificación")
    message: str = Field(..., min_length=1, max_length=1000, description="Mensaje de la notificación")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Metadatos adicionales")
    action_url: Optional[str] = Field(None, description="URL de acción")
    action_label: Optional[str] = Field(None, description="Etiqueta del botón de acción")


class NotificationUpdate(BaseModel):
    """DTO para actualizar notificaciones"""
    status: Optional[NotificationStatus] = None
    read_at: Optional[datetime] = None
    archived_at: Optional[datetime] = None


class NotificationResponse(BaseModel):
    """DTO de respuesta para notificaciones"""
    id: str
    recipient_id: str
    sender_id: Optional[str]
    type: str
    title: str
    message: str
    status: str
    metadata: Dict[str, Any]
    action_url: Optional[str]
    action_label: Optional[str]
    created_at: datetime
    read_at: Optional[datetime]
    archived_at: Optional[datetime]

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    """DTO de respuesta para lista de notificaciones"""
    notifications: List[NotificationResponse]
    total: int
    unread_count: int
    page: int
    per_page: int


class BulkNotificationCreate(BaseModel):
    """DTO para crear múltiples notificaciones"""
    recipient_ids: List[str] = Field(..., description="Lista de IDs de destinatarios")
    sender_id: Optional[str] = Field(None, description="ID del usuario emisor")
    type: NotificationType = Field(..., description="Tipo de notificación")
    title: str = Field(..., min_length=1, max_length=200, description="Título de la notificación")
    message: str = Field(..., min_length=1, max_length=1000, description="Mensaje de la notificación")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Metadatos adicionales")
    action_url: Optional[str] = Field(None, description="URL de acción")
    action_label: Optional[str] = Field(None, description="Etiqueta del botón de acción")


class NotificationFilters(BaseModel):
    """DTO para filtros de notificaciones"""
    status: Optional[NotificationStatus] = None
    type: Optional[NotificationType] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    sender_id: Optional[str] = None
