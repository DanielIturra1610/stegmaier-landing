"""
Entidades de dominio para gestión de archivos multimedia
"""
from datetime import datetime
from typing import Optional
from dataclasses import dataclass

@dataclass
class VideoAsset:
    """
    Entidad para videos subidos al sistema
    """
    id: Optional[str] = None
    original_filename: str = ""
    stored_filename: str = ""
    file_path: str = ""
    file_size: int = 0
    title: str = ""
    description: Optional[str] = None
    uploaded_by: Optional[str] = None
    upload_date: datetime = None
    mime_type: str = "video/mp4"
    duration: int = 0  # en segundos
    status: str = "uploaded"  # uploaded, processing, ready, error
    
    def __post_init__(self):
        if self.upload_date is None:
            self.upload_date = datetime.utcnow()

@dataclass
class ImageAsset:
    """
    Entidad para imágenes subidas al sistema
    """
    id: Optional[str] = None
    original_filename: str = ""
    stored_filename: str = ""
    file_path: str = ""
    file_size: int = 0
    purpose: str = "general"  # course_cover, profile, general
    uploaded_by: Optional[str] = None
    upload_date: datetime = None
    mime_type: str = "image/jpeg"
    extension: str = ".jpg"
    
    def __post_init__(self):
        if self.upload_date is None:
            self.upload_date = datetime.utcnow()
