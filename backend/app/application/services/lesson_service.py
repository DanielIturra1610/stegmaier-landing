"""
Servicio para la gestión de lecciones
"""
from typing import List, Optional, Dict
from ...domain.repositories.lesson_repository import LessonRepository
from ...domain.repositories.course_repository import CourseRepository
from ...domain.repositories.user_repository import UserRepository
from ...domain.entities.lesson import Lesson
from ..dtos.lesson_dto import LessonCreate, LessonUpdate, LessonOrderItem

class LessonService:
    """
    Servicio para la gestión de lecciones que implementa la lógica de negocio
    """
    
    def __init__(
        self, 
        lesson_repository: LessonRepository,
        course_repository: CourseRepository,
        user_repository: UserRepository
    ):
        self.lesson_repository = lesson_repository
        self.course_repository = course_repository
        self.user_repository = user_repository
    
    async def create_lesson(self, instructor_id: str, lesson_data: LessonCreate) -> Lesson:
        """
        Crea una nueva lección
        
        Args:
            instructor_id: ID del instructor que crea la lección
            lesson_data: Datos de la lección a crear
        
        Returns:
            La lección creada
        
        Raises:
            ValueError: Si el curso no existe o el usuario no tiene permisos
        """
        # Verificar si el curso existe
        course = await self.course_repository.get_by_id(lesson_data.course_id)
        if not course:
            raise ValueError("El curso no existe")
        
        # Verificar si el usuario tiene permisos para añadir lecciones al curso
        if course.instructor_id != instructor_id:
            instructor = await self.user_repository.get_by_id(instructor_id)
            if not instructor or instructor.role != "admin":
                raise ValueError("No tienes permiso para añadir lecciones a este curso")
        
        # Crear la nueva lección
        lesson = Lesson(
            title=lesson_data.title,
            course_id=lesson_data.course_id,
            order=lesson_data.order,
            content_type=lesson_data.content_type,
            content_url=lesson_data.content_url,
            content_text=lesson_data.content_text,
            duration=lesson_data.duration,
            is_free_preview=lesson_data.is_free_preview,
            attachments=lesson_data.attachments
        )
        
        created_lesson = await self.lesson_repository.create(lesson)
        
        # Actualizar la lista de lecciones en el curso
        if created_lesson.id not in course.lessons:
            course.lessons.append(created_lesson.id)
            
            # Actualizar la duración total del curso
            course.total_duration += created_lesson.duration
            
            await self.course_repository.update(
                lesson_data.course_id, 
                {
                    "lessons": course.lessons,
                    "total_duration": course.total_duration
                }
            )
        
        return created_lesson
    
    async def get_lesson_by_id(self, lesson_id: str) -> Optional[Lesson]:
        """
        Obtiene una lección por su ID
        
        Args:
            lesson_id: ID de la lección
        
        Returns:
            La lección encontrada o None
        """
        return await self.lesson_repository.get_by_id(lesson_id)
    
    async def get_course_lessons(self, course_id: str) -> List[Lesson]:
        """
        Obtiene todas las lecciones de un curso
        
        Args:
            course_id: ID del curso
        
        Returns:
            Lista de lecciones del curso
        """
        return await self.lesson_repository.get_by_course(course_id)
    
    async def update_lesson(
        self, 
        lesson_id: str, 
        instructor_id: str, 
        lesson_data: LessonUpdate
    ) -> Optional[Lesson]:
        """
        Actualiza la información de una lección
        
        Args:
            lesson_id: ID de la lección a actualizar
            instructor_id: ID del instructor que actualiza la lección
            lesson_data: Datos a actualizar
        
        Returns:
            La lección actualizada o None si no existe
        
        Raises:
            ValueError: Si el usuario no tiene permisos para actualizar la lección
        """
        # Verificar si la lección existe
        lesson = await self.lesson_repository.get_by_id(lesson_id)
        if not lesson:
            return None
        
        # Verificar si el curso existe
        course = await self.course_repository.get_by_id(lesson.course_id)
        if not course:
            raise ValueError("El curso no existe")
        
        # Verificar si el usuario tiene permisos para actualizar la lección
        if course.instructor_id != instructor_id:
            instructor = await self.user_repository.get_by_id(instructor_id)
            if not instructor or instructor.role != "admin":
                raise ValueError("No tienes permiso para actualizar esta lección")
        
        # Actualizar la lección
        update_data = lesson_data.dict(exclude_unset=True)
        
        # Si se actualiza la duración, actualizar también la duración total del curso
        old_duration = lesson.duration
        if "duration" in update_data and update_data["duration"] != old_duration:
            new_duration = update_data["duration"]
            course.total_duration = course.total_duration - old_duration + new_duration
            await self.course_repository.update(
                course.id, 
                {"total_duration": course.total_duration}
            )
        
        return await self.lesson_repository.update(lesson_id, update_data)
    
    async def delete_lesson(self, lesson_id: str, instructor_id: str) -> bool:
        """
        Elimina una lección
        
        Args:
            lesson_id: ID de la lección a eliminar
            instructor_id: ID del instructor que elimina la lección
        
        Returns:
            True si se eliminó correctamente, False si no
        
        Raises:
            ValueError: Si el usuario no tiene permisos para eliminar la lección
        """
        # Verificar si la lección existe
        lesson = await self.lesson_repository.get_by_id(lesson_id)
        if not lesson:
            return False
        
        # Verificar si el curso existe
        course = await self.course_repository.get_by_id(lesson.course_id)
        if not course:
            raise ValueError("El curso no existe")
        
        # Verificar si el usuario tiene permisos para eliminar la lección
        if course.instructor_id != instructor_id:
            instructor = await self.user_repository.get_by_id(instructor_id)
            if not instructor or instructor.role != "admin":
                raise ValueError("No tienes permiso para eliminar esta lección")
        
        # Actualizar la lista de lecciones en el curso y la duración total
        if lesson.id in course.lessons:
            course.lessons.remove(lesson.id)
            course.total_duration -= lesson.duration
            await self.course_repository.update(
                course.id, 
                {
                    "lessons": course.lessons,
                    "total_duration": max(0, course.total_duration)
                }
            )
        
        # Eliminar la lección
        return await self.lesson_repository.delete(lesson_id)
    
    async def reorder_lessons(
        self, 
        course_id: str, 
        instructor_id: str, 
        lesson_order: List[LessonOrderItem]
    ) -> bool:
        """
        Reordena las lecciones de un curso
        
        Args:
            course_id: ID del curso
            instructor_id: ID del instructor que reordena las lecciones
            lesson_order: Lista de elementos con ID de lección y nuevo orden
        
        Returns:
            True si se reordenó correctamente, False si no
        
        Raises:
            ValueError: Si el usuario no tiene permisos para reordenar las lecciones
        """
        # Verificar si el curso existe
        course = await self.course_repository.get_by_id(course_id)
        if not course:
            raise ValueError("El curso no existe")
        
        # Verificar si el usuario tiene permisos para reordenar las lecciones
        if course.instructor_id != instructor_id:
            instructor = await self.user_repository.get_by_id(instructor_id)
            if not instructor or instructor.role != "admin":
                raise ValueError("No tienes permiso para reordenar las lecciones de este curso")
        
        # Preparar los datos de reordenamiento
        order_data = [
            {"lesson_id": item.lesson_id, "order": item.order}
            for item in lesson_order
        ]
        
        # Reordenar las lecciones
        return await self.lesson_repository.reorder(course_id, order_data)
