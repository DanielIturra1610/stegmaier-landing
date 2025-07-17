"""
Implementación concreta del repositorio de lecciones usando MongoDB
"""
from typing import List, Optional
from bson.objectid import ObjectId
from ...domain.entities.lesson import Lesson
from ...domain.repositories.lesson_repository import LessonRepository
from ..database import get_database

class MongoDBLessonRepository(LessonRepository):
    """
    Implementación del repositorio de lecciones usando MongoDB
    """
    collection_name = "lessons"
    
    def __init__(self, db):
        self.db = db
    
    async def create(self, lesson: Lesson) -> Lesson:
        """Crear una nueva lección"""
        lesson_dict = lesson.dict(exclude={"id"})
        result = await self.db[self.collection_name].insert_one(lesson_dict)
        lesson.id = str(result.inserted_id)
        return lesson
    
    async def get_by_id(self, lesson_id: str) -> Optional[Lesson]:
        """Obtener lección por ID"""
        lesson_data = await self.db[self.collection_name].find_one({"_id": ObjectId(lesson_id)})
        if lesson_data:
            lesson_data["id"] = str(lesson_data.pop("_id"))
            return Lesson(**lesson_data)
        return None
    
    async def get_by_course(self, course_id: str) -> List[Lesson]:
        """Obtener todas las lecciones de un curso"""
        lesson_data = await self.db[self.collection_name].find(
            {"course_id": course_id}
        ).sort("order", 1).to_list(length=100)
        
        return [Lesson(id=str(lesson.pop("_id")), **lesson) for lesson in lesson_data]
    
    async def list(self, skip: int = 0, limit: int = 100) -> List[Lesson]:
        """Listar lecciones con paginación"""
        lessons_data = await self.db[self.collection_name].find().skip(skip).limit(limit).to_list(length=limit)
        return [Lesson(id=str(lesson.pop("_id")), **lesson) for lesson in lessons_data]
    
    async def update(self, lesson_id: str, lesson_data: dict) -> Optional[Lesson]:
        """Actualizar lección"""
        
        # Excluir campos no actualizables directamente
        if "id" in lesson_data:
            del lesson_data["id"]
            
        await self.db[self.collection_name].update_one(
            {"_id": ObjectId(lesson_id)},
            {"$set": lesson_data}
        )
        return await self.get_by_id(lesson_id)
    
    async def delete(self, lesson_id: str) -> bool:
        """Eliminar lección"""
        result = await self.db[self.collection_name].delete_one({"_id": ObjectId(lesson_id)})
        return result.deleted_count > 0
    
    async def reorder(self, course_id: str, lesson_order: List[dict]) -> bool:
        """Reordenar lecciones de un curso"""
        operations = []
        
        for item in lesson_order:
            operations.append(
                {
                    "update_one": {
                        "filter": {"_id": ObjectId(item["lesson_id"])},
                        "update": {"$set": {"order": item["order"]}}
                    }
                }
            )
            
        if operations:
            result = await self.db[self.collection_name].bulk_write(operations)
            return result.modified_count == len(lesson_order)
        
        return False
