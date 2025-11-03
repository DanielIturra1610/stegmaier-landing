"""
Implementación del repositorio de tokens de verificación para MongoDB
"""
from typing import List, Optional
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorCollection

from ...domain.entities.verification_token import VerificationToken
from ...domain.repositories.verification_token_repository import VerificationTokenRepository

class MongoVerificationTokenRepository(VerificationTokenRepository):
    """
    Implementación del repositorio de tokens de verificación para MongoDB
    """
    
    def __init__(self, collection: AsyncIOMotorCollection):
        self.collection = collection
        
    async def create(self, verification_token: VerificationToken) -> VerificationToken:
        """
        Crea un nuevo token de verificación en la base de datos
        
        Args:
            verification_token: Token de verificación a crear
            
        Returns:
            El token de verificación creado con su ID asignado
        """
        token_dict = verification_token.dict(exclude={"id"})
        result = await self.collection.insert_one(token_dict)
        verification_token.id = str(result.inserted_id)
        return verification_token
        
    async def get_by_token(self, token: str) -> Optional[VerificationToken]:
        """
        Obtiene un token de verificación por su valor
        
        Args:
            token: Valor del token a buscar
            
        Returns:
            Token de verificación si existe, None en caso contrario
        """
        token_data = await self.collection.find_one({"token": token})
        if token_data:
            token_data["id"] = str(token_data.pop("_id"))
            return VerificationToken(**token_data)
        return None
        
    async def get_by_user_id(self, user_id: str) -> List[VerificationToken]:
        """
        Obtiene todos los tokens de verificación asociados a un usuario
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Lista de tokens de verificación asociados al usuario
        """
        cursor = self.collection.find({"user_id": user_id})
        tokens = []
        async for token_data in cursor:
            token_data["id"] = str(token_data.pop("_id"))
            tokens.append(VerificationToken(**token_data))
        return tokens
        
    async def update(self, token_id: str, token_data: dict) -> Optional[VerificationToken]:
        """
        Actualiza un token de verificación
        
        Args:
            token_id: ID del token a actualizar
            token_data: Datos a actualizar
            
        Returns:
            Token de verificación actualizado si existe, None en caso contrario
        """
        await self.collection.update_one(
            {"_id": ObjectId(token_id)},
            {"$set": token_data}
        )
        updated_token = await self.collection.find_one({"_id": ObjectId(token_id)})
        if updated_token:
            updated_token["id"] = str(updated_token.pop("_id"))
            return VerificationToken(**updated_token)
        return None
        
    async def delete(self, token_id: str) -> bool:
        """
        Elimina un token de verificación
        
        Args:
            token_id: ID del token a eliminar
            
        Returns:
            True si se eliminó correctamente, False en caso contrario
        """
        result = await self.collection.delete_one({"_id": ObjectId(token_id)})
        return result.deleted_count > 0
        
    async def mark_as_used(self, token: str) -> Optional[VerificationToken]:
        """
        Marca un token como utilizado
        
        Args:
            token: Valor del token a marcar como utilizado
            
        Returns:
            Token actualizado si existe, None en caso contrario
        """
        await self.collection.update_one(
            {"token": token},
            {"$set": {"is_used": True}}
        )
        updated_token = await self.collection.find_one({"token": token})
        if updated_token:
            updated_token["id"] = str(updated_token.pop("_id"))
            return VerificationToken(**updated_token)
        return None
