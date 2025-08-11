"""
Implementación concreta del repositorio de inscripciones usando MongoDB
"""
from typing import List, Optional
from datetime import datetime
from bson.objectid import ObjectId
from ...domain.entities.enrollment import Enrollment
from ...domain.repositories.enrollment_repository import EnrollmentRepository
from ..database import get_database

class MongoDBEnrollmentRepository(EnrollmentRepository):
    """
    Implementación del repositorio de inscripciones usando MongoDB
    """
    collection_name = "enrollments"
    
    def __init__(self, db):
        self.db = db
    
    async def create(self, enrollment: Enrollment) -> Enrollment:
        """Crear una nueva inscripción"""
        enrollment_dict = enrollment.dict(exclude={"id"})
        result = await self.db[self.collection_name].insert_one(enrollment_dict)
        enrollment.id = str(result.inserted_id)
        return enrollment
    
    async def get_by_id(self, enrollment_id: str) -> Optional[Enrollment]:
        """Obtener inscripción por ID"""
        enrollment_data = await self.db[self.collection_name].find_one({"_id": ObjectId(enrollment_id)})
        if enrollment_data:
            enrollment_data["id"] = str(enrollment_data.pop("_id"))
            return Enrollment(**enrollment_data)
        return None
    
    async def get_by_user_and_course(self, user_id: str, course_id: str) -> Optional[Enrollment]:
        """Obtener inscripción por usuario y curso"""
        enrollment_data = await self.db[self.collection_name].find_one(
            {"user_id": user_id, "course_id": course_id}
        )
        if enrollment_data:
            enrollment_data["id"] = str(enrollment_data.pop("_id"))
            return Enrollment(**enrollment_data)
        return None
    
    async def get_by_user(self, user_id: str) -> List[Enrollment]:
        """Obtener todas las inscripciones de un usuario"""
        enrollments_data = await self.db[self.collection_name].find(
            {"user_id": user_id}
        ).to_list(length=100)
        return [Enrollment(id=str(enrollment.pop("_id")), **enrollment) for enrollment in enrollments_data]
    
    async def get_by_course(self, course_id: str) -> List[Enrollment]:
        """Obtener todas las inscripciones de un curso"""
        enrollments_data = await self.db[self.collection_name].find(
            {"course_id": course_id}
        ).to_list(length=100)
        return [Enrollment(id=str(enrollment.pop("_id")), **enrollment) for enrollment in enrollments_data]
    
    async def count_by_course(self, course_id: str, active_only: bool = False) -> int:
        """Contar inscripciones por curso (opcionalmente solo activas)"""
        query = {"course_id": course_id}
        if active_only:
            # El estado se almacena como string (e.g., "active") según el Enum
            query["status"] = "active"
        return await self.db[self.collection_name].count_documents(query)
    
    async def update_progress(self, enrollment_id: str, progress: float, completed_lessons: List[str]) -> bool:
        """Actualizar progreso de inscripción"""
        result = await self.db[self.collection_name].update_one(
            {"_id": ObjectId(enrollment_id)},
            {
                "$set": {
                    "progress": progress,
                    "completed_lessons": completed_lessons,
                    "last_accessed": datetime.utcnow()
                }
            }
        )
        return result.modified_count > 0
    
    async def update_status(self, enrollment_id: str, status: str) -> bool:
        """Actualizar estado de inscripción"""
        result = await self.db[self.collection_name].update_one(
            {"_id": ObjectId(enrollment_id)},
            {"$set": {"status": status}}
        )
        return result.modified_count > 0
    
    async def delete(self, enrollment_id: str) -> bool:
        """Eliminar inscripción"""
        result = await self.db[self.collection_name].delete_one({"_id": ObjectId(enrollment_id)})
        return result.deleted_count > 0
        
    async def issue_certificate(self, enrollment_id: str, certificate_url: str) -> bool:
        """Emitir certificado para una inscripción completada"""
        result = await self.db[self.collection_name].update_one(
            {"_id": ObjectId(enrollment_id)},
            {
                "$set": {
                    "certificate_issued": True,
                    "certificate_url": certificate_url
                }
            }
        )
        return result.modified_count > 0
