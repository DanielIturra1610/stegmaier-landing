"""
Servicio para la gestión de reseñas de cursos
"""
from typing import List, Optional
from datetime import datetime
from ...domain.repositories.review_repository import ReviewRepository
from ...domain.repositories.course_repository import CourseRepository
from ...domain.repositories.user_repository import UserRepository
from ...domain.repositories.enrollment_repository import EnrollmentRepository
from ...domain.entities.review import Review
from ...domain.entities.enrollment import EnrollmentStatus
from ..dtos.review_dto import ReviewCreate, ReviewUpdate

class ReviewService:
    """
    Servicio para la gestión de reseñas que implementa la lógica de negocio
    """
    
    def __init__(
        self, 
        review_repository: ReviewRepository,
        course_repository: CourseRepository,
        user_repository: UserRepository,
        enrollment_repository: EnrollmentRepository
    ):
        self.review_repository = review_repository
        self.course_repository = course_repository
        self.user_repository = user_repository
        self.enrollment_repository = enrollment_repository
    
    async def create_review(self, user_id: str, review_data: ReviewCreate) -> Review:
        """
        Crea una nueva reseña para un curso
        
        Args:
            user_id: ID del usuario que crea la reseña
            review_data: Datos de la reseña
        
        Returns:
            La reseña creada
        
        Raises:
            ValueError: Si el usuario no está inscrito en el curso o ya ha dejado una reseña
        """
        # Verificar si el usuario existe
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise ValueError("El usuario no existe")
        
        # Verificar si el curso existe
        course = await self.course_repository.get_by_id(review_data.course_id)
        if not course:
            raise ValueError("El curso no existe")
        
        # Verificar si el usuario está inscrito en el curso y ha completado al menos un 50%
        enrollment = await self.enrollment_repository.get_by_user_and_course(
            user_id, 
            review_data.course_id
        )
        
        if not enrollment:
            raise ValueError("Debes estar inscrito en el curso para dejar una reseña")
        
        if enrollment.status not in [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED]:
            raise ValueError("Tu inscripción no está activa")
        
        if enrollment.progress < 50:
            raise ValueError("Debes completar al menos el 50% del curso para dejar una reseña")
        
        # Verificar si el usuario ya ha dejado una reseña
        existing_review = await self.review_repository.get_by_user_and_course(
            user_id, 
            review_data.course_id
        )
        
        if existing_review:
            raise ValueError("Ya has dejado una reseña para este curso")
        
        # Crear la reseña
        review = Review(
            user_id=user_id,
            course_id=review_data.course_id,
            rating=review_data.rating,
            comment=review_data.comment
        )
        
        created_review = await self.review_repository.create(review)
        
        # Actualizar la calificación promedio del curso
        course_reviews = await self.review_repository.get_by_course(review_data.course_id)
        total_ratings = sum(review.rating for review in course_reviews)
        avg_rating = total_ratings / len(course_reviews) if course_reviews else 0
        
        await self.course_repository.update_rating(
            review_data.course_id, 
            avg_rating
        )
        
        # Actualizar el número de reseñas del curso
        await self.course_repository.update(
            review_data.course_id,
            {"total_reviews": len(course_reviews)}
        )
        
        return created_review
    
    async def get_review_by_id(self, review_id: str) -> Optional[Review]:
        """
        Obtiene una reseña por su ID
        
        Args:
            review_id: ID de la reseña
        
        Returns:
            La reseña encontrada o None
        """
        return await self.review_repository.get_by_id(review_id)
    
    async def get_course_reviews(self, course_id: str, skip: int = 0, limit: int = 20) -> List[Review]:
        """
        Obtiene todas las reseñas de un curso con paginación
        
        Args:
            course_id: ID del curso
            skip: Número de reseñas a saltar
            limit: Número máximo de reseñas a devolver
        
        Returns:
            Lista de reseñas del curso
        """
        return await self.review_repository.get_by_course_paginated(course_id, skip, limit)
    
    async def get_user_reviews(self, user_id: str) -> List[Review]:
        """
        Obtiene todas las reseñas realizadas por un usuario
        
        Args:
            user_id: ID del usuario
        
        Returns:
            Lista de reseñas del usuario
        """
        return await self.review_repository.get_by_user(user_id)
    
    async def update_review(
        self, 
        review_id: str, 
        user_id: str, 
        review_data: ReviewUpdate
    ) -> Optional[Review]:
        """
        Actualiza una reseña
        
        Args:
            review_id: ID de la reseña a actualizar
            user_id: ID del usuario que actualiza la reseña
            review_data: Datos a actualizar
        
        Returns:
            La reseña actualizada o None si no existe
        
        Raises:
            ValueError: Si el usuario no es el autor de la reseña
        """
        # Verificar si la reseña existe
        review = await self.review_repository.get_by_id(review_id)
        if not review:
            return None
        
        # Verificar si el usuario es el autor de la reseña
        if review.user_id != user_id:
            raise ValueError("No tienes permiso para actualizar esta reseña")
        
        # Actualizar la reseña
        update_data = review_data.dict(exclude_unset=True)
        updated_review = await self.review_repository.update(review_id, update_data)
        
        if updated_review and "rating" in update_data:
            # Actualizar la calificación promedio del curso
            course_reviews = await self.review_repository.get_by_course(review.course_id)
            total_ratings = sum(r.rating for r in course_reviews)
            avg_rating = total_ratings / len(course_reviews) if course_reviews else 0
            
            await self.course_repository.update_rating(
                review.course_id, 
                avg_rating
            )
        
        return updated_review
    
    async def delete_review(self, review_id: str, user_id: str) -> bool:
        """
        Elimina una reseña
        
        Args:
            review_id: ID de la reseña a eliminar
            user_id: ID del usuario que elimina la reseña
        
        Returns:
            True si se eliminó correctamente, False si no
        
        Raises:
            ValueError: Si el usuario no es el autor de la reseña ni un administrador
        """
        # Verificar si la reseña existe
        review = await self.review_repository.get_by_id(review_id)
        if not review:
            return False
        
        # Verificar si el usuario tiene permisos para eliminar la reseña
        if review.user_id != user_id:
            user = await self.user_repository.get_by_id(user_id)
            if not user or user.role != "admin":
                raise ValueError("No tienes permiso para eliminar esta reseña")
        
        # Eliminar la reseña
        result = await self.review_repository.delete(review_id)
        
        if result:
            # Actualizar la calificación promedio del curso
            course_reviews = await self.review_repository.get_by_course(review.course_id)
            
            if course_reviews:
                total_ratings = sum(r.rating for r in course_reviews)
                avg_rating = total_ratings / len(course_reviews)
            else:
                avg_rating = 0
            
            await self.course_repository.update_rating(
                review.course_id, 
                avg_rating
            )
            
            # Actualizar el número de reseñas del curso
            await self.course_repository.update(
                review.course_id,
                {"total_reviews": len(course_reviews)}
            )
        
        return result
    
    async def get_course_average_rating(self, course_id: str) -> float:
        """
        Obtiene la calificación promedio de un curso
        
        Args:
            course_id: ID del curso
        
        Returns:
            Calificación promedio del curso
        """
        return await self.review_repository.get_course_average_rating(course_id)
