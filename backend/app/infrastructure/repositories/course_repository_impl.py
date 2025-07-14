"""
Implementación concreta del repositorio de cursos usando MongoDB
"""
from typing import List, Optional, Dict, Any
from bson.objectid import ObjectId
from ...domain.entities.course import Course
from ...domain.repositories.course_repository import CourseRepository
from ..database import get_database

class MongoDBCourseRepository(CourseRepository):
    """
    Implementación del repositorio de cursos usando MongoDB
    """
    collection_name = "courses"
    
    async def create(self, course: Course) -> Course:
        """Crear un nuevo curso"""
        db = await get_database()
        course_dict = course.dict(exclude={"id"})
        result = await db[self.collection_name].insert_one(course_dict)
        course.id = str(result.inserted_id)
        return course
    
    async def get_by_id(self, course_id: str) -> Optional[Course]:
        """Obtener curso por ID"""
        db = await get_database()
        course_data = await db[self.collection_name].find_one({"_id": ObjectId(course_id)})
        if course_data:
            course_data["id"] = str(course_data.pop("_id"))
            return Course(**course_data)
        return None
    
    async def list(self, skip: int = 0, limit: int = 100, **filters) -> List[Course]:
        """Listar cursos con paginación y filtros opcionales"""
        db = await get_database()
        query = {}
        
        # Aplicar filtros si se proporcionan
        if "category" in filters and filters["category"]:
            query["category"] = filters["category"]
        if "level" in filters and filters["level"]:
            query["level"] = filters["level"]
        if "is_published" in filters:
            query["is_published"] = filters["is_published"]
            
        courses_data = await db[self.collection_name].find(query).skip(skip).limit(limit).to_list(length=limit)
        return [Course(id=str(course.pop("_id")), **course) for course in courses_data]
    
    async def get_by_instructor(self, instructor_id: str) -> List[Course]:
        """Obtener cursos por instructor"""
        db = await get_database()
        courses_data = await db[self.collection_name].find({"instructor_id": instructor_id}).to_list(length=100)
        return [Course(id=str(course.pop("_id")), **course) for course in courses_data]
    
    async def search(self, query: str, skip: int = 0, limit: int = 100) -> List[Course]:
        """Buscar cursos por título, descripción o etiquetas"""
        db = await get_database()
        search_query = {
            "$or": [
                {"title": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}},
                {"tags": {"$in": [query]}}
            ]
        }
        courses_data = await db[self.collection_name].find(search_query).skip(skip).limit(limit).to_list(length=limit)
        return [Course(id=str(course.pop("_id")), **course) for course in courses_data]
    
    async def update(self, course_id: str, course_data: dict) -> Optional[Course]:
        """Actualizar curso"""
        db = await get_database()
        
        # Excluir campos no actualizables directamente
        if "id" in course_data:
            del course_data["id"]
            
        await db[self.collection_name].update_one(
            {"_id": ObjectId(course_id)},
            {"$set": course_data}
        )
        return await self.get_by_id(course_id)
    
    async def delete(self, course_id: str) -> bool:
        """Eliminar curso"""
        db = await get_database()
        result = await db[self.collection_name].delete_one({"_id": ObjectId(course_id)})
        return result.deleted_count > 0
    
    async def update_rating(self, course_id: str, new_rating: float) -> bool:
        """Actualizar calificación promedio del curso"""
        db = await get_database()
        result = await db[self.collection_name].update_one(
            {"_id": ObjectId(course_id)},
            {"$set": {"average_rating": new_rating}}
        )
        return result.modified_count > 0
