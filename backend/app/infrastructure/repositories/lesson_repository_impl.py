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
        """
        Crear una nueva lección.
        
        IMPORTANTE: Normalizar course_id como string para consistencia futura.
        """
        lesson_dict = lesson.dict(exclude={"id"})
        
        # ✅ NORMALIZACIÓN: Siempre guardar course_id como string
        if isinstance(lesson_dict.get('course_id'), ObjectId):
            lesson_dict['course_id'] = str(lesson_dict['course_id'])
        
        print(f"🚀 [LessonRepository] Creating lesson with course_id: {lesson_dict.get('course_id')} (type: {type(lesson_dict.get('course_id'))})")
        
        result = await self.db[self.collection_name].insert_one(lesson_dict)
        lesson.id = str(result.inserted_id)
        
        print(f"✅ [LessonRepository] Lesson created with ID: {lesson.id}")
        return lesson
    
    async def get_by_id(self, lesson_id: str) -> Optional[Lesson]:
        """Obtener lección por ID"""
        lesson_data = await self.db[self.collection_name].find_one({"_id": ObjectId(lesson_id)})
        if lesson_data:
            return self._document_to_entity(lesson_data)
        return None
    
    async def get_by_course(self, course_id: str) -> List[Lesson]:
        """
        Obtener todas las lecciones de un curso.
        
        ROBUSTEZ: Busca course_id tanto como string como ObjectId
        para manejar inconsistencias en datos existentes.
        """
        try:
            # Construir query flexible que maneje ambos formatos
            query_conditions = []
            
            # Siempre buscar como string
            query_conditions.append({"course_id": course_id})
            
            # Si es un ObjectId válido, también buscar como ObjectId
            if ObjectId.is_valid(course_id):
                query_conditions.append({"course_id": ObjectId(course_id)})
            
            query = {"$or": query_conditions} if len(query_conditions) > 1 else query_conditions[0]
            
            lesson_data = await self.db[self.collection_name].find(query).sort("order", 1).to_list(length=100)
            
            # Log para debugging
            print(f"🔍 [LessonRepository] Found {len(lesson_data)} lessons for course_id: {course_id}")
            
            return [self._document_to_entity(doc) for doc in lesson_data]
            
        except Exception as e:
            print(f"❌ [LessonRepository] Error in get_by_course: {e}")
            # En caso de error, devolver lista vacía en lugar de crash
            return []
    
    async def list(self, skip: int = 0, limit: int = 100) -> List[Lesson]:
        """Listar lecciones con paginación"""
        lessons_data = await self.db[self.collection_name].find().skip(skip).limit(limit).to_list(length=limit)
        return [self._document_to_entity(doc) for doc in lessons_data]
    
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

    def _document_to_entity(self, doc: dict) -> Lesson:
        """
        Convertir documento MongoDB a entidad Lesson.
        
        ROBUSTEZ: Normalizar course_id y ObjectId en la conversión.
        """
        # Normalizar ObjectId a string
        if '_id' in doc:
            doc['id'] = str(doc['_id'])
            del doc['_id']
        
        # ✅ NORMALIZACIÓN: Asegurar course_id como string
        if 'course_id' in doc and isinstance(doc['course_id'], ObjectId):
            doc['course_id'] = str(doc['course_id'])
        
        return Lesson(**doc)
