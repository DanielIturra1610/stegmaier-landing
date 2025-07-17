"""
Implementación concreta del repositorio de usuarios usando MongoDB
"""
from typing import List, Optional, Dict, Any
from bson.objectid import ObjectId
from ...domain.entities.user import User
from ...domain.repositories.user_repository import UserRepository
from ..database import get_database

class MongoDBUserRepository(UserRepository):
    """
    Implementación del repositorio de usuarios usando MongoDB
    """
    collection_name = "users"
    
    def __init__(self, db):
        self.db = db
    
    async def create(self, user: User) -> User:
        """Crear un nuevo usuario"""
        user_dict = user.dict(exclude={"id"})
        result = await self.db[self.collection_name].insert_one(user_dict)
        user.id = str(result.inserted_id)
        return user
    
    async def get_by_id(self, user_id: str) -> Optional[User]:
        """Obtener usuario por ID"""
        user_data = await self.db[self.collection_name].find_one({"_id": ObjectId(user_id)})
        if user_data:
            user_data["id"] = str(user_data.pop("_id"))
            return User(**user_data)
        return None
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Obtener usuario por email"""
        user_data = await self.db[self.collection_name].find_one({"email": email})
        if user_data:
            user_data["id"] = str(user_data.pop("_id"))
            return User(**user_data)
        return None
    
    async def get_by_username(self, username: str) -> Optional[User]:
        """Obtener usuario por nombre de usuario"""
        user_data = await self.db[self.collection_name].find_one({"username": username})
        if user_data:
            user_data["id"] = str(user_data.pop("_id"))
            return User(**user_data)
        return None
    
    async def list(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Listar usuarios con paginación"""
        users_data = await self.db[self.collection_name].find().skip(skip).limit(limit).to_list(length=limit)
        return [User(id=str(user.pop("_id")), **user) for user in users_data]
    
    async def update(self, user_id: str, user_data: dict) -> Optional[User]:
        """Actualizar usuario"""
        # Excluir campos no actualizables directamente
        if "id" in user_data:
            del user_data["id"]
            
        await self.db[self.collection_name].update_one(
            {"_id": ObjectId(user_id)},
            {"$set": user_data}
        )
        return await self.get_by_id(user_id)
    
    async def delete(self, user_id: str) -> bool:
        """Eliminar usuario"""
        result = await self.db[self.collection_name].delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0
