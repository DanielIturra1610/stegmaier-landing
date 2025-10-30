"""
Implementación MongoDB del repositorio de módulos
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from bson.errors import InvalidId

from app.domain.entities.module import Module
from app.domain.repositories.module_repository import ModuleRepository

class MongoDBModuleRepository(ModuleRepository):
    
    def __init__(self, database: AsyncIOMotorDatabase):
        self.database = database
        self.collection = database.modules
    
    async def create(self, module: Module) -> Module:
        """Crear un nuevo módulo"""
        module_data = module.dict(exclude={"id"})
        result = await self.collection.insert_one(module_data)
        module.id = str(result.inserted_id)
        return module
    
    async def get_by_id(self, module_id: str) -> Optional[Module]:
        """Obtener módulo por ID"""
        try:
            doc = await self.collection.find_one({"_id": ObjectId(module_id)})
            if doc:
                doc["id"] = str(doc["_id"])
                del doc["_id"]
                return Module(**doc)
            return None
        except InvalidId:
            return None
    
    async def get_by_course_id(self, course_id: str) -> List[Module]:
        """Obtener todos los módulos de un curso ordenados por 'order'"""
        cursor = self.collection.find({"course_id": course_id}).sort("order", 1)
        modules = []
        async for doc in cursor:
            doc["id"] = str(doc["_id"])
            del doc["_id"]
            modules.append(Module(**doc))
        return modules
    
    async def update(self, module_id: str, module_data: Dict[str, Any]) -> Optional[Module]:
        """Actualizar módulo"""
        try:
            # Agregar timestamp de actualización
            module_data["updated_at"] = datetime.utcnow()
            
            result = await self.collection.update_one(
                {"_id": ObjectId(module_id)},
                {"$set": module_data}
            )
            
            if result.matched_count:
                return await self.get_by_id(module_id)
            return None
        except InvalidId:
            return None
    
    async def delete(self, module_id: str) -> bool:
        """Eliminar módulo"""
        try:
            result = await self.collection.delete_one({"_id": ObjectId(module_id)})
            return result.deleted_count > 0
        except InvalidId:
            return False
    
    async def reorder_modules(self, course_id: str, module_orders: List[Dict[str, int]]) -> bool:
        """Reordenar módulos de un curso"""
        try:
            # Actualizar el orden de cada módulo
            for item in module_orders:
                await self.collection.update_one(
                    {
                        "_id": ObjectId(item["module_id"]),
                        "course_id": course_id
                    },
                    {"$set": {"order": item["order"], "updated_at": datetime.utcnow()}}
                )
            return True
        except (InvalidId, KeyError):
            return False
    
    async def add_lesson_to_module(self, module_id: str, lesson_id: str) -> bool:
        """Agregar lección a un módulo"""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(module_id)},
                {
                    "$addToSet": {"lessons": lesson_id},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            return result.matched_count > 0
        except InvalidId:
            return False
    
    async def remove_lesson_from_module(self, module_id: str, lesson_id: str) -> bool:
        """Remover lección de un módulo"""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(module_id)},
                {
                    "$pull": {"lessons": lesson_id},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            return result.matched_count > 0
        except InvalidId:
            return False
    
    async def count_by_course(self, course_id: str) -> int:
        """Contar módulos de un curso"""
        return await self.collection.count_documents({"course_id": course_id})
