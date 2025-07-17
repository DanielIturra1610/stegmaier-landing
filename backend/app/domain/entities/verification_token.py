"""
Entidad para tokens de verificación de correo electrónico
"""
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel, Field

class VerificationToken(BaseModel):
    """Modelo para tokens de verificación de email"""
    id: Optional[str] = None
    user_id: str
    token: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(...)
    is_used: bool = False
    
    class Config:
        schema_extra = {
            "example": {
                "user_id": "60d21b4967d0d8992e610c85",
                "token": "abc123def456ghi789jkl012mno345pqr678stu",
                "created_at": "2023-01-01T00:00:00Z",
                "expires_at": "2023-01-02T00:00:00Z",
                "is_used": False
            }
        }
