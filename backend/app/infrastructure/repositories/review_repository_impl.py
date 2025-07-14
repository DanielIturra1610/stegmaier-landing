"""
Implementación concreta del repositorio de reseñas usando MongoDB
"""
from typing import List, Optional
from bson.objectid import ObjectId
from ...domain.entities.review import Review
from ...domain.repositories.review_repository import ReviewRepository
from ..database import get_database

class MongoDBReviewRepository(ReviewRepository):
    """
    Implementación del repositorio de reseñas usando MongoDB
    """
    collection_name = "reviews"
    
    async def create(self, review: Review) -> Review:
        """Crear una nueva reseña"""
        db = await get_database()
        review_dict = review.dict(exclude={"id"})
        result = await db[self.collection_name].insert_one(review_dict)
        review.id = str(result.inserted_id)
        return review
    
    async def get_by_id(self, review_id: str) -> Optional[Review]:
        """Obtener reseña por ID"""
        db = await get_database()
        review_data = await db[self.collection_name].find_one({"_id": ObjectId(review_id)})
        if review_data:
            review_data["id"] = str(review_data.pop("_id"))
            return Review(**review_data)
        return None
    
    async def get_by_user_and_course(self, user_id: str, course_id: str) -> Optional[Review]:
        """Obtener reseña por usuario y curso"""
        db = await get_database()
        review_data = await db[self.collection_name].find_one(
            {"user_id": user_id, "course_id": course_id}
        )
        if review_data:
            review_data["id"] = str(review_data.pop("_id"))
            return Review(**review_data)
        return None
    
    async def get_by_course(self, course_id: str, skip: int = 0, limit: int = 100) -> List[Review]:
        """Obtener todas las reseñas de un curso"""
        db = await get_database()
        reviews_data = await db[self.collection_name].find(
            {"course_id": course_id}
        ).skip(skip).limit(limit).to_list(length=limit)
        return [Review(id=str(review.pop("_id")), **review) for review in reviews_data]
    
    async def get_by_user(self, user_id: str) -> List[Review]:
        """Obtener todas las reseñas de un usuario"""
        db = await get_database()
        reviews_data = await db[self.collection_name].find(
            {"user_id": user_id}
        ).to_list(length=100)
        return [Review(id=str(review.pop("_id")), **review) for review in reviews_data]
    
    async def update(self, review_id: str, review_data: dict) -> Optional[Review]:
        """Actualizar reseña"""
        db = await get_database()
        
        # Excluir campos no actualizables directamente
        if "id" in review_data:
            del review_data["id"]
            
        await db[self.collection_name].update_one(
            {"_id": ObjectId(review_id)},
            {"$set": review_data}
        )
        return await self.get_by_id(review_id)
    
    async def delete(self, review_id: str) -> bool:
        """Eliminar reseña"""
        db = await get_database()
        result = await db[self.collection_name].delete_one({"_id": ObjectId(review_id)})
        return result.deleted_count > 0
    
    async def calculate_course_average(self, course_id: str) -> float:
        """Calcular promedio de calificaciones de un curso"""
        db = await get_database()
        pipeline = [
            {"$match": {"course_id": course_id}},
            {"$group": {"_id": "$course_id", "average": {"$avg": "$rating"}}}
        ]
        result = await db[self.collection_name].aggregate(pipeline).to_list(length=1)
        if result:
            return result[0]["average"]
        return 0.0
